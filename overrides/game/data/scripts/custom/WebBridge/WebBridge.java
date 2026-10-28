/*
 * L2 Kage website bridge for L2J Mobius (Essence).
 *
 * The website never writes game data. It queues requests in l2web.game_actions; this script, running inside the
 * game server, picks them up every few seconds and applies them with the game's own code, so the server's
 * in-memory state and the database always agree (no duplicated or lost items).
 *
 * Actions:
 *   give_item  online and room in the bag -> straight into the inventory ("You have obtained ...")
 *              otherwise                  -> in-game system mail with the item attached
 *   send_mail  always one in-game system mail with several items attached (the weekly gift box); the items
 *              column holds "itemId:count:enchant" entries joined by ";", the mail_* columns the subject and text
 *
 * Each row is claimed with an atomic UPDATE (pending -> processing) before anything is given, so a row can never be
 * delivered twice, even if the script is loaded twice after a scripts reload.
 *
 * Copied into data/scripts/custom by the container start (overrides/game), and loaded with the other scripts.
 */
package custom.WebBridge;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.l2jmobius.commons.database.DatabaseFactory;
import org.l2jmobius.commons.threads.ThreadPool;
import org.l2jmobius.gameserver.data.sql.CharInfoTable;
import org.l2jmobius.gameserver.data.xml.ItemData;
import org.l2jmobius.gameserver.entity.World;
import org.l2jmobius.gameserver.entity.actor.Player;
import org.l2jmobius.gameserver.entity.item.ItemTemplate;
import org.l2jmobius.gameserver.entity.item.enums.ItemProcessType;
import org.l2jmobius.gameserver.entity.item.instance.Item;
import org.l2jmobius.gameserver.entity.itemcontainer.Mail;
import org.l2jmobius.gameserver.managers.MailManager;
import org.l2jmobius.gameserver.network.enums.MailType;
import org.l2jmobius.gameserver.network.holders.MailMessage;

public class WebBridge
{
	private static final Logger LOGGER = Logger.getLogger(WebBridge.class.getName());

	private static final long POLL_MILLIS = 5000;

	private static final int BATCH_SIZE = 20;

	/** Non-stackable items create one item per unit; cap it so a typo can't flood a character. */
	private static final long MAX_NON_STACKABLE = 100;

	private static final String MAIL_SUBJECT = "A gift from L2 Kage";

	private static final String MAIL_TEXT = "The Kage staff sent you this item. Take it from the attachment. Good hunting!";

	private static final String TABLE_EXISTS = "SELECT 1 FROM information_schema.tables WHERE table_schema = 'l2web' AND table_name = 'game_actions'";

	/** The client shows at most 8 attachments per mail. */
	private static final int MAX_ATTACHMENTS = 8;

	private static final String SELECT_PENDING = "SELECT id, action, character_id, item_id, count, enchant, items, mail_subject, mail_text FROM l2web.game_actions WHERE status = 'pending' ORDER BY id LIMIT " + BATCH_SIZE;

	private static final String CLAIM = "UPDATE l2web.game_actions SET status = 'processing', updated_at = NOW() WHERE id = ? AND status = 'pending'";

	private static final String FINISH = "UPDATE l2web.game_actions SET status = ?, result = ?, processed_at = NOW(), updated_at = NOW() WHERE id = ?";

	// Rows still 'processing' at startup were interrupted mid-delivery (crash, restart). They are not retried
	// automatically, because the item may already have been given: a GM checks and re-sends if needed.
	private static final String FAIL_INTERRUPTED = "UPDATE l2web.game_actions SET status = 'failed', result = 'Interrupted by a game server restart; check the character before sending again.', processed_at = NOW(), updated_at = NOW() WHERE status = 'processing'";

	private record Action(long id, String action, int characterId, int itemId, long count, int enchant, String items, String mailSubject, String mailText)
	{
	}

	private record MailItem(ItemTemplate template, long count, int enchant)
	{
	}

	private record Outcome(boolean done, String message)
	{
		static Outcome done(String message)
		{
			return new Outcome(true, message);
		}

		static Outcome failed(String message)
		{
			return new Outcome(false, message);
		}
	}

