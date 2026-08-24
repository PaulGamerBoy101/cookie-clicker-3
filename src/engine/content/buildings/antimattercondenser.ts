/**
 * content/buildings/antimattercondenser.ts — the Antimatter condenser building declaration.
 *
 * Split from content/buildings.ts (pure move — same new Game.Object call,
 * same order position, same closures; only the file changed).
 * Includes the shrunk-store-name display tweak.
 */
import type { Building, Game as EngineGame } from "../../types";

/** Declare the Antimatter condenser building on Game. */
export function declareAntimatterCondenser(Game: EngineGame) {

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
}
