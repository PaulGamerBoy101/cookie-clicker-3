/* CC3 rewrite (phase 6, slice 4): menu UI extracted from engine/main.ts
 * verbatim. `Game.ShowMenu`, the small prefs/log helpers (`tinyCookie`,
 * `setVolume`×3, `showLangSelection`) and `Game.UpdateMenu` are re-assigned
 * onto the same Game slots at the same Init positions; the `ON`/`OFF`
 * state-init lines stay in the engine between the slot assignments.
 *
 * Runtime imports: `romanize` (typed helper); the rest — `Game`, `l`,
 * `loc`, `EN`, `App`, `Langs`, `locId`, `AddEvent`, `PlaySound`,
 * `localStorageSet`, `Beautify`, `LBeautify`, `writeIcon`, `ON`, `OFF`,
 * `Music` — resolve through src/globals.d.ts.
 */

import { romanize } from "../utils/helpers";

export function ShowMenu(what: any)
{
	if (!what || what=='') what=Game.onMenu;
	if (Game.onMenu=='' && what!='') Game.addClass('onMenu');
	else if (Game.onMenu!='' && what!=Game.onMenu) Game.addClass('onMenu');
	else if (what==Game.onMenu) {Game.removeClass('onMenu');what='';}
	//if (what=='log') l('donateBox').className='on'; else l('donateBox').className='';
	Game.onMenu=what;
	
	l('prefsButton').className=(Game.onMenu=='prefs')?'panelButton selected':'panelButton';
	l('statsButton').className=(Game.onMenu=='stats')?'panelButton selected':'panelButton';
	l('logButton').className=(Game.onMenu=='log')?'panelButton selected':'panelButton';
	l('helpButton').className=(Game.onMenu=='help')?'panelButton selected':'panelButton';
	
	if (Game.onMenu=='') PlaySound('snd/back1.mp3',0.5);//CC3: interface back tone (interface-sfx-pack-1, CC0)
	else PlaySound('snd/confirm1.mp3',0.5);//CC3: interface confirm tone (interface-sfx-pack-1, CC0)
	
	Game.UpdateMenu();
	
	if (what=='')
	{
		for (var i in Game.Objects)
		{
			var me=Game.Objects[i];
			if (me.minigame && me.minigame.onResize) me.minigame.onResize();
		}
	}
}

export function tinyCookie()
{
	if (!Game.HasAchiev('Tiny cookie'))
	{
		return '<div class="tinyCookie" '+Game.clickStr+'="Game.ClickTinyCookie();"></div>';
	}
	return '';
}

export function ClickTinyCookie(){if (!Game.HasAchiev('Tiny cookie')){PlaySound('snd/tick.mp3');Game.Win('Tiny cookie');}}


export function setVolume(what: any)
{
	Game.volume=what;
	/*for (var i in Sounds)
	{
		Sounds[i].volume=Game.volume;
	}*/
}

export function setVolumeMusic(what: any)
{
	Game.volumeMusic=what;
	if (Music) Music.setVolume(what/100);
}

export function setWubMusic(what: any)
{
	if (Music) Music.setFilter(what/100);
}

export function showLangSelection()
{
	var str='';
	for (var i in Langs)
	{
		var lang=Langs[i];
		str+='<div class="langSelectButton title'+(locId==lang.file?' selected':'')+'" style="padding:4px;" id="langSelect-'+lang.nameEN+'">'+lang.name+'</div>';
	}
	Game.Prompt('<id ChangeLanguage><h3>'+loc("Change language")+'</h3>'+
		'<div class="line"></div>'+
		'<div style="font-size:11px;opacity:0.5;margin-bottom:12px;">('+loc("note: this will save and reload your game")+')</div>'+
		str,
		[loc("Cancel")]);
	
	for (var i in Langs)
	{
		var lang=Langs[i];
		AddEvent(l('langSelect-'+lang.nameEN),'click',function(lang: any){return function(){
			if (lang!=locId)
			{
				PlaySound('snd/tick.mp3');
				localStorageSet('CookieClickerLang',lang);
				Game.toSave=true;
				Game.toReload=true;
			}
		};}(i));
		AddEvent(l('langSelect-'+lang.nameEN),'mouseover',function(lang: any){return function(){
			if (lang!=locId) PlaySound('snd/smallTick.mp3',0.75);
		};}(i));
	}
}

