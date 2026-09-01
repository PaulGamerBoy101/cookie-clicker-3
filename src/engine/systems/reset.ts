/**
 * systems/reset.ts — the engine's reset logic (Phase 6, slice 3).
 *
 * The 2.048 engine defined `Game.Reset` (the ~180-line ascension/hard-reset
 * routine) and `Game.HardReset` (the two-step wipe-save confirmation) inside
 * `Game.Init`. They are now typed exports; the engine keeps the same
 * `Game.X = X` slots at the exact original Init positions.
 *
 * Bodies are verbatim (original indentation kept); only parameter
 * annotations were added (`:any` where call sites pass optional or
 * heterogeneous values).
 *
 * Runtime imports: none — `Game`, `App`, `EN`, `loc`, `tinyIcon`, `l`,
 * `PlayCue`, `BeautifyAll` resolve through src/globals.d.ts.
 */

export function Reset(hard: any)
{
	Game.T=0;
	
	if (hard) {Game.loadedFromVersion=Game.version;}
	
	var cookiesForfeited=Game.cookiesEarned;
	if (!hard)
	{
		if (cookiesForfeited>=1000000) Game.Win('Sacrifice');
		if (cookiesForfeited>=1000000000) Game.Win('Oblivion');
		if (cookiesForfeited>=1000000000000) Game.Win('From scratch');
		if (cookiesForfeited>=1000000000000000) Game.Win('Nihilism');
		if (cookiesForfeited>=1000000000000000000) Game.Win('Dematerialize');
		if (cookiesForfeited>=1000000000000000000000) Game.Win('Nil zero zilch');
		if (cookiesForfeited>=1000000000000000000000000) Game.Win('Transcendence');
		if (cookiesForfeited>=1000000000000000000000000000) Game.Win('Obliterate');
		if (cookiesForfeited>=1000000000000000000000000000000) Game.Win('Negative void');
		if (cookiesForfeited>=1000000000000000000000000000000000) Game.Win('To crumbs, you say?');
		if (cookiesForfeited>=1000000000000000000000000000000000000) Game.Win('You get nothing');
		if (cookiesForfeited>=1000000000000000000000000000000000000000) Game.Win('Humble rebeginnings');
		if (cookiesForfeited>=1000000000000000000000000000000000000000000) Game.Win('The end of the world');
		if (cookiesForfeited>=1000000000000000000000000000000000000000000000) Game.Win('Oh, you\'re back');
		if (cookiesForfeited>=1000000000000000000000000000000000000000000000000) Game.Win('Lazarus');
		if (cookiesForfeited>=1000000000000000000000000000000000000000000000000000) Game.Win('Smurf account');
		if (cookiesForfeited>=1000000000000000000000000000000000000000000000000000000) Game.Win('If at first you don\'t succeed');
		
		if (Math.round(Game.cookies)==1000000000000) Game.Win('When the cookies ascend just right');
	}
	
	Game.killBuffs();
	
	Game.seed=Game.makeSeed();
	
	Game.cookiesReset+=Game.cookiesEarned;
	Game.cookies=0;
	Game.cookiesEarned=0;
	Game.cookieClicks=0;
	Game.goldenClicksLocal=0;
	//Game.goldenClicks=0;
	//Game.missedGoldenClicks=0;
	Game.handmadeCookies=0;
	Game.cookiesPsRawHighest=0;
	if (hard)
	{
		Game.bgType=0;
		Game.milkType=0;
		Game.chimeType=0;
		
		Game.vault=[];
	}
	Game.pledges=0;
	Game.pledgeT=0;
	Game.elderWrath=0;
	Game.elderWrathOld=0;
	Game.elderWrathD=0;
	Game.nextResearch=0;
	Game.researchT=0;
	Game.seasonT=0;
	Game.seasonUses=0;
	Game.season=Game.baseSeason;
	Game.computeSeasonPrices();
	
	Game.startDate=parseInt(Date.now());
	Game.lastDate=parseInt(Date.now());
	
	Game.cookiesSucked=0;
	Game.wrinklersPopped=0;
	Game.ResetWrinklers();
	
	Game.santaLevel=0;
	Game.reindeerClicked=0;
	
	Game.dragonLevel=0;
	Game.dragonAura=0;
	Game.dragonAura2=0;
	
	Game.fortuneGC=0;
	Game.fortuneCPS=0;
	
	Game.TickerClicks=0;
	
	if (Game.gainedPrestige>0) Game.resets++;
	if (!hard && Game.canLumps() && Game.ascensionMode!=1) Game.addClass('lumpsOn');
	else Game.removeClass('lumpsOn');
	Game.gainedPrestige=0;
	
	for (var i in Game.ObjectsById)
	{
		var me: any=Game.ObjectsById[i];
		me.amount=0;me.bought=0;me.highest=0;me.free=0;me.totalCookies=0;
		me.switchMinigame(false);
		if (hard) {me.muted=0;}
		me.pics=[];
		me.refresh();
	}
	for (var i in Game.UpgradesById)
	{
		var me: any=Game.UpgradesById[i];
		if (hard || me.pool!='prestige') me.bought=0;
		if (hard) me.unlocked=0;
		if (me.pool!='prestige' && !me.lasting)
		{
			if (Game.Has('Keepsakes') && Game.seasonDrops.indexOf(me.name)!=-1 && Math.random()<1/5){}
			else if (Game.ascensionMode==1 && Game.HasAchiev('O Fortuna') && me.tier=='fortune'){}
			else if (Game.HasAchiev('O Fortuna') && me.tier=='fortune' && Math.random()<0.4){}
			else me.unlocked=0;
		}
	}
	
	Game.BuildingsOwned=0;
	Game.UpgradesOwned=0;
	Game.monoBuilding=null;//CC3: Monoculture challenge — clear the per-run building lock on every reset
	
	Game.cookiesPsByType={};
	Game.cookiesMultByType={};
	
	if (!hard)
	{
		if (Game.ascensionMode!=1)
		{
			for (var i in Game.permanentUpgrades)
			{
				if (Game.permanentUpgrades[i]!=-1)
				{Game.UpgradesById[Game.permanentUpgrades[i]].earn();}
			}
			if (Game.Has('Season switcher')) {for (var i in Game.seasons) {Game.Unlock(Game.seasons[i].trigger);}}
			
			if (Game.Has('Starter kit')) Game.Objects['Cursor'].getFree(10);
			if (Game.Has('Lucky start')) Game.Objects['Cursor'].getFree(3);
			if (Game.Has('Starter kitchen')) Game.Objects['Grandma'].getFree(5);
		}
	}
	
	/*for (var i in Game.AchievementsById)
	{
		var me: any=Game.AchievementsById[i];
		me.won=0;
	}*/
	//Game.DefaultPrefs();
	BeautifyAll();
	
	Game.RebuildUpgrades();
	Game.TickerAge=0;
	Game.TickerEffect=0;
	Game.recalculateGains=1;
	Game.storeToRefresh=1;
	Game.upgradesToRebuild=1;
	Game.killShimmers();
	
	Game.buyBulk=1;Game.buyMode=1;Game.storeBulkButton(-1);
	
	Game.LoadMinigames();
	for (var i in Game.ObjectsById)
	{
		var me: any=Game.ObjectsById[i];
		if (hard && me.minigame && me.minigame.launch) {me.minigame.launch();me.minigame.reset(true);}
		else if (!hard && me.minigame && me.minigame.reset) me.minigame.reset();
	}
	
	l('toggleBox').style.display='none';
	l('toggleBox').innerHTML='';
	Game.choiceSelectorOn=-1;
	Game.ToggleSpecialMenu(0);
	Game.specialTab='';
	
	l('logButton').classList.remove('hasUpdate');
	
	Game.runModHook('reset',hard);
	
	if (hard)
	{
		Game.clicksThisSession=0;
		if (Game.T>Game.fps*5 && Game.ReincarnateTimer==0)//fade out of black and pop the cookie
		{
			Game.ReincarnateTimer=1;
			Game.addClass('reincarnating');
			Game.BigCookieSize=0;
		}
		Game.Notify(loc("Game reset"),EN?"So long, cookies.":loc("Good bye, cookies."),[21,6],6);
	}
	else Game.clicksThisSession=Math.max(Game.clicksThisSession,1);
	
	Game.jukebox.reset();
	if (hard) PlayCue('launch');
	else PlayCue('play');
}
export function HardReset(bypass: any)
{
	if (!bypass)
	{
		Game.Prompt('<id WipeSave><h3>'+loc("Wipe save")+'</h3><div class="block">'+tinyIcon([15,5])+'<div class="line"></div>'+loc("Do you REALLY want to wipe your save?<br><small>You will lose your progress, your achievements, and your heavenly chips!</small>")+'</div>',[[EN?'Yes!':loc("Yes"),'Game.ClosePrompt();Game.HardReset(1);','float:left'],[loc("No"),0,'float:right']]);
	}
	else if (bypass==1)
	{
		Game.Prompt('<id ReallyWipeSave><h3>'+loc("Wipe save")+'</h3><div class="block">'+tinyIcon([15,5])+'<div class="line"></div>'+loc("Whoah now, are you really, <b><i>REALLY</i></b> sure you want to go through with this?<br><small>Don't say we didn't warn you!</small>")+'</div>',[[EN?'Do it!':loc("Yes"),'Game.ClosePrompt();Game.HardReset(2);','float:left'],[loc("No"),0,'float:right']]);
	}
	else
	{
		for (var i in Game.AchievementsById)
		{
			var me: any=Game.AchievementsById[i];
			me.won=0;
		}
		for (var i in Game.ObjectsById)
		{
			var me: any=Game.ObjectsById[i];
			me.level=0;
		}

		Game.AchievementsOwned=0;
		Game.goldenClicks=0;
		Game.missedGoldenClicks=0;
		Game.Reset(1);
		Game.resets=0;
		Game.fullDate=parseInt(Date.now());
		Game.bakeryName=Game.GetBakeryName();
		Game.bakeryNameRefresh();
		Game.cookiesReset=0;
		Game.prestige=0;
		Game.heavenlyChips=0;
		Game.heavenlyChipsSpent=0;
		Game.heavenlyCookies=0;
		Game.permanentUpgrades=[-1,-1,-1,-1,-1];
		Game.ascensionMode=0;
		Game.lumps=-1;
		Game.lumpsTotal=-1;
		Game.lumpT=Date.now();
		Game.lumpRefill=0;
		Game.removeClass('lumpsOn');
		if (App) App.hardReset();
	}
}
