/**
 * ui/notifications.ts — the engine's notification + prompt systems
 * (Phase 6, slice 3).
 *
 * The 2.048 engine defined these thirteen functions as function
 * expressions inside `Game.Init`; they are now typed exports and the
 * engine keeps the same `Game.X = X` slots at the exact original Init
 * positions, so the modding surface (`Game.Notify`, `Game.Prompt`,
 * `Game.FocusPromptOption`, …) and every call site (keyboard handlers,
 * onclick strings, `new Game.Note(…)`) are unchanged.
 *
 * Slice scope (all closure-free — they read only `Game` and the
 * window-shim globals `l`, `loc`, `LBeautify`, `writeIcon`; no
 * Init-scoped vars):
 *   - `Note` (the note ctor; `this: any` annotated — the engine assigned
 *     it to `Game.Note` contextually, a bare function declaration needs
 *     the explicit `this` under `strict`) / `CloseNote` / `CloseNotes`
 *   - `UpdateNotes` / `NotesLogic` / `NotesDraw`
 *   - `Notify` / `NotifyTooltip`
 *   - `UpdatePrompt` / `Prompt` / `ClosePrompt`
 *   - `ConfirmPrompt` / `FocusPromptOption`
 *
 * Bodies are verbatim (original indentation kept) — only parameter
 * annotations were added. The state the functions operate on
 * (`Game.Notes=[]`, `Game.noteId=0`, `Game.noteL=…`, `Game.promptOn=0`,
 * …) stays in the engine's Init, exactly where it was.
 *
 * `replaceAll` / `FireEvent` are imported (they live in the utils layer,
 * not on the window shim); `Game`, `l`, `loc`, `LBeautify`, `writeIcon`
 * resolve through src/globals.d.ts to the engine's window shim.
 */

import { replaceAll } from '../utils/helpers';
import { FireEvent } from '../utils/dom';


/* GameSurface types Game.tooltip as `{ hide(): void; shouldHide?: boolean }`, but at runtime the
 * engine initializes it with the full tooltip surface (main.ts: Game.tooltip={text:'',…,from:0})
 * and sets .from to the hovered element, so CloseNote reads it through this shape. */
type Tooltip = { hide(): void; from?: { id: string } };

export function Note(this: any, title: any,desc: any,pic: any,quick: any)
		{
			this.title=title;
			this.desc=desc||'';
			this.pic=pic||'';
			this.id=Game.noteId;
			this.date=Date.now();
			this.quick=quick||0;
			this.life=(this.quick||1)*Game.fps;
			this.l=0;
			this.height=0;
			this.tooltip=0;
			Game.noteId++;
			Game.NotesById[this.id]=this;
			Game.Notes.unshift(this);
			if (Game.Notes.length>50) Game.Notes.pop();
			//Game.Notes.push(this);
			//if (Game.Notes.length>50) Game.Notes.shift();
			Game.UpdateNotes();
		}

export function CloseNote(id: any)
		{
			var me=Game.NotesById[id];
			var tooltip: Tooltip=Game.tooltip as unknown as Tooltip;
			if (tooltip.from && tooltip.from.id.indexOf('note-')==0) tooltip.hide();
			Game.Notes.splice(Game.Notes.indexOf(me),1);
			//Game.NotesById.splice(Game.NotesById.indexOf(me),1);
			Game.NotesById[id]=null;
			Game.UpdateNotes();
		}

export function CloseNotes()
		{
			Game.Notes=[];
			Game.NotesById=[];
			Game.tooltip.hide();
			Game.UpdateNotes();
		}

export function UpdateNotes()
		{
			var str='';
			var remaining=Game.Notes.length;
			for (var i in Game.Notes)
			{
				if ((i as any)<5)
				{
					var me=Game.Notes[i];
					var pic='';
					if (me.pic!='') pic='<div class="icon" style="'+writeIcon(me.pic)+'"></div>';
					str='<div id="note-'+me.id+'" '+(me.tooltip?Game.getDynamicTooltip(me.tooltip,'this',true)+' ':'')+'class="framed note '+(me.pic!=''?'haspic':'nopic')+' '+(me.desc!=''?'hasdesc':'nodesc')+'"><div class="close" onclick="PlaySound(\'snd/tick.mp3\');Game.CloseNote('+me.id+');">x</div>'+pic+'<div class="text"><h3>'+me.title+'</h3>'+(me.desc!=''?'<div class="line"></div><h5>'+me.desc+'</h5>':'')+'</div></div>'+str;
					remaining--;
				}
			}
			if (remaining>0) str='<div class="remaining">'+loc("+%1 more notification.",LBeautify(remaining))+'</div>'+str;
			if (Game.Notes.length>1)
			{
				str+='<div class="framed close sidenote" onclick="PlaySound(\'snd/tick.mp3\');Game.CloseNotes();">x</div>';
			}
			Game.noteL.innerHTML=str;
			for (var i in Game.Notes)
			{
				me.l=0;
				if ((i as any)<5)
				{
					var me=Game.Notes[i];
					me.l=l('note-'+me.id);
				}
			}
		}

