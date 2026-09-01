/* CC3 rewrite (phase 6): engine typed. */
/* CC3 rewrite: typed content layer, extracted from this file incrementally. */
import { TIERS } from './content/tiers';
import { declareVanillaBuildings } from './content/buildings';
import { declareVanillaUpgrades } from './content/upgrades';
import { declareVanillaAchievements } from './content/achievements';
import { declareVanillaFoolObjects } from "./content/foolObjects";
/* CC3 rewrite (phase 3): the Game singleton is now a real class instance from the typed core layer. */
import { Game } from "./core/game";
import { Building } from "./core/building";
import { Upgrade, TieredUpgrade, SynergyUpgrade } from "./core/upgrade";
import { HowMuchPrestige, HowManyCookiesReset, EarnHeavenlyChips, GetHeavenlyMultiplier, ComputeCps, GetTieredCpsMult } from "./systems/economy";
import { ValidateContent, GetEconomyReport, SimulateEconomy, AnalyzeEconomy, SimulateStrategy } from "./systems/contentValidation";
import { ExportSave, ImportSave, ImportSaveCode, FileSave, FileLoad, WriteSave, salvageSave, LoadSave } from "./systems/save";
import { CaptureSave, ListBackups, RestoreBackup, DownloadBackup, RefreshBackupList } from "./systems/backup";
import { CreateMusic } from "./systems/music";
import { Shimmer, updateShimmers, killShimmers } from "./systems/shimmer";
import { getWrinklersMax, ResetWrinklers, CollectWrinklers, playWrinklerSquishSound, SpawnWrinkler, PopRandomWrinkler, UpdateWrinklers, DrawWrinklers, SaveWrinklers, LoadWrinklers } from "./systems/wrinkler";
import { UpdateAscensionModePrompt, PickAscensionMode, UpdateAscendIntro, UpdateReincarnateIntro, Reincarnate, Ascend, AscendBrowseView, AscendBrowseClose, UpdateAscend, AscendRefocus, PurchaseHeavenlyUpgrade, BuildAscendTree, lumpTooltip, computeLumpTimes, loadLumps, gainLumps, clickLump, harvestLumps, computeLumpType, canLumps, getLumpRefillMax, getLumpRefillRemaining, canRefillLump, refillLump, spendLump, doLumps, SaveHeavenlyLayout, ToggleArrangeHeavenly, ResetHeavenlyLayout } from "./systems/ascend";
/* CC3 rewrite (phase 6, slice 2): pure utils extracted to engine/utils/. */
import { l, choose, escapeRegExp, replaceAll, cap, romanize, randomFloor, shuffle } from "./utils/helpers";
import { formatEveryThirdPower, rawFormatter, formatLong, prefixes, suffixes, formatShort, numberFormatters, Beautify, shortenNumber, SimpleBeautify, beautifyInTextFilter, BeautifyInTextFunction, BeautifyInText, BeautifyAll } from "./utils/format";
import { utf8_to_b64, b64_to_utf8, CompressBin, UncompressBin, CompressLargeBin, UncompressLargeBin, pack, unpack, pack2, unpack2, pack3 } from "./utils/encoding";
import { AddEvent, RemoveEvent, FireEvent, writeIcon, tinyIcon, LoadScript } from "./utils/dom";
import { sayTime } from "./utils/time";
/* CC3 rewrite (phase 6, slice 3): systems + UI extracted to typed modules. */
import { gainBuff, hasBuff, updateBuffs, killBuff, killBuffs, buffType, declareVanillaBuffs, buffTypes, buffTypesByName } from "./systems/buffs";
import { UpdateTicker, getNewTicker, TickerDraw } from "./systems/ticker";
import { UpgradeSanta, ClickSpecialPic, santaLevels } from "./systems/santa";
import { hasAura, auraMult, SelectDragonAura, UpgradeDragon } from "./systems/dragon";
import { shimmerTypes, goldenCookieChoices, goldenCookieBuildingBuffs } from "./systems/shimmerTypes";
import { ToggleSpecialMenu, DrawSpecial } from "./systems/specialMenu";
import { Note, CloseNote, CloseNotes, UpdateNotes, NotesLogic, NotesDraw, Notify, NotifyTooltip, UpdatePrompt, Prompt, ClosePrompt, ConfirmPrompt, FocusPromptOption } from "./ui/notifications";
import { particlesUpdate, particleAdd, particlesDraw, textParticlesUpdate, textParticlesAdd, Popup, SparkleAt, SparkleOn } from "./ui/particles";

import { RandomBakeryName, GetBakeryName, bakeryNameSet, bakeryNameRefresh, bakeryNamePrompt, bakeryNamePromptRandom } from "./systems/bakeryName";
import { GetHowManyHalloweenDrops, GetHowManyHeartDrops, GetHowManyEggs, DropEgg, GetHowManySantaDrops, GetHowManyReindeerDrops, saySeasonSwitchUses, computeSeasonPrices, computeSeasons, getSeasonDuration } from "./systems/seasons";
import { setupModding } from "./systems/modding";
import { Reset, HardReset } from "./systems/reset";

import { tooltipDraw, tooltipUpdate, tooltipHide, tooltipWobble, getTooltip, getDynamicTooltip, attachTooltip } from "./ui/tooltip";
import { crate, crateTooltip, costDetails } from "./ui/crate";
import { modifyBuildingPrice, storeBulkButton, BuildStore, ClickProduct, RefreshStore } from "./ui/store";
import { ShowMenu, tinyCookie, ClickTinyCookie, setVolume, setVolumeMusic, setWubMusic, showLangSelection, UpdateMenu } from "./ui/menu";
import { DrawBackground } from "./ui/drawBackground";/* CC3: the original relied on implicit globals; declare them for module strict mode. */

import { declareVanillaMilks } from "./content/milks";
import { declareVanillaChangelog } from "./content/changelog";
import { computeHeavenlyLayout, applyHeavenlyPreset, syncHeavenlyLayoutIfStale, HEAVENLY_PRESETS } from "./systems/heavenlyLayout";
import { debugStr, Debug } from "./utils/debug";
var Audio: any, localStorageGet: any, localStorageSet: any, Music: any, PlayCue: any, TopBarOffset: any, LASTHEAVENLYSELECTED: any, ON: any, OFF: any;
/* CC3 rewrite (slice 3): the vanilla-content order/pool/power bookkeeping.
 * Originally Init-scoped closure vars read by the Game.Upgrade /
 * Game.Achievement ctors and mutated by the upgrade declarations; the
 * declarations now run in content/upgrades.ts, so this state lives at
 * module scope and is bridged to the content module through window
 * accessors (bottom of this file, next to the window shim). */
var order: any, pool: any, power: any;

/*
All this code is copyright Orteil, 2013-2022.
	-with some help, advice and fixes by Nicholas Laux, Debugbro, Opti, the folks at Playsaurus, and lots of people on reddit, Discord, and the DashNet forums
	-also includes a bunch of snippets found on stackoverflow.com and others
	-want to mod the game? scroll down to the "MODDING API" section
Hello, and welcome to the joyous mess that is main.js. Code contained herein is not guaranteed to be good, consistent, or sane. Most of this is years old at this point and harkens back to simpler, cruder times. In particular I've tried to maintain compatibility with fairly old versions of javascript, which means luxuries such as 'let', arrow functions and string literals are unavailable.
As Cookie Clicker is rife with puns and tricky wordplay, localization was never intended to be possible - but ended up happening anyway as part of the Steam port. As a result, usage of strings is somewhat unorthodox in some places.
Have a nice trip, and stay safe.
Spoilers ahead.
http://orteil.dashnet.org
*/

/*=====================================================================================
MISC HELPER FUNCTIONS
=======================================================================================*/	//disable sounds coming from soundjay.com (sorry)
	//CC3 fix: the module-scope `var Audio` (line 50) shadows the browser global, so
	//`typeof Audio` is 'undefined' here and realAudio fell back to the no-op
	//`function(){return {}}` — every `new Audio(url)` then returned a dead plain
	//object and no sound ever played. Capture the real constructor explicitly.
	var realAudio: any=typeof window.Audio!=='undefined'?window.Audio:function(){return {}};//backup real audio
Audio=function(this: any,src: any){
	if (src && src.indexOf('soundjay')>-1) {Game.Popup('Sorry, no sounds hotlinked from soundjay.com.');this.play=function(){};}
	else return new realAudio(src);
};

if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(needle: any) {
        for(var i = 0; i < this.length; i++) {
            if(this[i] === needle) {return i;}
        }
        return -1;
    };
}

Element.prototype.getBounds=function(){
	// CC3: getBoundingClientRect() returns an immutable DOMRect in
	// modern browsers; compute scaled values in a fresh plain object.
	var r=this.getBoundingClientRect();
	var s=Game.scale;
	return {x:r.x/s,y:r.y/s,width:r.width/s,height:r.height/s,top:r.top/s,bottom:r.bottom/s,left:r.left/s,right:r.right/s};
};

localStorageGet=function(key: any)
{
	var local: any=0;
	try {local=window.localStorage.getItem(key);} catch (exception) {}
	return local;
}
localStorageSet=function(key: any,str: any)
{
	var local: any=0;
	try {local=window.localStorage.setItem(key,str);} catch (exception) {}
	return local;
}


var ajax=function(url: any,callback: any)
{
	var httpRequest=new XMLHttpRequest();
	if (!httpRequest){return false;}
	httpRequest.onreadystatechange=function()
	{
		try{
			if (httpRequest.readyState===XMLHttpRequest.DONE && httpRequest.status===200)
			{
				callback(httpRequest.responseText);
			}
		}catch(e){}
	}
	//httpRequest.onerror=function(e){console.log('ERROR',e);}
	if (url.indexOf('?')==-1) url+='?'; else url+='&';
	url+='nocache='+Date.now();
	httpRequest.open('GET',url);
	httpRequest.setRequestHeader('Content-Type','text/plain');
	httpRequest.overrideMimeType('text/plain');
	httpRequest.send();
	return true;
}

function toFixed(x: any)
{
	if (Math.abs(x) < 1.0) {
		var e = parseInt(x.toString().split('e-')[1]);
		if (e) {
			x *= Math.pow(10,e-1);
			x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
		}
	} else {
		var e = parseInt(x.toString().split('+')[1]);
		if (e > 20) {
			e -= 20;
			x /= Math.pow(10,e);
			x += (new Array(e+1)).join('0');
		}
	}
	return x;
}

//Beautify and number-formatting adapted from the Frozen Cookies add-on (http://cookieclicker.wikia.com/wiki/Frozen_Cookies_%28JavaScript_Add-on%29)
//=== LOCALIZATION ===

var locStrings: any={};
var locStringsFallback: any={};
var locId='NONE';
var EN=true;
var locName='none';
var locPatches: any[]=[];
var locPlur: any='nplurals=2;plural=(n!=1);';//see http://docs.translatehouse.org/projects/localization-guide/en/latest/l10n/pluralforms.html
var locPlurFallback=locPlur;
//note : plural index will be downgraded to the last matching, ie. in this case, if we get "0" but don't have a 3rd option, use the 2nd option (or 1st, lacking that too)
var locStringsByPart: any={};
var FindLocStringByPart=function(match: any)
{
	return locStringsByPart[match]||undefined;
	/*
	//note: slow, only do this on init
	for (var i in locStrings){
		var bit=i.split(']');
		if (bit[0].substring(1)==match) return i;
	}
	return undefined;
	*/
}

var Langs: any={
	'EN':{file:'EN',nameEN:'English',name:'English',changeLanguage:'Language',icon:0,w:1,isEN:true},
	'FR':{file:'FR',nameEN:'French',name:'Fran&ccedil;ais',changeLanguage:'Langue',icon:0,w:1},
	'DE':{file:'DE',nameEN:'German',name:'Deutsch',changeLanguage:'Sprache',icon:0,w:1},
	'NL':{file:'NL',nameEN:'Dutch',name:'Nederlands',changeLanguage:'Taal',icon:0,w:1},
	'CS':{file:'CS',nameEN:'Czech',name:'&#x10C;e&#x161;tina',changeLanguage:'Jazyk',icon:0,w:1},
	'PL':{file:'PL',nameEN:'Polish',name:'Polski',changeLanguage:'J&#281;zyk',icon:0,w:1},
	'IT':{file:'IT',nameEN:'Italian',name:'Italiano',changeLanguage:'Lingua',icon:0,w:1},
	'ES':{file:'ES',nameEN:'Spanish',name:'Espa&#xF1;ol',changeLanguage:'Idioma',icon:0,w:1},
	'PT-BR':{file:'PT-BR',nameEN:'Portuguese',name:'Portugu&#xEA;s',changeLanguage:'Idioma',icon:0,w:1},
	'JA':{file:'JA',nameEN:'Japanese',name:'&#x65E5;&#x672C;&#x8A9E;',changeLanguage:'&#35328;&#35486;',icon:0,w:1.5},
	'ZH-CN':{file:'ZH-CN',nameEN:'Chinese',name:'&#x4E2D;&#x6587;',changeLanguage:'&#35821;&#35328;',icon:0,w:1.5},
	'KO':{file:'KO',nameEN:'Korean',name:'&#xD55C;&#xAE00;',changeLanguage:'&#xC5B8;&#xC5B4;',icon:0,w:1.5},
	'RU':{file:'RU',nameEN:'Russian',name:'&#x420;&#x443;&#x441;&#x441;&#x43A;&#x438;&#x439;',changeLanguage:'&#1071;&#1079;&#1099;&#1082;',icon:0,w:1.2},
};

//note : baseline should be the original english text
//in several instances, the english text will be quite different from the other languages, as this game was initially never meant to be translated and the translation process doesn't always play well with complex sentence structures
/*use:
	loc('Plain text')
	loc('Text where %1 is a parameter','something')
	loc('Text where %1 and %2 are parameters',['a thing','another thing'])
	loc('There is %1 apple',5)
		 ...if the localized string is an array, this is parsed as a pluralized string; for instance, the localized string could be
		"There is %1 apple":[
			"There is %1 apple",
			"There are %1 apples"
		]
	loc('There is %1 apple and also, %2!',[5,'hello'])
	loc('This string is localized.',0,'This is the string displayed in the english version.')
	loc('You have %1.','<b>'+loc('%1 apple',LBeautify(amount))+'</b>')
		...you may nest localized strings, and use LBeautify() to pack Beautified values
*/
var locBlink=false;
var localizationNotFound: any[]=[];
var loc=function(id: any, params?: any, baseline?: any)
{
	var fallback=false;
	var found=locStrings[id];
	if (!found) {found=locStringsFallback[id];fallback=true;}
	var str: any='';
	if (found)
	{
		str=parseLoc(found,params);
		//return str;
		if (str.constructor===Array) return str;
		if (locBlink && !fallback) return '<span class="blinking">'+str+'</span>';//will make every localized text blink on screen, making omissions obvious; will not work for elements filled with textContent
	}
	
	//if ((fallback || !found) && localizationNotFound.length<20 && localizationNotFound.indexOf(id)==-1){localizationNotFound.push(id);console.trace('localization string not found: ',id);}
	if (found) return str;
	//CC3: an unknown id (a CC3-native string not present in any language
	//table) still gets its %N params substituted into the baseline (or the
	//English source id), so placeholder strings render their values instead
	//of showing a raw "%1".
	return parseLoc(baseline||id,params);
}

var parseLoc=function(str: any, params?: any)
{
	/*
		parses localization strings
		-there can only be 1 plural per string and it MUST be at index %1
		-a pluralized string is detected if we have at least 1 param and the matching localized string is an array
	*/
	if (typeof params==='undefined') params=[];
	else if (params.constructor!==Array) params=[params];
	if (!str) return '';
	//if (str.constructor===Array) return str;
	//if (typeof str==='function') return str(params);
	//str=str.replace(/[\t\n\r]/gm,'');
	
	if (params.length==0) return str;
	
	if (str.constructor===Array)
	{
		if (typeof params[0]==='object')//an object containing a beautified number
		{
			var plurIndex=locPlur(params[0].n);
			plurIndex=Math.min(str.length-1,plurIndex);
			str=str[plurIndex];
			str=replaceAll('%1',params[0].b,str);
		}
		else
		{
			var plurIndex=locPlur(params[0]);
			plurIndex=Math.min(str.length-1,plurIndex);
			str=str[plurIndex];
			str=replaceAll('%1',params[0],str);
		}
	}
	
	var out='';
	var len=str.length;
	var inPercent=false;
	for (var i=0;i<len;i++)
	{
		var it=str[i];
		if (inPercent)
		{
			inPercent=false;
			if (!isNaN(it) && params.length>=parseInt(it)-1) out+=params[parseInt(it)-1];
			else out+='%'+it;
		}
		else if (it=='%') inPercent=true;
		else out+=it;
	}
	return out;
}

var LBeautify=function(val: any, floats?: any)
{
	//returns an object in the form {n:original value floored,b:beautified value as string} for localization purposes
	return {n:Math.floor(Math.abs(val)),b:Beautify(val,floats)};
}

var ModLanguage=function(id: any, json: any){
	if (id=='*') id=locId;
	if (id!=locId || !Langs[id]) return false;
	if (json['REPLACE ALL'])
	{
		var rep=function(str: any,from: any,to: any)
		{
			var regex=new RegExp(from,'ig');
			return str.replace(regex,function(match: any){
				return (match[0]==match[0].toLowerCase())?to:cap(to);
			});
		}
		for (var i in json['REPLACE ALL'])
		{
			var to=json['REPLACE ALL'][i];
			for (var ii in locStrings)
			{
				if (Array.isArray(locStrings[ii]))
				{
					for (var iii in locStrings[ii])
					{
						locStrings[ii][iii]=rep(locStrings[ii][iii],i,to);
					}
				}
				else locStrings[ii]=rep(locStrings[ii],i,to);
			}
		}
	}
	delete json['REPLACE ALL'];
	AddLanguage(id,Langs[id].name,json,true);
}

var AddLanguage=function(id: any, _name: any, json: any, mod: any)
{
	//used in loc files
	//if mod is true, this file is augmenting the current language
	if (id==locId && !mod) return false;//don't load twice
	if (!Langs[id]) return false;
	locId=id;
	if (Langs[locId].isEN) EN=true; else EN=false;
	locName=Langs[id].nameEN;//name
	
	if (mod)
	{
		for (var i in json)
		{
			locStrings[i]=json[i];
		}
		for (var i in locStrings)
		{
			var bit=i.split(']');
			if (bit[1] && bit[0].indexOf('[COMMENT:')!=0 && !locStringsByPart[bit[0].substring(1)]) locStringsByPart[bit[0].substring(1)]=i;
		}
		console.log('Augmented language "'+locName+'".');
	}
	else
	{
		locStrings=json;
		locPlur=json['']['plural-forms']||locPlurFallback;
		delete locStrings[''];
		for (var i in locStrings)
		{
			if (locStrings[i]=='/') locStrings[i]=i;
		}
		
		locPlur=(function(plural_form: any){
			//lifted and modified from gettext.js
			var pf_re=new RegExp('^\\s*nplurals\\s*=\\s*[0-9]+\\s*;\\s*plural\\s*=\\s*(?:\\s|[-\\?\\|&=!<>+*/%:;n0-9_\(\)])+');
			if (!pf_re.test(plural_form))
			throw new Error('The plural form "'+plural_form+'" is not valid');
			return new Function('n','var plural, nplurals; '+ plural_form +' return plural;');
			//return new Function('n','var plural, nplurals; '+ plural_form +' return { nplurals: nplurals, plural: (plural === true ? 1 : (plural ? plural : 0)) };');
		})(locPlur);
		
		locPatches=[];
		for (var i in locStrings){
			if (i.split('|')[0]=='Update notes')
			{
				var patch=i.split('|');
				var patchTranslated=locStrings[i].split('|');
				locPatches.push({id:parseInt(patch[1]),type:1,title:patchTranslated[2],points:patchTranslated.slice(3)})
			}
		}
		var sortMap=function(a: any,b: any)
		{
			if (a.id<b.id) return 1;
			else return -1;
		}
		locPatches.sort(sortMap);
		
		for (var i in locStrings)
		{
			var bit=i.split(']');
			if (bit[1] && bit[0].indexOf('[COMMENT:')!=0 && !locStringsByPart[bit[0].substring(1)]) locStringsByPart[bit[0].substring(1)]=i;
		}
		
		console.log('Loaded language "'+locName+'".');
	}
}

var LoadLang=LoadScript;

var LocalizeUpgradesAndAchievs=function()
{
	if (!Game.UpgradesById) return false;
	
	var allThings=[];
	for (var key in Game.UpgradesById){allThings.push(Game.UpgradesById[key]);}
	for (var key in Game.AchievementsById){allThings.push(Game.AchievementsById[key]);}
	for (var i=0;i<allThings.length;i++)
	{
		var it=allThings[i];
		var type=it.getType();
		var found=0;
		found=FindLocStringByPart(type+' name '+it.id);
		if (found) it.dname=loc(found);
		
		if (!EN) it.baseDesc=it.baseDesc.replace(/<q>.*/,'');//strip quote section
		it.ddesc=BeautifyInText(it.baseDesc);
		
		found=FindLocStringByPart(type+' desc '+it.id);
		if (found) it.ddesc=loc(found);
		found=FindLocStringByPart(type+' quote '+it.id);
		if (found) it.ddesc+='<q>'+loc(found)+'</q>';
	}
	BeautifyAll();
}
var getUpgradeName=function(name: any)
{
	var it=Game.Upgrades[name];
	var found=FindLocStringByPart('Upgrade name '+it.id);
	if (found) return loc(found); else return name;
}
var getAchievementName=function(name: any)
{
	var it=Game.Achievements[name];
	var found=FindLocStringByPart('Achievement name '+it.id);
	if (found) return loc(found); else return name;
}



//these are faulty, investigate later
//function utf8_to_b64(str){return btoa(str);}
//function b64_to_utf8(str){return atob(str);}

/*function utf8_to_b64( str ) {
	try{return Base64.encode(unescape(encodeURIComponent( str )));}
	catch(err)
	{return '';}
}

function b64_to_utf8( str ) {
	try{return decodeURIComponent(escape(Base64.decode( str )));}
	catch(err)
	{return '';}
}*/

//file save function from https://github.com/eligrey/FileSaver.js
var saveAs: any=saveAs||function(view: any){"use strict";if(typeof navigator!=="undefined"&&/MSIE [1-9]\./.test(navigator.userAgent)){return}var doc=view.document,get_URL=function(){return view.URL||view.webkitURL||view},save_link=doc.createElementNS("http://www.w3.org/1999/xhtml","a"),can_use_save_link="download"in save_link,click=function(node: any){var event=new MouseEvent("click");node.dispatchEvent(event)},is_safari=/Version\/[\d\.]+.*Safari/.test(navigator.userAgent),webkit_req_fs=view.webkitRequestFileSystem,req_fs=view.requestFileSystem||webkit_req_fs||view.mozRequestFileSystem,throw_outside=function(ex: any){(view.setImmediate||view.setTimeout)(function(){throw ex},0)},force_saveable_type="application/octet-stream",fs_min_size=0,arbitrary_revoke_timeout=500,revoke=function(file: any){var revoker=function(){if(typeof file==="string"){get_URL().revokeObjectURL(file)}else{file.remove()}};if(view.chrome){revoker()}else{setTimeout(revoker,arbitrary_revoke_timeout)}},dispatch=function(filesaver: any,event_types: any,event?: any){event_types=[].concat(event_types);var i=event_types.length;while(i--){var listener=filesaver["on"+event_types[i]];if(typeof listener==="function"){try{listener.call(filesaver,event||filesaver)}catch(ex){throw_outside(ex)}}}},auto_bom=function(blob: any){if(/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)){return new Blob(["\ufeff",blob],{type:blob.type})}return blob},FileSaver: any=function(this: any,blob: any,name: any,no_auto_bom: any){if(!no_auto_bom){blob=auto_bom(blob)}var filesaver=this,type=blob.type,blob_changed=false,object_url: any,target_view: any,dispatch_all=function(){dispatch(filesaver,"writestart progress write writeend".split(" "))},fs_error=function(){if(target_view&&is_safari&&typeof FileReader!=="undefined"){var reader=new FileReader;reader.onloadend=function(){var base64Data: any=reader.result;target_view.location.href="data:attachment/file"+base64Data.slice(base64Data.search(/[,;]/));filesaver.readyState=filesaver.DONE;dispatch_all()};reader.readAsDataURL(blob);filesaver.readyState=filesaver.INIT;return}if(blob_changed||!object_url){object_url=get_URL().createObjectURL(blob)}if(target_view){target_view.location.href=object_url}else{var new_tab=view.open(object_url,"_blank");if(new_tab==undefined&&is_safari){view.location.href=object_url}}filesaver.readyState=filesaver.DONE;dispatch_all();revoke(object_url)},abortable=function(func: any){return function(this: any){if(filesaver.readyState!==filesaver.DONE){return func.apply(this,arguments)}}},create_if_not_found={create:true,exclusive:false},slice;filesaver.readyState=filesaver.INIT;if(!name){name="download"}if(can_use_save_link){object_url=get_URL().createObjectURL(blob);setTimeout(function(){save_link.href=object_url;save_link.download=name;click(save_link);dispatch_all();revoke(object_url);filesaver.readyState=filesaver.DONE});return}if(view.chrome&&type&&type!==force_saveable_type){slice=blob.slice||blob.webkitSlice;blob=slice.call(blob,0,blob.size,force_saveable_type);blob_changed=true}if(webkit_req_fs&&name!=="download"){name+=".download"}if(type===force_saveable_type||webkit_req_fs){target_view=view}if(!req_fs){fs_error();return}fs_min_size+=blob.size;req_fs(view.TEMPORARY,fs_min_size,abortable(function(fs: any){fs.root.getDirectory("saved",create_if_not_found,abortable(function(dir: any){var save=function(){dir.getFile(name,create_if_not_found,abortable(function(file: any){file.createWriter(abortable(function(writer: any){writer.onwriteend=function(event: any){target_view.location.href=file.toURL();filesaver.readyState=filesaver.DONE;dispatch(filesaver,"writeend",event);revoke(file)};writer.onerror=function(){var error=writer.error;if(error.code!==error.ABORT_ERR){fs_error()}};"writestart progress write abort".split(" ").forEach(function(event: any){writer["on"+event]=filesaver["on"+event]});writer.write(blob);filesaver.abort=function(){writer.abort();filesaver.readyState=filesaver.DONE};filesaver.readyState=filesaver.WRITING}),fs_error)}),fs_error)};dir.getFile(name,{create:false},abortable(function(file: any){file.remove();save()}),abortable(function(ex: any){if(ex.code===ex.NOT_FOUND_ERR){save()}else{fs_error()}}))}),fs_error)}),fs_error)},FS_proto=FileSaver.prototype,saveAs=function(blob: any,name: any,no_auto_bom: any){return new FileSaver(blob,name,no_auto_bom)};if(typeof navigator!=="undefined"&&(navigator as any).msSaveOrOpenBlob){return function(blob: any,name: any,no_auto_bom: any){if(!no_auto_bom){blob=auto_bom(blob)}return (navigator as any).msSaveOrOpenBlob(blob,name||"download")}}FS_proto.abort=function(){var filesaver=this;filesaver.readyState=filesaver.DONE;dispatch(filesaver,"abort")};FS_proto.readyState=FS_proto.INIT=0;FS_proto.WRITING=1;FS_proto.DONE=2;FS_proto.error=FS_proto.onwritestart=FS_proto.onprogress=FS_proto.onwrite=FS_proto.onabort=FS_proto.onerror=FS_proto.onwriteend=null;return saveAs}(typeof self!=="undefined"&&self||typeof window!=="undefined"&&window||(this as any).content);if(typeof module!=="undefined"&&module.exports){module.exports.saveAs=saveAs}else if(typeof define!=="undefined"&&define!==null&&define.amd!=null){define([],function(){return saveAs})}


//seeded random function, courtesy of http://davidbau.com/archives/2010/01/30/random_seeds_coded_hints_and_quintillions.html
(function(a: any,b: any,c: any,d: any,e: any,f: any){function k(this: any,a: any): any{var b,c=a.length,e=this,f=0,g=e.i=e.j=0,h: any=e.S=[];for(c||(a=[c++]);d>f;)h[f]=f++;for(f=0;d>f;f++)h[f]=h[g=j&g+a[f%c]+(b=h[f])],h[g]=b;(e.g=function(a: any){for(var b,c=0,f=e.i,g=e.j,h=e.S;a--;)b=h[f=j&f+1],c=c*d+h[j&(h[f]=h[g=j&g+b])+(h[g]=b)];return e.i=f,e.j=g,c})(d)}function l(a: any,b: any): any{var e,c=[],d=(typeof a)[0];if(b&&"o"==d)for(e in a)try{c.push(l(a[e],b-1))}catch(f){}return c.length?c:"s"==d?a:a+"\0"}function m(a: any,b: any){for(var d: any,c=a+"",e=0;c.length>e;)b[j&e]=j&(d^=19*b[j&e])+c.charCodeAt(e++);return o(b)}function n(c?: any){try{return a.crypto.getRandomValues(c=new Uint8Array(d)),o(c)}catch(e){return[+new Date,a,a.navigator.plugins,a.screen,o(b)]}}function o(a: any){return String.fromCharCode.apply(0,a)}var g: any=c.pow(d,e),h: any=c.pow(2,f),i: any=2*h,j: any=d-1;c.seedrandom=function(a: any,f: any){var j: any[]=[],p=m(l(f?[a,o(b)]:0 in arguments?a:n(),3),j),q=new (k as any)(j);return m(o(q.S),b),c.random=function(){for(var a=q.g(e),b=g,c=0;h>a;)a=(a+c)*d,b*=d,c=q.g(1);for(;a>=i;)a/=2,b/=2,c>>>=1;return(a+c)/b},p},m(c.random(),b)})(window,[],Math,256,6,52);