	private WebBridge()
	{
		try (Connection con = DatabaseFactory.getConnection();
			PreparedStatement ps = con.prepareStatement(TABLE_EXISTS);
			ResultSet rs = ps.executeQuery())
		{
			if (!rs.next())
			{
				LOGGER.info("WebBridge: l2web.game_actions not found, website bridge disabled.");
				return;
			}

			try (PreparedStatement fail = con.prepareStatement(FAIL_INTERRUPTED))
			{
				final int interrupted = fail.executeUpdate();
				if (interrupted > 0)
				{
					LOGGER.warning("WebBridge: marked " + interrupted + " interrupted action(s) as failed.");
				}
			}
		}
		catch (SQLException e)
		{
			LOGGER.log(Level.WARNING, "WebBridge: could not reach the website database, bridge disabled.", e);
			return;
		}

		ThreadPool.scheduleAtFixedRate(this::poll, 10000, POLL_MILLIS);
		LOGGER.info("WebBridge: processing website actions every " + (POLL_MILLIS / 1000) + " seconds.");
	}

	private void poll()
	{
		try (Connection con = DatabaseFactory.getConnection())
		{
			for (Action action : pending(con))
			{
				if (!claim(con, action.id()))
				{
					continue; // Another poll already took it.
				}

				Outcome outcome;
				try
				{
					outcome = apply(action);
				}
				catch (Exception e)
				{
					LOGGER.log(Level.WARNING, "WebBridge: action " + action.id() + " failed.", e);
					outcome = Outcome.failed("Error in the game server: " + e.getMessage());
				}

				finish(con, action.id(), outcome);
				LOGGER.info("WebBridge: action " + action.id() + " " + (outcome.done() ? "done" : "failed") + ": " + outcome.message());
			}
		}
		catch (Exception e)
		{
			LOGGER.log(Level.WARNING, "WebBridge: polling failed.", e);
		}
	}

	private static List<Action> pending(Connection con) throws SQLException
	{
		final List<Action> actions = new ArrayList<>();
		try (PreparedStatement ps = con.prepareStatement(SELECT_PENDING);
			ResultSet rs = ps.executeQuery())
		{
			while (rs.next())
			{
				actions.add(new Action(rs.getLong("id"), rs.getString("action"), rs.getInt("character_id"), rs.getInt("item_id"), rs.getLong("count"), rs.getInt("enchant"), rs.getString("items"), rs.getString("mail_subject"), rs.getString("mail_text")));
			}
		}
		return actions;
	}

	private static boolean claim(Connection con, long id) throws SQLException
	{
		try (PreparedStatement ps = con.prepareStatement(CLAIM))
		{
			ps.setLong(1, id);
			return ps.executeUpdate() == 1;
		}
	}

	private static void finish(Connection con, long id, Outcome outcome) throws SQLException
	{
		try (PreparedStatement ps = con.prepareStatement(FINISH))
		{
			ps.setString(1, outcome.done() ? "done" : "failed");
			ps.setString(2, outcome.message());
			ps.setLong(3, id);
			ps.executeUpdate();
		}
	}

	private static Outcome apply(Action action)
	{
		return switch (action.action())
		{
			case "give_item" -> giveItem(action);
			case "send_mail" -> sendMail(action);
			default -> Outcome.failed("Unknown action '" + action.action() + "'.");
		};
	}

