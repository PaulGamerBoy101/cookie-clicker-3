/**
 * content/buildings/cats.ts — the Cats building declaration (CC3 content).
 *
 * Split from content/buildings.ts (pure move — same new Game.Object call,
 * same order position, same closures; only the file changed). Includes the
 * animation sheets, the custom cat-room draw override (with its 50-sprite
 * cap) and the store-row reposition that places Cats between Grandma and
 * Farm.
 *
 * Cats stays declared LAST: Game.Objects key order is the building save
 * index, so appending Cats at the end keeps every pre-Cats building at its
 * original save index. Never move this declaration earlier.
 */
import type { Building, Game as EngineGame } from "../../types";

/** Declare the Cats building on Game (must stay last in declaration order). */
export function declareCats(Game: EngineGame) {


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