export function UpdateMenu()
{
	var str='';
	if (Game.onMenu!='')
	{
		str+='<div class="close menuClose" '+Game.clickStr+'="Game.ShowMenu();">x</div>';
		//str+='<div style="position:absolute;top:8px;right:8px;cursor:pointer;font-size:16px;" '+Game.clickStr+'="Game.ShowMenu();">X</div>';
	}
	if (Game.onMenu=='prefs')
	{
		str+='<div class="section">'+loc("Options")+'</div>';
		
		str+=
			'<div class="block" style="padding:0px;margin:8px 4px;">'+
				'<div class="subsection" style="padding:0px;">'+
				'<div class="title">'+loc("General")+'</div>'+
					'<div class="listing" style="text-align:center;"><div style="display:inline-block;padding:2px 8px;opacity:0.75;font-size:12px;vertical-align:middle;" class="smallFancyButton">'+loc("Language: %1",'<b>'+Langs[locId].name+'</b>')+'</div><div class="icon" style="vertical-align:middle;display:inline-block;background-position:'+(-30*48)+'px '+(-29*48)+'px;transform:scale(0.5);margin:-16px -12px;"></div><a style="font-size:15px;text-align:center;width:auto;min-width:130px;" class="option smallFancyButton" id="changeLanguageOption" '+Game.clickStr+'="PlaySound(\'snd/tick.mp3\');Game.showLangSelection();">'+(!EN?'Change language<div class="line"></div>':'')+loc("Change language")+'</a><div style="clear:both;text-align:right;padding-bottom:2px;"></div></div>'+
					(App?'<div class="listing"><a class="option smallFancyButton" '+Game.clickStr+'="PlaySound(\'snd/tick.mp3\');Game.toSave=true;Game.toQuit=true;">'+loc("Save & Quit")+'</a></div>':'')+
					'<div class="listing"><a class="option smallFancyButton" '+Game.clickStr+'="Game.toSave=true;PlaySound(\'snd/tick.mp3\');">'+loc("Save")+'</a><label>'+loc("Save manually (the game autosaves every 60 seconds; shortcut: ctrl+S)")+'</label></div>'+
					'<div class="listing"><a class="option smallFancyButton" '+Game.clickStr+'="Game.ExportSave();PlaySound(\'snd/tick.mp3\');">'+loc("Export save")+'</a><a class="option smallFancyButton" '+Game.clickStr+'="Game.ImportSave();PlaySound(\'snd/tick.mp3\');">'+loc("Import save")+'</a><label>'+loc("You can use this to backup your save or to transfer it to another computer (shortcut for import: ctrl+O)")+'</label></div>'+
					(!App?('<div class="listing"><a class="option smallFancyButton" '+Game.clickStr+'="Game.FileSave();PlaySound(\'snd/tick.mp3\');">'+loc("Save to file")+'</a><a class="option smallFancyButton" style="position:relative;"><input id="FileLoadInput" type="file" style="cursor:pointer;opacity:0;position:absolute;left:0px;top:0px;width:100%;height:100%;" onchange="Game.FileLoad(event);" '+Game.clickStr+'="PlaySound(\'snd/tick.mp3\');"/>'+loc("Load from file")+'</a><label>'+loc("Use this to keep backups on your computer")+'</label></div>'):'')+
					'<div id="backupList"></div>'+//CC3: rolling save backups are populated by Game.RefreshBackupList() after the menu draws
					'<div class="listing" style="text-align:right;"><label>'+loc("Delete all your progress, including your achievements")+'</label><a class="option smallFancyButton warning" '+Game.clickStr+'="Game.HardReset();PlaySound(\'snd/tick.mp3\');">'+loc("Wipe save")+'</a></div>'+
					
				'</div>'+
			'</div>'+
			'<div class="block" style="padding:0px;margin:8px 4px;">'+
				'<div class="subsection" style="padding:0px;">'+
			
				'<div class="title">'+loc("Settings")+'</div>'+
				((App && App.writeCloudUI)?App.writeCloudUI():'')+
				'<div class="listing">'+
					Game.WriteSlider('volumeSlider',loc("Volume"),'[$]%',function(){return Game.volume;},'Game.setVolume(Math.round(l(\'volumeSlider\').value));l(\'volumeSliderRightText\').innerHTML=Game.volume+\'%\';')+
					Game.WriteSlider('volumeMusicSlider',loc("Volume (music)"),'[$]%',function(){return Game.volumeMusic;},'Game.setVolumeMusic(Math.round(l(\'volumeMusicSlider\').value));l(\'volumeMusicSliderRightText\').innerHTML=Game.volumeMusic+\'%\';')+
					/*(App?Game.WriteSlider('wubMusicSlider',loc("Wub"),'[$]%',function(){return 100;},'Game.setWubMusic(Math.round(l(\'wubMusicSlider\').value));l(\'wubMusicSliderRightText\').innerHTML=(Math.round(l(\'wubMusicSlider\').value))+\'%\';'):'')+*/
					'<br>'+
					Game.WritePrefButton('bgMusic','bgMusicButton',loc("Music")+ON,loc("Music")+OFF,'Game.ToggleMusic();')+'<label>('+loc("music will keep playing even when the game window isn't focused")+')</label><br>'+
					(App?Game.WritePrefButton('fullscreen','fullscreenButton',loc("Fullscreen")+ON,loc("Fullscreen")+OFF,'Game.ToggleFullscreen();')+'<br>':'')+
					Game.WritePrefButton('fancy','fancyButton',loc("Fancy graphics")+ON,loc("Fancy graphics")+OFF,'Game.ToggleFancy();')+'<label>('+loc("visual improvements; disabling may improve performance")+')</label><br>'+
					Game.WritePrefButton('filters','filtersButton',loc("CSS filters")+ON,loc("CSS filters")+OFF,'Game.ToggleFilters();')+'<label>('+(EN?'cutting-edge visual improvements; disabling may improve performance':loc("visual improvements; disabling may improve performance"))+')</label><br>'+
					Game.WritePrefButton('particles','particlesButton',loc("Particles")+ON,loc("Particles")+OFF)+(EN?'<label>(cookies falling down, etc; disabling may improve performance)</label>':'')+'<br>'+
					Game.WritePrefButton('numbers','numbersButton',loc("Numbers")+ON,loc("Numbers")+OFF)+'<label>('+loc("numbers that pop up when clicking the cookie")+')</label><br>'+
					Game.WritePrefButton('milk','milkButton',loc("Milk [setting]")+ON,loc("Milk [setting]")+OFF)+(EN?'<label>(only appears with enough achievements)</label>':'')+'<br>'+
					Game.WritePrefButton('cursors','cursorsButton',loc("Cursors [setting]")+ON,loc("Cursors [setting]")+OFF)+'<label>('+loc("visual display of your cursors")+')</label><br>'+
					Game.WritePrefButton('wobbly','wobblyButton',loc("Wobbly cookie")+ON,loc("Wobbly cookie")+OFF)+(EN?'<label>(your cookie will react when you click it)</label>':'')+'<br>'+
					Game.WritePrefButton('cookiesound','cookiesoundButton',loc("Alt cookie sound")+ON,loc("Alt cookie sound")+OFF)+(EN?'<label>(how your cookie sounds when you click on it)</label>':'')+'<br>'+
					Game.WritePrefButton('crates','cratesButton',loc("Icon crates")+ON,loc("Icon crates")+OFF)+'<label>('+loc("display boxes around upgrades and achievements in Stats")+')</label><br>'+
					Game.WritePrefButton('monospace','monospaceButton',loc("Alt font")+ON,loc("Alt font")+OFF)+'<label>('+loc("your cookies are displayed using a monospace font")+')</label><br>'+
					Game.WritePrefButton('format','formatButton',loc("Short numbers")+OFF,loc("Short numbers")+ON,'BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;',1)+(EN?'<label>(shorten big numbers)</label>':'')+'<br>'+
					Game.WritePrefButton('notifs','notifsButton',loc("Fast notes")+ON,loc("Fast notes")+OFF)+'<label>('+loc("notifications disappear much faster")+')</label><br>'+
					//Game.WritePrefButton('autoupdate','autoupdateButton','Offline mode OFF','Offline mode ON',0,1)+'<label>(disables update notifications)</label><br>'+
					(!App?Game.WritePrefButton('warn','warnButton',loc("Closing warning")+ON,loc("Closing warning")+OFF)+'<label>('+loc("the game will ask you to confirm when you close the window")+')</label><br>':'')+
					//Game.WritePrefButton('focus','focusButton',loc("Defocus")+OFF,loc("Defocus")+ON,0,1)+'<label>('+loc("the game will be less resource-intensive when out of focus")+')</label><br>'+
					Game.WritePrefButton('extraButtons','extraButtonsButton',loc("Extra buttons")+ON,loc("Extra buttons")+OFF,'Game.ToggleExtraButtons();')+'<label>('+loc("add options on buildings like Mute")+')</label><br>'+
					Game.WritePrefButton('askLumps','askLumpsButton',loc("Lump confirmation")+ON,loc("Lump confirmation")+OFF)+'<label>('+loc("the game will ask you to confirm before spending sugar lumps")+')</label><br>'+
					(!App?Game.WritePrefButton('customGrandmas','customGrandmasButton',loc("Custom grandmas")+ON,loc("Custom grandmas")+OFF)+'<label>('+loc("some grandmas will be named after Patreon supporters")+')</label><br>':'')+
					Game.WritePrefButton('notScary','notScaryButton',loc("Scary stuff")+OFF,loc("Scary stuff")+ON,0,1)+'<br>'+
					Game.WritePrefButton('timeout','timeoutButton',loc("Sleep mode timeout")+ON,loc("Sleep mode timeout")+OFF)+'<label>('+loc("on slower computers, the game will put itself in sleep mode when it's inactive and starts to lag out; offline CpS production kicks in during sleep mode")+')</label><br>'+
					Game.WritePrefButton('screenreader','screenreaderButton',loc("Screen reader mode")+ON,loc("Screen reader mode")+OFF,'Game.toSave=true;Game.toReload=true;')+'<label>('+loc("allows optimizations for screen readers; game will reload")+')</label><br>'+
				'</div>'+
				//'<div class="listing">'+Game.WritePrefButton('autosave','autosaveButton','Autosave ON','Autosave OFF')+'</div>'+
				(!App?'<div class="listing"><a class="option smallFancyButton" '+Game.clickStr+'="Game.CheckModData();PlaySound(\'snd/tick.mp3\');">'+loc("Check mod data")+'</a><label>('+loc("view and delete save data created by mods")+')</label></div>':'')+
				
				'</div>'+
			'</div>'+
		'</div>';
		
		if (App && App.writeModUI)
		{
			str+=
				'<div class="block" style="padding:0px;margin:8px 4px;">'+
					'<div class="subsection" style="padding:0px;">'+
					
					'<div class="title">'+loc("Mods")+'</div>'+
					App.writeModUI()+
					'</div>'+
				'</div>';
		}
		
		str+='<div style="height:128px;"></div>';
	}
	else if (Game.onMenu=='log')
	{
		//str+=replaceAll('[bakeryName]',Game.bakeryName,Game.updateLog);
		str+=Game.updateLog;
		if (!Game.HasAchiev('Olden days')) str+='<div id="oldenDays" style="text-align:right;width:100%;"><div '+Game.clickStr+'="Game.SparkleAt(Game.mouseX,Game.mouseY);PlaySound(\'snd/tick.mp3\');PlaySound(\'snd/shimmerClick.mp3\');Game.Win(\'Olden days\');Game.UpdateMenu();" class="icon" style="display:inline-block;transform:scale(0.5);cursor:pointer;width:48px;height:48px;background-position:'+(-12*48)+'px '+(-3*48)+'px;"></div></div>';
	}
	else if (Game.onMenu=='help')
	{
		// CC3: the Help panel — a static core-loop reference, plus a way to
		// replay the coach-mark tour (extras/tutorial.ts, reached bare as
		// window.Tutorial the same way the other extras' inline handlers
		// reach AmericanSeason/Casino/DecideDestiny). Extend this alongside
		// new sections in tutorial.ts's STEPS as the tour grows past the
		// core loop (prestige, minigames, seasons, ...).
		str+='<div class="section">'+loc("Help")+'</div>'+
		'<div class="block" style="text-align:center;padding:8px 4px;">'+
			'<a class="option" '+Game.clickStr+'="Game.ShowMenu(\'help\');window.Tutorial.start();">'+loc("Replay the tutorial")+'</a>'+
		'</div>'+
		'<div class="subsection">'+
			'<div class="title">'+loc("Clicking")+'</div>'+
			'<div class="listing">'+loc("Click the big cookie to bake cookies by hand. Each click bakes a small amount, plus a percentage of your cookies per second.")+'</div>'+
		'</div>'+
		'<div class="subsection">'+
			'<div class="title">'+loc("Buildings & the Store")+'</div>'+
			'<div class="listing">'+loc("Buy buildings from the Store, on the right, to bake cookies automatically — even while you're away. Each building gets more expensive the more you own, and later buildings produce far more per unit.")+'</div>'+
		'</div>'+
		'<div class="subsection">'+
			'<div class="title">'+loc("Cookies per second (CpS)")+'</div>'+
			'<div class="listing">'+loc("The small number under your cookie count shows your CpS: how many cookies you're baking automatically, every second.")+'</div>'+
		'</div>'+
		'<div class="subsection">'+
			'<div class="title">'+loc("Upgrades")+'</div>'+
			'<div class="listing">'+loc("Upgrades appear in the Store as you buy buildings and bake more cookies. They boost production — often significantly — and are almost always worth buying as soon as you can afford them.")+'</div>'+
		'</div>'+
		'<div class="subsection">'+
			'<div class="title">'+loc("Golden cookies")+'</div>'+
			'<div class="listing">'+loc("A golden cookie occasionally appears on screen for a short time. Click it fast — it grants a random, temporary bonus (extra cookies, a production boost, and more).")+'</div>'+
		'</div>';
	}
	else if (Game.onMenu=='stats')
	{
		var buildingsOwned=0;
		buildingsOwned=Game.BuildingsOwned;
		var upgrades='';
		var cookieUpgrades='';
		var hiddenUpgrades='';
		var prestigeUpgrades='';
		var upgradesTotal=0;
		var upgradesOwned=0;
		var prestigeUpgradesTotal=0;
		var prestigeUpgradesOwned=0;
		
		var list: any=[];
		//sort the upgrades
		for (var iKey in Game.Upgrades){list.push(Game.Upgrades[iKey]);}//clone first
		var sortMap=function(a: any,b: any)
		{
			if (a.order>b.order) return 1;
			else if (a.order<b.order) return -1;
			else return 0;
		}
		list.sort(sortMap);
		for (var iKey in list)
		{
			var str2='';
			var me=list[iKey];
			
			str2+=Game.crate(me,'stats');
			
			if (me.bought)
			{
				if (Game.CountsAsUpgradeOwned(me.pool)) upgradesOwned++;
				else if (me.pool=='prestige') prestigeUpgradesOwned++;
			}
			
			if (me.pool=='' || me.pool=='cookie' || me.pool=='tech') upgradesTotal++;
			if (me.pool=='debug') hiddenUpgrades+=str2;
			else if (me.pool=='prestige') {prestigeUpgrades+=str2;prestigeUpgradesTotal++;}
			else if (me.pool=='cookie') cookieUpgrades+=str2;
			else if (me.pool!='toggle' && me.pool!='unused') upgrades+=str2;
		}
		var achievements: any=[];
		var achievementsOwned=0;
		var achievementsOwnedOther=0;
		var achievementsTotal=0;
		
		var list: any=[];
		for (var iKey in Game.Achievements)//sort the achievements
		{
			list.push(Game.Achievements[iKey]);
		}
		var sortMap=function(a: any,b: any)
		{
			if (a.order>b.order) return 1;
			else if (a.order<b.order) return -1;
			else return 0;
		}
		list.sort(sortMap);
		
		
		for (var iKey in list)
		{
			var me: any=list[iKey];
			//if (me.pool=='normal' || me.won>0) achievementsTotal++;
			if (Game.CountsAsAchievementOwned(me.pool)) achievementsTotal++;
			var pool=me.pool;
			if (!achievements[pool]) achievements[pool]='';
			achievements[pool]+=Game.crate(me,'stats');
			
			if (me.won)
			{
				if (Game.CountsAsAchievementOwned(me.pool)) achievementsOwned++;
				else achievementsOwnedOther++;
			}
		}
		
		var achievementsStr='';
		var pools: any={
			'dungeon':(EN?'<b>Dungeon achievements</b> <small>(Not technically achievable yet.)</small>':'<b>???</b>'),
			'shadow':'<b>'+loc("Shadow achievements")+'</b> <small>('+loc("These are feats that are either unfair or difficult to attain. They do not give milk.")+')</small>'
		};
		for (var key in achievements)
		{
			if (achievements[key]!='')
			{
				if (pools[key]) achievementsStr+='<div class="listing">'+pools[key]+'</div>';
				achievementsStr+='<div class="listing crateBox">'+achievements[key]+'</div>';
			}
		}
		
		var milkStr='';
		for (var i=0;i<Game.Milks.length;i++)
		{
			if (Game.milkProgress>=i)
			{
				var milk=Game.Milks[i];
				milkStr+='<div '+Game.getTooltip(
				'<div class="prompt" style="text-align:center;padding-bottom:6px;white-space:nowrap;margin:0px;padding-bottom:96px;" id="tooltipMilk"><h3 style="margin:6px 32px 0px 32px;">'+(loc("Rank %1",romanize(i+1))+' - '+milk.name)+'</h3><div style="opacity:0.75;font-size:9px;">('+(i==0?loc("starter milk"):loc("for %1 achievements",Beautify(i*25)))+')</div><div class="line"></div><div style="width:100%;height:96px;position:absolute;left:0px;bottom:0px;background:url(img/'+milk.pic+');"></div></div>'
				,'top')+' style="background:url(img/icons.webp?v='+Game.version+') '+(-milk.icon[0]*48)+'px '+(-milk.icon[1]*48)+'px;margin:2px 0px;" class="trophy"></div>';
			}
		}
		milkStr+='<div style="clear:both;"></div>';
		
		var santaStr='';
		var frames=15;
		if (Game.Has('A festive hat'))
		{
			for (var i=0;i<=Game.santaLevel;i++)
			{
				santaStr+='<div '+Game.getTooltip(
				'<div class="prompt" style="text-align:center;padding-bottom:6px;white-space:nowrap;margin:0px 32px;"><div style="width:96px;height:96px;margin:4px auto;background:url(img/santa.webp) '+(-i*96)+'px 0px;filter:drop-shadow(0px 3px 2px #000);-webkit-filter:drop-shadow(0px 3px 2px #000);" id="tooltipSanta"></div><div class="line"></div><h3>'+Game.santaLevels[i]+'</h3></div>'
				,'top')+' style="background:url(img/santa.webp) '+(-i*48)+'px 0px;background-size:'+(frames*48)+'px 48px;" class="trophy"></div>';
			}
			santaStr+='<div style="clear:both;"></div>';
		}
		var dragonStr='';
		var frames=9;
		var mainLevels=[0,4,8,Game.dragonLevels.length-3,Game.dragonLevels.length-2,Game.dragonLevels.length-1];
		if (Game.Has('A crumbly egg'))
		{
			for (var i=0;i<=mainLevels.length;i++)
			{
				if (Game.dragonLevel>=mainLevels[i])
				{
					var level=Game.dragonLevels[mainLevels[i]];
					dragonStr+='<div '+Game.getTooltip(
					//'<div style="width:96px;height:96px;margin:4px auto;background:url(img/dragon.webp?v='+Game.version+') '+(-level.pic*96)+'px 0px;"></div><div class="line"></div><div style="min-width:200px;text-align:center;margin-bottom:6px;">'+level.name+'</div>'
					'<div class="prompt" style="text-align:center;padding-bottom:6px;white-space:nowrap;margin:0px 32px;" id="tooltipDragon"><div style="width:96px;height:96px;margin:4px auto;background:url(img/dragon.webp?v='+Game.version+') '+(-level.pic*96)+'px 0px;filter:drop-shadow(0px 3px 2px #000);-webkit-filter:drop-shadow(0px 3px 2px #000);"></div><div class="line"></div><h3>'+level.name+'</h3></div>'
					,'top')+' style="background:url(img/dragon.webp?v='+Game.version+') '+(-level.pic*48)+'px 0px;background-size:'+(frames*48)+'px 48px;" class="trophy"></div>';
				}
			}
			dragonStr+='<div style="clear:both;"></div>';
		}
		var ascensionModeStr='';
		var icon=Game.ascensionModes[Game.ascensionMode].icon;
		if (Game.resets>0) ascensionModeStr='<span style="cursor:pointer;" '+Game.getTooltip(
					'<div style="min-width:200px;text-align:center;font-size:11px;" id="tooltipChallengeMode">'+Game.ascensionModes[Game.ascensionMode].desc+'</div>'
					,'top')+'><div class="icon" style="display:inline-block;float:none;transform:scale(0.5);margin:-24px -16px -19px -8px;'+writeIcon(icon)+'"></div>'+Game.ascensionModes[Game.ascensionMode].dname+'</span>';
		
		var milkName=Game.Milk.name;
		
		var researchStr=Game.sayTime(Game.researchT,-1);
		var pledgeStr=Game.sayTime(Game.pledgeT,-1);
		var wrathStr='';
		if (Game.elderWrath==1) wrathStr=loc("awoken");
		else if (Game.elderWrath==2) wrathStr=loc("displeased");
		else if (Game.elderWrath==3) wrathStr=loc("angered");
		else if (Game.elderWrath==0 && Game.pledges>0) wrathStr=loc("appeased");
		
		var dropMult=Game.dropRateMult();
		
		var date=new Date();
		date.setTime(Date.now()-Game.startDate);
		var timeInSeconds=date.getTime()/1000;
		var startDate=Game.sayTime(timeInSeconds*Game.fps,-1);
		date.setTime(Date.now()-Game.fullDate);
		var fullDate=Game.sayTime(date.getTime()/1000*Game.fps,-1);
		if (!Game.fullDate || !fullDate || fullDate.length<1) fullDate=loc("a long while");
		/*date.setTime(new Date().getTime()-Game.lastDate);
		var lastDate=Game.sayTime(date.getTime()/1000*Game.fps,2);*/
		
		var heavenlyMult=Game.GetHeavenlyMultiplier();
		
		var seasonStr=Game.sayTime(Game.seasonT,-1);
		
		str+='<div class="section">'+(EN?"Statistics":loc("Stats"))+'</div>'+
		'<div class="subsection">'+
		'<div class="title">'+loc("General")+'</div>'+
		'<div id="statsGeneral">'+
			'<div class="listing"><b>'+loc("Cookies in bank:")+'</b> <div class="price plain">'+Game.tinyCookie()+Beautify(Game.cookies)+'</div></div>'+
			'<div class="listing"><b>'+loc("Cookies baked (this ascension):")+'</b> <div class="price plain">'+Game.tinyCookie()+Beautify(Game.cookiesEarned)+'</div></div>'+
			'<div class="listing"><b>'+loc("Cookies baked (all time):")+'</b> <div class="price plain">'+Game.tinyCookie()+Beautify(Game.cookiesEarned+Game.cookiesReset)+'</div></div>'+
			(Game.cookiesReset>0?'<div class="listing"><b>'+loc("Cookies forfeited by ascending:")+'</b> <div class="price plain">'+Game.tinyCookie()+Beautify(Game.cookiesReset)+'</div></div>':'')+
			(Game.resets?('<div class="listing"><b>'+loc("Legacy started:")+'</b> '+(fullDate==''?loc("just now"):loc("%1 ago",fullDate))+', '+loc("with %1 ascension",LBeautify(Game.resets))+'</div>'):'')+
			'<div class="listing"><b>'+loc("Run started:")+'</b> '+(startDate==''?loc("just now"):loc("%1 ago",startDate))+'</div>'+
			'<div class="listing"><b>'+loc("Buildings owned:")+'</b> '+Beautify(buildingsOwned)+'</div>'+
			'<div class="listing"><b>'+loc("Cookies per second:")+'</b> '+Beautify(Game.cookiesPs,1)+' <small>'+
				'('+loc("multiplier:")+' '+Beautify(Math.round(Game.globalCpsMult*100),1)+'%)'+
				(Game.cpsSucked>0?' <span class="warning">('+loc("withered:")+' '+Beautify(Math.round(Game.cpsSucked*100),1)+'%)</span>':'')+
				'</small></div>'+
			'<div class="listing"><b>'+loc("Raw cookies per second:")+'</b> '+Beautify(Game.cookiesPsRaw,1)+' <small>'+
				'('+loc("highest this ascension:")+' '+Beautify(Game.cookiesPsRawHighest,1)+')'+
				'</small></div>'+
			'<div class="listing"><b>'+loc("Cookies per click:")+'</b> '+Beautify(Game.computedMouseCps,1)+'</div>'+
			'<div class="listing"><b>'+loc("Cookie clicks:")+'</b> '+Beautify(Game.cookieClicks)+'</div>'+
			'<div class="listing"><b>'+loc("Hand-made cookies:")+'</b> '+Beautify(Game.handmadeCookies)+'</div>'+
			'<div class="listing"><b>'+loc("Golden cookie clicks:")+'</b> '+Beautify(Game.goldenClicksLocal)+' <small>('+loc("all time:")+' '+Beautify(Game.goldenClicks)+')</small></div>'+//' <span class="hidden">(<b>Missed golden cookies :</b> '+Beautify(Game.missedGoldenClicks)+')</span></div>'+
			(dropMult!=1?'<div class="listing"><b>'+loc("Random drop multiplier:")+'</b> <small>x</small>'+Beautify(dropMult,2)+'</div>':'')+
		'</div>'+
		'<br><div class="listing"><b>'+loc("Running version:")+'</b> '+Game.version.toFixed(3)+'</div>'+
		
		((researchStr!='' || wrathStr!='' || pledgeStr!='' || santaStr!='' || dragonStr!='' || Game.season!='' || ascensionModeStr!='' || Game.canLumps())?(
		'</div><div class="subsection">'+
		'<div class="title">'+loc("Special")+'</div>'+
		'<div id="statsSpecial">'+
			(ascensionModeStr!=''?'<div class="listing"><b>'+loc("Challenge mode:")+'</b>'+ascensionModeStr+'</div>':'')+
			(Game.season!=''?'<div class="listing"><b>'+loc("Seasonal event:")+'</b> '+Game.seasons[Game.season].name+
				(seasonStr!=''?' <small>('+loc("%1 remaining",seasonStr)+')</small>':'')+
			'</div>':'')+
			(EN && Game.season=='fools'?
				'<div class="listing"><b>Money made from selling cookies :</b> '+Beautify(Game.cookiesEarned*0.08,2)+' cookie dollars</div>'+
				(Game.Objects['Portal'].highest>0?'<div class="listing"><b>TV show seasons produced :</b> '+Beautify(Math.floor((timeInSeconds/60/60)*(Game.Objects['Portal'].highest*0.13)+1))+'</div>':'')
			:'')+
			(researchStr!=''?'<div class="listing"><b>'+loc("Research:")+'</b> '+loc("%1 remaining",researchStr)+'</div>':'')+
			(wrathStr!=''?'<div class="listing"><b>'+loc("Grandmatriarchs status:")+'</b> '+wrathStr+'</div>':'')+
			(pledgeStr!=''?'<div class="listing"><b>'+loc("Pledge:")+'</b> '+loc("%1 remaining",pledgeStr)+'</div>':'')+
			(Game.wrinklersPopped>0?'<div class="listing"><b>'+loc("Wrinklers popped:")+'</b> '+Beautify(Game.wrinklersPopped)+'</div>':'')+
			((Game.canLumps() && Game.lumpsTotal>-1)?'<div class="listing"><b>'+loc("Sugar lumps harvested:")+'</b> <div class="price lump plain">'+Beautify(Game.lumpsTotal)+'</div></div>':'')+
			//(Game.cookiesSucked>0?'<div class="listing warning"><b>Withered :</b> '+Beautify(Game.cookiesSucked)+' cookies</div>':'')+
			(Game.reindeerClicked>0?'<div class="listing"><b>'+loc("Reindeer found:")+'</b> '+Beautify(Game.reindeerClicked)+'</div>':'')+
			(santaStr!=''?'<div class="listing"><b>'+loc("Santa stages unlocked:")+'</b></div><div>'+santaStr+'</div>':'')+
			(dragonStr!=''?'<div class="listing"><b>'+loc("Dragon training:")+'</b></div><div>'+dragonStr+'</div>':'')+
		'</div>'
		):'')+
		((Game.prestige>0 || prestigeUpgrades!='')?(
		'</div><div class="subsection">'+
		'<div class="title">'+loc("Prestige")+'</div>'+
		'<div id="statsPrestige">'+
			'<div class="listing"><div class="icon" style="float:left;background-position:'+(-19*48)+'px '+(-7*48)+'px;"></div>'+
				'<div style="margin-top:8px;"><span class="title" style="font-size:22px;">'+loc("Prestige level:")+' '+Beautify(Game.prestige)+'</span> '+loc("at %1% of its potential <b>(+%2% CpS)</b>",[Beautify(heavenlyMult*100,1),Beautify(parseFloat(Game.prestige)*Game.heavenlyPower*heavenlyMult,1)])+'<br>'+loc("Heavenly chips:")+' <b>'+Beautify(Game.heavenlyChips)+'</b></div>'+
			'</div>'+
			(prestigeUpgrades!=''?(
			'<div class="listing" style="clear:left;"><b>'+loc("Prestige upgrades unlocked:")+'</b> '+prestigeUpgradesOwned+'/'+prestigeUpgradesTotal+' ('+Math.floor((prestigeUpgradesOwned/prestigeUpgradesTotal)*100)+'%)</div>'+
			'<div class="listing crateBox">'+prestigeUpgrades+'</div>'):'')+
		'</div>'
		):'')+

		'</div><div class="subsection">'+
		'<div class="title">'+loc("Upgrades")+'</div>'+
		'<div id="statsUpgrades">'+
			(hiddenUpgrades!=''?('<div class="listing"><b>Debug</b></div>'+
			'<div class="listing crateBox">'+hiddenUpgrades+'</div>'):'')+
			'<div class="listing"><b>'+loc("Upgrades unlocked:")+'</b> '+upgradesOwned+'/'+upgradesTotal+' ('+Math.floor((upgradesOwned/upgradesTotal)*100)+'%)</div>'+
			'<div class="listing crateBox">'+upgrades+'</div>'+
			(cookieUpgrades!=''?('<div class="listing"><b>'+loc("Cookies")+'</b></div>'+
			'<div class="listing crateBox">'+cookieUpgrades+'</div>'):'')+
		'</div>'+
		'</div><div class="subsection">'+
		'<div class="title">'+loc("Achievements")+'</div>'+
		'<div id="statsAchievs">'+
			'<div class="listing"><b>'+loc("Achievements unlocked:")+'</b> '+achievementsOwned+'/'+achievementsTotal+' ('+Math.floor((achievementsOwned/achievementsTotal)*100)+'%)'+(achievementsOwnedOther>0?('<span style="font-weight:bold;font-size:10px;color:#70a;"> (+'+achievementsOwnedOther+')</span>'):'')+'</div>'+
			(Game.cookiesMultByType['kittens']>1?('<div class="listing"><b>'+loc("Kitten multiplier:")+'</b> '+Beautify((Game.cookiesMultByType['kittens'])*100)+'%</div>'):'')+
			'<div class="listing"><b>'+loc("Milk")+':</b> '+milkName+'</div>'+
			(milkStr!=''?'<div class="listing"><b>'+loc("Milk flavors unlocked:")+'</b></div><div>'+milkStr+'</div>':'')+
			'<div class="listing"><small style="opacity:0.75;">('+loc("Milk is gained with each achievement. It can unlock unique upgrades over time.")+')</small></div>'+
			achievementsStr+
		'</div>'+
		'</div>'+
		'<div style="padding-bottom:128px;"></div>'
		;
	}
	//str='<div id="selectionKeeper" class="selectable">'+str+'</div>';
	l('menu').innerHTML=str;
	//CCSE-style mod menu hooks (see setupModding in systems/modding.ts):
	//called after the menu DOM is replaced, so they decorate the freshly
	//rendered menu (the CCSE framework injected at exactly this point).
	if (Game.customMenu) for (var i=0;i<Game.customMenu.length;i++) Game.customMenu[i]();
	if (Game.onMenu=='prefs' && Game.customOptionsMenu) for (var i=0;i<Game.customOptionsMenu.length;i++) Game.customOptionsMenu[i]();
	if (Game.onMenu=='stats' && Game.customStatsMenu) for (var i=0;i<Game.customStatsMenu.length;i++) Game.customStatsMenu[i]();
	if (Game.onMenu=='log' && Game.customInfoMenu) for (var i=0;i<Game.customInfoMenu.length;i++) Game.customInfoMenu[i]();
	if (Game.onMenu=='prefs') Game.RefreshBackupList();//CC3: populate the rolling backup history dropdown
	if (App)
	{
		var anchors=l('menu').getElementsByTagName('a');
		for (var i=0;i<anchors.length;i++)
		{
			var it=anchors[i];
			if (it.href)
			{
				console.log(it.href);
				AddEvent(it,'click',function(href: any){return function(){
					App.openLink(href);
				}}(it.href));
				it.removeAttribute('href');
			}
		}
	}
	/*AddEvent(l('selectionKeeper'),'mouseup',function(e){
		console.log('selection:',window.getSelection());
	});*/
}

