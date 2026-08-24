/**
 * content/buildings/ — the vanilla building declarations, one file per
 * building (plus remaining.ts while the split is in progress).
 *
 * Ported verbatim from the 2.048 engine (engine/main.ts, the //define objects
 * block inside Game.Init). This is the architectural rewrite's typed content
 * layer: the same `new Game.Object` calls, in the same order, with the same
 * CpS/buy closures — only the file moved, and every closure is now typed.
 *
 * The engine calls declareVanillaBuildings(Game) from Game.Init (which the
 * asset-Loader guarantees runs exactly once per page load), so the closures
 * capture the same Game object the original bare-global references resolved to.
 *
 * CALL ORDER IS LOAD-BEARING: Game.Objects key order is the building save
 * index (Cats is appended last on purpose, so old saves keep every existing
 * building at its original index), and the per-building blocks rely on
 * `Game.last` plus previously declared buildings. Never reorder the calls
 * below without checking save compatibility.
 */
import type { Game as EngineGame } from "../../types";
import { declareCursor } from "./cursor";
import { declareGrandma } from "./grandma";
import { declareFarm } from "./farm";
import { declareMine } from "./mine";
import { declareFactory } from "./factory";
import { declareBank } from "./bank";
import { declareTemple } from "./temple";
import { declareWizardTower } from "./wizardtower";
import { declareShipment } from "./shipment";
import { declareAlchemyLab } from "./alchemylab";
import { declarePortal } from "./portal";
import { declareTimeMachine } from "./timemachine";
import { declareAntimatterCondenser } from "./antimattercondenser";
import { declarePrism } from "./prism";
import { declareChancemaker } from "./chancemaker";
import { declareRemaining } from "./remaining";

/** Declare the 20 vanilla buildings (and their per-building extras) on Game. */
export function declareVanillaBuildings(Game: EngineGame) {
	declareCursor(Game);
	declareGrandma(Game);
	declareFarm(Game);
	declareMine(Game);
	declareFactory(Game);
	declareBank(Game);
	declareTemple(Game);
	declareWizardTower(Game);
	declareShipment(Game);
	declareAlchemyLab(Game);
	declarePortal(Game);
	declareTimeMachine(Game);
	declareAntimatterCondenser(Game);
	declarePrism(Game);
	declareChancemaker(Game);
	declareRemaining(Game);
}
