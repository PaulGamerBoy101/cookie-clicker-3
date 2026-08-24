/**
 * content/buildings/cortexbaker.ts — the Cortex baker building declaration.
 *
 * Split from content/buildings.ts (pure move — same new Game.Object call,
 * same order position, same closures; only the file changed).
 */
import type { Building, Game as EngineGame } from "../../types";

/** Declare the Cortex baker building on Game. */
export function declareCortexBaker(Game: EngineGame) {

		new Game.Object('Cortex baker','cortex baker|cortex bakers|imagined|[X] extra IQ point|[X] extra IQ points','These artificial brains the size of planets are capable of simply dreaming up cookies into existence. Time and space are inconsequential. Reality is arbitrary.',19,34,{base:'cortex',xV:8,yV:96,w:48,rows:1,x:0,y:0,frames:4},12345678987654321,function (me: Building) {
			var mult=1;
			mult*=Game.GetTieredCpsMult(me);
			mult*=Game.magicCpS(me.name);
			return me.baseCps*mult;
		},function (this: Building) {
			Game.UnlockTiered(this);
			if (this.amount>=Game.SpecialGrandmaUnlock && Game.Objects['Grandma'].amount>0 && this.grandma) Game.Unlock(this.grandma!.name);
		});

}
