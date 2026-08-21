/**
 * systems/buffs.ts — the engine's buff system (Phase 6, slice 3).
 *
 * The 2.048 engine defined the buff lifecycle functions (`gainBuff`,
 * `hasBuff`, `updateBuffs`, `killBuff`, `killBuffs`), the `buffType`
 * archetype ctor, the archetype registry (`buffTypes` / `buffTypesByName` /
 * `buffTypesN`), and the 26 vanilla buff declarations inside `Game.Init`.
 * They are now typed exports; the engine keeps the same `Game.X = X` slots
 * at the exact original Init positions, so every `Game.gainBuff(…)` call
 * site (golden-cookie chain, grimoire, market, ascend, content/upgrades)
 * and every `new Game.buffType(…)` mod call is unchanged.
 *
 * The registry arrays are module-owned and republished onto `Game`
 * (`Game.buffTypes` / `Game.buffTypesByName`) from Init, so the save
 * loader's `Game.buffTypes[id]` lookups behave exactly as before. The
 * archetype ctor still stamps `this.vanilla=Game.vanilla` — which is why
 * the 26 declarations run via `declareVanillaBuffs()` at the original
 * Init position (after `Game.vanilla=1`): buff save/load is keyed on
 * `type.vanilla`, and mod buffs registered after `Game.vanilla=0` (in
 * `Game.launchMods`) must be stamped 0, exactly as in 2.048.
 *
 * The legacy `Game.buffType` function-ctor became the `BuffType` class —
 * the Phase 4 fidelity decision (legacy ctors become classes, as with
 * `Shimmer`): `new` semantics are identical, and the module re-exports it
 * as `buffType` so the engine's `Game.buffType=buffType` slot keeps its
 * name. Buff objects stay `any`-typed (`var buff: any=…`), matching the
 * 2.048 dynamic shape against the typed `Game.buffs: Record<string, Buff>`
 * surface.
 *
 * Bodies are verbatim (original indentation kept). No runtime imports:
 * `Game`, `l`, `loc`, `writeIcon`, `EN`, `Beautify`, `LBeautify` resolve
 * through src/globals.d.ts / lib.dom.
 */

/* Archetype registry (was `Game.buffTypes` / `Game.buffTypesByName` /
 * `Game.buffTypesN` in Init; module-owned now, republished on Game from
 * Init so save/load and mods see the same arrays). The ctor keeps the
 * counter live on `Game` (`Game.buffTypesN`) exactly like 2.048's
 * `Game.buffTypesN++`. */
export const buffTypes: any[] = [];
export const buffTypesByName: any = {};
let buffTypesN = 0;

export function gainBuff(type: any,time: any,arg1: any,arg2: any,arg3: any)
{
	type=Game.buffTypesByName[type];
	var obj=type.func(time,arg1,arg2,arg3);
	obj.type=type;
	obj.arg1=arg1;
	obj.arg2=arg2;
	obj.arg3=arg3;
	if (!obj.dname && obj.name!='???') obj.dname=loc(obj.name);
	
	var buff: any={
		visible:true,
		time:0,
		name:'???',
		desc:'',
		icon:[0,0]
	};
	if (Game.buffs[obj.name])//if there is already a buff in effect with this name
	{
		var buff: any=Game.buffs[obj.name];//CC3 rewrite (phase 6, slice 3): original kept the function-scoped `var buff` reassignment (var hoisting) so `return buff` below returns the *existing* buff when one is already active — a shadowing redeclare with the same name, restoring the 2.048 semantics exactly.
		if (obj.max) buff.time=Math.max(obj.time,buff.time);//new duration is max of old and new
		if (obj.add) buff.time+=obj.time;//new duration is old + new
		if (!obj.max && !obj.add) buff.time=obj.time;//new duration is set to new
		buff.maxTime=buff.time;
	}
	else//create new buff
	{
		for (var i in obj)//paste parameters onto buff
		{buff[i]=obj[i];}
		buff.maxTime=buff.time;
		Game.buffs[buff.name]=buff;
		buff.id=Game.buffsI;
		
		//create dom
		Game.buffsL.innerHTML=Game.buffsL.innerHTML+'<div id="buff'+buff.id+'" class="crate enabled buff" '+(buff.desc?Game.getTooltip(
			'<div class="prompt" style="min-width:200px;text-align:center;font-size:11px;margin:8px 0px;" id="tooltipBuff"><h3>'+buff.dname+'</h3><div class="line"></div>'+buff.desc+'</div>'
		,'left',true):'')+' style="opacity:1;float:none;display:block;'+writeIcon(buff.icon)+'"></div>';
		
		buff.l=l('buff'+buff.id);
		
		Game.buffsI++;
	}
	Game.recalculateGains=1;
	Game.storeToRefresh=1;
	return buff;
}

