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
 *   send_mail  in-game system mail with several items attached (the weekly gift box); the items column holds
 *              "itemId:count:enchant" entries joined by ";", the mail_* columns the subject and text. More than 8
 *              items (a class package) go out as several mails, "Subject (1/2)", "Subject (2/2)"
 *   buy_pass   the Kage Pass and the class packages: takes item_id x count (the L-Coin price) from the character's
 *              bag, then sends the mail(s) like send_mail; nothing is taken or sent when the character doesn't have
 *              enough
 *   add_premium     premium account time (config/Custom/PremiumSystem.ini): count = days, character_name = the account
 *                   login; an online account gets it at once, an offline one in the database for its next login
 *   remove_premium  ends an account's premium (character_name = the account login)
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
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;
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
import org.l2jmobius.gameserver.config.custom.PremiumSystemConfig;
import org.l2jmobius.gameserver.managers.MailManager;
import org.l2jmobius.gameserver.managers.PremiumManager;
import org.l2jmobius.gameserver.network.enums.MailType;
import org.l2jmobius.gameserver.network.serverpackets.ExShowScreenMessage;
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
	/** Up to this many items per action; more than MAX_ATTACHMENTS go out as several mails (a class package). */
	private static final int MAX_ITEMS = 4 * MAX_ATTACHMENTS;

	private static final String SELECT_PENDING = "SELECT id, action, character_id, character_name, item_id, count, enchant, items, mail_subject, mail_text FROM l2web.game_actions WHERE status = 'pending' ORDER BY id LIMIT " + BATCH_SIZE;

	private static final String CLAIM = "UPDATE l2web.game_actions SET status = 'processing', updated_at = NOW() WHERE id = ? AND status = 'pending'";

	// A bag's stacks of an item (an offline character's inventory, for the Kage Pass price), locked until committed.
	private static final String SELECT_PREMIUM = "SELECT enddate FROM account_premium WHERE account_name = ?";
	private static final String REPLACE_PREMIUM = "REPLACE INTO account_premium (account_name, enddate) VALUES (?, ?)";
	private static final String ACCOUNT_EXISTS = "SELECT 1 FROM accounts WHERE login = ?";
	/** At most this many premium days in one action (ten years). */
	private static final int MAX_PREMIUM_DAYS = 3650;
	private static final String SELECT_BAG_ITEM = "SELECT object_id, count FROM items WHERE owner_id = ? AND item_id = ? AND loc = 'INVENTORY' ORDER BY count FOR UPDATE";
	
	private static final String UPDATE_BAG_ITEM = "UPDATE items SET count = ? WHERE object_id = ?";
	
	private static final String DELETE_BAG_ITEM = "DELETE FROM items WHERE object_id = ?";
	
	private static final String FINISH = "UPDATE l2web.game_actions SET status = ?, result = ?, processed_at = NOW(), updated_at = NOW() WHERE id = ?";

	// Rows still 'processing' at startup were interrupted mid-delivery (crash, restart). They are not retried
	// automatically, because the item may already have been given: a GM checks and re-sends if needed.
	private static final String FAIL_INTERRUPTED = "UPDATE l2web.game_actions SET status = 'failed', result = 'Interrupted by a game server restart; check the character before sending again.', processed_at = NOW(), updated_at = NOW() WHERE status = 'processing'";

	private record Action(long id, String action, int characterId, String characterName, int itemId, long count, int enchant, String items, String mailSubject, String mailText)
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
				actions.add(new Action(rs.getLong("id"), rs.getString("action"), rs.getInt("character_id"), rs.getString("character_name"), rs.getInt("item_id"), rs.getLong("count"), rs.getInt("enchant"), rs.getString("items"), rs.getString("mail_subject"), rs.getString("mail_text")));
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
			case "buy_pass" -> buyPass(action);
			case "add_premium" -> addPremium(action);
			case "remove_premium" -> removePremium(action);
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
		final String problem = parseItems(action.items(), items);
		if (problem != null)
		{
			return Outcome.failed(problem);
		}
		
		return mail(action, characterName, items);
	}
	
	/**
	 * The Kage Pass: checks the rewards, takes the price (item_id x count) from the character's bag, then mails the
	 * rewards. An online character pays through its inventory; an offline one in the database, where its bag lives
	 * while it is not in the world.
	 */
	private static Outcome buyPass(Action action)
	{
		final String characterName = CharInfoTable.getInstance().getNameById(action.characterId());
		if (characterName == null)
		{
			return Outcome.failed("Character " + action.characterId() + " does not exist.");
		}
		
		final ItemTemplate price = ItemData.getInstance().getTemplate(action.itemId());
		if ((price == null) || (action.count() < 1))
		{
			return Outcome.failed("Bad price: item " + action.itemId() + " x " + action.count() + ".");
		}
		
		final List<MailItem> items = new ArrayList<>();
		final String problem = parseItems(action.items(), items);
		if (problem != null)
		{
			return Outcome.failed(problem);
		}
		
		final String cost = action.count() + " " + price.getName();
		final Player player = World.getPlayer(action.characterId());
		if (player != null)
		{
			if (player.getInventory().getInventoryItemCount(action.itemId(), -1) < action.count())
			{
				return Outcome.failed(characterName + " does not have " + cost + ".");
			}
			if (!player.destroyItemByItemId(ItemProcessType.FEE, action.itemId(), action.count(), null, true))
			{
				return Outcome.failed("Could not take " + cost + " from " + characterName + ".");
			}
		}
		else
		{
			final String charged = takeFromOfflineBag(action.characterId(), action.itemId(), action.count());
			if (charged != null)
			{
				return Outcome.failed(characterName + " " + charged + " (" + cost + ").");
			}
		}
		
		final Outcome sent = mail(action, characterName, items);
		return sent.done() ? Outcome.done("Took " + cost + " from " + characterName + ". " + sent.message()) : sent;
	}
	
	/**
	 * Takes count of an item from an offline character's bag in the database, in one locked transaction.
	 * Returns null when done, or why it could not.
	 */
	private static String takeFromOfflineBag(int characterId, int itemId, long count)
	{
		try (Connection con = DatabaseFactory.getConnection())
		{
			con.setAutoCommit(false);
			try
			{
				final List<long[]> stacks = new ArrayList<>(); // object id, count
				long total = 0;
				try (PreparedStatement ps = con.prepareStatement(SELECT_BAG_ITEM))
				{
					ps.setInt(1, characterId);
					ps.setInt(2, itemId);
					try (ResultSet rs = ps.executeQuery())
					{
						while (rs.next())
						{
							stacks.add(new long[]
							{
								rs.getLong("object_id"),
								rs.getLong("count")
							});
							total += rs.getLong("count");
						}
					}
				}
				
				if (total < count)
				{
					con.rollback();
					return "does not have enough in the bag";
				}
				
				long left = count;
				for (long[] stack : stacks)
				{
					if (left == 0)
					{
						break;
					}
					
					final long take = Math.min(left, stack[1]);
					try (PreparedStatement ps = con.prepareStatement(take == stack[1] ? DELETE_BAG_ITEM : UPDATE_BAG_ITEM))
					{
						if (take == stack[1])
						{
							ps.setLong(1, stack[0]);
						}
						else
						{
							ps.setLong(1, stack[1] - take);
							ps.setLong(2, stack[0]);
						}
						ps.executeUpdate();
					}
					left -= take;
				}
				
				// The character may have logged in meanwhile: then its bag is in memory, so don't touch the database.
				if (World.getPlayer(characterId) != null)
				{
					con.rollback();
					return "logged in while paying, try again";
				}
				
				con.commit();
				return null;
			}
			catch (SQLException e)
			{
				con.rollback();
				throw e;
			}
		}
		catch (SQLException e)
		{
			LOGGER.log(Level.WARNING, "WebBridge: could not take item " + itemId + " from character " + characterId + ".", e);
			return "could not be charged (database error)";
		}
	}
	
	/** Reads "itemId:count:enchant" entries joined by ";" into items. Returns null when valid, or what is wrong. */
	private static String parseItems(String raw, List<MailItem> items)
	{
		for (String entry : (raw == null ? "" : raw).split(";"))
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
				return "Bad item entry '" + entry + "'.";
			}
			
			final ItemTemplate template = ItemData.getInstance().getTemplate(itemId);
			if (template == null)
			{
				return "Item " + itemId + " does not exist on this server.";
			}
			if ((count < 1) || (!template.isStackable() && (count > 1)))
			{
				return template.getName() + ": a mail can carry 1 of a non-stackable item, or a stack of a stackable one.";
			}
			items.add(new MailItem(template, count, template.isEquipable() ? Math.max(0, enchant) : 0));
		}
		
		if (items.isEmpty() || (items.size() > MAX_ITEMS))
		{
			return "An action needs 1 to " + MAX_ITEMS + " items, got " + items.size() + ".";
		}
		return null;
	}
	
	private static Outcome mail(Action action, String characterName, List<MailItem> items)
	{
		final String subject = (action.mailSubject() == null) || action.mailSubject().isBlank() ? MAIL_SUBJECT : action.mailSubject();
		final String text = (action.mailText() == null) || action.mailText().isBlank() ? MAIL_TEXT : action.mailText();
		// More items than one mail holds go out as several mails: "Subject (1/2)", "Subject (2/2)".
		final int mails = (items.size() + MAX_ATTACHMENTS - 1) / MAX_ATTACHMENTS;
		for (int part = 0; part < mails; part++)
		{
			final String partSubject = mails > 1 ? subject + " (" + (part + 1) + "/" + mails + ")" : subject;
			final MailMessage mail = new MailMessage(action.characterId(), partSubject, text, MailType.PRIME_SHOP_GIFT);
			final Mail attachments = mail.createAttachments();
			for (MailItem item : items.subList(part * MAX_ATTACHMENTS, Math.min(items.size(), (part + 1) * MAX_ATTACHMENTS)))
			{
				if (attach(attachments, item.template().getId(), item.count(), item.enchant()) == null)
				{
					return Outcome.failed("Could not attach " + item.template().getName() + " to the mail.");
				}
			}

			MailManager.getInstance().sendMessage(mail);
		}
		return Outcome.done("Sent '" + subject + "' with " + items.size() + " item(s) in " + mails + " mail(s) to " + characterName + " by in-game mail.");
	}
	
	/**
	 * Adds days of premium to an account, from its current end date (or from now when it has none or it ended). Online,
	 * the game's PremiumManager applies it at once (its cache was loaded at login); offline, the end date is written
	 * to the database, where the next login reads it.
	 */
	private static Outcome addPremium(Action action)
	{
		if (!PremiumSystemConfig.PREMIUM_SYSTEM_ENABLED)
		{
			return Outcome.failed("The premium system is off (config/Custom/PremiumSystem.ini, EnablePremiumSystem).");
		}
		
		final String account = action.characterName().toLowerCase();
		final int days = (int) action.count();
		if ((days < 1) || (days > MAX_PREMIUM_DAYS))
		{
			return Outcome.failed("Premium days must be 1 to " + MAX_PREMIUM_DAYS + ", got " + action.count() + ".");
		}
		
		try (Connection con = DatabaseFactory.getConnection())
		{
			try (PreparedStatement ps = con.prepareStatement(ACCOUNT_EXISTS))
			{
				ps.setString(1, account);
				try (ResultSet rs = ps.executeQuery())
				{
					if (!rs.next())
					{
						return Outcome.failed("Account " + account + " does not exist.");
					}
				}
			}
			
			if (isOnline(account))
			{
				PremiumManager.getInstance().addPremiumTime(account, days, TimeUnit.DAYS);
				blessOnline(account, days);
				return Outcome.done("Added " + days + " premium day(s) to " + account + " (online, active now), until " + new Date(PremiumManager.getInstance().getPremiumExpiration(account)) + ".");
			}
			
			long current = 0;
			try (PreparedStatement ps = con.prepareStatement(SELECT_PREMIUM))
			{
				ps.setString(1, account);
				try (ResultSet rs = ps.executeQuery())
				{
					if (rs.next())
					{
						current = rs.getLong(1);
					}
				}
			}
			
			final long end = Math.max(System.currentTimeMillis(), current) + TimeUnit.DAYS.toMillis(days);
			try (PreparedStatement ps = con.prepareStatement(REPLACE_PREMIUM))
			{
				ps.setString(1, account);
				ps.setLong(2, end);
				ps.execute();
			}
			return Outcome.done("Added " + days + " premium day(s) to " + account + " (offline, active from its next login), until " + new Date(end) + ".");
		}
		catch (SQLException e)
		{
			LOGGER.log(Level.WARNING, "WebBridge: could not add premium to " + account + ".", e);
			return Outcome.failed("Could not add premium (database error).");
		}
	}
	
	/** Ends an account's premium: online it loses the bonuses at once; the database row is deleted either way. */
	private static Outcome removePremium(Action action)
	{
		final String account = action.characterName().toLowerCase();
		PremiumManager.getInstance().removePremiumStatus(account, true);
		return Outcome.done("Removed premium from " + account + ".");
	}
	
	/** Tells an online account's player, in the lore's words, that premium has just been granted. */
	private static void blessOnline(String account, int days)
	{
		for (Player player : World.getPlayers())
		{
			if (account.equalsIgnoreCase(player.getAccountName()))
			{
				player.sendPacket(new ExShowScreenMessage("The blessing of Einhasad descends upon you!", ExShowScreenMessage.TOP_CENTER, 8000, 0, true, true));
				player.sendMessage("The Goddess of Light has heard of your deeds, " + player.getName() + ". Her blessing is yours for " + days + (days == 1 ? " more day." : " more days."));
				return;
			}
		}
	}
	
	private static boolean isOnline(String account)
	{
		for (Player player : World.getPlayers())
		{
			if (account.equalsIgnoreCase(player.getAccountName()))
			{
				return true;
			}
		}
		return false;
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
			// The attachment was stored at +0 when it was added; save the enchant so a restart before it's received keeps it.
			item.updateDatabase();
		}
		return item;
	}

	public static void main(String[] args)
	{
		new WebBridge();
	}
}
