/**
 * systems/save.ts — the engine's save system (Phase 4, slice 2: write side).
 *
 * The 2.048 engine defined these functions as function expressions inside
 * `Game.Init`; they are now typed exports and the engine keeps the same
 * `Game.X = X` slots at the exact original Init positions, so the modding
 * surface (`Game.WriteSave`, …) and every call site are unchanged.
 *
 * Slice scope (all closure-free over Init vars — they read only `Game` and
 * window-shim globals):
 *   - `ExportSave` / `ImportSave` / `ImportSaveCode` (engine ~2580–2599)
 *   - `FileSave` / `FileLoad` (engine ~2601–2621)
 *   - `WriteSave` (engine ~2629–2856)
 *
 * **Save-format compatibility is byte-for-byte against master**: the
 * WriteSave body is verbatim (original indentation kept) — only parameter
 * annotations were added. `var toCompress` is declared `any` because it is
 * reassigned from `[]` to pack3's return, exactly as the original widened it.
 *
 * Slice 3 adds the load side: `salvageSave` and `LoadSave` (engine
 * ~2599–3162), same rules — verbatim bodies, same Game slots.
 *
 * No runtime imports: `Game`, `App`, `l`, `loc`, `utf8_to_b64`, `pack3`,
 * `localStorageGet/Set`, `saveAs` resolve through src/globals.d.ts to the
 * engine's window shim.
 */

export function ExportSave()
		{
			//if (App) return false;
			Game.prefs.showBackupWarning=0;
			Game.Prompt('<id ExportSave><h3>'+loc("Export save")+'</h3><div class="block">'+loc("This is your save code.<br>Copy it and keep it somewhere safe!")+'</div><div class="block"><textarea id="textareaPrompt" style="width:100%;height:128px;" readonly>'+Game.WriteSave(1)+'</textarea></div>',[loc("All done!")]);//prompt('Copy this text and keep it somewhere safe!',Game.WriteSave(1));
			l('textareaPrompt').focus();l('textareaPrompt').select();
		}
export function ImportSave(def?: any)
		{
			//if (App) return false;
		Game.Prompt('<id ImportSave><h3>'+loc("Import save")+'</h3><div class="block">'+loc("Please paste in the code that was given to you on save export.")+'<div id="importError" class="warning" style="font-weight:bold;font-size:11px;"></div></div><div class="block"><textarea id="textareaPrompt" style="width:100%;height:128px;">'+(def||'')+'</textarea></div>',[[loc("Load"),'if (l(\'textareaPrompt\').value.length==0){return false;}if (Game.ImportSaveCode(l(\'textareaPrompt\').value)){Game.ClosePrompt();}else{l(\'importError\').innerHTML=\'(\'+loc("Error importing save")+\')\';}'],loc("Nevermind")]);//prompt('Please paste in the text that was given to you on save export.','');
			l('textareaPrompt').focus();
		}
export function ImportSaveCode(save: any)
		{
			var out=false;
			if (save && save!='') out=Game.LoadSave(save);
			if (out && App && App.onImportSave) App.onImportSave(out,save);
			return out;
		}

export function FileSave()
		{
			if (App) return false;
			Game.prefs.showBackupWarning=0;
			var filename=Game.bakeryName.replace(/[^a-zA-Z0-9]+/g,'')+'Bakery';
			var text=Game.WriteSave(1);
			var blob=new Blob([text],{type:'text/plain;charset=utf-8'});
			saveAs(blob,filename+'.txt');
		}
export function FileLoad(e: any)
		{
			if (App) return false;
			if (e.target.files.length==0) return false;
			var file=e.target.files[0];
			var reader=new FileReader();
			reader.onload=function(e: any)//CC3 rewrite: `any` param — the original read e.target.result unguarded
			{
				Game.ImportSaveCode(e.target.result);
			}
			reader.readAsText(file);
		}


