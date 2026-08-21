/**
 * core/upgrade.ts — the engine's `Game.Upgrade` ctor + its 13 prototype
 * methods, now a real class (Phase 3, slice 3), plus the two
 * non-capturing factories `Game.TieredUpgrade` / `Game.SynergyUpgrade`.
 *
 * The 2.048 engine defined `Game.Upgrade` as a function expression in
 * `Game.Init` (engine lines 7,930–7,965 pre-slice) with 13 prototype
 * methods around it; content modules call `new Game.Upgrade(…)`. The
 * ctor body is verbatim (per-instance state assignments), the
 * prototype methods became class methods (verified unobservable:
 * no instanceof / for-in / Object.keys / `in` over upgrade
 * instances anywhere in src), and the engine assigns
 * `Game.Upgrade = Upgrade`, `Game.TieredUpgrade = TieredUpgrade`,
 * `Game.SynergyUpgrade = SynergyUpgrade` — same call sites, same
 * self-registration (`Game.last`, `Game.Upgrades`, `Game.UpgradesById`,
 * `Game.UpgradesN`). The interleaved `Game.storeBuyAll` and
 * `Game.vault=[]` statements stay in the engine in place.
 *
 * No runtime imports: `Game`, `loc`, `cap`, `EN`, `l`, `choose`,
 * `PlaySound`, `writeIcon` and the `order`/`pool`/`power` bridge vars
 * resolve through src/globals.d.ts to the engine's window shim
 * (the three bridge vars read the live engine vars through the
 * accessor bridge, exactly as the original Init-scoped reads did).
 */
import type { Building } from '../types';

export class Upgrade {
	[key: string]: any;

	/* --- data surface (the old `Upgrade` interface, now on the class) --- */
	declare id: number;
	declare name: string;
	declare dname: string;
	declare desc: string;
	declare baseDesc: string;
	declare ddesc?: string;
	declare basePrice: number;
	/* Never assigned by the ctor (upgrades price on the fly via
	 * getPrice/priceFunc); kept for contract parity with the old interface. */
	declare price: number;
	declare priceLumps: number;
	declare icon: number | number[];
	declare iconFunction: number | (() => number[]);
	declare buyFunction?: (() => void) | 0;
	declare unlockFunction?: (() => boolean) | 0;
	declare unlocked: number;
	declare bought: number;
	declare order: number;
	declare pool: string;
	declare tier?: number | string;
	/* The ctor initializes this to 0 ("none") before the factories may
	 * replace it with a Building — the old interface's optional
	 * Building | Upgrade never matched the 0 sentinel. */
	declare buildingTie: Building | Upgrade | 0;
	declare buildingTie1?: Building;
	declare buildingTie2?: Building;
	/** Desc override; CCSE (and the vanilla permanent-slot upgrades) may pass a context arg. */
	declare descFunc?: (context?: string) => string;
	/* The class body calls `this.priceFunc(this)` — the arg is real at
	 * runtime even when the classic closures ignore it; the optional
	 * param keeps both the 0-arg content closures and the call. */
	declare priceFunc?: (me?: Upgrade) => number;
	declare unshackleUpgrade?: string;
	declare vanilla: number;
	/* Ctor-assigned data the old interface left to the index signature;
	 * declared here so the contract is complete on the class. */
	declare power: number;
	declare unlockAt: number;
	declare techUnlock: unknown[];
	declare parents: unknown[];
	declare type: string;

	/* The original `Game.Upgrade=function(…) { … }` body, verbatim. */
	constructor(name: any, desc: any, price: any, icon: any, buyFunction?: any) {
			this.id=Game.UpgradesN;
			this.name=name;
			this.dname=this.name;
			this.desc=desc;
			this.baseDesc=this.desc;
			this.basePrice=price;
			this.priceLumps=0;//note : doesn't do much on its own, you still need to handle the buying yourself
			this.icon=icon;
			this.iconFunction=0;
			this.buyFunction=buyFunction;
			/*this.unlockFunction=unlockFunction;
			this.unlocked=(this.unlockFunction?0:1);*/
			this.unlocked=0;
			this.bought=0;
			this.order=this.id;
			if (order) this.order=order+this.id*0.001;
			this.pool='';//can be '', cookie, toggle, debug, prestige, prestigeDecor, tech, or unused
			if (pool) this.pool=pool;
			this.power=0;
			if (power) this.power=power;
			this.vanilla=Game.vanilla;
			this.unlockAt=0;
			this.techUnlock=[];
			this.parents=[];
			this.type='upgrade';
			this.tier=0;
			this.buildingTie=0;//of what building is this a tiered upgrade of ?
			
			Game.last=this;
			Game.Upgrades[this.name]=this;
			Game.UpgradesById[this.id]=this;
			Game.UpgradesN++;
			return this;
	}

