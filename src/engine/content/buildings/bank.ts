/**
 * content/buildings/bank.ts — the Bank building declaration.
 *
 * Split from content/buildings.ts (pure move — same new Game.Object call,
 * same order position, same closures; only the file changed). Includes the
 * Stock Market minigame hookup.
 */
import type { Building, Game as EngineGame } from "../../types";

/** Declare the Bank building on Game. */
export function declareBank(Game: EngineGame) {

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
		
}