export function WriteSave(type?: number)
		{
			Game.toSave=false;
			//type: none is default, 1=return string only, 2=return uncompressed string, 3=return uncompressed, commented string
			Game.lastDate=parseInt(Game.time);
			var str='';
			if (type==3) str+='\nGame version\n';
			str+=Game.version+'|';
			str+='|';//just in case we need some more stuff here
			if (type==3) str+='\n\nRun details';
			str+=//save stats
			(type==3?'\n	run start date : ':'')+parseInt(Game.startDate)+';'+
			(type==3?'\n	legacy start date : ':'')+parseInt(Game.fullDate)+';'+
			(type==3?'\n	date when we last opened the game : ':'')+parseInt(Game.lastDate)+';'+
			(type==3?'\n	bakery name : ':'')+(Game.bakeryName)+';'+
			(type==3?'\n	seed : ':'')+(Game.seed)+
			'|';
			if (type==3) str+='\n\nPacked preferences bitfield\n	';
			var str2=//prefs
			(Game.prefs.particles?'1':'0')+
			(Game.prefs.numbers?'1':'0')+
			(Game.prefs.autosave?'1':'0')+
			(Game.prefs.autoupdate?'1':'0')+
			(Game.prefs.milk?'1':'0')+
			(Game.prefs.fancy?'1':'0')+
			(Game.prefs.warn?'1':'0')+
			(Game.prefs.cursors?'1':'0')+
			(Game.prefs.focus?'1':'0')+
			(Game.prefs.format?'1':'0')+
			(Game.prefs.notifs?'1':'0')+
			(Game.prefs.wobbly?'1':'0')+
			(Game.prefs.monospace?'1':'0')+
			(Game.prefs.filters?'1':'0')+
			(Game.prefs.cookiesound?'1':'0')+
			(Game.prefs.crates?'1':'0')+
			(Game.prefs.showBackupWarning?'1':'0')+
			(Game.prefs.extraButtons?'1':'0')+
			(Game.prefs.askLumps?'1':'0')+
			(Game.prefs.customGrandmas?'1':'0')+
			(Game.prefs.timeout?'1':'0')+
			(Game.prefs.cloudSave?'1':'0')+
			(Game.prefs.bgMusic?'1':'0')+
			(Game.prefs.notScary?'1':'0')+
			(Game.prefs.fullscreen?'1':'0')+
			(Game.prefs.screenreader?'1':'0')+
			(Game.prefs.discordPresence?'1':'0')+
			'';
			str2=pack3(str2);
			str+=str2+'|';
			if (type==3) str+='\n\nMisc game data';
			str+=
			(type==3?'\n	cookies : ':'')+parseFloat(Game.cookies).toString()+';'+
			(type==3?'\n	total cookies earned : ':'')+parseFloat(Game.cookiesEarned).toString()+';'+
			(type==3?'\n	cookie clicks : ':'')+parseInt(Math.floor(Game.cookieClicks))+';'+
			(type==3?'\n	golden cookie clicks : ':'')+parseInt(Math.floor(Game.goldenClicks))+';'+
			(type==3?'\n	cookies made by clicking : ':'')+parseFloat(Game.handmadeCookies).toString()+';'+
			(type==3?'\n	golden cookies missed : ':'')+parseInt(Math.floor(Game.missedGoldenClicks))+';'+
			(type==3?'\n	background type : ':'')+parseInt(Math.floor(Game.bgType))+';'+
			(type==3?'\n	milk type : ':'')+parseInt(Math.floor(Game.milkType))+';'+
			(type==3?'\n	cookies from past runs : ':'')+parseFloat(Game.cookiesReset).toString()+';'+
			(type==3?'\n	elder wrath : ':'')+parseInt(Math.floor(Game.elderWrath))+';'+
			(type==3?'\n	pledges : ':'')+parseInt(Math.floor(Game.pledges))+';'+
			(type==3?'\n	pledge time left : ':'')+parseInt(Math.floor(Game.pledgeT))+';'+
			(type==3?'\n	currently researching : ':'')+parseInt(Math.floor(Game.nextResearch))+';'+
			(type==3?'\n	research time left : ':'')+parseInt(Math.floor(Game.researchT))+';'+
			(type==3?'\n	ascensions : ':'')+parseInt(Math.floor(Game.resets))+';'+
			(type==3?'\n	golden cookie clicks (this run) : ':'')+parseInt(Math.floor(Game.goldenClicksLocal))+';'+
			(type==3?'\n	cookies sucked by wrinklers : ':'')+parseFloat(Game.cookiesSucked).toString()+';'+
			(type==3?'\n	wrinkles popped : ':'')+parseInt(Math.floor(Game.wrinklersPopped))+';'+
			(type==3?'\n	santa level : ':'')+parseInt(Math.floor(Game.santaLevel))+';'+
			(type==3?'\n	reindeer clicked : ':'')+parseInt(Math.floor(Game.reindeerClicked))+';'+
			(type==3?'\n	season time left : ':'')+parseInt(Math.floor(Game.seasonT))+';'+
			(type==3?'\n	season switcher uses : ':'')+parseInt(Math.floor(Game.seasonUses))+';'+
			(type==3?'\n	current season : ':'')+(Game.season?Game.season:'')+';';
			var wrinklers=Game.SaveWrinklers();
			str+=
			(type==3?'\n	amount of cookies contained in wrinklers : ':'')+parseFloat(Math.floor(wrinklers.amount))+';'+
			(type==3?'\n	number of wrinklers : ':'')+parseInt(Math.floor(wrinklers.number))+';'+
			(type==3?'\n	prestige level : ':'')+parseFloat(Game.prestige).toString()+';'+
			(type==3?'\n	heavenly chips : ':'')+parseFloat(Game.heavenlyChips).toString()+';'+
			(type==3?'\n	heavenly chips spent : ':'')+parseFloat(Game.heavenlyChipsSpent).toString()+';'+
			(type==3?'\n	heavenly cookies : ':'')+parseFloat(Game.heavenlyCookies).toString()+';'+
			(type==3?'\n	ascension mode : ':'')+parseInt(Math.floor(Game.ascensionMode))+';'+
			(type==3?'\n	permanent upgrades : ':'')+parseInt(Math.floor(Game.permanentUpgrades[0]))+';'+parseInt(Math.floor(Game.permanentUpgrades[1]))+';'+parseInt(Math.floor(Game.permanentUpgrades[2]))+';'+parseInt(Math.floor(Game.permanentUpgrades[3]))+';'+parseInt(Math.floor(Game.permanentUpgrades[4]))+';'+
			(type==3?'\n	dragon level : ':'')+parseInt(Math.floor(Game.dragonLevel))+';'+
			(type==3?'\n	dragon aura : ':'')+parseInt(Math.floor(Game.dragonAura))+';'+
			(type==3?'\n	dragon aura 2 : ':'')+parseInt(Math.floor(Game.dragonAura2))+';'+
			(type==3?'\n	chime type : ':'')+parseInt(Math.floor(Game.chimeType))+';'+
			(type==3?'\n	volume : ':'')+parseInt(Math.floor(Game.volume))+';'+
			(type==3?'\n	number of shiny wrinklers : ':'')+parseInt(Math.floor(wrinklers.shinies))+';'+
			(type==3?'\n	amount of cookies contained in shiny wrinklers : ':'')+parseFloat(Math.floor(wrinklers.amountShinies))+';'+
			(type==3?'\n	current amount of sugar lumps : ':'')+parseFloat(Math.floor(Game.lumps))+';'+
			(type==3?'\n	total amount of sugar lumps made : ':'')+parseFloat(Math.floor(Game.lumpsTotal))+';'+
			(type==3?'\n	time when current sugar lump started : ':'')+parseFloat(Math.floor(Game.lumpT))+';'+
			(type==3?'\n	time when last refilled a minigame with a sugar lump : ':'')+parseFloat(Math.floor(Game.lumpRefill))+';'+
			(type==3?'\n	sugar lump type : ':'')+parseInt(Math.floor(Game.lumpCurrentType))+';'+
			(type==3?'\n	vault : ':'')+Game.vault.join(',')+';'+
			(type==3?'\n	heralds : ':'')+parseInt(Game.heralds)+';'+
			(type==3?'\n	golden cookie fortune : ':'')+parseInt(Game.fortuneGC)+';'+
			(type==3?'\n	CpS fortune : ':'')+parseInt(Game.fortuneCPS)+';'+
			(type==3?'\n	highest raw CpS : ':'')+parseFloat(Game.cookiesPsRawHighest)+';'+
			(type==3?'\n	music volume : ':'')+parseInt(Math.floor(Game.volumeMusic))+';'+
			
			'|';//cookies and lots of other stuff
			
			if (type==3) str+='\n\nBuildings : amount, bought, cookies produced, level, minigame data';
			for (var i in Game.Objects)//buildings
			{
				//CC3 rewrite: `any` annotation — same-scope `var me` is reused across the four loops below with different container types
				var me:any=Game.Objects[i];
				if (type==3) str+='\n	'+me.name+' : ';
				if (me.vanilla)
				{
					str+=me.amount+','+me.bought+','+parseFloat(Math.floor(me.totalCookies))+','+parseInt(me.level);
					if (Game.isMinigameReady(me)) str+=','+me.minigame.save(); else str+=','+(me.minigameSave||'');
					str+=','+(me.muted?'1':'0');
					str+=','+me.highest;
					str+=';';
				}
			}
			str+='|';
			if (type==3) str+='\n\nPacked upgrades bitfield (unlocked and bought)\n	';
			var toCompress:any=[];
			for (var i in Game.UpgradesById)//upgrades
			{
				var me:any=Game.UpgradesById[i];
				if (me.vanilla) toCompress.push(Math.min(me.unlocked,1),Math.min(me.bought,1));
			};
			
			toCompress=pack3(toCompress.join(''));//toCompress=pack(toCompress);//CompressLargeBin(toCompress);
			
			str+=toCompress;
			str+='|';
			if (type==3) str+='\n\nPacked achievements bitfield (won)\n	';
			toCompress=[];
			for (var i in Game.AchievementsById)//achievements
			{
				var me:any=Game.AchievementsById[i];
				if (me.vanilla) toCompress.push(Math.min(me.won));
			}
			toCompress=pack3(toCompress.join(''));//toCompress=pack(toCompress);//CompressLargeBin(toCompress);
			str+=toCompress;
			
			str+='|';
			if (type==3) str+='\n\nBuffs : type, maxTime, time, arg1, arg2, arg3';
			for (var i in Game.buffs)
			{
				var me:any=Game.buffs[i];
				if (me.type)
				{
					if (type==3) str+='\n	'+me.type.name+' : ';
					if (me.type.vanilla)
					{
						str+=me.type.id+','+me.maxTime+','+me.time;
						if (typeof me.arg1!=='undefined') str+=','+parseFloat(me.arg1);
						if (typeof me.arg2!=='undefined') str+=','+parseFloat(me.arg2);
						if (typeof me.arg3!=='undefined') str+=','+parseFloat(me.arg3);
						str+=';';
					}
				}
			}
			
			
			if (type==3) str+='\n\nCustom :\n';
			
			str+='|';
			str+=Game.saveModData();
			
			Game.lastSaveData=str;
			
			if (type==2 || type==3)
			{
				return str;
			}
			else if (type==1)
			{
				str=escape(utf8_to_b64(str)+'!END!');
				return str;
			}
			else
			{
				if (Game.useLocalStorage)
				{
					//so we used to save the game using browser cookies, which was just really neat considering the game's name
					//we're using localstorage now, which is more efficient but not as cool
					//a moment of silence for our fallen puns
					str=utf8_to_b64(str)+'!END!';
					if (str.length<10)
					{
						Game.Notify('Saving failed!','Purchasing an upgrade and saving again might fix this.<br>This really shouldn\'t happen; please notify Orteil on his tumblr.');
					}
					else
					{
						str=escape(str);
						localStorageSet(Game.SaveTo,str);//aaand save
						if (App) App.save(str);
						if (!localStorageGet(Game.SaveTo))
						{
							Game.Notify(loc("Error while saving"),loc("Export your save instead!"));
						}
						else if (document.hasFocus())
						{
							Game.Notify(loc("Game saved"),'','',1,1);
						}
					}
				}
				else//legacy system
				{
					//that's right
					//we're using cookies
					//yeah I went there
					var now=new Date();//we storin dis for 5 years, people
					now.setFullYear(now.getFullYear()+5);//mmh stale cookies
					str=utf8_to_b64(str)+'!END!';
					Game.saveData=escape(str);
					str=Game.SaveTo+'='+escape(str)+'; expires='+now.toUTCString()+';';
					document.cookie=str;//aaand save
					if (App) App.save(str);
					if (document.cookie.indexOf(Game.SaveTo)<0)
					{
						Game.Notify(loc("Error while saving"),loc("Export your save instead!"),'',0,1);
					}
					else if (document.hasFocus())
					{
						Game.Notify(loc("Game saved"),'','',1,1);
					}
				}
			}
		}

