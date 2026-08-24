/**
 * content/buildings/temple.ts — the Temple building declaration.
 *
 * Split from content/buildings.ts (pure move — same new Game.Object call,
 * same order position, same closures; only the file changed). Includes the
 * Pantheon minigame hookup.
 */
import type { Building, Game as EngineGame } from "../../types";

/** Declare the Temple building on Game. */
export function declareTemple(Game: EngineGame) {

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
		
}