	getType(){return 'Upgrade';}
	getPrice() {
			var price=this.basePrice;
			if (this.priceFunc) price=this.priceFunc(this);
			if (price==0) return 0;
			if (this.pool!='prestige')
			{
				if (Game.Has('Toy workshop')) price*=0.95;
				if (Game.Has('Five-finger discount')) price*=Math.pow(0.99,Game.Objects['Cursor'].amount/100);
				if (Game.Has('Santa\'s dominion')) price*=0.98;
				if (Game.Has('Faberge egg')) price*=0.99;
				if (Game.Has('Divine sales')) price*=0.99;
				if (Game.Has('Fortune #100')) price*=0.99;
				if (this.kitten && Game.Has('Kitten wages')) price*=0.9;
				if (Game.hasBuff('Haggler\'s luck')) price*=0.98;
				if (Game.hasBuff('Haggler\'s misery')) price*=1.02;
				//if (Game.hasAura('Master of the Armory')) price*=0.98;
				price*=1-Game.auraMult('Master of the Armory')*0.02;
				price*=Game.eff('upgradeCost');
				if (this.pool=='cookie' && Game.Has('Divine bakeries')) price/=5;
			}
			return Math.ceil(price);
	}
	canBuy() {
			if (this.canBuyFunc) return this.canBuyFunc();
			if (Game.cookies>=this.getPrice()) return true; else return false;
	}
	isVaulted() {
			if (Game.vault.indexOf(this.id)!=-1) return true; else return false;
	}
	vault() {
			if (!this.isVaulted()) Game.vault.push(this.id);
	}
	unvault() {
			if (this.isVaulted()) Game.vault.splice(Game.vault.indexOf(this.id),1);
	}
	click(e: any) {
			if ((e && e.shiftKey) || Game.keys[16])
			{
				if (this.pool=='toggle' || this.pool=='tech') {}
				else if (Game.Has('Inspired checklist'))
				{
					if (this.isVaulted()) this.unvault();
					else this.vault();
					Game.upgradesToRebuild=1;
					PlaySound('snd/tick.mp3');
				}
			}
			else this.buy();
	}
	buy(bypass?: any) {
			var success=0;
			var cancelPurchase: any=0;//the original reassigns a boolean into this 0-sentinel
			if (this.clickFunction && !bypass) cancelPurchase=!this.clickFunction();
			if (!cancelPurchase)
			{
				if (this.choicesFunction)
				{
					if (Game.choiceSelectorOn==this.id)
					{
						l('toggleBox').style.display='none';
						l('toggleBox').innerHTML='';
						Game.choiceSelectorOn=-1;
						PlaySound('snd/tickOff.mp3');
					}
					else
					{
						Game.choiceSelectorOn=this.id;
						var choices=this.choicesFunction();
						var str='';
						str+='<div class="close" onclick="Game.UpgradesById['+this.id+'].buy();">x</div>';
						str+='<h3>'+this.dname+'</h3>'+
						'<div class="line"></div>';
						if (typeof choices==='string')
						{
							str+=choices;
						}
						else if (choices.length>0)
						{
							var selected: any=0;//the for-in assigns the (string) index into this 0-sentinel
							for (var i in choices) {if (choices[i].selected) selected=i;}
							Game.choiceSelectorChoices=choices;//this is a really dumb way of doing this i am so sorry
							Game.choiceSelectorSelected=selected;
							str+='<h4 id="choiceSelectedName">'+choices[selected].name+'</h4>'+
							'<div class="line"></div>';
							
							for (var i in choices)
							{
								choices[i].id=i;
								choices[i].order=choices[i].order||0;
							}
							
							var sortMap=function(a: any,b: any)
							{
								if (a.order>b.order) return 1;
								else if (a.order<b.order) return -1;
								else return 0;
							}
							choices.sort(sortMap);
							
							for (var i2=0;i2<choices.length;i2++)//i2: original `i` — tsgo TS2403 vs the for-in `i` above
							{
								if (!choices[i2]) continue;
								var icon=choices[i2].icon;
								var id=choices[i2].id;
								if (choices[i2].div) str+='<div class="line"></div>';
								str+='<div class="crate noFrame enabled'+(id==selected?' highlighted':'')+'" style="opacity:1;float:none;display:inline-block;'+writeIcon(icon)+'" '+Game.clickStr+'="Game.UpgradesById['+this.id+'].choicesPick('+id+');Game.choiceSelectorOn=-1;Game.UpgradesById['+this.id+'].buy();" onMouseOut="l(\'choiceSelectedName\').innerHTML=Game.choiceSelectorChoices[Game.choiceSelectorSelected].name;" onMouseOver="l(\'choiceSelectedName\').innerHTML=Game.choiceSelectorChoices['+i2+'].name;"'+
								'></div>';
							}
						}
						l('toggleBox').innerHTML=str;
						l('toggleBox').style.display='block';
						l('toggleBox').focus();
						Game.tooltip.hide();
						PlaySound('snd/tick.mp3');
						success=1;
					}
				}
				else if (this.pool!='prestige')
				{
					var price=this.getPrice();
					if (this.canBuy() && !this.bought)
					{
						Game.Spend(price);
						this.bought=1;
						if (this.buyFunction) this.buyFunction();
						if (this.toggleInto)
						{
							Game.Lock(this.toggleInto);
							Game.Unlock(this.toggleInto);
						}
						Game.upgradesToRebuild=1;
						Game.recalculateGains=1;
						if (Game.CountsAsUpgradeOwned(this.pool)) Game.UpgradesOwned++;
						Game.setOnCrate(0);
						Game.tooltip.hide();
						PlaySound('snd/buy'+choose([1,2,3,4])+'.mp3',0.75);
						success=1;
					}
				}
				else
				{
					var price=this.getPrice();
					if (Game.heavenlyChips>=price && !this.bought)
					{
						Game.heavenlyChips-=price;
						Game.heavenlyChipsSpent+=price;
						this.unlocked=1;
						this.bought=1;
						if (this.buyFunction) this.buyFunction();
						Game.BuildAscendTree(this);
						PlaySound('snd/buy'+choose([1,2,3,4])+'.mp3',0.75);
						PlaySound('snd/shimmerClick.mp3');
						//PlaySound('snd/buyHeavenly.mp3');
						success=1;
					}
				}
			}
			if (this.bought && this.activateFunction) this.activateFunction();
			return success;
	}
	earn() { //just win the upgrades without spending anything
			this.unlocked=1;
			this.bought=1;
			if (this.buyFunction) this.buyFunction();
			Game.upgradesToRebuild=1;
			Game.recalculateGains=1;
			if (Game.CountsAsUpgradeOwned(this.pool)) Game.UpgradesOwned++;
	}
	unearn() { //remove the upgrade, but keep it unlocked
			this.bought=0;
			Game.upgradesToRebuild=1;
			Game.recalculateGains=1;
			if (Game.CountsAsUpgradeOwned(this.pool)) Game.UpgradesOwned--;
	}
	unlock() {
			this.unlocked=1;
			Game.upgradesToRebuild=1;
	}
	lose() {
			this.unlocked=0;
			this.bought=0;
			Game.upgradesToRebuild=1;
			Game.recalculateGains=1;
			if (Game.CountsAsUpgradeOwned(this.pool)) Game.UpgradesOwned--;
	}
	toggle() { //cheating only
			if (!this.bought)
			{
				this.bought=1;
				if (this.buyFunction) this.buyFunction();
				Game.upgradesToRebuild=1;
				Game.recalculateGains=1;
				if (Game.CountsAsUpgradeOwned(this.pool)) Game.UpgradesOwned++;
				PlaySound('snd/buy'+choose([1,2,3,4])+'.mp3',0.75);
				if (this.pool=='prestige' || this.pool=='debug') PlaySound('snd/shimmerClick.mp3');
			}
			else
			{
				this.bought=0;
				Game.upgradesToRebuild=1;
				Game.recalculateGains=1;
				if (Game.CountsAsUpgradeOwned(this.pool)) Game.UpgradesOwned--;
				PlaySound('snd/sell'+choose([1,2,3,4])+'.mp3',0.75);
				if (this.pool=='prestige' || this.pool=='debug') PlaySound('snd/shimmerClick.mp3');
			}
			if (Game.onMenu=='stats') Game.UpdateMenu();
	}
}