export function salvageSave()
		{
			//for when Cookie Clicker won't load and you need your save
			console.log('===================================================');
			console.log('This is your save data. Copypaste it (without quotation marks) into another version using the "Import save" feature.');
			console.log(localStorageGet(Game.SaveTo));
		}
export function LoadSave(data?: any,ignoreVersionIssues?: any)
		{
			var str:any='';//CC3 rewrite: `any` annotation — reassigned from the save string to its split('|') arrays
			if (typeof data!=='undefined') str=unescape(data);
			else
			{
				if (App)
				{
					App.getMostRecentSave(function(data: any){Game.LoadSave(data,true);});
					return false;
				}
				if (Game.useLocalStorage)
				{
					var local:any=localStorageGet(Game.SaveTo);
					if (!local)//no localstorage save found? let's get the cookie one last time
					{
						if (document.cookie.indexOf(Game.SaveTo)>=0)
						{
							str=unescape(document.cookie.split(Game.SaveTo+'=')[1]);
							document.cookie=Game.SaveTo+'=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
						}
						else return false;
					}
					else
					{
						str=unescape(local);
					}
				}
				else//legacy system
				{
					if (document.cookie.indexOf(Game.SaveTo)>=0) str=unescape(document.cookie.split(Game.SaveTo+'=')[1]);//get cookie here
					else return false;
				}
			}
			if (str!='')
			{
				var version=0;
				var oldstr=str.split('|');
				if (oldstr[0].length<1) return false;
				else
				{
					str=str.split('!END!')[0];
					str=b64_to_utf8(str);
				}
				if (str=='') return false;
				else
				{
					var spl:any='';
					str=str.split('|');
					version=parseFloat(str[0]);
					Game.loadedFromVersion=version;
					
					if (isNaN(version) || str.length<5)
					{
						Game.Notify(loc("Error importing save"),loc("Oops, looks like the import string is all wrong!"),'',6,1);
						return false;
					}
					if (version>=1 && version>Game.version)
					{
						if (ignoreVersionIssues) Game.Notify('Retrieving save from a future version.','That\'s...odd.','',0,1);
						else
						{
							Game.Notify(loc("Error importing save"),loc("You are attempting to load a save from a future version (v. %1; you are using v. %2).",[version,Game.version]),'',6,1);
							return false;
						}
					}
					if (version>=1)
					{
						Game.T=0;
						
						spl=str[2].split(';');//save stats
						Game.startDate=parseInt(spl[0]);
						Game.fullDate=parseInt(spl[1]);
						Game.lastDate=parseInt(spl[2]);
						var bakeryName=(spl[3]?spl[3]:Game.GetBakeryName());
						Game.seed=spl[4]?spl[4]:Game.makeSeed();
						//prefs
						if (version<1.0503) spl=str[3].split('');
						else if (version<2.0046) spl=unpack2(str[3]).split('');
						else spl=(str[3]).split('');
						Game.prefs.particles=parseInt(spl[0]);
						Game.prefs.numbers=parseInt(spl[1]);
						Game.prefs.autosave=parseInt(spl[2]);
						Game.prefs.autoupdate=spl[3]?parseInt(spl[3]):1;
						Game.prefs.milk=spl[4]?parseInt(spl[4]):1;
						Game.prefs.fancy=parseInt(spl[5]);if (Game.prefs.fancy) Game.removeClass('noFancy'); else if (!Game.prefs.fancy) Game.addClass('noFancy');
						Game.prefs.warn=spl[6]?parseInt(spl[6]):0;
						Game.prefs.cursors=spl[7]?parseInt(spl[7]):0;
						Game.prefs.focus=spl[8]?parseInt(spl[8]):0;
						Game.prefs.format=spl[9]?parseInt(spl[9]):0;
						Game.prefs.notifs=spl[10]?parseInt(spl[10]):0;
						Game.prefs.wobbly=spl[11]?parseInt(spl[11]):0;
						Game.prefs.monospace=spl[12]?parseInt(spl[12]):0;
						Game.prefs.filters=spl[13]?parseInt(spl[13]):1;if (Game.prefs.filters) Game.removeClass('noFilters'); else if (!Game.prefs.filters) Game.addClass('noFilters');
						Game.prefs.cookiesound=spl[14]?parseInt(spl[14]):1;
						Game.prefs.crates=spl[15]?parseInt(spl[15]):0;
						Game.prefs.showBackupWarning=spl[16]?parseInt(spl[16]):1;
						Game.prefs.extraButtons=spl[17]?parseInt(spl[17]):1;if (!Game.prefs.extraButtons) Game.removeClass('extraButtons'); else if (Game.prefs.extraButtons) Game.addClass('extraButtons');
						Game.prefs.askLumps=spl[18]?parseInt(spl[18]):0;
						Game.prefs.customGrandmas=spl[19]?parseInt(spl[19]):1;
						Game.prefs.timeout=spl[20]?parseInt(spl[20]):0;
						Game.prefs.cloudSave=spl[21]?parseInt(spl[21]):1;
						Game.prefs.bgMusic=spl[22]?parseInt(spl[22]):1;
						Game.prefs.notScary=spl[23]?parseInt(spl[23]):0;
						Game.prefs.fullscreen=spl[24]?parseInt(spl[24]):0;if (App) App.setFullscreen(Game.prefs.fullscreen);
						Game.prefs.screenreader=spl[25]?parseInt(spl[25]):0;
						Game.prefs.discordPresence=spl[26]?parseInt(spl[26]):1;
						BeautifyAll();
						spl=str[4].split(';');//cookies and lots of other stuff
						Game.cookies=parseFloat(spl[0]);
						Game.cookiesEarned=parseFloat(spl[1]);
						Game.cookieClicks=spl[2]?parseInt(spl[2]):0;
						Game.goldenClicks=spl[3]?parseInt(spl[3]):0;
						Game.handmadeCookies=spl[4]?parseFloat(spl[4]):0;
						Game.missedGoldenClicks=spl[5]?parseInt(spl[5]):0;
						Game.bgType=spl[6]?parseInt(spl[6]):0;
						Game.milkType=spl[7]?parseInt(spl[7]):0;
						Game.cookiesReset=spl[8]?parseFloat(spl[8]):0;
						Game.elderWrath=spl[9]?parseInt(spl[9]):0;
						Game.pledges=spl[10]?parseInt(spl[10]):0;
						Game.pledgeT=spl[11]?parseInt(spl[11]):0;
						Game.nextResearch=spl[12]?parseInt(spl[12]):0;
						Game.researchT=spl[13]?parseInt(spl[13]):0;
						Game.resets=spl[14]?parseInt(spl[14]):0;
						Game.goldenClicksLocal=spl[15]?parseInt(spl[15]):0;
						Game.cookiesSucked=spl[16]?parseFloat(spl[16]):0;
						Game.wrinklersPopped=spl[17]?parseInt(spl[17]):0;
						Game.santaLevel=spl[18]?parseInt(spl[18]):0;
						Game.reindeerClicked=spl[19]?parseInt(spl[19]):0;
						Game.seasonT=spl[20]?parseInt(spl[20]):0;
						Game.seasonUses=spl[21]?parseInt(spl[21]):0;
						Game.season=spl[22]?spl[22]:Game.baseSeason;
						var wrinklers:any={amount:spl[23]?parseFloat(spl[23]):0,number:spl[24]?parseInt(spl[24]):0};
						Game.prestige=spl[25]?parseFloat(spl[25]):0;
						Game.heavenlyChips=spl[26]?parseFloat(spl[26]):0;
						Game.heavenlyChipsSpent=spl[27]?parseFloat(spl[27]):0;
						Game.heavenlyCookies=spl[28]?parseFloat(spl[28]):0;
						Game.ascensionMode=spl[29]?parseInt(spl[29]):0;
						Game.permanentUpgrades[0]=spl[30]?parseInt(spl[30]):-1;Game.permanentUpgrades[1]=spl[31]?parseInt(spl[31]):-1;Game.permanentUpgrades[2]=spl[32]?parseInt(spl[32]):-1;Game.permanentUpgrades[3]=spl[33]?parseInt(spl[33]):-1;Game.permanentUpgrades[4]=spl[34]?parseInt(spl[34]):-1;
						//if (version<1.05) {Game.heavenlyChipsEarned=Game.HowMuchPrestige(Game.cookiesReset);Game.heavenlyChips=Game.heavenlyChipsEarned;}
						Game.dragonLevel=spl[35]?parseInt(spl[35]):0;
						if (version<2.0041 && Game.dragonLevel==Game.dragonLevels.length-2) {Game.dragonLevel=Game.dragonLevels.length-1;}
						Game.dragonAura=spl[36]?parseInt(spl[36]):0;
						Game.dragonAura2=spl[37]?parseInt(spl[37]):0;
						Game.chimeType=spl[38]?parseInt(spl[38]):0;
						Game.volume=spl[39]?parseInt(spl[39]):75;
						wrinklers.shinies=spl[40]?parseInt(spl[40]):0;
						wrinklers.amountShinies=spl[41]?parseFloat(spl[41]):0;
						Game.lumps=spl[42]?parseFloat(spl[42]):-1;
						Game.lumpsTotal=spl[43]?parseFloat(spl[43]):-1;
						Game.lumpT=spl[44]?parseInt(spl[44]):Date.now();
						Game.lumpRefill=spl[45]?parseInt(spl[45]):0;
						if (version<2.022) Game.lumpRefill=Game.fps*60;
						Game.lumpCurrentType=spl[46]?parseInt(spl[46]):0;
						Game.vault=spl[47]?spl[47].split(','):[];
							for (var i in Game.vault){Game.vault[i]=parseInt(Game.vault[i]);}
						var actualHeralds=Game.heralds;//we store the actual amount of heralds to restore it later; here we used the amount present in the save to compute offline CpS
						Game.heralds=spl[48]?parseFloat(spl[48]):Game.heralds;
						Game.fortuneGC=spl[49]?parseInt(spl[49]):0;
						Game.fortuneCPS=spl[50]?parseInt(spl[50]):0;
						Game.cookiesPsRawHighest=spl[51]?parseFloat(spl[51]):0;
						Game.volumeMusic=spl[52]?parseInt(spl[52]):50;
						
						spl=str[5].split(';');//buildings
						Game.BuildingsOwned=0;
						for (var i in Game.ObjectsById)
						{
							var me:any=Game.ObjectsById[i];
							me.switchMinigame(false);
							me.pics=[];
							if (spl[i])
							{
								var mestr:any=spl[i].toString().split(',');
								me.amount=parseInt(mestr[0]);me.bought=parseInt(mestr[1]);me.totalCookies=parseFloat(mestr[2]);me.level=parseInt(mestr[3]||0);me.highest=(version>=2.024?parseInt(mestr[6]):me.amount);
								if (me.minigame && me.minigameLoaded && me.minigame.reset) {me.minigame.reset(true);me.minigame.load(mestr[4]||'');} else me.minigameSave=(mestr[4]||0);
								me.muted=parseInt(mestr[5])||0;
								Game.BuildingsOwned+=me.amount;
								if (version<2.003) me.level=0;
							}
							else
							{
								me.amount=0;me.unlocked=0;me.bought=0;me.highest=0;me.totalCookies=0;me.level=0;
							}
						}
						
						Game.setVolumeMusic(Game.volumeMusic);
						
						Game.LoadMinigames();
						
						if (version<1.035)//old non-binary algorithm
						{
							spl=str[6].split(';');//upgrades
							Game.UpgradesOwned=0;
							for (var i in Game.UpgradesById)
							{
								var me:any=Game.UpgradesById[i];
								if (spl[i])
								{
									var mestr:any=spl[i].split(',');
									me.unlocked=parseInt(mestr[0]);me.bought=parseInt(mestr[1]);
									if (me.bought && Game.CountsAsUpgradeOwned(me.pool)) Game.UpgradesOwned++;
								}
								else
								{
									me.unlocked=0;me.bought=0;
								}
							}
							if (str[7]) spl=str[7].split(';'); else spl=[];//achievements
							Game.AchievementsOwned=0;
							for (var i in Game.AchievementsById)
							{
								var me:any=Game.AchievementsById[i];
								if (spl[i])
								{
									var mestr:any=spl[i].split(',');
									me.won=parseInt(mestr[0]);
								}
								else
								{
									me.won=0;
								}
								if (me.won && Game.CountsAsAchievementOwned(me.pool)) Game.AchievementsOwned++;
							}
						}
						else if (version<1.0502)//old awful packing system
						{
							if (str[6]) spl=str[6]; else spl=[];//upgrades
							if (version<1.05) spl=UncompressLargeBin(spl);
							else spl=unpack(spl);
							Game.UpgradesOwned=0;
							for (var i in Game.UpgradesById)
							{
								var me:any=Game.UpgradesById[i];
								if (spl[(i as any)*2])
								{
									var mestr:any=[spl[(i as any)*2],spl[(i as any)*2+1]];
									me.unlocked=parseInt(mestr[0]);me.bought=parseInt(mestr[1]);
									if (me.bought && Game.CountsAsUpgradeOwned(me.pool)) Game.UpgradesOwned++;
								}
								else
								{
									me.unlocked=0;me.bought=0;
								}
							}
							if (str[7]) spl=str[7]; else spl=[];//achievements
							if (version<1.05) spl=UncompressLargeBin(spl);
							else spl=unpack(spl);
							Game.AchievementsOwned=0;
							for (var i in Game.AchievementsById)
							{
								var me:any=Game.AchievementsById[i];
								if (spl[i])
								{
									var mestr:any=[spl[i]];
									me.won=parseInt(mestr[0]);
								}
								else
								{
									me.won=0;
								}
								if (me.won && Game.CountsAsAchievementOwned(me.pool)) Game.AchievementsOwned++;
							}
						}
						else
						{
							if (str[6]) spl=str[6]; else spl=[];//upgrades
							if (version<2.0046) spl=unpack2(spl).split('');
							else spl=(spl).split('');
							Game.UpgradesOwned=0;
							for (var i in Game.UpgradesById)
							{
								var me:any=Game.UpgradesById[i];
								if (spl[(i as any)*2])
								{
									var mestr:any=[spl[(i as any)*2],spl[(i as any)*2+1]];
									me.unlocked=parseInt(mestr[0]);me.bought=parseInt(mestr[1]);
									if (me.bought && Game.CountsAsUpgradeOwned(me.pool)) Game.UpgradesOwned++;
								}
								else
								{
									me.unlocked=0;me.bought=0;
								}
							}
							if (str[7]) spl=str[7]; else spl=[];//achievements
							if (version<2.0046) spl=unpack2(spl).split('');
							else spl=(spl).split('');
							Game.AchievementsOwned=0;
							for (var i in Game.AchievementsById)
							{
								var me:any=Game.AchievementsById[i];
								if (spl[i])
								{
									var mestr:any=[spl[i]];
									me.won=parseInt(mestr[0]);
								}
								else
								{
									me.won=0;
								}
								if (me.won && Game.CountsAsAchievementOwned(me.pool)) Game.AchievementsOwned++;
							}
						}
						
						Game.killBuffs();
						var buffsToLoad=[];
						spl=(str[8]||'').split(';');//buffs
						for (var i in spl)
						{
							if (spl[i])
							{
								var mestr:any=spl[i].toString().split(',');
								buffsToLoad.push(mestr);
							}
						}
						
						spl=(str[9]||'').split(';');//mod data
						
						for (var i in spl)
						{
							if (spl[i])
							{
								var data=spl[i].split(':');
								var modId=data[0];
								if (modId=='META') continue;
								data.shift();
								data=Game.safeLoadString(data.join(':'));
								Game.modSaveData[modId]=data;
							}
						}
						
						for (var i in Game.ObjectsById)
						{
							var me:any=Game.ObjectsById[i];
							if (me.buyFunction) me.buyFunction();
							me.refresh();
							if (me.id>0)
							{
								if (me.muted) me.mute(1);
							}
						}
						
						if (version<1.0503)//upgrades that used to be regular, but are now heavenly
						{
							var me:any=Game.Upgrades['Persistent memory'];me.unlocked=0;me.bought=0;
							var me:any=Game.Upgrades['Season switcher'];me.unlocked=0;me.bought=0;
						}
						
						if (Game.bgType==-1) Game.bgType=0;
						if (Game.milkType==-1 || !Game.AllMilks[Game.milkType]) Game.milkType=0;
						
						
						//advance timers
						var framesElapsed=Math.ceil(((Date.now()-Game.lastDate)/1000)*Game.fps);
						if (Game.pledgeT>0) Game.pledgeT=Math.max(Game.pledgeT-framesElapsed,1);
						if (Game.seasonT>0) Game.seasonT=Math.max(Game.seasonT-framesElapsed,1);
						if (Game.researchT>0) Game.researchT=Math.max(Game.researchT-framesElapsed,1);
						
						
						Game.ResetWrinklers();
						Game.LoadWrinklers(wrinklers.amount,wrinklers.number,wrinklers.shinies,wrinklers.amountShinies);
						
						//recompute season trigger prices
						if (Game.Has('Season switcher')) {for (var i in Game.seasons) {Game.Unlock(Game.seasons[i].trigger);}}
						Game.computeSeasonPrices();
						
						//recompute prestige
						Game.prestige=Math.floor(Game.HowMuchPrestige(Game.cookiesReset));
						//if ((Game.heavenlyChips+Game.heavenlyChipsSpent)<Game.prestige)
						//{Game.heavenlyChips=Game.prestige;Game.heavenlyChipsSpent=0;}//chips owned and spent don't add up to total prestige? set chips owned to prestige
						
						Game.bakeryNameSet(bakeryName);
						
						Game.loadModData();
						
						
						if (version==1.037 && Game.beta)//are we opening the new beta? if so, save the old beta to /betadungeons
						{
							window.localStorage.setItem('CookieClickerGameBetaDungeons',window.localStorage.getItem('CookieClickerGameBeta'));
							Game.Notify('Beta save data','Your beta save data has been safely exported to /betadungeons.',20);
						}
						else if (version==1.0501 && Game.beta)//are we opening the newer beta? if so, save the old beta to /oldbeta
						{
							window.localStorage.setItem('CookieClickerGameOld',window.localStorage.getItem('CookieClickerGameBeta'));
							//Game.Notify('Beta save data','Your beta save data has been safely exported to /oldbeta.',20);
						}
						if (version<=1.0466 && !Game.beta)//export the old 2014 version to /v10466
						{
							window.localStorage.setItem('CookieClickerGamev10466',window.localStorage.getItem('CookieClickerGame'));
							//Game.Notify('Beta save data','Your save data has been safely exported to /v10466.',20);
						}
						if (version==1.9)//are we importing from the 1.9 beta? remove all heavenly upgrades and refund heavenly chips
						{
							for (var i in Game.UpgradesById)
							{
								var me:any=Game.UpgradesById[i];
								if (me.bought && me.pool=='prestige')
								{
									me.unlocked=0;
									me.bought=0;
								}
							}
							Game.heavenlyChips=Game.prestige;
							Game.heavenlyChipsSpent=0;
							
							setTimeout(function(){Game.Prompt('<h3>Beta patch</h3><div class="block">We\'ve tweaked some things and fixed some others, please check the update notes!<div class="line"></div>Of note : due to changes in prestige balancing, all your heavenly upgrades have been removed and your heavenly chips refunded; you\'ll be able to reallocate them next time you ascend.<div class="line"></div>Thank you again for beta-testing Cookie Clicker!</div>',[['Alright then!','Game.ClosePrompt();']]);},200);
						}
						if (version<=1.0466)//are we loading from the old live version? reset HCs
						{
							Game.heavenlyChips=Game.prestige;
							Game.heavenlyChipsSpent=0;
						}
						
						if (Game.ascensionMode!=1)
						{
							if (Game.Has('Starter kit')) Game.Objects['Cursor'].free=10;
							if (Game.Has('Starter kitchen')) Game.Objects['Grandma'].free=5;
						}
						
						Game.CalculateGains();
						
						var timeOffline=(Date.now()-Game.lastDate)/1000;
						
						if (Math.random()<1/10000) Game.TOYS=1;//teehee!
						if (Math.random()<1/10000) Game.WINKLERS=1;//squeak
						
						//compute cookies earned while the game was closed
						if (Game.mobile || Game.Has('Perfect idling') || Game.Has('Twin Gates of Transcendence'))
						{
							if (Game.Has('Perfect idling'))
							{
								var maxTime=60*60*24*1000000000;
								var percent=100;
							}
							else
							{
								var maxTime=60*60;
								if (Game.Has('Belphegor')) maxTime*=2;
								if (Game.Has('Mammon')) maxTime*=2;
								if (Game.Has('Abaddon')) maxTime*=2;
								if (Game.Has('Satan')) maxTime*=2;
								if (Game.Has('Asmodeus')) maxTime*=2;
								if (Game.Has('Beelzebub')) maxTime*=2;
								if (Game.Has('Lucifer')) maxTime*=2;
								
								var percent=5;
								if (Game.Has('Angels')) percent+=10;
								if (Game.Has('Archangels')) percent+=10;
								if (Game.Has('Virtues')) percent+=10;
								if (Game.Has('Dominions')) percent+=10;
								if (Game.Has('Cherubim')) percent+=10;
								if (Game.Has('Seraphim')) percent+=10;
								if (Game.Has('God')) percent+=10;
								
								if (Game.Has('Chimera')) {maxTime+=60*60*24*2;percent+=5;}
								
								if (Game.Has('Fern tea')) percent+=3;
								if (Game.Has('Ichor syrup')) percent+=7;
								if (Game.Has('Fortune #102')) percent+=1;
							}
							
							var timeOfflineOptimal=Math.min(timeOffline,maxTime);
							var timeOfflineReduced=Math.max(0,timeOffline-timeOfflineOptimal);
							var amount=(timeOfflineOptimal+timeOfflineReduced*0.1)*Game.cookiesPs*(percent/100);
							
							if (amount>0)
							{
								Game.Notify(loc("Welcome back!"),loc("You earned <b>%1</b> while you were away.",loc("%1 cookie",LBeautify(amount)))+(EN?('<br>('+Game.sayTime(timeOfflineOptimal*Game.fps,-1)+' at '+Math.floor(percent)+'% CpS'+(timeOfflineReduced?', plus '+Game.sayTime(timeOfflineReduced*Game.fps,-1)+' at '+(Math.floor(percent*10)/100)+'%':'')+'.)'):''),[Math.floor(Math.random()*16),11]);
								Game.Earn(amount);
							}
						}
						
						//we load buffs after everything as we do not want them to interfer with offline CpS
						for (var i in buffsToLoad)
						{
							var mestr:any=buffsToLoad[i];
							var type=Game.buffTypes[parseInt(mestr[0])];
							Game.gainBuff(type.name,parseFloat(mestr[1])/Game.fps,parseFloat(mestr[3]||0),parseFloat(mestr[4]||0),parseFloat(mestr[5]||0)).time=parseFloat(mestr[2]);
						}
						
						
						Game.loadLumps(timeOffline);
			
						Game.bakeryNameRefresh();
						
					}
					else//importing old version save
					{
						Game.Notify(loc("Error importing save"),loc("Sorry, you can't import saves from the classic version."),'',6,1);
						return false;
					}
					
					if (Game.prefs.screenreader)
					{
						Game.BuildStore();
					}
					
					Game.RebuildUpgrades();
					
					Game.TickerAge=0;
					Game.TickerEffect=0;
					
					Game.elderWrathD=0;
					Game.recalculateGains=1;
					Game.storeToRefresh=1;
					Game.upgradesToRebuild=1;
					
					Game.buyBulk=1;Game.buyMode=1;Game.storeBulkButton(-1);
					
					
					Game.specialTab='';
					Game.ToggleSpecialMenu(0);
					
					Game.killShimmers();
					
					if (Game.T>Game.fps*5 && Game.ReincarnateTimer==0)//fade out of black and pop the cookie
					{
						Game.ReincarnateTimer=1;
						Game.addClass('reincarnating');
						Game.BigCookieSize=0;
					}
					
					
					var prestigeUpgradesOwned=0;
					for (var i in Game.Upgrades)
					{
						if (Game.Upgrades[i].bought && Game.Upgrades[i].pool=='prestige') prestigeUpgradesOwned++;
					}
					if (prestigeUpgradesOwned>=100) Game.Win('All the stars in heaven');
					
					
					if (version<Game.version) l('logButton').classList.add('hasUpdate');
					
					if (Game.season!='' && Game.season==Game.baseSeason)
					{
						if (Game.season=='valentines') Game.Notify(loc("Valentine's Day!"),loc("It's <b>Valentine's season</b>!<br>Love's in the air and cookies are just that much sweeter!"),[20,3],60*3);
						else if (Game.season=='fools') Game.Notify(loc("Business Day!"),loc("It's <b>Business season</b>!<br>Don't panic! Things are gonna be looking a little more corporate for a few days."),[17,6],60*3);
						else if (Game.season=='halloween') Game.Notify(loc("Halloween!"),loc("It's <b>Halloween season</b>!<br>Everything is just a little bit spookier!"),[13,8],60*3);
						else if (Game.season=='christmas') Game.Notify(loc("Christmas time!"),loc("It's <b>Christmas season</b>!<br>Bring good cheer to all and you just may get cookies in your stockings!"),[12,10],60*3);
						else if (Game.season=='easter') Game.Notify(loc("Easter!"),loc("It's <b>Easter season</b>!<br>Keep an eye out and you just might click a rabbit or two!"),[0,12],60*3);
					}
					
					Game.heralds=actualHeralds;
					
					Game.Notify(loc("Game loaded"),'','',1,1);
					
					if (!App && Game.prefs.showBackupWarning==1) Game.showBackupWarning();
					
					if (App) App.justLoadedSave();
				}
			}
			else return false;
			return true;
		}
		
		/*=====================================================================================
		RESET
		=======================================================================================*/