export function hasBuff(what: any)//returns 0 if there is no buff in effect with this name; else, returns it
{if (!Game.buffs[what]) return 0; else return Game.buffs[what];}

export function updateBuffs()//executed every logic frame
{
	for (var i in Game.buffs)
	{
		var buff: any=Game.buffs[i];
		
		if (buff.time>=0)
		{
			if (!l('buffPieTimer'+buff.id)) l('buff'+buff.id).innerHTML=l('buff'+buff.id).innerHTML+'<div class="pieTimer" id="buffPieTimer'+buff.id+'"></div>';
			var T=1-(buff.time/buff.maxTime);
			T=(T*144)%144;
			l('buffPieTimer'+buff.id).style.backgroundPosition=(-Math.floor(T%18))*48+'px '+(-Math.floor(T/18))*48+'px';
		}
		buff.time--;
		if (buff.time<=0)
		{
			if (Game.onCrate==l('buff'+buff.id)) Game.tooltip.hide();
			if (buff.onDie) buff.onDie();
			Game.buffsL.removeChild(l('buff'+buff.id));
			if (Game.buffs[buff.name])
			{
				(Game.buffs as any)[buff.name]=0;//2.048 quirk: marks the slot 0 before the delete below (the typed Record<string, Buff> surface rejects the number)
				delete Game.buffs[buff.name];
			}
			Game.recalculateGains=1;
			Game.storeToRefresh=1;
		}
	}
}

export function killBuff(what: any)//remove a buff by name
{if (Game.buffs[what]){Game.buffs[what].time=0;/*Game.buffs[what]=0;*/}}

export function killBuffs()//remove all buffs
{Game.buffsL.innerHTML='';Game.buffs={};Game.recalculateGains=1;Game.storeToRefresh=1;}

export class BuffType {
	[key: string]: any;