/**
 * The non-capturing tiered-upgrade factory (original engine line 8,369).
 * Verbatim body; `new Game.Upgrade` now targets the real class.
 */
export function TieredUpgrade(name: any, desc: any, building: any, tier: any): Upgrade {
			if (tier=='fortune' && building) desc=loc("%1 are <b>%2%</b> more efficient and <b>%3%</b> cheaper.",[cap(Game.Objects[building].plural),7,7])+desc;
			else desc=loc("%1 are <b>twice</b> as efficient.",cap(Game.Objects[building].plural))+desc;
			var upgrade=new Game.Upgrade(name,desc,Game.Objects[building].basePrice*Game.Tiers[tier].price,Game.GetIcon(building,tier));
			if (tier!='fortune')
			{
				upgrade.descFunc=function(){
					return ((Game.ascensionMode!=1 && Game.Has(this.buildingTie1!.unshackleUpgrade!) && Game.Has(Game.Tiers[this.tier!].unshackleUpgrade!))?('<div style="text-align:center;">'+loc("Unshackled! <b>+%1%</b> extra production.",Math.round(((this.buildingTie as any).id==1?0.5:(20-(this.buildingTie as any).id)*0.1)*100))+'</div><div class="line"></div>'):'')+this.ddesc as any;//ddesc is optional-typed; the original string-concats it unguarded
				};
			}
			
			Game.SetTier(building,tier);
			if (!upgrade.buildingTie1 && building) upgrade.buildingTie1=Game.Objects[building];
			if (tier=='fortune' && building) Game.Objects[building].fortune=upgrade;
			return upgrade;
}