	/** One system mail with every item attached. Everything is checked before the mail is created. */
	private static Outcome sendMail(Action action)
	{
		final String characterName = CharInfoTable.getInstance().getNameById(action.characterId());
		if (characterName == null)
		{
			return Outcome.failed("Character " + action.characterId() + " does not exist.");
		}

		final List<MailItem> items = new ArrayList<>();
		for (String entry : (action.items() == null ? "" : action.items()).split(";"))
		{
			if (entry.isBlank())
			{
				continue;
			}

			final String[] parts = entry.trim().split(":");
			final int itemId;
			final long count;
			final int enchant;
			try
			{
				itemId = Integer.parseInt(parts[0]);
				count = parts.length > 1 ? Long.parseLong(parts[1]) : 1;
				enchant = parts.length > 2 ? Integer.parseInt(parts[2]) : 0;
			}
			catch (NumberFormatException e)
			{
				return Outcome.failed("Bad item entry '" + entry + "'.");
			}

			final ItemTemplate template = ItemData.getInstance().getTemplate(itemId);
			if (template == null)
			{
				return Outcome.failed("Item " + itemId + " does not exist on this server.");
			}
			if ((count < 1) || (!template.isStackable() && (count > 1)))
			{
				return Outcome.failed(template.getName() + ": a mail can carry 1 of a non-stackable item, or a stack of a stackable one.");
			}
			items.add(new MailItem(template, count, template.isEquipable() ? Math.max(0, enchant) : 0));
		}

		if (items.isEmpty() || (items.size() > MAX_ATTACHMENTS))
		{
			return Outcome.failed("A mail needs 1 to " + MAX_ATTACHMENTS + " items, got " + items.size() + ".");
		}

		final String subject = (action.mailSubject() == null) || action.mailSubject().isBlank() ? MAIL_SUBJECT : action.mailSubject();
		final String text = (action.mailText() == null) || action.mailText().isBlank() ? MAIL_TEXT : action.mailText();
		final MailMessage mail = new MailMessage(action.characterId(), subject, text, MailType.PRIME_SHOP_GIFT);
		final Mail attachments = mail.createAttachments();
		for (MailItem item : items)
		{
			if (attach(attachments, item.template().getId(), item.count(), item.enchant()) == null)
			{
				return Outcome.failed("Could not attach " + item.template().getName() + " to the mail.");
			}
		}

		MailManager.getInstance().sendMessage(mail);
		return Outcome.done("Sent '" + subject + "' with " + items.size() + " item(s) to " + characterName + " by in-game mail.");
	}

	private static Outcome giveItem(Action action)
	{
		final ItemTemplate template = ItemData.getInstance().getTemplate(action.itemId());
		if (template == null)
		{
			return Outcome.failed("Item " + action.itemId() + " does not exist on this server.");
		}

		final String characterName = CharInfoTable.getInstance().getNameById(action.characterId());
		if (characterName == null)
		{
			return Outcome.failed("Character " + action.characterId() + " does not exist.");
		}
		if (action.count() < 1)
		{
			return Outcome.failed("Count must be at least 1.");
		}
		if (!template.isStackable() && (action.count() > MAX_NON_STACKABLE))
		{
			return Outcome.failed(template.getName() + " is not stackable; send at most " + MAX_NON_STACKABLE + " at once.");
		}

		final int enchant = template.isEquipable() ? Math.max(0, action.enchant()) : 0;
		final String what = action.count() + " x " + (enchant > 0 ? "+" + enchant + " " : "") + template.getName();

		final Player player = World.getPlayer(action.characterId());
		if ((player != null) && player.isOnline() && !player.isInOfflineMode() //
			&& player.getInventory().validateCapacityByItemId(action.itemId(), action.count()) //
			&& player.getInventory().validateWeightByItemId(action.itemId(), action.count()))
		{
			final Item item = player.addItem(ItemProcessType.REWARD, action.itemId(), action.count(), enchant, null, true);
			if (item != null)
			{
				return Outcome.done("Delivered " + what + " to " + characterName + "'s inventory (online).");
			}
		}

		final MailMessage mail = new MailMessage(action.characterId(), MAIL_SUBJECT, MAIL_TEXT, MailType.PRIME_SHOP_GIFT);
		if (attach(mail.createAttachments(), action.itemId(), action.count(), enchant) == null)
		{
			return Outcome.failed("Could not attach " + what + " to a mail.");
		}

		MailManager.getInstance().sendMessage(mail);
		return Outcome.done("Sent " + what + " to " + characterName + " by in-game mail" + (player != null ? " (bag full or too heavy)." : " (offline)."));
	}

	private static Item attach(Mail attachments, int itemId, long count, int enchant)
	{
		final Item item = attachments.addItem(ItemProcessType.REWARD, itemId, count, null, null);
		if ((item != null) && (enchant > 0))
		{
			item.setEnchantLevel(enchant);
		}
		return item;
	}

	public static void main(String[] args)
	{
		new WebBridge();
	}
}
