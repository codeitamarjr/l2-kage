/*
 * Copyright (c) 2013 L2jMobius
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
 * IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
package handlers.chat.commands.admin;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.StringTokenizer;

import org.l2jmobius.gameserver.cache.HtmCache;
import org.l2jmobius.gameserver.data.holders.RelicDataHolder;
import org.l2jmobius.gameserver.data.xml.RelicData;
import org.l2jmobius.gameserver.entity.actor.Player;
import org.l2jmobius.gameserver.entity.actor.enums.player.RelicGrade;
import org.l2jmobius.gameserver.entity.actor.holders.player.PlayerRelicData;
import org.l2jmobius.gameserver.handler.IAdminCommandHandler;
import org.l2jmobius.gameserver.network.serverpackets.NpcHtmlMessage;
import org.l2jmobius.gameserver.network.serverpackets.relics.ExRelicsCollectionUpdate;
import org.l2jmobius.gameserver.network.serverpackets.relics.ExRelicsList;
import org.l2jmobius.gameserver.network.serverpackets.relics.ExRelicsUpdateList;

/**
 * Admin Relic Menu
 * @author CostyKiller
 */
public class AdminRelics implements IAdminCommandHandler
{
	private static final String[] ADMIN_COMMANDS =
	{
		"admin_relic_menu",
		"admin_give_relic",
		"admin_relic_page"
	};
	
	// Track current page per grade
	private static final Map<String, Integer> CURRENT_PAGES = new HashMap<>();
	
	@Override
	public boolean onCommand(String command, Player activeChar)
	{
		if ((activeChar.getTarget() == null) || !activeChar.getTarget().isPlayer())
		{
			activeChar.sendMessage("Invalid target!");
			return false;
		}
		Player target = activeChar.getTarget().asPlayer();
		
		if (command.startsWith("admin_relic_menu"))
		{
			// Reset all pages
			String playerKey = activeChar.getName();
			CURRENT_PAGES.put(playerKey + "_1", 0);
			CURRENT_PAGES.put(playerKey + "_2", 0);
			CURRENT_PAGES.put(playerKey + "_3", 0);
			CURRENT_PAGES.put(playerKey + "_4", 0);
			CURRENT_PAGES.put(playerKey + "_5", 0);
			showRelicMenu(activeChar, target);
		}
		else if (command.startsWith("admin_relic_page "))
		{
			StringTokenizer st = new StringTokenizer(command, " ");
			st.nextToken(); // skip command
			
			int grade = Integer.parseInt(st.nextToken());
			String direction = st.nextToken(); // "next" or "prev"
			
			String playerKey = activeChar.getName() + "_" + grade;
			int currentPage = CURRENT_PAGES.getOrDefault(playerKey, 0);
			
			// Get total pages for this grade (1 relic per page)
			List<RelicDataHolder> gradeRelics = getRelicsByGrade(grade);
			int maxPages = gradeRelics.size();
			
			if ("next".equals(direction) && (currentPage < (maxPages - 1)))
			{
				currentPage++;
			}
			else if ("prev".equals(direction) && (currentPage > 0))
			{
				currentPage--;
			}
			
			CURRENT_PAGES.put(playerKey, currentPage);
			showRelicMenu(activeChar, target);
		}
		else if (command.startsWith("admin_give_relic "))
		{
			// Parse the command - format: "admin_give_relic relicId count"
			StringTokenizer st = new StringTokenizer(command, " ");
			st.nextToken(); // skip command
			
			if (st.countTokens() < 2)
			{
				activeChar.sendMessage("Usage: //give_relic <relicId> <count>");
				return false;
			}
			
			int relicId = 0;
			int count = 0;
			
			try
			{
				relicId = Integer.parseInt(st.nextToken());
				count = Integer.parseInt(st.nextToken());
			}
			catch (Exception e)
			{
				activeChar.sendMessage("Error parsing command: " + e.getMessage());
				return false;
			}
			
			if ((relicId <= 0) || (count <= 0))
			{
				activeChar.sendMessage("Invalid relic ID or count!");
				return false;
			}
			
			RelicDataHolder relic = RelicData.getInstance().getRelic(relicId);
			if (relic == null)
			{
				activeChar.sendMessage("Invalid relic ID: " + relicId);
				return false;
			}
			
			// Give the relic to target
			final List<PlayerRelicData> updatedRelics = new ArrayList<>();
			Collection<PlayerRelicData> storedRelics = target.getRelics();
			
			PlayerRelicData existingRelic = null;
			for (PlayerRelicData relicData : storedRelics)
			{
				if (relicData.getRelicId() == relicId)
				{
					existingRelic = relicData;
					break;
				}
			}
			
			if (existingRelic != null)
			{
				existingRelic.setRelicCount(existingRelic.getRelicCount() + count);
				updatedRelics.add(existingRelic);
			}
			else
			{
				// The first copy registers the relic, only the rest are spare copies.
				PlayerRelicData newRelic = new PlayerRelicData(relicId, 0, count - 1, 0, 0);
				storedRelics.add(newRelic);
				updatedRelics.add(newRelic);
			}
			
			target.storeRelics();
			target.sendPacket(new ExRelicsList(target)); // Update confirmed relic list relics count.
			
			if (!updatedRelics.isEmpty())
			{
				target.sendPacket(new ExRelicsUpdateList(updatedRelics));
			}
			
			if (!target.isRelicRegistered(relicId, 0))
			{
				// Auto-Add to relic collections on summon.
				target.sendPacket(new ExRelicsCollectionUpdate(target, relicId, 0)); // Update collection list.
			}
			
			String relicName = sanitizeText(relic.getName());
			if ((relicName == null) || relicName.trim().isEmpty())
			{
				relicName = "Relic #" + relicId;
			}
			
			activeChar.sendMessage("You gave " + count + "x " + relicName + " to " + target.getName());
			if (activeChar != target)
			{
				target.sendMessage("Admin gave you " + count + "x " + relicName);
			}
			
			showRelicMenu(activeChar, target);
		}
		
		return true;
	}
	