export function NotesLogic()
		{
			for (var i in Game.Notes)
			{
				if (Game.Notes[i].quick>0)
				{
					var me=Game.Notes[i];
					me.life--;
					if (me.life<=0) Game.CloseNote(me.id);
				}
			}
		}

export function NotesDraw()
		{
			for (var i in Game.Notes)
			{
				if (Game.Notes[i].quick>0)
				{
					var me=Game.Notes[i];
					if (me.l)
					{
						if (me.life<10)
						{
							me.l.style.opacity=(me.life/10);
						}
					}
				}
			}
		}

export function Notify(title: any,desc: any,pic: any,quick: any,noLog: any)
		{
			if (Game.prefs.notifs)
			{
				quick=Math.min(6,quick);
				if (!quick) quick=6;
			}
			desc=replaceAll('==CLOSETHIS()==','Game.CloseNote('+Game.noteId+');',desc);
			if (Game.popups) new Game.Note(title,desc,pic,quick);
			if (!noLog) Game.AddToLog('<b>'+title+'</b> | '+desc);
		}

export function NotifyTooltip(content: any)
		{
			//attaches a tooltip to the last spawned note
			if (!Game.NotesById[Game.noteId-1]) return false;
			var me=Game.NotesById[Game.noteId-1];
			me.tooltip=content;
			Game.UpdateNotes();
		}

export function UpdatePrompt()
		{
			if (Game.promptUpdateFunc) Game.promptUpdateFunc();
			Game.promptAnchorL.style.top=Math.floor((Game.windowH-Game.promptWrapL.offsetHeight)/2-16)+'px';
		}

export function Prompt(content: any,options: any,updateFunc: any,style: any)
		{
			if (updateFunc) Game.promptUpdateFunc=updateFunc;
			if (style) Game.promptWrapL.className='framed '+style; else Game.promptWrapL.className='framed';
			var str='';
			str+=content;
			if (str.indexOf('<id ')==0)
			{
				var id=str.substring(4,str.indexOf('>'));
				str=str.substring(str.indexOf('>')+1);
				str='<div id="promptContent'+id+'">'+str+'</div>';
			}
			var opts='';
			Game.promptOptionsN=0;
			for (var i=0;i<options.length;i++)
			{
				if (options[i]=='br')//just a linebreak
				{opts+='<br>';}
				else
				{
					if (typeof options[i]=='string') options[i]=[options[i],'PlaySound(\'snd/tickOff.mp3\');Game.ClosePrompt();'];
					else if (!options[i][1]) options[i]=[options[i][0],'PlaySound(\'snd/tickOff.mp3\');Game.ClosePrompt();',options[i][2]];
					else options[i][1]='PlaySound(\'snd/tick.mp3\');'+options[i][1];
					options[i][1]=options[i][1].replace(/'/g,'&#39;').replace(/"/g,'&#34;');
					opts+='<a id="promptOption'+i+'" class="option" '+(options[i][2]?'style="'+options[i][2]+'" ':'')+''+Game.clickStr+'="'+options[i][1]+'">'+options[i][0]+'</a>';
					Game.promptOptionsN++;
				}
			}
			Game.promptL.innerHTML=str+'<div class="optionBox">'+opts+'</div>';
			Game.promptAnchorL.style.display='block';
			Game.darkenL.style.display='block';
			Game.promptL.focus();
			Game.promptOn=1;
			Game.promptOptionFocus=0;
			Game.FocusPromptOption(0);
			Game.UpdatePrompt();
		}

export function ClosePrompt()
		{
			if (!Game.promptOn) return false;
			Game.promptAnchorL.style.display='none';
			Game.darkenL.style.display='none';
			Game.promptOn=0;
			Game.promptUpdateFunc=0;
			Game.promptOptionFocus=0;
			Game.promptOptionsN=0;
		}

export function ConfirmPrompt()
		{
			if (Game.promptOn && l('promptOption'+Game.promptOptionFocus) && l('promptOption'+Game.promptOptionFocus).style.display!='none') FireEvent(l('promptOption'+Game.promptOptionFocus),'click');
		}

export function FocusPromptOption(dir: any,tryN: any)
		{
			var id=Game.promptOptionFocus+dir;
			if (id<0) id=Game.promptOptionsN-1;
			if (id>=Game.promptOptionsN) id=0;
			while (id>=0 && id<Game.promptOptionsN && (!l('promptOption'+id) || l('promptOption'+id).style.display=='none'))
			{id+=(dir||1);}
			if (l('promptOption'+id) && l('promptOption'+id).style.display!='none')
			{
				if (l('promptOption'+Game.promptOptionFocus)) l('promptOption'+Game.promptOptionFocus).classList.remove('focused');
				Game.promptOptionFocus=id;
				if (l('promptOption'+Game.promptOptionFocus)) l('promptOption'+Game.promptOptionFocus).classList.add('focused');
			}
			else if (!tryN && dir!=0) {Game.promptOptionFocus=id;Game.FocusPromptOption(dir,1);}
		}
