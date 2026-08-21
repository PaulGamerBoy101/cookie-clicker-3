/**
 * systems/santa.ts — the engine's Santa evolution system (Phase 6, slice 3).
 *
 * The 2.048 engine defined `Game.santaLevels` (the evolution tier names),
 * `Game.UpgradeSanta` and `Game.ClickSpecialPic` inside `Game.Init`. They
 * are now typed exports; the engine keeps the same `Game.X = X` slots at
 * the exact original Init positions.
 *
 * Bodies are verbatim (original indentation kept); only parameter
 * annotations were added (`:any` where call sites pass optional or
 * heterogeneous values).
 *
 * Runtime imports: `shuffle` comes from ../utils/helpers (the only non-global
 * dependency). `Game`, `loc`, `choose`, `PlaySound`, `l`, `TopBarOffset`,
 * `triggerAnim` resolve through src/globals.d.ts.
 */

import { shuffle } from "../utils/helpers";

export const santaLevels = ['Festive test tube','Festive ornament','Festive wreath','Festive tree','Festive present','Festive elf fetus','Elf toddler','Elfling','Young elf','Bulky elf','Nick','Santa Claus','Elder Santa','True Santa','Final Claus'];

export function UpgradeSanta()
{
	var moni=Math.pow(Game.santaLevel+1,Game.santaLevel+1);
	if (Game.cookies>moni && Game.santaLevel<14)
	{
		PlaySound('snd/shimmerClick.mp3');
		
		Game.Spend(moni);
		Game.santaLevel=(Game.santaLevel+1)%15;
		if (Game.santaLevel==14)
		{
			Game.Unlock('Santa\'s dominion');
			Game.Notify(loc("You are granted %1.",Game.Upgrades['Santa\'s dominion'].dname),'',Game.Upgrades['Santa\'s dominion'].icon);
		}
		var drops=[];
		for (var i in Game.santaDrops) {if (!Game.HasUnlocked(Game.santaDrops[i])) drops.push(Game.santaDrops[i]);}
		var drop=choose(drops);
		if (drop)
		{
			Game.Unlock(drop);
			Game.Notify(loc("Found a present!"),loc("You find a present which contains...")+'<br><b>'+Game.Upgrades[drop].dname+'</b>!',Game.Upgrades[drop].icon);
		}
		
		Game.ToggleSpecialMenu(1);
		
		if (l('specialPic')){var rect=l('specialPic').getBounds();Game.SparkleAt((rect.left+rect.right)/2,(rect.top+rect.bottom)/2)+32-TopBarOffset;}
		
		if (Game.santaLevel>=6) Game.Win('Coming to town');
		if (Game.santaLevel>=14) Game.Win('All hail Santa');
		Game.recalculateGains=1;
		Game.upgradesToRebuild=1;
	}
}

export function ClickSpecialPic()
{
	if (Game.specialTab=='dragon' && Game.dragonLevel>=4 && Game.Has('Pet the dragon') && l('specialPic'))
	{
		triggerAnim(l('specialPic'),'pucker');
		PlaySound('snd/click'+Math.floor(Math.random()*7+1)+'.mp3',0.5);
		if (Date.now()-Game.lastClickedSpecialPic>2000) PlaySound('snd/growl.mp3');
		//else if (Math.random()<0.5) PlaySound('snd/growl.mp3',0.5+Math.random()*0.2);
		Game.lastClickedSpecialPic=Date.now();
		if (Game.prefs.particles)
		{
			Game.particleAdd(Game.mouseX,Game.mouseY-32,Math.random()*4-2,Math.random()*-2-4,Math.random()*0.2+0.5,1,2,[20,3]);
		}
		if (Game.dragonLevel>=8 && Math.random()<1/20)
		{
			Math.seedrandom(Game.seed+'/dragonTime');
			var drops=['Dragon scale','Dragon claw','Dragon fang','Dragon teddy bear'];
			drops=shuffle(drops);
			var drop=drops[Math.floor((new Date().getMinutes()/60)*drops.length)];
			if (!Game.Has(drop) && !Game.HasUnlocked(drop))
			{
				Game.Unlock(drop);
				Game.Notify(drop,'<b>'+loc("Your dragon dropped something!")+'</b>',Game.Upgrades[drop].icon);
			}
			Math.seedrandom();
		}
	}
}
