/**
 * systems/modding.ts — the engine's modding API (Phase 6, slice 3).
 *
 * The 2.048 engine wrapped the whole modding API in a top-level IIFE that
 * ran at module-eval time (`Game.mods={}`, `Game.registerMod`,
 * `Game.launchMods`, hooks, mod save/load, `Game.LoadMod=LoadScript`).
 * It is now `setupModding()`: the engine calls it at the exact original
 * position (top of the engine module), so timing is unchanged — it must
 * NOT run at import time, because it reads `LoadScript`, `replaceAll` and
 * `tinyIcon`, which only exist on `window` after the engine has evaluated.
 *
 * The body is verbatim (original indentation kept); only parameter
 * annotations were added (`:any` where call sites pass optional or
 * heterogeneous values). The dead `if (false)` example-mod block is kept
 * verbatim as documentation.
 *
 * Runtime imports: `Game` is imported from the typed core layer — the
 * original IIFE ran at module-eval time when `var Game={}` was a
 * module-scoped binding, so the verbatim body's bare `Game` reads must
 * resolve to the same singleton the engine mutates (NOT the window global,
 * which only exists after the engine's Object.assign shim runs at the
 * bottom of the module). `App`, `loc`, `tinyIcon`, `choose`,
 * `replaceAll`, `LoadScript`, `l` resolve through src/globals.d.ts.
 */

import { Game } from "../core/game";
import { LoadScript } from "../utils/dom";