function bind(scope: any,fn: any)
{
	//use : bind(this,function(){this.x++;}) - returns a function where "this" refers to the scoped this
	return function() {fn.apply(scope,arguments);};
}

var grabProps=function(arr: any,prop: any)
{
	if (!arr) return [];
	var arr2=[];
	for (var i=0;i<arr.length;i++)
	{
		arr2.push(arr[i][prop]);
	}
	return arr2;
}

var CanvasPrototype: any=CanvasRenderingContext2D.prototype;//CC3: tsgo can't infer `this` from a prototype-cast assignment; alias keeps the verbatim method body.
CanvasPrototype.fillPattern=function(img: any,X: any,Y: any,W: any,H: any,iW: any,iH: any,offX: any,offY: any)
{
	//for when built-in patterns aren't enough
	if (img.alt!='blank')
	{
		var offX=offX||0;
		var offY=offY||0;
		if (offX<0) {offX=offX-Math.floor(offX/iW)*iW;} if (offX>0) {offX=(offX%iW)-iW;}
		if (offY<0) {offY=offY-Math.floor(offY/iH)*iH;} if (offY>0) {offY=(offY%iH)-iH;}
		for (var y=offY;y<H;y+=iH){for (var x=offX;x<W;x+=iW){this.drawImage(img,X+x,Y+y,iW,iH);}}
	}
}

var OldCanvasDrawImage=CanvasRenderingContext2D.prototype.drawImage;
CanvasRenderingContext2D.prototype.drawImage=function()
{
	//only draw the image if it's loaded
	if (arguments[0].alt!='blank') OldCanvasDrawImage.apply(this,arguments as any);
}


if (!document.hasFocus) document.hasFocus=function(){return document.hidden;};//for Opera

var Loader: any=function(this: any)//asset-loading system
{
	this.loadingN=0;
	this.assetsN=0;
	this.assets=[];
	this.assetsLoading=[];
	this.assetsLoaded=[];
	this.domain='';
	this.loaded=0;//callback
	this.doneLoading=0;
	
	this.blank=document.createElement('canvas');
	this.blank.width=8;
	this.blank.height=8;
	this.blank.alt='blank';
	
	this.Load=function(this: any, assets: any)
	{
		for (var i in assets)
		{
			this.loadingN++;
			this.assetsN++;
			if (!this.assetsLoading[assets[i]] && !this.assetsLoaded[assets[i]])
			{
				var img=new Image();
				if (assets[i].indexOf('/')!=-1) img.src=assets[i];
				else img.src=this.domain+assets[i];
				img.alt=assets[i];
				img.onload=bind(this,this.onLoad);
				this.assets[assets[i]]=img;
				this.assetsLoading.push(assets[i]);
			}
		}
	}
	this.Replace=function(this: any, old: any,newer: any)
	{
		if (!this.assets[old]) this.Load([old]);
		var img=new Image();
		if (newer.indexOf('/')!=-1)/*newer.indexOf('http')!=-1 || newer.indexOf('https')!=-1)*/ img.src=newer;
		else img.src=this.domain+newer;
		img.alt=newer;
		img.onload=bind(this,this.onLoad);
		this.assets[old]=img;
	}
	this.onLoadReplace=function(this: any)
	{
	}
	this.onLoad=function(this: any, e: any)
	{
		this.assetsLoaded.push(e.target.alt);
		this.assetsLoading.splice(this.assetsLoading.indexOf(e.target.alt),1);
		this.loadingN--;
		if (this.doneLoading==0 && this.loadingN<=0 && this.loaded!=0)
		{
			this.doneLoading=1;
			this.loaded();
		}
	}
	this.getProgress=function(this: any)
	{
		return (1-this.loadingN/this.assetsN);
	}
}

var Pic=function(what: any)
{
	if (Game.Loader.assetsLoaded.indexOf(what)!=-1) return Game.Loader.assets[what];
	else if (Game.Loader.assetsLoading.indexOf(what)==-1) Game.Loader.Load([what]);
	return Game.Loader.blank;
}

var Sounds: any[]=[];
var OldPlaySound=function(url: any,vol?: any)
{
	var volume=1;
	if (vol!==undefined) volume=vol;
	if (!Game.volume || volume==0) return 0;
	if (!Sounds[url]) {Sounds[url]=new Audio(url);Sounds[url].onloadeddata=function(e: any){e.target.volume=Math.pow(volume*Game.volume/100,2);}}
	else if (Sounds[url].readyState>=2) {Sounds[url].currentTime=0;Sounds[url].volume=Math.pow(volume*Game.volume/100,2);}
	Sounds[url].play();
}
var SoundInsts: any[]=[];
var SoundI=0;
for (var i=0;i<12;i++){SoundInsts[i]=new Audio();}
var pitchSupport=false;
//note : Chrome turns out to not support webkitPreservesPitch despite the specifications claiming otherwise, and Firefox clips some short sounds when changing playbackRate, so i'm turning the feature off completely until browsers get it together
//if (SoundInsts[0].preservesPitch || SoundInsts[0].mozPreservesPitch || SoundInsts[0].webkitPreservesPitch) pitchSupport=true;

var PlaySound=function(url: any,vol?: any,pitchVar?: any)
{
	//url : the url of the sound to play (will be cached so it only loads once)
	//vol : volume between 0 and 1 (multiplied by game volume setting); defaults to 1 (full volume)
	//(DISABLED) pitchVar : pitch variance in browsers that support it (Firefox only at the moment); defaults to 0.05 (which means pitch can be up to -5% or +5% anytime the sound plays)
	var volume=1;
	var volumeSetting=Game.volume;
	if (typeof vol!=='undefined') volume=vol;
	if (volume<-5) {volume+=10;volumeSetting=Game.volumeMusic;}
	if (!volumeSetting || volume==0) return 0;
	if (typeof Sounds[url]==='undefined')
	{
		//sound isn't loaded, cache it
		Sounds[url]=new Audio(url);
		Sounds[url].onloadeddata=function(_e: any){PlaySound(url,vol,pitchVar);}
		//Sounds[url].load();
	}
	else if (Sounds[url].readyState>=2 && SoundInsts[SoundI].paused)
	{
		var sound=SoundInsts[SoundI];
		SoundI++;
		if (SoundI>=12) SoundI=0;
		sound.src=Sounds[url].src;
		//sound.currentTime=0;
		sound.volume=Math.pow(volume*volumeSetting/100,2);
		if (pitchSupport)
		{
			var pitchVar=(typeof pitchVar==='undefined')?0.05:pitchVar;
			var rate=1+(Math.random()*2-1)*pitchVar;
			sound.preservesPitch=false;
			sound.mozPreservesPitch=false;
			sound.webkitPreservesPitch=false;
			sound.playbackRate=rate;
		}
		try{sound.play();}catch(e){}
		/*
		var sound=Sounds[url].cloneNode();
		sound.volume=Math.pow(volume*volumeSetting/100,2);
		sound.onended=function(e){if (e.target){delete e.target;}};
		sound.play();*/
	}
}
var PlayMusicSound=function(url: any,vol: any,pitchVar: any)
{
	//like PlaySound but, if music is enabled, play with music volume
	PlaySound(url,(vol||1)-(Music?10:0),pitchVar);
}

Music=false;
PlayCue=function(cue: any,arg: any)
{
	if (Music && Game.jukebox.trackAuto) Music.cue(cue,arg);
}

if (!Date.now){Date.now=function now() {return new Date().getTime();};}

var triggerAnim=function(element: any,anim: any)
{
	if (!element) return;
	element.classList.remove(anim);
	void element.offsetWidth;
	element.classList.add(anim);
};



var Timer: any={};
Timer.t=Date.now();
Timer.labels=[];
Timer.smoothed=[];
Timer.reset=function()
{
	Timer.labels=[];
	Timer.t=Date.now();
}
Timer.track=function(label: any)
{
	if (!Game.sesame) return;
	var now=Date.now();
	if (!Timer.smoothed[label]) Timer.smoothed[label]=0;
	Timer.smoothed[label]+=((now-Timer.t)-Timer.smoothed[label])*0.1;
	Timer.labels[label]='<div style="padding-left:8px;">'+label+' : '+Math.round(Timer.smoothed[label])+'ms</div>';
	Timer.t=now;
}
Timer.clean=function()
{
	if (!Game.sesame) return;
	var now=Date.now();
	Timer.t=now;
}
Timer.say=function(label: any)
{
	if (!Game.sesame) return;
	Timer.labels[label]='<div style="border-top:1px solid #ccc;">'+label+'</div>';
}; // CC3 rewrite (phase 3, slice 1): explicit semicolon. The original code had no semicolon here and relied on ASI: the next line was 'var Game={}' (now an import from core/game.ts), a statement starter that forced the break. Without it, the MODDING IIFE below parses as a chained call on this function expression and crashes the engine at boot.


/*=====================================================================================
GAME INITIALIZATION
=======================================================================================*/
/* CC3 rewrite (phase 3, slice 1): the original `var Game={}` now lives in the typed core layer (core/game.ts) as a real class instance; the engine imports and mutates that one object, exactly as before. */

setupModding();

Game.version=VERSION;
Game.loadedFromVersion=VERSION;
Game.beta=BETA;
if (!App && window.location.href.indexOf('/beta')>-1) Game.beta=1;
else if (App && new URL(window.location.href).searchParams.get('beta')) Game.beta=1;
Game.https=!App?((location.protocol!='https:')?false:true):true;
Game.SaveTo='CookieClickerGame';
if (Game.beta) Game.SaveTo='CookieClickerGameBeta';
if (App && new URL(window.location.href).searchParams.get('modless')) Game.modless=1;

