/**
 * content/buildings/fractalengine.ts — the Fractal engine building declaration.
 *
 * Split from content/buildings.ts (pure move — same new Game.Object call,
 * same order position, same closures; only the file changed).
 * Includes the shrunk-store-name display tweak.
 */
import type { Building, Game as EngineGame } from "../../types";

/** Declare the Fractal engine building on Game. */
export function declareFractalEngine(Game: EngineGame) {

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
		
}
