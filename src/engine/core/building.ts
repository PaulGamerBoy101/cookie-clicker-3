/**
 * core/building.ts — the engine's `Game.Object` ctor, now a real class
 * (Phase 3, slice 2).
 *
 * The 2.048 engine defined `Game.Object` as a 737-line function expression
 * inside `Game.Init` (engine lines 7,663–8,402 pre-slice); content modules
 * called it with `new Game.Object(…)`. It is now the `Building` class: the
 * ctor body is verbatim (the per-instance closures remain own-property
 * assignments, exactly as before), and the engine assigns
 * `Game.Object = Building` — same call sites, same instances, same
 * self-registration on `Game` (`Game.last`, `Game.Objects`, `Game.ObjectsById`,
 * `Game.ObjectsN`).
 *
 * Members declared with `declare` are erased by both tsgo and esbuild (no
 * `useDefineForClassFields` own-props), so the runtime instance shape is
 * byte-identical to the original plain object; the declarations exist so
 * checked code keeps the documented `Building` contract, which `types.ts`
 * now aliases to this class.
 *
 * Like all core modules this one has no *runtime* imports: `Game`, `loc`,
 * `l`, `EN`, `choose`, `Beautify`, `LBeautify`, `PlaySound`,
 * `FindLocStringByPart`, `writeIcon`, `Pic`, `Langs`, `locId` and
 * `TopBarOffset` all resolve through the ambient declarations in
 * src/globals.d.ts to the engine's window shim. The `import type` line is
 * erased at compile time (same treatment as the content modules' type
 * imports).
 */
import type { Art, Achievement, Upgrade } from '../types';

export class Building {
	[key: string]: any;

	/* --- data surface (the old `Building` interface, now on the class) --- */
	declare id: number;
	declare name: string;
	declare dname: string;
	declare displayName: string;
	declare single: string;
	declare plural: string;
	declare bsingle: string;
	declare bplural: string;
	declare actionName?: string;
	declare extraName?: string;
	declare extraPlural?: string;
	declare desc: string;
	declare baseDesc?: string;
	declare ddesc?: string;
	declare basePrice: number;
	declare price: number;
	declare bulkPrice: number;
	declare baseCps: number;
	/** CpS value, or a function evaluated as `me.cps(me)` for dynamic buildings. */
	declare cps: number | ((me: Building) => number);
	declare storedCps: number;
	declare storedTotalCps: number;
	declare totalCookies: number;
	declare amount: number;
	declare bought: number;
	declare highest: number;
	declare free: number;
	declare level: number;
	declare locked: number;
	declare unlocked: number;
	declare vanilla: number;
	declare n: number;
	declare icon: number;
	declare iconColumn: number;
	declare art: Art;
	declare iconFunc?: () => [number, number];
	declare buyFunction?: ((this: Building) => void) | 0;
	/* The engine assigns the canvas + context later (and the context carries
	 * the engine's own `fillPattern` polyfill method, which the standard
	 * CanvasRenderingContext2D type does not have), so both are left untyped
	 * here instead of pretending the lib type is complete. */
	declare canvas: any;
	declare ctx: any;
	declare pics: unknown[];
	declare mouseOn: boolean;
	declare mousePos: number[];
	/* The ctor initializes it to `false`; the engine and the extras mod
	 * assign 0/1 — the old interface's bare `number` never matched the ctor. */
	declare muted: boolean | number;
	declare sellFunction?: (() => void) | 0;
	declare tieredUpgrades: Record<number | string, Upgrade>;
	declare tieredAchievs: Record<number | string, Achievement>;
	declare productionAchievs: { pow: number; achiev: Achievement }[];
	declare synergies: Upgrade[];
	declare fortune: number | Upgrade;
	declare grandma?: Upgrade;
	declare cat?: Upgrade;
	declare levelAchiev10?: Achievement;
	declare minigameUrl: string | 0;
	declare minigameName: string | 0;
	declare onMinigame: boolean;
	declare minigameLoaded: boolean;
	declare minigameLoading: boolean;
	/* The loaded minigame instance (an object owned by the minigame module,
	 * with its own full surface: computeStepT, computeMapBounds, …). */
	declare minigame?: any;
	declare eachFrame: number;

	/* --- method surface (per-instance closures assigned in the ctor;
	 * `declare` on a method element is rejected by tsgo (TS1031), so the
	 * contract is carried as erased function-typed properties) --- */
	declare buy: (amount?: number) => number | undefined;
	declare sell: (amount?: number, silent?: number) => number | undefined;
	/* `n` is optional at runtime: the engine's own call sites (buy, sell,
	 * sacrifice, refresh) invoke `this.getPrice()` with no argument — the
	 * old interface's required param never matched that. */
	declare getPrice: (n?: number) => number;
	declare getSumPrice: (amount: number) => number;
	declare switchMinigame: (on: number | boolean) => void;
	declare refresh: () => void;
	declare redraw: () => void;
	declare mute: (n: number) => void;
	declare getBounds: () => { left: number; top: number; width: number; height: number };