Game.Launch=function()
{
	Game.mobile=0;
	Game.touchEvents=0;
	//if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) Game.mobile=1;
	//if (Game.mobile) Game.touchEvents=1;
	//if ('ontouchstart' in document.documentElement) Game.touchEvents=1;
	
	
	var css=document.createElement('style');
	css.type='text/css';
	css.innerHTML='body .icon,body .crate,body .usesIcon{background-image:url(img/icons.webp?v='+Game.version+');}';
	document.head.appendChild(css);
	
	//this is so shimmers can still appear even if you lose connection after the game is loaded
	var preloadImages=['img/goldCookie.webp','img/wrathCookie.webp','img/spookyCookie.webp','img/hearts.webp','img/contract.webp','img/wrathContract.webp','img/bunnies.webp','img/frostedReindeer.webp'];
	var preloadImagesL=l('preloadImages');
	for (var i=0;i<preloadImages.length;i++)
	{
		var img=document.createElement('img');
		img.src=preloadImages[i];
		preloadImagesL.appendChild(img);
	}
	
	Game.visible=true;
	AddEvent(document,'visibilitychange',function(_e: any){if (document.visibilityState==='hidden') Game.visible=false; else Game.visible=true;});
	
	
	if (!EN)
	{
		//code-patching the CSS for localization feels like it should be against the law, and yet
		var css=document.createElement('style');
		css.type='text/css';
		css.innerHTML=
			'#upgrades:before{content:\''+loc("Upgrades")+'\';}'+
			'#toggleUpgrades:before{content:\''+loc("Switches")+'\';}'+
			'#techUpgrades:before{content:\''+loc("Research")+'\';}'+
			'#vaultUpgrades:before{content:\''+loc("Vault")+'\';}'+
			'#products:before{content:\''+loc("Buildings")+'\';}'+
		'';
		document.head.appendChild(css);
	}
	
	Game.baseSeason='';//halloween, christmas, valentines, fools, easter
	//automatic season detection (might not be 100% accurate)
	var year=new Date().getFullYear();
	var leap=(((year%4==0)&&(year%100!=0))||(year%400==0))?1:0;
	var day: any=Math.floor((new Date().getTime()-new Date(year,0,0).getTime())/(1000*60*60*24));
	if (day>=41 && day<=46) Game.baseSeason='valentines';
	else if (day+leap>=90 && day<=92+leap) Game.baseSeason='fools';
	else if (day>=304-7+leap && day<=304+leap) Game.baseSeason='halloween';
	else if (day>=349+leap && day<=365+leap) Game.baseSeason='christmas';
	else
	{
		//easter is a pain goddamn
		var easterDay: any=function(Y: any){var C = Math.floor(Y/100);var N = Y - 19*Math.floor(Y/19);var K = Math.floor((C - 17)/25);var I = C - Math.floor(C/4) - Math.floor((C - K)/3) + 19*N + 15;I = I - 30*Math.floor((I/30));I = I - Math.floor(I/28)*(1 - Math.floor(I/28)*Math.floor(29/(I + 1))*Math.floor((21 - N)/11));var J = Y + Math.floor(Y/4) + I + 2 - C + Math.floor(C/4);J = J - 7*Math.floor(J/7);var L = I - J;var M = 3 + Math.floor((L + 40)/44);var D = L + 28 - 31*Math.floor(M/4);return new Date(Y,M-1,D);}(year);
		easterDay=Math.floor((easterDay-new Date(easterDay.getFullYear(),0,0).getTime())/(1000*60*60*24));
		if (day>=easterDay-7 && day<=easterDay) Game.baseSeason='easter';
	}
	
	declareVanillaChangelog(Game as any);//CC3 rewrite (phase 6, slice 5): the info/about + version-history HTML moved verbatim to content/changelog.ts; same Launch position.
	
	Game.ready=0;
	
	Game.Load=function()
	{
		//l('offGameMessage').innerHTML='<div style="padding:64px 128px;"><div class="title">Loading...</div></div>';
		Game.Loader=new Loader();
		Game.Loader.domain='img/';
		if (typeof PRELOAD!=='undefined') Game.Loader.loaded=PRELOAD(Game.Init);
		else Game.Loader.loaded=Game.Init;
		Game.Loader.Load(['filler.webp']);
	}
	Game.ErrorFrame=function()
	{
		l('offGameMessage').innerHTML=
		'<div class="title">Oops. Wrong address!</div>'+
		'<div>It looks like you\'re accessing Cookie Clicker from another URL than the official one.<br>'+
		'You can <a href="//orteil.dashnet.org/cookieclicker/" target="_blank">play Cookie Clicker over here</a>!<br>'+
		'<small>(If for any reason, you are unable to access the game on the official URL, we are currently working on a second domain.)</small></div>';
	}
	Game.timedout=false;
	Game.Timeout=function()
	{
		Game.WriteSave();
		Game.killShimmers();
		l('offGameMessage').innerHTML='<div class="title">'+(Game.Has('Twin Gates of Transcendence')?loc("Cookie Clicker is in sleep mode and generating offline cookies."):loc("Cookie Clicker is in sleep mode."))+'</div>'+loc("%1 to resume from your save file.",'<a '+Game.clickStr+'="Game.Resume();">'+loc("Click here")+'</a>')+'<br><div style="font-style:italic;font-size:65%;line-height:110%;opacity:0.75;">'+loc("(this happens when too many frames are skipped at once,<br>usually when the game has been running in the background for a while)<br>(you can turn this feature off in the settings menu)")+'</div>';
		l('offGameMessageWrap').style.display='table';
		Game.timedout=true;
		console.log('[=== Game timed out and has been put in sleep mode. Data was saved. ===]');
	}
	Game.Resume=function()
	{
		l('offGameMessage').innerHTML='';
		l('offGameMessageWrap').style.display='none';
		Game.timedout=false;
		Game.time=Date.now();
		Game.accumulatedDelay=0;
		Game.delayTimeouts=0;
		Game.lastActivity=Date.now();
		Game.Loop();
		Game.LoadSave();
		console.log('[=== Game resumed! Data was loaded. ===]');
	}
	
	
	Game.Init=function()
	{
		Game.ready=1;

		/*=====================================================================================
		VARIABLES AND PRESETS
		=======================================================================================*/
		Game.T=0;
		Game.drawT=0;
		Game.loopT=0;
		Game.fps=30;
		
		Game.season=Game.baseSeason;
		
		Game.l=l('game');
		Game.wrapper=l('wrapper');
		Game.bounds=0;//rectangle defining screen limits (right,left,bottom,top) updated every logic frame
		
		TopBarOffset=32;
		if (!App) Game.wrapper.classList.add('onWeb');
		else {Game.wrapper.classList.add('offWeb');TopBarOffset=0;}
		
		if (Game.mobile==1)
		{
			Game.wrapper.className='mobile';
		}
		Game.clickStr=Game.touchEvents?'ontouchend':'onclick';
		
		l('versionNumber').innerHTML='v. '+Game.version.toFixed(3)+(!App?('<div id="httpsSwitch" style="cursor:pointer;display:inline-block;background:url(img/'+(Game.https?'lockOn':'lockOff')+'.webp);width:16px;height:16px;position:relative;top:4px;left:0px;margin:0px -2px;"></div>'):'')+(Game.beta?' <span style="color:#ff0;">beta</span>':'');
		
		Game.lastActivity=Date.now();//reset on mouse move, key press or click
		
		//latency compensator stuff
		Game.time=Date.now();
		Game.accumulatedDelay=0;
		Game.delayTimeouts=0;//how many times we've gone over the timeout delay
		Game.catchupLogic=0;
		Game.fpsStartTime=0;
		Game.frameNumber=0;
		Game.currentFps=Game.fps;
		Game.previousFps=Game.currentFps;
		Game.getFps=function()
		{
			Game.frameNumber++;
			var currentTime=(Date.now()-Game.fpsStartTime )/1000;
			var result=Math.floor((Game.frameNumber/currentTime));
			if (currentTime>1)
			{
				Game.fpsStartTime=Date.now();
				Game.frameNumber=0;
			}
			return result;
		}
		
		Game.cookiesEarned=0;//all cookies earned during gameplay
		Game.cookies=0;//cookies
		Game.cookiesd=0;//cookies display
		Game.cookiesPs=1;//cookies per second (to recalculate with every new purchase)
		Game.cookiesPsRaw=0;//raw cookies per second
		Game.cookiesPsRawHighest=0;//highest raw cookies per second this ascension
		Game.cookiesReset=0;//cookies lost to resetting (used to determine prestige and heavenly chips)
		Game.cookieClicks=0;//+1 for each click on the cookie
		Game.goldenClicks=0;//+1 for each golden cookie clicked (all time)
		Game.goldenClicksLocal=0;//+1 for each golden cookie clicked (this game only)
		Game.missedGoldenClicks=0;//+1 for each golden cookie missed
		Game.handmadeCookies=0;//all the cookies made from clicking the cookie
		Game.milkProgress=0;//you gain a little bit for each achievement. Each increment of 1 is a different milk displayed.
		Game.milkH=Game.milkProgress/2;//milk height, between 0 and 1 (although should never go above 0.5)
		Game.milkHd=0;//milk height display
		Game.milkType=0;//custom milk
		Game.bgType=0;//custom background
		Game.chimeType=0;//golden cookie chime
		Game.prestige=0;//prestige level (recalculated depending on Game.cookiesReset)
		Game.heavenlyChips=0;//heavenly chips the player currently has
		Game.heavenlyChipsDisplayed=0;//ticks up or down to match Game.heavenlyChips
		Game.heavenlyChipsSpent=0;//heavenly chips spent on cookies, upgrades and such
		Game.heavenlyCookies=0;//how many cookies have we baked from chips (unused)
		Game.permanentUpgrades=[-1,-1,-1,-1,-1];
		Game.ascensionMode=0;//type of challenge run if any
		Game.monoBuilding=null;//CC3: Monoculture challenge — the one building type locked in for the run
		Game.resets=0;//reset counter
		Game.lumps=-1;//sugar lumps
		Game.lumpsTotal=-1;//sugar lumps earned across all playthroughs (-1 means they haven't even started yet)
		Game.lumpT=Date.now();//time when the current lump started forming
		Game.lumpRefill=0;//time left before a sugar lump can be used again (on minigame refills etc) in logic frames
		
		Game.makeSeed=function()
		{
			var chars='abcdefghijklmnopqrstuvwxyz'.split('');
			var str='';
			for (var i=0;i<5;i++){str+=choose(chars);}
			return str;
		}
		Game.seed=Game.makeSeed();//each run has its own seed, used for deterministic random stuff
		
		Game.volume=75;//sound volume
		Game.volumeMusic=50;//music volume
		
		Game.elderWrath=0;
		Game.elderWrathOld=0;
		Game.elderWrathD=0;
		Game.pledges=0;
		Game.pledgeT=0;
		Game.researchT=0;
		Game.nextResearch=0;
		Game.cookiesSucked=0;//cookies sucked by wrinklers
		Game.cpsSucked=0;//percent of CpS being sucked by wrinklers
		Game.wrinklersPopped=0;
		Game.santaLevel=0;
		Game.reindeerClicked=0;
		Game.seasonT=0;
		Game.seasonUses=0;
		Game.dragonLevel=0;
		Game.dragonAura=0;
		Game.dragonAura2=0;
		
		Game.fortuneGC=0;
		Game.fortuneCPS=0;
		
		Game.blendModesOn=(document.createElement('detect').style.mixBlendMode==='');
		
		Game.bg='';//background (grandmas and such)
		Game.bgFade='';//fading to background
		Game.bgR=0;//ratio (0 - not faded, 1 - fully faded)
		Game.bgRd=0;//ratio displayed
		
		Game.windowW=window.innerWidth;
		Game.windowH=window.innerHeight;
		Game.scale=1;
		
		window.addEventListener('resize',function(_e: any)
		{
			Game.resize();
			if (App && App.onResize) App.onResize();
		});
		
		Game.resize=function()
		{
			var w=window.innerWidth;
			var h=window.innerHeight;
			
			var prevW=Game.windowW;
			
			var scale=Math.min(
				w/Math.max(Game.minLayoutW||800,w),
				h/Math.max(200,h)
			);
			Game.windowW=Math.floor(w/scale);
			Game.windowH=Math.floor(h/scale);
			if (scale!=1)
			{
				Game.wrapper.style.transform='scale('+(scale)+')';
				Game.wrapper.style.width=Game.windowW+'px';
				Game.wrapper.style.height=Game.windowH+'px';
			}
			else
			{
				Game.wrapper.style.removeProperty('transform');
				Game.wrapper.style.width='100%';
				Game.wrapper.style.height='100%';
			}
			Game.scale=scale;
			
			for (var i in Game.Objects)
			{
				var me=Game.Objects[i];
				me.toResize=true;
				if (me.minigame && me.minigame.onResize) me.minigame.onResize();
			}
			
			if (Game.getNewTicker)
			{
				if (prevW>=Game.tickerTooNarrow && Game.windowW<Game.tickerTooNarrow) Game.getNewTicker(true);
				else if (prevW<Game.tickerTooNarrow && Game.windowW>=Game.tickerTooNarrow) Game.getNewTicker(true);
			}
		}
		Game.resize();
		
		Game.startDate=parseInt(Date.now());//when we started playing
		Game.fullDate=parseInt(Date.now());//when we started playing (carries over with resets)
		Game.lastDate=parseInt(Date.now());//when we last saved the game (used to compute "cookies made since we closed the game" etc)
		
		Game.prefs=[];
		Game.DefaultPrefs=function()
		{
			Game.prefs.particles=1;//particle effects : falling cookies etc
			Game.prefs.numbers=1;//numbers that pop up when clicking the cookie
			Game.prefs.autosave=1;//save the game every minute or so
			Game.prefs.autoupdate=1;//send an AJAX request to the server every 30 minutes (note : ignored)
			Game.prefs.milk=1;//display milk
			Game.prefs.fancy=1;//CSS shadow effects (might be heavy on some browsers)
			Game.prefs.warn=0;//warn before closing the window
			Game.prefs.cursors=1;//display cursors
			Game.prefs.focus=1;//make the game refresh less frequently when off-focus
			Game.prefs.popups=0;//use old-style popups (no longer used)
			Game.prefs.format=0;//shorten numbers
			Game.prefs.notifs=0;//notifications fade faster
			Game.prefs.animate=1;//animate buildings
			Game.prefs.wobbly=1;//wobbly cookie
			Game.prefs.monospace=0;//alt monospace font for cookies
			Game.prefs.filters=1;//CSS filter effects (might be heavy on some browsers)
			Game.prefs.cookiesound=1;//use new cookie click sound
			Game.prefs.crates=0;//show crates around icons in stats
			Game.prefs.altDraw=0;//use requestAnimationFrame to update drawing instead of fixed 30 fps setTimeout
			Game.prefs.showBackupWarning=1;//if true, show a "Have you backed up your save?" message on save load; set to false when save is exported
			Game.prefs.extraButtons=1;//if true, show Mute buttons and the building master bar
			Game.prefs.askLumps=0;//if true, show a prompt before spending lumps
			Game.prefs.customGrandmas=1;//if true, show patreon names for grandmas
			Game.prefs.timeout=0;//if true, game may show pause screen when timed out
			Game.prefs.cloudSave=1;//if true and on Steam, save and load to cloud
			Game.prefs.bgMusic=1;//if true and on Steam, play music even when game isn't focused
			Game.prefs.notScary=0;//if true, make some of the scary stuff less scary ("eyebrow mode")
			Game.prefs.fullscreen=0;//if true, Steam game will be fullscreen
			Game.prefs.screenreader=0;//if true, add some DOM stuff to facilitate screenreader interaction (requires reload)
			Game.prefs.discordPresence=1;//if true and applicable, show game activity in Discord status
		}
		Game.DefaultPrefs();
		
		window.onbeforeunload=function(event: any)
		{
			if (Game.prefs && Game.prefs.warn)
			{
				if (typeof event=='undefined') event=window.event;
				if (event) event.returnValue=loc("Are you sure you want to close Cookie Clicker?");
			}
		}
		
		Game.Mobile=function()
		{
			if (!Game.mobile)
			{
				Game.wrapper.className='mobile';
				Game.mobile=1;
			}
			else
			{
				Game.wrapper.className='';
				Game.mobile=0;
			}
		}
		
		Game.showBackupWarning=function()
		{
			Game.Notify(loc("Back up your save!"),loc("Hello again! Just a reminder that you may want to back up your Cookie Clicker save every once in a while, just in case.<br>To do so, go to Options and hit \"Export save\" or \"Save to file\"!")+'<div class="line"></div><a style="float:right;" onclick="Game.prefs.showBackupWarning=0;==CLOSETHIS()==">'+loc("Don't show this again")+'</a>',[25,7]);
		}
		Game.RandomBakeryName=RandomBakeryName;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/bakeryName.ts; same Game slot, same Init position.
		Game.GetBakeryName=GetBakeryName;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/bakeryName.ts; same Game slot, same Init position.
		Game.bakeryNameL=l('bakeryName');
		Game.bakeryNameSet=bakeryNameSet;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/bakeryName.ts; same Game slot, same Init position.
		Game.bakeryNameRefresh=bakeryNameRefresh;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/bakeryName.ts; same Game slot, same Init position.
		Game.bakeryNamePrompt=bakeryNamePrompt;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/bakeryName.ts; same Game slot, same Init position.
		Game.bakeryNamePromptRandom=bakeryNamePromptRandom;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/bakeryName.ts; same Game slot, same Init position.
		AddEvent(Game.bakeryNameL,'click',Game.bakeryNamePrompt);
		
		Game.bakeryNameSet(Game.GetBakeryName());
		
		/*=====================================================================================
		TOOLTIP
		=======================================================================================*/
		Game.tooltip={text:'',x:0,y:0,origin:'',on:0,tt:l('tooltip'),tta:l('tooltipAnchor'),shouldHide:1,dynamic:0,from:0};
		Game.tooltip.draw=tooltipDraw;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/tooltip.ts; same Game slot, same Init position.
		Game.tooltip.update=tooltipUpdate;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/tooltip.ts; same Game slot, same Init position.
		Game.tooltip.hide=tooltipHide;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/tooltip.ts; same Game slot, same Init position.
		Game.tooltip.wobble=tooltipWobble;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/tooltip.ts; same Game slot, same Init position.
		Game.getTooltip=getTooltip;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/tooltip.ts; same Game slot, same Init position.
		Game.getDynamicTooltip=getDynamicTooltip;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/tooltip.ts; same Game slot, same Init position.
		Game.attachTooltip=attachTooltip;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/tooltip.ts; same Game slot, same Init position.
		
		
		/*=====================================================================================
		UPDATE CHECKER
		=======================================================================================*/
		Game.CheckUpdates=function()
		{
			if (!App) ajax('server.php?q=checkupdate',Game.CheckUpdatesResponse);
		}
		Game.CheckUpdatesResponse=function(response: any)
		{
			var r=response.split('|');
			var str='';
			if (r[0]=='alert')
			{
				if (r[1]) str=r[1];
			}
			else if (parseFloat(r[0])>Game.version)
			{
				str='<b>'+loc("New version available: v. %1!",r[0])+'</b>';
				if (r[1]) str+='<br><small>'+loc("Update note: \"%1\"",r[1])+'</small>';
				str+='<br><b>'+loc("Refresh to get it!")+'</b>';
			}
			if (str!='')
			{
				l('alert').innerHTML=str;
				l('alert').style.display='block';
			}
		}
		
		/*=====================================================================================
		DATA GRABBER
		=======================================================================================*/
		
		Game.externalDataLoaded=false;
		
		Game.grandmaNames=['Granny','Gusher','Ethel','Edna','Doris','Maud','Hilda','Gladys','Michelle','Michele','Phyllis','Millicent','Muriel','Myrtle','Mildred','Mavis','Helen','Gloria','Sheila','Betty','Gertrude','Agatha','Beryl','Agnes','Pearl','Precious','Ruby','Vera','Bonnie','Ada','Bunny','Cookie','Darling','Gaga','GamGam','Memaw','Mimsy','Peanut','Nana','Nan','Tootsie','Warty','Stinky','Heinous'];
		Game.customGrandmaNames=[];
		Game.heralds=0;
		
		Game.GrabData=function()
		{
			if (!App) ajax('grab.txt',Game.GrabDataResponse);
			else App.grabData(function(res: any){
				Game.heralds=res?(res.playersN||1):1;
				Game.heralds=Math.max(0,Math.min(100,Math.ceil(Game.heralds/100*100)/100));
				l('heraldsAmount').textContent=Math.floor(Game.heralds);
			});
		}
		Game.GrabDataResponse=function(response: any)
		{
			/*
				response should be formatted as
				{"herald":3,"grandma":"a|b|c|...}
			*/
			var r: any={};
			try{
				r=JSON.parse(response);
				if (typeof r['herald']!=='undefined')
				{
					Game.heralds=parseInt(r['herald']);
					Game.heralds=Math.max(0,Math.min(100,Game.heralds));
				}
				if (typeof r['grandma']!=='undefined' && r['grandma']!='')
				{
					Game.customGrandmaNames=r['grandma'].split('|');
					Game.customGrandmaNames=Game.customGrandmaNames.filter(function(el: any){return el!='';});
				}
				
				l('heraldsAmount').textContent=Math.floor(Game.heralds);
				Game.externalDataLoaded=true;
			}catch(e){}
		}
		
		
		if (!App)
		{
			Game.attachTooltip(l('httpsSwitch'),'<div style="padding:8px;width:350px;text-align:center;font-size:11px;">'+loc("You are currently playing Cookie Clicker on the <b>%1</b> protocol.<br>The <b>%2</b> version uses a different save slot than this one.<br>Click this lock to reload the page and switch to the <b>%2</b> version!",[(Game.https?'HTTPS':'HTTP'),(Game.https?'HTTP':'HTTPS')])+'</div>','this');
			AddEvent(l('httpsSwitch'),'click',function(){
				PlaySound('snd/pop'+Math.floor(Math.random()*3+1)+'.mp3',0.75);
				if (location.protocol=='https:') location.href='http:'+window.location.href.substring(window.location.protocol.length);
				else if (location.protocol=='http:') location.href='https:'+window.location.href.substring(window.location.protocol.length);
			});
			
			AddEvent(l('changeLanguage'),'click',function()
			{
				Game.showLangSelection();
			});
			
			Game.attachTooltip(l('topbarOrteil'),'<div style="padding:8px;width:250px;text-align:center;">Back to Orteil\'s subdomain!<br>Lots of other games in there!</div>'+tinyIcon([17,5],'display:block;margin:-12px auto;'),'this');
			Game.attachTooltip(l('topbarTwitter'),'<div style="padding:8px;width:250px;text-align:center;">Orteil\'s twitter, which frequently features game updates.</div>','this');
			Game.attachTooltip(l('topbarTumblr'),'<div style="padding:8px;width:250px;text-align:center;">Orteil\'s tumblr, which frequently features game updates.</div>','this');
			Game.attachTooltip(l('topbarDiscord'),'<div style="padding:8px;width:250px;text-align:center;">Our official discord server.<br>You can share tips and questions about Cookie Clicker and all our other games!</div>','this');
			Game.attachTooltip(l('topbarPatreon'),'<div style="padding:8px;width:250px;text-align:center;">Support us on Patreon and help us keep updating Cookie Clicker!<br>There\'s neat rewards for patrons too!</div>','this');
			Game.attachTooltip(l('topbarMerch'),'<div style="padding:8px;width:250px;text-align:center;">Cookie Clicker shirts, hoodies and stickers!</div>','this');
			Game.attachTooltip(l('topbarMobileCC'),'<div style="padding:8px;width:250px;text-align:center;">Play Cookie Clicker on your phone!<br>(Android only; iOS version will be released later)</div>','this');
			Game.attachTooltip(l('topbarSteamCC'),'<div style="padding:8px;width:250px;text-align:center;">Get Cookie Clicker on Steam!<br>Featuring music by C418.</div>','this');
			Game.attachTooltip(l('topbarRandomgen'),'<div style="padding:8px;width:250px;text-align:center;">View the Cookie Clicker 3 source code on GitHub.</div>','this');
			Game.attachTooltip(l('topbarIGM'),'<div style="padding:8px;width:250px;text-align:center;">Go and check out the creator of this downloadable version!<br>(Subscribe while your at it. :)</div>','this');
			l('changeLanguage').innerHTML=loc("Change language");
		}
		
		Game.attachTooltip(l('heralds'),function(){
			var str='';
			
			if (!App && !Game.externalDataLoaded) str+=loc("Heralds couldn't be loaded. There may be an issue with our servers, or you are playing the game locally.");
			else
			{
				if (!App && Game.heralds==0) str+=loc("There are no heralds at the moment. Please consider <b style=\"color:#bc3aff;\">donating to our Patreon</b>!");
				else
				{
					str+='<b style="color:#bc3aff;text-shadow:0px 1px 0px #6d0096;">'+loc("%1 herald",Game.heralds)+'</b> '+loc("selflessly inspiring a boost in production for everyone, resulting in %1.",'<br><b style="color:#cdaa89;text-shadow:0px 1px 0px #7c4532,0px 0px 6px #7c4532;"><div style="width:16px;height:16px;display:inline-block;vertical-align:middle;background:url(img/money.webp);"></div>'+loc("+%1% cookies per second",Game.heralds)+'</b>');
					str+='<div class="line"></div>';
					if (Game.ascensionMode==1) str+=loc("You are in a <b>Born again</b> run, and are not currently benefiting from heralds.");
					else if (Game.Has('Heralds')) str+=loc("You own the <b>Heralds</b> upgrade, and therefore benefit from the production boost.");
					else str+=loc("To benefit from the herald bonus, you need a special upgrade you do not yet own. You will permanently unlock it later in the game.");
				}
			}
			str+='<div class="line"></div><span style="font-size:90%;opacity:0.6;">'+(!App?loc("<b>Heralds</b> are people who have donated to our highest Patreon tier, and are limited to 100.<br>Each herald gives everyone +1% CpS.<br>Heralds benefit everyone playing the game, regardless of whether you donated."):loc("Every %1 current players on Steam generates <b>1 herald</b>, up to %2 heralds.<br>Each herald gives everyone +1% CpS.",[100,100]))+'</span><div class="line"></div>'+tinyIcon([21,29]);
			
			str+='<div style="width:31px;height:39px;background:url(img/heraldFlag.webp);position:absolute;top:0px;left:8px;"></div><div style="width:31px;height:39px;background:url(img/heraldFlag.webp);position:absolute;top:0px;right:8px;"></div>';
			
			return '<div style="padding:8px;width:300px;text-align:center;" class="prompt" id="tooltipHeralds"><h3>'+loc("Heralds")+'</h3><div class="block">'+str+'</div></div>';
		},'this');
		l('heraldsAmount').textContent='?';
		l('heralds').style.display='inline-block';
		if (App)
		{
			l('heralds').style.paddingTop='4px';
			l('heralds').style.position='absolute';
			l('heralds').style.top='0px';
			l('heralds').style.right='0px';
			l('heralds').style.width='28px';
			l('heralds').style.textAlign='center';
			l('leftBeam').appendChild(l('heralds'));
			
			l('buffs').style.top='16px';
		}
		
		Game.GrabData();
		
		
		Game.useLocalStorage=1;
		//window.localStorage.clear();//won't switch back to cookie-based if there is localStorage info
		
		/*=====================================================================================
		SAVE
		=======================================================================================*/
		Game.ExportSave=ExportSave;//CC3 rewrite (phase 4, slice 2): moved verbatim to systems/save.ts; same Game slot, same Init position.
		Game.ImportSave=ImportSave;//CC3 rewrite (phase 4, slice 2): moved verbatim to systems/save.ts.
		Game.ImportSaveCode=ImportSaveCode;//CC3 rewrite (phase 4, slice 2): moved verbatim to systems/save.ts.
		
		Game.FileSave=FileSave;//CC3 rewrite (phase 4, slice 2): moved verbatim to systems/save.ts.
		Game.FileLoad=FileLoad;//CC3 rewrite (phase 4, slice 2): moved verbatim to systems/save.ts.
		
		// CC3: rolling save backups (systems/backup.ts). CaptureSave is also
		// called from WriteSave itself; the Game slots expose the menu + QA.
		Game.CaptureSave=function(saveData: string){return CaptureSave(Game as any,saveData);};
		Game.ListBackups=function(){return ListBackups(Game as any);};
		Game.RestoreBackup=function(timestamp: number){return RestoreBackup(Game as any,timestamp);};
		Game.DownloadBackup=function(timestamp: number){return DownloadBackup(Game as any,timestamp);};
		Game.RefreshBackupList=function(){return RefreshBackupList(Game as any);};
		
		Game.toReload=false;
		Game.toSave=false;
		Game.toQuit=false;
		Game.isSaving=false;//true while we're saving, to block some behavior; when in App mode saving may be asynchronous
		Game.lastSaveData='';
		Game.WriteSave=WriteSave;//CC3 rewrite (phase 4, slice 2): the 228-line save writer moved verbatim to systems/save.ts; same Game slot, same Init position, byte-identical save format.
		
		/*=====================================================================================
		LOAD
		=======================================================================================*/
		Game.salvageSave=salvageSave;//CC3 rewrite (phase 4, slice 3): moved verbatim to systems/save.ts; same Game slot, same Init position.
		Game.LoadSave=LoadSave;
		Game.Reset=Reset;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/reset.ts; same Game slot, same Init position.
		Game.HardReset=HardReset;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/reset.ts; same Game slot, same Init position.
		
		
		
		Game.onCrate=0;
		Game.setOnCrate=function(what: any)
		{
			Game.onCrate=what;
		}
		Game.crate=crate;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/crate.ts; same Game slot, same Init position.
		Game.crateTooltip=crateTooltip;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/crate.ts; same Game slot, same Init position.
		Game.costDetails=costDetails;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/crate.ts; same Game slot, same Init position.
		
		
		/*=====================================================================================
		PRESTIGE
		=======================================================================================*/
		
		Game.HCfactor=2.5;
		Game.HowMuchPrestige=HowMuchPrestige;//CC3 rewrite (phase 4, slice 1): moved verbatim to systems/economy.ts; same Game slot, same Init position.
		Game.HowManyCookiesReset=HowManyCookiesReset;//CC3 rewrite (phase 4, slice 1): moved verbatim to systems/economy.ts.
		Game.gainedPrestige=0;
		Game.EarnHeavenlyChips=EarnHeavenlyChips;//CC3 rewrite (phase 4, slice 1): moved verbatim to systems/economy.ts.
		
		Game.GetHeavenlyMultiplier=GetHeavenlyMultiplier;//CC3 rewrite (phase 4, slice 1): moved verbatim to systems/economy.ts.
		
		Game.ascensionModes={
		0:{name:'None',dname:loc("None [ascension type]"),desc:loc("No special modifiers."),icon:[10,0]},
		1:{name:'Born again',dname:loc("Born again [ascension type]"),desc:loc("This run will behave as if you'd just started the game from scratch. Prestige levels and heavenly upgrades will have no effect, as will sugar lumps and building levels. Perma-upgrades and minigames will be unavailable.<div class=\"line\"></div>Some achievements are only available in this mode."),icon:[2,7]},
		2:{name:'Trigger finger',dname:loc("Trigger finger [ascension type]"),desc:loc("In this run, scrolling your mouse wheel on the cookie counts as clicking it. Some upgrades introduce new clicking behaviors.<br>No clicking achievements may be obtained in this mode.<div class=\"line\"></div>Reaching 1 quadrillion cookies in this mode unlocks a special heavenly upgrade."),icon:[12,0]},
		3:{name:'Ascetic',dname:loc("Ascetic [ascension type]"),desc:loc("In this run, golden cookies and wrath cookies never appear. No seasonal drops either. Only your passive baking remains.<br>No golden cookie achievements may be obtained in this mode.<div class=\"line\"></div>Reaching 1 trillion cookies in this mode unlocks a special heavenly upgrade."),icon:[11,0]},
		4:{name:'Monoculture',dname:loc("Monoculture [ascension type]"),desc:loc("In this run, you can only buy <b>one type of building</b>. The first building you purchase locks that type in for the entire run.<br>All other buildings are locked.<div class=\"line\"></div>Reaching 1 billion cookies in this mode unlocks a special heavenly upgrade."),icon:[13,0]},
		5:{name:'Spender',dname:loc("Spender [ascension type]"),desc:loc("In this run, you cannot buy any upgrades. Only buildings may be purchased.<br>Your cookies pile up in the store instead of the lab.<div class=\"line\"></div>Reaching 1 quadrillion cookies in this mode unlocks a special heavenly upgrade."),icon:[14,0]}
		};
		
		Game.ascendMeterPercent=0;
		Game.ascendMeterPercentT=0;
		Game.ascendMeterLevel=100000000000000000000000000000;
		
		Game.nextAscensionMode=0;
		Game.UpdateAscensionModePrompt=UpdateAscensionModePrompt;//CC3 rewrite (phase 4, slice 6): moved verbatim to systems/ascend.ts; same Game slot, same Init position.
		Game.PickAscensionMode=PickAscensionMode;//CC3 rewrite (phase 4, slice 6).
		Game.heavenlyPreset='auto';//CC3: the active heavenly-tree arrangement (a preset id, or null once the player hand-drags)
		var heavenlyPresetButtons=(HEAVENLY_PRESETS).map(function(p){
			return '<a class="heavenlyPreset option framed small" data-preset="'+p.id+'" style="font-size:11px;margin-right:2px;cursor:pointer;" '+Game.clickStr+'="Game.ApplyHeavenlyPreset(\''+p.id+'\');" '+Game.getTooltip('<div style="min-width:160px;text-align:center;font-size:11px;padding:8px;">'+loc(p.desc)+'</div>','bottom-right')+'>'+loc(p.label)+'</a>';
		}).join('');
		l('ascendOverlay').innerHTML=
			'<div id="ascendBox">'+
			'<div id="ascendData1" class="ascendData smallFramed prompt" style="margin-top:8px;"><h3 id="ascendPrestige"></h3></div>'+
			'<div id="ascendData2" class="ascendData smallFramed prompt"><h3 id="ascendHCs"></h3></div>'+
			'<a id="ascendButton" class="option framed large red" '+Game.getTooltip(
							'<div style="min-width:300px;text-align:center;font-size:11px;padding:8px;" id="tooltipReincarnate">'+loc("Click this once you've bought<br>everything you need!")+'</div>'
							,'bottom-right')+' style="font-size:16px;margin-top:0px;"><span class="fancyText" style="font-size:20px;">'+loc("Reincarnate")+'</span></a>'+
			'<div id="ascendModeButton" style="position:absolute;right:34px;bottom:25px;display:none;"></div>'+
			'<input type="text" style="display:block;" id="upgradePositions"/></div>'+
			'<div id="arrangeTreeBox" style="position:absolute;left:-172px;top:178px;width:344px;text-align:center;">'+
			'<div id="heavenlyPresets" style="margin-bottom:4px;">'+heavenlyPresetButtons+'</div>'+
			'<a id="arrangeTreeButton" class="option framed small" style="font-size:11px;" '+Game.clickStr+'="Game.ToggleArrangeHeavenly();" '+Game.getTooltip('<div style="min-width:220px;text-align:center;font-size:11px;padding:8px;">'+loc("Turn on arrange mode to drag heavenly upgrades wherever you want.<br>Your layout is saved and kept between ascensions.")+'</div>','bottom-right')+'>'+loc("Arrange")+'</a>'+
			' <a id="arrangeTreeReset" class="option framed small" style="font-size:11px;display:none;" '+Game.clickStr+'="Game.ResetHeavenlyLayout();" '+Game.getTooltip('<div style="min-width:180px;text-align:center;font-size:11px;padding:8px;">'+loc("Restore the default heavenly tree layout.")+'</div>','bottom-right')+'>'+loc("Reset layout")+'</a>'+
			'</div>'+
			
			'<div id="ascendInfo"><div class="ascendData smallFramed" style="margin-top:22px;width:75%;font-size:11px;">'+loc("You are ascending.<br>Drag the screen around<br>or use arrow keys!<br>When you're ready,<br>click Reincarnate.")+'</div></div>';
		
		Game.ascendButtonHTML=l('ascendButton').innerHTML;//CC3: original Reincarnate label, restored by AscendBrowseClose
		Game.ascendInfoHTML=l('ascendInfo').innerHTML;//CC3: original ascend info text, restored by AscendBrowseClose
		
		Game.attachTooltip(l('ascendData1'),function(){return '<div style="min-width:300px;text-align:center;font-size:11px;padding:8px;" id="tooltipAscendData1">(<b>'+Beautify(Game.heavenlyChips)+'</b>)<div class="line"></div>'+loc("Each prestige level grants you a permanent <b>+%1% CpS</b>.<br>The more levels you have, the more cookies they require.",1)+'</div>';},'bottom-right');
		Game.attachTooltip(l('ascendData2'),function(){return '<div style="min-width:300px;text-align:center;font-size:11px;padding:8px;" id="tooltipAscendData2">(<b>'+loc("%1 heavenly chip",LBeautify(Game.heavenlyChips))+'</b>)<div class="line"></div>'+loc("Heavenly chips are used to buy heavenly upgrades.<br>You gain <b>1 chip</b> every time you gain a prestige level.")+'</div>';},'bottom-right');
		
		Game.UpdateAscensionModePrompt();
		// CC3: highlight the active heavenly-tree arrangement preset button.
		Game.UpdateHeavenlyPresetButtons=function(){
			var active=Game.heavenlyPreset;
			var btns=document.querySelectorAll('#heavenlyPresets .heavenlyPreset');
			for (var i=0;i<btns.length;i++){var b=btns[i] as HTMLElement;var on=(b.getAttribute('data-preset')===active);b.style.fontWeight=on?'bold':'normal';b.style.background=on?'#5a4':'transparent';}
		};
		if (Game.UpdateHeavenlyPresetButtons) Game.UpdateHeavenlyPresetButtons();
		
		AddEvent(l('ascendButton'),'click',function(){
			PlaySound('snd/tick.mp3');
			if (Game.AscendBrowse && !Game.DebuggingPrestige) {Game.AscendBrowseClose();return;}//CC3: browse mode just closes the tree, nothing resets
			Game.Reincarnate();
		});
		
		Game.ascendl=l('ascend');
		Game.ascendContentl=l('ascendContent');
		Game.ascendZoomablel=l('ascendZoomable');
		Game.ascendUpgradesl=l('ascendUpgrades');
		Game.OnAscend=0;
		Game.AscendBrowse=0;//CC3: 1 while viewing the heavenly tree without ascending
		Game.AscendTimer=0;//how far we are into the ascend animation
		Game.AscendDuration=Game.fps*5;//how long the ascend animation is
		Game.AscendBreakpoint=Game.AscendDuration*0.5;//at which point the cookie explodes during the ascend animation
		Game.UpdateAscendIntro=UpdateAscendIntro;//CC3 rewrite (phase 4, slice 6).
		Game.ReincarnateTimer=0;//how far we are into the reincarnation animation
		Game.ReincarnateDuration=Game.fps*1;//how long the reincarnation animation is
		Game.UpdateReincarnateIntro=UpdateReincarnateIntro;//CC3 rewrite (phase 4, slice 6).
		Game.Reincarnate=Reincarnate;//CC3 rewrite (phase 4, slice 6).
		Game.Ascend=Ascend;//CC3 rewrite (phase 4, slice 6).
		Game.AscendBrowseView=AscendBrowseView;//CC3: view-only heavenly tree (no ascension).
		Game.AscendBrowseClose=AscendBrowseClose;//CC3: close the browse-only heavenly tree.
		Game.DebuggingPrestige=0;
		Game.AscendDragX=0;
		Game.AscendDragY=0;
		Game.AscendOffX=0;
		Game.AscendOffY=0;
		Game.AscendZoom=1;
		Game.AscendOffXT=0;
		Game.AscendOffYT=0;
		Game.AscendZoomT=1;
		Game.AscendDragging=0;
		Game.AscendGridSnap=24;
		Game.ArrangeHeavenly=0;//CC3: player arrange mode — drag heavenly upgrades into place; overrides persist in localStorage
		Game.AscendDragStartX=0;//CC3: click-origin tracking for arrange mode (a <6px jiggle is a click, not a drag)
		Game.AscendDragStartY=0;
		Game.AscendDragMoved=0;
		Game.ArrangeLayout={};//CC3: upgrade id -> [x,y] overrides the player has set
		Game.heavenlyBounds={left:0,right:0,top:0,bottom:0};
		Game.UpdateAscend=UpdateAscend;//CC3 rewrite (phase 4, slice 6).
		Game.AscendRefocus=AscendRefocus;//CC3 rewrite (phase 4, slice 6).
		Game.SelectedHeavenlyUpgrade=0;
		Game.PurchaseHeavenlyUpgrade=PurchaseHeavenlyUpgrade;//CC3 rewrite (phase 4, slice 6).
		Game.BuildAscendTree=BuildAscendTree;//CC3 rewrite (phase 4, slice 6): the ~409-line heavenly tree renderer moved verbatim.
		Game.SaveHeavenlyLayout=SaveHeavenlyLayout;//CC3: arrange-mode persistence.
		Game.ToggleArrangeHeavenly=ToggleArrangeHeavenly;//CC3: arrange-mode toggle.
		Game.ResetHeavenlyLayout=ResetHeavenlyLayout;//CC3: arrange-mode reset.
		Game.ApplyHeavenlyPreset=applyHeavenlyPreset;//CC3: click a preset to arrange the tree.
		Game.syncHeavenlyLayoutIfStale=syncHeavenlyLayoutIfStale;//CC3: re-sync if mods added prestige upgrades after init
			/*===============================================================
			COALESCING SUGAR LUMPS
			=======================================================
			=============================*/
		Game.lumpMatureAge=1;
		Game.lumpRipeAge=1;
		Game.lumpOverripeAge=1;
		Game.lumpCurrentType=0;
		l('comments').innerHTML=l('comments').innerHTML+
			'<div id="lumps" onclick="Game.clickLump();" '+Game.getDynamicTooltip('Game.lumpTooltip','bottom')+'><div id="lumpsIcon" class="usesIcon"></div><div id="lumpsIcon2" class="usesIcon"></div><div id="lumpsAmount">0</div></div>';
		Game.lumpTooltip=lumpTooltip;//CC3 rewrite (phase 4, slice 6): sugar-lump system moved verbatim to systems/ascend.ts (it sits between the ascend functions in the original Init body).
		Game.computeLumpTimes=computeLumpTimes;//CC3 rewrite (phase 4, slice 6).
		Game.loadLumps=loadLumps;//CC3 rewrite (phase 4, slice 6).
		Game.gainLumps=gainLumps;//CC3 rewrite (phase 4, slice 6).
		Game.clickLump=clickLump;//CC3 rewrite (phase 4, slice 6).
		Game.harvestLumps=harvestLumps;//CC3 rewrite (phase 4, slice 6).
		Game.computeLumpType=computeLumpType;//CC3 rewrite (phase 4, slice 6).
		Game.canLumps=canLumps;//CC3 rewrite (phase 4, slice 6).
		Game.getLumpRefillMax=getLumpRefillMax;//CC3 rewrite (phase 4, slice 6).
		Game.getLumpRefillRemaining=getLumpRefillRemaining;//CC3 rewrite (phase 4, slice 6).
		Game.canRefillLump=canRefillLump;//CC3 rewrite (phase 4, slice 6).
		Game.refillLump=refillLump;//CC3 rewrite (phase 4, slice 6).
		Game.spendLump=spendLump;//CC3 rewrite (phase 4, slice 6).
		Game.doLumps=doLumps;//CC3 rewrite (phase 4, slice 6).
		Game.Earn=function(howmuch: any)
		{
			Game.cookies+=howmuch;
			Game.cookiesEarned+=howmuch;
		}
		Game.Spend=function(howmuch: any)
		{
			Game.cookies-=howmuch;
		}
		Game.Dissolve=function(howmuch: any)
		{
			Game.cookies-=howmuch;
			Game.cookiesEarned-=howmuch;
			Game.cookies=Math.max(0,Game.cookies);
			Game.cookiesEarned=Math.max(0,Game.cookiesEarned);
		}
		Game.mouseCps=function()
		{
			var add=0;
			if (Game.Has('Thousand fingers')) add+=		0.1;
			if (Game.Has('Million fingers')) add*=		5;
			if (Game.Has('Billion fingers')) add*=		10;
			if (Game.Has('Trillion fingers')) add*=		20;
			if (Game.Has('Quadrillion fingers')) add*=	20;
			if (Game.Has('Quintillion fingers')) add*=	20;
			if (Game.Has('Sextillion fingers')) add*=	20;
			if (Game.Has('Septillion fingers')) add*=	20;
			if (Game.Has('Octillion fingers')) add*=	20;
			if (Game.Has('Nonillion fingers')) add*=	20;
			if (Game.Has('Decillion fingers')) add*=	20;
			if (Game.Has('Unshackled cursors')) add*=	25;
			
			var num=0;
			for (var i in Game.Objects) {num+=Game.Objects[i].amount;}
			num-=Game.Objects['Cursor'].amount;
			add=add*num;
			if (Game.Has('Plastic mouse')) add+=Game.cookiesPs*0.01;
			if (Game.Has('Iron mouse')) add+=Game.cookiesPs*0.01;
			if (Game.Has('Titanium mouse')) add+=Game.cookiesPs*0.01;
			if (Game.Has('Adamantium mouse')) add+=Game.cookiesPs*0.01;
			if (Game.Has('Unobtainium mouse')) add+=Game.cookiesPs*0.01;
			if (Game.Has('Eludium mouse')) add+=Game.cookiesPs*0.01;
			if (Game.Has('Wishalloy mouse')) add+=Game.cookiesPs*0.01;
			if (Game.Has('Fantasteel mouse')) add+=Game.cookiesPs*0.01;
			if (Game.Has('Nevercrack mouse')) add+=Game.cookiesPs*0.01;
			if (Game.Has('Armythril mouse')) add+=Game.cookiesPs*0.01;
			if (Game.Has('Technobsidian mouse')) add+=Game.cookiesPs*0.01;
			if (Game.Has('Plasmarble mouse')) add+=Game.cookiesPs*0.01;
			if (Game.Has('Miraculite mouse')) add+=Game.cookiesPs*0.01;
			if (Game.Has('Aetherice mouse')) add+=Game.cookiesPs*0.01;
			
			if (Game.Has('Fortune #104')) add+=Game.cookiesPs*0.01;
			if (Game.cookieUpgrades)
			{
				for (var iCookie in Game.cookieUpgrades)
				{
					var cookieUpgrade=Game.cookieUpgrades[iCookie];
					if (cookieUpgrade.clickPower && Game.Has(cookieUpgrade.name)) add+=Game.cookiesPs*cookieUpgrade.clickPower*0.01;
				}
			}
			if (Game.Has('Purrfect timing')) add+=Game.cookiesPs*0.01;
			var mult=1;
			
			
			if (Game.Has('Santa\'s helpers')) mult*=1.1;
			if (Game.Has('Cookie egg')) mult*=1.1;
			if (Game.Has('Halo gloves')) mult*=1.1;
			if (Game.Has('Dragon claw')) mult*=1.03;
			if (Game.Has('Firm handshake')) mult*=1.05;
			if (Game.Has('Demonic hustle')) mult*=1.05;
			
			if (Game.Has('Aura gloves'))
			{
				mult*=1+0.05*Math.min(Game.Objects['Cursor'].level,Game.Has('Luminous gloves')?20:10);
			}
			
			mult*=Game.eff('click');
			//CC3: Trigger finger completion reward — +2% cookie click power
			if (Game.Has('Scrolling adept')) mult*=1.02;
			
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('labor');
				if (godLvl==1) mult*=1.15;
				else if (godLvl==2) mult*=1.1;
				else if (godLvl==3) mult*=1.05;
			}
			
			for (var i in Game.buffs)
			{
				if (typeof Game.buffs[i].multClick != 'undefined') mult*=Game.buffs[i].multClick;
			}
			
			//if (Game.hasAura('Dragon Cursor')) mult*=1.05;
			mult*=1+Game.auraMult('Dragon Cursor')*0.05;
			
			var out=mult*Game.ComputeCps(1,Game.Has('Reinforced index finger')+Game.Has('Carpal tunnel prevention cream')+Game.Has('Ambidextrous'),add);
			
			out=Game.runModHookOnValue('cookiesPerClick',out);
			
			if (Game.hasBuff('Cursed finger')) out=Game.buffs['Cursed finger'].power;
			return out;
		}
		Game.computedMouseCps=1;
		Game.globalCpsMult=1;
		Game.unbuffedCps=0;
		Game.buildingCps=0;
		Game.lastClick=0;
		Game.CanClick=1;
		Game.autoclickerDetected=0;
		Game.BigCookieState=0;//0 = normal, 1 = clicked (small), 2 = released/hovered (big)
		Game.BigCookieSize=0;
		Game.BigCookieSizeD=0;
		Game.BigCookieSizeT=1;
		Game.cookieClickSound=Math.floor(Math.random()*7)+1;
		Game.playCookieClickSound=function()
		{
			if (Game.prefs.cookiesound) PlaySound('snd/clickb'+(Game.cookieClickSound)+'.mp3',0.5);
			else PlaySound('snd/click'+(Game.cookieClickSound)+'.mp3',0.5);
			Game.cookieClickSound+=Math.floor(Math.random()*4)+1;
			if (Game.cookieClickSound>7) Game.cookieClickSound-=7;
		}
		Game.ClickCookie=function(e: any,amount: any)
		{
			var now=Date.now();
			if (e) e.preventDefault();
			if (Game.OnAscend || Game.AscendTimer>0 || Game.T<3 || now-Game.lastClick<1000/((e?e.detail:1)===0?3:50)) {}
			else
			{
				if (now-Game.lastClick<(1000/15) && Game.ascensionMode!=2)//CC3: Trigger finger — scroll clicks don't count as autoclicker clicking achievements
				{
					Game.autoclickerDetected+=Game.fps;
					if (Game.autoclickerDetected>=Game.fps*5) Game.Win('Uncanny clicker');
				}
				Game.loseShimmeringVeil('click');
				var amount=amount?amount:Game.computedMouseCps;
				Game.Earn(amount);
				Game.handmadeCookies+=amount;
				if (Game.prefs.particles)
				{
					Game.particleAdd();
					Game.particleAdd(Game.mouseX,Game.mouseY,Math.random()*4-2,Math.random()*-2-2,Math.random()*0.5+0.75,1,2);
				}
				if (Game.prefs.numbers) Game.particleAdd(Game.mouseX+Math.random()*8-4,Game.mouseY-8+Math.random()*8-4,0,-2,1,4,2,'','+'+Beautify(amount,1));
				
				Game.runModHook('click');
				
				Game.playCookieClickSound();
				Game.cookieClicks++;
				
				if (Game.clicksThisSession==0) PlayCue('preplay');
				Game.clicksThisSession++;
				Game.lastClick=now;
			}
			Game.Click=0;
		}
		Game.mouseX=0;
		Game.mouseY=0;
		Game.mouseX2=0;
		Game.mouseY2=0;
		Game.mouseMoved=0;
		Game.GetMouseCoords=function(e: any)
		{
			var posx=0;
			var posy=0;
			if (!e) var e: any=window.event;
			if (e.pageX||e.pageY)
			{
				posx=e.pageX;
				posy=e.pageY;
			}
			else if (e.clientX || e.clientY)
			{
				posx=e.clientX+document.body.scrollLeft+document.documentElement.scrollLeft;
				posy=e.clientY+document.body.scrollTop+document.documentElement.scrollTop;
			}
			var x=0;
			var y=TopBarOffset;
			/*
			var el=l('sectionLeft');
			while(el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop))
			{
				x+=el.offsetLeft-el.scrollLeft;
				y+=el.offsetTop-el.scrollTop;
				el=el.offsetParent;
			}*/
			Game.mouseX2=Game.mouseX;
			Game.mouseY2=Game.mouseY;
			Game.mouseX=(posx-x)/Game.scale;
			Game.mouseY=(posy-y)/Game.scale;
			Game.mouseMoved=1;
			Game.lastActivity=Game.time;
		}
		var bigCookie=l('bigCookie');
		if (Game.prefs.screenreader)
		{
			bigCookie.ariaLabelledby='bigCookieLabel';
			bigCookie.insertAdjacentHTML('beforeend','<label id="bigCookieLabel" style="font-size:100px !important;" class="srOnly">'+loc("Big clickable cookie")+'</label>');
			bigCookie.tabIndex=1;
		}
		Game.Click=0;
		Game.lastClickedEl=0;
		Game.clicksThisSession=0;
		Game.clickFrom=0;
		Game.Scroll=0;
		Game.mouseDown=0;
		if (!Game.touchEvents)
		{
			AddEvent(bigCookie,'click',Game.ClickCookie);
			AddEvent(bigCookie,'mousedown',function(event: any){Game.BigCookieState=1;if (Game.prefs.cookiesound) {Game.playCookieClickSound();}if (event) event.preventDefault();});
			AddEvent(bigCookie,'mouseup',function(event: any){Game.BigCookieState=2;if (event) event.preventDefault();});
			AddEvent(bigCookie,'mouseout',function(_event: any){Game.BigCookieState=0;});
			AddEvent(bigCookie,'mouseover',function(_event: any){Game.BigCookieState=2;});
			AddEvent(document,'mousemove',Game.GetMouseCoords);
			AddEvent(document,'mousedown',function(event: any){Game.lastActivity=Game.time;Game.mouseDown=1;Game.clickFrom=event.target;});
			AddEvent(document,'mouseup',function(_event: any){Game.lastActivity=Game.time;Game.mouseDown=0;Game.clickFrom=0;});
			AddEvent(document,'click',function(event: any){Game.lastActivity=Game.time;Game.Click=1;Game.lastClickedEl=event.target;Game.clickFrom=0;});
			Game.handleScroll=function(e: any)
			{
				if (!e) e=event;
				Game.Scroll=(e.detail<0||e.wheelDelta>0)?1:-1;
				Game.lastActivity=Game.time;
			};
			AddEvent(document,'DOMMouseScroll',Game.handleScroll);
			AddEvent(document,'mousewheel',Game.handleScroll);
		}
		else
		{
			//touch events
			AddEvent(bigCookie,'touchend',Game.ClickCookie);
			AddEvent(bigCookie,'touchstart',function(event: any){Game.BigCookieState=1;if (event) event.preventDefault();});
			AddEvent(bigCookie,'touchend',function(event: any){Game.BigCookieState=0;if (event) event.preventDefault();});
			//AddEvent(document,'touchmove',Game.GetMouseCoords);
			AddEvent(document,'mousemove',Game.GetMouseCoords);
			AddEvent(document,'touchstart',function(_event: any){Game.lastActivity=Game.time;Game.mouseDown=1;});
			AddEvent(document,'touchend',function(_event: any){Game.lastActivity=Game.time;Game.mouseDown=0;});
			AddEvent(document,'touchend',function(_event: any){Game.lastActivity=Game.time;Game.Click=1;});
		}
		
		Game.keys=[];
		AddEvent(window,'keyup',function(e: any){
			Game.lastActivity=Game.time;
			if (e.keyCode==27)
			{
				if (Game.promptOn) {Game.ClosePrompt();PlaySound('snd/tickOff.mp3');}
				if (Game.AscendTimer>0) Game.AscendTimer=Game.AscendDuration;
			}//esc closes prompt
			if (Game.promptOn)
			{
				if (e.keyCode==13) Game.ConfirmPrompt();//enter confirms prompt
			}
			Game.keys[e.keyCode]=0;
		});
		AddEvent(window,'keydown',function(e: any){
			if (Game.promptOn)
			{
				if (e.keyCode==9)
				{
					//tab to shift through prompt buttons
					if (e.shiftKey) Game.FocusPromptOption(-1);
					else Game.FocusPromptOption(1);
					e.preventDefault();
				}
			}
			if (!Game.OnAscend && Game.AscendTimer==0)
			{
				if (e.ctrlKey && e.keyCode==83) {Game.toSave=true;e.preventDefault();}//ctrl-s saves the game
				else if (e.ctrlKey && e.keyCode==79) {Game.ImportSave();e.preventDefault();}//ctrl-o opens the import menu
			}
			if ((e.keyCode==16 || e.keyCode==17) && Game.tooltip.dynamic) Game.tooltip.update();
			Game.keys[e.keyCode]=1;
			if (e.keyCode==9) Game.keys=[];//reset keys on tab press
		});
		
		AddEvent(window,'visibilitychange',function(_e: any){
			Game.keys=[];//reset all key pressed on visibility change (should help prevent ctrl still being down after ctrl-tab)
		});
		
		/*=====================================================================================
		CPS RECALCULATOR
		=======================================================================================*/
		
		Game.heavenlyPower=1;//how many CpS percents a single heavenly chip gives
		Game.recalculateGains=1;
		Game.cookiesPsByType={};
		Game.cookiesMultByType={};
		//display bars with http://codepen.io/anon/pen/waGyEJ
		Game.effs={};
		Game.eff=function(name: any,def: any){if (typeof Game.effs[name]==='undefined') return (typeof def==='undefined'?1:def); else return Game.effs[name];};
		
		Game.CalculateGains=function()
		{
			Game.cookiesPs=0;
			var mult=1;
			//add up effect bonuses from building minigames
			var effs: any={};
			for (var iKey in Game.Objects)
			{
				if (Game.Objects[iKey].minigameLoaded && Game.Objects[iKey].minigame.effs)
				{
					var myEffs=Game.Objects[iKey].minigame.effs;
					for (var ii in myEffs)
					{
						if (effs[ii]) effs[ii]*=myEffs[ii];
						else effs[ii]=myEffs[ii];
					}
				}
			}
			Game.effs=effs;
			
			if (Game.ascensionMode!=1) mult+=parseFloat(Game.prestige)*0.01*Game.heavenlyPower*Game.GetHeavenlyMultiplier();
			
			mult*=Game.eff('cps');
			
			if (Game.Has('Heralds') && Game.ascensionMode!=1) mult*=(1+0.01*Game.heralds);
			if (Game.Has('Cat café loyalty')) mult*=1.01;
			
			for (var iKey in Game.cookieUpgrades)
			{
				var me=Game.cookieUpgrades[iKey];
				if (Game.Has(me.name))
				{
					mult*=(1+(typeof(me.power)==='function'?me.power(me):me.power)*0.01);
				}
			}
			
			if (Game.Has('Specialized chocolate chips')) mult*=1.01;
			if (Game.Has('Designer cocoa beans')) mult*=1.02;
			if (Game.Has('Underworld ovens')) mult*=1.03;
			if (Game.Has('Exotic nuts')) mult*=1.04;
			if (Game.Has('Arcane sugar')) mult*=1.05;
			
			if (Game.Has('Increased merriness')) mult*=1.15;
			if (Game.Has('Improved jolliness')) mult*=1.15;
			if (Game.Has('A lump of coal')) mult*=1.01;
			if (Game.Has('An itchy sweater')) mult*=1.01;
			if (Game.Has('Santa\'s dominion')) mult*=1.2;
			
			if (Game.Has('Fortune #100')) mult*=1.01;
			if (Game.Has('Fortune #101')) mult*=1.07;
			
			if (Game.Has('Dragon scale')) mult*=1.03;
			
			var buildMult=1;
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('asceticism');
				if (godLvl==1) mult*=1.15;
				else if (godLvl==2) mult*=1.1;
				else if (godLvl==3) mult*=1.05;
				
				var godLvl=Game.hasGod('ages');
				if (godLvl==1) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*3))*Math.PI*2);
				else if (godLvl==2) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);
				else if (godLvl==3) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);
				
				var godLvl=Game.hasGod('decadence');
				if (godLvl==1) buildMult*=0.93;
				else if (godLvl==2) buildMult*=0.95;
				else if (godLvl==3) buildMult*=0.98;
				
				var godLvl=Game.hasGod('industry');
				if (godLvl==1) buildMult*=1.1;
				else if (godLvl==2) buildMult*=1.06;
				else if (godLvl==3) buildMult*=1.03;
				
				var godLvl=Game.hasGod('labor');
				if (godLvl==1) buildMult*=0.97;
				else if (godLvl==2) buildMult*=0.98;
				else if (godLvl==3) buildMult*=0.99;
			}
			
			if (Game.Has('Santa\'s legacy')) mult*=1+(Game.santaLevel+1)*0.03;
			
			
			Game.milkProgress=Game.AchievementsOwned/25;
			var milkMult=1;
			if (Game.Has('Santa\'s milk and cookies')) milkMult*=1.05;
			//if (Game.hasAura('Breath of Milk')) milkMult*=1.05;
			milkMult*=1+Game.auraMult('Breath of Milk')*0.05;
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('mother');
				if (godLvl==1) milkMult*=1.1;
				else if (godLvl==2) milkMult*=1.05;
				else if (godLvl==3) milkMult*=1.03;
			}
			milkMult*=Game.eff('milk');
			
			var catMult=1;
			
			if (Game.Has('Kitten helpers')) catMult*=(1+Game.milkProgress*0.1*milkMult);
			if (Game.Has('Kitten workers')) catMult*=(1+Game.milkProgress*0.125*milkMult);
			if (Game.Has('Kitten engineers')) catMult*=(1+Game.milkProgress*0.15*milkMult);
			if (Game.Has('Kitten overseers')) catMult*=(1+Game.milkProgress*0.175*milkMult);
			if (Game.Has('Kitten managers')) catMult*=(1+Game.milkProgress*0.2*milkMult);
			if (Game.Has('Kitten accountants')) catMult*=(1+Game.milkProgress*0.2*milkMult);
			if (Game.Has('Kitten specialists')) catMult*=(1+Game.milkProgress*0.2*milkMult);
			if (Game.Has('Kitten experts')) catMult*=(1+Game.milkProgress*0.2*milkMult);
			if (Game.Has('Kitten consultants')) catMult*=(1+Game.milkProgress*0.2*milkMult);
			if (Game.Has('Kitten assistants to the regional manager')) catMult*=(1+Game.milkProgress*0.175*milkMult);
			if (Game.Has('Kitten marketeers')) catMult*=(1+Game.milkProgress*0.15*milkMult);
			if (Game.Has('Kitten analysts')) catMult*=(1+Game.milkProgress*0.125*milkMult);
			if (Game.Has('Kitten executives')) catMult*=(1+Game.milkProgress*0.115*milkMult);
			if (Game.Has('Kitten admins')) catMult*=(1+Game.milkProgress*0.11*milkMult);
			if (Game.Has('Kitten angels')) catMult*=(1+Game.milkProgress*0.1*milkMult);
			if (Game.Has('Fortune #103')) catMult*=(1+Game.milkProgress*0.05*milkMult);
			
			Game.cookiesMultByType['kittens']=catMult;
			
			for (var iKey in Game.Objects)
			{
				var me=Game.Objects[iKey];
				me.storedCps=me.cps(me);
				if (Game.ascensionMode!=1) me.storedCps*=(1+me.level*0.01)*buildMult;
				if (me.id==1 && Game.Has('Milkhelp&reg; lactose intolerance relief tablets')) me.storedCps*=1+0.05*Game.milkProgress*milkMult;//this used to be "me.storedCps*=1+0.1*Math.pow(catMult-1,0.5)" which was. hmm
				me.storedTotalCps=me.amount*me.storedCps;
				Game.cookiesPs+=me.storedTotalCps;
				Game.cookiesPsByType[me.name]=me.storedTotalCps;
			}
			//cps from buildings only
			Game.buildingCps=Game.cookiesPs;
			
			if (Game.Has('"egg"')) {Game.cookiesPs+=9;Game.cookiesPsByType['"egg"']=9;}//"egg"
			
			mult*=catMult;
			
			var eggMult=1;
			if (Game.Has('Chicken egg')) eggMult*=1.01;
			if (Game.Has('Duck egg')) eggMult*=1.01;
			if (Game.Has('Turkey egg')) eggMult*=1.01;
			if (Game.Has('Quail egg')) eggMult*=1.01;
			if (Game.Has('Robin egg')) eggMult*=1.01;
			if (Game.Has('Ostrich egg')) eggMult*=1.01;
			if (Game.Has('Cassowary egg')) eggMult*=1.01;
			if (Game.Has('Salmon roe')) eggMult*=1.01;
			if (Game.Has('Frogspawn')) eggMult*=1.01;
			if (Game.Has('Shark egg')) eggMult*=1.01;
			if (Game.Has('Turtle egg')) eggMult*=1.01;
			if (Game.Has('Ant larva')) eggMult*=1.01;
			if (Game.Has('Century egg'))
			{
				//the boost increases a little every day, with diminishing returns up to +10% on the 100th day
				var day=Math.floor((Date.now()-Game.startDate)/1000/10)*10/60/60/24;
				day=Math.min(day,100);
				eggMult*=1+(1-Math.pow(1-day/100,3))*0.1;
			}
			
			Game.cookiesMultByType['eggs']=eggMult;
			mult*=eggMult;
			
			if (Game.Has('Sugar baking')) mult*=(1+Math.min(100,Game.lumps)*0.01);
			
			//CC3: challenge rewards — Monoculture (Unity: +1% CpS per 100 of your
			//most-owned building) and Spender (Minimalist: +2% CpS per 100
			//upgrades owned).
			if (Game.Has('Unity'))
			{
				var mostOwned=0;
				for (var iUnity in Game.Objects)
				{
					if (Game.Objects[iUnity].amount>mostOwned) mostOwned=Game.Objects[iUnity].amount;
				}
				mult*=(1+0.01*Math.floor(mostOwned/100));
			}
			if (Game.Has('Minimalist'))
			{
				var prestigeOwned=0;
				for (var iPrestige in Game.PrestigeUpgrades)
				{
					if (Game.PrestigeUpgrades[iPrestige].bought) prestigeOwned++;
				}
				mult*=(1+0.02*Math.floor(prestigeOwned/100));
			}
			
			//if (Game.hasAura('Radiant Appetite')) mult*=2;
			mult*=1+Game.auraMult('Radiant Appetite');
			
			var rawCookiesPs=Game.cookiesPs*mult;
			for (var iKey in Game.CpsAchievements)
			{
				if (rawCookiesPs>=Game.CpsAchievements[iKey].threshold) Game.Win(Game.CpsAchievements[iKey].name);
			}
			Game.cookiesPsRaw=rawCookiesPs;
			Game.cookiesPsRawHighest=Math.max(Game.cookiesPsRawHighest,rawCookiesPs);
			
			var n=Game.shimmerTypes['golden'].n;
			var auraMult=Game.auraMult('Dragon\'s Fortune');
			for (var i=0;i<n;i++){mult*=1+auraMult*1.23;}
			
			var name=Game.bakeryName.toLowerCase();
			if (name=='orteil') mult*=0.99;
			else if (name=='ortiel') mult*=0.98;//or so help me
			
			var sucking=0;
			for (var iKey in Game.wrinklers)
			{
				if (Game.wrinklers[iKey].phase==2)
				{
					sucking++;
				}
			}
			var suckRate=1/20;//each wrinkler eats a twentieth of your CpS
			suckRate*=Game.eff('wrinklerEat');
			
			Game.cpsSucked=sucking*suckRate;
			
			
			if (Game.Has('Elder Covenant')) mult*=0.95;
			
			if (Game.Has('Golden switch [off]'))
			{
				var goldenSwitchMult=1.5;
				if (Game.Has('Residual luck'))
				{
					var upgrades=Game.goldenCookieUpgrades;
					for (var iKey in upgrades) {if (Game.Has(upgrades[iKey])) goldenSwitchMult+=0.1;}
				}
				mult*=goldenSwitchMult;
			}
			if (Game.Has('Shimmering veil [off]'))
			{
				mult*=1+Game.getVeilBoost();
			}
			if (Game.Has('Magic shenanigans')) mult*=1000;
			if (Game.Has('Occult obstruction')) mult*=0;
			
			
			Game.cookiesPs=Game.runModHookOnValue('cps',Game.cookiesPs);
			
			
			//cps without golden cookie effects
			Game.unbuffedCps=Game.cookiesPs*mult;
			
			for (var iKey in Game.buffs)
			{
				if (typeof Game.buffs[iKey].multCpS!=='undefined') mult*=Game.buffs[iKey].multCpS;
			}
			
			Game.globalCpsMult=mult;
			Game.cookiesPs*=Game.globalCpsMult;
			
			//if (Game.hasBuff('Cursed finger')) Game.cookiesPs=0;
			
			Game.computedMouseCps=Game.mouseCps();
			
			Game.computeLumpTimes();
			
			Game.recalculateGains=0;
		}
		
		Game.dropRateMult=function()
		{
			var rate=1;
			if (Game.Has('Green yeast digestives')) rate*=1.03;
			if (Game.Has('Dragon teddy bear')) rate*=1.03;
			rate*=Game.eff('itemDrops');
			//if (Game.hasAura('Mind Over Matter')) rate*=1.25;
			rate*=1+Game.auraMult('Mind Over Matter')*0.25;
			if (Game.Has('Santa\'s bottomless bag')) rate*=1.1;
			if (Game.Has('Cosmic beginner\'s luck') && !Game.Has('Heavenly chip secret')) rate*=5;
			return rate;
		}
		/*=====================================================================================
		SHIMMERS (GOLDEN COOKIES & SUCH)
		=======================================================================================*/
		Game.shimmersL=l('shimmers');
		Game.shimmers=[];//all shimmers currently on the screen
		Game.shimmersN=Math.floor(Math.random()*10000);
		Game.shimmer=Shimmer;//CC3 rewrite (phase 4, slice 4): the ctor + 4 prototype methods moved to systems/shimmer.ts as the real Shimmer class; same Game slot, same call sites.
		
		Game.updateShimmers=updateShimmers;//CC3 rewrite (phase 4, slice 4): moved verbatim to systems/shimmer.ts.
		Game.killShimmers=killShimmers;//CC3 rewrite (phase 4, slice 4): moved verbatim to systems/shimmer.ts.
		
		Game.shimmerTypes=shimmerTypes;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/shimmerTypes.ts; same Game slot, same Init position.
		
		Game.goldenCookieChoices=goldenCookieChoices;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/shimmerTypes.ts; same Game slot, same Init position.
		Game.goldenCookieBuildingBuffs=goldenCookieBuildingBuffs;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/shimmerTypes.ts; same Game slot, same Init position.
		
		/*=====================================================================================
		PARTICLES
		=======================================================================================*/
		//generic particles (falling cookies etc)
		//only displayed on left section
		Game.particles=[];
		Game.particlesN=50;
		for (var i=0;i<Game.particlesN;i++)
		{
			Game.particles[i]={x:0,y:0,xd:0,yd:0,w:64,h:64,z:0,size:1,dur:2,life:-1,r:0,pic:'smallCookies.webp',picId:0,picPos:[0,0]};
		}
		
		Game.particlesUpdate=particlesUpdate;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/particles.ts; same Game slot, same Init position.
		Game.particleAdd=particleAdd;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/particles.ts; same Game slot, same Init position.
		Game.particlesDraw=particlesDraw;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/particles.ts; same Game slot, same Init position.
		
		//text particles (popups etc)
		Game.textParticles=[];
		Game.textParticlesY=0;
		var str='';
		for (var i=0;i<20;i++)
		{
			Game.textParticles[i]={x:0,y:0,life:-1,text:''};
			str+='<div id="particle'+i+'" class="particle title"></div>';
		}
		l('particles').innerHTML=str;
		Game.textParticlesUpdate=textParticlesUpdate;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/particles.ts; same Game slot, same Init position.
		Game.textParticlesAdd=textParticlesAdd;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/particles.ts; same Game slot, same Init position.
		Game.popups=1;
		Game.Popup=Popup;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/particles.ts; same Game slot, same Init position.
		
		//display sparkles at a set position
		Game.sparkles=l('sparkles');
		Game.sparklesT=0;
		Game.sparklesFrames=16;
		Game.SparkleAt=SparkleAt;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/particles.ts; same Game slot, same Init position.
		Game.SparkleOn=SparkleOn;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/particles.ts; same Game slot, same Init position.
		
		/*=====================================================================================
		NOTIFICATIONS
		=======================================================================================*/
		//maybe do all this mess with proper DOM instead of rewriting the innerHTML
		Game.Notes=[];
		Game.NotesById=[];
		Game.noteId=0;
		Game.noteL=l('notes');
		Game.Note=Note;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/notifications.ts; same Game slot, same Init position.
		Game.CloseNote=CloseNote;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/notifications.ts; same Game slot, same Init position.
		Game.CloseNotes=CloseNotes;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/notifications.ts; same Game slot, same Init position.
		Game.UpdateNotes=UpdateNotes;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/notifications.ts; same Game slot, same Init position.
		Game.NotesLogic=NotesLogic;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/notifications.ts; same Game slot, same Init position.
		Game.NotesDraw=NotesDraw;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/notifications.ts; same Game slot, same Init position.
		Game.Notify=Notify;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/notifications.ts; same Game slot, same Init position.
		Game.NotifyTooltip=NotifyTooltip;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/notifications.ts; same Game slot, same Init position.
		
		
		/*=====================================================================================
		PROMPT
		=======================================================================================*/
		Game.darkenL=l('darken');
		AddEvent(Game.darkenL,'click',function(){Game.Click=0;PlaySound('snd/tickOff.mp3');Game.ClosePrompt();});
		Game.promptL=l('promptContent');
		Game.promptAnchorL=l('promptAnchor');
		Game.promptWrapL=l('prompt');
		Game.promptConfirm='';
		Game.promptOn=0;
		Game.promptUpdateFunc=0;
		Game.promptOptionsN=0;
		Game.promptOptionFocus=0;
		Game.UpdatePrompt=UpdatePrompt;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/notifications.ts; same Game slot, same Init position.
		Game.Prompt=Prompt;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/notifications.ts; same Game slot, same Init position.
		Game.ClosePrompt=ClosePrompt;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/notifications.ts; same Game slot, same Init position.
		Game.ConfirmPrompt=ConfirmPrompt;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/notifications.ts; same Game slot, same Init position.
		Game.FocusPromptOption=FocusPromptOption;//CC3 rewrite (phase 6, slice 3): moved verbatim to ui/notifications.ts; same Game slot, same Init position.
		
		/*=====================================================================================
		MENUS
		=======================================================================================*/
		Game.cssClasses=[];
		Game.addClass=function(what: any) {if (Game.cssClasses.indexOf(what)==-1) Game.cssClasses.push(what);Game.updateClasses();}
		Game.removeClass=function(what: any) {var i=Game.cssClasses.indexOf(what);if(i!=-1) {Game.cssClasses.splice(i,1);}Game.updateClasses();}
		Game.updateClasses=function() {Game.l.className=Game.cssClasses.join(' ');}
		
		Game.WritePrefButton=function(prefName: any,button: any,on: any,off: any,callback: any,invert: any)
		{
			var invertN=invert?1:0;
			if (!callback) callback='';
			callback+='PlaySound(\'snd/tick.mp3\');';
			return '<a class="smallFancyButton prefButton option'+((Game.prefs[prefName]^invertN)?'':' off')+'" id="'+button+'" '+Game.clickStr+'="Game.Toggle(\''+prefName+'\',\''+button+'\',\''+on+'\',\''+off+'\',\''+invertN+'\');'+callback+'">'+(Game.prefs[prefName]?on:off)+'</a>';
		}
		Game.Toggle=function(prefName: any,button: any,on: any,off: any,invert: any)
		{
			if (Game.prefs[prefName])
			{
				l(button).innerHTML=off;
				Game.prefs[prefName]=0;
			}
			else
			{
				l(button).innerHTML=on;
				Game.prefs[prefName]=1;
			}
			l(button).className='smallFancyButton prefButton option'+((Game.prefs[prefName]^invert)?'':' off');
			
		}
		Game.ToggleFancy=function()
		{
			if (Game.prefs.fancy) Game.removeClass('noFancy');
			else if (!Game.prefs.fancy) Game.addClass('noFancy');
		}
		Game.ToggleFilters=function()
		{
			if (Game.prefs.filters) Game.removeClass('noFilters');
			else if (!Game.prefs.filters) Game.addClass('noFilters');
		}
		Game.ToggleExtraButtons=function()
		{
			if (!Game.prefs.extraButtons) Game.removeClass('extraButtons');
			else if (Game.prefs.extraButtons) Game.addClass('extraButtons');
			for (var i in Game.Objects)
			{
				Game.Objects[i].mute(0);
			}
		}
		Game.ToggleFullscreen=function()
		{
			if (App) App.setFullscreen(Game.prefs.fullscreen);
		}
		
		Game.WriteSlider=function(slider: any,leftText: any,rightText: any,startValueFunction: any,callback: any)
		{
			if (!callback) callback='';
			return '<div class="sliderBox"><div style="float:left;" class="smallFancyButton">'+leftText+'</div><div style="float:right;" class="smallFancyButton" id="'+slider+'RightText">'+rightText.replace('[$]',startValueFunction())+'</div><input class="slider" style="clear:both;" type="range" min="0" max="100" step="1" value="'+startValueFunction()+'" onchange="'+callback+'" oninput="'+callback+'" onmouseup="PlaySound(\'snd/tick.mp3\');" id="'+slider+'"/></div>';
		}
		
		Game.onPanel='Left';
		Game.addClass('focus'+Game.onPanel);
		Game.ShowPanel=function(what: any)
		{
			if (!what) what='';
			if (Game.onPanel!=what)
			{
				Game.removeClass('focus'+Game.onPanel);
				Game.addClass('focus'+what);
			}
			Game.onPanel=what;
		}
		
		Game.onMenu='';
		Game.ShowMenu=ShowMenu;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/menu.ts; same Game slot, same Init position.
		Game.sayTime=sayTime;//CC3 rewrite (phase 6, slice 2): the 56-line time formatter moved verbatim to utils/time.ts; same Game slot, same Init position.
		Game.tinyCookie=tinyCookie;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/menu.ts; same Game slot, same Init position.
		Game.ClickTinyCookie=ClickTinyCookie;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/menu.ts; same Game slot, same Init position.
		Game.setVolume=setVolume;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/menu.ts; same Game slot, same Init position.
		Game.setVolumeMusic=setVolumeMusic;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/menu.ts; same Game slot, same Init position.
		Game.setWubMusic=setWubMusic;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/menu.ts; same Game slot, same Init position.
		Game.showLangSelection=showLangSelection;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/menu.ts; same Game slot, same Init position.
		
		ON=' '+loc("ON");
		OFF=' '+loc("OFF");
		Game.UpdateMenu=UpdateMenu;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/menu.ts; same Game slot, same Init position.
		
		AddEvent(l('prefsButton'),'click',function(){Game.ShowMenu('prefs');});
		AddEvent(l('statsButton'),'click',function(){Game.ShowMenu('stats');});
		AddEvent(l('logButton'),'click',function(){Game.ShowMenu('log');});
		AddEvent(l('helpButton'),'click',function(){Game.ShowMenu('help');});
		AddEvent(l('legacyButton'),'click',function(){PlaySound('snd/tick.mp3');Game.Ascend();});
		Game.ascendMeter=l('ascendMeter');
		Game.ascendNumber=l('ascendNumber');
		
		
		/*=====================================================================================
		NEWS TICKER
		=======================================================================================*/
		Game.Ticker='';
		Game.TickerAge=0;
		Game.TickerEffect=0;
		Game.TickerN=0;
		Game.TickerClicks=0;
		Game.UpdateTicker=UpdateTicker;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/ticker.ts; same Game slot, same Init position.
		Game.getNewTicker=getNewTicker;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/ticker.ts; same Game slot, same Init position.
		Game.tickerL=l('commentsText1');
		Game.tickerBelowL=l('commentsText2');
		Game.tickerTooNarrow=900;
		Game.TickerDraw=TickerDraw;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/ticker.ts; same Game slot, same Init position.
		AddEvent(Game.tickerL,'click',function(_event: any){
			Game.Ticker='';
			Game.TickerClicks++;
			if (Game.windowW<Game.tickerTooNarrow) {Game.Win('Stifling the press');}
			else if (Game.TickerClicks>=50) {Game.Win('Tabloid addiction');}
			
			if (Game.TickerEffect && Game.TickerEffect.type=='fortune')
			{
				PlaySound('snd/fortune.mp3',1);
				Game.SparkleAt(Game.mouseX,Game.mouseY);
				var effect=Game.TickerEffect.sub;
				if (effect=='fortuneGC')
				{
					Game.Notify(loc("Fortune!"),loc("A golden cookie has appeared."),[10,32]);
					Game.fortuneGC=1;
					var newShimmer=new Game.shimmer('golden',{noWrath:true});
					void newShimmer;//CC3: verbatim 2.048 unused local; void keeps noUnusedLocals quiet with zero runtime effect.
				}
				else if (effect=='fortuneCPS')
				{
					Game.Notify(loc("Fortune!"),loc("You gain <b>one hour</b> of your CpS (capped at double your bank)."),[10,32]);
					Game.fortuneCPS=1;
					Game.Earn(Math.min(Game.cookiesPs*60*60,Game.cookies));
				}
				else
				{
					Game.Notify(effect.dname,loc("You've unlocked a new upgrade."),effect.icon);
					effect.unlock();
				}
			}
			
			Game.TickerEffect=0;
			
		});
		
		Game.Log=[];
		Game.AddToLog=function(what: any)
		{
			Game.Log.unshift(what);
			if (Game.Log.length>100) Game.Log.pop();
		}
		
		Game.vanilla=1;
		/*=====================================================================================
		BUILDINGS
		=======================================================================================*/
		Game.last=0;
		
		Game.storeToRefresh=1;
		Game.priceIncrease=1.15;
		Game.buyBulk=1;
		Game.buyMode=1;//1 for buy, -1 for sell
		Game.buyBulkOld=Game.buyBulk;//used to undo changes from holding Shift or Ctrl
		Game.buyBulkShortcut=0;//are we pressing Shift or Ctrl?
		
		Game.Objects={};
		Game.ObjectsById=[];
		Game.ObjectsN=0;
		Game.BuildingsOwned=0;
		Game.Object=Building;//CC3 rewrite (phase 3, slice 2): the 737-line ctor moved to core/building.ts as the real Building class; the engine keeps the same Game.Object slot, same call sites, same self-registration.
		
		Game.DrawBuildings=function()//draw building displays with canvas
		{
			if (Game.drawT%3==0)
			{
				for (var i in Game.Objects)
				{
					var me=Game.Objects[i];
					if (me.id>0 && !me.onMinigame && !me.muted) me.draw();
					else me.pics=[];
				}
			}
		}
		
		Game.sortSprites=function(a: any,b: any)
		{
			if (a.z>b.z) return 1;
			else if (a.z<b.z) return -1;
			else return 0;
		}
		Game.sortSpritesById=function(a: any,b: any)
		{
			if (a.id>b.id) return 1;
			else if (a.id<b.id) return -1;
			else return 0;
		}
		Game.modifyBuildingPrice=modifyBuildingPrice;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/store.ts; same Game slot, same Init position.
		Game.storeBulkButton=storeBulkButton;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/store.ts; same Game slot, same Init position.
		Game.BuildStore=BuildStore;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/store.ts; same Game slot, same Init position.
		Game.ClickProduct=ClickProduct;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/store.ts; same Game slot, same Init position.
		Game.RefreshStore=RefreshStore;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/store.ts; same Game slot, same Init position.
		
		Game.ComputeCps=ComputeCps;//CC3 rewrite (phase 4, slice 1): moved verbatim to systems/economy.ts; same Game slot, same Init position.
		
		Game.isMinigameReady=function(me: any)
		{return (me.minigameUrl && me.minigameLoaded && me.level>0);}
		Game.scriptBindings=[];
		Game.showedScriptLoadError=false;
		Game.LoadMinigames=function()//load scripts for each minigame
		{
			for (var i in Game.Objects)
			{
				const me=Game.Objects[i];
				if (me.minigameUrl && me.level>0 && !me.minigameLoaded && !me.minigameLoading && !l('minigameScript-'+me.id))
				{
					me.minigameLoading=true;
					//we're only loading the minigame scripts that aren't loaded yet and which have enough building level
					//we call this function on building level up and on load
					//console.log('Loading script '+me.minigameUrl+'...');
					// CC3: minigame scripts are ES modules resolved by the entry point
window.loadMinigameModule!(me.minigameUrl).then(function(){
						if (!me.minigameLoaded) Game.scriptLoaded(me);
					},function(){
						me.minigameLoading=false;
						if (!me.minigameLoaded && !Game.showedScriptLoadError)
						{
							Game.showedScriptLoadError=true;
							Game.Notify(loc("Error!"),'Couldn\'t load minigames. Try reloading.');
						}
					});
				}
			}
		}
		Game.scriptLoaded=function(who: any,_script: any)
		{
			who.minigameLoading=false;
			who.minigameLoaded=true;
			who.refresh();
			who.minigame.launch();
			if (who.minigameSave) {who.minigame.reset(true);who.minigame.load(who.minigameSave);who.minigameSave=0;}
		}
		
		Game.magicCpS=function(_what: any)
		{
			/*
			if (Game.Objects[what].amount>=250)
			{
				//this makes buildings give 1% more cookies for every building over 250.
				//this turns out to be rather stupidly overpowered.
				var n=Game.Objects[what].amount-250;
				return 1+Math.pow(1.01,n);
			}
			else return 1;
			*/
			return 1;
		}
		
		// CC3 rewrite: the 19 vanilla building declarations now live in the
		// typed content layer (content/buildings.ts) — same new Game.Object
		// calls, same order, same closures; only the file moved.
		declareVanillaBuildings(Game as any);
		
		// CC3 rewrite: the foolObjects joke-business map + its localization
		// loop now live in the typed content layer (content/foolObjects.ts)
		// same data, same loop, same position after the building block.
		declareVanillaFoolObjects(Game as any);
		
		//build store
		Game.BuildStore();
		
		//build master bar
		var str='';
		str+='<div id="buildingsMute" class="shadowFilter" style="position:relative;z-index:100;padding:4px 16px 0px 64px;"></div>';
		str+='<div class="separatorBottom" style="position:absolute;bottom:-8px;z-index:0;"></div>';
		l('buildingsMaster').innerHTML=str;
		
		//build object displays
		var muteStr='<div style="position:absolute;left:8px;bottom:12px;opacity:0.5;">'+loc("Muted:")+'</div>';
		for (var iKey in Game.Objects)
		{
			var me=Game.Objects[iKey];
			
			if (locStrings[me.name+' (short)']) me.displayName=loc(me.name+' (short)');
			
			if (me.id>0)
			{
				me.canvas=l('rowCanvas'+me.id);
				me.ctx=me.canvas.getContext('2d',{alpha:false});
				me.pics=[];
				var icon=[0*64,me.icon*64];
				// Cats get the animated sleeping-cat sheet instead of a static
				// icon cell (see .catSleepIcon in main.css).
				var isCats=me.name=='Cats';
				var catCls=isCats?' catSleepIcon':'';
				var catPos=isCats?'':'background-position:-'+icon[0]+'px -'+icon[1]+'px;';
				muteStr+='<div class="tinyProductIcon'+catCls+'" id="mutedProduct'+me.id+'" style="display:none;'+catPos+'" '+Game.clickStr+'="Game.ObjectsById['+me.id+'].mute(0);PlaySound(Game.ObjectsById['+me.id+'].muted?\'snd/clickOff2.mp3\':\'snd/clickOn2.mp3\');" '+Game.getDynamicTooltip('Game.mutedBuildingTooltip('+me.id+')','this')+'></div>';
				//muteStr+='<div class="tinyProductIcon" id="mutedProduct'+me.id+'" style="display:none;background-position:-'+icon[0]+'px -'+icon[1]+'px;" '+Game.clickStr+'="Game.ObjectsById['+me.id+'].mute(0);PlaySound(Game.ObjectsById['+me.id+'].muted?\'snd/clickOff2.mp3\':\'snd/clickOn2.mp3\');" '+Game.getTooltip('<div style="width:150px;text-align:center;font-size:11px;"><b>Unmute '+me.plural+'</b><br>(Display this building)</div>')+'></div>';
				
				AddEvent(me.canvas,'mouseover',function(me: any){return function(){me.mouseOn=true;}}(me));
				AddEvent(me.canvas,'mouseout',function(me: any){return function(){me.mouseOn=false;}}(me));
				AddEvent(me.canvas,'mousemove',function(me: any){return function(this: any, e: any){var box=this.getBounds();me.mousePos[0]=e.pageX-box.left;me.mousePos[1]=e.pageY-box.top;}}(me));
			}
		}
		Game.mutedBuildingTooltip=function(id: any)
		{
			return function(){
				var me=Game.ObjectsById[id];
				return '<div style="width:150px;text-align:center;font-size:11px;" id="tooltipMutedBuilding">'+(EN?('<b>'+cap(me.plural)+(me.level>0?' (lvl.&nbsp;'+me.level+')':'')+'</b><div class="line"></div>Click to unmute '+me.plural+'<br>(display this building)'):('<b>'+loc("Level %1 %2",[Beautify(me.level),me.plural])+'</b><div class="line"></div>'+loc("Click to unmute")))+'</div>';
			}
		}
		l('buildingsMute').innerHTML=muteStr;
		
		/*=====================================================================================
		UPGRADES
		=======================================================================================*/
		Game.upgradesToRebuild=1;
		Game.Upgrades={};
		Game.UpgradesById={};
		Game.UpgradesN=0;
		Game.UpgradesInStore=[];
		Game.UpgradesOwned=0;
		Game.Upgrade=Upgrade;//CC3 rewrite (phase 3, slice 3): the 34-line ctor + 13 prototype methods moved to core/upgrade.ts as the real Upgrade class; the engine keeps the same Game.Upgrade slot, same call sites, same self-registration.
		Game.storeBuyAll=function()
		{
			if (!Game.Has('Inspired checklist')) return false;
			for (var i in Game.UpgradesInStore)
			{
				var me=Game.UpgradesInStore[i];
				if (!me.isVaulted() && me.pool!='toggle' && me.pool!='tech') me.buy(1);
			}
		}
		
		Game.vault=[];
		
		Game.CountsAsUpgradeOwned=function(pool: any)
		{
			if (pool=='' || pool=='cookie' || pool=='tech') return true; else return false;
		}
		
		/*AddEvent(l('toggleBox'),'blur',function()//if we click outside of the selector, close it
			{
				//this has a couple problems, such as when clicking on the upgrade - this toggles it off and back on instantly
				l('toggleBox').style.display='none';
				l('toggleBox').innerHTML='';
				Game.choiceSelectorOn=-1;
			}
		);*/
		
		Game.RequiresConfirmation=function(upgrade: any,prompt: any)
		{
			upgrade.clickFunction=function(){Game.Prompt('<id RequiresConfirmation>'+prompt,[[loc("Yes"),'Game.UpgradesById['+upgrade.id+'].buy(1);Game.ClosePrompt();'],loc("No")]);return false;};
		}
		
		Game.Unlock=function(what: any)
		{
			if (typeof what==='string')
			{
				if (Game.Upgrades[what])
				{
					if (Game.Upgrades[what].unlocked==0)
					{
						Game.Upgrades[what].unlocked=1;
						Game.upgradesToRebuild=1;
						Game.recalculateGains=1;
						/*Game.Notify('Upgrade unlocked','<div class="title" style="font-size:18px;margin-top:-2px;">'+Game.Upgrades[what].dname+'</div>',Game.Upgrades[what].icon,6);*/
					}
				}
			}
			else {for (var i in what) {Game.Unlock(what[i]);}}
		}
		Game.Lock=function(what: any)
		{
			if (typeof what==='string')
			{
				if (Game.Upgrades[what])
				{
					Game.Upgrades[what].unlocked=0;
					Game.upgradesToRebuild=1;
					if (Game.Upgrades[what].bought==1 && Game.CountsAsUpgradeOwned(Game.Upgrades[what].pool)) Game.UpgradesOwned--;
					Game.Upgrades[what].bought=0;
					Game.recalculateGains=1;
				}
			}
			else {for (var i in what) {Game.Lock(what[i]);}}
		}
		
		Game.Has=function(what: any)
		{
			var it=Game.Upgrades[what];
			if (it && Game.ascensionMode==1 && (it.pool=='prestige' || it.tier=='fortune')) return 0;
			return (it?it.bought:0);
		}
		Game.HasUnlocked=function(what: any)
		{
			return (Game.Upgrades[what]?Game.Upgrades[what].unlocked:0);
		}
		
		
		Game.RebuildUpgrades=function()//recalculate the upgrades you can buy
		{
			Game.upgradesToRebuild=0;
			var list=[];
			for (var i in Game.Upgrades)
			{
				var me=Game.Upgrades[i];
				if (!me.bought && me.pool!='debug' && me.pool!='prestige' && me.pool!='prestigeDecor' && (Game.ascensionMode!=1 || (!me.lasting && me.tier!='fortune')))
				{
					if (me.unlocked) list.push(me);
				}
				else if (me.displayFuncWhenOwned && me.bought) list.push(me);
			}
			var sortMap=function(a: any,b: any)
			{
				var ap=a.pool=='toggle'?a.order:a.getPrice();
				var bp=b.pool=='toggle'?b.order:b.getPrice();
				if (ap>bp) return 1;
				else if (ap<bp) return -1;
				else return 0;
			}
			list.sort(sortMap);
			
			Game.UpgradesInStore=[];
			for (var i in list)
			{
				Game.UpgradesInStore.push(list[i]);
			}
			var storeStr='';
			var toggleStr='';
			var techStr='';
			var vaultStr='';
			
			if (Game.Has('Inspired checklist'))
			{
				storeStr+='<div id="storeBuyAll" class="storePre" '+Game.getTooltip(
								'<div style="padding:8px;min-width:250px;text-align:center;font-size:11px;" id="tooltipStorePre">'+loc("Will <b>instantly purchase</b> every upgrade you can afford, starting from the cheapest one.<br>Upgrades in the <b>vault</b> will not be auto-purchased.<br>You may place an upgrade into the vault by <b>Shift-clicking</b> on it.")+'</div>'
								,'store')+
					'>'+
						'<div id="storeBuyAllButton" class="storePreButton" '+Game.clickStr+'="Game.storeBuyAll();">'+loc("Buy all upgrades")+'</div>'+
					'</div>';
				l('upgrades').classList.add('hasMenu');
			}
			else l('upgrades').classList.remove('hasMenu');
			
			for (var i in Game.UpgradesInStore)
			{
				//if (!Game.UpgradesInStore[i]) break;
				var me=Game.UpgradesInStore[i];
				var str=Game.crate(me,'store','Game.UpgradesById['+me.id+'].click(event);','upgrade'+i);
				
				/*var str='<div class="crate upgrade" '+Game.getTooltip(
				'<div style="min-width:200px;"><div style="float:right;"><span class="price">'+Beautify(Math.round(me.getPrice()))+'</span></div><small>'+(me.pool=='toggle'?'[Togglable]':'[Upgrade]')+'</small><div class="name">'+me.dname+'</div><div class="line"></div><div class="description">'+me.desc+'</div></div>'
				,'store')+' '+Game.clickStr+'="Game.UpgradesById['+me.id+'].buy();" id="upgrade'+i+'" style="'+writeIcon(me.icon)+'"></div>';*/
				if (me.pool=='toggle') toggleStr+=str; else if (me.pool=='tech') techStr+=str; else
				{
					if (me.isVaulted() && Game.Has('Inspired checklist')) vaultStr+=str; else storeStr+=str;
				}
			}
			
			l('upgrades').innerHTML=storeStr;
			l('toggleUpgrades').innerHTML=toggleStr;
			if (toggleStr=='') l('toggleUpgrades').style.display='none'; else l('toggleUpgrades').style.display='block';
			l('techUpgrades').innerHTML=techStr;
			if (techStr=='') l('techUpgrades').style.display='none'; else l('techUpgrades').style.display='block';
			l('vaultUpgrades').innerHTML=vaultStr;
			if (vaultStr=='') l('vaultUpgrades').style.display='none'; else l('vaultUpgrades').style.display='block';
		}
		
		Game.UnlockAt=[];//this contains an array of every upgrade with a cookie requirement in the form of {cookies:(amount of cookies earned required),name:(name of upgrade or achievement to unlock)} (and possibly require:(name of upgrade of achievement to own))
		//note : the cookie will not be added to the list if it contains locked:1 (use for seasonal cookies and such)
		
		
		//tiered upgrades system
		//each building has several upgrade tiers
		//all upgrades in the same tier have the same color, unlock threshold and price multiplier
		// CC3 rewrite: the tier table now lives in the typed content layer
		// (content/tiers.ts). Game.Init runs exactly once (Loader.doneLoading
		// guard), so the module singleton's lifetime matches the original
		// once-created literal; the .upgrades append below mutates it as before.
		Game.Tiers=TIERS;
		for (var iKey in Game.Tiers){Game.Tiers[iKey].upgrades=[];}
		Game.GetIcon=function(type: any,tier: any)
		{
			var col=0;
			if (type=='Kitten') col=18; else col=Game.Objects[type].iconColumn;
			return [col,Game.Tiers[tier].iconRow];
		}
		Game.SetTier=function(building: any,tier: any)
		{
			if (!Game.Objects[building]) console.log('Warning: No building named',building);
			Game.last.tier=tier;
			Game.last.buildingTie=Game.Objects[building];
			if (Game.last.type=='achievement') Game.Objects[building].tieredAchievs[tier]=Game.last;
			else Game.Objects[building].tieredUpgrades[tier]=Game.last;
		}
		Game.MakeTiered=function(upgrade: any,tier: any,col: any)
		{
			upgrade.tier=tier;
			if (typeof col!=='undefined') upgrade.icon=[col,Game.Tiers[tier].iconRow];
		}
		Game.TieredUpgrade=TieredUpgrade;//CC3 rewrite (phase 3, slice 3): the non-capturing factory moved to core/upgrade.ts; the engine keeps the same Game.TieredUpgrade slot.
		Game.SynergyUpgrade=SynergyUpgrade;//CC3 rewrite (phase 3, slice 3): the non-capturing factory moved to core/upgrade.ts; the engine keeps the same Game.SynergyUpgrade slot.
		Game.GetTieredCpsMult=GetTieredCpsMult;//CC3 rewrite (phase 4, slice 1): moved verbatim to systems/economy.ts; same Game slot, same Init position.
		Game.UnlockTiered=function(me: any)
		{
			for (var i in me.tieredUpgrades) {if (Game.Tiers[me.tieredUpgrades[i].tier].unlock!=-1 && me.amount>=Game.Tiers[me.tieredUpgrades[i].tier].unlock) Game.Unlock(me.tieredUpgrades[i].name);}
			for (var i in me.tieredAchievs) {if (me.amount>=Game.Tiers[me.tieredAchievs[i].tier].achievUnlock) Game.Win(me.tieredAchievs[i].name);}
			for (var i in me.synergies) {var syn=me.synergies[i];if (Game.Has(Game.Tiers[syn.tier].req) && syn.buildingTie1.amount>=Game.Tiers[syn.tier].unlock && syn.buildingTie2.amount>=Game.Tiers[syn.tier].unlock) Game.Unlock(syn.name);}
		}
		
		
		
		
		//define upgrades
		//WARNING : do NOT add new upgrades in between, this breaks the saves. Add them at the end !
		// CC3 rewrite (slice 3): the 786 vanilla upgrade declarations now live
		// in the typed content layer (content/upgrades.ts). They run at this
		// exact point in Init, so declaration order (and every id, save slot
		// and Game.last hand-off) is unchanged.
		declareVanillaUpgrades(Game as any);
		//CC3: web background music (systems/music.ts) — 2.048's browser build had
		//no music engine (Steam-only). Must run after declareVanillaUpgrades,
		//which creates Game.jukebox (the Sound test upgrade). Publish the Music
		//object the jukebox and volume slider already drive, populate the
		//jukebox track list, and start the default track on the first user
		//gesture (browser autoplay policy).
		Music=CreateMusic();
		Music.init(Game);
		Game.jukebox.tracks.length=0;
		for (var mi=0;mi<Music.names.length;mi++) Game.jukebox.tracks.push(Music.names[mi]);
		Game.ToggleMusic=function()
		{
			if (Game.prefs.bgMusic) {if (!Music.currentName) Music.playTrack(Music.names[0]); else Music.unpause();}
			else Music.pause();
		};
		var cc3MusicStarted=false;
		var startMusicOnce=function()
		{
			if (cc3MusicStarted) return;
			cc3MusicStarted=true;
			document.removeEventListener('pointerdown',startMusicOnce);
			document.removeEventListener('keydown',startMusicOnce);
			if (Game.prefs.bgMusic && Music) Music.playTrack(Music.names[0]);
		};
		document.addEventListener('pointerdown',startMusicOnce);
		document.addEventListener('keydown',startMusicOnce);
		Game.ValidateContent=function(){return ValidateContent(Game as any);};
		Game.GetEconomyReport=function(){return GetEconomyReport(Game as any);};
		Game.SimulateEconomy=function(scenarios: Record<string, number>[]){return SimulateEconomy(Game as any,scenarios);};
		Game.AnalyzeEconomy=function(options: any){return AnalyzeEconomy(Game as any,options);};
		Game.SimulateStrategy=function(options: any){return SimulateStrategy(Game as any,options);};
		Game.baseResearchTime=Game.fps*60*30;
		Game.SetResearch=function(what: any,_time: any)
		{
			if (Game.Upgrades[what] && !Game.Has(what))
			{
				Game.researchT=Game.baseResearchTime;
				if (Game.Has('Persistent memory')) Game.researchT=Math.ceil(Game.baseResearchTime/10);
				if (Game.Has('Ultrascience')) Game.researchT=Game.fps*5;
				Game.nextResearch=Game.Upgrades[what].id;
				Game.Notify(loc("Research has begun"),loc("Your bingo center/research facility is conducting experiments."),[9,0]);
			}
		}
		Game.getPledgeDuration=function(){return Game.fps*60*(Game.Has('Sacrificial rolling pins')?60:30);}
		Game.GetHowManyHalloweenDrops=GetHowManyHalloweenDrops;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/seasons.ts; same Game slot, same Init position.
		Game.GetHowManyHeartDrops=GetHowManyHeartDrops;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/seasons.ts; same Game slot, same Init position.
		Game.GetHowManyEggs=GetHowManyEggs;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/seasons.ts; same Game slot, same Init position.
		Game.DropEgg=DropEgg;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/seasons.ts; same Game slot, same Init position.
		Game.PermanentSlotIcon=function(slot: any)
		{
			if (Game.permanentUpgrades[slot]==-1) return [slot,10];
			return Game.UpgradesById[Game.permanentUpgrades[slot]].icon;
		}
		Game.AssignPermanentSlot=function(slot: any)
		{
			PlaySound('snd/tick.mp3');
			Game.tooltip.hide();
			var list=[];
			for (var i in Game.Upgrades)
			{
				var me=Game.Upgrades[i];
				if (me.bought && me.unlocked && !me.noPerm && (me.pool=='' || me.pool=='cookie'))
				{
					var fail=0;
					for (var ii in Game.permanentUpgrades) {if (Game.permanentUpgrades[ii]==me.id) fail=1;}//check if not already in another permaslot
					if (!fail) list.push(me);
				}
			}
			
			var sortMap=function(a: any,b: any)
			{
				if (a.order>b.order) return 1;
				else if (a.order<b.order) return -1;
				else return 0;
			}
			list.sort(sortMap);
			
			var upgrades='';
			for (var i in list)
			{
				var me=list[i];
				upgrades+=Game.crate(me,'','PlaySound(\'snd/tick.mp3\');Game.PutUpgradeInPermanentSlot('+me.id+','+slot+');','upgradeForPermanent'+me.id);
			}
			var upgrade=Game.permanentUpgrades[slot];
			Game.SelectingPermanentUpgrade=upgrade;
			Game.Prompt('<id PickPermaUpgrade><h3>'+loc("Pick an upgrade to make permanent")+'</h3>'+
			
						'<div class="line"></div><div style="margin:4px auto;clear:both;width:120px;"><div class="crate upgrade enabled" style="background-position:'+(-slot*48)+'px '+(-10*48)+'px;"></div><div id="upgradeToSlotNone" class="crate upgrade enabled" style="background-position:'+(-0*48)+'px '+(-7*48)+'px;display:'+(upgrade!=-1?'none':'block')+';"></div><div id="upgradeToSlotWrap" style="float:left;display:'+(upgrade==-1?'none':'block')+';">'+(Game.crate(Game.UpgradesById[upgrade==-1?0:upgrade],'','','upgradeToSlot'))+'</div></div>'+
						'<div class="block crateBox" style="overflow-y:scroll;float:left;clear:left;width:317px;padding:0px;height:250px;">'+upgrades+'</div>'+
						'<div class="block" style="float:right;width:152px;clear:right;height:234px;">'+loc("Here are all the upgrades you've purchased last playthrough.<div class=\"line\"></div>Pick one to permanently gain its effects!<div class=\"line\"></div>You can reassign this slot anytime you ascend.")+'</div>'
						,[[loc("Confirm"),'Game.permanentUpgrades['+slot+']=Game.SelectingPermanentUpgrade;Game.BuildAscendTree();Game.ClosePrompt();'],loc("Cancel")],0,'widePrompt');
		}
		Game.SelectingPermanentUpgrade=-1;
		Game.PutUpgradeInPermanentSlot=function(upgrade: any,_slot: any)
		{
			Game.SelectingPermanentUpgrade=upgrade;
			l('upgradeToSlotWrap').innerHTML='';
			l('upgradeToSlotWrap').style.display=(upgrade==-1?'none':'block');
			l('upgradeToSlotNone').style.display=(upgrade!=-1?'none':'block');
			l('upgradeToSlotWrap').innerHTML=(Game.crate(Game.UpgradesById[upgrade==-1?0:upgrade],'','','upgradeToSlot'));
		}
		Game.playGoldenCookieChime=function()
		{
			if (Game.chimeType==1) PlaySound('snd/chime.mp3');
			else if (Game.chimeType==2) PlaySound('snd/fortune.mp3');
			else if (Game.chimeType==3) PlaySound('snd/cymbalRev.mp3');
			else if (Game.chimeType==4) {Game.wrinklerSquishSound++;if (Game.wrinklerSquishSound>4) {Game.wrinklerSquishSound-=4;}PlaySound('snd/squeak'+(Game.wrinklerSquishSound)+'.mp3');}
		}
		Game.loseShimmeringVeil=function(context: any)
		{
			if (!Game.Has('Shimmering veil')) return false;
			if (!Game.Has('Shimmering veil [off]') && Game.Has('Shimmering veil [on]')) return false;
			if (Game.Has('Reinforced membrane'))
			{
				if (context=='shimmer') Math.seedrandom(Game.seed+'/'+(Game.goldenClicks+Game.reindeerClicked));
				else if (context=='click') Math.seedrandom(Game.seed+'/'+Game.cookieClicks);
				if (Math.random()<Game.getVeilDefense())
				{
					Game.Notify(loc("The reinforced membrane protects the shimmering veil."),'',[7,10]);
					Game.Win('Thick-skinned');
					return false;
				}
				Math.seedrandom();
			}
			var me=Game.Upgrades['Shimmering veil [on]'];
			me.bought=1;
			//Game.Upgrades[me.toggleInto].bought=false;
			Game.Lock(me.toggleInto);
			Game.Unlock(me.toggleInto);
			Game.Notify(loc("The shimmering veil disappears..."),'',[9,10]);
			Game.upgradesToRebuild=1;
			Game.recalculateGains=1;
			PlaySound('snd/spellFail.mp3',0.75);
		}
		Game.getVeilDefense=function()
		{
			var n=0;
			if (Game.Has('Reinforced membrane')) n+=0.1;
			if (Game.Has('Delicate touch')) n+=0.1;
			if (Game.Has('Steadfast murmur')) n+=0.1;
			if (Game.Has('Glittering edge')) n+=0.1;
			return n;
		}
		Game.getVeilBoost=function()
		{
			var n=0.5;
			if (Game.Has('Reinforced membrane')) n+=0.1;
			if (Game.Has('Delicate touch')) n+=0.05;
			if (Game.Has('Steadfast murmur')) n+=0.05;
			if (Game.Has('Glittering edge')) n+=0.05;
			return n;
		}
		Game.listTinyOwnedUpgrades=function(arr: any)
		{
			var str='';
			for (var i=0;i<arr.length;i++)
			{
				if (Game.Has(arr[i]))
				{
					var it=Game.Upgrades[arr[i]];
					str+=tinyIcon(it.icon);
				}
			}
			return str;
		}
		Game.GetHowManySantaDrops=GetHowManySantaDrops;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/seasons.ts; same Game slot, same Init position.
		Game.GetHowManyReindeerDrops=GetHowManyReindeerDrops;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/seasons.ts; same Game slot, same Init position.
		Game.saySeasonSwitchUses=saySeasonSwitchUses;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/seasons.ts; same Game slot, same Init position.
		Game.computeSeasonPrices=computeSeasonPrices;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/seasons.ts; same Game slot, same Init position.
		Game.computeSeasons=computeSeasons;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/seasons.ts; same Game slot, same Init position.
		Game.getSeasonDuration=getSeasonDuration;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/seasons.ts; same Game slot, same Init position.
		Game.computeSeasons();
		
		//alert untiered building upgrades
		for (var iKey in Game.Upgrades)
		{
			var me=Game.Upgrades[iKey];
			if (me.order>=200 && me.order<2000 && !me.tier && me.name.indexOf('grandma')==-1 && me.pool!='prestige') console.log(me.name+' has no tier.');
		}
		
		Game.UpgradesByPool={'kitten':[]};
		for (var iKey in Game.Upgrades)
		{
			if (!Game.UpgradesByPool[Game.Upgrades[iKey].pool]) Game.UpgradesByPool[Game.Upgrades[iKey].pool]=[];
			Game.UpgradesByPool[Game.Upgrades[iKey].pool].push(Game.Upgrades[iKey]);
			if (Game.Upgrades[iKey].kitten) Game.UpgradesByPool['kitten'].push(Game.Upgrades[iKey]);
		}
		
		Game.PrestigeUpgrades=[];
		for (var iKey in Game.Upgrades)
		{
			if (Game.Upgrades[iKey].pool=='prestige' || Game.Upgrades[iKey].pool=='prestigeDecor')
			{
				Game.PrestigeUpgrades.push(Game.Upgrades[iKey]);
				if (Game.Upgrades[iKey].posX || Game.Upgrades[iKey].posY) Game.Upgrades[iKey].placedByCode=true;
				else {Game.Upgrades[iKey].posX=0;Game.Upgrades[iKey].posY=0;}
				if (Game.Upgrades[iKey].parents.length==0 && Game.Upgrades[iKey].name!='Legacy') Game.Upgrades[iKey].parents=['Legacy'];
				for (var ii in Game.Upgrades[iKey].parents) {Game.Upgrades[iKey].parents[ii]=Game.Upgrades[Game.Upgrades[iKey].parents[ii]];}
			}
		}
		
		Game.goldenCookieUpgrades=['Get lucky','Lucky day','Serendipity','Heavenly luck','Lasting fortune','Decisive fate','Lucky digit','Lucky number','Lucky payout','Golden goose egg'];
		
		Game.cookieUpgrades=[];
		for (var iKey in Game.Upgrades)
		{
			var me=Game.Upgrades[iKey];
			if ((me.pool=='cookie' || me.pseudoCookie)) Game.cookieUpgrades.push(me);
			if (me.tier) Game.Tiers[me.tier].upgrades.push(me);
		}
		for (var iKey in Game.UnlockAt){Game.Upgrades[Game.UnlockAt[iKey].name].unlockAt=Game.UnlockAt[iKey];}
		for (var iKey in Game.Upgrades){if (Game.Upgrades[iKey].pool=='prestige') Game.Upgrades[iKey].order=Game.Upgrades[iKey].id;}
		
		/*var oldPrestigePrices={"Chimera":5764801,"Synergies Vol. I":2525,"Synergies Vol. II":252525,"Label printer":9999};
		for (var i in oldPrestigePrices){Game.Upgrades[i].basePrice=oldPrestigePrices[i];}*/
		
		//CC3: heavenly-upgrade positions are now derived deterministically from
		//the prestige DAG (parents[]), not a hand-authored coordinate table.
		computeHeavenlyLayout(Game as any);
		
		//CC3: player-arranged heavenly layout — snapshot the canonical positions
		//(vanilla table + declared CC3 spots), then apply any saved overrides so
		//the player's drag arrangement survives reloads and ascensions.
		Game._heavenlyLayoutDefaults={};
		for (var iKey in Game.PrestigeUpgrades) {Game._heavenlyLayoutDefaults[Game.PrestigeUpgrades[iKey].id]=[Game.PrestigeUpgrades[iKey].posX,Game.PrestigeUpgrades[iKey].posY];}
		try {Game.ArrangeLayout=JSON.parse(window.localStorage.getItem('cc3_heavenly_layout')||'{}')||{};} catch(e){Game.ArrangeLayout={};}
		for (var iKey in Game.ArrangeLayout)
		{
			var u=Game.UpgradesById[iKey];
			if (u && Game.ArrangeLayout[iKey]) {u.posX=Game.ArrangeLayout[iKey][0];u.posY=Game.ArrangeLayout[iKey][1];}
		}
		
		
		/*=====================================================================================
		ACHIEVEMENTS
		=======================================================================================*/		
		Game.Achievements={};
		Game.AchievementsById={};
		Game.AchievementsN=0;
		Game.AchievementsOwned=0;
		// CC3 rewrite (slice 4): the achievement ctors/factories and the 501
		// vanilla achievement declarations now live in the typed content layer
		// (content/achievements.ts). They run at this exact point in Init, so
		// declaration order (and every id, save slot and Game.last hand-off)
		// is unchanged; the order bookkeeping inherits the slice-3
		// order/pool/power bridge.
		declareVanillaAchievements(Game as any);
		
		
		
		
		for (var iKey in Game.Objects)
		{
			if (Game.Objects[iKey].levelAchiev10) {Game.Objects[iKey].levelAchiev10.baseDesc=loc("Reach level <b>%1</b> %2.",[10,Game.Objects[iKey].plural]);Game.Objects[iKey].levelAchiev10.desc=Game.Objects[iKey].levelAchiev10.baseDesc;}
		}
		
		
		
		LocalizeUpgradesAndAchievs();
		
		
		/*=====================================================================================
		BUFFS
		=======================================================================================*/
		
		Game.buffs={};//buffs currently in effect by name
		Game.buffsI=0;
		Game.buffsL=l('buffs');
		Game.gainBuff=gainBuff;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/buffs.ts; same Game slot, same Init position.
		Game.hasBuff=hasBuff;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/buffs.ts; same Game slot, same Init position.
		Game.updateBuffs=updateBuffs;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/buffs.ts; same Game slot, same Init position.
		Game.killBuff=killBuff;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/buffs.ts; same Game slot, same Init position.
		Game.killBuffs=killBuffs;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/buffs.ts; same Game slot, same Init position.
		
		
		Game.buffTypes=buffTypes;//CC3 rewrite (phase 6, slice 3): the archetype registry moved to systems/buffs.ts (module-owned); republished on Game so save/load and mods see the same arrays.
		Game.buffTypesByName=buffTypesByName;
		Game.buffTypesN=0;
		Game.buffType=buffType;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/buffs.ts; same Game slot, same Init position.
		
		/*
		basic buff parameters :
			name:'Kitten rain',
			desc:'It\'s raining kittens!',
			icon:[0,0],
			time:30*Game.fps
		other parameters :
			visible:false - will hide the buff from the buff list
			add:true - if this buff already exists, add the new duration to the old one
			max:true - if this buff already exists, set the new duration to the max of either
			onDie:function(){} - function will execute when the buff runs out
			power:3 - used by some buffs
			multCpS:3 - buff multiplies CpS by this amount
			multClick:3 - buff multiplies click power by this amount
		*/
		
		//base buffs
		declareVanillaBuffs();//CC3 rewrite (phase 6, slice 3): the 26 vanilla buff declarations moved verbatim to systems/buffs.ts; run at the same Init position so Game.vanilla is already 1 when the archetype ctor stamps each type.
		
		//end of buffs
		
		
		
		
		/*=====================================================================================
		GRANDMAPOCALYPSE
		=======================================================================================*/
		Game.UpdateGrandmapocalypse=function()
		{
			if (Game.Has('Elder Covenant') || Game.Objects['Grandma'].amount==0) Game.elderWrath=0;
			else if (Game.pledgeT>0)//if the pledge is active, lower it
			{
				Game.pledgeT--;
				if (Game.pledgeT==0)//did we reach 0? make the pledge purchasable again
				{
					Game.Lock('Elder Pledge');
					Game.Unlock('Elder Pledge');
					Game.elderWrath=1;
				}
			}
			else
			{
				// CC3: Grandma's Sitting Room (engine/minigameGrandmaSittingRoom.ts)
				// feeds its comfort dial into this canonical drift — the minigame
				// itself never touches Game.elderWrath. A sufficiently cozy room
				// (comfort >= 2) calms the elders, one stage per tick, and holds
				// them at 0 (floor and climb suppressed) while the room stays cozy;
				// a sufficiently eldritch room (comfort <= -2) adds to the per-tick
				// drift that climbs the wrath. 'Elder hospitality' (heavenly)
				// doubles the comfort-driven rates.
				var sittingRoomMg=(Game.isMinigameReady(Game.Objects['Grandma'])&&Game.Objects['Grandma'].minigame)?Game.Objects['Grandma'].minigame:0;
				var sittingComfort=sittingRoomMg&&sittingRoomMg.currentComfort?sittingRoomMg.currentComfort():0;
				var sittingDriftMult=Game.Has('Elder hospitality')?2:1;
				if (sittingComfort>=2 && Game.elderWrath>0 && Math.random()<0.0015*(sittingComfort-1)*sittingDriftMult)
				{
					Game.elderWrath--;//a cozy sitting room calms the elders
				}
				if (sittingComfort<2)
				{
					if (Game.Has('One mind') && Game.elderWrath==0)
					{
						Game.elderWrath=1;
					}
					if (Math.random()<0.001+((sittingComfort<=-2)?0.0015*(-sittingComfort-1)*sittingDriftMult:0) && Game.elderWrath<Game.Has('One mind')+Game.Has('Communal brainsweep')+Game.Has('Elder Pact'))
					{
						Game.elderWrath++;//have we already pledged? make the elder wrath shift between different stages
					}
				}
				if (Game.Has('Elder Pact') && Game.Upgrades['Elder Pledge'].unlocked==0)
				{
					Game.Lock('Elder Pledge');
					Game.Unlock('Elder Pledge');
				}
			}
			Game.elderWrathD+=((Game.elderWrath+1)-Game.elderWrathD)*0.001;//slowly fade to the target wrath state
			
			if (Game.elderWrath!=Game.elderWrathOld)
			{
				if (Game.clicksThisSession>0)
				{
					if (Game.elderWrath>=3) PlayCue('fadeTo','grandmapocalypse');
					else PlayCue('fadeTo','click');
				}
				Game.storeToRefresh=1;
			}
			
			Game.elderWrathOld=Game.elderWrath;
			
			Game.UpdateWrinklers();
		}
		
		//wrinklers
		/* CC3 rewrite (phase 4, slice 5): the inRect helper moved verbatim to
		 * systems/wrinkler.ts — its only caller (UpdateWrinklers) moved there. */
		
		Game.wrinklerHP=2.1;
		Game.wrinklers=[];
		for (var i=0;i<12;i++)
		{
			Game.wrinklers.push({id:parseInt(i),close:0,sucked:0,phase:0,x:0,y:0,r:0,hurt:0,hp:Game.wrinklerHP,selected:0,type:0});
		}
		Game.getWrinklersMax=getWrinklersMax;//CC3 rewrite (phase 4, slice 5): moved verbatim to systems/wrinkler.ts; same Game slot, same Init position.
		Game.ResetWrinklers=ResetWrinklers;//CC3 rewrite (phase 4, slice 5).
		Game.CollectWrinklers=CollectWrinklers;//CC3 rewrite (phase 4, slice 5).
		Game.wrinklerSquishSound=Math.floor(Math.random()*4)+1;

		Game.playWrinklerSquishSound=playWrinklerSquishSound;//CC3 rewrite (phase 4, slice 5).
		Game.SpawnWrinkler=SpawnWrinkler;//CC3 rewrite (phase 4, slice 5).
		Game.PopRandomWrinkler=PopRandomWrinkler;//CC3 rewrite (phase 4, slice 5).
		Game.UpdateWrinklers=UpdateWrinklers;//CC3 rewrite (phase 4, slice 5): the 196-line per-frame update moved verbatim.
		Game.DrawWrinklers=DrawWrinklers;//CC3 rewrite (phase 4, slice 5).
		Game.SaveWrinklers=SaveWrinklers;//CC3 rewrite (phase 4, slice 5).
		Game.LoadWrinklers=LoadWrinklers;//CC3 rewrite (phase 4, slice 5).
		
		/*=====================================================================================
		SPECIAL THINGS AND STUFF
		=======================================================================================*/
		
		
		Game.specialTab='';
		Game.specialTabHovered='';
		Game.specialTabs=[];
		
		Game.UpdateSpecial=function()
		{
			Game.specialTabs=[];
			if (Game.Has('A festive hat')) Game.specialTabs.push('santa');
			if (Game.Has('A crumbly egg')) Game.specialTabs.push('dragon');
			if (Game.specialTabs.length==0) {Game.ToggleSpecialMenu(0);return;}
		
			if (Game.LeftBackground)
			{
				Game.specialTabHovered='';
				var len=Game.specialTabs.length;
				if (len==0) return;
				var y=Game.LeftBackground.canvas.height-24-48*len;
				for (var i=0;i<Game.specialTabs.length;i++)
				{
					var selected=0;
					if (Game.specialTab==Game.specialTabs[i]) selected=1;
					var x=24;
					var s=1;
					if (selected) {s=2;x+=24;}
					
					if (Math.abs(Game.mouseX-x)<=24*s && Math.abs(Game.mouseY-y)<=24*s)
					{
						Game.specialTabHovered=Game.specialTabs[i];
						Game.mousePointer=1;
						Game.CanClick=0;
						if (Game.Click && Game.lastClickedEl==l('backgroundLeftCanvas'))
						{
							if (Game.specialTab!=Game.specialTabs[i]) {Game.specialTab=Game.specialTabs[i];Game.ToggleSpecialMenu(1);PlaySound('snd/press.mp3');}
							else {Game.ToggleSpecialMenu(0);PlaySound('snd/press.mp3');}
							//PlaySound('snd/tick.mp3');
						}
					}
					
					y+=48;
				}
			}
		}
		
		Game.santaLevels=santaLevels;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/santa.ts; same Game slot, same Init position.
		if (!EN){for (var iKey in Game.santaLevels){Game.santaLevels[iKey]=loc(Game.santaLevels[iKey]);}}
		for (var iKey in Game.santaDrops)//scale christmas upgrade prices with santa level
		{Game.Upgrades[Game.santaDrops[iKey]].priceFunc=function(){return Math.pow(3,Game.santaLevel)*2525;}}
		
		Game.UpgradeSanta=UpgradeSanta;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/santa.ts; same Game slot, same Init position.
		
		Game.dragonLevels=[
			{name:'Dragon egg',action:loc("Chip it"),pic:0,
				cost:function(){return Game.cookies>=1000000;},
				buy:function(){Game.Spend(1000000);},
				costStr:function(){return loc("%1 cookie",LBeautify(1000000));}},
			{name:'Dragon egg',action:loc("Chip it"),pic:1,
				cost:function(){return Game.cookies>=1000000*2;},
				buy:function(){Game.Spend(1000000*2);},
				costStr:function(){return loc("%1 cookie",LBeautify(1000000*2));}},
			{name:'Dragon egg',action:loc("Chip it"),pic:2,
				cost:function(){return Game.cookies>=1000000*4;},
				buy:function(){Game.Spend(1000000*4);},
				costStr:function(){return loc("%1 cookie",LBeautify(1000000*4));}},
			{name:'Shivering dragon egg',action:loc("Hatch it"),pic:3,
				cost:function(){return Game.cookies>=1000000*8;},
				buy:function(){Game.Spend(1000000*8);},
				costStr:function(){return loc("%1 cookie",LBeautify(1000000*8));}},
			{name:'Krumblor, cookie hatchling',action:'Train Breath of Milk<br><small>Aura : kittens are 5% more effective</small>',pic:4,
				cost:function(){return Game.cookies>=1000000*16;},
				buy:function(){Game.Spend(1000000*16);},
				costStr:function(){return loc("%1 cookie",LBeautify(1000000*16));}},
			{name:'Krumblor, cookie hatchling',action:'Train Dragon Cursor<br><small>Aura : clicking is 5% more effective</small>',pic:4,},
			{name:'Krumblor, cookie hatchling',action:'Train Elder Battalion<br><small>Aura : grandmas gain +1% CpS for every non-grandma building</small>',pic:4,},
			{name:'Krumblor, cookie hatchling',action:'Train Reaper of Fields<br><small>Aura : golden cookies may trigger a Dragon Harvest</small>',pic:4,},
			{name:'Krumblor, cookie dragon',action:'Train Earth Shatterer<br><small>Aura : buildings sell back for 50% instead of 25%</small>',pic:5,},
			{name:'Krumblor, cookie dragon',action:'Train Master of the Armory<br><small>Aura : all upgrades are 2% cheaper</small>',pic:5,},
			{name:'Krumblor, cookie dragon',action:'Train Fierce Hoarder<br><small>Aura : all buildings are 2% cheaper</small>',pic:5,},
			{name:'Krumblor, cookie dragon',action:'Train Dragon God<br><small>Aura : prestige CpS bonus +5%</small>',pic:5,},
			{name:'Krumblor, cookie dragon',action:'Train Arcane Aura<br><small>Aura : golden cookies appear 5% more often</small>',pic:5,},
			{name:'Krumblor, cookie dragon',action:'Train Dragonflight<br><small>Aura : golden cookies may trigger a Dragonflight</small>',pic:5,},
			{name:'Krumblor, cookie dragon',action:'Train Ancestral Metamorphosis<br><small>Aura : golden cookies give 10% more cookies</small>',pic:5,},
			{name:'Krumblor, cookie dragon',action:'Train Unholy Dominion<br><small>Aura : wrath cookies give 10% more cookies</small>',pic:5,},
			{name:'Krumblor, cookie dragon',action:'Train Epoch Manipulator<br><small>Aura : golden cookie effects last 5% longer</small>',pic:5,},
			{name:'Krumblor, cookie dragon',action:'Train Mind Over Matter<br><small>Aura : +25% random drops</small>',pic:5,},
			{name:'Krumblor, cookie dragon',action:'Train Radiant Appetite<br><small>Aura : all cookie production multiplied by 2</small>',pic:5,},
			{name:'Krumblor, cookie dragon',action:'Train Dragon\'s Fortune<br><small>Aura : +123% CpS per golden cookie on-screen</small>',pic:5,},
			{name:'Krumblor, cookie dragon',action:'Train Dragon\'s Curve<br><small>Aura : sugar lumps grow 5% faster, 50% weirder</small>',pic:5,},
			{name:'Krumblor, cookie dragon',action:'Train Reality Bending<br><small>Aura : 10% of every other aura, combined</small>',pic:5,},
			{name:'Krumblor, cookie dragon',action:'Train Dragon Orbs<br><small>Aura : selling your best building may grant a wish</small>',pic:5,},
			{name:'Krumblor, cookie dragon',action:'Train Supreme Intellect<br><small>Aura : confers various powers to your minigames</small>',pic:5,},
			{name:'Krumblor, cookie dragon',action:loc("Bake dragon cookie")+'<br><small>'+loc("Delicious!")+'</small>',pic:6,
				cost:function(){var fail=0;for (var i in Game.Objects){if (Game.Objects[i].amount<50) fail=1;}return (fail==0);},
				buy:function(){for (var i in Game.Objects){Game.Objects[i].sacrifice(50);}Game.Unlock('Dragon cookie');},
				costStr:function(){return loc("%1 of every building",50);}},
			{name:'Krumblor, cookie dragon',action:loc("Train secondary aura")+'<br><small>'+loc("Lets you use two dragon auras simultaneously")+'</small>',pic:7,
				cost:function(){var fail=0;for (var i in Game.Objects){if (Game.Objects[i].amount<200) fail=1;}return (fail==0);},
				buy:function(){for (var i in Game.Objects){Game.Objects[i].sacrifice(200);}},
				costStr:function(){return loc("%1 of every building",200);}},
			{name:'Krumblor, cookie dragon',action:loc("Your dragon is fully trained."),pic:8}
		];
		
		Game.dragonAuras={
			0:{name:'No aura',pic:[0,7],desc:loc("Select an aura from those your dragon knows.")},
			1:{name:'Breath of Milk',pic:[18,25],desc:loc("Kittens are <b>%1%</b> more effective.",5)},
			2:{name:'Dragon Cursor',pic:[0,25],desc:loc("Clicking is <b>%1%</b> more powerful.",5)},
			3:{name:'Elder Battalion',pic:[1,25],desc:loc("Grandmas gain <b>+%1% CpS</b> for each non-grandma building.",1)},
			4:{name:'Reaper of Fields',pic:[2,25],desc:loc("Golden cookies may trigger a <b>Dragon Harvest</b>.")},
			5:{name:'Earth Shatterer',pic:[3,25],desc:loc("Buildings sell back for <b>%1%</b> instead of %2%.",[50,25])},
			6:{name:'Master of the Armory',pic:[4,25],desc:loc("All upgrades are <b>%1% cheaper</b>.",2)},
			7:{name:'Fierce Hoarder',pic:[15,25],desc:loc("All buildings are <b>%1% cheaper</b>.",2)},
			8:{name:'Dragon God',pic:[16,25],desc:loc("<b>+%1%</b> prestige level effect on CpS.",5)},
			9:{name:'Arcane Aura',pic:[17,25],desc:loc("Golden cookies appear <b>%1%</b> more often.",5)},
			10:{name:'Dragonflight',pic:[5,25],desc:loc("Golden cookies may trigger a <b>Dragonflight</b>.")},
			11:{name:'Ancestral Metamorphosis',pic:[6,25],desc:loc("Golden cookies give <b>%1%</b> more cookies.",10)},
			12:{name:'Unholy Dominion',pic:[7,25],desc:loc("Wrath cookies give <b>%1%</b> more cookies.",10)},
			13:{name:'Epoch Manipulator',pic:[8,25],desc:loc("Golden cookies stay <b>%1%</b> longer.",5)},
			14:{name:'Mind Over Matter',pic:[13,25],desc:loc("Random drops are <b>%1% more common</b>.",25)},
			15:{name:'Radiant Appetite',pic:[14,25],desc:loc("All cookie production <b>multiplied by %1</b>.",2)},
			16:{name:'Dragon\'s Fortune',pic:[19,25],desc:loc("<b>+%1% CpS</b> per golden cookie on-screen, multiplicative.",123)},
			17:{name:'Dragon\'s Curve',pic:[20,25],desc:loc("<b>+%1%</b> sugar lump growth.",5)+" "+loc("Sugar lumps are <b>twice as likely</b> to be unusual.")},
			18:{name:'Reality Bending',pic:[32,25],desc:loc("<b>One tenth</b> of every other dragon aura, <b>combined</b>.")},
			19:{name:'Dragon Orbs',pic:[33,25],desc:loc("With no buffs and no golden cookies on screen, selling your most powerful building has <b>%1% chance to summon one</b>.",10)},
			20:{name:'Supreme Intellect',pic:[34,25],desc:loc("Confers various powers to your minigames while active.<br>See the bottom of each minigame for more details.")},
		};
		
		Game.dragonAurasBN={};for (var iKey in Game.dragonAuras){Game.dragonAurasBN[Game.dragonAuras[iKey].name]=Game.dragonAuras[iKey];}
		for (var iKey in Game.dragonAuras){Game.dragonAuras[iKey].id=parseInt(iKey);Game.dragonAuras[iKey].dname=loc(Game.dragonAuras[iKey].name);}
		
		for (var i=0;i<Game.dragonLevels.length;i++)
		{
			var it=Game.dragonLevels[i];
			it.name=loc(it.name);
			if (i>=4 && i<Game.dragonLevels.length-3)
			{
				if (!EN) it.action=loc("Train %1",Game.dragonAuras[i-3].dname)+'<br><small>'+loc("Aura: %1",Game.dragonAuras[i-3].desc)+'</small>';
				if (i>=5)
				{
					it.costStr=function(building: any){return function(){return loc("%1 "+building.bsingle,LBeautify(100));}}(Game.ObjectsById[i-5]);
					it.cost=function(building: any){return function(){return building.amount>=100;}}(Game.ObjectsById[i-5]);
					it.buy=function(building: any){return function(){building.sacrifice(100);}}(Game.ObjectsById[i-5]);
				}
			}
		}
		
		Game.hasAura=hasAura;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/dragon.ts; same Game slot, same Init position.
		Game.auraMult=auraMult;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/dragon.ts; same Game slot, same Init position.
		
		Game.SelectDragonAura=SelectDragonAura;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/dragon.ts; same Game slot, same Init position.
		Game.SelectingDragonAura=-1;
		Game.SetDragonAura=function(aura: any,slot: any)
		{
			Game.SelectingDragonAura=aura;
			Game.SelectDragonAura(slot,1);
		}
		Game.DescribeDragonAura=function(aura: any)
		{
			l('dragonAuraInfo').innerHTML=
			'<div style="min-width:200px;text-align:center;"><h4>'+Game.dragonAuras[aura].dname+'</h4>'+
			'<div class="line"></div>'+
			Game.dragonAuras[aura].desc+
			'</div>';
		}
		
		Game.UpgradeDragon=UpgradeDragon;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/dragon.ts; same Game slot, same Init position.
		
		Game.lastClickedSpecialPic=0;
		Game.ClickSpecialPic=ClickSpecialPic;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/santa.ts; same Game slot, same Init position.
		
		Game.ToggleSpecialMenu=ToggleSpecialMenu;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/specialMenu.ts; same Game slot, same Init position.
		Game.DrawSpecial=DrawSpecial;//CC3 rewrite (phase 6, slice 3): moved verbatim to systems/specialMenu.ts; same Game slot, same Init position.
		
		/*=====================================================================================
		VISUAL EFFECTS
		=======================================================================================*/
		
		/*=====================================================================================
		VISUAL EFFECTS
		=======================================================================================*/
		
		declareVanillaMilks(Game as any);//CC3 rewrite (phase 6, slice 5): the AllMilks data + localization loop moved verbatim to content/milks.ts; same Init position.
		
		Game.mousePointer=0;//when 1, draw the mouse as a pointer on the left screen
		
		Game.cookieOriginX=0;
		Game.cookieOriginY=0;
		Game.DrawBackground=DrawBackground;//CC3 rewrite (phase 6, slice 4): moved verbatim to ui/drawBackground.ts; same Game slot, same Init position.
		
		
		/*=====================================================================================
		INITIALIZATION END; GAME READY TO LAUNCH
		=======================================================================================*/
		
		Game.killShimmers();
		
		//booooo
		Game.RuinTheFun=function(silent: any)
		{
			Game.popups=0;
			Game.SetAllUpgrades(1);
			Game.SetAllAchievs(1);
			Game.popups=0;
			Game.Earn(999999999999999999999999999999);
			Game.MaxSpecials();
			Game.nextResearch=0;
			Game.researchT=-1;
			Game.upgradesToRebuild=1;
			Game.recalculateGains=1;
			Game.popups=1;
			for (var i in Game.Objects)
			{
				var me=Game.Objects[i];
				if (me.level<10)
				{
					me.level=9;
					me.levelUp(true);
				}
				if (me.minigame && me.minigame.onRuinTheFun) me.minigame.onRuinTheFun();
			}
			if (!silent)
			{
				Game.Notify('Thou doth ruineth the fun!','You\'re free. Free at last.',[11,5]);
			}
			return 'You feel a bitter taste in your mouth...';
		}
		
		Game.SetAllUpgrades=function(on: any)
		{
			Game.popups=0;
			var leftout=['Magic shenanigans','Occult obstruction','Glucose-charged air'];
			for (var i in Game.Upgrades)
			{
				if (on && (Game.Upgrades[i].pool=='toggle' || leftout.indexOf(Game.Upgrades[i].name)!=-1)) {}
				else if (on) Game.Upgrades[i].earn();
				else if (!on) Game.Upgrades[i].lose();
			}
			Game.upgradesToRebuild=1;
			Game.recalculateGains=1;
			Game.popups=1;
		}
		Game.SetAllAchievs=function(on: any)
		{
			Game.popups=0;
			for (var i in Game.Achievements)
			{
				if (on && Game.Achievements[i].pool!='dungeon') Game.Win(Game.Achievements[i].name);
				else if (!on) Game.RemoveAchiev(Game.Achievements[i].name);
			}
			Game.recalculateGains=1;
			Game.popups=1;
		}
		Game.GetAllDebugs=function()
		{
			Game.popups=0;
			for (var i in Game.Upgrades)
			{
				if (Game.Upgrades[i].pool=='debug') Game.Upgrades[i].earn();
			}
			Game.upgradesToRebuild=1;
			Game.recalculateGains=1;
			Game.popups=1;
		}
		Game.MaxSpecials=function()
		{
			Game.dragonLevel=Game.dragonLevels.length-1;
			Game.santaLevel=Game.santaLevels.length-1;
		}
		
		Game.SesameReset=function()
		{
			var name=Game.bakeryName;
			Game.HardReset(2);
			Game.bakeryName=name;
			Game.bakeryNameRefresh();
			Game.Achievements['Cheated cookies taste awful'].won=1;
		}
		
		Game.debugTimersOn=0;
		Game.sesame=0;
		Game.OpenSesame=function()
		{
			var str='';
			str+='<div class="icon" style="position:absolute;left:-9px;top:-6px;background-position:'+(-10*48)+'px '+(-6*48)+'px;"></div>';
			str+='<div style="position:absolute;left:0px;top:0px;z-index:10;font-size:10px;background:#000;padding:1px;" id="fpsCounter"></div>';
			
			str+='<div id="devConsoleContent">';
			str+='<div class="title" style="font-size:14px;margin:6px;">Dev tools</div>';
			
			str+='<a class="option neato" '+Game.clickStr+'="Game.Ascend(1);">Ascend</a>';
			str+='<div class="line"></div>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.cookies*=10;Game.cookiesEarned*=10;">x10</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.cookies/=10;Game.cookiesEarned/=10;">/10</a><br>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.cookies*=1000;Game.cookiesEarned*=1000;">x1k</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.cookies/=1000;Game.cookiesEarned/=1000;">/1k</a><br>';
			str+='<a class="option neato" '+Game.clickStr+'="for (var i in Game.Objects){Game.Objects[i].buy(100);}">Buy 100 of all</a>';//for (var n=0;n<100;n++){for (var i in Game.Objects){Game.Objects[i].buy(1);}}
			str+='<a class="option neato" '+Game.clickStr+'="for (var i in Game.Objects){Game.Objects[i].sell(100);}">Sell 100 of all</a><br>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.gainLumps(10);">+10 lumps</a>';
			str+='<a class="option neato" '+Game.clickStr+'="for (var i in Game.Objects){Game.Objects[i].level=0;Game.Objects[i].onMinigame=false;Game.Objects[i].refresh();}Game.recalculateGains=1;">Reset levels</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.cookiesReset+=Game.HowManyCookiesReset((Game.heavenlyChips||1)*1000);Game.EarnHeavenlyChips(0,true);Game.recalculateGains=1;">HC x1k</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.cookiesReset=(Game.heavenlyChips<100?0:Game.HowManyCookiesReset(Math.floor(Game.heavenlyChips*0.001)));Game.cookiesReset=Math.max(Game.cookiesReset,0);Game.EarnHeavenlyChips(0,true);if (Game.cookiesReset<=0){Game.heavenlyChips=0;}Game.recalculateGains=1;">HC /1k</a><br>';//wee bit inaccurate
			str+='<a class="option neato" '+Game.clickStr+'="Game.cookiesEarned=0;Game.recalculateGains=1;">Reset cookies earned</a><br>';
			str+='<div class="line"></div>';
			str+='<a class="option warning" '+Game.clickStr+'="Game.RuinTheFun(1);">Ruin The Fun</a>';
			str+='<a class="option warning" '+Game.clickStr+'="Game.SesameReset();">Wipe</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.GetAllDebugs();">All debugs</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.debugTimersOn=!Game.debugTimersOn;Game.OpenSesame();">Timers '+(Game.debugTimersOn?'On':'Off')+'</a><br>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.SetAllUpgrades(0);">No upgrades</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.SetAllUpgrades(1);">All upgrades</a><br>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.SetAllAchievs(0);">No achievs</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.SetAllAchievs(1);">All achievs</a><br>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.santaLevel=0;Game.dragonLevel=0;">Reset specials</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.MaxSpecials();">Max specials</a><br>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.lumpRefill=0;/*Date.now()-Game.getLumpRefillMax();*/">Reset refills</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.EditAscend();">'+(Game.DebuggingPrestige?'Exit Ascend Edit':'Ascend Edit')+'</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.DebugUpgradeCpS();">Debug upgrades CpS</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.seed=Game.makeSeed();">Re-seed</a>';
			str+='<a class="option neato" '+Game.clickStr+'="Game.heralds=100;l(\'heraldsAmount\').textContent=Game.heralds;Game.externalDataLoaded=true;Game.recalculateGains=1;">Max heralds</a>';
			str+='<div class="line"></div>';
			for (var i=0;i<Game.goldenCookieChoices.length/2;i++)
			{
				str+='<a class="option neato" '+Game.clickStr+'="var newShimmer=new Game.shimmer(\'golden\');newShimmer.force=\''+Game.goldenCookieChoices[i*2+1]+'\';">'+Game.goldenCookieChoices[i*2]+'</a>';
				//str+='<a class="option neato" '+Game.clickStr+'="Game.goldenCookie.force=\''+Game.goldenCookie.choices[i*2+1]+'\';Game.goldenCookie.spawn();">'+Game.goldenCookie.choices[i*2]+'</a>';
				//str+='<a class="option neato" '+Game.clickStr+'="Game.goldenCookie.click(0,\''+Game.goldenCookie.choices[i*2+1]+'\');">'+Game.goldenCookie.choices[i*2]+'</a>';
			}
			str+='</div>';
			
			l('devConsole').innerHTML=str;
			
			if (!l('fpsGraph'))
			{
				var div=document.createElement('canvas');
				div.id='fpsGraph';
				div.width=128;
				div.height=64;
				(div.style as any).opacity=0.5;
				div.style.pointerEvents='none';
				div.style.transformOrigin='0% 0%';
				div.style.transform='scale(0.75)';
				//l('devConsole').appendChild(div);
				l('devConsole').parentNode.insertBefore(div,l('devConsole').nextSibling);
				Game.fpsGraph=div;
				Game.fpsGraphCtx=Game.fpsGraph.getContext('2d',{alpha:false});
				var ctx=Game.fpsGraphCtx;
				ctx.fillStyle='#000';
				ctx.fillRect(0,0,128,64);
			}
			
			l('debug').style.display='block';
			Game.sesame=1;
			Game.Achievements['Cheated cookies taste awful'].won=1;
		}
		
		Game.EditAscend=function()
		{
			if (!Game.DebuggingPrestige)
			{
				Game.DebuggingPrestige=true;
				Game.AscendTimer=0;
				Game.OnAscend=1;
				Game.removeClass('ascendIntro');
				Game.addClass('ascending');
				
			}
			else
			{
				Game.DebuggingPrestige=false;
			}
			Game.BuildAscendTree();
			Game.OpenSesame();
		}
		
		//experimental debugging function that cycles through every owned upgrade, turns it off and on, and lists how much each upgrade is participating to CpS
		Game.debuggedUpgradeCpS=[];
		Game.debuggedUpgradeCpClick=[];
		Game.debugColors=['#322','#411','#600','#900','#f30','#f90','#ff0','#9f0','#0f9','#09f','#90f'];
		Game.DebugUpgradeCpS=function()
		{
			Game.CalculateGains();
			Game.debuggedUpgradeCpS=[];
			Game.debuggedUpgradeCpClick=[];
			var CpS=Game.cookiesPs;
			var CpClick=Game.computedMouseCps;
			for (var i in Game.Upgrades)
			{
				var me=Game.Upgrades[i];
				if (me.bought)
				{
					me.bought=0;
					Game.CalculateGains();
					//Game.debuggedUpgradeCpS[me.name]=CpS-Game.cookiesPs;
					Game.debuggedUpgradeCpS[me.name]=(CpS/(Game.cookiesPs||1)-1);
					Game.debuggedUpgradeCpClick[me.name]=(CpClick/(Game.computedMouseCps||1)-1);
					me.bought=1;
				}
			}
			Game.CalculateGains();
		}
		
		Game.vanilla=0;//everything we create beyond this will be saved in mod structures
		
		Game.launchMods();
		
		Game.runModHook('create');//declare custom upgrades/achievs/buffs/buildings here!
		Game.syncHeavenlyLayoutIfStale();//CC3: mods may have added prestige upgrades after the init layout ran
		
		BeautifyAll();
		
		if (!App)
		{
			if (!Game.LoadSave())
			{//try to load the save when we open the page. if this fails, try to brute-force it half a second later
				setTimeout(function(){
					var local=localStorageGet(Game.SaveTo);
					Game.LoadSave(local);
				},500);
			}
		}
		else if (App.saveData) setTimeout(function(){Game.LoadSave(App.saveData);},100);
		else setTimeout(function(){Game.LoadSave();},100);
		
		Game.ready=1;
		setTimeout(function(){if (typeof showAds==='undefined' && (!l('detectAds') || l('detectAds').clientHeight<1)) Game.addClass('noAds');},500);
		l('offGameMessage').innerHTML='';
		l('offGameMessageWrap').style.display='none';
		Game.Loop();
		Game.Draw();
		
		PlayCue('launch');
		
		if (!EN)
		{
			var adaptWidth=function(node: any)
			{
				var el=node.firstChild;
				var width=el.clientWidth;
				if (el.classList.contains('subButton'))
				{
					if (width/95>1) el.style.padding='6px 0px';
				}
				width=width/95;
				if (width>1)
				{
					el.style.fontSize=(parseInt(window.getComputedStyle(el).fontSize)*1/width)+'px';
					el.style.transform='scale(1,'+(width)+')';
				}
			}
			l('prefsButton').firstChild.innerHTML=loc("Options");
			l('statsButton').firstChild.innerHTML=loc("Stats");
			l('logButton').firstChild.innerHTML=loc("Info");
			l('helpButton').innerHTML=loc("Help");
			l('legacyButton').firstChild.innerHTML=loc("Legacy");
			adaptWidth(l('prefsButton'));
			adaptWidth(l('statsButton'));
			adaptWidth(l('logButton'));
			adaptWidth(l('legacyButton'));
			l('checkForUpdate').childNodes[0].textContent=loc("New update!");
			l('buildingsTitle').childNodes[0].textContent=loc("Buildings");
			l('storeTitle').childNodes[0].textContent=loc("Store");
		}
	}
	/*=====================================================================================
	LOGIC
	=======================================================================================*/
	Game.Logic=function()
	{
		Game.bounds=Game.l.getBounds();
		
		if (!Game.OnAscend && Game.AscendTimer==0)
		{
			for (var iKey in Game.Objects)
			{
				if (Game.Objects[iKey].eachFrame) Game.Objects[iKey].eachFrame();
			}
			Game.UpdateSpecial();
			Game.UpdateGrandmapocalypse();
			
			//CC3: Trigger finger challenge — scrolling over the cookie counts as clicking it
			if (Game.ascensionMode==2 && Game.BigCookieState==2 && !Game.promptOn && Game.Scroll!=0)
			{
				Game.ClickCookie();
				Game.Scroll=0;
			}
			//if (Game.BigCookieState==1 && !Game.promptOn) Game.ClickCookie();
			
			//handle graphic stuff
			if (Game.prefs.wobbly)
			{
				if (Game.BigCookieState==1) Game.BigCookieSizeT=0.98;
				else if (Game.BigCookieState==2) Game.BigCookieSizeT=1.05;
				else Game.BigCookieSizeT=1;
				Game.BigCookieSizeD+=(Game.BigCookieSizeT-Game.BigCookieSize)*0.75;
				Game.BigCookieSizeD*=0.75;
				Game.BigCookieSize+=Game.BigCookieSizeD;
				Game.BigCookieSize=Math.max(0.1,Game.BigCookieSize);
			}
			else
			{
				if (Game.BigCookieState==1) Game.BigCookieSize+=(0.98-Game.BigCookieSize)*0.5;
				else if (Game.BigCookieState==2) Game.BigCookieSize+=(1.05-Game.BigCookieSize)*0.5;
				else Game.BigCookieSize+=(1-Game.BigCookieSize)*0.5;
			}
			Game.particlesUpdate();
			
			if (Game.mousePointer) l('sectionLeft').style.cursor='pointer';
			else l('sectionLeft').style.cursor='auto';
			Game.mousePointer=0;
			
			//handle milk and milk accessories
			Game.milkProgress=Game.AchievementsOwned/25;
			if (Game.milkProgress>=0.5) Game.Unlock('Kitten helpers');
			if (Game.milkProgress>=1) Game.Unlock('Kitten workers');
			if (Game.milkProgress>=2) Game.Unlock('Kitten engineers');
			if (Game.milkProgress>=3) Game.Unlock('Kitten overseers');
			if (Game.milkProgress>=4) Game.Unlock('Kitten managers');
			if (Game.milkProgress>=5) Game.Unlock('Kitten accountants');
			if (Game.milkProgress>=6) Game.Unlock('Kitten specialists');
			if (Game.milkProgress>=7) Game.Unlock('Kitten experts');
			if (Game.milkProgress>=8) Game.Unlock('Kitten consultants');
			if (Game.milkProgress>=9) Game.Unlock('Kitten assistants to the regional manager');
			if (Game.milkProgress>=10) Game.Unlock('Kitten marketeers');
			if (Game.milkProgress>=11) Game.Unlock('Kitten analysts');
			if (Game.milkProgress>=12) Game.Unlock('Kitten executives');
			if (Game.milkProgress>=13) Game.Unlock('Kitten admins');
			Game.milkH=Math.min(1,Game.milkProgress)*0.35;
			Game.milkHd+=(Game.milkH-Game.milkHd)*0.02;
			
			Game.Milk=Game.Milks[Math.min(Math.floor(Game.milkProgress),Game.Milks.length-1)];
			
			if (Game.autoclickerDetected>0) Game.autoclickerDetected--;
			
			//handle research
			if (Game.researchT>0)
			{
				Game.researchT--;
			}
			if (Game.researchT==0 && Game.nextResearch)
			{
				if (!Game.Has(Game.UpgradesById[Game.nextResearch].name))
				{
					Game.Unlock(Game.UpgradesById[Game.nextResearch].name);
					Game.Notify(loc("Research complete"),loc("You have discovered: <b>%1</b>.",Game.UpgradesById[Game.nextResearch].dname),Game.UpgradesById[Game.nextResearch].icon);
				}
				Game.nextResearch=0;
				Game.researchT=-1;
				Game.recalculateGains=1;
			}
			//handle seasons
			if (Game.seasonT>0)
			{
				Game.seasonT--;
			}
			if (Game.seasonT<=0 && Game.season!='' && Game.season!=Game.baseSeason && !Game.Has('Eternal seasons'))
			{
				Game.Notify(Game.seasons[Game.season].over,'',Game.seasons[Game.season].triggerUpgrade.icon);
				if (Game.Has('Season switcher')) {Game.Unlock(Game.seasons[Game.season].trigger);Game.seasons[Game.season].triggerUpgrade.bought=0;}
				Game.season=Game.baseSeason;
				Game.seasonT=-1;
			}
			
			//press ctrl to bulk-buy 10, shift to bulk-buy 100
			if (!Game.promptOn)
			{
				if ((Game.keys[16] || Game.keys[17]) && !Game.buyBulkShortcut)
				{
					Game.buyBulkOld=Game.buyBulk;
					if (Game.keys[16]) Game.buyBulk=100;
					if (Game.keys[17]) Game.buyBulk=10;
					Game.buyBulkShortcut=1;
					Game.storeBulkButton(-1);
				}
			}
			if ((!Game.keys[16] && !Game.keys[17]) && Game.buyBulkShortcut)//release
			{
				Game.buyBulk=Game.buyBulkOld;
				Game.buyBulkShortcut=0;
				Game.storeBulkButton(-1);
			}
			
			//handle cookies
			if (Game.recalculateGains) Game.CalculateGains();
			Game.Earn(Game.cookiesPs/Game.fps);//add cookies per second
			
			//grow lumps
			Game.doLumps();
			
			//minigames
			for (var iKey in Game.Objects)
			{
				var me=Game.Objects[iKey];
				if (Game.isMinigameReady(me) && me.minigame.logic && Game.ascensionMode!=1) me.minigame.logic();
			}
			
			if (Game.specialTab!='' && Game.T%(Game.fps*3)==0) Game.ToggleSpecialMenu(1);
			
			//wrinklers
			if (Game.cpsSucked>0)
			{
				Game.Dissolve((Game.cookiesPs/Game.fps)*Game.cpsSucked);
				Game.cookiesSucked+=((Game.cookiesPs/Game.fps)*Game.cpsSucked);
				//should be using one of the following, but I'm not sure what I'm using this stat for anymore
				//Game.cookiesSucked=Game.wrinklers.reduce(function(s,w){return s+w.sucked;},0);
				//for (var i in Game.wrinklers) {Game.cookiesSucked+=Game.wrinklers[i].sucked;}
			}
			
			//var cps=Game.cookiesPs+Game.cookies*0.01;//exponential cookies
			//Game.Earn(cps/Game.fps);//add cookies per second
			
			for (var iKey in Game.Objects)
			{
				var me=Game.Objects[iKey];
				me.totalCookies+=(me.storedTotalCps*Game.globalCpsMult)/Game.fps;
			}
			if (Game.prefs.particles && Game.cookies && Game.T%Math.ceil(Game.fps/Math.min(10,Game.cookiesPs))==0) Game.particleAdd();//cookie shower
			
			if (Game.T%(Game.fps*10)==0) Game.recalculateGains=1;//recalculate CpS every 10 seconds (for dynamic boosts such as Century egg)
			
			/*=====================================================================================
			UNLOCKING STUFF
			=======================================================================================*/
			if (Game.T%(Game.fps)==0 && Math.random()<1/1000000) Game.Win('Just plain lucky');//1 chance in 1,000,000 every second achievement
			if (Game.T%(Game.fps*5)==0 && Game.ObjectsById.length>0)//check some achievements and upgrades
			{
				if (isNaN(Game.cookies)) {Game.cookies=0;Game.cookiesEarned=0;Game.recalculateGains=1;}
				
				var timePlayed: any=new Date();
				timePlayed.setTime(Date.now()-Game.startDate);
				
				if (!Game.fullDate || (Date.now()-Game.fullDate)>=365*24*60*60*1000) Game.Win('So much to do so much to see');
				
				if (Game.cookiesEarned>=1000000 && (Game.ascensionMode==1 || Game.resets==0))//challenge run or hasn't ascended yet
				{
					if (timePlayed<=1000*60*35) Game.Win('Speed baking I');
					if (timePlayed<=1000*60*25) Game.Win('Speed baking II');
					if (timePlayed<=1000*60*15) Game.Win('Speed baking III');
					
					if (Game.cookieClicks<=15) Game.Win('Neverclick');
					if (Game.cookieClicks<=0) Game.Win('True Neverclick');
					if (Game.cookiesEarned>=1000000000 && Game.UpgradesOwned==0) Game.Win('Hardcore');
				}
				
				//CC3: challenge-mode completion rewards — reach a cookie milestone
				//during the run to permanently unlock the themed heavenly upgrade
				//(the shadow achievement is the persistent flag; the upgrades check
				//Game.HasAchiev so they only appear in the tree once earned).
				if (Game.ascensionMode==2 && Game.cookiesEarned>=1000000000000000) Game.Win('Scrolling adept');
				if (Game.ascensionMode==3 && Game.cookiesEarned>=1000000000000) Game.Win('Golden heart');
				if (Game.ascensionMode==4 && Game.cookiesEarned>=1000000000) Game.Win('Unity');
				if (Game.ascensionMode==5 && Game.cookiesEarned>=1000000000000000) Game.Win('Minimalist');
				
				for (var iKey in Game.UnlockAt)
				{
					var unlock=Game.UnlockAt[iKey];
					if (Game.cookiesEarned>=unlock.cookies)
					{
						var pass=1;
						if (unlock.require && !Game.Has(unlock.require) && !Game.HasAchiev(unlock.require)) pass=0;
						if (unlock.season && Game.season!=unlock.season) pass=0;
						if (pass) {Game.Unlock(unlock.name);Game.Win(unlock.name);}
					}
				}
				
				if (Game.Has('Golden switch')) Game.Unlock('Golden switch [off]');
				if (Game.Has('Shimmering veil') && !Game.Has('Shimmering veil [off]') && !Game.Has('Shimmering veil [on]')) {Game.Unlock('Shimmering veil [on]');Game.Upgrades['Shimmering veil [off]'].earn();}
				if (Game.Has('Sugar craving')) Game.Unlock('Sugar frenzy');
				if (Game.Has('Classic dairy selection')) Game.Unlock('Milk selector');
				if (Game.Has('Basic wallpaper assortment')) Game.Unlock('Background selector');
				if (Game.Has('Golden cookie alert sound')) Game.Unlock('Golden cookie sound selector');
				if (Game.Has('Sound test')) Game.Unlock('Jukebox');
				
				if (Game.Has('Prism heart biscuits')) Game.Win('Lovely cookies');
				if (Game.season=='easter')
				{
					var eggs=0;
					for (var iKey in Game.easterEggs)
					{
						if (Game.HasUnlocked(Game.easterEggs[iKey])) eggs++;
					}
					if (eggs>=1) Game.Win('The hunt is on');
					if (eggs>=7) Game.Win('Egging on');
					if (eggs>=14) Game.Win('Mass Easteria');
					if (eggs>=Game.easterEggs.length) Game.Win('Hide & seek champion');
				}
				
				if (Game.Has('Fortune cookies'))
				{
					var list=Game.Tiers['fortune'].upgrades;
					var fortunes=0;
					for (var iKey in list)
					{
						if (Game.Has(list[iKey].name)) fortunes++;
					}
					if (fortunes>=list.length) Game.Win('O Fortuna');
				}
				
				if (Game.Has('Legacy') && Game.ascensionMode!=1)
				{
					Game.Unlock('Heavenly chip secret');
					if (Game.Has('Heavenly chip secret')) Game.Unlock('Heavenly cookie stand');
					if (Game.Has('Heavenly cookie stand')) Game.Unlock('Heavenly bakery');
					if (Game.Has('Heavenly bakery')) Game.Unlock('Heavenly confectionery');
					if (Game.Has('Heavenly confectionery')) Game.Unlock('Heavenly key');
					
					if (Game.Has('Heavenly key')) Game.Win('Wholesome');
				}
			
				for (var iKey in Game.BankAchievements)
				{
					if (Game.cookiesEarned>=Game.BankAchievements[iKey].threshold) Game.Win(Game.BankAchievements[iKey].name);
				}
				
				var buildingsOwned=0;
				var mathematician=1;
				var base10=1;
				var minAmount=100000;
				for (var iKey in Game.Objects)
				{
					buildingsOwned+=Game.Objects[iKey].amount;
					minAmount=Math.min(Game.Objects[iKey].amount,minAmount);
					if (!Game.HasAchiev('Mathematician')) {if (Game.Objects[iKey].amount<Math.min(128,Math.pow(2,(Game.ObjectsById.length-Game.Objects[iKey].id)-1))) mathematician=0;}
					if (!Game.HasAchiev('Base 10')) {if (Game.Objects[iKey].amount<(Game.ObjectsById.length-Game.Objects[iKey].id)*10) base10=0;}
				}
				if (minAmount>=1) Game.Win('One with everything');
				if (mathematician==1) Game.Win('Mathematician');
				if (base10==1) Game.Win('Base 10');
				if (minAmount>=100) {Game.Win('Centennial');Game.Unlock('Milk chocolate butter biscuit');}
				if (minAmount>=150) {Game.Win('Centennial and a half');Game.Unlock('Dark chocolate butter biscuit');}
				if (minAmount>=200) {Game.Win('Bicentennial');Game.Unlock('White chocolate butter biscuit');}
				if (minAmount>=250) {Game.Win('Bicentennial and a half');Game.Unlock('Ruby chocolate butter biscuit');}
				if (minAmount>=300) {Game.Win('Tricentennial');Game.Unlock('Lavender chocolate butter biscuit');}
				if (minAmount>=350) {Game.Win('Tricentennial and a half');Game.Unlock('Synthetic chocolate green honey butter biscuit');}
				if (minAmount>=400) {Game.Win('Quadricentennial');Game.Unlock('Royal raspberry chocolate butter biscuit');}
				if (minAmount>=450) {Game.Win('Quadricentennial and a half');Game.Unlock('Ultra-concentrated high-energy chocolate butter biscuit');}
				if (minAmount>=500) {Game.Win('Quincentennial');Game.Unlock('Pure pitch-black chocolate butter biscuit');}
				if (minAmount>=550) {Game.Win('Quincentennial and a half');Game.Unlock('Cosmic chocolate butter biscuit');}
				if (minAmount>=600) {Game.Win('Sexcentennial');Game.Unlock('Butter biscuit (with butter)');}
				if (minAmount>=650) {Game.Win('Sexcentennial and a half');Game.Unlock('Everybutter biscuit');}
				
				if (Game.ascensionMode!=2)//Trigger finger: no clicking achievements
			{
				if (Game.handmadeCookies>=1000) {Game.Win('Clicktastic');Game.Unlock('Plastic mouse');}
				if (Game.handmadeCookies>=100000) {Game.Win('Clickathlon');Game.Unlock('Iron mouse');}
				if (Game.handmadeCookies>=10000000) {Game.Win('Clickolympics');Game.Unlock('Titanium mouse');}
				if (Game.handmadeCookies>=1000000000) {Game.Win('Clickorama');Game.Unlock('Adamantium mouse');}
				if (Game.handmadeCookies>=100000000000) {Game.Win('Clickasmic');Game.Unlock('Unobtainium mouse');}
				if (Game.handmadeCookies>=10000000000000) {Game.Win('Clickageddon');Game.Unlock('Eludium mouse');}
				if (Game.handmadeCookies>=1000000000000000) {Game.Win('Clicknarok');Game.Unlock('Wishalloy mouse');}
				if (Game.handmadeCookies>=100000000000000000) {Game.Win('Clickastrophe');Game.Unlock('Fantasteel mouse');}
				if (Game.handmadeCookies>=10000000000000000000) {Game.Win('Clickataclysm');Game.Unlock('Nevercrack mouse');}
				if (Game.handmadeCookies>=1000000000000000000000) {Game.Win('The ultimate clickdown');Game.Unlock('Armythril mouse');}
				if (Game.handmadeCookies>=100000000000000000000000) {Game.Win('All the other kids with the pumped up clicks');Game.Unlock('Technobsidian mouse');}
				if (Game.handmadeCookies>=10000000000000000000000000) {Game.Win('One...more...click...');Game.Unlock('Plasmarble mouse');}
				if (Game.handmadeCookies>=1000000000000000000000000000) {Game.Win('Clickety split');Game.Unlock('Miraculite mouse');}
				if (Game.handmadeCookies>=100000000000000000000000000000) {Game.Win('Ain\'t that a click in the head');Game.Unlock('Aetherice mouse');}
			}
				
				if (Game.cookiesEarned<Game.cookies) Game.Win('Cheated cookies taste awful');
				
				if (Game.Has('Skull cookies') && Game.Has('Ghost cookies') && Game.Has('Bat cookies') && Game.Has('Slime cookies') && Game.Has('Pumpkin cookies') && Game.Has('Eyeball cookies') && Game.Has('Spider cookies')) Game.Win('Spooky cookies');
				if (Game.wrinklersPopped>=1) Game.Win('Itchscratcher');
				if (Game.wrinklersPopped>=50) Game.Win('Wrinklesquisher');
				if (Game.wrinklersPopped>=200) Game.Win('Moistburster');
				
				if (Game.cookiesEarned>=1000000 && Game.Has('How to bake your dragon')) Game.Unlock('A crumbly egg');
				
				if (Game.cookiesEarned>=25 && Game.season=='christmas') Game.Unlock('A festive hat');
				if (Game.Has('Christmas tree biscuits') && Game.Has('Snowflake biscuits') && Game.Has('Snowman biscuits') && Game.Has('Holly biscuits') && Game.Has('Candy cane biscuits') && Game.Has('Bell biscuits') && Game.Has('Present biscuits')) Game.Win('Let it snow');
				
				if (Game.reindeerClicked>=1) Game.Win('Oh deer');
				if (Game.reindeerClicked>=50) Game.Win('Sleigh of hand');
				if (Game.reindeerClicked>=200) Game.Win('Reindeer sleigher');
				
				if (buildingsOwned>=100) Game.Win('Builder');
				if (buildingsOwned>=500) Game.Win('Architect');
				if (buildingsOwned>=1000) Game.Win('Engineer');
				if (buildingsOwned>=2500) Game.Win('Lord of Constructs');
				if (buildingsOwned>=5000) Game.Win('Grand design');
				if (buildingsOwned>=7500) Game.Win('Ecumenopolis');
				if (buildingsOwned>=10000) Game.Win('Myriad');
				if (Game.UpgradesOwned>=20) Game.Win('Enhancer');
				if (Game.UpgradesOwned>=50) Game.Win('Augmenter');
				if (Game.UpgradesOwned>=100) Game.Win('Upgrader');
				if (Game.UpgradesOwned>=200) Game.Win('Lord of Progress');
				if (Game.UpgradesOwned>=300) Game.Win('The full picture');
				if (Game.UpgradesOwned>=400) Game.Win('When there\'s nothing left to add');
				if (Game.UpgradesOwned>=500) Game.Win('Kaizen');
				if (Game.UpgradesOwned>=600) Game.Win('Beyond quality');
				if (buildingsOwned>=4000 && Game.UpgradesOwned>=300) Game.Win('Polymath');
				if (buildingsOwned>=8000 && Game.UpgradesOwned>=400) Game.Win('Renaissance baker');
				
				if (!Game.HasAchiev('Jellicles'))
				{
					var kittens=0;
					for (var i=0;i<Game.UpgradesByPool['kitten'].length;i++)
					{
						if (Game.Has(Game.UpgradesByPool['kitten'][i].name)) kittens++;
					}
					if (kittens>=10) Game.Win('Jellicles');
				}
				
				if (Game.cookiesEarned>=10000000000000 && !Game.HasAchiev('You win a cookie')) {Game.Win('You win a cookie');Game.Earn(1);}
				
				if (Game.shimmerTypes['golden'].n>=4) Game.Win('Four-leaf cookie');
				
				var grandmas=0;
				for (var iKey in Game.GrandmaSynergies)
				{
					if (Game.Has(Game.GrandmaSynergies[iKey])) grandmas++;
				}
				if (!Game.HasAchiev('Elder') && grandmas>=7) Game.Win('Elder');
				if (!Game.HasAchiev('Veteran') && grandmas>=14) Game.Win('Veteran');
				
				var catSynergiesOwned=0;
				for (var iKey in Game.CatSynergies)
				{
					if (Game.Has(Game.CatSynergies[iKey])) catSynergiesOwned++;
				}
				if (!Game.HasAchiev('The purr-fect match') && catSynergiesOwned>=Game.CatSynergies.length) Game.Win('The purr-fect match');
				if (Game.Objects['Grandma'].amount>=6 && !Game.Has('Bingo center/Research facility') && Game.HasAchiev('Elder')) Game.Unlock('Bingo center/Research facility');
				if (Game.pledges>0) Game.Win('Elder nap');
				if (Game.pledges>=5) Game.Win('Elder slumber');
				if (Game.pledges>=10) Game.Unlock('Sacrificial rolling pins');
				if (Game.Objects['Cursor'].amount+Game.Objects['Grandma'].amount>=777) Game.Win('The elder scrolls');
				
				for (var iKey in Game.Objects)
				{
					var it=Game.Objects[iKey];
					for (var ii in it.productionAchievs)
					{
						if (it.totalCookies>=it.productionAchievs[ii].pow) Game.Win(it.productionAchievs[ii].achiev.name);
					}
				}
				
				if (!Game.HasAchiev('Cookie-dunker') && Game.LeftBackground && Game.milkProgress>0.1 && (Game.LeftBackground.canvas.height*0.4+256/2-16)>((1-Game.milkHd)*Game.LeftBackground.canvas.height)) Game.Win('Cookie-dunker');
				//&& l('bigCookie').getBounds().bottom>l('milk').getBounds().top+16 && Game.milkProgress>0.1) Game.Win('Cookie-dunker');
				
				Game.runModHook('check');
			}
			
			Game.cookiesd+=(Game.cookies-Game.cookiesd)*0.3;
			
			if (Game.storeToRefresh) Game.RefreshStore();
			if (Game.upgradesToRebuild) Game.RebuildUpgrades();
			
			Game.updateShimmers();
			Game.updateBuffs();
			
			Game.UpdateTicker();
		}
		
		if (Game.T%(Game.fps*2)==0)
		{
			var title='Cookie Clicker';
			if (Game.season=='fools') title='Cookie Baker';
			document.title=(Game.OnAscend?(EN?'Ascending! ':(loc("Ascending")+' | ')):'')+loc("%1 cookie",LBeautify(Game.cookies))+' - '+title;
		}
		if (Game.T%15==0)
		{
			//written through the magic of "hope for the best" maths
			var chipsOwned=Game.HowMuchPrestige(Game.cookiesReset);
			var ascendNowToOwn=Math.floor(Game.HowMuchPrestige(Game.cookiesReset+Game.cookiesEarned));
			var ascendNowToGet=ascendNowToOwn-Math.floor(chipsOwned);
			var nextChipAt=Game.HowManyCookiesReset(Math.floor(chipsOwned+ascendNowToGet+1))-Game.HowManyCookiesReset(Math.floor(chipsOwned+ascendNowToGet));
			var cookiesToNext=Game.HowManyCookiesReset(ascendNowToOwn+1)-(Game.cookiesEarned+Game.cookiesReset);
			var percent=1-(cookiesToNext/nextChipAt);
			
			//fill the tooltip under the Legacy tab
			var date=new Date();
			date.setTime(Date.now()-Game.startDate);
			var timeInSeconds=date.getTime()/1000;
			var startDate=Game.sayTime(timeInSeconds*Game.fps,-1);
			
			var str='';
			if (EN) str+='You\'ve been on this run for <b>'+(startDate==''?'not very long':(startDate))+'</b>.<br>';
			else str+=loc("You've been on this run for <b>%1</b>.",startDate)+'<br>';
			str+='<div class="line"></div>';
			if (Game.prestige>0)
			{
				str+=loc("Your prestige level is currently <b>%1</b>.<br>(CpS +%2%)",[Beautify(Game.prestige),Beautify(Game.prestige)]);
				str+='<div class="line"></div>';
			}
			if (ascendNowToGet<1) str+=loc("Ascending now would grant you no prestige.");
			else if (ascendNowToGet<2) str+=loc("Ascending now would grant you<br><b>1 prestige level</b> (+1% CpS)<br>and <b>1 heavenly chip</b> to spend.");
			else str+=loc("Ascending now would grant you<br><b>%1 prestige levels</b> (+%2% CpS)<br>and <b>%3 heavenly chips</b> to spend.",[Beautify(ascendNowToGet),Beautify(ascendNowToGet),Beautify(ascendNowToGet)]);
			if (cookiesToNext>=0)
			{
				//note: cookiesToNext can be negative at higher HC amounts due to precision loss. we simply hide it in such cases, as this usually only occurs when the gap is small and rapidly overcome anyway
				str+='<div class="line"></div>';
				str+=loc("You need <b>%1 more cookies</b> for the next level.",Beautify(cookiesToNext))+'<br>';
			}
			l('ascendTooltip').innerHTML=str;
			
			if (ascendNowToGet>0)//show number saying how many chips you'd get resetting now
			{
				Game.ascendNumber.textContent='+'+SimpleBeautify(ascendNowToGet);
				Game.ascendNumber.style.display='block';
			}
			else
			{
				Game.ascendNumber.style.display='none';
			}
			
			if (ascendNowToGet>Game.ascendMeterLevel || Game.ascendMeterPercentT<Game.ascendMeterPercent)
			{
				//reset the gauge and play a sound if we gained a potential level
				Game.ascendMeterPercent=0;
				//PlaySound('snd/levelPrestige.mp3');//a bit too annoying
			}
			Game.ascendMeterLevel=ascendNowToGet;
			Game.ascendMeterPercentT=percent;//gauge that fills up as you near your next chip
			//if (Game.ascendMeterPercentT<Game.ascendMeterPercent) {Game.ascendMeterPercent=0;PlaySound('snd/levelPrestige.mp3',0.5);}
			//if (percent>=1) {Game.ascendMeter.className='';} else Game.ascendMeter.className='filling';
		}
		//Game.ascendMeter.style.right=Math.floor(Math.max(0,1-Game.ascendMeterPercent)*100)+'px';
		Game.ascendMeter.style.backgroundPosition=(-Game.T*0.5-Game.ascendMeterPercent*100)+'px';
		Game.ascendMeter.style.transform='translate('+Math.floor(-Math.max(0,1-Game.ascendMeterPercent)*100)+'%,0px)';
		Game.ascendMeterPercent+=(Game.ascendMeterPercentT-Game.ascendMeterPercent)*0.1;
		
		Game.NotesLogic();
		if (Game.mouseMoved || Game.Scroll || Game.tooltip.dynamic) Game.tooltip.update();
		
		if (Game.T%(Game.fps*5)==0 && !Game.mouseDown && (Game.onMenu=='stats' || Game.onMenu=='prefs')) Game.UpdateMenu();
		if (Game.T%(Game.fps*1)==0) Game.UpdatePrompt();
		if (Game.AscendTimer>0) Game.UpdateAscendIntro();
		if (Game.ReincarnateTimer>0) Game.UpdateReincarnateIntro();
		if (Game.OnAscend) Game.UpdateAscend();
		
		Game.runModHook('logic');
		
		if (Game.sparklesT>0)
		{
			Game.sparkles.style.backgroundPosition=-Math.floor((Game.sparklesFrames-Game.sparklesT+1)*128)+'px 0px';
			Game.sparklesT--;
			if (Game.sparklesT==1) Game.sparkles.style.display='none';
		}
		
		Game.Click=0;
		Game.Scroll=0;
		Game.mouseMoved=0;
		Game.CanClick=1;
		
		if ((Game.toSave || (Game.T%(Game.fps*60)==0 && Game.T>Game.fps*10 && Game.prefs.autosave)) && !Game.OnAscend)
		{
			//check if we can save : no minigames are loading
			var canSave=true;
			for (var iKey in Game.Objects)
			{
				var me=Game.Objects[iKey];
				if (me.minigameLoading){canSave=false;break;}
			}
			if (canSave) Game.WriteSave();
		}
		if (!Game.toSave && !Game.isSaving)
		{
			if (Game.toReload) {Game.toReload=false;if (!App){location.reload();}else{App.reload();}}
			if (Game.toQuit) {Game.toQuit=false;if (!App){window.close();}else{App.quit();}}
		}
		
		if (App && App.logic) App.logic(Game.T);
		
		//every hour: get server data (ie. update notification, patreon, steam etc)
		if (Game.T%(Game.fps*60*60)==0 && Game.T>Game.fps*10/* && Game.prefs.autoupdate*/) {Game.CheckUpdates();Game.GrabData();}
		
		Game.T++;
	}
	
	/*=====================================================================================
	DRAW
	=======================================================================================*/
	
	Game.Draw=function()
	{
		Game.DrawBackground();Timer.track('end of background');
		
		if (!Game.OnAscend)
		{
			
			var str=Beautify(Math.round(Game.cookiesd));
			if (Game.cookiesd>=1000000)//dirty padding
			{
				var spacePos=str.indexOf(' ');
				var dotPos=str.indexOf('.');
				var add='';
				if (spacePos!=-1)
				{
					if (dotPos==-1) add+='.000';
					else
					{
						if (spacePos-dotPos==2) add+='00';
						if (spacePos-dotPos==3) add+='0';
					}
				}
				str=[str.slice(0,spacePos),add,str.slice(spacePos)].join('');
			}
			
			str=loc("%1 cookie",{n:Math.round(Game.cookiesd),b:str});
			if (str.length>14) str=str.replace(' ','<br>');
			
			if (Game.prefs.monospace) str='<span class="monospace">'+str+'</span>';
			str=str+'<div id="cookiesPerSecond"'+(Game.cpsSucked>0?' class="wrinkled"':'')+'>'+loc("per second:")+' '+Beautify(Game.cookiesPs*(1-Game.cpsSucked),1)+'</div>';
			l('cookies').innerHTML=str;
			Timer.track('cookie amount');
			
			for (var i in Game.Objects)
			{
				var me=Game.Objects[i];
				if (me.onMinigame && me.minigame.draw && !me.muted && !Game.onMenu) me.minigame.draw();
			}
			Timer.track('draw minigames');
			
			if (Game.drawT%5==0)
			{
				//if (Game.prefs.monospace) {l('cookies').className='title monospace';} else {l('cookies').className='title';}
				var lastLocked=0;
				// CC3: iterate in storeOrder so custom buildings (e.g. Cats)
				// appear between the buildings they belong visually, even if
				// their auto-assigned id places them later in Game.Objects.
				var sortedObjects=Object.keys(Game.Objects).map(function(k){return Game.Objects[k];}).sort(function(a:any,b:any){
					var aOrder=typeof a.storeOrder==='number'?a.storeOrder:a.id;
					var bOrder=typeof b.storeOrder==='number'?b.storeOrder:b.id;
					return aOrder-bOrder;
				});
				for (var si=0;si<sortedObjects.length;si++)
				{
					var me=sortedObjects[si];
					
					//make products full-opacity if we can buy them
					var classes='product';
					var price=me.bulkPrice;
					if (Game.cookiesEarned>=me.basePrice || me.bought>0) {classes+=' unlocked';lastLocked=0;me.locked=0;} else {classes+=' locked';lastLocked++;me.locked=1;}
					if ((Game.buyMode==1 && Game.cookies>=price) || (Game.buyMode==-1 && me.amount>0)) classes+=' enabled'; else classes+=' disabled';
					//CC3: Monoculture challenge — buildings other than the locked type are disabled
					if (Game.ascensionMode==4 && Game.monoBuilding!==null && Game.monoBuilding!==me.id) classes=classes.replace(' enabled',' disabled');
					if (lastLocked>2) classes+=' toggledOff';
					me.l.className=classes;
					//if (me.id>0) {l('productName'+me.id).innerHTML=Beautify(me.storedTotalCps/Game.ObjectsById[me.id-1].storedTotalCps,2);}
				}
				
				//make upgrades full-opacity if we can buy them
				var lastPrice=0;
				for (var i in Game.UpgradesInStore)
				{
					var me=Game.UpgradesInStore[i];
					if (!me.bought)
					{
						var price=me.getPrice();
						var canBuy=me.canBuy();//(Game.cookies>=price);
						var enabled=(l('upgrade'+i).className.indexOf('enabled')>-1);
						if ((canBuy && !enabled) || (!canBuy && enabled)) Game.upgradesToRebuild=1;
						if (price<lastPrice) Game.storeToRefresh=1;//is this upgrade less expensive than the previous one? trigger a refresh to sort it again
						lastPrice=price;
					}
					if (me.timerDisplay)
					{
						var T=me.timerDisplay();
						if (T!=-1)
						{
							if (!l('upgradePieTimer'+i)) l('upgrade'+i).innerHTML=l('upgrade'+i).innerHTML+'<div class="pieTimer" id="upgradePieTimer'+i+'"></div>';
							T=(T*144)%144;
							l('upgradePieTimer'+i).style.backgroundPosition=(-Math.floor(T%18))*48+'px '+(-Math.floor(T/18))*48+'px';
						}
					}
					
					//if (me.canBuy()) l('upgrade'+i).className='crate upgrade enabled'; else l('upgrade'+i).className='crate upgrade disabled';
				}
			}
			Timer.track('store');
			
			if (Game.PARTY)//i was bored and felt like messing with CSS
			{
				var pulse=Math.pow((Game.T%10)/10,0.5);
				Game.l.style.filter='hue-rotate('+((Game.T*5)%360)+'deg) brightness('+(150-50*pulse)+'%)';
				Game.l.style.webkitFilter='hue-rotate('+((Game.T*5)%360)+'deg) brightness('+(150-50*pulse)+'%)';
				Game.l.style.transform='scale('+(1.02-0.02*pulse)+','+(1.02-0.02*pulse)+') rotate('+(Math.sin(Game.T*0.5)*0.5)+'deg)';
				Game.wrapper.style.overflowX='hidden';
				Game.wrapper.style.overflowY='hidden';
			}
			
			Timer.clean();
			if (Game.prefs.animate && ((Game.prefs.fancy && Game.drawT%1==0) || (!Game.prefs.fancy && Game.drawT%10==0)) && Game.AscendTimer==0 && Game.onMenu=='') Game.DrawBuildings();Timer.track('buildings');
			
			Game.textParticlesUpdate();Timer.track('text particles');
		}
		
		Game.NotesDraw();Timer.track('notes');
		
		Game.runModHook('draw');
		
		Game.drawT++;
		//if (Game.prefs.altDraw) requestAnimationFrame(Game.Draw);
	}
	
	/*=====================================================================================
	MAIN LOOP
	=======================================================================================*/
	Game.Loop=function()
	{
		if (Game.timedout) return false;
		Timer.say('START');
		Timer.track('browser stuff');
		Timer.say('LOGIC');
		//update game logic !
		Game.catchupLogic=0;
		Game.Logic();
		Game.catchupLogic=1;
		
		var time=Date.now();
		
		
		//latency compensator
		Game.accumulatedDelay+=((time-Game.time)-1000/Game.fps);
		if (Game.prefs.timeout && time-Game.lastActivity>=1000*60*5)
		{
			if (Game.accumulatedDelay>1000*60*30) Game.delayTimeouts+=3;//more than 30 minutes delay? computer probably asleep and not making cookies anyway
			else if (Game.accumulatedDelay>1000*5) Game.delayTimeouts++;//add to timeout counter when we skip 10 seconds worth of frames (and the player has been inactive for at least 5 minutes)
			if (Game.delayTimeouts>=3) Game.Timeout();//trigger timeout when the timeout counter is 3+
		}
		
		Game.accumulatedDelay=Math.min(Game.accumulatedDelay,1000*5);//don't compensate over 5 seconds; if you do, something's probably very wrong
		Game.time=time;
		
		//if (Game.accumulatedDelay>=Game.fps) console.log('delay:',Math.round(Game.accumulatedDelay/Game.fps));
		while (Game.accumulatedDelay>0)
		{
			Game.Logic();
			Game.accumulatedDelay-=1000/Game.fps;//as long as we're detecting latency (slower than target fps), execute logic (this makes drawing slower but makes the logic behave closer to correct target fps)
		}
		Game.catchupLogic=0;
		Timer.track('logic');
		Timer.say('END LOGIC');
		/*
		if (!Game.prefs.altDraw)
		{
			var hasFocus=document.hasFocus();
			Timer.say('DRAW');
			if (hasFocus || Game.prefs.focus || Game.loopT%10==0) requestAnimationFrame(Game.Draw);
			//if (document.hasFocus() || Game.loopT%5==0) Game.Draw();
			Timer.say('END DRAW');
		}
		else requestAnimationFrame(Game.Draw);*/
		if (Game.visible) Game.Draw();
		
		//if (!hasFocus) Game.tooltip.hide();
		
		if (Game.sesame)
		{
			//fps counter and graph
			Game.previousFps=Game.currentFps;
			Game.currentFps=Game.getFps();
				var ctx=Game.fpsGraphCtx;
				ctx.drawImage(Game.fpsGraph,-1,0);
				ctx.fillStyle='rgb('+Math.round((1-Game.currentFps/Game.fps)*128)+',0,0)';
				ctx.fillRect(128-1,0,1,64);
				ctx.strokeStyle='#fff';
				ctx.beginPath();
				ctx.moveTo(128-1,(1-Game.previousFps/Game.fps)*64);
				ctx.lineTo(128,(1-Game.currentFps/Game.fps)*64);
				ctx.stroke();
			
			l('fpsCounter').textContent=Game.currentFps+' fps';
			var str='';
			for (var i in Timer.labels) {str+=Timer.labels[i];}
			if (Game.debugTimersOn) l('debugLog').style.display='block';
			else l('debugLog').style.display='none';
			l('debugLog').innerHTML=str;
			
		}
		Timer.reset();
		
		Game.loopT++;
		setTimeout(Game.Loop,1000/Game.fps);
	}
}

