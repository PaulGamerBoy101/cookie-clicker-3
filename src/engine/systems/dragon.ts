/**
 * systems/dragon.ts — the engine's dragon evolution system (Phase 6, slice 3).
 *
 * The 2.048 engine defined `Game.dragonLevels` (the 27 evolution steps),
 * `Game.dragonAuras` (the 21 auras), `Game.dragonAurasBN` (name lookup,
 * populated by the engine loop), `Game.hasAura`, `Game.auraMult`,
 * `Game.SelectDragonAura` and `Game.UpgradeDragon` inside `Game.Init`.
 * They are now typed exports; the engine keeps the same `Game.X = X` slots
 * at the exact original Init positions.
 *
 * Data arrays use the English strings where the original called `loc()`
 * (the `loc` global is not available at import time — the engine's window
 * shim runs after all imports); function bodies are verbatim, including
 * their runtime `loc()` calls. `Game.dragonAurasBN` is populated by the
 * engine loop in Game.Init, as in the original.
 *
 * No runtime imports: `Game`, `loc`, `LBeautify`, `PlaySound`, `writeIcon`,
 * `l`, `EN`, `TopBarOffset` resolve through src/globals.d.ts.
 */

export const dragonLevels = [
	{name:'Dragon egg',action:'Chip it',pic:0,
		cost:function(){return Game.cookies>=1000000;},
		buy:function(){Game.Spend(1000000);},
		costStr:function(){return loc("%1 cookie",LBeautify(1000000));}},
	{name:'Dragon egg',action:'Chip it',pic:1,
		cost:function(){return Game.cookies>=1000000*2;},
		buy:function(){Game.Spend(1000000*2);},
		costStr:function(){return loc("%1 cookie",LBeautify(1000000*2));}},
	{name:'Dragon egg',action:'Chip it',pic:2,
		cost:function(){return Game.cookies>=1000000*4;},
		buy:function(){Game.Spend(1000000*4);},
		costStr:function(){return loc("%1 cookie",LBeautify(1000000*4));}},
	{name:'Shivering dragon egg',action:'Hatch it',pic:3,
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
	{name:'Krumblor, cookie dragon',action:'Bake dragon cookie<br><small>Delicious!</small>',pic:6,
		cost:function(){var fail=0;for (var i in Game.Objects){if (Game.Objects[i].amount<50) fail=1;}return (fail==0);},
		buy:function(){for (var i in Game.Objects){Game.Objects[i].sacrifice(50);}Game.Unlock('Dragon cookie');},
		costStr:function(){return loc("%1 of every building",50);}},
	{name:'Krumblor, cookie dragon',action:'Train secondary aura<br><small>Lets you use two dragon auras simultaneously</small>',pic:7,
		cost:function(){var fail=0;for (var i in Game.Objects){if (Game.Objects[i].amount<200) fail=1;}return (fail==0);},
		buy:function(){for (var i in Game.Objects){Game.Objects[i].sacrifice(200);}},
		costStr:function(){return loc("%1 of every building",200);}},
	{name:'Krumblor, cookie dragon',action:'Your dragon is fully trained.',pic:8}
];

export const dragonAuras = {
	0:{name:'No aura',pic:[0,7],desc:'Select an aura from those your dragon knows.'},
	1:{name:'Breath of Milk',pic:[18,25],desc:'Kittens are <b>5%</b> more effective.'},
	2:{name:'Dragon Cursor',pic:[0,25],desc:'Clicking is <b>5%</b> more powerful.'},
	3:{name:'Elder Battalion',pic:[1,25],desc:'Grandmas gain <b>+1% CpS</b> for each non-grandma building.'},
	4:{name:'Reaper of Fields',pic:[2,25],desc:'Golden cookies may trigger a <b>Dragon Harvest</b>.'},
	5:{name:'Earth Shatterer',pic:[3,25],desc:'Buildings sell back for <b>50%</b> instead of 25%.'},
	6:{name:'Master of the Armory',pic:[4,25],desc:'All upgrades are <b>2% cheaper</b>.'},
	7:{name:'Fierce Hoarder',pic:[15,25],desc:'All buildings are <b>2% cheaper</b>.'},
	8:{name:'Dragon God',pic:[16,25],desc:'<b>+5%</b> prestige level effect on CpS.'},
	9:{name:'Arcane Aura',pic:[17,25],desc:'Golden cookies appear <b>5%</b> more often.'},
	10:{name:'Dragonflight',pic:[5,25],desc:'Golden cookies may trigger a <b>Dragonflight</b>.'},
	11:{name:'Ancestral Metamorphosis',pic:[6,25],desc:'Golden cookies give <b>10%</b> more cookies.'},
	12:{name:'Unholy Dominion',pic:[7,25],desc:'Wrath cookies give <b>10%</b> more cookies.'},
	13:{name:'Epoch Manipulator',pic:[8,25],desc:'Golden cookies stay <b>5%</b> longer.'},
	14:{name:'Mind Over Matter',pic:[13,25],desc:'Random drops are <b>25% more common</b>.'},
	15:{name:'Radiant Appetite',pic:[14,25],desc:'All cookie production <b>multiplied by 2</b>.'},
	16:{name:'Dragon\'s Fortune',pic:[19,25],desc:'<b>+123% CpS</b> per golden cookie on-screen, multiplicative.'},
	17:{name:'Dragon\'s Curve',pic:[20,25],desc:'<b>+5%</b> sugar lump growth.'+" "+'Sugar lumps are <b>twice as likely</b> to be unusual.'},
	18:{name:'Reality Bending',pic:[32,25],desc:'<b>One tenth</b> of every other dragon aura, <b>combined</b>.'},
	19:{name:'Dragon Orbs',pic:[33,25],desc:'With no buffs and no golden cookies on screen, selling your most powerful building has <b>10% chance to summon one</b>.'},
	20:{name:'Supreme Intellect',pic:[34,25],desc:'Confers various powers to your minigames while active.<br>See the bottom of each minigame for more details.'},
};

/** Name-to-aura lookup; populated by the engine loop in Game.Init (same as the original). */
export const dragonAurasBN: Record<string, any> = {};

export function hasAura(what: any)
{
	if (Game.dragonAuras[Game.dragonAura].name==what || Game.dragonAuras[Game.dragonAura2].name==what) return true; else return false;
}
export function auraMult(what: any)
{
	var n=0;
	if (Game.dragonAuras[Game.dragonAura].name==what || Game.dragonAuras[Game.dragonAura2].name==what) n=1;
	if ((Game.dragonAuras[Game.dragonAura].name=='Reality Bending' || Game.dragonAuras[Game.dragonAura2].name=='Reality Bending') && Game.dragonLevel>=Game.dragonAurasBN[what].id+4) n+=0.1;
	return n;
}

export function SelectDragonAura(slot: any, update: any)
{	
	var currentAura: any=0;
	var otherAura: any=0;
	if (slot==0) currentAura=Game.dragonAura; else currentAura=Game.dragonAura2;
	if (slot==0) otherAura=Game.dragonAura2; else otherAura=Game.dragonAura;
	if (!update) Game.SelectingDragonAura=currentAura;
	
	var str='';
	for (var i in Game.dragonAuras)
	{
		if (Game.dragonLevel>=parseInt(i)+4)
		{
			var icon=Game.dragonAuras[i].pic;
			if ((i as any)==0 || i!=otherAura) str+='<div class="crate enabled'+((i as any)==Game.SelectingDragonAura?' highlighted':'')+'" style="opacity:1;float:none;display:inline-block;'+writeIcon(icon)+'" '+Game.clickStr+'="PlaySound(\'snd/tick.mp3\');Game.SetDragonAura('+i+','+slot+');" onMouseOut="Game.DescribeDragonAura('+Game.SelectingDragonAura+');" onMouseOver="Game.DescribeDragonAura('+i+');"'+
				'></div>';
		}
	}
	
	var highestBuilding: any=0;
	for (var i in Game.Objects) {if (Game.Objects[i].amount>0) highestBuilding=Game.Objects[i];}
	
	Game.Prompt('<id PickDragonAura><h3>'+loc(slot==1?"Set your dragon's secondary aura":"Set your dragon's aura")+'</h3>'+
				'<div class="line"></div>'+
				'<div id="dragonAuraInfo" style="min-height:60px;"></div>'+
				'<div style="text-align:center;">'+str+'</div>'+
				'<div class="line"></div>'+
				'<div style="text-align:center;margin-bottom:8px;">'+(highestBuilding==0?loc("Switching your aura is <b>free</b> because you own no buildings."):loc("The cost of switching your aura is <b>%1</b>.<br>This will affect your CpS!",loc("%1 "+highestBuilding.bsingle,LBeautify(1))))+'</div>'
				,[[loc("Confirm"),(slot==0?'Game.dragonAura':'Game.dragonAura2')+'=Game.SelectingDragonAura;'+(highestBuilding==0 || currentAura==Game.SelectingDragonAura?'':'Game.ObjectsById['+highestBuilding.id+'].sacrifice(1);')+'Game.ToggleSpecialMenu(1);Game.ClosePrompt();'],loc("Cancel")],0,'widePrompt');
	Game.DescribeDragonAura(Game.SelectingDragonAura);
}

export function UpgradeDragon()
{
	if (Game.dragonLevel<Game.dragonLevels.length-1 && Game.dragonLevels[Game.dragonLevel].cost())
	{
		PlaySound('snd/shimmerClick.mp3');
		Game.dragonLevels[Game.dragonLevel].buy();
		Game.dragonLevel=(Game.dragonLevel+1)%Game.dragonLevels.length;
		
		if (Game.dragonLevel>=Game.dragonLevels.length-1) Game.Win('Here be dragon');
		Game.ToggleSpecialMenu(1);
		if (l('specialPic')){var rect=l('specialPic').getBounds();Game.SparkleAt((rect.left+rect.right)/2,(rect.top+rect.bottom)/2)+32-TopBarOffset;}
		Game.recalculateGains=1;
		Game.upgradesToRebuild=1;
	}
}
