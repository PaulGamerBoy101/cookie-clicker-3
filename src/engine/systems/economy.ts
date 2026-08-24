/**
 * systems/economy.ts — the engine's economy-math system (Phase 4, slice 1).
 *
 * The 2.048 engine defined these six functions as function expressions
 * inside `Game.Init`; they are now typed exports and the engine keeps the
 * same `Game.X = X` slots at the exact original Init positions, so the
 * modding surface (`Game.HowMuchPrestige`, …) and every call site are
 * unchanged.
 *
 * Slice scope (all closure-free — they read only `Game` and window-shim
 * globals, no Init-scoped vars):
 *   - `HowMuchPrestige` / `HowManyCookiesReset` (engine ~3925–3933)
 *   - `EarnHeavenlyChips` (engine ~3935–3948)
 *   - `GetHeavenlyMultiplier` (engine ~3950–3971)
 *   - `ComputeCps` (engine ~7813–7817)
 *   - `GetTieredCpsMult` (engine ~8111–8136)
 *
 * Bodies are verbatim (original indentation kept) — only parameter
 * annotations were added. `silent?: any` on EarnHeavenlyChips is faithful:
 * call sites pass either nothing or `true`.
 *
 * No runtime imports: `Game`, `loc`, `LBeautify` resolve through
 * src/globals.d.ts to the engine's window shim.
 */
import type { Building } from '../types';

export function HowMuchPrestige(cookies: number)//how much prestige [cookies] should land you
		{
			return Math.pow(cookies/1000000000000,1/Game.HCfactor);
		}
export function HowManyCookiesReset(chips: number)//how many cookies [chips] are worth
		{
			//this must be the inverse of the above function (ie. if cookies=chips^2, chips=cookies^(1/2) )
			return Math.pow(chips,Game.HCfactor)*1000000000000;
		}
export function EarnHeavenlyChips(cookiesForfeited: number,silent?: any)
		{
			//recalculate prestige and chips owned
			var prestige=Math.floor(Game.HowMuchPrestige(Game.cookiesReset+cookiesForfeited));
			prestige=Math.max(0,prestige);
			if (prestige!=Game.prestige)//did we change prestige levels?
			{
				var prestigeDifference=prestige-Game.prestige;
				Game.gainedPrestige=prestigeDifference;
				Game.heavenlyChips+=prestigeDifference;
				Game.prestige=prestige;
				if (!silent && prestigeDifference>0) Game.Notify(loc("You forfeit your %1.",loc("%1 cookie",LBeautify(cookiesForfeited))),loc("You gain <b>%1</b>!",loc("%1 prestige level",LBeautify(prestigeDifference))),[19,7]);
			}
		}
export function GetHeavenlyMultiplier()
		{
			var heavenlyMult=0;
			if (Game.Has('Heavenly chip secret')) heavenlyMult+=0.05;
			if (Game.Has('Heavenly cookie stand')) heavenlyMult+=0.20;
			if (Game.Has('Heavenly bakery')) heavenlyMult+=0.25;
			if (Game.Has('Heavenly confectionery')) heavenlyMult+=0.25;
			if (Game.Has('Heavenly key')) heavenlyMult+=0.25;
			//if (Game.hasAura('Dragon God')) heavenlyMult*=1.05;
			heavenlyMult*=1+Game.auraMult('Dragon God')*0.05;
			if (Game.Has('Lucky digit')) heavenlyMult*=1.01;
			if (Game.Has('Lucky number')) heavenlyMult*=1.01;
			if (Game.Has('Lucky payout')) heavenlyMult*=1.01;
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('creation');
				if (godLvl==1) heavenlyMult*=0.7;
				else if (godLvl==2) heavenlyMult*=0.8;
				else if (godLvl==3) heavenlyMult*=0.9;
			}
			return heavenlyMult;
		}

export function ComputeCps(base: number,mult: number,bonus?: number)
		{
			if (!bonus) bonus=0;
			return ((base)*(Math.pow(2,mult))+bonus);
		}

export function GetTieredCpsMult(me: Building)
		{
			var mult=1;
			for (var i in me.tieredUpgrades)
			{
				if (!Game.Tiers[me.tieredUpgrades[i].tier!].special && Game.Has(me.tieredUpgrades[i].name))
				{
					var tierMult=2;
					//unshackled
					if (Game.ascensionMode!=1 && Game.Has(me.unshackleUpgrade!) && Game.Has(Game.Tiers[me.tieredUpgrades[i].tier!].unshackleUpgrade!)) tierMult+=me.id==1?0.5:(20-me.id)*0.1;
					mult*=tierMult;
				}
			}
			for (var i in me.synergies)
			{
				var syn=me.synergies[i];
				if (Game.Has(syn.name))
				{
					if (syn.buildingTie1!.name==me.name) mult*=(1+0.05*syn.buildingTie2!.amount);
					else if (syn.buildingTie2!.name==me.name) mult*=(1+0.001*syn.buildingTie1!.amount);
				}
			}
			if (me.fortune && Game.Has((me.fortune as any).name)) mult*=1.07;
			if (me.grandma && Game.Has(me.grandma.name)) mult*=(1+Game.Objects['Grandma'].amount*0.01*(1/(me.id-1)));
			if (me.cat && Game.Has(me.cat.name)) mult*=(1+Game.Objects['Cats'].amount*0.01*(1/(me.id-1)));
			return mult;
		}