/** The non-capturing synergy-upgrade factory (original engine line 8,386). */
export function SynergyUpgrade(name: any, desc: any, building1: any, building2: any, tier: any): Upgrade {
			/*
				creates a new upgrade that :
				-unlocks when you have tier.unlock of building1 and building2
				-is priced at (building1.price*10+building2.price*1)*tier.price (formerly : Math.sqrt(building1.price*building2.price)*tier.price)
				-gives +(0.1*building1)% cps to building2 and +(5*building2)% cps to building1
				-if building2 is below building1 in worth, swap them
			*/
			//if (Game.Objects[building1].basePrice>Game.Objects[building2].basePrice) {var temp=building2;building2=building1;building1=temp;}
			var b1=Game.Objects[building1];
			var b2=Game.Objects[building2];
			if (b1.basePrice>b2.basePrice) {b1=Game.Objects[building2];b2=Game.Objects[building1];}//swap
			
			desc=
				loc("%1 gain <b>+%2%</b> CpS per %3.",[cap(b1.plural),5,b2.single])+'<br>'+
				loc("%1 gain <b>+%2%</b> CpS per %3.",[cap(b2.plural),0.1,b1.single])+
				(EN?desc:'');
			var upgrade=new Game.Upgrade(name,desc,(b1.basePrice*10+b2.basePrice*1)*Game.Tiers[tier].price,Game.GetIcon(building1,tier));//Math.sqrt(b1.basePrice*b2.basePrice)*Game.Tiers[tier].price
			upgrade.tier=tier;
			upgrade.buildingTie1=b1;
			upgrade.buildingTie2=b2;
			upgrade.priceFunc=function(){return (this.buildingTie1!.basePrice*10+this.buildingTie2!.basePrice*1)*Game.Tiers[this.tier!].price*(Game.Has('Chimera')?0.98:1);};
			Game.Objects[building1].synergies.push(upgrade);
			Game.Objects[building2].synergies.push(upgrade);
			//Game.SetTier(building1,tier);
			return upgrade;
}