	/**
	 * Get relics by grade (1=NOGRADE, 2=DGRADE, 3=CGRADE, 4=BGRADE, 5=AGRADE)
	 * @param grade
	 * @return
	 */
	private List<RelicDataHolder> getRelicsByGrade(int grade)
	{
		final RelicGrade relicGrade = getRelicGrade(grade);
		if (relicGrade == null)
		{
			return new ArrayList<>();
		}
		
		final List<RelicDataHolder> result = new ArrayList<>(RelicData.getInstance().getRelicsByGrade(relicGrade));
		result.sort((a, b) -> Integer.compare(a.getRelicId(), b.getRelicId()));
		return result;
	}
	
	/**
	 * Map admin menu grade index to RelicGrade enum
	 * @param grade
	 * @return
	 */
	private RelicGrade getRelicGrade(int grade)
	{
		switch (grade)
		{
			case 1:
				return RelicGrade.NOGRADE;
			case 2:
				return RelicGrade.DGRADE;
			case 3:
				return RelicGrade.CGRADE;
			case 4:
				return RelicGrade.BGRADE;
			case 5:
				return RelicGrade.AGRADE;
			default:
				return null;
		}
	}
	
	/**
	 * Generate HTML for a specific grade with pagination
	 * @param admin
	 * @param grade
	 * @return
	 */
	private String generateRelicSectionByGrade(Player admin, int grade)
	{
		StringBuilder html = new StringBuilder();
		String playerKey = admin.getName() + "_" + grade;
		int currentPage = CURRENT_PAGES.getOrDefault(playerKey, 0);
		
		// Get relics for this grade
		List<RelicDataHolder> gradeRelics = getRelicsByGrade(grade);
		
		// Pagination - 1 relic per page
		int totalPages = gradeRelics.size();
		
		// Make sure currentPage is valid
		if (currentPage >= totalPages)
		{
			currentPage = 0;
			CURRENT_PAGES.put(playerKey, 0);
		}
		
		html.append("<table width=270 bgcolor=282828 cellpadding=0 cellspacing=1>");
		
		// Header with pagination
		html.append("<tr><td colspan=3 align=center>");
		html.append("<table width=155><tr>");
		
		// Previous button
		if (currentPage > 0)
		{
			html.append("<td width=30><button value=\"<\" action=\"bypass -h admin_relic_page ").append(grade).append(" prev\" width=25 height=20 back=\"L2UI_CT1.Button_DF_Down\" fore=\"L2UI_CT1.Button_DF\"></td>");
		}
		else
		{
			html.append("<td width=30></td>");
		}
		
		// Grade name and page indicator
		html.append("<td align=center><font color=\"LEVEL\">").append(getGradeName(grade)).append(" (").append(currentPage + 1).append('/').append(totalPages).append(")</font></td>");
		
		// Next button
		if (currentPage < (totalPages - 1))
		{
			html.append("<td width=30><button value=\">\" action=\"bypass -h admin_relic_page ").append(grade).append(" next\" width=25 height=20 back=\"L2UI_CT1.Button_DF_Down\" fore=\"L2UI_CT1.Button_DF\"></td>");
		}
		else
		{
			html.append("<td width=30></td>");
		}
		
		html.append("</tr></table>");
		html.append("</td></tr>");
		
		// Display current relic (1 per page)
		if (gradeRelics.isEmpty())
		{
			html.append("<tr><td colspan=3 align=center><font color=\"FF0000\">No relics available</font></td></tr>");
		}
		else if (currentPage < gradeRelics.size())
		{
			RelicDataHolder relic = gradeRelics.get(currentPage);
			int relicId = relic.getRelicId();
			String relicName = sanitizeHtmlText(relic.getName());
			
			// Fallback to ID if name is empty
			if ((relicName == null) || relicName.trim().isEmpty())
			{
				relicName = "Relic #" + relicId;
			}
			
			html.append("<tr>");
			html.append("<td width=160 align=center><font color=\"LEVEL\">").append(relicName).append("</font></td>");
			html.append("<td width=50><edit var=\"countGrade").append(grade).append("\" width=45 height=15 type=\"number\"></td>");
			html.append("<td width=60><button value=\"Give\" action=\"bypass -h admin_give_relic ").append(relicId).append(" $countGrade").append(grade).append("\" width=55 height=20 back=\"L2UI_CT1.Button_DF_Down\" fore=\"L2UI_CT1.Button_DF\"></td>");
			html.append("</tr>");
		}
		
		html.append("</table>");
		
		return html.toString();
	}
	
