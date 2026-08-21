/**
 * core/achievement.ts — the engine's `Game.Achievement` ctor + its two
 * prototype methods, now a real class (Phase 3, slice 4), plus the four
 * non-capturing factories (`Game.TieredAchievement`,
 * `Game.ProductionAchievement`, `Game.BankAchievement`,
 * `Game.CpsAchievement`).
 *
 * The 2.048 engine defined `Game.Achievement` as a function expression
 * in `Game.Init` with `getType`/`toggle` prototype methods; the Phase 2
 * slice moved the definition (and its call sites) to
 * `content/achievements.ts`, and this slice moves it again — to a real
 * class. The ctor body is verbatim (per-instance state assignments,
 * including the per-instance `click` closure), the prototype methods
 * became class methods (verified unobservable: no instanceof / for-in /
 * Object.keys / `in` over achievement instances anywhere in src), and
 * `content/achievements.ts` now assigns `Game.Achievement =
 * Achievement` and the four `Game.X = X` factory lines at the same
 * Init point, so the self-registration (`Game.last`,
 * `Game.Achievements`, `Game.AchievementsById`, `Game.AchievementsN`),
 * the `order` bridge read, and every declaration order/id are
 * unchanged. `Game.Win` / `Game.RemoveAchiev` /
 * `Game.CountsAsAchievementOwned` / `Game.HasAchiev` /
 * `Game.thresholdIcons` and the Bank/Cps registries stay in the content
 * module in place (the factories read them through `Game`, exactly as
 * the original Init-scoped closures did).
 *
 * No runtime imports: `Game`, `loc`, `LBeautify`, `toFixed` and the
 * `order` bridge var resolve through src/globals.d.ts to the engine's
 * window shim (the bridge var reads the live engine var through the
 * accessor bridge, exactly as the content module's bare read did).
 */
import type { Building } from '../types';

export class Achievement {
	[key: string]: any;

	/* --- data surface (the old `Achievement` interface, now on the class) --- */
	declare id: number;
	declare name: string;
	declare dname: string;
	declare desc: string;
	declare baseDesc: string;
	declare ddesc?: string;
	declare icon: number | number[];
	declare won: number;
	declare order: number;
	declare pool: string;
	declare buildingTie?: Building;
	declare tier?: number;
	declare threshold?: number;
	declare vanilla: number;
	/* Ctor-assigned data the old interface left to the index signature;
	 * declared here so the contract is complete on the class. */
	declare disabled: number;
	declare type: string;

	/* The original `Game.Achievement=function(…) { … }` body, verbatim.
	 * (The Phase-2 `this: any` param annotation is dropped — it existed
	 * because tsgo inferred a container `this` for the assigned function
	 * expression; a real ctor's `this` is the class instance.) */
	constructor(name: any, desc: any, icon: any) {
			this.id=Game.AchievementsN;
			this.name=name;
			this.dname=this.name;
			this.desc=desc;
			this.baseDesc=this.desc;
			this.icon=icon;
			this.won=0;
			this.disabled=0;
			this.order=this.id;
			if (order) this.order=order+this.id*0.001;
			this.pool='normal';
			this.vanilla=Game.vanilla;
			this.type='achievement';
			
			this.click=function()
			{
				if (this.clickFunction) this.clickFunction();
			}
			Game.last=this;
			Game.Achievements[this.name]=this;
			Game.AchievementsById[this.id]=this;
			Game.AchievementsN++;
			return this;
	}

	getType() {return 'Achievement';}
	toggle() { //cheating only
			if (!this.won)
			{
				Game.Win(this.name);
			}
			else
			{
				Game.RemoveAchiev(this.name);
			}
			if (Game.onMenu=='stats') Game.UpdateMenu();
	}
}

/**
 * The non-capturing tiered-achievement factory (content-file line 129).
 * Verbatim body; the Phase-2 `achievUnlock!` assertion is kept.
 */
export function TieredAchievement(name: any, desc: any, building: any, tier: any): Achievement {
			var achiev=new Game.Achievement(name,loc("Have <b>%1</b>.",loc("%1 "+Game.Objects[building].bsingle,LBeautify(Game.Tiers[tier].achievUnlock!)))+desc,Game.GetIcon(building,tier));
			Game.SetTier(building,tier);
			return achiev;
}

/** The non-capturing production-achievement factory (content-file line 136). */
export function ProductionAchievement(name: any, building: any, tier: any, q?: any, mult?: any): Achievement {
			var obj=Game.Objects[building];
			var icon=[obj.iconColumn,22];
			var n=12+obj.n+(mult||0);
			if (tier==2) {icon[1]=23;n+=7;}
			else if (tier==3) {icon[1]=24;n+=14;}
			var pow=Math.pow(10,n);
			var achiev=new Game.Achievement(name,loc("Make <b>%1</b> just from %2.",[loc("%1 cookie",{n:pow,b:toFixed(pow)}),obj.plural])+(q?'<q>'+q+'</q>':''),icon);
			obj.productionAchievs.push({pow:pow,achiev:achiev});
			return achiev;
}

/** The non-capturing bank-achievement factory (content-file line 151). */
export function BankAchievement(name: any, q?: any): Achievement {
			var threshold=Math.pow(10,Math.floor(Game.BankAchievements.length*1.5+2));
			if (Game.BankAchievements.length==0) threshold=1;
			var achiev=new Game.Achievement(name,loc("Bake <b>%1</b> in one ascension.",loc("%1 cookie",{n:threshold,b:toFixed(threshold)}))+(q?('<q>'+q+'</q>'):''),[Game.thresholdIcons[Game.BankAchievements.length],(Game.BankAchievements.length>43?2:Game.BankAchievements.length>32?1:Game.BankAchievements.length>23?2:5)]);
			achiev.threshold=threshold;
			achiev.order=100+Game.BankAchievements.length*0.01;
			Game.BankAchievements.push(achiev);
			return achiev;
}

/** The non-capturing cps-achievement factory (content-file line 162). */
export function CpsAchievement(name: any, q?: any): Achievement {
			var threshold=Math.pow(10,Math.floor(Game.CpsAchievements.length*1.2));
			//if (Game.CpsAchievements.length==0) threshold=1;
			var achiev=new Game.Achievement(name,loc("Bake <b>%1</b> per second.",loc("%1 cookie",{n:threshold,b:toFixed(threshold)}))+(q?('<q>'+q+'</q>'):''),[Game.thresholdIcons[Game.CpsAchievements.length],(Game.CpsAchievements.length>43?2:Game.CpsAchievements.length>32?1:Game.CpsAchievements.length>23?2:5)]);
			achiev.threshold=threshold;
			achiev.order=200+Game.CpsAchievements.length*0.01;
			Game.CpsAchievements.push(achiev);
			return achiev;
}
