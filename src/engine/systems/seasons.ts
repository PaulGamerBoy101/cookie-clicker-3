/**
 * systems/seasons.ts — the engine's seasonal-event system (Phase 6, slice 3).
 *
 * The 2.048 engine defined the season trigger-upgrade wiring
 * (`Game.computeSeasons`, `Game.computeSeasonPrices`, the season-switch-uses
 * text helper `Game.saySeasonSwitchUses`, `Game.getSeasonDuration`) and the
 * seasonal drop counters (`Game.GetHowManyHalloweenDrops`,
 * `Game.GetHowManyHeartDrops`, `Game.GetHowManyEggs`, `Game.DropEgg`,
 * `Game.GetHowManySantaDrops`, `Game.GetHowManyReindeerDrops`) inside
 * `Game.Init`. They are now typed exports; the engine keeps the same
 * `Game.X = X` slots at the exact original Init positions, and keeps the
 * state-init statements between them (`Game.computeSeasons()` call, the
 * `Game.seasons` data from content/upgrades.ts).
 *
 * Bodies are verbatim (original indentation kept); only parameter
 * annotations were added (`:any` where call sites pass optional or
 * heterogeneous values).
 *
 * Runtime imports: none — `Game`, `EN`, `loc`, `choose`, `PlaySound`
 * resolve through src/globals.d.ts.
 */

