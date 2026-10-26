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
package org.l2jmobius.gameserver.network.clientpackets.relics;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.l2jmobius.commons.util.Rnd;
import org.l2jmobius.gameserver.config.RelicSystemConfig;
import org.l2jmobius.gameserver.data.holders.RelicDataHolder;
import org.l2jmobius.gameserver.data.xml.RelicData;
import org.l2jmobius.gameserver.data.xml.SkillData;
import org.l2jmobius.gameserver.entity.actor.Player;
import org.l2jmobius.gameserver.entity.actor.holders.player.PlayerRelicData;
import org.l2jmobius.gameserver.entity.item.enums.ItemProcessType;
import org.l2jmobius.gameserver.entity.item.holders.ItemHolder;
import org.l2jmobius.gameserver.mechanics.skill.Skill;
import org.l2jmobius.gameserver.mechanics.variables.PlayerVariables;
import org.l2jmobius.gameserver.network.SystemMessageId;
import org.l2jmobius.gameserver.network.clientpackets.ClientPacket;
import org.l2jmobius.gameserver.network.serverpackets.SystemMessage;
import org.l2jmobius.gameserver.network.serverpackets.relics.ExRelicsActiveInfo;
import org.l2jmobius.gameserver.network.serverpackets.relics.ExRelicsCollectionUpdate;
import org.l2jmobius.gameserver.network.serverpackets.relics.ExRelicsExchangeList;
import org.l2jmobius.gameserver.network.serverpackets.relics.ExRelicsList;
import org.l2jmobius.gameserver.network.serverpackets.relics.ExRelicsUpdateList;
import org.l2jmobius.gameserver.network.serverpackets.relics.ExRelicsUpgrade;

/**
 * @author CostyKiller, Brado
 */
public class RequestRelicsUpgrade extends ClientPacket
{
	private int _relicId;
	private int _relicLevel;
	private final List<Integer> _ingredients = new ArrayList<>();
	private int _chance = 0;
	
	@Override
	protected void readImpl()
	{
		_relicId = readInt();
		_relicLevel = readInt();
		
		final int ingredientCount = readInt();
		if ((ingredientCount < 1) || (ingredientCount > 4))
		{
			return;
		}
		
		for (int i = 0; i < ingredientCount; i++)
		{
			_ingredients.add(readInt());
		}
		
		_chance = RelicData.getInstance().getEnchantRateByIngredientCount(ingredientCount);
	}
	