/*=====================================================================================
LAUNCH THIS THING
=======================================================================================*/
//Game.Launch();


//try {Game.Launch();}
//catch(err) {console.log('ERROR : '+err.message);}

window.addEventListener('load',function()
{
	if (!Game.ready)
	{
		var loadLangAndLaunch=function(lang: any)
		{
			localStorageSet('CookieClickerLang',lang);
			
			//LoadLang('../Cookie Clicker Localization/EN.js',function(lang){return function(){
			window.loadLangModule!('EN',function(){
				locStringsFallback=locStrings;
				window.loadLangModule!(lang,function(){
					var launch=function(){
						Game.Launch();
						if (top!=self) Game.ErrorFrame();
						else
						{
							console.log('[=== '+choose([
								'Oh, hello!',
								'hey, how\'s it hangin',
								'About to cheat in some cookies or just checking for bugs?',
								'Remember : cheated cookies taste awful!',
								'Hey, Orteil here. Cheated cookies taste awful... or do they?',
							])+' ===]');
							Game.Load();
							//try {Game.Load();}
							//catch(err) {console.log('ERROR : '+err.message);}
						}
					}
					if (App && App.loadMods) App.loadMods(launch);
					else launch();
				});
			});
		}
		
		var showLangSelect=function(callback: any)
		{
			var str='';
			for (var i in Langs)
			{
				var lang=Langs[i];
				str+='<div class="langSelectButton title" id="langSelect-'+lang.nameEN+'">'+lang.name+'</div>';
			}
			l('offGameMessage').innerHTML=
			'<div class="title" id="languageSelectHeader">Language</div>'+
			'<div class="line" style="max-width:300px;"></div>'+
			str;
			for (var i in Langs)
			{
				var lang=Langs[i];
				AddEvent(l('langSelect-'+lang.nameEN),'click',function(lang: any){return function(){callback(lang);};}(i));
				AddEvent(l('langSelect-'+lang.nameEN),'mouseover',function(lang: any){return function(){l('languageSelectHeader').innerHTML=Langs[lang].changeLanguage;};}(i));
			}
		}
		
		var lang=localStorageGet('CookieClickerLang');
		if (!lang) showLangSelect(loadLangAndLaunch);
		else loadLangAndLaunch(lang);
	}
});
/* =====================================================================
 * CC3: engine globals shim. The 2.048 engine was a single classic script,
 * so every top-level binding was global. The minigame modules and the
 * legacy mod loader still resolve their free variables against window,
 * so we republish the engine surface here.
 * ===================================================================== */
