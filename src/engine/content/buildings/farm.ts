/**
 * content/buildings/farm.ts — the Farm building declaration.
 *
 * Split from content/buildings.ts (pure move — same new Game.Object call,
 * same order position, same closures; only the file changed). Includes the
 * Garden minigame hookup and the custom barn-grid draw override that
 * follows the declaration.
 */
import type { Building, Game as EngineGame } from "../../types";

/** Declare the Farm building on Game. */
export function declareFarm(Game: EngineGame) {
		new Game.Object('Farm','farm|farms|harvested|[X] more acre|[X] more acres','Grows cookie plants from cookie seeds.',3,2,{pic:'img/barns.png',bg:'farmBackground.webp',xV:3,yV:2,w:64,rows:2,x:0,y:16},500,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
			if (this.amount>=Game.SpecialCatUnlock && Game.Objects['Cats'].amount>0 && this.cat) Game.Unlock(this.cat!.name);
			if (this.amount>=25) Game.Win('Barnstormer');
			if (this.amount>=100) Game.Win('A field of dreams');
		});
		Game.last.minigameUrl='minigameGarden.js';
		Game.last.minigameName=loc("Garden");

		// Override Farm draw to crop 64x80 cells from the 3x2 barn
		// spritesheet instead of drawing the full sheet, and scale them
		// down so multiple farms overlap nicely in the 128px canvas.
		var farmObj=Game.Objects['Farm'];
		var barnCellW=64;
		var barnCellH=80;
		var barnSheetCols=3;
		var barnSheetRows=2;
		farmObj.draw=function(this: Building)
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
			// Mine-like barn layout: a neat grid on the canvas — columns spaced
			// just past the barn width (barely touching, like the mines' 64px
			// column grid) and as many rows as fit the box height, instead of
			// the old hStep=20 layout where barns overlapped by ~two-thirds.
			var canvasW=this.canvas.width;
			var canvasH=this.canvas.height;
			// Keep barns at a nice visible size
			var barnW=55;
			var barnH=Math.floor(barnW*barnCellH/barnCellW); // ~69px
			// Horizontal step: barn width + small gap (mine-like column spacing)
			var hStep=barnW+6;
			// How many fit in one row across the full canvas width
			var perRow=Math.max(1,Math.floor((canvasW-barnW)/hStep)+1);
			// Vertical step between rows: ~30px, mine-like depth overlap
			var vStep=30;
			// Only rows that fit the canvas are drawn (extra purchases cycle the
			// barn colors across the same visible grid, exactly like the mines)
			var numRows=Math.max(1,Math.floor((canvasH-barnH-4)/vStep)+1);
			// Bottom-anchored: front row at bottom, back rows higher
			var yBase=canvasH-barnH-2;
			var iT=Math.min(this.amount,perRow*numRows);
			var i=this.pics.length;
			if (i!=iT)
			{
				while (i<iT)
				{
					Math.seedrandom(Game.seed+' '+this.id+' '+i);
					var row=Math.floor(i/perRow);
					var col=i%perRow;
					var sx=(i%barnSheetCols)*barnCellW;
					var sy=(Math.floor(i/barnSheetCols)%barnSheetRows)*barnCellH;
					// X spans the full canvas width; back rows shift slightly for depth
					var x=col*hStep+Math.floor((Math.random()-0.5)*12);
					// Back rows are higher (smaller y); z = y so back barns draw first
					var y=yBase-row*vStep+Math.floor((Math.random()-0.5)*6);
					this.pics.push({x:x,y:y,z:y,pic:this.art.pic,id:i,frame:0,sx:sx,sy:sy,born:Game.T});
					i++;
				}
				while (i>iT)//sold farms leave the box, like the vanilla draw
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
				ctx.drawImage(sheet,pic.sx,pic.sy,barnCellW,barnCellH,pic.x,pic.y,barnW,barnH);
			}
		};
}
