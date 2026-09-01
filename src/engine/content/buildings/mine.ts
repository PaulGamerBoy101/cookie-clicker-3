/**
 * content/buildings/mine.ts — the Mine building declaration.
 *
 * Split from content/buildings.ts (pure move — same new Game.Object call,
 * same order position, same closures; only the file changed). Includes the
 * custom mine-grid draw override (mirrored sprites + depth shading) that
 * follows the declaration.
 */
import type { Building, Game as EngineGame } from "../../types";
import { stackPosition, stackDims, STACK_TARGET_H } from "./stackDraw";

/** Declare the Mine building on Game. */
export function declareMine(Game: EngineGame) {
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
		// CC3: same staggered, overlapping vertical-stack treatment as the farms,
		// on the shared STACK layout. Each mine is mirrored deterministically (the
		// classic entrance reads fine flipped) and back rows are shaded for depth.
		var mineObj=Game.Objects['Mine'];
		mineObj.draw=function(this: Building)
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
			var scale=Math.min(1,STACK_TARGET_H/sheet.height);
			var drawW=sheet.width*scale;
			var drawH=sheet.height*scale;
			var canvasW=this.canvas.width;
			var canvasH=this.canvas.height;
			var dims=stackDims(canvasW,canvasH,drawW,drawH);
			var iT=Math.min(this.amount,dims.perRow*dims.numRows);
			var i=this.pics.length;
			if (i!=iT)
			{
				while (i<iT)
				{
					Math.seedrandom(Game.seed+' '+this.id+' '+i);
					var pos=stackPosition(i,canvasW,canvasH,drawW,drawH);
					this.pics.push({x:Math.floor(pos.x),y:Math.floor(pos.y),z:pos.z,pic:this.art.pic,id:i,frame:0,flip:Math.random()<0.5,drawW:drawW,drawH:drawH,born:Game.T});
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
				// Back rows sit in the shade; front rows are fully lit.
				ctx.globalAlpha=Math.max(0.55,1-pic.id*0.12);
				if (pic.flip)
				{
					ctx.save();
					ctx.translate(pic.x+pic.drawW,pic.y);
					ctx.scale(-1,1);
					ctx.drawImage(sheet,0,0,pic.drawW,pic.drawH);
					ctx.restore();
				}
				else ctx.drawImage(sheet,pic.x,pic.y,pic.drawW,pic.drawH);
			}
			ctx.globalAlpha=1;
			return true;
		};
	}