Object.assign(window, {
	Audio,
	localStorageGet,
	localStorageSet,
	Music,
	PlayCue,
	TopBarOffset,
	LASTHEAVENLYSELECTED,
	ON,
	OFF,
	l,
	choose,
	escapeRegExp,
	replaceAll,
	cap,
	romanize,
	realAudio,
	randomFloor,
	shuffle,
	LoadScript,
	ajax,
	toFixed,
	formatEveryThirdPower,
	rawFormatter,
	formatLong,
	prefixes,
	suffixes,
	formatShort,
	numberFormatters,
	Beautify,
	shortenNumber,
	SimpleBeautify,
	beautifyInTextFilter,
	BeautifyInTextFunction,
	BeautifyInText,
	BeautifyAll,
	locStrings,
	locStringsFallback,
	locId,
	EN,
	locName,
	locPatches,
	locPlur,
	locPlurFallback,
	locStringsByPart,
	FindLocStringByPart,
	Langs,
	locBlink,
	localizationNotFound,
	loc,
	parseLoc,
	LBeautify,
	ModLanguage,
	AddLanguage,
	LoadLang,
	LocalizeUpgradesAndAchievs,
	getUpgradeName,
	getAchievementName,
	utf8_to_b64,
	b64_to_utf8,
	CompressBin,
	UncompressBin,
	CompressLargeBin,
	UncompressLargeBin,
	pack,
	unpack,
	pack2,
	unpack2,
	pack3,
	saveAs,
	bind,
	grabProps,
	OldCanvasDrawImage,
	AddEvent,
	RemoveEvent,
	FireEvent,
	writeIcon,
	tinyIcon,
	Loader,
	Pic,
	Sounds,
	OldPlaySound,
	SoundInsts,
	SoundI,
	pitchSupport,
	PlaySound,
	PlayMusicSound,
	triggerAnim,
	debugStr,
	Debug,
	Timer,
	Game
});

