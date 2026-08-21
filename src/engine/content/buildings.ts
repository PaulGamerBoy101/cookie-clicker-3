/**
 * content/buildings.ts — the 19 vanilla building declarations.
 *
 * Ported verbatim from the 2.048 engine (engine/main.ts, the //define objects
 * block inside Game.Init). This is the architectural rewrite’s typed content
 * layer: the same `new Game.Object` calls, in the same order, with the same
 * CpS/buy closures — only the file moved, and every closure is now typed.
 *
 * The engine calls declareVanillaBuildings(Game) from Game.Init (which the
 * asset-Loader guarantees runs exactly once per page load), so the closures
 * capture the same Game object the original bare-global references resolved to.
 */
import type { Building, Game as EngineGame } from "../types";

/** Declare the 19 vanilla buildings (and their per-building extras) on Game. */
export function declareVanillaBuildings(Game: EngineGame) {
		//define objects
		new Game.Object('Cursor','cursor|cursors|clicked|[X] extra finger|[X] extra fingers','Autoclicks once every 10 seconds.',0,0,{},15,function (me: Building) {
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
			var mult=1;
			var num=0;
			for (var i in Game.Objects) {if (Game.Objects[i].name!='Cursor') num+=Game.Objects[i].amount;}
			add=add*num;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS('Cursor');
			mult*=Game.eff('cursorCps');
			return Game.ComputeCps(0.1,Game.Has('Reinforced index finger')+Game.Has('Carpal tunnel prevention cream')+Game.Has('Ambidextrous'),add)*mult;
		},function (this: Building) {
			if (this.amount>=1) Game.Unlock(['Reinforced index finger','Carpal tunnel prevention cream']);
			if (this.amount>=10) Game.Unlock('Ambidextrous');
			if (this.amount>=25) Game.Unlock('Thousand fingers');
			if (this.amount>=50) Game.Unlock('Million fingers');
			if (this.amount>=100) Game.Unlock('Billion fingers');
			if (this.amount>=150) Game.Unlock('Trillion fingers');
			if (this.amount>=200) Game.Unlock('Quadrillion fingers');
			if (this.amount>=250) Game.Unlock('Quintillion fingers');
			if (this.amount>=300) Game.Unlock('Sextillion fingers');
			if (this.amount>=350) Game.Unlock('Septillion fingers');
			if (this.amount>=400) Game.Unlock('Octillion fingers');
			if (this.amount>=450) Game.Unlock('Nonillion fingers');
			if (this.amount>=500) Game.Unlock('Decillion fingers');
			
			if (this.amount>=1) Game.Win('Click');if (this.amount>=2) Game.Win('Double-click');if (this.amount>=50) Game.Win('Mouse wheel');if (this.amount>=100) Game.Win('Of Mice and Men');if (this.amount>=200) Game.Win('The Digital');if (this.amount>=300) Game.Win('Extreme polydactyly');if (this.amount>=400) Game.Win('Dr. T');if (this.amount>=500) Game.Win('Thumbs, phalanges, metacarpals');if (this.amount>=600) Game.Win('With her finger and her thumb');if (this.amount>=700) Game.Win('Gotta hand it to you');if (this.amount>=800) Game.Win('The devil\'s workshop');
		});
		
		Game.SpecialGrandmaUnlock=15;
		new Game.Object('Grandma','grandma|grandmas|baked|Grandmas are [X] year older|Grandmas are [X] years older','A nice grandma to bake more cookies.',1,1,{pic: function (_i: string) {
			var list=['grandma'];
			if (Game.Has('Farmer grandmas')) list.push('farmerGrandma');
			if (Game.Has('Worker grandmas')) list.push('workerGrandma');
			if (Game.Has('Miner grandmas')) list.push('minerGrandma');
			if (Game.Has('Cosmic grandmas')) list.push('cosmicGrandma');
			if (Game.Has('Transmuted grandmas')) list.push('transmutedGrandma');
			if (Game.Has('Altered grandmas')) list.push('alteredGrandma');
			if (Game.Has('Grandmas\' grandmas')) list.push('grandmasGrandma');
			if (Game.Has('Antigrandmas')) list.push('antiGrandma');
			if (Game.Has('Rainbow grandmas')) list.push('rainbowGrandma');
			if (Game.Has('Banker grandmas')) list.push('bankGrandma');
			if (Game.Has('Priestess grandmas')) list.push('templeGrandma');
			if (Game.Has('Witch grandmas')) list.push('witchGrandma');
			if (Game.Has('Lucky grandmas')) list.push('luckyGrandma');
			if (Game.Has('Metagrandmas')) list.push('metaGrandma');
			if (Game.Has('Script grannies')) list.push('scriptGrandma');
			if (Game.Has('Alternate grandmas')) list.push('alternateGrandma');
			if (Game.Has('Brainy grandmas')) list.push('brainyGrandma');
			if (Game.season=='christmas') list.push('elfGrandma');
			if (Game.season=='easter') list.push('bunnyGrandma');
			return choose(list)+'.webp';
		},bg:'grandmaBackground.webp',xV:8,yV:8,w:32,rows:3,x:0,y:16},100,function (me: Building) {
			var mult=1;
			for (var i in Game.GrandmaSynergies)
			{
				if (Game.Has(Game.GrandmaSynergies[i])) mult*=2;
			}
			if (Game.Has('Bingo center/Research facility')) mult*=4;
			if (Game.Has('Ritual rolling pins')) mult*=2;
			if (Game.Has('Naughty list')) mult*=2;
			
			if (Game.Has('Elderwort biscuits')) mult*=1.02;
			
			mult*=Game.eff('grandmaCps');
			
			if (Game.Has('Cat ladies'))
			{
				for (var j=0;j<Game.UpgradesByPool['kitten'].length;j++)
				{
					if (Game.Has(Game.UpgradesByPool['kitten'][j].name)) mult*=1.29;
				}
			}
			
			mult*=Game.GetTieredCpsMult(me);
			
			var add=0;
			if (Game.Has('One mind')) add+=Game.Objects['Grandma'].amount*0.02;
			if (Game.Has('Communal brainsweep')) add+=Game.Objects['Grandma'].amount*0.02;
			if (Game.Has('Elder Pact')) add+=Game.Objects['Portal'].amount*0.05;
			
			var num=0;
			for (var i in Game.Objects) {if (Game.Objects[i].name!='Grandma') num+=Game.Objects[i].amount;}
			//if (Game.hasAura('Elder Battalion')) mult*=1+0.01*num;
			mult*=1+Game.auraMult('Elder Battalion')*0.01*num;
			
			mult*=Game.magicCpS(me.name);
			
			return (me.baseCps+add)*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
		});
		Game.last.sellFunction=function()
		{
			Game.Win('Just wrong');
			if (this.amount==0)
			{
				Game.Lock('Elder Pledge');
				Game.CollectWrinklers();
				Game.pledgeT=0;
			}
		};
		Game.last.iconFunc=function (type: string) {
			var grandmaIcons=[[0,1],[0,2],[1,2],[2,2]];
			if (type=='off') return [0,1];
			if (Game.prefs.notScary && Game.elderWrath>0) return [3,2];
			return grandmaIcons[Game.elderWrath];
		};
		
		
		new Game.Object('Farm','farm|farms|harvested|[X] more acre|[X] more acres','Grows cookie plants from cookie seeds.',3,2,{base:'farm',xV:8,yV:8,w:64,rows:2,x:0,y:16},500,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0) Game.Unlock(this.grandma!.name);
		});
		Game.last.minigameUrl='minigameGarden.js';
		Game.last.minigameName=loc("Garden");
		
		new Game.Object('Mine','mine|mines|mined|[X] mile deeper|[X] miles deeper','Mines out cookie dough and chocolate chips.',4,3,{base:'mine',xV:16,yV:16,w:64,rows:2,x:0,y:24},10000,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0) Game.Unlock(this.grandma!.name);
		});
		
		new Game.Object('Factory','factory|factories|mass-produced|[X] additional patent|[X] additional patents','Produces large quantities of cookies.',5,4,{base:'factory',xV:8,yV:0,w:64,rows:1,x:0,y:-22},3000,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0) Game.Unlock(this.grandma!.name);
		});
		//Game.last.minigameUrl='minigameDungeon.js';//not yet
		Game.last.minigameName=loc("Dungeon");
		
		new Game.Object('Bank','bank|banks|banked|Interest rates [X]% better|Interest rates [X]% better','Generates cookies from interest.',6,15,{base:'bank',xV:8,yV:4,w:56,rows:1,x:0,y:13},0,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0) Game.Unlock(this.grandma!.name);
		});
		Game.last.minigameUrl='minigameMarket.js';
		Game.last.minigameName=loc("Stock Market");
		
		new Game.Object('Temple','temple|temples|discovered|[X] sacred artifact retrieved|[X] sacred artifacts retrieved','Full of precious, ancient chocolate.',7,16,{base:'temple',xV:8,yV:4,w:72,rows:2,x:0,y:-5},0,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0) Game.Unlock(this.grandma!.name);
		});
		Game.last.minigameUrl='minigamePantheon.js';
		Game.last.minigameName=loc("Pantheon");
		
		new Game.Object('Wizard tower','wizard tower|wizard towers|summoned|Incantations have [X] more syllable|Incantations have [X] more syllables','Summons cookies with magic spells.',8,17,{base:'wizardtower',xV:16,yV:16,w:48,rows:2,x:0,y:20},0,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0) Game.Unlock(this.grandma!.name);
		});
		Game.last.displayName='<span style="font-size:90%;letter-spacing:-1px;position:relative;bottom:2px;">Wizard tower</span>';//shrink
		Game.last.minigameUrl='minigameGrimoire.js';
		Game.last.minigameName=loc("Grimoire");
		
		new Game.Object('Shipment','shipment|shipments|shipped|[X] galaxy fully explored|[X] galaxies fully explored','Brings in fresh cookies from the cookie planet.',9,5,{base:'shipment',xV:16,yV:16,w:64,rows:1,x:0,y:0},40000,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0) Game.Unlock(this.grandma!.name);
		});
		
		new Game.Object('Alchemy lab','alchemy lab|alchemy labs|transmuted|[X] primordial element mastered|[X] primordial elements mastered','Turns gold into cookies!',10,6,{base:'alchemylab',xV:16,yV:16,w:64,rows:2,x:0,y:16},200000,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0) Game.Unlock(this.grandma!.name);
		});
		Game.last.displayName='<span style="font-size:90%;letter-spacing:-1px;position:relative;bottom:2px;">Alchemy lab</span>';//shrink
		
		new Game.Object('Portal','portal|portals|retrieved|[X] dimension enslaved|[X] dimensions enslaved','Opens a door to the Cookieverse.',11,7,{base:'portal',xV:32,yV:32,w:64,rows:2,x:0,y:0},1666666,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0) Game.Unlock(this.grandma!.name);
		});
		
		new Game.Object('Time machine','time machine|time machines|recovered|[X] century secured|[X] centuries secured','Brings cookies from the past, before they were even eaten.',12,8,{base:'timemachine',xV:32,yV:32,w:64,rows:1,x:0,y:0},123456789,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0) Game.Unlock(this.grandma!.name);
		});
		Game.last.displayName='<span style="font-size:80%;letter-spacing:-1px;position:relative;bottom:3px;">Time machine</span>';//shrink
		
		new Game.Object('Antimatter condenser','antimatter condenser|antimatter condensers|condensed|[X] extra quark flavor|[X] extra quark flavors','Condenses the antimatter in the universe into cookies.',13,13,{base:'antimattercondenser',xV:0,yV:64,w:64,rows:1,x:0,y:0},3999999999,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0) Game.Unlock(this.grandma!.name);
		});
		Game.last.displayName='<span style="font-size:65%;letter-spacing:-1px;position:relative;bottom:4px;">Antim. condenser</span>';//shrink
		
		new Game.Object('Prism','prism|prisms|converted|[X] new color discovered|[X] new colors discovered','Converts light itself into cookies.',14,14,{base:'prism',xV:16,yV:4,w:64,rows:1,x:0,y:20},75000000000,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0) Game.Unlock(this.grandma!.name);
		});
		
		// 2.048 quirk: the original art literal had a duplicate `rows` key
		// (rows:1 … rows:2); JS keeps the last value, so only rows:2 survives here.
		new Game.Object('Chancemaker','chancemaker|chancemakers|spontaneously generated|Chancemakers are powered by [X]-leaf clovers|Chancemakers are powered by [X]-leaf clovers','Generates cookies out of thin air through sheer luck.',15,19,{base:'chancemaker',xV:8,yV:64,w:64,x:0,y:0,rows:2},77777777777,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0) Game.Unlock(this.grandma!.name);
		});
		Game.last.displayName='<span style="font-size:85%;letter-spacing:-1px;position:relative;bottom:2px;">Chancemaker</span>';//shrink
		
		new Game.Object('Fractal engine','fractal engine|fractal engines|made from cookies|[X] iteration deep|[X] iterations deep','Turns cookies into even more cookies.',16,20,{base:'fractalEngine',xV:8,yV:64,w:64,rows:1,x:0,y:0},12345678987654321,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0) Game.Unlock(this.grandma!.name);
		});
		Game.last.displayName='<span style="font-size:80%;letter-spacing:-1px;position:relative;bottom:4px;">Fractal engine</span>';//shrink
		
		new Game.Object('Javascript console','javascript console|javascript consoles|programmed|Equipped with [X] external library|Equipped with [X] external libraries','Creates cookies from the very code this game was written in.',17,32,{base:'javascriptconsole',xV:8,yV:64,w:14,rows:1,x:8,y:-32,frames:2},12345678987654321,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0) Game.Unlock(this.grandma!.name);
		});
		Game.last.displayName='<span style="font-size:65%;letter-spacing:-1px;position:relative;bottom:4px;">Javascript console</span>';//shrink
		
		new Game.Object('Idleverse','idleverse|idleverses|hijacked|[X] manifold|[X] manifolds','There\'s been countless other idle universes running alongside our own. You\'ve finally found a way to hijack their production and convert whatever they\'ve been making into cookies!',18,33,{base:'idleverse',xV:8,yV:96,w:48,rows:2,x:0,y:0,frames:4},12345678987654321,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0) Game.Unlock(this.grandma!.name);
		});
		
		new Game.Object('Cortex baker','cortex baker|cortex bakers|imagined|[X] extra IQ point|[X] extra IQ points','These artificial brains the size of planets are capable of simply dreaming up cookies into existence. Time and space are inconsequential. Reality is arbitrary.',19,34,{base:'cortex',xV:8,yV:96,w:48,rows:1,x:0,y:0,frames:4},12345678987654321,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0) Game.Unlock(this.grandma!.name);
		});

}
