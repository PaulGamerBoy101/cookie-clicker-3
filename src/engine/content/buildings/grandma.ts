/**
 * content/buildings/grandma.ts — the Grandma building declaration.
 *
 * Split from content/buildings.ts (pure move — same new Game.Object call,
 * same order position, same closures; only the file changed). Includes the
 * SpecialGrandmaUnlock/SpecialCatUnlock thresholds and the custom
 * sellFunction (wrath/pledge) + iconFunc (wrath icons) that follow the
 * declaration.
 */
import type { Building, Game as EngineGame } from "../../types";

/** Declare the Grandma building on Game. */
export function declareGrandma(Game: EngineGame) {
		Game.SpecialGrandmaUnlock=15;
		Game.SpecialCatUnlock=15;
		new Game.Object('Grandma','grandma|grandmas|baked|Grandmas are [X] year older|Grandmas are [X] years older','A nice grandma to bake more cookies.',1,1,{pic: function (_i: string) {
			var list=['grandma'];
			if (Game.Has('Farmer grandmas')) list.push('farmerGrandma');
			if (Game.Has('Worker grandmas')) list.push('workerGrandma');
			if (Game.Has('Miner grandmas')) list.push('minerGrandma');
			if (Game.Has('Cosmic grandmas')) list.push('cosmicGrandma');
			if (Game.Has('Transmuted grandmas')) list.push('transmutedGrandma');
			if (Game.Has('Altered grandmas')) list.push('alteredGrandma');
			if (Game.Has('Grandmas\' grandmas')) list.push('grandmasGrandma');
			if (Game.Has('Antigrandmas')) list.push('antiGrandma');
			if (Game.Has('Rainbow grandmas')) list.push('rainbowGrandma');
			if (Game.Has('Banker grandmas')) list.push('bankGrandma');
			if (Game.Has('Priestess grandmas')) list.push('templeGrandma');
			if (Game.Has('Witch grandmas')) list.push('witchGrandma');
			if (Game.Has('Lucky grandmas')) list.push('luckyGrandma');
			if (Game.Has('Metagrandmas')) list.push('metaGrandma');
			if (Game.Has('Script grannies')) list.push('scriptGrandma');
			if (Game.Has('Alternate grandmas')) list.push('alternateGrandma');
			if (Game.Has('Brainy grandmas')) list.push('brainyGrandma');
			if (Game.season=='christmas') list.push('elfGrandma');
			if (Game.season=='easter') list.push('bunnyGrandma');
			return choose(list)+'.webp';
		},bg:'grandmaBackground.webp',xV:8,yV:8,w:32,rows:3,x:0,y:16},100,function (me: Building) {
			var mult=1;
			for (var i in Game.GrandmaSynergies)
			{
				if (Game.Has(Game.GrandmaSynergies[i])) mult*=2;
			}
			if (Game.Has('Bingo center/Research facility')) mult*=4;
			if (Game.Has('Ritual rolling pins')) mult*=2;
			if (Game.Has('Naughty list')) mult*=2;
			
			if (Game.Has('Elderwort biscuits')) mult*=1.02;
			
			mult*=Game.eff('grandmaCps');
			
			if (Game.Has('Cat ladies'))
			{
				for (var j=0;j<Game.UpgradesByPool['kitten'].length;j++)
				{
					if (Game.Has(Game.UpgradesByPool['kitten'][j].name)) mult*=1.29;
				}
			}
			
			mult*=Game.GetTieredCpsMult(me);
			
			var add=0;
			if (Game.Has('One mind')) add+=Game.Objects['Grandma'].amount*0.02;
			if (Game.Has('Communal brainsweep')) add+=Game.Objects['Grandma'].amount*0.02;
			if (Game.Has('Elder Pact')) add+=Game.Objects['Portal'].amount*0.05;
			
			var num=0;
			for (var i in Game.Objects) {if (Game.Objects[i].name!='Grandma') num+=Game.Objects[i].amount;}
			//if (Game.hasAura('Elder Battalion')) mult*=1+0.01*num;
			mult*=1+Game.auraMult('Elder Battalion')*0.01*num;
			
			mult*=Game.magicCpS(me.name);
			// Grandma's Sitting Room minigame rewards (REPEATABLE stacks bought
			// with Yarn, stored in minigameGrandmaSittingRoom.ts M.upgradeStacks).
			// Additive upgrades add per-grandma CpS per stack (grandmaAdd);
			// multiplicative upgrades apply their per-stack multiplier
			// (grandmaMult). effectiveStacks covers the minigame-not-loaded-yet
			// boot window (it falls back to the main-save bought flag, which the
			// first stack always sets), so the fallback below only matters if
			// the script never loaded.
			var sittingRoomMG=Game.Objects['Grandma']&&Game.Objects['Grandma'].minigame;
			var yarnStacks=function (name: any){
				if (sittingRoomMG&&sittingRoomMG.effectiveStacks) return sittingRoomMG.effectiveStacks(name);
				return Game.Has(name)?1:0;
			};
			var grandmaAdd=0;
			var grandmaAddUpgrades=['Lap blanket weaving','Rocking chair maintenance','Elder shawl','The Grandmother Tree'];
			for (var ga=0;ga<grandmaAddUpgrades.length;ga++)
			{
				var gu=Game.Upgrades[grandmaAddUpgrades[ga]];
				if (gu && gu.grandmaAdd)
				{
					var gaCount=yarnStacks(grandmaAddUpgrades[ga]);
					if (gaCount>0) grandmaAdd+=gu.grandmaAdd*gaCount;
				}
			}
			var grandmaMult=1;
			var grandmaMultUpgrades=['Tea leaf cultivation','Chamomile incense'];
			for (var gm=0;gm<grandmaMultUpgrades.length;gm++)
			{
				grandmaMult*=Math.pow(1.02,yarnStacks(grandmaMultUpgrades[gm]));
			}
			
			return (me.baseCps+add+grandmaAdd)*mult*grandmaMult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialCatUnlock && Game.Objects['Cats'].amount>0 && this.cat) Game.Unlock(this.cat!.name);
		});
		Game.last.sellFunction=function()
		{
			Game.Win('Just wrong');
			if (this.amount==0)
			{
				Game.Lock('Elder Pledge');
				Game.CollectWrinklers();
				Game.pledgeT=0;
			}
		};
		Game.last.iconFunc=function (type: string) {
			var grandmaIcons=[[0,1],[0,2],[1,2],[2,2]];
			if (type=='off') return [0,1];
			if (Game.prefs.notScary && Game.elderWrath>0) return [3,2];
			return grandmaIcons[Game.elderWrath];
		};
		// Grandma's Sitting Room minigame (CC3): same wiring as the Cats
		// building (minigameCatColony.ts) — the engine's LoadMinigames loads
		// this chunk when Grandma is leveled to 1, then calls M.launch.
		Game.last.minigameUrl='minigameGrandmaSittingRoom.js';
		Game.last.minigameName=loc("Sitting Room");
}
