/*
 * L2 Kage: greets premium accounts when they enter the world.
 *
 * A few seconds after login (once the PremiumManager has loaded the account's premium and the screen welcome message
 * has faded), a premium player sees Einhasad's blessing across the screen and, in the system chat, until when it lasts
 * and what it grants (the rates in config/Custom/PremiumSystem.ini). Nothing is shown when the premium system is off
 * or the account has no premium.
 *
 * Copied into data/scripts/custom by the container start (overrides/game), and loaded with the other scripts.
 */
package custom.PremiumWelcome;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

import org.l2jmobius.commons.threads.ThreadPool;
import org.l2jmobius.gameserver.config.custom.PremiumSystemConfig;
import org.l2jmobius.gameserver.entity.actor.Player;
import org.l2jmobius.gameserver.managers.PremiumManager;
import org.l2jmobius.gameserver.mechanics.events.EventType;
import org.l2jmobius.gameserver.mechanics.events.ListenerRegisterType;
import org.l2jmobius.gameserver.mechanics.events.annotations.RegisterEvent;
import org.l2jmobius.gameserver.mechanics.events.annotations.RegisterType;
import org.l2jmobius.gameserver.mechanics.events.holders.actor.player.OnPlayerLogin;
import org.l2jmobius.gameserver.mechanics.script.Script;
import org.l2jmobius.gameserver.network.serverpackets.ExShowScreenMessage;

public class PremiumWelcome extends Script
{
	/** After the login welcome message (ScreenWelcomeMessage.ini) and the PremiumManager's own login work. */
	private static final long DELAY_MS = 9000;
	private static final int SCREEN_TIME_MS = 9000;
	
	private PremiumWelcome()
	{
	}
	
	@RegisterEvent(EventType.ON_PLAYER_LOGIN)
	@RegisterType(ListenerRegisterType.GLOBAL_PLAYERS)
	public void onPlayerLogin(OnPlayerLogin event)
	{
		if (!PremiumSystemConfig.PREMIUM_SYSTEM_ENABLED)
		{
			return;
		}
		
		final Player player = event.getPlayer();
		ThreadPool.schedule(() -> greet(player), DELAY_MS);
	}
	
	private static void greet(Player player)
	{
		if ((player == null) || !player.isOnline() || !player.hasPremiumStatus())
		{
			return;
		}
		
		final String key = PremiumSystemConfig.ACCOUNT_WIDE_PREMIUM ? player.getAccountName() : player.getName();
		final long end = PremiumManager.getInstance().getPremiumExpiration(key);
		final long left = end - System.currentTimeMillis();
		if (left <= 0)
		{
			return;
		}
		
		final String until = new SimpleDateFormat("d MMM yyyy", Locale.ENGLISH).format(new Date(end));
		final long days = TimeUnit.MILLISECONDS.toDays(left);
		final String remaining = days >= 1 ? days + (days == 1 ? " more day" : " more days") : TimeUnit.MILLISECONDS.toHours(left) + " more hours";
		
		player.sendPacket(new ExShowScreenMessage("The blessing of Einhasad shines upon you, " + player.getName() + ".", ExShowScreenMessage.TOP_CENTER, SCREEN_TIME_MS, 0, true, true));
		player.sendMessage("The Goddess of Light has marked your name, " + player.getName() + ". Her blessing endures until " + until + " (" + remaining + ").");
		player.sendMessage("Under her light: " + bonuses() + ". Walk boldly, champion of Aden.");
	}
	
	/** "your experience and skill grow twice as fast, and the spoils of the hunt fall twice as rich". */
	private static String bonuses()
	{
		final List<String> parts = new ArrayList<>();
		if ((PremiumSystemConfig.PREMIUM_RATE_XP > 1) || (PremiumSystemConfig.PREMIUM_RATE_SP > 1))
		{
			parts.add("your experience and skill grow " + times(Math.max(PremiumSystemConfig.PREMIUM_RATE_XP, PremiumSystemConfig.PREMIUM_RATE_SP)) + " as fast");
		}
		if ((PremiumSystemConfig.PREMIUM_RATE_DROP_AMOUNT > 1) || (PremiumSystemConfig.PREMIUM_RATE_DROP_CHANCE > 1))
		{
			parts.add("the spoils of the hunt fall " + times(Math.max(PremiumSystemConfig.PREMIUM_RATE_DROP_AMOUNT, PremiumSystemConfig.PREMIUM_RATE_DROP_CHANCE)) + " as rich");
		}
		return parts.isEmpty() ? "fortune walks beside you" : String.join(", and ", parts);
	}
	
	private static String times(float rate)
	{
		if (rate == 2)
		{
			return "twice";
		}
		if (rate == 3)
		{
			return "thrice";
		}
		return (rate == Math.floor(rate) ? String.valueOf((int) rate) : String.valueOf(rate)) + " times";
	}
	
	public static void main(String[] args)
	{
		new PremiumWelcome();
	}
}