	/**
	 * Show relic menu to admin
	 * @param activeChar
	 * @param target
	 */
	private void showRelicMenu(Player activeChar, Player target)
	{
		String content = HtmCache.getInstance().getHtm(activeChar, "data/html/admin/relics_menu.htm");
		
		content = content.replace("%targetName%", target.getName());
		content = content.replace("%relicSectionGrade1%", generateRelicSectionByGrade(activeChar, 1));
		content = content.replace("%relicSectionGrade2%", generateRelicSectionByGrade(activeChar, 2));
		content = content.replace("%relicSectionGrade3%", generateRelicSectionByGrade(activeChar, 3));
		content = content.replace("%relicSectionGrade4%", generateRelicSectionByGrade(activeChar, 4));
		content = content.replace("%relicSectionGrade5%", generateRelicSectionByGrade(activeChar, 5));
		
		activeChar.sendPacket(new NpcHtmlMessage(0, 1, content));
	}
	
	/**
	 * Get grade name
	 * @param grade
	 * @return
	 */
	private String getGradeName(int grade)
	{
		switch (grade)
		{
			case 1:
				return "NoGrade";
			case 2:
				return "D-Grade";
			case 3:
				return "C-Grade";
			case 4:
				return "B-Grade";
			case 5:
				return "A-Grade";
			default:
				return "Unknown Grade";
		}
	}
	
	/**
	 * Sanitize text for HTML display by removing problematic characters
	 * @param text
	 * @return
	 */
	private String sanitizeHtmlText(String text)
	{
		if ((text == null) || text.isEmpty())
		{
			return "";
		}
		
		// Replace HTML special characters
		text = text.replace("&", "&amp;");
		text = text.replace("<", "&lt;");
		text = text.replace(">", "&gt;");
		text = text.replace("\"", "&quot;");
		
		// Remove control characters and other problematic characters
		text = text.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "");
		
		// Remove zero-width spaces and other invisible characters
		text = text.replaceAll("[\u200B-\u200D\uFEFF]", "");
		
		return text.trim();
	}
	
	/**
	 * Sanitize text for console messages (no HTML encoding needed)
	 * @param text
	 * @return
	 */
	private String sanitizeText(String text)
	{
		if ((text == null) || text.isEmpty())
		{
			return "";
		}
		
		// Remove control characters and other problematic characters
		text = text.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "");
		
		// Remove zero-width spaces and other invisible characters
		text = text.replaceAll("[\u200B-\u200D\uFEFF]", "");
		
		return text.trim();
	}
	
	@Override
	public String[] getCommandList()
	{
		return ADMIN_COMMANDS;
	}
}