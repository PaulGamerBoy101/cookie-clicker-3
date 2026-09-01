/**
 * content/buildings/farm.ts — the Farm building declaration.
 *
 * Split from content/buildings.ts (pure move — same new Game.Object call,
 * same order position, same closures; only the file changed). Includes the
 * Garden minigame hookup and the custom barn-grid draw override that
 * follows the declaration.
 */
import type { Building, Game as EngineGame } from "../../types";
import { stackPosition, STACK_TARGET_H, STACK_OVERLAP } from "./stackDraw";

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

		// Override Farm draw to crop 64x80 cells from the 3x2 barn spritesheet
		// and stack them 1-per-row in a staggered, overlapping vertical column
		// (shared STACK layout) instead of the old horizontal grid.
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
				this.pics=[];//canvas re-sized: recompute centred positions next
				this.toResize=false;
			}
			var ctx=this.ctx;
			ctx.globalAlpha=1;
			if (typeof(this.art.bg)=='string') ctx.fillPattern(Pic(this.art.bg),0,0,this.canvas.width,this.canvas.height,128,128);
			var sheet=Pic(this.art.pic);
			// Rebuild pics if the sheet size changed since they were built
			// (the placeholder -> loaded race would otherwise leave stale, tiny
			// sprite dimensions on the surviving pics after a row-count shrink).
			if (sheet.width!==this._stackSheetW||sheet.height!==this._stackSheetH) {this.pics=[];this._stackSheetW=sheet.width;this._stackSheetH=sheet.height;}
			var scale=Math.min(1,STACK_TARGET_H/barnCellH);
			var drawW=barnCellW*scale;
			var drawH=barnCellH*scale;
			var canvasW=this.canvas.width;
			var canvasH=this.canvas.height;
			var vStep=Math.max(1,drawH*(1-STACK_OVERLAP));
			var maxRows=Math.max(1,Math.floor((canvasH-drawH)/vStep)+1);
			var iT=Math.min(this.amount,maxRows);
			var i=this.pics.length;
			if (i!=iT)
			{
				while (i<iT)
				{
					Math.seedrandom(Game.seed+' '+this.id+' '+i);
					var pos=stackPosition(i,canvasW,canvasH,drawW,drawH);
					var sx=(i%barnSheetCols)*barnCellW;
					var sy=(Math.floor(i/barnSheetCols)%barnSheetRows)*barnCellH;
					this.pics.push({x:Math.floor(pos.x),y:Math.floor(pos.y),z:pos.z,pic:this.art.pic,id:i,frame:0,sx:sx,sy:sy,drawW:drawW,drawH:drawH,born:Game.T});
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
				ctx.drawImage(sheet,pic.sx,pic.sy,barnCellW,barnCellH,pic.x,pic.y,pic.drawW,pic.drawH);
			}
			return true;
		};
	}