	constructor(name: any,func: any)
	{
		this.name=name;
		this.func=func;//this is a function that returns a buff object; it takes a "time" argument in seconds, and 3 more optional arguments at most, which will be saved and loaded as floats
		this.id=buffTypesN;
		this.vanilla=Game.vanilla;
		buffTypesByName[this.name]=this;
		buffTypes[buffTypesN]=this;
		buffTypesN++;
		Game.buffTypesN=buffTypesN;//CC3 rewrite (phase 6, slice 3): the counter stays live on Game (was `Game.buffTypesN++` in Init).
	}
}
export { BuffType as buffType };//CC3 rewrite (phase 6, slice 3): re-exported under the legacy slot name so the engine's `Game.buffType=buffType` assignment is unchanged.

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
export function declareVanillaBuffs()//CC3 rewrite (phase 6, slice 3): the 26 vanilla buff declarations, run from Init at the original declaration position so Game.vanilla is already 1 when the archetype ctor stamps each type.
{
	new BuffType('frenzy',function(time: any,pow: any)
	{
		return {
			name:'Frenzy',
			desc:loc("Cookie production x%1 for %2!",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[10,14],
			time:time*Game.fps,
			add:true,
			multCpS:pow,
			aura:1
		};
	});
	new BuffType('blood frenzy',function(time: any,pow: any)
	{
		return {
			name:'Elder frenzy',
			desc:loc("Cookie production x%1 for %2!",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[29,6],
			time:time*Game.fps,
			add:true,
			multCpS:pow,
			aura:1
		};
	});
	new BuffType('clot',function(time: any,pow: any)
	{
		return {
			name:'Clot',
			desc:loc("Cookie production halved for %1!",Game.sayTime(time*Game.fps,-1)),
			icon:[15,5],
			time:time*Game.fps,
			add:true,
			multCpS:pow,
			aura:2
		};
	});
	new BuffType('dragon harvest',function(time: any,pow: any)
	{
		if (Game.Has('Dragon fang')) pow=Math.ceil(pow*1.1);
		return {
			name:'Dragon Harvest',
			desc:loc("Cookie production x%1 for %2!",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[10,25],
			time:time*Game.fps,
			add:true,
			multCpS:pow,
			aura:1
		};
	});
	new BuffType('everything must go',function(time: any,pow: any)
	{
		return {
			name:'Everything must go',
			desc:loc("All buildings are %1% cheaper for %2!",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[17,6],
			time:time*Game.fps,
			add:true,
			power:pow,
			aura:1
		};
	});
	new BuffType('cursed finger',function(time: any,pow: any)
	{
		return {
			name:'Cursed finger',
			desc:loc("Cookie production halted for %1,<br>but each click is worth %2 of CpS.",[Game.sayTime(time*Game.fps,-1),Game.sayTime(time*Game.fps,-1)]),
			icon:[12,17],
			time:time*Game.fps,
			add:true,
			power:pow,
			multCpS:0,
			aura:1
		};
	});
	new BuffType('click frenzy',function(time: any,pow: any)
	{
		return {
			name:'Click frenzy',
			desc:loc("Clicking power x%1 for %2!",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[0,14],
			time:time*Game.fps,
			add:true,
			multClick:pow,
			aura:1
		};
	});
	new BuffType('dragonflight',function(time: any,pow: any)
	{
		if (Game.Has('Dragon fang')) pow=Math.ceil(pow*1.1);
		return {
			name:'Dragonflight',
			desc:loc("Clicking power x%1 for %2!",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[0,25],
			time:time*Game.fps,
			add:true,
			multClick:pow,
			aura:1
		};
	});
	new BuffType('cookie storm',function(time: any,pow: any)
	{
		return {
			name:'Cookie storm',
			desc:loc("Cookies everywhere!"),
			icon:[22,6],
			time:time*Game.fps,
			add:true,
			power:pow,
			aura:1
		};
	});
	new BuffType('building buff',function(time: any,pow: any,building: any)
	{
		var obj=Game.ObjectsById[building];
		return {
			name:Game.goldenCookieBuildingBuffs[obj.name][0],
			dname:EN?Game.goldenCookieBuildingBuffs[obj.name][0]:loc("%1 Power!",obj.dname),
			desc:loc("Your %1 are boosting your CpS!",loc("%1 "+obj.bsingle,LBeautify(obj.amount)))+'<br>'+loc("Cookie production +%1% for %2!",[Beautify(Math.ceil(pow*100-100)),Game.sayTime(time*Game.fps,-1)]),
			icon:[obj.iconColumn,14],
			time:time*Game.fps,
			add:true,
			multCpS:pow,
			aura:1
		};
	});
	new BuffType('building debuff',function(time: any,pow: any,building: any)
	{
		var obj=Game.ObjectsById[building];
		return {
			name:Game.goldenCookieBuildingBuffs[obj.name][1],
			dname:EN?Game.goldenCookieBuildingBuffs[obj.name][1]:loc("%1 Burden!",obj.dname),
			desc:loc("Your %1 are rusting your CpS!",loc("%1 "+obj.bsingle,LBeautify(obj.amount)))+'<br>'+loc("Cookie production %1% slower for %2!",[Beautify(Math.ceil(pow*100-100)),Game.sayTime(time*Game.fps,-1)]),
			icon:[obj.iconColumn,15],
			time:time*Game.fps,
			add:true,
			multCpS:1/pow,
			aura:2
		};
	});
	new BuffType('sugar blessing',function(time: any,_pow: any)
	{
		return {
			name:'Sugar blessing',
			desc:loc("You find %1% more golden cookies for the next %2.",[10,Game.sayTime(time*Game.fps,-1)]),
			icon:[29,16],
			time:time*Game.fps,
			//add:true
		};
	});
	new BuffType('haggler luck',function(time: any,pow: any)
	{
		return {
			name:'Haggler\'s luck',
			desc:loc("All upgrades are %1% cheaper for %2!",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[25,11],
			time:time*Game.fps,
			power:pow,
			max:true
		};
	});
	new BuffType('haggler misery',function(time: any,pow: any)
	{
		return {
			name:'Haggler\'s misery',
			desc:loc("All upgrades are %1% pricier for %2!",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[25,11],
			time:time*Game.fps,
			power:pow,
			max:true
		};
	});
	new BuffType('pixie luck',function(time: any,pow: any)
	{
		return {
			name:'Crafty pixies',
			desc:loc("All buildings are %1% cheaper for %2!",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[26,11],
			time:time*Game.fps,
			power:pow,
			max:true
		};
	});
	new BuffType('pixie misery',function(time: any,pow: any)
	{
		return {
			name:'Nasty goblins',
			desc:loc("All buildings are %1% pricier for %2!",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[26,11],
			time:time*Game.fps,
			power:pow,
			max:true
		};
	});
	new BuffType('magic adept',function(time: any,pow: any)
	{
		return {
			name:'Magic adept',
			desc:loc("Spells backfire %1 times less for %2.",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[29,11],
			time:time*Game.fps,
			power:pow,
			max:true
		};
	});
	new BuffType('magic inept',function(time: any,pow: any)
	{
		return {
			name:'Magic inept',
			desc:loc("Spells backfire %1 times more for %2.",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[29,11],
			time:time*Game.fps,
			power:pow,
			max:true
		};
	});
	new BuffType('devastation',function(time: any,pow: any)
	{
		return {
			name:'Devastation',
			desc:loc("Clicking power +%1% for %2!",[Math.floor(pow*100-100),Game.sayTime(time*Game.fps,-1)]),
			icon:[23,18],
			time:time*Game.fps,
			multClick:pow,
			aura:1,
			max:true
		};
	});
	new BuffType('sugar frenzy',function(time: any,pow: any)
	{
		return {
			name:'Sugar frenzy',
			desc:loc("Cookie production x%1 for %2!",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[29,14],
			time:time*Game.fps,
			add:true,
			multCpS:pow,
			aura:0
		};
	});
	new BuffType('loan 1',function(time: any,pow: any)
	{
		return {
			name:'Loan 1',
			dname:loc("Loan %1",1),
			desc:loc("Cookie production x%1 for %2!",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[1,33],
			time:time*Game.fps,
			power:pow,
			multCpS:pow,
			max:true,
			onDie:function(){if (Game.takeLoan) {Game.takeLoan(1,true);}},
		};
	});
	new BuffType('loan 1 interest',function(time: any,pow: any)
	{
		return {
			name:'Loan 1 (interest)',
			dname:loc("Loan %1 (interest)",1),
			desc:loc("Cookie production x%1 for %2!",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[1,33],
			time:time*Game.fps,
			power:pow,
			multCpS:pow,
			max:true
		};
	});
	new BuffType('loan 2',function(time: any,pow: any)
	{
		return {
			name:'Loan 2',
			dname:loc("Loan %1",2),
			desc:loc("Cookie production x%1 for %2!",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[1,33],
			time:time*Game.fps,
			power:pow,
			multCpS:pow,
			max:true,
			onDie:function(){if (Game.takeLoan) {Game.takeLoan(2,true);}},
		};
	});
	new BuffType('loan 2 interest',function(time: any,pow: any)
	{
		return {
			name:'Loan 2 (interest)',
			dname:loc("Loan %1 (interest)",2),
			desc:loc("Cookie production x%1 for %2!",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[1,33],
			time:time*Game.fps,
			power:pow,
			multCpS:pow,
			max:true
		};
	});
	new BuffType('loan 3',function(time: any,pow: any)
	{
		return {
			name:'Loan 3',
			dname:loc("Loan %1",3),
			desc:loc("Cookie production x%1 for %2!",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[1,33],
			time:time*Game.fps,
			power:pow,
			multCpS:pow,
			max:true,
			onDie:function(){if (Game.takeLoan) {Game.takeLoan(3,true);}},
		};
	});
	new BuffType('loan 3 interest',function(time: any,pow: any)
	{
		return {
			name:'Loan 3 (interest)',
			dname:loc("Loan %1 (interest)",3),
			desc:loc("Cookie production x%1 for %2!",[pow,Game.sayTime(time*Game.fps,-1)]),
			icon:[1,33],
			time:time*Game.fps,
			power:pow,
			multCpS:pow,
			max:true
		};
	});
}