/* CC3 rewrite (slice 3): live-bridge the vanilla-content order/pool/power
 * globals. The content modules (content/upgrades.ts; later
 * content/achievements.ts) read and write those names as bare globals, which
 * in ESM resolves to window; the accessors below point those window
 * properties at the module-level vars declared at the top of this file. The
 * engine's own ctors (Game.Upgrade, Game.Achievement) keep reading the
 * unqualified names, which resolve to the same module-level vars — so both
 * sides observe one shared state, exactly like the original Init-scoped
 * closure vars. (Object.assign above copies values by reference-free
 * assignment, so it is not a bridge; the accessors are.) */
Object.defineProperty(window, 'order', {get(){return order;}, set(v: any){order=v;}});
Object.defineProperty(window, 'pool', {get(){return pool;}, set(v: any){pool=v;}});
Object.defineProperty(window, 'power', {get(){return power;}, set(v: any){power=v;}});
/* CC3 rewrite (phase 3, slice 2): the core Building class reads these three
 * primitives unqualified, i.e. from window — but Object.assign above copied
 * them by value at module-eval time, before the language load reassigns
 * them (locId 'NONE'→'EN', EN, TopBarOffset). Read-only accessors bridge the
 * live engine vars, the same way order/pool/power are bridged. (EN also
 * fixes the content modules' non-English games to match master, where EN
 * was a live global.) */
