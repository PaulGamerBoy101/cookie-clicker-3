/**
 * content/buildings/remaining.ts — the vanilla building declarations not yet
 * split into their own files (Mine through Cortex baker, the tail price
 * rebalance, and Cats).
 *
 * Ported verbatim from the 2.048 engine (engine/main.ts, the //define objects
 * block inside Game.Init). This is the architectural rewrite's typed content
 * layer: the same `new Game.Object` calls, in the same order, with the same
 * CpS/buy closures — only the file moved, and every closure is now typed.
 *
 * Splitting is a pure move: each building block is lifted into
 * buildings/<name>.ts one at a time (see the git history) and called from
 * index.ts in exactly this order. Declaration order is load-bearing —
 * Game.Objects key order is the save index (see the Cats comment) — so the
 * call order in index.ts must never change.
 */
import type { Building, Game as EngineGame } from "../../types";

/** Declare the not-yet-split vanilla buildings (and their per-building extras) on Game. */
export function declareRemaining(Game: EngineGame) {
		new Game.Object('Mine','mine|mines|mined|[X] mile deeper|[X] miles deeper','Mines out cookie dough and chocolate chips.',4,3,{base:'mine',xV:16,yV:16,w:64,rows:2,x:0,y:24},10000,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
			if (this.amount>=Game.SpecialCatUnlock && Game.Objects['Cats'].amount>0 && this.cat) Game.Unlock(this.cat!.name);
		});
		// CC3: same custom-grid treatment as the farms, with per-mine variety.
		// The vanilla mine draw stamped one identical 64x64 sprite on a fixed
		// grid, so a full row of mines looked perfectly uniform. This mirrors
		// each mine deterministically (the classic entrance reads fine flipped)
		// and shades back rows darker for depth, on the farm's bottom-anchored
		// capped grid with the sale shrink.
		var mineObj=Game.Objects['Mine'];
		mineObj.draw=function(this: Building)
		{
			if (this.amount<=0||!this.canvas||!this.ctx) return false;
			if (this.toResize)
			{
				this.canvas.width=this.canvas.clientWidth;
				this.canvas.height=this.canvas.clientHeight;
				this.toResize=false;
			}
			var ctx=this.ctx;
			ctx.globalAlpha=1;
			if (typeof(this.art.bg)=='string') ctx.fillPattern(Pic(this.art.bg),0,0,this.canvas.width,this.canvas.height,128,128);
			var sheet=Pic(this.art.pic);
			var canvasW=this.canvas.width;
			var canvasH=this.canvas.height;
			var mineW=64;
			var mineH=64;
			var hStep=mineW+6;//column spacing just past the sprite, like the farms
			var perRow=Math.max(1,Math.floor((canvasW-mineW)/hStep)+1);
			var vStep=30;//mine-like depth step
			var numRows=Math.max(1,Math.floor((canvasH-mineH-4)/vStep)+1);
			var yBase=canvasH-mineH-2;
			var iT=Math.min(this.amount,perRow*numRows);
			var i=this.pics.length;
			if (i!=iT)
			{
				while (i<iT)
				{
					Math.seedrandom(Game.seed+' '+this.id+' '+i);
					var row=Math.floor(i/perRow);
					var col=i%perRow;
					var x=col*hStep+Math.floor((Math.random()-0.5)*12);
					var y=yBase-row*vStep+Math.floor((Math.random()-0.5)*6);
					this.pics.push({x:x,y:y,z:y,pic:this.art.pic,id:i,frame:0,flip:Math.random()<0.5,born:Game.T});
					i++;
				}
				while (i>iT)
				{
					this.pics.sort(Game.sortSpritesById);
					this.pics.pop();
					i--;
				}
				this.pics.sort(Game.sortSprites);
			}
			for (var i=0;i<this.pics.length;i++)
			{
				var pic:any=this.pics[i];
				var row=Math.floor(pic.id/perRow);
				ctx.globalAlpha=row>0?0.85:1;//back rows sit in the shade
				if (pic.flip)
				{
					ctx.save();
					ctx.translate(pic.x+mineW,pic.y);
					ctx.scale(-1,1);
					ctx.drawImage(sheet,0,0,mineW,mineH);
					ctx.restore();
				}
				else ctx.drawImage(sheet,pic.x,pic.y,mineW,mineH);
			}
			ctx.globalAlpha=1;
		};
		
		new Game.Object('Factory','factory|factories|mass-produced|[X] additional patent|[X] additional patents','Produces large quantities of cookies.',5,4,{base:'factory',xV:8,yV:0,w:64,rows:1,x:0,y:-22},3000,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
			if (this.amount>=Game.SpecialCatUnlock && Game.Objects['Cats'].amount>0 && this.cat) Game.Unlock(this.cat!.name);
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
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
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
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
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
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
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
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
			if (this.amount>=Game.SpecialCatUnlock && Game.Objects['Cats'].amount>0 && this.cat) Game.Unlock(this.cat!.name);
		});
		
		new Game.Object('Alchemy lab','alchemy lab|alchemy labs|transmuted|[X] primordial element mastered|[X] primordial elements mastered','Turns gold into cookies!',10,6,{base:'alchemylab',xV:16,yV:16,w:64,rows:2,x:0,y:16},200000,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
			if (this.amount>=Game.SpecialCatUnlock && Game.Objects['Cats'].amount>0 && this.cat) Game.Unlock(this.cat!.name);
		});
		Game.last.displayName='<span style="font-size:90%;letter-spacing:-1px;position:relative;bottom:2px;">Alchemy lab</span>';//shrink
		
		new Game.Object('Portal','portal|portals|retrieved|[X] dimension enslaved|[X] dimensions enslaved','Opens a door to the Cookieverse.',11,7,{base:'portal',xV:32,yV:32,w:64,rows:2,x:0,y:0},1666666,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
			if (this.amount>=Game.SpecialCatUnlock && Game.Objects['Cats'].amount>0 && this.cat) Game.Unlock(this.cat!.name);
		});
		
		new Game.Object('Time machine','time machine|time machines|recovered|[X] century secured|[X] centuries secured','Brings cookies from the past, before they were even eaten.',12,8,{base:'timemachine',xV:32,yV:32,w:64,rows:1,x:0,y:0},123456789,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
			if (this.amount>=Game.SpecialCatUnlock && Game.Objects['Cats'].amount>0 && this.cat) Game.Unlock(this.cat!.name);
		});
		Game.last.displayName='<span style="font-size:80%;letter-spacing:-1px;position:relative;bottom:3px;">Time machine</span>';//shrink
		
		new Game.Object('Antimatter condenser','antimatter condenser|antimatter condensers|condensed|[X] extra quark flavor|[X] extra quark flavors','Condenses the antimatter in the universe into cookies.',13,13,{base:'antimattercondenser',xV:0,yV:64,w:64,rows:1,x:0,y:0},3999999999,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
		});
		Game.last.displayName='<span style="font-size:65%;letter-spacing:-1px;position:relative;bottom:4px;">Antim. condenser</span>';//shrink
		
		// CC3 rebalance: the 2.048 tail multiplied base prices by an extra 10x
		// per building from id 16 on (see core/building.ts, where it is removed),
		// stacking price/CpS to 10x-1000x off the fitted midgame curve. The
		// rebalanced prices are applied post-construction below and walk the
		// fitted ~2.1x-per-store-step curve anchored at Antimatter condenser.
		// CpS, tiered upgrade ratios, and all gameplay formulas are unchanged.
		new Game.Object('Prism','prism|prisms|converted|[X] new color discovered|[X] new colors discovered','Converts light itself into cookies.',14,14,{base:'prism',xV:16,yV:4,w:64,rows:1,x:0,y:20},75000000000,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
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
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
		});
		Game.last.displayName='<span style="font-size:85%;letter-spacing:-1px;position:relative;bottom:2px;">Chancemaker</span>';//shrink
		
		new Game.Object('Fractal engine','fractal engine|fractal engines|made from cookies|[X] iteration deep|[X] iterations deep','Turns cookies into even more cookies.',16,20,{base:'fractalEngine',xV:8,yV:64,w:64,rows:1,x:0,y:0},12345678987654321,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
		});
		Game.last.displayName='<span style="font-size:80%;letter-spacing:-1px;position:relative;bottom:4px;">Fractal engine</span>';//shrink
		
		new Game.Object('Javascript console','javascript console|javascript consoles|programmed|Equipped with [X] external library|Equipped with [X] external libraries','Creates cookies from the very code this game was written in.',17,32,{base:'javascriptconsole',xV:8,yV:64,w:14,rows:1,x:8,y:-32,frames:2},12345678987654321,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
		});
		Game.last.displayName='<span style="font-size:65%;letter-spacing:-1px;position:relative;bottom:4px;">Javascript console</span>';//shrink
		
		new Game.Object('Idleverse','idleverse|idleverses|hijacked|[X] manifold|[X] manifolds','There\'s been countless other idle universes running alongside our own. You\'ve finally found a way to hijack their production and convert whatever they\'ve been making into cookies!',18,33,{base:'idleverse',xV:8,yV:96,w:48,rows:2,x:0,y:0,frames:4},12345678987654321,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
		});
		
		new Game.Object('Cortex baker','cortex baker|cortex bakers|imagined|[X] extra IQ point|[X] extra IQ points','These artificial brains the size of planets are capable of simply dreaming up cookies into existence. Time and space are inconsequential. Reality is arbitrary.',19,34,{base:'cortex',xV:8,yV:96,w:48,rows:1,x:0,y:0,frames:4},12345678987654321,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
		});

		// The Building ctor auto-generates basePrice from the id curve and
		// ignores the price argument for id>0, so the rebalanced tail prices
		// are applied post-construction (same pattern as the Cats block below).
		// Prices walk a ~2.1x-per-store-step payback curve anchored at Antimatter
		// condenser (1.709e14, unchanged), matching the midgame slope exactly.
		var rebalancePrices:any={
			'Prism':2420400000000000,
			'Chancemaker':36807000000000000,
			'Fractal engine':552110000000000000,
			'Javascript console':8502400000000000000,
			'Idleverse':134725000000000000000,
			'Cortex baker':2181570000000000000000
		};
		for (var rebalanceName in rebalancePrices)
		{
			var rebalanceBuilding=Game.Objects[rebalanceName];
			if (rebalanceBuilding)
			{
				rebalanceBuilding.basePrice=rebalancePrices[rebalanceName];
				rebalanceBuilding.price=rebalancePrices[rebalanceName];
				rebalanceBuilding.bulkPrice=rebalancePrices[rebalanceName];
			}
		}

		// Cats are appended after the vanilla building list so old saves keep
		// every existing building at its original save index. Their visible
		// store/row order is moved below to place them between Grandma and Farm.
		// These sheets use the asset pack's 80x64 canvas per frame (not the
		// cat's smaller visible 32px body). Cropping at 64px would splice
		// adjacent frames together and make the animation look like scrolling.
		var catAnimations=[
			{pic:'img/cats/idle.png',frames:8,width:80},
			{pic:'img/cats/walk.png',frames:12,width:80},
			{pic:'img/cats/run.png',frames:8,width:80},
			{pic:'img/cats/jump.png',frames:3,width:80},
			{pic:'img/cats/running-jump.png',frames:3,width:80},
			{pic:'img/cats/attack-1.png',frames:8,width:80},
			{pic:'img/cats/hurt.png',frames:4,width:80}
		];
		var catArt:any={
			pic:'img/cats/idle.png',
			storeIcon:'img/cats/idle.png',
			storeIconSize:'480px 48px'
		};
		var cats=new Game.Object('Cats','cat|cats|adopted|[X] extra cat|[X] extra cats','A cozy room full of curious cats that happily bake cookies.',0,1,catArt,500,function (me: Building) {
			var mult=1;
			for (var i in Game.CatSynergies)
			{
				if (Game.Has(Game.CatSynergies[i])) mult*=2;
			}
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			// Cat-specific additive bonuses from the custom upgrade collection.
			var catAdd=0;
			var catAddUpgrades=['Cardboard box basics','Sunbeam training','Whisker refinement','Midnight zoomies',
				'Tuna-grade nutrition','Claw-powered kneading','Purrfect production','Nine-lives efficiency',
				'Feline assembly','Astral catnaps','Infinite yarn loop','Quantum litter boxes',
				'Cosmic whisker arrays','Protein singularity'];
			for (var catAddIndex=0;catAddIndex<catAddUpgrades.length;catAddIndex++)
			{
				var catAddUpgrade=Game.Upgrades[catAddUpgrades[catAddIndex]];
				if (catAddUpgrade && Game.Has(catAddUpgrades[catAddIndex]) && catAddUpgrade.catAdd) catAdd+=catAddUpgrade.catAdd;
			}
			var catMult=1;
			var catMultUpgrades=['Protein-rich kibble','Feather wand drills','Sunbeam perches','Catnip cultivation','Scratching-post ovens','Climbing shelves','Nine lives logistics'];
			for (var catMultIndex=0;catMultIndex<catMultUpgrades.length;catMultIndex++)
			{
				if (Game.Has(catMultUpgrades[catMultIndex])) catMult*=1.02;
			}
			if (Game.Has('Grandma-approved recipes')) catMult*=1+Math.min(Game.Objects['Grandma'].amount*0.005,0.25);
			return (me.baseCps+catAdd)*mult*catMult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			var catUpgradeUnlocks:any[]=[
				[10,'Grandma-approved recipes'],[25,'Purrfect timing'],[50,'Cat café loyalty'],
				[75,'Protein-rich kibble'],[100,'Feather wand drills'],[150,'Sunbeam perches'],
				[200,'Catnip cultivation'],[250,'Scratching-post ovens'],[350,'Climbing shelves'],
				[450,'Nine lives logistics']
			];
			for (var catUpgradeUnlockIndex=0;catUpgradeUnlockIndex<catUpgradeUnlocks.length;catUpgradeUnlockIndex++)
			{
				if (this.amount>=catUpgradeUnlocks[catUpgradeUnlockIndex][0]) Game.Unlock(catUpgradeUnlocks[catUpgradeUnlockIndex][1]);
			}
			if (this.amount>=100) Game.Win('A cat for every cushion');
			if (this.amount>=450) Game.Win('The whole litter');
			if (this.amount>=500) Game.Win('The five-hundred purr');
			if (this.amount>=1000) Game.Win('One thousand paws');
		});
		// The automatic building curve is intentionally overridden: 500 cookies
		// for 4 CpS sits between Grandma (100/1) and Farm (1100/8).
		cats.basePrice=500;
		cats.price=500;
		cats.bulkPrice=500;
		cats.baseCps=4;
		cats.storeOrder=1.5;
		cats.dname='Cats';
		cats.single='cat';
		cats.plural='cats';
		cats.desc='A cozy room full of curious cats that happily bake cookies.';
		cats.baseDesc=cats.desc;
		cats.displayName='<span style="font-size:90%;letter-spacing:-1px;position:relative;bottom:2px;">Cats</span>';

		// The normal building renderer keeps sprites static. Cats use the same
		// canvas and amount-based layout as Grandma, with a mostly-idle mix of
		// animation personalities so buying more visibly changes the scene.
		var catAnimationModes=[0,1,0,2,0,3,0,4];//idle, walk, idle, run, idle, jump, idle, running jump
		cats.draw=function(this: Building)
		{
			if (this.amount<=0 || !this.canvas || !this.ctx) return false;
			if (this.toResize)
			{
				this.canvas.width=this.canvas.clientWidth;
				this.canvas.height=this.canvas.clientHeight;
				this.toResize=false;
			}
			var ctx=this.ctx;
			var width=this.canvas.width;
			var height=this.canvas.height;
			// Keep every cat at the original 80x64 sprite size. A large amount
			// may overlap on the ground, but cats should never shrink or float
			// into the sky just because more were purchased.
			// CC3: capped at 50 (was 100) — the full herd of animated sprites at
			// 80x64 with per-cat motion math cost visible frame time.
			var count=Math.min(this.amount,50);
			var catScale=1;
			ctx.clearRect(0,0,width,height);
			ctx.imageSmoothingEnabled=false;

			// Summer1 is a full scene rather than a tile, so scale it to the
			// building height and repeat it across the box without distortion.
			var background=Pic('img/cats/Summer1.png');
			if (background && background.complete && background.naturalWidth>0)
			{
				var backgroundWidth=Math.max(1,Math.ceil(height*background.naturalWidth/background.naturalHeight));
				for (var backgroundX=0;backgroundX<width;backgroundX+=backgroundWidth)
				{
					ctx.drawImage(background,0,0,background.naturalWidth,background.naturalHeight,backgroundX,0,backgroundWidth,height);
				}
			}

			for (var i=0;i<count;i++)
			{
				// Most cats are idle, while later purchases introduce walkers,
				// runners, and playful reactions. This is independent of the
				// unrelated "fancy" preference so the cats always animate.
				var animationIndex=catAnimationModes[i%catAnimationModes.length];
				var animation=catAnimations[animationIndex];
				var sprite=Pic(animation.pic);
				var frame=Math.floor((Game.T+i*7)/3)%animation.frames;
				var drawWidth=animation.width*catScale;
				var drawHeight=64*catScale;
				var travelDistance=Math.max(1,width-drawWidth);
				var idle=animationIndex==0;
				var returning=false;
				var x=0;
				if (idle)
				{
					// Idle cats breathe in place; they do not drift across the scene.
					if (count<=8)
					{
						var idlePositions=[0.12,0.5,0.86,0.3,0.7,0.2,0.58,0.9];
						x=travelDistance*idlePositions[i%idlePositions.length];
					}
					else x=(i*47)%travelDistance;
				}
				else
				{
					var speed=[1.6,2.2,3,2.4,2.4,1.8,1.4][animationIndex];
					var motion=(Game.T*speed+i*97)%(travelDistance*2);
					returning=motion>travelDistance;
					x=returning?(travelDistance*2-motion):motion;
				}
				var groundY=Math.max(0,height-drawHeight-12);
				var groundOffset=(i%3)*4;
				var y=Math.max(0,groundY+groundOffset+Math.sin((Game.T+i*17)*0.05)*2);
				// The source sprites face left. Mirror only while traveling right;
				// idle cats stay unflipped and stationary.
				var movingRight=!idle && !returning;
				ctx.save();
				if (movingRight)
				{
					ctx.translate(Math.floor(x+drawWidth),0);
					ctx.scale(-1,1);
				}
				ctx.drawImage(sprite,frame*animation.width,0,animation.width,64,movingRight?0:Math.floor(x),Math.floor(y),drawWidth,drawHeight);
				ctx.restore();
			}
		};
		var catRow=l('row'+cats.id);
		var farmRow=l('row'+Game.Objects['Farm'].id);
		if (catRow && farmRow && farmRow.parentNode) farmRow.parentNode.insertBefore(catRow,farmRow);

}