export function setupModding()
{
	/*=====================================================================================
	MODDING API
	=======================================================================================*/
	/*
		to use:
		-(NOTE: this functions a little differently in the standalone/Steam version; have a look in the game's /mods folder for example mods - though most of the information below still applies)
		-have your mod call Game.registerMod("unique id",mod object)
		-the "unique id" value is a string the mod will use to index and retrieve its save data; special characters are ignored
		-the "mod object" value is an object structured like so:
			{
				init:function(){
					//this function is called as soon as the mod is registered
					//declare hooks here
				},
				save:function(){
					//use this to store persistent data associated with your mod
					return 'a string to be saved';
				},
				load:function(str){
					//do stuff with the string data you saved previously
				},
			}
		-the mod object may also contain any other data or functions you want, for instance to make them accessible to other mods
		-your mod and its data can be accessed with Game.mods['mod id']
		-hooks are functions the game calls automatically in certain circumstances, like when calculating cookies per click or when redrawing the screen
		-to add a hook: Game.registerHook('hook id',yourFunctionHere) - note: you can also declare whole arrays of hooks, ie. Game.registerHook('hook id',[function1,function2,...])
		-to remove a hook: Game.removeHook('hook id',theSameFunctionHere)
		-some hooks are fed a parameter you can use in the function
		-list of valid hook ids:
			'logic' - called every logic tick
			'draw' - called every draw tick
			'reset' - called whenever the player resets; parameter is true if this is a hard reset, false if it's an ascension
			'reincarnate' - called when the player has reincarnated after an ascension
			'ticker' - called when determining news ticker text; should return an array of possible choices to add
			'cps' - called when determining the CpS; parameter is the current CpS; should return the modified CpS
			'cookiesPerClick' - called when determining the cookies per click; parameter is the current value; should return the modified value
			'click' - called when the big cookie is clicked
			'create' - called after the game declares all buildings, buffs, upgrades and achievs; use this to declare your own - note that while the game distinguishes between vanilla and non-vanilla content, saving/loading functionality for custom content (including stuff like active buffs or permanent upgrade slotting) is not explicitly implemented and may be unpredictable and broken
			'check' - called every few seconds when we check for upgrade/achiev unlock conditions; you can also use this for other checks that you don't need happening every logic frame
		-function hooks are provided for convenience and more advanced mod functionality will probably involve manual code injection
		-please be mindful of the length of the data you save, as it does inflate the export-save-to-string feature
		
		NOTE: modding API is susceptible to change and may not always function super-well
	*/
	Game.mods={};
	Game.sortedMods=[];
	Game.brokenMods=[];
	Game.modSaveData={};
	Game.modHooks={};
	Game.modHooksNames=['logic','draw','reset','reincarnate','ticker','cps','cookiesPerClick','click','create','check'];
	for (var i=0;i<Game.modHooksNames.length;i++){Game.modHooks[Game.modHooksNames[i]]=[];}
	Game.registerMod=function(id: any,mod: any): any
	{
		id=id.replace(/\W+/g,' ');
		if (id=='META') return false;
		if (Game.mods[id]) {console.log('ERROR: mod already registered with the id "'+id+'".');return false;}
		Game.mods[id]=mod;
		Game.sortedMods.push(mod);
		mod.id=id;
		mod.name=mod.name||id;
		if (App) App.registerMod(mod);
		console.log('Mod "'+id+'" added.');
		if (Game.ready && mod.init)
		{
			if (!App && Game.Win) Game.Win('Third-party');
			mod.init();
			if (mod.load && Game.modSaveData[id]) mod.load(Game.modSaveData[id]);
			mod.init=0;
		}
	}
	Game.launchMods=function()
	{
		if (Game.brokenMods.length>0)
		{
			Game.Notify('<span class="warning">'+loc("Some mods couldn't be loaded:")+'</span>','['+Game.brokenMods.join(', ')+']',[32,17]);
		}
		for (var i=0;i<Game.sortedMods.length;i++)
		{
			var mod=Game.sortedMods[i];
			if (mod.init)
			{
				console.log('===initializing mod',mod.id);
				mod.init();
				mod.init=0;
				//if (mod.load && Game.modSaveData[mod.id]) mod.load(Game.modSaveData[mod.id]);
			}
		}
		if (!App && Game.sortedMods.length>0) Game.Win('Third-party');
	}
	Game.registerHook=function(hook: any,func: any)
	{
		if (func.constructor===Array)
		{
			for (var i=0;i<func.length;i++){Game.registerHook(hook,func[i]);}
			return;
		}
		if (typeof func!=='function') return;
		if (typeof Game.modHooks[hook]!=='undefined') Game.modHooks[hook].push(func);
		else console.log('Error: a mod tried to register a non-existent hook named "'+hook+'".');
	}
	Game.removeHook=function(hook: any,func: any)
	{
		if (func.constructor===Array)
		{
			for (var i=0;i<func.length;i++){Game.removeHook(hook,func[i]);}
			return;
		}
		if (typeof func!=='function') return;
		if (typeof Game.modHooks[hook]!=='undefined' && Game.modHooks[hook].indexOf(func)!=-1) Game.modHooks[hook].splice(Game.modHooks[hook].indexOf(func),1);
		else console.log('Error: a mod tried to remove a non-existent hook named "'+hook+'".');
	}
	Game.runModHook=function(hook: any,param: any)
	{
		for (var i=0;i<Game.modHooks[hook].length;i++)
		{
			Game.modHooks[hook][i](param);
		}
	}
	Game.runModHookOnValue=function(hook: any,val: any)
	{
		for (var i=0;i<Game.modHooks[hook].length;i++)
		{
			val=Game.modHooks[hook][i](val);
		}
		return val;
	}
	Game.safeSaveString=function(str: any)
	{
		//look as long as it works
		str=replaceAll('|','[P]',str);
		str=replaceAll(';','[S]',str);
		return str;
	}
	Game.safeLoadString=function(str: any)
	{
		str=replaceAll('[P]','|',str);
		str=replaceAll('[S]',';',str);
		return str;
	}
	Game.saveModData=function()
	{
		var str='';
		for (var i=0;i<Game.sortedMods.length;i++)
		{
			if (Game.sortedMods[i]['save'])
			{
				var data=(Game.sortedMods[i] as any)['save']();
				if (typeof data!=='undefined') Game.modSaveData[(Game.sortedMods[i] as any).id]=data;
			}
		}
		for (var key in Game.modSaveData)
		{
			str+=key+':'+Game.safeSaveString(Game.modSaveData[key])+';';
		}
		if (App && App.saveMods) str+=App.saveMods();
		return str;
	}
	Game.loadModData=function()
	{
		for (var i in Game.modSaveData)
		{
			if (Game.mods[i] && (Game.mods[i] as any)['load']) (Game.mods[i] as any)['load'](Game.modSaveData[i]);
		}
	}
	Game.deleteModData=function(id: any)
	{
		if (Game.modSaveData[id]) delete Game.modSaveData[id];
	}
	Game.deleteAllModData=function()
	{
		Game.modSaveData={};
	}
	Game.CheckModData=function()
	{
		var modsN=0;
		var str='';
		for (var i in Game.modSaveData)
		{
			str+='<div style="border-bottom:1px dashed rgba(255,255,255,0.2);clear:both;overflow:hidden;padding:4px 0px;">';
				str+='<div style="float:left;width:49%;text-align:left;overflow:hidden;"><b>'+i+'</b>';
					if (Game.mods[i]) str+=' '+loc("(loaded)");
				str+='</div>';
				str+='<div style="float:right;width:49%;text-align:right;overflow:hidden;">'+loc("%1 char",Game.modSaveData[i].length)+' <a class="option warning" style="padding:0px 2px;font-size:10px;margin:0px;vertical-align:top;" '+Game.clickStr+'="Game.deleteModData(\''+i+'\');PlaySound(\'snd/tick.mp3\');Game.ClosePrompt();Game.CheckModData();">X</a>';
				str+='</div>';
			str+='</div>';
			modsN++;
		}
		if (modsN==0) str+=loc("No mod data present.");
		else str+='<div><a class="option warning" style="font-size:11px;margin-top:4px;" '+Game.clickStr+'="Game.deleteAllModData();PlaySound(\'snd/tick.mp3\');Game.ClosePrompt();Game.CheckModData();">'+loc("Delete all")+'</a></div>';
		Game.Prompt('<id ModData><h3>'+loc("Mod data")+'</h3><div class="block">'+tinyIcon([16,5])+'<div></div>'+loc("These are the mods present in your save data. You may delete some of this data to make your save file smaller.")+'</div><div class="block" style="font-size:11px;">'+str+'</div>',[loc("Back")]);
	}
	
	Game.LoadMod=LoadScript;//loads the mod at the given URL
	
	if (false)
	{
		//EXAMPLE MOD
		Game.registerMod('test mod',{
			/*
				what this example mod does:
				-double your CpS
				-display a little popup for half a second whenever you click the big cookie
				-add a little intro text above your bakery name, and generate that intro text at random if you don't already have one
				-save and load your intro text
			*/
			init:function(){
				Game.registerHook('reincarnate',function(){Game.mods['test mod'].addIntro();});
				Game.registerHook('check',function(){if (!Game.playerIntro){Game.mods['test mod'].addIntro();}});
				Game.registerHook('click',function(){Game.Notify(choose(['A good click.','A solid click.','A mediocre click.','An excellent click!']),'',0,0.5);});
				Game.registerHook('cps',function(cps: any){return cps*2;} as any);
			},
			save:function(){
				//note: we use stringified JSON for ease and clarity but you could store any type of string
				return JSON.stringify({text:Game.playerIntro})
			},
			load:function(str: any){
				var data=JSON.parse(str);
				if (data.text) Game.mods['test mod'].addIntro(data.text);
			},
			addIntro:function(text: any){
				//note: this is not a mod hook, just a function that's part of the mod
				Game.playerIntro=text||choose(['oh snap, it\'s','watch out, it\'s','oh no! here comes','hide your cookies, for here comes','behold! it\'s']);
				if (!l('bakerySubtitle')) l('bakeryName').insertAdjacentHTML('afterend','<div id="bakerySubtitle" class="title" style="text-align:center;position:absolute;left:0px;right:0px;bottom:32px;font-size:12px;pointer-events:none;text-shadow:0px 1px 1px #000,0px 0px 4px #f00;opacity:0.8;"></div>');
				l('bakerySubtitle').textContent='~'+Game.playerIntro+'~';
			},
		});
	}
	
	//replacing an existing canvas picture with a new one at runtime : Game.Loader.Replace('perfectCookie.webp','imperfectCookie.webp');
	//upgrades and achievements can use other pictures than icons.png; declare their icon with [posX,posY,'http://example.com/myIcons.png']
	//check out the "UNLOCKING STUFF" section to see how unlocking achievs and upgrades is done
}