Object.defineProperty(window, 'locId', {get(){return locId;}});
Object.defineProperty(window, 'EN', {get(){return EN;}});
Object.defineProperty(window, 'TopBarOffset', {get(){return TopBarOffset;}});
/* CC3 rewrite (phase 6, slice 4): bridge the live ON/OFF suffix strings the
 * same way. They are assigned inside Game.Launch (' '+loc("ON")) — long after
 * the Object.assign above copied them by value (undefined) to window — so
 * without the accessor the Options pref buttons rendered e.g. "Fancy
 * graphicsundefined". Get/set keeps both the engine's writes and the menu
 * modules' reads on one shared state. */
Object.defineProperty(window, 'ON', {get(){return ON;}, set(v: any){ON=v;}});
Object.defineProperty(window, 'OFF', {get(){return OFF;}, set(v: any){OFF=v;}});
/* CC3: bridge the Music object the same way — the engine assigns it inside
 * Game.Launch (after the by-value Object.assign above), and menu.ts's
 * setVolumeMusic / the jukebox read it through window. */
Object.defineProperty(window, 'Music', {get(){return Music;}, set(v: any){Music=v;}});

/* CC3: explicit module marker — at runtime these files are always ESM modules
 * (Vite bundles them as such), and this keeps their top-level var/function
 * declarations out of the TS global scope. Zero runtime effect. */
export {};