	@Override
	protected void runImpl()
	{
		final Player player = getPlayer();
		if (player == null)
		{
			return;
		}
		
		final RelicDataHolder relicHolder = RelicData.getInstance().getRelic(_relicId);
		if (relicHolder == null)
		{
			return;
		}
		
		if (_ingredients.isEmpty())
		{
			return;
		}
		
		final Collection<PlayerRelicData> storedRelics = player.getRelics();
		final PlayerRelicData existingRelic = storedRelics.stream().filter(relic -> (relic.getRelicId() == _relicId) && (relic.getRelicIndex() < 300)).findFirst().orElse(null);
		if ((existingRelic == null) || (existingRelic.getRelicLevel() != _relicLevel) || (existingRelic.getRelicLevel() >= 4))
		{
			return;
		}
		
		final Map<PlayerRelicData, Integer> ingredientCounts = new HashMap<>();
		for (int ingredientId : _ingredients)
		{
			final RelicDataHolder ingredientHolder = RelicData.getInstance().getRelic(ingredientId);
			if ((ingredientHolder == null) || (ingredientHolder.getGrade() != relicHolder.getGrade()))
			{
				return;
			}
			
			final PlayerRelicData ingredientRelic = storedRelics.stream().filter(relic -> (relic.getRelicId() == ingredientId) && (relic.getRelicIndex() < 300)).findFirst().orElse(null);
			if (ingredientRelic == null)
			{
				return;
			}
			
			ingredientCounts.merge(ingredientRelic, 1, Integer::sum);
		}
		
		// Only spare copies can be used, the registered copy stays.
		for (Entry<PlayerRelicData, Integer> entry : ingredientCounts.entrySet())
		{
			if (entry.getKey().getRelicCount() < entry.getValue())
			{
				return;
			}
		}
		
		final ItemHolder itemFee = RelicData.getInstance().getEnchantFee(relicHolder.getGrade());
		if (itemFee == null)
		{
			player.sendMessage("No enchant fee configured for grade: " + relicHolder.getGrade());
			return;
		}
		if (!player.destroyItemByItemId(ItemProcessType.FEE, itemFee.getId(), itemFee.getCount(), player, true))
		{
			player.sendPacket(new SystemMessage(SystemMessageId.NOT_ENOUGH_ADENA));
			return;
		}
		
		final boolean success = Rnd.get(100) < _chance;
		
		// Increment the level of the existing relic if successful upgrade.
		existingRelic.setRelicLevel(success ? existingRelic.getRelicLevel() + 1 : existingRelic.getRelicLevel());
		_relicLevel = existingRelic.getRelicLevel();
		if (RelicSystemConfig.RELIC_SYSTEM_DEBUG_ENABLED)
		{
			player.sendMessage("Relic Id: " + existingRelic.getRelicId() + " " + (success ? "Upgrade successful! Relic is now level: " : "Upgrade failed! Relic is still level: ") + _relicLevel);
		}
		
		player.sendPacket(new ExRelicsUpdateList(1, existingRelic.getRelicId(), existingRelic.getRelicLevel(), existingRelic.getRelicCount())); // Update confirmed relic list with new relic.
		if (!player.isRelicRegistered(existingRelic.getRelicId(), existingRelic.getRelicLevel()))
		{
			// Auto-Add to relic collections on summon.
			player.sendPacket(new ExRelicsCollectionUpdate(player, existingRelic.getRelicId(), existingRelic.getRelicLevel())); // Update collection list.
		}
		
		// Check relic ingredients.
		for (int ingredient : _ingredients)
		{
			PlayerRelicData ingredientRelic = null;
			for (PlayerRelicData relic : storedRelics)
			{
				if ((relic.getRelicId() == ingredient) && (relic.getRelicIndex() < 300))
				{
					ingredientRelic = relic;
					break;
				}
			}
			
			if ((ingredientRelic != null) && (ingredientRelic.getRelicCount() > 0))
			{
				ingredientRelic.setRelicCount(ingredientRelic.getRelicCount() - 1);
				if (RelicSystemConfig.RELIC_SYSTEM_DEBUG_ENABLED)
				{
					player.sendMessage("Ingredient Relic data updated, ID: " + ingredientRelic.getRelicId() + ", Count: " + ingredientRelic.getRelicCount());
				}
			}
		}
		
		// Store relics.
		player.storeRelics();
		
		// If the enchanted relic is the currently active one and enchant succeeded,
		// immediately update the active skill to the new level without requiring reactivation.
		if (success && (player.getVariables().getInt(PlayerVariables.ACTIVE_RELIC, 0) == _relicId))
		{
			final int skillId = RelicData.getInstance().getRelicSkillId(_relicId, 0);
			final int skillLevel = _relicLevel + 1;
			final Skill newSkill = SkillData.getInstance().getSkill(skillId, skillLevel);
			if (newSkill != null)
			{
				// Remove all relic active skills first.
				for (RelicDataHolder relic : RelicData.getInstance().getRelics())
				{
					final Skill existing = player.getKnownSkill(relic.getEnchantHolderByEnchant(0).getSkillId());
					if (existing != null)
					{
						player.removeSkill(existing);
					}
				}
				player.addSkill(newSkill, true);
				player.sendPacket(new ExRelicsActiveInfo(_relicId, _relicLevel));
				if (RelicSystemConfig.RELIC_SYSTEM_DEBUG_ENABLED)
				{
					player.sendMessage("Active relic skill updated: Id=" + skillId + " Lvl=" + skillLevel);
				}
			}
		}
		player.sendPacket(new ExRelicsList(player)); // Update confirmed relic list relics count.
		player.sendPacket(new ExRelicsExchangeList(player)); // Update relic exchange/confirm list.
		player.sendPacket(new ExRelicsUpgrade(success, _relicId, _relicLevel));
	}
}