export function GetHowManyHalloweenDrops()
{
	var num=0;
	for (var i in Game.halloweenDrops) {if (Game.Has(Game.halloweenDrops[i])) num++;}
	return num;
}
/*for (var i in Game.halloweenDrops)
{
	Game.Upgrades[Game.halloweenDrops[i]].descFunc=function(){return '<div style="text-align:center;">You currently own <b>'+Game.GetHowManyHalloweenDrops()+'/'+Game.halloweenDrops.length+'</b> halloween cookies.</div><div class="line"></div>'+this.ddesc;};
}*/
export function GetHowManyHeartDrops()
{
	var num=0;
	for (var i in Game.heartDrops) {if (Game.Has(Game.heartDrops[i])) num++;}
	return num;
}
export function GetHowManyEggs()
{
	var num=0;
	for (var i in Game.easterEggs) {if (Game.Has(Game.easterEggs[i])) num++;}
	return num;
}
export function DropEgg(failRate: any)
{
	failRate*=1/Game.dropRateMult();
	if (Game.season!='easter') return;
	if (Game.HasAchiev('Hide & seek champion')) failRate*=0.7;
	if (Game.Has('Omelette')) failRate*=0.9;
	if (Game.Has('Starspawn')) failRate*=0.9;
	if (Game.hasGod)
	{
		var godLvl=Game.hasGod('seasons');
		if (godLvl==1) failRate*=0.9;
		else if (godLvl==2) failRate*=0.95;
		else if (godLvl==3) failRate*=0.97;
	}
	if (Math.random()>=failRate)
	{
		var drop='';
		if (Math.random()<0.1) drop=choose(Game.rareEggDrops);
		else drop=choose(Game.eggDrops);
		if (Game.Has(drop) || Game.HasUnlocked(drop))//reroll if we have it
		{
			if (Math.random()<0.1) drop=choose(Game.rareEggDrops);
			else drop=choose(Game.eggDrops);
		}
		if (Game.Has(drop) || Game.HasUnlocked(drop)) return;
		Game.Unlock(drop);
		Game.Notify(loc("You found an egg!"),'<b>'+drop+'</b>',Game.Upgrades[drop].icon);
	}
}
export function GetHowManySantaDrops()
{
	var num=0;
	for (var i in Game.santaDrops) {if (Game.Has(Game.santaDrops[i])) num++;}
	return num;
}
export function GetHowManyReindeerDrops()
{
	var num=0;
	for (var i in Game.reindeerDrops) {if (Game.Has(Game.reindeerDrops[i])) num++;}
	return num;
}
/*for (var i in Game.santaDrops)
{
	Game.Upgrades[Game.santaDrops[i]].descFunc=function(){return '<div style="text-align:center;">You currently own <b>'+Game.GetHowManySantaDrops()+'/'+Game.santaDrops.length+'</b> of Santa\'s gifts.</div><div class="line"></div>'+this.ddesc;};
}*/
export function saySeasonSwitchUses()
{
	if (Game.seasonUses==0) return loc("You haven't switched seasons this ascension yet.");
	return EN?('You\'ve switched seasons <b>'+(Game.seasonUses==1?'once':Game.seasonUses==2?'twice':(Game.seasonUses+' times'))+'</b> this ascension.'):(Game.seasonUses==1?loc("You've switched seasons <b>once</b> this ascension."):loc("You've switched seasons <b>%1 times</b> this ascension.",Game.seasonUses));
}
export function computeSeasonPrices()
{
	for (var i in Game.seasons)
	{
		Game.seasons[i].triggerUpgrade.priceFunc=function(){
			var m=1;
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('seasons');
				if (godLvl==1) m*=2;
				else if (godLvl==2) m*=1.50;
				else if (godLvl==3) m*=1.25;
			}
			//return Game.seasonTriggerBasePrice*Math.pow(2,Game.seasonUses)*m;
			//return Game.cookiesPs*60*Math.pow(1.5,Game.seasonUses)*m;
			return Game.seasonTriggerBasePrice+Game.unbuffedCps*60*Math.pow(1.5,Game.seasonUses)*m;
		}
	}
}
export function computeSeasons()
{
	for (var i in Game.seasons)
	{
		var me=Game.Upgrades[Game.seasons[i].trigger];
		Game.seasons[i].triggerUpgrade=me;
		me.pool='toggle';
		me.buyFunction=function(this: any)
		{
			Game.seasonUses+=1;
			Game.computeSeasonPrices();
			//Game.Lock(this.name);
			for (var i in Game.seasons)
			{
				var me=Game.Upgrades[Game.seasons[i].trigger];
				if (me.name!=this.name) {Game.Lock(me.name);Game.Unlock(me.name);}
			}
			if (Game.season!='' && Game.season!=this.season)
			{
				Game.Notify(Game.seasons[Game.season].over+'<div class="line"></div>','',Game.seasons[Game.season].triggerUpgrade.icon,4);
			}
			Game.season=this.season;
			Game.seasonT=Game.getSeasonDuration();
			Game.storeToRefresh=1;
			Game.upgradesToRebuild=1;
			Game.Objects['Grandma'].redraw();
			Game.Notify(Game.seasons[this.season].start+'<div class="line"></div>','',this.icon,4);
		}
		
		me.clickFunction=function(me: any){return function()
		{
			//undo season
			if (me.bought && Game.season && me==Game.seasons[Game.season].triggerUpgrade)
			{
				me.lose();
				Game.Notify(Game.seasons[Game.season].over,'',Game.seasons[Game.season].triggerUpgrade.icon);
				if (Game.Has('Season switcher')) {Game.Unlock(Game.seasons[Game.season].trigger);Game.seasons[Game.season].triggerUpgrade.bought=0;}
				
				Game.upgradesToRebuild=1;
				Game.recalculateGains=1;
				Game.season=Game.baseSeason;
				Game.seasonT=-1;
				PlaySound('snd/tick.mp3');
				return false;
			}
			else return true;
		};}(me);
		
		me.displayFuncWhenOwned=function(){return '<div style="text-align:center;">'+loc("Time remaining:")+'<br><b>'+(Game.Has('Eternal seasons')?loc("forever"):Game.sayTime(Game.seasonT,-1))+'</b><div style="font-size:80%;">('+loc("Click again to cancel season")+')</div></div>';}
		me.timerDisplay=function(upgrade: any){return function(){if (!Game.Upgrades[upgrade.name].bought || Game.Has('Eternal seasons')) return -1; else return 1-Game.seasonT/Game.getSeasonDuration();}}(me);
		
	}
}
export function getSeasonDuration(){return Game.fps*60*60*24;}