	/* The original `Game.Object=function(…) { … }` body, verbatim. */
	constructor(name: any, commonName: any, desc: any, icon: any, iconColumn: any, art: any, price: any, cps: any, buyFunction?: any) {
			this.id=Game.ObjectsN;
			this.name=name;
			this.dname=name;
			this.displayName=this.name;
			commonName=commonName.split('|');
			this.single=commonName[0];
			this.plural=commonName[1];
			this.bsingle=this.single;this.bplural=this.plural;//store untranslated as we use those too
			this.actionName=commonName[2];
			this.extraName=commonName[3];
			this.extraPlural=commonName[4];
			this.desc=desc;
			if (true)//if (EN)
			{
				this.dname=loc(this.name);
				this.single=loc(this.single);
				this.plural=loc(this.plural);
				this.desc=loc(FindLocStringByPart(this.name+' quote'));
			}
			this.basePrice=price;
			this.price=this.basePrice;
			this.bulkPrice=this.price;
			this.cps=cps;
			this.baseCps=this.cps as any; // the original mirrors cps 1:1 (a function for dynamic n=0 buildings like Cursor); baseCps's declared type stays the documented contract
			this.mouseOn=false;
			this.mousePos=[-100,-100];
			this.productionAchievs=[];
			
			this.n=this.id;
			if (this.n!=0)
			{
				//new automated price and CpS curves
				//this.baseCps=Math.ceil(((this.n*0.5)*Math.pow(this.n*1,this.n*0.9))*10)/10;
				//this.baseCps=Math.ceil((Math.pow(this.n*1,this.n*0.5+2.35))*10)/10;//by a fortunate coincidence, this gives the 3rd, 4th and 5th buildings a CpS of 10, 69 and 420
				this.baseCps=Math.ceil((Math.pow(this.n*1,this.n*0.5+2))*10)/10;//0.45 used to be 0.5
				//this.baseCps=Math.ceil((Math.pow(this.n*1,this.n*0.45+2.10))*10)/10;
				//clamp 14,467,199 to 14,000,000 (there's probably a more elegant way to do that)
				var digits=Math.pow(10,(Math.ceil(Math.log(Math.ceil(this.baseCps))/Math.LN10)))/100;
				this.baseCps=Math.round(this.baseCps/digits)*digits;
				
				this.basePrice=(this.n*1+9+(this.n<5?0:Math.pow(this.n-5,1.75)*5))*Math.pow(10,this.n)*(Math.max(1,this.n-14));
				//this.basePrice=(this.n*2.5+7.5)*Math.pow(10,this.n);
				var digits=Math.pow(10,(Math.ceil(Math.log(Math.ceil(this.basePrice))/Math.LN10)))/100;
				this.basePrice=Math.round(this.basePrice/digits)*digits;
				// CC3 rebalance: the 2.048 tail stacked an extra 10x per building
				// from id 16 on (driving Fractal engine -> Cortex baker price/CpS
				// to 10x-1000x off the midgame curve). The rebalanced base
				// prices in content/buildings.ts already walk the fitted curve,
				// so the stacking multipliers are removed.
				this.price=this.basePrice;
				this.bulkPrice=this.price;
			}
			
			this.totalCookies=0;
			this.storedCps=0;
			this.storedTotalCps=0;
			this.icon=icon;
			this.iconColumn=iconColumn;
			this.art=art;
			if (art.base)
			{art.pic=art.base+'.webp';art.bg=art.base+'Background.webp';}
			this.buyFunction=buyFunction;
			this.locked=1;
			this.level=0;
			this.vanilla=Game.vanilla;
			
			this.tieredUpgrades={};
			this.tieredAchievs={};
			this.synergies=[];
			this.fortune=0;
			
			this.amount=0;
			this.bought=0;
			this.highest=0;
			this.free=0;
			
			this.eachFrame=0;
			
			this.minigameUrl=0;//if this is defined, load the specified script if the building's level is at least 1
			this.minigameName=0;
			this.onMinigame=false;
			this.minigameLoaded=false;
			
			this.switchMinigame=function(on: any)//change whether we're on the building's minigame
			{
				if (!Game.isMinigameReady(this)) on=false;
				if (on==-1) on=!this.onMinigame;
				this.onMinigame=on;
				if (this.id!=0)
				{
					if (this.onMinigame)
					{
						l('row'+this.id).classList.add('onMinigame');
						//l('rowSpecial'+this.id).style.display='block';
						//l('rowCanvas'+this.id).style.display='none';
						if (this.minigame.onResize) this.minigame.onResize();
					}
					else
					{
						l('row'+this.id).classList.remove('onMinigame');
						//l('rowSpecial'+this.id).style.display='none';
						//l('rowCanvas'+this.id).style.display='block';
					}
				}
				this.refresh();
			}
			
			this.getPrice=function(_n: any)
			{
				var price=this.basePrice*Math.pow(Game.priceIncrease,Math.max(0,this.amount-this.free));
				price=Game.modifyBuildingPrice(this,price);
				return Math.ceil(price);
			}
			this.getSumPrice=function(amount: any)//return how much it would cost to buy [amount] more of this building
			{
				var price=0;
				for (var i=Math.max(0,this.amount);i<Math.max(0,(this.amount)+amount);i++)
				{
					price+=this.basePrice*Math.pow(Game.priceIncrease,Math.max(0,i-this.free));
				}
				price=Game.modifyBuildingPrice(this,price);
				return Math.ceil(price);
			}
			this.getReverseSumPrice=function(amount: any)//return how much you'd get from selling [amount] of this building
			{
				var price=0;
				for (var i=Math.max(0,(this.amount)-amount);i<Math.max(0,this.amount);i++)
				{
					price+=this.basePrice*Math.pow(Game.priceIncrease,Math.max(0,i-this.free));
				}
				price=Game.modifyBuildingPrice(this,price);
				price*=this.getSellMultiplier();
				return Math.ceil(price);
			}
			this.getSellMultiplier=function()
			{
				var giveBack=0.25;
				//if (Game.hasAura('Earth Shatterer')) giveBack=0.5;
				giveBack*=1+Game.auraMult('Earth Shatterer');
				return giveBack;
			}
			
			this.buy=function(amount: any)
			{
				if (Game.buyMode==-1) {this.sell(Game.buyBulk,1);return 0;}
				//CC3: Monoculture challenge — only the locked building type may be bought
				if (Game.ascensionMode==4 && Game.monoBuilding!==null && Game.monoBuilding!==this.id)
				{
					PlaySound('snd/error1.mp3',0.5);
					return 0;
				}
				var success=0;
				var moni=0;
				var bought=0;
				if (!amount) amount=Game.buyBulk;
				if (amount==-1) amount=1000;
				for (var i=0;i<amount;i++)
				{
					var price=this.getPrice();
					if (Game.cookies>=price)
					{
						bought++;
						moni+=price;
						Game.Spend(price);
						this.amount++;
						this.bought++;
						//CC3: Monoculture challenge — first successful purchase locks the building type
						if (Game.ascensionMode==4 && Game.monoBuilding===null) Game.monoBuilding=this.id;
						price=this.getPrice();
						this.price=price;
						if (this.buyFunction) this.buyFunction();
						Game.recalculateGains=1;
						if (this.amount==1 && this.id!=0) l('row'+this.id).classList.add('enabled');
						this.highest=Math.max(this.highest,this.amount);
						Game.BuildingsOwned++;
						success=1;
					}
				}
				if (success) {PlaySound('snd/buy'+choose([1,2,3,4])+'.mp3',0.75);PlaySound('snd/confirm1.mp3',0.25);//CC3: interface confirm tone layered under the buy sound
				this.refresh();}
				else if (Game.buyMode!=-1) {PlaySound('snd/error1.mp3',0.5);}//CC3: interface error tone when nothing could be bought (can't afford)
				//if (moni>0 && amount>1) Game.Notify(this.name,'Bought <b>'+bought+'</b> for '+Beautify(moni)+' cookies','',2);
			}
			this.sell=function(amount: any,_bypass: any)
			{
				var success=0;
				var moni=0;
				var sold=0;
				if (amount==-1) amount=this.amount;
				if (!amount) amount=Game.buyBulk;
				for (var i=0;i<amount;i++)
				{
					var price=this.getPrice();
					var giveBack=this.getSellMultiplier();
					price=Math.floor(price*giveBack);
					if (this.amount>0)
					{
						sold++;
						moni+=price;
						Game.cookies+=price;
						Game.cookiesEarned=Math.max(Game.cookies,Game.cookiesEarned);//this is to avoid players getting the cheater achievement when selling buildings that have a higher price than they used to
						this.amount--;
						price=this.getPrice();
						this.price=price;
						if (this.sellFunction) this.sellFunction();
						Game.recalculateGains=1;
						if (this.amount==0 && this.id!=0) l('row'+this.id).classList.remove('enabled');
						Game.BuildingsOwned--;
						success=1;
					}
				}
				if (success && Game.hasGod)
				{
					var godLvl=Game.hasGod('ruin');
					var old=Game.hasBuff('Devastation');
					if (old)
					{
						if (godLvl==1) old.multClick+=sold*0.01;
						else if (godLvl==2) old.multClick+=sold*0.005;
						else if (godLvl==3) old.multClick+=sold*0.0025;
					}
					else
					{
						if (godLvl==1) Game.gainBuff('devastation',10,1+sold*0.01);
						else if (godLvl==2) Game.gainBuff('devastation',10,1+sold*0.005);
						else if (godLvl==3) Game.gainBuff('devastation',10,1+sold*0.0025);
					}
				}
				if (success && Game.shimmerTypes['golden'].n<=0 && Game.auraMult('Dragon Orbs')>0)
				{
					var highestBuilding: any=0;//the loop stores a building in it (the 0 is the "none" sentinel)
					for (var i2 in Game.Objects) {if (Game.Objects[i2].amount>0) highestBuilding=Game.Objects[i2];}//i2: original `i` — tsgo TS2403 vs the sell loop's numeric `var i`
					if (highestBuilding==this && Math.random()<Game.auraMult('Dragon Orbs')*0.1)
					{
						var buffsN=0;
						for (var _ii in Game.buffs){buffsN++;}
						if (buffsN==0)
						{
							new Game.shimmer('golden');
							Game.Notify(EN?'Dragon Orbs!':loc("Dragon Orbs"),loc("Wish granted. Golden cookie spawned."),[33,25]);
						}
					}
				}
				if (success) {PlaySound('snd/sell'+choose([1,2,3,4])+'.mp3',0.75);this.refresh();}
				//if (moni>0) Game.Notify(this.name,'Sold <b>'+sold+'</b> for '+Beautify(moni)+' cookies','',2);
			}
			this.sacrifice=function(amount: any)//sell without getting back any money
			{
				var success=0;
				//var moni=0;
				var sold=0;
				if (amount==-1) amount=this.amount;
				if (!amount) amount=1;
				for (var i=0;i<amount;i++)
				{
					var price=this.getPrice();
					price=Math.floor(price*0.5);
					if (this.amount>0)
					{
						sold++;
						//moni+=price;
						//Game.cookies+=price;
						//Game.cookiesEarned=Math.max(Game.cookies,Game.cookiesEarned);
						this.amount--;
						price=this.getPrice();
						this.price=price;
						if (this.sellFunction) this.sellFunction();
						Game.recalculateGains=1;
						if (this.amount==0 && this.id!=0) l('row'+this.id).classList.remove('enabled');
						Game.BuildingsOwned--;
						success=1;
					}
				}
				if (success) {this.refresh();}
				//if (moni>0) Game.Notify(this.name,'Sold <b>'+sold+'</b> for '+Beautify(moni)+' cookies','',2);
			}
			this.buyFree=function(amount: any)//unlike getFree, this still increases the price
			{
				for (var i=0;i<amount;i++)
				{
					if (Game.cookies>=price)
					{
						this.amount++;
						this.bought++;
						this.price=this.getPrice();
						Game.recalculateGains=1;
						if (this.amount==1 && this.id!=0) l('row'+this.id).classList.add('enabled');
						this.highest=Math.max(this.highest,this.amount);
						Game.BuildingsOwned++;
					}
				}
				this.refresh();
			}
			this.getFree=function(amount: any)//get X of this building for free, with the price behaving as if you still didn't have them
			{
				this.amount+=amount;
				this.bought+=amount;
				this.free+=amount;
				this.highest=Math.max(this.highest,this.amount);
				Game.BuildingsOwned+=amount;
				this.highest=Math.max(this.highest,this.amount);
				this.refresh();
			}
			this.getFreeRanks=function(amount: any)//this building's price behaves as if you had X less of it
			{
				this.free+=amount;
				this.refresh();
			}
			
			this.tooltip=function()
			{
				var me=this;
				var ariaText='';
				var desc=me.desc;
				var name=me.dname;
				if (Game.season=='fools')
				{
					if (!Game.foolObjects[me.name])
						{
							name=Game.foolObjects['Unknown'].name;
							desc=Game.foolObjects['Unknown'].desc;
					}
					else
					{
						name=Game.foolObjects[me.name].name;
						desc=Game.foolObjects[me.name].desc;
					}
				}
				var icon=[me.iconColumn,0];
				if (me.locked)
				{
					name='???';
					desc='???';
					icon=[0,7];
				}
				//if (l('rowInfo'+me.id) && Game.drawT%10==0) l('rowInfoContent'+me.id).innerHTML='&bull; '+me.amount+' '+(me.amount==1?me.single:me.plural)+'<br>&bull; producing '+Beautify(me.storedTotalCps,1)+' '+(me.storedTotalCps==1?'cookie':'cookies')+' per second<br>&bull; total : '+Beautify(me.totalCookies)+' '+(Math.floor(me.totalCookies)==1?'cookie':'cookies')+' '+me.actionName;
				
				var canBuy=false;
				var price=me.bulkPrice;
				if ((Game.buyMode==1 && Game.cookies>=price) || (Game.buyMode==-1 && me.amount>0)) canBuy=true;
				
				var synergiesStr='';
				//note : might not be entirely accurate, math may need checking
				if (me.amount>0)
				{
					var synergiesWith: any={};//string-keyed accumulation map
					var synergyBoost=0;
					
					if (me.name=='Grandma')
					{
						for (var i in Game.GrandmaSynergies)
						{
							if (Game.Has(Game.GrandmaSynergies[i]))
							{
								var other: any=Game.Upgrades[Game.GrandmaSynergies[i]].buildingTie;//buildingTie is optional-typed; the original derefs it unguarded
								var mult=me.amount*0.01*(1/(other.id-1));
								var boost=(other.storedTotalCps*Game.globalCpsMult)-(other.storedTotalCps*Game.globalCpsMult)/(1+mult);
								synergyBoost+=boost;
								if (!synergiesWith[other.plural]) synergiesWith[other.plural]=0;
								synergiesWith[other.plural]+=mult;
							}
						}
					}
					else if (me.name=='Cats')
					{
						for (var i in Game.CatSynergies)
						{
							if (Game.Has(Game.CatSynergies[i]))
							{
								var other: any=Game.Upgrades[Game.CatSynergies[i]].buildingTie;//same pattern as the Grandma branch above
								// Math.max(1,...): unlike GrandmaSynergies, CatSynergies includes
								// 'Kitten grandmas' tied to Grandma itself (id 1), where the plain
								// (id-1) divisor above would be 0 -> Infinity/NaN.
								var mult=me.amount*0.01*(1/Math.max(1,other.id-1));
								var boost=(other.storedTotalCps*Game.globalCpsMult)-(other.storedTotalCps*Game.globalCpsMult)/(1+mult);
								synergyBoost+=boost;
								if (!synergiesWith[other.plural]) synergiesWith[other.plural]=0;
								synergiesWith[other.plural]+=mult;
							}
						}
					}
					else if (me.name=='Portal' && Game.Has('Elder Pact'))
					{
						var other: any=Game.Objects['Grandma'];//same-scope redeclaration of the any-typed `other` above (tsgo TS2403 keeps them uniform)
						var boost=(me.amount*0.05*other.amount)*Game.globalCpsMult;
						synergyBoost+=boost;
						if (!synergiesWith[other.plural]) synergiesWith[other.plural]=0;
						synergiesWith[other.plural]+=boost/(other.storedTotalCps*Game.globalCpsMult);
					}
					
					for (var i in me.synergies)
					{
						var it=me.synergies[i];
						if (Game.Has(it.name))
						{
							var weight=0.05;
							var other: any=it.buildingTie1;//buildingTie1/2 are optional-typed; the original derefs them unguarded
							if (me==it.buildingTie1) {weight=0.001;other=it.buildingTie2;}
							var boost=(other.storedTotalCps*Game.globalCpsMult)-(other.storedTotalCps*Game.globalCpsMult)/(1+me.amount*weight);
							synergyBoost+=boost;
							if (!synergiesWith[other.plural]) synergiesWith[other.plural]=0;
							synergiesWith[other.plural]+=me.amount*weight;
						}
					}
					if (synergyBoost>0)
					{
						for (var i in synergiesWith)
						{
							if (synergiesStr!='') synergiesStr+=', ';
							synergiesStr+='<span style="color:#fff;font-weight:bold;font-size:80%;background:#000;box-shadow:0px 0px 0px 1px rgba(255,255,255,0.2);border-radius:3px;padding:0px 2px;display:inline-block;">'+i+' +'+Beautify(synergiesWith[i]*100,1)+'%</span>';
						}
						synergiesStr=loc("...also boosting some other buildings:")+' '+synergiesStr+' - '+loc("all combined, these boosts account for <b>%1</b> per second (<b>%2%</b> of total CpS)",[loc("%1 cookie",LBeautify(synergyBoost,1)),Beautify((synergyBoost/Game.cookiesPs)*100,1)]);
					}
				}
				
				if (Game.prefs.screenreader)
				{
					if (me.locked) ariaText='This building is not yet unlocked. ';
					else ariaText=name+'. ';
					if (!me.locked) ariaText+='You own '+me.amount+'. ';
					ariaText+=(canBuy?'Can buy 1 for':'Cannot afford the')+' '+Beautify(Math.round(price))+' cookies. ';
					if (!me.locked && me.totalCookies>0)
					{
						ariaText+='Each '+me.single+' produces '+Beautify((me.storedTotalCps/me.amount)*Game.globalCpsMult,1)+' cookies per second. ';
						ariaText+=Beautify(me.totalCookies)+' cookies '+me.actionName+' so far. ';
					}
					if (!me.locked) ariaText+=desc;
					
					var ariaLabel=l('ariaReader-product-'+(me.id));
					if (ariaLabel) ariaLabel.innerHTML=ariaText.replace(/(<([^>]+)>)/gi,' ');
				}
				
				return '<div style="position:absolute;left:1px;top:1px;right:1px;bottom:1px;background:linear-gradient(125deg,'+(false?'rgba(15,115,130,1) 0%,rgba(15,115,130,0)':'rgba(50,40,40,1) 0%,rgba(50,40,40,0)')+' 20%);mix-blend-mode:screen;z-index:1;"></div><div style="z-index:10;min-width:350px;padding:8px;position:relative;" id="tooltipBuilding"><div class="icon" style="float:left;margin-left:-8px;margin-top:-8px;'+writeIcon(icon)+'"></div><div style="float:right;text-align:right;"><span class="price'+(canBuy?'':' disabled')+'">'+Beautify(Math.round(price))+'</span>'+Game.costDetails(price)+'</div><div class="name">'+name+'</div>'+'<small><div class="tag">'+loc("owned: %1",me.amount)+'</div>'+(me.free>0?'<div class="tag">'+loc("free: %1!",me.free)+'</div>':'')+'</small>'+
				'<div class="line"></div><div class="description"><q>'+desc+'</q></div>'+
				(me.totalCookies>0?(
					'<div class="line"></div>'+
					(me.amount>0?'<div class="descriptionBlock">'+loc("each %1 produces <b>%2</b> per second",[me.single,loc("%1 cookie",LBeautify((me.storedTotalCps/me.amount)*Game.globalCpsMult,1))])+'</div>':'')+
					'<div class="descriptionBlock">'+loc("%1 producing <b>%2</b> per second",[loc("%1 "+me.bsingle,LBeautify(me.amount)),loc("%1 cookie",LBeautify(me.storedTotalCps*Game.globalCpsMult,1))])+' ('+loc("<b>%1%</b> of total CpS",Beautify(Game.cookiesPs>0?((me.amount>0?((me.storedTotalCps*Game.globalCpsMult)/Game.cookiesPs):0)*100):0,1))+')</div>'+
					(synergiesStr?('<div class="descriptionBlock">'+synergiesStr+'</div>'):'')+
					(EN?'<div class="descriptionBlock"><b>'+Beautify(me.totalCookies)+'</b> '+(Math.floor(me.totalCookies)==1?'cookie':'cookies')+' '+me.actionName+' so far</div>':'<div class="descriptionBlock">'+loc("<b>%1</b> produced so far",loc("%1 cookie",LBeautify(me.totalCookies)))+'</div>')
				):'')+
				'</div>';
			}
			this.levelTooltip=function()
			{
				var me=this;
				return '<div style="width:280px;padding:8px;" id="tooltipLevel"><b>'+loc("Level %1 %2",[Beautify(me.level),me.plural])+'</b><div class="line"></div>'+(EN?((me.level==1?me.extraName!:me.extraPlural!).replace('[X]',Beautify(me.level))+' granting <b>+'+Beautify(me.level)+'% '+me.dname+' CpS</b>.'):loc("Granting <b>+%1% %2 CpS</b>.",[Beautify(me.level),me.single]))+'<div class="line"></div>'+loc("Click to level up for %1.",'<span class="price lump'+(Game.lumps>=me.level+1?'':' disabled')+'">'+loc("%1 sugar lump",LBeautify(me.level+1))+'</span>')+((me.level==0 && me.minigameUrl)?'<div class="line"></div><b>'+loc("Levelling up this building unlocks a minigame.")+'</b>':'')+'</div>';
			}
			this.levelUp=function(me: any){
				return function(free: any){Game.spendLump(me.level+1,loc("level up your %1",me.plural),function()
				{
					me.level+=1;
					if (me.level>=10 && me.levelAchiev10) Game.Win(me.levelAchiev10.name);
					if (!free) PlaySound('snd/upgrade.mp3',0.6);
					Game.LoadMinigames();
					me.refresh();
					if (l('productLevel'+me.id)){var rect=l('productLevel'+me.id).getBounds();Game.SparkleAt((rect.left+rect.right)/2,(rect.top+rect.bottom)/2-24+32-TopBarOffset);}
					if (me.minigame && me.minigame.onLevel) me.minigame.onLevel(me.level);
				},free)();};
			}(this);
			
			this.refresh=function()//show/hide the building display based on its amount, and redraw it
			{
				this.price=this.getPrice();
				if (Game.buyMode==1) this.bulkPrice=this.getSumPrice(Game.buyBulk);
				else if (Game.buyMode==-1 && Game.buyBulk==-1) this.bulkPrice=this.getReverseSumPrice(1000);
				else if (Game.buyMode==-1) this.bulkPrice=this.getReverseSumPrice(Game.buyBulk);
				this.rebuild();
				if (this.amount==0 && this.id!=0) l('row'+this.id).classList.remove('enabled');
				else if (this.amount>0 && this.id!=0) l('row'+this.id).classList.add('enabled');
				//CC3: Monoculture challenge — grey out buildings that aren't the locked type
				if (Game.ascensionMode==4 && Game.monoBuilding!==null && Game.monoBuilding!==this.id && this.id!=0)
				{
					l('row'+this.id).classList.remove('enabled');
					if (l('product'+this.id)) l('product'+this.id).classList.add('disabled');
				}
				else if (l('product'+this.id)) l('product'+this.id).classList.remove('disabled');
				if ((this.muted as number)>0 && this.id!=0) {l('row'+this.id).classList.add('muted');l('mutedProduct'+this.id).style.display='inline-block';}//muted starts as the ctor's false; the engine assigns 0/1 — the original compared it to 0 either way
				else if (this.id!=0) {l('row'+this.id).classList.remove('muted');l('mutedProduct'+this.id).style.display='none';}
				//if (!this.onMinigame && !this.muted) {}
				//else this.pics=[];
			}
			this.rebuild=function()
			{
				var me=this;
				//var classes='product';
				var price=me.bulkPrice;
				/*if (Game.cookiesEarned>=me.basePrice || me.bought>0) {classes+=' unlocked';me.locked=0;} else {classes+=' locked';me.locked=1;}
				if (Game.cookies>=price) classes+=' enabled'; else classes+=' disabled';
				if (me.l.className.indexOf('toggledOff')!=-1) classes+=' toggledOff';
				*/
				var icon=[0,me.icon];
				var iconOff=[1,me.icon];
				if (me.iconFunc) icon=me.iconFunc();
				
				//var desc=me.desc; //dropped (write-only; its reads live in commented-out lines below)
				var name=me.dname;
				var displayName=me.displayName;
				if (Game.season=='fools')
				{
					if (!Game.foolObjects[me.name])
					{
						icon=[2,0];
						iconOff=[3,0];
						name=Game.foolObjects['Unknown'].name;
						//desc=Game.foolObjects['Unknown'].desc; //dropped (desc was write-only)
					}
					else
					{
						icon=[2,me.icon];
						iconOff=[3,me.icon];
						name=Game.foolObjects[me.name].name;
						//desc=Game.foolObjects[me.name].desc; //dropped (desc was write-only)
					}
					displayName=name;
					//if (name.length>16) displayName='<span style="font-size:75%;">'+name+'</span>';
				}
				else if (!EN) displayName=name;
				//else if (!EN && name.length>16) displayName='<span style="font-size:75%;">'+name+'</span>';
				icon=[icon[0]*64,icon[1]*64];
				iconOff=[iconOff[0]*64,iconOff[1]*64];
				
				//me.l.className=classes;
				//l('productIcon'+me.id).style.backgroundImage='url(img/'+icon+')';
				l('productIcon'+me.id).style.backgroundPosition='-'+icon[0]+'px -'+icon[1]+'px';
				//l('productIconOff'+me.id).style.backgroundImage='url(img/'+iconOff+')';
				l('productIconOff'+me.id).style.backgroundPosition='-'+iconOff[0]+'px -'+iconOff[1]+'px';
				var customStoreIcon=(me.art as any).storeIcon;
				if (customStoreIcon)
				{
					var customStoreSize=(me.art as any).storeIconSize||'48px 48px';
					//storeIconPosition centers multi-frame sheets whose frames are
					//wider than the 64px icon window (e.g. the Cats strips, 80px
					//frames) the same way the muted .catSleepIcon does.
					var customStorePosition=(me.art as any).storeIconPosition||'0px 0px';
					var customStoreUrl="url('"+customStoreIcon.replace(/'/g,"\\'")+"')";
					//pixelated keeps 2x-upscaled pixel-art strips (Cats) crisp
					//instead of bilinearly blurring them
					var customStoreImageRendering=(me.art as any).storeIconRendering||'pixelated';
					l('productIcon'+me.id).style.backgroundImage=customStoreUrl;
					l('productIconOff'+me.id).style.backgroundImage=customStoreUrl;
					l('productIcon'+me.id).style.backgroundSize=customStoreSize;
					l('productIconOff'+me.id).style.backgroundSize=customStoreSize;
					l('productIcon'+me.id).style.backgroundPosition=customStorePosition;
					l('productIconOff'+me.id).style.backgroundPosition=customStorePosition;
					l('productIcon'+me.id).style.imageRendering=customStoreImageRendering;
					l('productIconOff'+me.id).style.imageRendering=customStoreImageRendering;
				}
				l('productName'+me.id).innerHTML=displayName;
				if (name.length>12/Langs[locId].w && (Game.season=='fools' || !EN)) l('productName'+me.id).classList.add('longProductName'); else l('productName'+me.id).classList.remove('longProductName');
				l('productOwned'+me.id).textContent=me.amount?me.amount:'';
				l('productPrice'+me.id).textContent=Beautify(Math.round(price));
				l('productPriceMult'+me.id).textContent=(Game.buyBulk>1)?('x'+Game.buyBulk+' '):'';
				l('productLevel'+me.id).textContent='lvl '+Beautify(me.level);
				if (Game.isMinigameReady(me) && Game.ascensionMode!=1)
				{
					l('productMinigameButton'+me.id).style.display='block';
					if (!me.onMinigame) l('productMinigameButton'+me.id).textContent=loc("View %1",me.minigameName);
					else l('productMinigameButton'+me.id).textContent=loc("Close %1",me.minigameName);
				}
				else l('productMinigameButton'+me.id).style.display='none';
				if (Game.isMinigameReady(me) && Game.ascensionMode!=1 && me.minigame.dragonBoostTooltip && Game.hasAura('Supreme Intellect'))
				{
					l('productDragonBoost'+me.id).style.display='block';
				}
				else l('productDragonBoost'+me.id).style.display='none';
			}
			this.muted=false;
			this.mute=function(val: any)
			{
				if (this.id==0) return false;
				this.muted=val;
				if (val) {l('productMute'+this.id).classList.add('on');l('row'+this.id).classList.add('muted');l('mutedProduct'+this.id).style.display='inline-block';}
				else {l('productMute'+this.id).classList.remove('on');l('row'+this.id).classList.remove('muted');l('mutedProduct'+this.id).style.display='none';}
			};
			
			this.draw=function(){};
			
			var str='';
			if (this.id!=0) str+='<div class="row" id="row'+this.id+'"><div class="separatorBottom"></div>';
			str+='<div class="productButtons">';
				str+='<div id="productLevel'+this.id+'" class="productButton productLevel lumpsOnly" onclick="Game.ObjectsById['+this.id+'].levelUp()" '+Game.getDynamicTooltip('Game.ObjectsById['+this.id+'].levelTooltip','this')+'></div>';
				str+='<div id="productMinigameButton'+this.id+'" class="productButton productMinigameButton lumpsOnly" onclick="Game.ObjectsById['+this.id+'].switchMinigame(-1);PlaySound(Game.ObjectsById['+this.id+'].onMinigame?\'snd/clickOn2.mp3\':\'snd/clickOff2.mp3\');"></div>';
				if (this.id!=0) str+='<div class="productButton productMute" '+Game.getTooltip('<div style="width:150px;text-align:center;font-size:11px;" id="tooltipMuteBuilding"><b>'+loc("Mute")+'</b><br>('+loc("Minimize this building")+')</div>','this')+' onclick="Game.ObjectsById['+this.id+'].mute(1);PlaySound(Game.ObjectsById['+this.id+'].muted?\'snd/clickOff2.mp3\':\'snd/clickOn2.mp3\');" id="productMute'+this.id+'">'+loc("Mute")+'</div>';
				str+='<div id="productDragonBoost'+this.id+'" style="display:none;" class="productButton productDragonBoost" '+Game.getDynamicTooltip('function(){if (Game.ObjectsById['+this.id+'].minigame && Game.ObjectsById['+this.id+'].minigame.dragonBoostTooltip) return Game.ObjectsById['+this.id+'].minigame.dragonBoostTooltip(); else return 0;}','this')+'><div class="icon" style="vertical-align:middle;display:inline-block;background-position:'+(-30*48)+'px '+(-12*48)+'px;transform:scale(0.5);margin:-20px -16px;"></div></div>';
			str+='</div>';
			// CC3 fix: `innerHTML +=` re-parses the whole container, destroying the
			// sibling row elements — so when a later-created building (e.g. a mod
			// building declared in the 'create' hook) appends its row, every
			// vanilla building's `me.canvas` (captured in Init) is detached and its
			// sprite art silently stops rendering. insertAdjacentHTML appends the
			// same markup without touching existing siblings. Observable DOM and
			// behavior are identical; the earlier rows' elements survive.
			if (this.id==0) l('sectionLeftExtra').insertAdjacentHTML('beforeend', str);
			else
			{
				str+='<canvas class="rowCanvas" id="rowCanvas'+this.id+'"></canvas>';
				str+='<div class="rowSpecial" id="rowSpecial'+this.id+'"></div>';
				str+='</div>';
				l('rows').insertAdjacentHTML('beforeend', str);
				
				//building canvas
				this.pics=[];
				
				this.toResize=true;
				this.redraw=function()
				{
					var me=this;
					me.pics=[];
				}
				this.draw=function()
				{
					if (this.amount<=0) return false;
					if (this.toResize)
					{
						this.canvas.width=this.canvas.clientWidth;
						this.canvas.height=this.canvas.clientHeight;
						this.toResize=false;
					}
					var ctx=this.ctx;
					//clear
					//ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
					ctx.globalAlpha=1;
					
					//pic : a loaded picture or a function returning a loaded picture
					//bg : a loaded picture or a function returning a loaded picture - tiled as the background, 128x128
					//xV : the pictures will have a random horizontal shift by this many pixels
					//yV : the pictures will have a random vertical shift by this many pixels
					//w : how many pixels between each picture (or row of pictures)
					//x : horizontal offset
					//y : vertical offset (+32)
					//rows : if >1, arrange the pictures in rows containing this many pictures
					//frames : if present, slice the pic in [frames] horizontal slices and pick one at random
					
					var pic: any=this.art.pic;//the original calls it as pic(this,i) (2 args), which the Art.pic type does not describe — treat it opaquely
					var bg: any=this.art.bg;//string, or a (me,ctx) draw callback — the original dispatches on typeof
					var xV=this.art.xV||0;
					var yV=this.art.yV||0;
					var w=this.art.w||48;
					//var h=this.art.h||48; //dropped (write-only; its reads live in commented-out lines)
					var offX=this.art.x||0;
					var offY=this.art.y||0;
					var rows=this.art.rows||1;
					var frames=this.art.frames||1;

					if (typeof(bg)=='string') ctx.fillPattern(Pic(this.art.bg),0,0,this.canvas.width,this.canvas.height,128,128);
					else bg(this,ctx);
					/*
					ctx.globalAlpha=0.5;
					if (typeof(bg)=='string')//test
					{
						ctx.fillPattern(Pic(this.art.bg),-128+Game.T%128,0,this.canvas.width+128,this.canvas.height,128,128);
						ctx.fillPattern(Pic(this.art.bg),-128+Math.floor(Game.T/2)%128,-128+Math.floor(Game.T/2)%128,this.canvas.width+128,this.canvas.height+128,128,128);
					}
					ctx.globalAlpha=1;
					*/
					var maxI=Math.floor(this.canvas.width/(w/rows)+1);
					var iT=Math.min(this.amount,maxI);
					var i=this.pics.length;
					
					
					var x=0;
					var y=0;
					var added=0;
					if (i!=iT)
					{
						//for (var iter=0;iter<3;iter++)
						//{
							var prevFrame=0;
							while (i<iT)
							//if (i<iT)
							{
								Math.seedrandom(Game.seed+' '+this.id+' '+i);
								if (rows!=1)
								{
									x=Math.floor(i/rows)*w+((i%rows)/rows)*w+Math.floor((Math.random()-0.5)*xV)+offX;
									y=32+Math.floor((Math.random()-0.5)*yV)+((-rows/2)*32/2+(i%rows)*32/2)+offY;
								}
								else
								{
									x=i*w+Math.floor((Math.random()-0.5)*xV)+offX;
									y=32+Math.floor((Math.random()-0.5)*yV)+offY;
								}
								var usedPic=(typeof(pic)=='string'?pic:pic(this,i));
								var frame=-1;
								//if (frames>1) frame=Math.floor(Math.random()*frames);
								if (frames>1) {frame=prevFrame+Math.floor(Math.random()*(frames-1)+1);frame=frame%frames;}
								prevFrame=frame;
								this.pics.push({x:Math.floor(x),y:Math.floor(y),z:y,pic:usedPic,id:i,frame:frame,born:Game.T});
								i++;
								added++;
							}
							while (i>iT)
							//else if (i>iT)
							{
								this.pics.sort(Game.sortSpritesById);
								this.pics.pop();
								i--;
								added--;
							}
						//}
						this.pics.sort(Game.sortSprites);
					}
					
					var len=this.pics.length;
					
					if (this.mouseOn)
					{
						var selected=-1;
						if (this.name=='Grandma')
						{
							//mouse detection only fits grandma sprites for now
							var marginW=-18;
							var marginH=-10;
							for (var i=0;i<len;i++)
							{
								var pic: any=this.pics[i];//runtime sprite object {x,y,z,pic,id,frame}
								if (this.mousePos[0]>=pic.x-marginW && this.mousePos[0]<pic.x+64+marginW && this.mousePos[1]>=pic.y-marginH && this.mousePos[1]<pic.y+64+marginH) selected=i;
								if (selected==i && pic.pic=='elfGrandma.webp' && Game.mouseDown) Game.Win('Baby it\'s old outside');
							}
							if (Game.prefs.customGrandmas && Game.customGrandmaNames.length>0)
							{
								var str=loc("Names in white were submitted by our supporters on Patreon.");
								ctx.globalAlpha=0.75;
								ctx.fillStyle='#000';
								ctx.font='9px Merriweather';
								ctx.textAlign='left';
								ctx.fillRect(0,0,ctx.measureText(str).width+4,12);
								ctx.globalAlpha=1;
								ctx.fillStyle='rgba(255,255,255,0.7)';
								ctx.fillText(str,2,8);
								if (EN)
								{
									ctx.fillStyle='rgba(255,255,255,1)';
									ctx.fillText('white',2+ctx.measureText('Names in ').width,8);
								}
							}
						}
					}
					
					Math.seedrandom();
					
					for (var i=0;i<len;i++)
					{
						var pic: any=this.pics[i];//runtime sprite object {x,y,z,pic,id,frame}
						var sprite=Pic(pic.pic);
						if (selected! == i && this.name=='Grandma')//selected! — tsgo TS2454: the var is only assigned inside the mouseOn branch above; the original compared the hoisted (possibly unassigned) var
						{
							ctx.font='14px Merriweather';
							ctx.textAlign='center';
							Math.seedrandom(Game.seed+' '+pic.id/*+' '+pic.id*/);//(Game.seed+' '+pic.id+' '+pic.x+' '+pic.y);
							var years=((Date.now()-(+new Date(2013,7,8)))/(1000*60*60*24*365))+Math.random();//the grandmas age with the game
							var name=choose(Game.grandmaNames);
							var custom=false;
							if (Game.prefs.customGrandmas && Game.customGrandmaNames.length>0 && Math.random()<0.2) {name=choose(Game.customGrandmaNames);custom=true;}
							var text=loc("%1, age %2",[name,Beautify(Math.floor(70+Math.random()*30+years+this.level))]);
							var width=ctx.measureText(text).width+12;
							var x=Math.max(0,Math.min(pic.x+32-width/2+Math.random()*32-16,this.canvas.width-width));
							var y=4+Math.random()*8-4;
							Math.seedrandom();
							ctx.fillStyle='#000';
							ctx.strokeStyle='#000';
							ctx.lineWidth=8;
							ctx.globalAlpha=0.75;
							ctx.beginPath();
							ctx.moveTo(pic.x+32,pic.y+32);
							ctx.lineTo(Math.floor(x+width/2),Math.floor(y+20));
							ctx.stroke();
							ctx.fillRect(Math.floor(x),Math.floor(y),Math.floor(width),24);
							ctx.globalAlpha=1;
							if (custom) ctx.fillStyle='#fff';
							else ctx.fillStyle='rgba(255,255,255,0.7)';
							ctx.fillText(text,Math.floor(x+width/2),Math.floor(y+16));
							
							ctx.drawImage(sprite,Math.floor(pic.x+Math.random()*4-2),Math.floor(pic.y+Math.random()*4-2));
						}
						//else if (1) ctx.drawImage(sprite,0,0,sprite.width,sprite.height,pic.x,pic.y,sprite.width,sprite.height);
						else if (this.name=='Grandma' && Game.prefs.animate)
						{
							//Grandmas keep their feet planted while gently breathing and
							//swaying independently. Newly added Grandmas get a short,
							//grounded bounce so purchases have immediate visual feedback.
							var phase=pic.id*2.17;
							var bob=Math.sin(Game.T*0.08+phase)*1.2;
							var sway=Math.sin(Game.T*0.035+phase)*0.018;
							var breathe=1+Math.sin(Game.T*0.06+phase)*0.012;
							var age=Game.T-(pic.born||Game.T);
							var bounce=age>=0 && age<24?Math.sin(age/24*Math.PI)*5:0;
							ctx.save();
							ctx.translate(pic.x+32,pic.y+64-bob-bounce);
							ctx.rotate(sway);
							ctx.scale(breathe,breathe);
							if (pic.frame!=-1) ctx.drawImage(sprite,(sprite.width/frames)*pic.frame,0,sprite.width/frames,sprite.height,-32,-64,sprite.width/frames,sprite.height);
							else ctx.drawImage(sprite,-32,-64);
							ctx.restore();
						}
						else
						{
							//CC3: purchase feedback — every building gets a short bounce
							//when a new sprite is born, matching the same math Grandma uses.
							var age=Game.T-(pic.born||Game.T);
							var bounce=age>=0 && age<24?Math.sin(age/24*Math.PI)*5:0;
							if (pic.frame!=-1) ctx.drawImage(sprite,(sprite.width/frames)*pic.frame,0,sprite.width/frames,sprite.height,pic.x,pic.y-bounce,(sprite.width/frames),sprite.height);
							else ctx.drawImage(sprite,pic.x,pic.y-bounce);
						}
						
					}
					
					/*
					var picX=this.id;
					var picY=12;
					var w=1;
					var h=1;
					var w=Math.abs(Math.cos(Game.T*0.2+this.id*2-0.3))*0.2+0.8;
					var h=Math.abs(Math.sin(Game.T*0.2+this.id*2))*0.3+0.7;
					var x=64+Math.cos(Game.T*0.19+this.id*2)*8-24*w;
					var y=128-Math.abs(Math.pow(Math.sin(Game.T*0.2+this.id*2),5)*16)-48*h;
					ctx.drawImage(Pic('icons.webp'),picX*48,picY*48,48,48,Math.floor(x),Math.floor(y),48*w,48*h);
					*/
				}
			}
			
			Game.last=this;
			Game.Objects[this.name]=this;
			Game.ObjectsById.push(this);
			Game.ObjectsN++;
			return this;
	}
}
