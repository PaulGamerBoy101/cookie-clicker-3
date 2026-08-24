/**
 * content/buildings/mine.ts — the Mine building declaration.
 *
 * Split from content/buildings.ts (pure move — same new Game.Object call,
 * same order position, same closures; only the file changed). Includes the
 * custom mine-grid draw override (mirrored sprites + depth shading) that
 * follows the declaration.
 */
import type { Building, Game as EngineGame } from "../../types";

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
}
