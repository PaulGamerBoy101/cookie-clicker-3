/**
 * content/upgrades.ts — the 786 vanilla upgrade declarations (231 direct,
 * 271 tiered, 34 synergy, 17 grandma, 233 cookie).
 *
 * Ported verbatim from the 2.048 engine (engine/main.ts, the
 * //define upgrades block inside Game.Init): the same constructor calls
 * (new Game.Upgrade, Game.TieredUpgrade, Game.SynergyUpgrade,
 * Game.GrandmaSynergy, Game.NewUpgradeCookie), in the same order, with the
 * same order/pool/power bookkeeping and same per-upgrade closures — only
 * the file moved, and every closure is now typed.
 *
 * The engine calls declareVanillaUpgrades(Game) from Game.Init (which the
 * asset-Loader guarantees runs exactly once per page load), so the closures
 * capture the same Game object the original bare-global references resolved
 * to.
 *
 * Rewiring notes (runtime-identical):
 *  - `order`/`pool`/`power` were Init-scoped closure vars the engine's
 *    Game.Upgrade ctor read; they are now bare globals live-bridged to the
 *    engine's module-level vars through window accessors (the ctor bodies
 *    are unchanged).
 *  - The string helpers (getStrThousandFingersGain, …) and the
 *    Game.NewUpgradeCookie factory moved here with the declarations: they
 *    are evaluated with the active language at Init time exactly as before.
 *  - The Game.GrandmaSynergy / Game.NewUnshackleBuilding /
 *    Game.NewUnshackleUpgradeTier factories moved here because vanilla
 *    declarations call them at declaration time (they are assigned on
 *    Game, so the modding surface is unchanged).
 */
import type { Game as EngineGame } from '../types';

/** Declare the 786 vanilla upgrades (and their per-upgrade extras) on Game. */
export function declareVanillaUpgrades(Game: EngineGame) {
		var strCookieProductionMultiplierPlus=loc("Cookie production multiplier <b>+%1%</b>.",'[x]');
		var getStrCookieProductionMultiplierPlus=function(x: any)
		{return strCookieProductionMultiplierPlus.replace('[x]',x);}
		var getStrThousandFingersGain=function(x: any)
		{return loc("Multiplies the gain from %1 by <b>%2</b>.",[getUpgradeName("Thousand fingers"),x]);}
		var strKittenDesc=loc("You gain <b>more CpS</b> the more milk you have.");
		var getStrClickingGains=function(x: any)
		{return loc("Clicking gains <b>+%1% of your CpS</b>.",x);}
		
		Game.NewUpgradeCookie=function(obj: any)
		{
			var effectDesc=obj.clickPower?getStrClickingGains(obj.clickPower):getStrCookieProductionMultiplierPlus(Beautify((typeof(obj.power)==='function'?obj.power(obj):obj.power),1));
			var upgrade=new Game.Upgrade(obj.name,effectDesc+(EN?'<q>'+obj.desc+'</q>':''),obj.price,obj.icon);
			upgrade.power=obj.power;
			if (obj.clickPower) upgrade.clickPower=obj.clickPower;
			upgrade.pool='cookie';
			var toPush: any={cookies:obj.price/20,name:obj.name};
			if (obj.require) toPush.require=obj.require;
			if (obj.season) toPush.season=obj.season;
			if (!obj.locked) Game.UnlockAt.push(toPush);
			return upgrade;
		}
		// CC3: the original declared these as Init-scoped closure vars
		// (`var pool=''`, `var power=0`, `var order=100`). The declarations
		// are dropped here: the bare assignments must flow through the
		// window.order/pool/power bridge into the engine's module-scope
		// vars, which the Game.Upgrade/Game.Achievement ctors read (local
		// `var`s would shadow the bridge and break every order/pool/power
		// assignment below). Same initial values, same assignment sequence.
		pool='';
		power=0;
		order=100;//this is used to set the order in which the items are listed
		new Game.Upgrade('Reinforced index finger',loc("The mouse and cursors are <b>twice</b> as efficient.")+'<q>prod prod</q>',100,[0,0]);Game.MakeTiered(Game.last,1,0);
		new Game.Upgrade('Carpal tunnel prevention cream',loc("The mouse and cursors are <b>twice</b> as efficient.")+'<q>it... it hurts to click...</q>',500,[0,1]);Game.MakeTiered(Game.last,2,0);
		new Game.Upgrade('Ambidextrous',loc("The mouse and cursors are <b>twice</b> as efficient.")+'<q>Look ma, both hands!</q>',10000,[0,2]);Game.MakeTiered(Game.last,3,0);
		new Game.Upgrade('Thousand fingers',loc("The mouse and cursors gain <b>+%1</b> cookies for each non-cursor building owned.",0.1)+'<q>clickity</q>',100000,[0,13]);Game.MakeTiered(Game.last,4,0);
		
		new Game.Upgrade('Million fingers',getStrThousandFingersGain(5)+'<q>clickityclickity</q>',10000000,[0,14]);Game.MakeTiered(Game.last,5,0);
		new Game.Upgrade('Billion fingers',getStrThousandFingersGain(10)+'<q>clickityclickityclickity</q>',100000000,[0,15]);Game.MakeTiered(Game.last,6,0);
		new Game.Upgrade('Trillion fingers',getStrThousandFingersGain(20)+'<q>clickityclickityclickityclickity</q>',1000000000,[0,16]);Game.MakeTiered(Game.last,7,0);
		
		order=200;
		Game.TieredUpgrade('Forwards from grandma','<q>RE:RE:thought you\'d get a kick out of this ;))</q>','Grandma',1);
		Game.TieredUpgrade('Steel-plated rolling pins','<q>Just what you kneaded.</q>','Grandma',2);
		Game.TieredUpgrade('Lubricated dentures','<q>squish</q>','Grandma',3);
		
		order=300;
		Game.TieredUpgrade('Cheap hoes','<q>Rake in the dough!</q>','Farm',1);
		Game.TieredUpgrade('Fertilizer','<q>It\'s chocolate, I swear.</q>','Farm',2);
		Game.TieredUpgrade('Cookie trees','<q>A relative of the breadfruit.</q>','Farm',3);
		
		order=500;
		Game.TieredUpgrade('Sturdier conveyor belts','<q>You\'re going places.</q>','Factory',1);
		Game.TieredUpgrade('Child labor','<q>Cheaper, healthier workforce.</q>','Factory',2);
		Game.TieredUpgrade('Sweatshop','<q>Slackers will be terminated.</q>','Factory',3);
		
		order=400;
		Game.TieredUpgrade('Sugar gas','<q>A pink, volatile gas, found in the depths of some chocolate caves.</q>','Mine',1);
		Game.TieredUpgrade('Megadrill','<q>You\'re in deep.</q>','Mine',2);
		Game.TieredUpgrade('Ultradrill','<q>Finally caved in?</q>','Mine',3);
		
		order=600;
		Game.TieredUpgrade('Vanilla nebulae','<q>If you removed your space helmet, you could probably smell it!<br>(Note : don\'t do that.)</q>','Shipment',1);
		Game.TieredUpgrade('Wormholes','<q>By using these as shortcuts, your ships can travel much faster.</q>','Shipment',2);
		Game.TieredUpgrade('Frequent flyer','<q>Come back soon!</q>','Shipment',3);
		
		order=700;
		Game.TieredUpgrade('Antimony','<q>Actually worth a lot of mony.</q>','Alchemy lab',1);
		Game.TieredUpgrade('Essence of dough','<q>Extracted through the 5 ancient steps of alchemical baking.</q>','Alchemy lab',2);
		Game.TieredUpgrade('True chocolate','<q>The purest form of cacao.</q>','Alchemy lab',3);
		
		order=800;
		Game.TieredUpgrade('Ancient tablet','<q>A strange slab of peanut brittle, holding an ancient cookie recipe. Neat!</q>','Portal',1);
		Game.TieredUpgrade('Insane oatling workers','<q>ARISE, MY MINIONS!</q>','Portal',2);
		Game.TieredUpgrade('Soul bond','<q>So I just sign up and get more cookies? Sure, whatever!</q>','Portal',3);
		
		order=900;
		Game.TieredUpgrade('Flux capacitors','<q>Bake to the future.</q>','Time machine',1);
		Game.TieredUpgrade('Time paradox resolver','<q>No more fooling around with your own grandmother!</q>','Time machine',2);
		Game.TieredUpgrade('Quantum conundrum','<q>There is only one constant, and that is universal uncertainty.<br>Or is it?</q>','Time machine',3);
		
		order=20000;
		new Game.Upgrade('Kitten helpers',strKittenDesc+'<q>meow may I help you</q>',9000000,Game.GetIcon('Kitten',1));Game.last.kitten=1;Game.MakeTiered(Game.last,1,18);
		new Game.Upgrade('Kitten workers',strKittenDesc+'<q>meow meow meow meow</q>',9000000000,Game.GetIcon('Kitten',2));Game.last.kitten=1;Game.MakeTiered(Game.last,2,18);
		
		order=10000;
		Game.NewUpgradeCookie({name:'Plain cookies',desc:'We all gotta start somewhere.',icon:[2,3],power:										1,	price:	999999});
		Game.NewUpgradeCookie({name:'Sugar cookies',desc:'Tasty, if a little unimaginative.',icon:[7,3],power:									1,	price:	999999*5});
		Game.NewUpgradeCookie({name:'Oatmeal raisin cookies',desc:'No raisin to hate these.',icon:[0,3],power:									1,	price:	9999999});
		Game.NewUpgradeCookie({name:'Peanut butter cookies',desc:'Get yourself some jam cookies!',icon:[1,3],power:								2,	price:	9999999*5});
		Game.NewUpgradeCookie({name:'Coconut cookies',desc:'Flaky, but not unreliable. Some people go crazy for these.',icon:[3,3],power:		2,	price:	99999999});
		order=10001;
		Game.NewUpgradeCookie({name:'White chocolate cookies',desc:'I know what you\'ll say. It\'s just cocoa butter! It\'s not real chocolate!<br>Oh please.',icon:[4,3],power:2,	price:	99999999*5});
		order=10000;
		Game.NewUpgradeCookie({name:'Macadamia nut cookies',desc:'They\'re macadamn delicious!',icon:[5,3],power:								2,	price:	99999999});
		order=10002;
		Game.NewUpgradeCookie({name:'Double-chip cookies',desc:'DOUBLE THE CHIPS<br>DOUBLE THE TASTY<br>(double the calories)',icon:[6,3],power:2,	price:	999999999*5});
		Game.NewUpgradeCookie({name:'White chocolate macadamia nut cookies',desc:'Orteil\'s favorite.',icon:[8,3],power:						2,	price:	9999999999});
		Game.NewUpgradeCookie({name:'All-chocolate cookies',desc:'CHOCOVERDOSE.',icon:[9,3],power:												2,	price:	9999999999*5});
		
		order=100;
		new Game.Upgrade('Quadrillion fingers',getStrThousandFingersGain(20)+'<q>clickityclickityclickityclickityclick</q>',10000000000,[0,17]);Game.MakeTiered(Game.last,8,0);
		
		order=200;Game.TieredUpgrade('Prune juice','<q>Gets me going.</q>','Grandma',4);
		order=300;Game.TieredUpgrade('Genetically-modified cookies','<q>All-natural mutations.</q>','Farm',4);
		order=500;Game.TieredUpgrade('Radium reactors','<q>Gives your cookies a healthy glow.</q>','Factory',4);
		order=400;Game.TieredUpgrade('Ultimadrill','<q>Pierce the heavens, etc.</q>','Mine',4);
		order=600;Game.TieredUpgrade('Warp drive','<q>To boldly bake.</q>','Shipment',4);
		order=700;Game.TieredUpgrade('Ambrosia','<q>Adding this to the cookie mix is sure to make them even more addictive!<br>Perhaps dangerously so.<br>Let\'s hope you can keep selling these legally.</q>','Alchemy lab',4);
		order=800;Game.TieredUpgrade('Sanity dance','<q>We can change if we want to.<br>We can leave our brains behind.</q>','Portal',4);
		order=900;Game.TieredUpgrade('Causality enforcer','<q>What happened, happened.</q>','Time machine',4);
		
		order=5000;
		new Game.Upgrade('Lucky day',loc("Golden cookies appear <b>twice as often</b> and stay <b>twice as long</b>.")+'<q>Oh hey, a four-leaf penny!</q>',777777777,[27,6]);
		new Game.Upgrade('Serendipity',loc("Golden cookies appear <b>twice as often</b> and stay <b>twice as long</b>.")+'<q>What joy! Seven horseshoes!</q>',77777777777,[27,6]);
		
		order=20000;
		new Game.Upgrade('Kitten engineers',strKittenDesc+'<q>meow meow meow meow, sir</q>',90000000000000,Game.GetIcon('Kitten',3));Game.last.kitten=1;Game.MakeTiered(Game.last,3,18);
		
		order=10020;
		Game.NewUpgradeCookie({name:'Dark chocolate-coated cookies',desc:'These absorb light so well you almost need to squint to see them.',icon:[10,3],power:			5,	price:	99999999999});
		Game.NewUpgradeCookie({name:'White chocolate-coated cookies',desc:'These dazzling cookies absolutely glisten with flavor.',icon:[11,3],power:					5,	price:	99999999999});
		
		Game.GrandmaSynergies=[];
		Game.GrandmaSynergy=function(name: any,desc: any,building: any)
		{
			var building: any=Game.Objects[building];
			var grandmaNumber=loc("%1 grandma",LBeautify(building.id-1));
			desc=loc("%1 are <b>twice</b> as efficient.",cap(Game.Objects['Grandma'].plural))+' '+loc("%1 gain <b>+%2%</b> CpS per %3.",[cap(building.plural),1,grandmaNumber])+'<q>'+desc+'</q>';
			
			var upgrade=new Game.Upgrade(name,desc,building.basePrice*Game.Tiers[2].price,[10,9],function(){Game.Objects['Grandma'].redraw();});
			building.grandma=upgrade;
			upgrade.buildingTie=building;
			Game.GrandmaSynergies.push(upgrade.name);
			return upgrade;
		}
		
		order=250;
		Game.GrandmaSynergy('Farmer grandmas','A nice farmer to grow more cookies.','Farm');
		Game.GrandmaSynergy('Miner grandmas','A nice miner to dig more cookies.','Mine');
		Game.GrandmaSynergy('Worker grandmas','A nice worker to manufacture more cookies.','Factory');
		Game.GrandmaSynergy('Cosmic grandmas','A nice thing to... uh... cookies.','Shipment');
		Game.GrandmaSynergy('Transmuted grandmas','A nice golden grandma to convert into more cookies.','Alchemy lab');
		Game.GrandmaSynergy('Altered grandmas','a NiCe GrAnDmA tO bA##########','Portal');
		Game.GrandmaSynergy('Grandmas\' grandmas','A nice grandma\'s nice grandma to bake double the cookies.','Time machine');
		
		// CC3: the cats-synergy pool — a mirror of Game.GrandmaSynergy centered
		// on Cats. Owning a cat synergy makes Cats twice as efficient and gives
		// the tied building +1% CpS per (id-1) cats (see GetTieredCpsMult).
		Game.CatSynergies=[];
		Game.CatSynergy=function(name: any,desc: any,building: any)
		{
			var building: any=Game.Objects[building];
			// Math.max(1,...): 'Kitten grandmas' ties this to Grandma, whose
			// building id is 1, so the naive (id-1) divisor used by every other
			// cat/grandma synergy would be 0 here — this is the one tied
			// building where that self-reference actually happens.
			var catNumber=loc("%1 cat",LBeautify(Math.max(1,building.id-1)));
			desc=loc("%1 are <b>twice</b> as efficient.",cap(Game.Objects['Cats'].plural))+' '+loc("%1 gain <b>+%2%</b> CpS per %3.",[cap(building.plural),1,catNumber])+'<q>'+desc+'</q>';
			
			var upgrade=new Game.Upgrade(name,desc,building.basePrice*Game.Tiers[2].price,[10,9],function(){Game.Objects['Cats'].redraw();});
			building.cat=upgrade;
			upgrade.buildingTie=building;
			Game.CatSynergies.push(upgrade.name);
			return upgrade;
		}
		
		order=14000;
		
		new Game.Upgrade('Bingo center/Research facility',loc("Grandma-operated science lab and leisure club.<br>Grandmas are <b>4 times</b> as efficient.<br><b>Regularly unlocks new upgrades</b>.")+'<q>What could possibly keep those grandmothers in check?...<br>Bingo.</q>',1000000000000000,[11,9],function(){Game.SetResearch('Specialized chocolate chips');});Game.last.noPerm=1;
		
		order=15000;
		new Game.Upgrade('Specialized chocolate chips',getStrCookieProductionMultiplierPlus(1)+'<q>Computer-designed chocolate chips. Computer chips, if you will.</q>',1000000000000000,[0,9],function(){Game.SetResearch('Designer cocoa beans');});Game.last.pool='tech';
		new Game.Upgrade('Designer cocoa beans',getStrCookieProductionMultiplierPlus(2)+'<q>Now more aerodynamic than ever!</q>',2000000000000000,[1,9],function(){Game.SetResearch('Ritual rolling pins');});Game.last.pool='tech';
		new Game.Upgrade('Ritual rolling pins',loc("%1 are <b>twice</b> as efficient.",cap(Game.Objects['Grandma'].plural))+'<q>The result of years of scientific research!</q>',4000000000000000,[2,9],function(){Game.SetResearch('Underworld ovens');});Game.last.pool='tech';
		new Game.Upgrade('Underworld ovens',getStrCookieProductionMultiplierPlus(3)+'<q>Powered by science, of course!</q>',8000000000000000,[3,9],function(){Game.SetResearch('One mind');});Game.last.pool='tech';
		new Game.Upgrade('One mind',loc("Each %1 gains <b>+%2 base CpS per %3</b>.",[loc("grandma"),'0.0<span></span>2',loc("grandma")])+'<div class="warning">'+loc("Note: the grandmothers are growing restless. Do not encourage them.")+'</div><q>We are one. We are many.</q>',16000000000000000,[4,9],function(){Game.elderWrath=1;Game.SetResearch('Exotic nuts');Game.storeToRefresh=1;});Game.last.pool='tech';
		//Game.last.clickFunction=function(){return confirm('Warning : purchasing this will have unexpected, and potentially undesirable results!\nIt\'s all downhill from here. You have been warned!\nPurchase anyway?');};
		Game.RequiresConfirmation(Game.last,'<div class="block">'+loc("<b>Warning:</b> purchasing this will have unexpected, and potentially undesirable results!<br><small>It's all downhill from here. You have been warned!</small><br><br>Purchase anyway?")+'</div>');
		new Game.Upgrade('Exotic nuts',getStrCookieProductionMultiplierPlus(4)+'<q>You\'ll go crazy over these!</q>',32000000000000000,[5,9],function(){Game.SetResearch('Communal brainsweep');});Game.last.pool='tech';
		new Game.Upgrade('Communal brainsweep',(EN?'Each grandma gains another <b>+0.0<span></span>2 base CpS per grandma</b>.':loc("Each %1 gains <b>+%2 base CpS per %3</b>.",[loc("grandma"),'0.0<span></span>2',loc("grandma")]))+'<div class="warning">'+loc("Note: proceeding any further in scientific research may have unexpected results. You have been warned.")+'</div><q>We fuse. We merge. We grow.</q>',64000000000000000,[6,9],function(){Game.elderWrath=2;Game.SetResearch('Arcane sugar');Game.storeToRefresh=1;});Game.last.pool='tech';
		new Game.Upgrade('Arcane sugar',getStrCookieProductionMultiplierPlus(5)+'<q>Tastes like insects, ligaments, and molasses.</q>',128000000000000000,[7,9],function(){Game.SetResearch('Elder Pact');});Game.last.pool='tech';
		new Game.Upgrade('Elder Pact',loc("Each %1 gains <b>+%2 base CpS per %3</b>.",[loc("grandma"),'0.0<span></span>5',loc("portal")])+'<div class="warning">'+loc("Note: this is a bad idea.")+'</div><q>squirm crawl slither writhe<br>today we rise</q>',256000000000000000,[8,9],function(){Game.elderWrath=3;Game.storeToRefresh=1;});Game.last.pool='tech';
		new Game.Upgrade('Elder Pledge',loc("Contains the wrath of the elders, at least for a while.")+'<q>This is a simple ritual involving anti-aging cream, cookie batter mixed in the moonlight, and a live chicken.</q>',1,[9,9],function()
		{
			Game.elderWrath=0;
			Game.pledges++;
			Game.pledgeT=Game.getPledgeDuration();
			Game.Unlock('Elder Covenant');
			Game.CollectWrinklers();
			Game.storeToRefresh=1;
		});
		Game.last.pool='toggle';
		Game.last.displayFuncWhenOwned=function(){return '<div style="text-align:center;">'+loc("Time remaining until pledge runs out:")+'<br><b>'+Game.sayTime(Game.pledgeT,-1)+'</b></div>';}
		Game.last.timerDisplay=function(){if (!Game.Upgrades['Elder Pledge'].bought) return -1; else return 1-Game.pledgeT/Game.getPledgeDuration();}
		Game.last.priceFunc=function(){return Math.pow(8,Math.min(Game.pledges+2,14));}
		
		Game.last.descFunc=function(){
			return '<div style="text-align:center;">'+(Game.pledges==0?loc("You haven't pledged to the elders yet."):loc("You've pledged to the elders <b>%1 times</b>.",LBeautify(Game.pledges)))+'<div class="line"></div></div>'+this.ddesc;
		};
		
		
		order=150;
		new Game.Upgrade('Plastic mouse',getStrClickingGains(1)+'<q>Slightly squeaky.</q>',50000,[11,0]);Game.MakeTiered(Game.last,1,11);
		new Game.Upgrade('Iron mouse',getStrClickingGains(1)+'<q>Click like it\'s 1349!</q>',5000000,[11,1]);Game.MakeTiered(Game.last,2,11);
		new Game.Upgrade('Titanium mouse',getStrClickingGains(1)+'<q>Heavy, but powerful.</q>',500000000,[11,2]);Game.MakeTiered(Game.last,3,11);
		new Game.Upgrade('Adamantium mouse',getStrClickingGains(1)+'<q>You could cut diamond with these.</q>',50000000000,[11,13]);Game.MakeTiered(Game.last,4,11);
		
		order=40000;
		new Game.Upgrade('Ultrascience',loc("Research takes only <b>5 seconds</b>.")+'<q>YEAH, SCIENCE!</q>',7,[9,2]);//debug purposes only
		Game.last.pool='debug';
		
		order=10020;
		Game.NewUpgradeCookie({name:'Eclipse cookies',desc:'Look to the cookie.',icon:[0,4],power:					2,	price:	99999999999*5});
		Game.NewUpgradeCookie({name:'Zebra cookies',desc:'...',icon:[1,4],power:									2,	price:	999999999999});
		
		order=100;
		new Game.Upgrade('Quintillion fingers',getStrThousandFingersGain(20)+'<q>man, just go click click click click click, it\'s real easy, man.</q>',10000000000000,[0,18]);Game.MakeTiered(Game.last,9,0);
		
		order=40000;
		new Game.Upgrade('Gold hoard',loc("Golden cookies appear <b>really often</b>.")+'<q>That\'s entirely too many.</q>',7,[10,14]);//debug purposes only
		Game.last.pool='debug';
		
		order=15000;
		new Game.Upgrade('Elder Covenant',loc("Puts a permanent end to the elders' wrath, at the cost of %1% of your CpS.",5)+'<q>This is a complicated ritual involving silly, inconsequential trivialities such as cursed laxatives, century-old cacao, and an infant.<br>Don\'t question it.</q>',66666666666666,[8,9],function()
		{
			Game.pledgeT=0;
			Game.Lock('Revoke Elder Covenant');
			Game.Unlock('Revoke Elder Covenant');
			Game.Lock('Elder Pledge');
			Game.Win('Elder calm');
			Game.CollectWrinklers();
			Game.storeToRefresh=1;
		});
		Game.last.pool='toggle';

		new Game.Upgrade('Revoke Elder Covenant',loc("You will get %1% of your CpS back, but the grandmatriarchs will return.",5)+'<q>we<br>rise<br>again</q>',6666666666,[8,9],function()
		{
			Game.Lock('Elder Covenant');
			Game.Unlock('Elder Covenant');
		});
		Game.last.pool='toggle';
		
		order=5000;
		new Game.Upgrade('Get lucky',loc("Golden cookie effects last <b>twice as long</b>.")+'<q>You\'ve been up all night, haven\'t you?</q>',77777777777777,[27,6]);
		
		order=15000;
		new Game.Upgrade('Sacrificial rolling pins',loc("Elder pledges last <b>twice</b> as long.")+'<q>These are mostly just for spreading the anti-aging cream.<br>(And accessorily, shortening the chicken\'s suffering.)</q>',2888888888888,[2,9]);
		
		order=10020;
		Game.NewUpgradeCookie({name:'Snickerdoodles',desc:'True to their name.',icon:[2,4],power:												2,	price:	999999999999*5});
		Game.NewUpgradeCookie({name:'Stroopwafels',desc:'If it ain\'t dutch, it ain\'t much.',icon:[3,4],power:									2,	price:	9999999999999});
		Game.NewUpgradeCookie({name:'Macaroons',desc:'Not to be confused with macarons.<br>These have coconut, okay?',icon:[4,4],power:			2,	price:	9999999999999*5});
		
		order=40000;
		new Game.Upgrade('Neuromancy',loc("Can toggle upgrades on and off at will in the stats menu.")+'<q>Can also come in handy to unsee things that can\'t be unseen.</q>',7,[4,9]);//debug purposes only
		Game.last.pool='debug';
		
		order=10020;
		Game.NewUpgradeCookie({name:'Empire biscuits',desc:'For your growing cookie empire, of course!',icon:[5,4],power:											2,	price:	99999999999999});
		order=10031;
		Game.NewUpgradeCookie({name:'British tea biscuits',desc:'Quite.',icon:[6,4],require:'Tin of british tea biscuits',power:									2,	price:	99999999999999});
		Game.NewUpgradeCookie({name:'Chocolate british tea biscuits',desc:'Yes, quite.',icon:[7,4],require:Game.last.name,power:									2,	price:	99999999999999});
		Game.NewUpgradeCookie({name:'Round british tea biscuits',desc:'Yes, quite riveting.',icon:[8,4],require:Game.last.name,power:								2,	price:	99999999999999});
		Game.NewUpgradeCookie({name:'Round chocolate british tea biscuits',desc:'Yes, quite riveting indeed.',icon:[9,4],require:Game.last.name,power:				2,	price:	99999999999999});
		Game.NewUpgradeCookie({name:'Round british tea biscuits with heart motif',desc:'Yes, quite riveting indeed, old chap.',icon:[10,4],require:Game.last.name,power:	2,	price:	99999999999999});
		Game.NewUpgradeCookie({name:'Round chocolate british tea biscuits with heart motif',desc:'I like cookies.',icon:[11,4],require:Game.last.name,power:		2,	price:	99999999999999});
		
		order=1000;
		Game.TieredUpgrade('Sugar bosons','<q>Sweet firm bosons.</q>','Antimatter condenser',1);
		Game.TieredUpgrade('String theory','<q>Reveals new insight about the true meaning of baking cookies (and, as a bonus, the structure of the universe).</q>','Antimatter condenser',2);
		Game.TieredUpgrade('Large macaron collider','<q>How singular!</q>','Antimatter condenser',3);
		Game.TieredUpgrade('Big bang bake','<q>And that\'s how it all began.</q>','Antimatter condenser',4);

		order=255;
		Game.GrandmaSynergy('Antigrandmas','A mean antigrandma to vomit more cookies.','Antimatter condenser');

		order=10020;
		Game.NewUpgradeCookie({name:'Madeleines',desc:'Unforgettable!',icon:[12,3],power:																2,	price:	99999999999999*5});
		Game.NewUpgradeCookie({name:'Palmiers',desc:'Palmier than you!',icon:[13,3],power:																2,	price:	99999999999999*5});
		Game.NewUpgradeCookie({name:'Palets',desc:'You could probably play hockey with these.<br>I mean, you\'re welcome to try.',icon:[12,4],power:	2,	price:	999999999999999});
		Game.NewUpgradeCookie({name:'Sabl&eacute;s',desc:'The name implies they\'re made of sand. But you know better, don\'t you?',icon:[13,4],power:	2,	price:	999999999999999});
		
		order=20000;
		new Game.Upgrade('Kitten overseers',strKittenDesc+'<q>my purrpose is to serve you, sir</q>',90000000000000000,Game.GetIcon('Kitten',4));Game.last.kitten=1;Game.MakeTiered(Game.last,4,18);
		
		
		order=100;
		new Game.Upgrade('Sextillion fingers',getStrThousandFingersGain(20)+'<q>sometimes<br>things just<br>click</q>',10000000000000000,[0,19]);Game.MakeTiered(Game.last,10,0);
		
		order=200;Game.TieredUpgrade('Double-thick glasses','<q>Oh... so THAT\'s what I\'ve been baking.</q>','Grandma',5);
		order=300;Game.TieredUpgrade('Gingerbread scarecrows','<q>Staring at your crops with mischievous glee.</q>','Farm',5);
		order=500;Game.TieredUpgrade('Recombobulators','<q>A major part of cookie recombobulation.</q>','Factory',5);
		order=400;Game.TieredUpgrade('H-bomb mining','<q>Questionable efficiency, but spectacular nonetheless.</q>','Mine',5);
		order=600;Game.TieredUpgrade('Chocolate monoliths','<q>My god. It\'s full of chocolate bars.</q>','Shipment',5);
		order=700;Game.TieredUpgrade('Aqua crustulae','<q>Careful with the dosing - one drop too much and you get muffins.<br>And nobody likes muffins.</q>','Alchemy lab',5);
		order=800;Game.TieredUpgrade('Brane transplant','<q>This refers to the practice of merging higher dimensional universes, or "branes", with our own, in order to facilitate transit (and harvesting of precious cookie dough).</q>','Portal',5);
		order=900;Game.TieredUpgrade('Yestermorrow comparators','<q>Fortnights into millennia.</q>','Time machine',5);
		order=1000;Game.TieredUpgrade('Reverse cyclotrons','<q>These can uncollision particles and unspin atoms. For... uh... better flavor, and stuff.</q>','Antimatter condenser',5);
		
		order=150;
		new Game.Upgrade('Unobtainium mouse',getStrClickingGains(1)+'<q>These nice mice should suffice.</q>',5000000000000,[11,14]);Game.MakeTiered(Game.last,5,11);
		
		order=10030;
		Game.NewUpgradeCookie({name:'Caramoas',desc:'Yeah. That\'s got a nice ring to it.',icon:[14,4],require:'Box of brand biscuits',power:					3,	price:	9999999999999999});
		Game.NewUpgradeCookie({name:'Sagalongs',desc:'Grandma\'s favorite?',icon:[15,3],require:'Box of brand biscuits',power:									3,	price:	9999999999999999});
		Game.NewUpgradeCookie({name:'Shortfoils',desc:'Foiled again!',icon:[15,4],require:'Box of brand biscuits',power:										3,	price:	9999999999999999});
		Game.NewUpgradeCookie({name:'Win mints',desc:'They\'re the luckiest cookies you\'ve ever tasted!',icon:[14,3],require:'Box of brand biscuits',power:	3,	price:	9999999999999999});
		
		order=40000;
		new Game.Upgrade('Perfect idling',loc("You keep producing cookies even while the game is closed.")+'<q>It\'s the most beautiful thing I\'ve ever seen.</q>',7,[10,0]);//debug purposes only
		Game.last.pool='debug';
		
		order=10030;
		Game.NewUpgradeCookie({name:'Fig gluttons',desc:'Got it all figured out.',icon:[17,4],require:'Box of brand biscuits',power:													2,	price:	999999999999999*5});
		Game.NewUpgradeCookie({name:'Loreols',desc:'Because, uh... they\'re worth it?',icon:[16,3],require:'Box of brand biscuits',power:												2,	price:	999999999999999*5});
		Game.NewUpgradeCookie({name:'Jaffa cakes',desc:'If you want to bake a cookie from scratch, you must first build a factory.',icon:[17,3],require:'Box of brand biscuits',power:	2,	price:	999999999999999*5});
		Game.NewUpgradeCookie({name:'Grease\'s cups',desc:'Extra-greasy peanut butter.',icon:[16,4],require:'Box of brand biscuits',power:												2,	price:	999999999999999*5});
		
		order=30000;
		new Game.Upgrade('Heavenly chip secret',loc("Unlocks <b>%1%</b> of the potential of your prestige level.",5)+'<q>Grants the knowledge of heavenly chips, and how to use them to make baking more efficient.<br>It\'s a secret to everyone.</q>',11,[19,7]);Game.last.noPerm=1;
		new Game.Upgrade('Heavenly cookie stand',loc("Unlocks <b>%1%</b> of the potential of your prestige level.",25)+'<q>Don\'t forget to visit the heavenly lemonade stand afterwards. When afterlife gives you lemons...</q>',1111,[18,7]);Game.last.noPerm=1;
		new Game.Upgrade('Heavenly bakery',loc("Unlocks <b>%1%</b> of the potential of your prestige level.",50)+'<q>Also sells godly cakes and divine pastries. The pretzels aren\'t too bad either.</q>',111111,[17,7]);Game.last.noPerm=1;
		new Game.Upgrade('Heavenly confectionery',loc("Unlocks <b>%1%</b> of the potential of your prestige level.",75)+'<q>They say angel bakers work there. They take angel lunch breaks and sometimes go on angel strikes.</q>',11111111,[16,7]);Game.last.noPerm=1;
		new Game.Upgrade('Heavenly key',loc("Unlocks <b>%1%</b> of the potential of your prestige level.",100)+'<q>This is the key to the pearly (and tasty) gates of pastry heaven, granting you access to your entire stockpile of heavenly chips for baking purposes.<br>May you use them wisely.</q>',1111111111,[15,7]);Game.last.noPerm=1;
		
		order=10100;
		Game.NewUpgradeCookie({name:'Skull cookies',desc:'Wanna know something spooky? You\'ve got one of these inside your head RIGHT NOW.',locked:1,icon:[12,8],power:	2, price: 444444444444});
		Game.NewUpgradeCookie({name:'Ghost cookies',desc:'They\'re something strange, but they look pretty good!',locked:1,icon:[13,8],power:								2, price: 444444444444});
		Game.NewUpgradeCookie({name:'Bat cookies',desc:'The cookies this town deserves.',locked:1,icon:[14,8],power:														2, price: 444444444444});
		Game.NewUpgradeCookie({name:'Slime cookies',desc:'The incredible melting cookies!',locked:1,icon:[15,8],power: 														2, price: 444444444444});
		Game.NewUpgradeCookie({name:'Pumpkin cookies',desc:'Not even pumpkin-flavored. Tastes like glazing. Yeugh.',locked:1,icon:[16,8],power:								2, price: 444444444444});
		Game.NewUpgradeCookie({name:'Eyeball cookies',desc:'When you stare into the cookie, the cookie stares back at you.',locked:1,icon:[17,8],power:						2, price: 444444444444});
		Game.NewUpgradeCookie({name:'Spider cookies',desc:'You found the recipe on the web. They do whatever a cookie can.',locked:1,icon:[18,8],power:						2, price: 444444444444});
		
		Game.halloweenDrops=['Skull cookies','Ghost cookies','Bat cookies','Slime cookies','Pumpkin cookies','Eyeball cookies','Spider cookies'];
		
		
		order=0;
		new Game.Upgrade('Persistent memory',loc("Subsequent research will be <b>%1 times</b> as fast.",10)+'<q>It\'s all making sense!<br>Again!</q>',500,[9,2]);Game.last.pool='prestige';
		
		order=40000;
		new Game.Upgrade('Wrinkler doormat',loc("Wrinklers spawn much more frequently.")+'<q>You\'re such a pushover.</q>',7,[19,8]);//debug purposes only
		Game.last.pool='debug';
		
		order=10200;
		Game.NewUpgradeCookie({name:'Christmas tree biscuits',desc:'Whose pine is it anyway?',locked:1,icon:[12,10],power:2,price: 252525252525});
		Game.NewUpgradeCookie({name:'Snowflake biscuits',desc:'Mass-produced to be unique in every way.',locked:1,icon:[13,10],power:2,price: 252525252525});
		Game.NewUpgradeCookie({name:'Snowman biscuits',desc:'It\'s frosted. Doubly so.',locked:1,icon:[14,10],power:2,price: 252525252525});
		Game.NewUpgradeCookie({name:'Holly biscuits',desc:'You don\'t smooch under these ones. That would be the mistletoe (which, botanically, is a smellier variant of the mistlefinger).',locked:1,icon:[15,10],power:2,price: 252525252525});
		Game.NewUpgradeCookie({name:'Candy cane biscuits',desc:'It\'s two treats in one!<br>(Further inspection reveals the frosting does not actually taste like peppermint, but like mundane sugary frosting.)',locked:1,icon:[16,10],power:2,price: 252525252525});
		Game.NewUpgradeCookie({name:'Bell biscuits',desc:'What do these even have to do with christmas? Who cares, ring them in!',locked:1,icon:[17,10],power:2,price: 252525252525});
		Game.NewUpgradeCookie({name:'Present biscuits',desc:'The prequel to future biscuits. Watch out!',locked:1,icon:[18,10],power:2,price: 252525252525});
		
		order=10020;
		Game.NewUpgradeCookie({name:'Gingerbread men',desc:'You like to bite the legs off first, right? How about tearing off the arms? You sick monster.',icon:[18,4],power:		2,price: 9999999999999999});
		Game.NewUpgradeCookie({name:'Gingerbread trees',desc:'Evergreens in pastry form. Yule be surprised what you can come up with.',icon:[18,3],power:							2,price: 9999999999999999});
		
		order=25000;
		new Game.Upgrade('A festive hat','<b>'+loc("Unlocks... something.")+'</b><q>Not a creature was stirring, not even a mouse.</q>',25,[19,9],function()
		{
			var drop=choose(Game.santaDrops);
			Game.Unlock(drop);
			Game.Notify(loc("In the festive hat, you find..."),loc("a festive test tube<br>and <b>%1</b>.",drop),Game.Upgrades[drop].icon);
		});
		
		new Game.Upgrade('Increased merriness',getStrCookieProductionMultiplierPlus(15)+'<br>'+loc("Cost scales with Santa level.")+'<q>It turns out that the key to increased merriness, strangely enough, happens to be a good campfire and some s\'mores.<br>You know what they say, after all; the s\'more, the merrier.</q>',2525,[17,9]);
		new Game.Upgrade('Improved jolliness',getStrCookieProductionMultiplierPlus(15)+'<br>'+loc("Cost scales with Santa level.")+'<q>A nice wobbly belly goes a long way.<br>You jolly?</q>',2525,[17,9]);
		new Game.Upgrade('A lump of coal',getStrCookieProductionMultiplierPlus(1)+'<br>'+loc("Cost scales with Santa level.")+'<q>Some of the world\'s worst stocking stuffing.<br>I guess you could try starting your own little industrial revolution, or something?...</q>',2525,[13,9]);
		new Game.Upgrade('An itchy sweater',getStrCookieProductionMultiplierPlus(1)+'<br>'+loc("Cost scales with Santa level.")+'<q>You don\'t know what\'s worse : the embarrassingly quaint "elf on reindeer" motif, or the fact that wearing it makes you feel like you\'re wrapped in a dead sasquatch.</q>',2525,[14,9]);
		new Game.Upgrade('Reindeer baking grounds',loc("Reindeer appear <b>twice as frequently</b>.")+'<br>'+loc("Cost scales with Santa level.")+'<q>Male reindeer are from Mars; female reindeer are from venison.</q>',2525,[12,9]);
		new Game.Upgrade('Weighted sleighs',loc("Reindeer are <b>twice as slow</b>.")+'<br>'+loc("Cost scales with Santa level.")+'<q>Hope it was worth the weight.<br>(Something something forced into cervidude)</q>',2525,[12,9]);
		new Game.Upgrade('Ho ho ho-flavored frosting',loc("Reindeer give <b>twice as much</b>.")+'<br>'+loc("Cost scales with Santa level.")+'<q>It\'s time to up the antler.</q>',2525,[12,9]);
		new Game.Upgrade('Season savings',loc("All buildings are <b>%1% cheaper</b>.",1)+'<br>'+loc("Cost scales with Santa level.")+'<q>By Santa\'s beard, what savings!<br>But who will save us?</q>',2525,[16,9],function(){Game.storeToRefresh=1;});
		new Game.Upgrade('Toy workshop',loc("All upgrades are <b>%1% cheaper</b>.",5)+'<br>'+loc("Cost scales with Santa level.")+'<q>Watch yours-elf around elvesdroppers who might steal our production secrets.<br>Or elven worse!</q>',2525,[16,9],function(){Game.upgradesToRebuild=1;});
		new Game.Upgrade('Naughty list',loc("%1 are <b>twice</b> as efficient.",cap(loc("grandmas")))+'<br>'+loc("Cost scales with Santa level.")+'<q>This list contains every unholy deed perpetuated by grandmakind.<br>He won\'t be checking this one twice.<br>Once. Once is enough.</q>',2525,[15,9]);
		new Game.Upgrade('Santa\'s bottomless bag',loc("Random drops are <b>%1% more common</b>.",10)+'<br>'+loc("Cost scales with Santa level.")+'<q>This is one bottom you can\'t check out.</q>',2525,[19,9]);
		new Game.Upgrade('Santa\'s helpers',loc("Clicking is <b>%1%</b> more powerful.",10)+'<br>'+loc("Cost scales with Santa level.")+'<q>Some choose to help hamburger; some choose to help you.<br>To each their own, I guess.</q>',2525,[19,9]);
		new Game.Upgrade('Santa\'s legacy',loc("Cookie production multiplier <b>+%1% per Santa's levels.</b>",3)+'<br>'+loc("Cost scales with Santa level.")+'<q>In the north pole, you gotta get the elves first. Then when you get the elves, you start making the toys. Then when you get the toys... then you get the cookies.</q>',2525,[19,9]);
		new Game.Upgrade('Santa\'s milk and cookies',loc("Milk is <b>%1% more powerful</b>.",5)+'<br>'+loc("Cost scales with Santa level.")+'<q>Part of Santa\'s dreadfully unbalanced diet.</q>',2525,[19,9]);
		
		order=40000;
		new Game.Upgrade('Reindeer season',loc("Reindeer spawn much more frequently.")+'<q>Go, Cheater! Go, Hacker and Faker!</q>',7,[12,9]);//debug purposes only
		Game.last.pool='debug';
		
		order=25000;
		new Game.Upgrade('Santa\'s dominion',getStrCookieProductionMultiplierPlus(20)+'<br>'+loc("All buildings are <b>%1% cheaper</b>.",1)+'<br>'+loc("All upgrades are <b>%1% cheaper</b>.",2)+'<q>My name is Claus, king of kings;<br>Look on my toys, ye Mighty, and despair!</q>',2525252525252525,[19,10],function(){Game.storeToRefresh=1;});
		
		order=10300;
		var heartPower=function(){
			var pow=2;
			if (Game.Has('Starlove')) pow=3;
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('seasons');
				if (godLvl==1) pow*=1.3;
				else if (godLvl==2) pow*=1.2;
				else if (godLvl==3) pow*=1.1;
			}
			return pow;
		};
		Game.NewUpgradeCookie({name:'Pure heart biscuits',desc:'Melty white chocolate<br>that says "I *like* like you".',season:'valentines',icon:[19,3],													power:heartPower,price: 1000000});
		Game.NewUpgradeCookie({name:'Ardent heart biscuits',desc:'A red hot cherry biscuit that will nudge the target of your affection in interesting directions.',require:Game.last.name,season:'valentines',icon:[20,3],			power:heartPower,price: 1000000000});
		Game.NewUpgradeCookie({name:'Sour heart biscuits',desc:'A bitter lime biscuit for the lonely and the heart-broken.',require:Game.last.name,season:'valentines',icon:[20,4],													power:heartPower,price: 1000000000000});
		Game.NewUpgradeCookie({name:'Weeping heart biscuits',desc:'An ice-cold blueberry biscuit, symbol of a mending heart.',require:Game.last.name,season:'valentines',icon:[21,3],												power:heartPower,price: 1000000000000000});
		Game.NewUpgradeCookie({name:'Golden heart biscuits',desc:'A beautiful biscuit to symbolize kindness, true love, and sincerity.',require:Game.last.name,season:'valentines',icon:[21,4],										power:heartPower,price: 1000000000000000000});
		Game.NewUpgradeCookie({name:'Eternal heart biscuits',desc:'Silver icing for a very special someone you\'ve liked for a long, long time.',require:Game.last.name,season:'valentines',icon:[19,4],							power:heartPower,price: 1000000000000000000000});
		
		Game.heartDrops=['Pure heart biscuits','Ardent heart biscuits','Sour heart biscuits','Weeping heart biscuits','Golden heart biscuits','Eternal heart biscuits','Prism heart biscuits'];
		
		
		order=1100;
		Game.TieredUpgrade('Gem polish','<q>Get rid of the grime and let more light in.<br>Truly, truly outrageous.</q>','Prism',1);
		Game.TieredUpgrade('9th color','<q>Delve into untouched optical depths where even the mantis shrimp hasn\'t set an eye!</q>','Prism',2);
		Game.TieredUpgrade('Chocolate light','<q>Bask into its cocoalescence.<br>(Warning : may cause various interesting albeit deadly skin conditions.)</q>','Prism',3);
		Game.TieredUpgrade('Grainbow','<q>Remember the different grains using the handy Roy G. Biv mnemonic : R is for rice, O is for oats... uh, B for barley?...</q>','Prism',4);
		Game.TieredUpgrade('Pure cosmic light','<q>Your prisms now receive pristine, unadulterated photons from the other end of the universe.</q>','Prism',5);

		order=255;
		Game.GrandmaSynergy('Rainbow grandmas','A luminous grandma to sparkle into cookies.','Prism');
		
		order=24000;
		Game.seasonTriggerBasePrice=1000000000;//1111111111;
		new Game.Upgrade('Season switcher',loc("Allows you to <b>trigger seasonal events</b> at will, for a price.")+'<q>There will always be time.</q>',1111,[16,6],function(){for (var i in Game.seasons){Game.Unlock(Game.seasons[i].trigger);}});Game.last.pool='prestige';Game.last.parents=['Heralds'];
		new Game.Upgrade('Festive biscuit',loc("Triggers <b>%1 season</b> for the next 24 hours.<br>Triggering another season will cancel this one.<br>Cost scales with unbuffed CpS and increases with every season switch.",loc("Christmas"))+'<q>\'Twas the night before Christmas- or was it?</q>',Game.seasonTriggerBasePrice,[12,10]);Game.last.season='christmas';Game.last.pool='toggle';
		new Game.Upgrade('Ghostly biscuit',loc("Triggers <b>%1 season</b> for the next 24 hours.<br>Triggering another season will cancel this one.<br>Cost scales with unbuffed CpS and increases with every season switch.",loc("Halloween"))+'<q>spooky scary skeletons<br>will wake you with a boo</q>',Game.seasonTriggerBasePrice,[13,8]);Game.last.season='halloween';Game.last.pool='toggle';
		new Game.Upgrade('Lovesick biscuit',loc("Triggers <b>%1 season</b> for the next 24 hours.<br>Triggering another season will cancel this one.<br>Cost scales with unbuffed CpS and increases with every season switch.",loc("Valentine's day"))+'<q>Romance never goes out of fashion.</q>',Game.seasonTriggerBasePrice,[20,3]);Game.last.season='valentines';Game.last.pool='toggle';
		new Game.Upgrade('Fool\'s biscuit',loc("Triggers <b>%1 season</b> for the next 24 hours.<br>Triggering another season will cancel this one.<br>Cost scales with unbuffed CpS and increases with every season switch.",loc("Business day"))+'<q>Business. Serious business. This is absolutely all of your business.</q>',Game.seasonTriggerBasePrice,[17,6]);Game.last.season='fools';Game.last.pool='toggle';
		
		
		order=40000;
		new Game.Upgrade('Eternal seasons',loc("Seasons now last forever.")+'<q>Season to taste.</q>',7,[16,6],function(){for (var i in Game.seasons){Game.Unlock(Game.seasons[i].trigger);}});//debug purposes only
		Game.last.pool='debug';
		
		
		order=20000;
		new Game.Upgrade('Kitten managers',strKittenDesc+'<q>that\'s not gonna paws any problem, sir</q>',900000000000000000000,Game.GetIcon('Kitten',5));Game.last.kitten=1;Game.MakeTiered(Game.last,5,18);
		
		order=100;
		new Game.Upgrade('Septillion fingers',getStrThousandFingersGain(20)+'<q>[cursory flavor text]</q>',10000000000000000000,[12,20]);Game.MakeTiered(Game.last,11,0);
		new Game.Upgrade('Octillion fingers',getStrThousandFingersGain(20)+'<q>Turns out you <b>can</b> quite put your finger on it.</q>',10000000000000000000000,[12,19]);Game.MakeTiered(Game.last,12,0);
		
		order=150;new Game.Upgrade('Eludium mouse',getStrClickingGains(1)+'<q>I rodent do that if I were you.</q>',500000000000000,[11,15]);Game.MakeTiered(Game.last,6,11);
		new Game.Upgrade('Wishalloy mouse',getStrClickingGains(1)+'<q>Clicking is fine and dandy, but don\'t smash your mouse over it. Get your game on. Go play.</q>',50000000000000000,[11,16]);Game.MakeTiered(Game.last,7,11);
		order=200;Game.TieredUpgrade('Aging agents','<q>Counter-intuitively, grandmas have the uncanny ability to become more powerful the older they get.</q>','Grandma',6);
		order=300;Game.TieredUpgrade('Pulsar sprinklers','<q>There\'s no such thing as over-watering. The moistest is the bestest.</q>','Farm',6);
		order=500;Game.TieredUpgrade('Deep-bake process','<q>A patented process increasing cookie yield two-fold for the same amount of ingredients. Don\'t ask how, don\'t take pictures, and be sure to wear your protective suit.</q>','Factory',6);
		order=400;Game.TieredUpgrade('Coreforge','<q>You\'ve finally dug a tunnel down to the Earth\'s core. It\'s pretty warm down here.</q>','Mine',6);
		order=600;Game.TieredUpgrade('Generation ship','<q>Built to last, this humongous spacecraft will surely deliver your cookies to the deep ends of space, one day.</q>','Shipment',6);
		order=700;Game.TieredUpgrade('Origin crucible','<q>Built from the rarest of earths and located at the very deepest of the largest mountain, this legendary crucible is said to retain properties from the big-bang itself.</q>','Alchemy lab',6);
		order=800;Game.TieredUpgrade('Deity-sized portals','<q>It\'s almost like, say, an elder god could fit through this thing now. Hypothetically.</q>','Portal',6);
		order=900;Game.TieredUpgrade('Far future enactment','<q>The far future enactment authorizes you to delve deep into the future - where civilization has fallen and risen again, and cookies are plentiful.</q>','Time machine',6);
		order=1000;Game.TieredUpgrade('Nanocosmics','<q>The theory of nanocosmics posits that each subatomic particle is in fact its own self-contained universe, holding unfathomable amounts of energy.<br>This somehow stacks with the nested universe theory, because physics.</q>','Antimatter condenser',6);
		order=1100;
		Game.TieredUpgrade('Glow-in-the-dark','<q>Your prisms now glow in the dark, effectively doubling their output!</q>','Prism',6);
		
		order=10032;
		Game.NewUpgradeCookie({name:'Rose macarons',desc:'Although an odd flavor, these pastries recently rose in popularity.',icon:[22,3],require:'Box of macarons',		power:3,price: 9999});
		Game.NewUpgradeCookie({name:'Lemon macarons',desc:'Tastefully sour, delightful treats.',icon:[23,3],require:'Box of macarons',										power:3,price: 9999999});
		Game.NewUpgradeCookie({name:'Chocolate macarons',desc:'They\'re like tiny sugary burgers!',icon:[24,3],require:'Box of macarons',									power:3,price: 9999999999});
		Game.NewUpgradeCookie({name:'Pistachio macarons',desc:'Pistachio shells now removed after multiple complaints.',icon:[22,4],require:'Box of macarons',										power:3,price: 9999999999999});
		Game.NewUpgradeCookie({name:'Hazelnut macarons',desc:'These go especially well with coffee.',icon:[23,4],require:'Box of macarons',									power:3,price: 9999999999999999});
		Game.NewUpgradeCookie({name:'Violet macarons',desc:'It\'s like spraying perfume into your mouth!',icon:[24,4],require:'Box of macarons',							power:3,price: 9999999999999999999});
		
		order=40000;
		new Game.Upgrade('Magic shenanigans',loc("Cookie production <b>multiplied by 1,000</b>.")+'<q>It\'s magic. I ain\'t gotta explain sh<div style="display:inline-block;background:url(img/money.webp);width:16px;height:16px;position:relative;top:4px;left:0px;margin:0px -2px;"></div>t.</q>',7,[17,5]);//debug purposes only
		Game.last.pool='debug';
		
		
		order=24000;
		new Game.Upgrade('Bunny biscuit',loc("Triggers <b>%1 season</b> for the next 24 hours.<br>Triggering another season will cancel this one.<br>Cost scales with unbuffed CpS and increases with every season switch.",loc("Easter"))+'<q>All the world will be your enemy<br>and when they catch you,<br>they will kill you...<br>but first they must catch you.</q>',Game.seasonTriggerBasePrice,[0,12]);Game.last.season='easter';Game.last.pool='toggle';
		
		var eggPrice=999999999999;
		var eggPrice2=99999999999999;
		new Game.Upgrade('Chicken egg',getStrCookieProductionMultiplierPlus(1)+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>The egg. The egg came first. Get over it.</q>',eggPrice,[1,12]);
		new Game.Upgrade('Duck egg',getStrCookieProductionMultiplierPlus(1)+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>Then he waddled away.</q>',eggPrice,[2,12]);
		new Game.Upgrade('Turkey egg',getStrCookieProductionMultiplierPlus(1)+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>These hatch into strange, hand-shaped creatures.</q>',eggPrice,[3,12]);
		new Game.Upgrade('Quail egg',getStrCookieProductionMultiplierPlus(1)+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>These eggs are positively tiny. I mean look at them. How does this happen? Whose idea was that?</q>',eggPrice,[4,12]);
		new Game.Upgrade('Robin egg',getStrCookieProductionMultiplierPlus(1)+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>Holy azure-hued shelled embryos!</q>',eggPrice,[5,12]);
		new Game.Upgrade('Ostrich egg',getStrCookieProductionMultiplierPlus(1)+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>One of the largest eggs in the world. More like ostrouch, am I right?<br>Guys?</q>',eggPrice,[6,12]);
		new Game.Upgrade('Cassowary egg',getStrCookieProductionMultiplierPlus(1)+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>The cassowary is taller than you, possesses murderous claws and can easily outrun you.<br>You\'d do well to be casso-wary of them.</q>',eggPrice,[7,12]);
		new Game.Upgrade('Salmon roe',getStrCookieProductionMultiplierPlus(1)+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>Do the impossible, see the invisible.<br>Roe roe, fight the power?</q>',eggPrice,[8,12]);
		new Game.Upgrade('Frogspawn',getStrCookieProductionMultiplierPlus(1)+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>I was going to make a pun about how these "toadally look like eyeballs", but froget it.</q>',eggPrice,[9,12]);
		new Game.Upgrade('Shark egg',getStrCookieProductionMultiplierPlus(1)+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>HELLO IS THIS FOOD?<br>LET ME TELL YOU ABOUT FOOD.<br>WHY DO I KEEP EATING MY FRIENDS</q>',eggPrice,[10,12]);
		new Game.Upgrade('Turtle egg',getStrCookieProductionMultiplierPlus(1)+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>Turtles, right? Hatch from shells. Grow into shells. What\'s up with that?<br>Now for my skit about airplane food.</q>',eggPrice,[11,12]);
		new Game.Upgrade('Ant larva',getStrCookieProductionMultiplierPlus(1)+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>These are a delicacy in some countries, I swear. You will let these invade your digestive tract, and you will derive great pleasure from it.<br>And all will be well.</q>',eggPrice,[12,12]);
		new Game.Upgrade('Golden goose egg',loc("Golden cookies appear <b>%1%</b> more often.",5)+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>The sole vestige of a tragic tale involving misguided investments.</q>',eggPrice2,[13,12]);
		new Game.Upgrade('Faberge egg',loc("All buildings and upgrades are <b>%1% cheaper</b>.",1)+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>This outrageous egg is definitely fab.</q>',eggPrice2,[14,12],function(){Game.storeToRefresh=1;});
		new Game.Upgrade('Wrinklerspawn',loc("Wrinklers explode into <b>%1% more cookies</b>.",5)+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>Look at this little guy! It\'s gonna be a big boy someday! Yes it is!</q>',eggPrice2,[15,12]);
		new Game.Upgrade('Cookie egg',loc("Clicking is <b>%1%</b> more powerful.",10)+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>The shell appears to be chipped.<br>I wonder what\'s inside this one!</q>',eggPrice2,[16,12]);
		new Game.Upgrade('Omelette',loc("Other eggs appear <b>%1% more frequently</b>.",10)+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>Fromage not included.</q>',eggPrice2,[17,12]);
		new Game.Upgrade('Chocolate egg',loc("Contains <b>a lot of cookies</b>.")+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>Laid by the elusive cocoa bird. There\'s a surprise inside!</q>',eggPrice2,[18,12],function()
		{
			var cookies=Game.cookies*0.05;
			Game.Notify('Chocolate egg',loc("The egg bursts into <b>%1</b> cookies!",Beautify(cookies)),Game.Upgrades['Chocolate egg'].icon);
			Game.Earn(cookies);
		});
		new Game.Upgrade('Century egg',loc("You continually gain <b>more CpS the longer you've played</b> in the current ascension.")+'<br>'+loc("Cost scales with how many eggs you own.")+'<q>Actually not centuries-old. This one isn\'t a day over 86!</q>',eggPrice2,[19,12]);
		Game.last.descFunc=function(){
				var day=Math.floor((Date.now()-Game.startDate)/1000/10)*10/60/60/24;
				day=Math.min(day,100);
				var n=(1-Math.pow(1-day/100,3))*0.1;
			return '<div style="text-align:center;">'+loc("Current boost:")+' <b>+'+Beautify(n*100,1)+'%</b></div><div class="line"></div>'+this.ddesc;
		};
		new Game.Upgrade('"egg"','<b>'+loc("+%1 CpS",9)+'</b><q>hey it\'s "egg"</q>',eggPrice2,[20,12]);
		
		Game.easterEggs=['Chicken egg','Duck egg','Turkey egg','Quail egg','Robin egg','Ostrich egg','Cassowary egg','Salmon roe','Frogspawn','Shark egg','Turtle egg','Ant larva','Golden goose egg','Faberge egg','Wrinklerspawn','Cookie egg','Omelette','Chocolate egg','Century egg','"egg"'];
		Game.eggDrops=['Chicken egg','Duck egg','Turkey egg','Quail egg','Robin egg','Ostrich egg','Cassowary egg','Salmon roe','Frogspawn','Shark egg','Turtle egg','Ant larva'];
		Game.rareEggDrops=['Golden goose egg','Faberge egg','Wrinklerspawn','Cookie egg','Omelette','Chocolate egg','Century egg','"egg"'];
		
		// CC3: loop vars renamed i → ix (these were the first `var i` in
		// function scope; the later numeric `for (var i=0;…)` loops keep `i`,
		// so all same-scope declarations now agree on one type).
		for (var ix in Game.eggDrops)//scale egg prices to how many eggs you have
		{Game.Upgrades[Game.eggDrops[ix]].priceFunc=function(){return Math.pow(2,Game.GetHowManyEggs())*999;}}
		
		for (var ix in Game.rareEggDrops)
		{Game.Upgrades[Game.rareEggDrops[ix]].priceFunc=function(){return Math.pow(3,Game.GetHowManyEggs())*999;}}

		
		
		order=10032;
		Game.NewUpgradeCookie({name:'Caramel macarons',desc:'The saltiest, chewiest of them all.',icon:[25,3],require:'Box of macarons',		power:3,price: 9999999999999999999999});
		Game.NewUpgradeCookie({name:'Licorice macarons',desc:'Also known as "blackarons".',icon:[25,4],require:'Box of macarons',				power:3,price: 9999999999999999999999999});
		
		
		order=525;
		Game.TieredUpgrade('Taller tellers','<q>Able to process a higher amount of transactions. Careful though, as taller tellers tell tall tales.</q>','Bank',1);
		Game.TieredUpgrade('Scissor-resistant credit cards','<q>For those truly valued customers.</q>','Bank',2);
		Game.TieredUpgrade('Acid-proof vaults','<q>You know what they say : better safe than sorry.</q>','Bank',3);
		Game.TieredUpgrade('Chocolate coins','<q>This revolutionary currency is much easier to melt from and into ingots - and tastes much better, for a change.</q>','Bank',4);
		Game.TieredUpgrade('Exponential interest rates','<q>Can\'t argue with mathematics! Now fork it over.</q>','Bank',5);
		Game.TieredUpgrade('Financial zen','<q>The ultimate grail of economic thought; the feng shui of big money, the stock market yoga - the Heimlich maneuver of dimes and nickels.</q>','Bank',6);
		
		order=550;
		Game.TieredUpgrade('Golden idols','<q>Lure even greedier adventurers to retrieve your cookies. Now that\'s a real idol game!</q>','Temple',1);
		Game.TieredUpgrade('Sacrifices','<q>What\'s a life to a gigaton of cookies?</q>','Temple',2);
		Game.TieredUpgrade('Delicious blessing','<q>And lo, the Baker\'s almighty spoon came down and distributed holy gifts unto the believers - shimmering sugar, and chocolate dark as night, and all manner of wheats. And boy let me tell you, that party was mighty gnarly.</q>','Temple',3);
		Game.TieredUpgrade('Sun festival','<q>Free the primordial powers of your temples with these annual celebrations involving fire-breathers, traditional dancing, ritual beheadings and other merriments!</q>','Temple',4);
		Game.TieredUpgrade('Enlarged pantheon','<q>Enough spiritual inadequacy! More divinities than you\'ll ever need, or your money back! 100% guaranteed!</q>','Temple',5);
		Game.TieredUpgrade('Great Baker in the sky','<q>This is it. The ultimate deity has finally cast Their sublimely divine eye upon your operation; whether this is a good thing or possibly the end of days is something you should find out very soon.</q>','Temple',6);
		
		order=575;
		Game.TieredUpgrade('Pointier hats','<q>Tests have shown increased thaumic receptivity relative to the geometric proportions of wizardly conic implements.</q>','Wizard tower',1);
		Game.TieredUpgrade('Beardlier beards','<q>Haven\'t you heard? The beard is the word.</q>','Wizard tower',2);
		Game.TieredUpgrade('Ancient grimoires','<q>Contain interesting spells such as "Turn Water To Drool", "Grow Eyebrows On Furniture" and "Summon Politician".</q>','Wizard tower',3);
		Game.TieredUpgrade('Kitchen curses','<q>Exotic magic involved in all things pastry-related. Hexcellent!</q>','Wizard tower',4);
		Game.TieredUpgrade('School of sorcery','<q>This cookie-funded academy of witchcraft is home to the 4 prestigious houses of magic : the Jocks, the Nerds, the Preps, and the Deathmunchers.</q>','Wizard tower',5);
		Game.TieredUpgrade('Dark formulas','<q>Eldritch forces are at work behind these spells - you get the feeling you really shouldn\'t be messing with those. But I mean, free cookies, right?</q>','Wizard tower',6);

		order=250;
		Game.GrandmaSynergy('Banker grandmas','A nice banker to cash in more cookies.','Bank');
		Game.GrandmaSynergy('Priestess grandmas','A nice priestess to praise the one true Baker in the sky.','Temple');
		Game.GrandmaSynergy('Witch grandmas','A nice witch to cast a zip, and a zoop, and poof! Cookies.','Wizard tower');
		
		
		
		order=0;
		new Game.Upgrade('Tin of british tea biscuits',loc("Contains an assortment of fancy biscuits.")+'<q>Every time is tea time.</q>',25,[21,8]);Game.last.pool='prestige';Game.last.parents=['Heavenly cookies'];
		new Game.Upgrade('Box of macarons',loc("Contains an assortment of macarons.")+'<q>Multicolored delicacies filled with various kinds of jam.<br>Not to be confused with macaroons, macaroni, macarena or any of that nonsense.</q>',25,[20,8]);Game.last.pool='prestige';Game.last.parents=['Heavenly cookies'];
		new Game.Upgrade('Box of brand biscuits',loc("Contains an assortment of popular biscuits.")+'<q>They\'re brand new!</q>',25,[20,9]);Game.last.pool='prestige';Game.last.parents=['Heavenly cookies'];
	
		order=10020;
		Game.NewUpgradeCookie({name:'Pure black chocolate cookies',desc:'Dipped in a lab-made substance darker than the darkest cocoa (dubbed "chocoalate").',icon:[26,3],power:									5,price: 9999999999999999*5});
		Game.NewUpgradeCookie({name:'Pure white chocolate cookies',desc:'Elaborated on the nano-scale, the coating on this biscuit is able to refract light even in a pitch-black environment.',icon:[26,4],power:	5,price: 9999999999999999*5});
		Game.NewUpgradeCookie({name:'Ladyfingers',desc:'Cleaned and sanitized so well you\'d swear they\'re actual biscuits.',icon:[27,3],power:																	3,price: 99999999999999999});
		Game.NewUpgradeCookie({name:'Tuiles',desc:'These never go out of tile.',icon:[27,4],power:																													3,price: 99999999999999999*5});
		Game.NewUpgradeCookie({name:'Chocolate-stuffed biscuits',desc:'A princely snack!<br>The holes are so the chocolate stuffing can breathe.',icon:[28,3],power:												3,price: 999999999999999999});
		Game.NewUpgradeCookie({name:'Checker cookies',desc:'A square cookie? This solves so many storage and packaging problems! You\'re a genius!',icon:[28,4],power:												3,price: 999999999999999999*5});
		Game.NewUpgradeCookie({name:'Butter cookies',desc:'These melt right off your mouth and into your heart. (Let\'s face it, they\'re rather fattening.)',icon:[29,3],power:									3,price: 9999999999999999999});
		Game.NewUpgradeCookie({name:'Cream cookies',desc:'It\'s like two chocolate chip cookies! But brought together with the magic of cream! It\'s fiendishly perfect!',icon:[29,4],power:						3,price: 9999999999999999999*5});

		order=0;
		var desc=loc("Placing an upgrade in this slot will make its effects <b>permanent</b> across all playthroughs.");
		new Game.Upgrade('Permanent upgrade slot I',desc,	100,[0,10]);Game.last.pool='prestige';Game.last.iconFunction=function(){return Game.PermanentSlotIcon(0);};Game.last.activateFunction=function(){Game.AssignPermanentSlot(0);};
		new Game.Upgrade('Permanent upgrade slot II',desc,	20000,[1,10]);Game.last.pool='prestige';Game.last.parents=['Permanent upgrade slot I'];Game.last.iconFunction=function(){return Game.PermanentSlotIcon(1);};Game.last.activateFunction=function(){Game.AssignPermanentSlot(1);};
		new Game.Upgrade('Permanent upgrade slot III',desc,	3000000,[2,10]);Game.last.pool='prestige';Game.last.parents=['Permanent upgrade slot II'];Game.last.iconFunction=function(){return Game.PermanentSlotIcon(2);};Game.last.activateFunction=function(){Game.AssignPermanentSlot(2);};
		new Game.Upgrade('Permanent upgrade slot IV',desc,	400000000,[3,10]);Game.last.pool='prestige';Game.last.parents=['Permanent upgrade slot III'];Game.last.iconFunction=function(){return Game.PermanentSlotIcon(3);};Game.last.activateFunction=function(){Game.AssignPermanentSlot(3);};
		new Game.Upgrade('Permanent upgrade slot V',desc,	50000000000,[4,10]);Game.last.pool='prestige';Game.last.parents=['Permanent upgrade slot IV'];Game.last.iconFunction=function(){return Game.PermanentSlotIcon(4);};Game.last.activateFunction=function(){Game.AssignPermanentSlot(4);};
		
		var slots=['Permanent upgrade slot I','Permanent upgrade slot II','Permanent upgrade slot III','Permanent upgrade slot IV','Permanent upgrade slot V'];
		for (var i=0;i<slots.length;i++)
		{
			Game.Upgrades[slots[i]].descFunc=function(i: any){return function(this: any,context: any){
				if (Game.permanentUpgrades[i]==-1) return this.desc+(context=='stats'?'':'<br><b>'+loc("Click to activate.")+'</b>');
				var upgrade=Game.UpgradesById[Game.permanentUpgrades[i]];
				return '<div style="text-align:center;">'+loc("Current:")+' '+tinyIcon(upgrade.icon)+' <b>'+upgrade.dname+'</b><div class="line"></div></div>'+this.ddesc+(context=='stats'?'':'<br><b>'+loc("Click to activate.")+'</b>');
			};}(i);
		}
		
		
		new Game.Upgrade('Starspawn',loc("Eggs drop <b>%1%</b> more often.",10)+'<br>'+loc("Golden cookies appear <b>%1%</b> more often during %2.",[2,loc("Easter")]),111111,[0,12]);Game.last.pool='prestige';Game.last.parents=['Season switcher'];
		new Game.Upgrade('Starsnow',loc("Christmas cookies drop <b>%1%</b> more often.",5)+'<br>'+loc("Reindeer appear <b>%1%</b> more often.",5),111111,[12,9]);Game.last.pool='prestige';Game.last.parents=['Season switcher'];
		new Game.Upgrade('Starterror',loc("Spooky cookies drop <b>%1%</b> more often.",10)+'<br>'+loc("Golden cookies appear <b>%1%</b> more often during %2.",[2,loc("Halloween")]),111111,[13,8]);Game.last.pool='prestige';Game.last.parents=['Season switcher'];
		new Game.Upgrade('Starlove',loc("Heart cookies are <b>%1%</b> more powerful.",50)+'<br>'+loc("Golden cookies appear <b>%1%</b> more often during %2.",[2,loc("Valentine's day")]),111111,[20,3]);Game.last.pool='prestige';Game.last.parents=['Season switcher'];
		new Game.Upgrade('Startrade',loc("Golden cookies appear <b>%1%</b> more often during %2.",[5,loc("Business day")]),111111,[17,6]);Game.last.pool='prestige';Game.last.parents=['Season switcher'];
		
		var angelPriceFactor=7;
		// CC3: renamed desc → angelDesc (the permanent-slot `desc` string
		// above already owns that name in this scope; a local, unobservable
		// rename).
		var angelDesc=function(percent: any,total: any){return loc("You gain another <b>+%1%</b> of your regular CpS while the game is closed, for a total of <b>%2%</b>.",[percent,total]);}
		new Game.Upgrade('Angels',angelDesc(10,15)+'<q>Lowest-ranking at the first sphere of pastry heaven, angels are tasked with delivering new recipes to the mortals they deem worthy.</q>',Math.pow(angelPriceFactor,1),[0,11]);Game.last.pool='prestige';Game.last.parents=['Twin Gates of Transcendence'];
		new Game.Upgrade('Archangels',angelDesc(10,25)+'<q>Members of the first sphere of pastry heaven, archangels are responsible for the smooth functioning of the world\'s largest bakeries.</q>',Math.pow(angelPriceFactor,2),[1,11]);Game.last.pool='prestige';Game.last.parents=['Angels'];
		new Game.Upgrade('Virtues',angelDesc(10,35)+'<q>Found at the second sphere of pastry heaven, virtues make use of their heavenly strength to push and drag the stars of the cosmos.</q>',Math.pow(angelPriceFactor,3),[2,11]);Game.last.pool='prestige';Game.last.parents=['Archangels'];
		new Game.Upgrade('Dominions',angelDesc(10,45)+'<q>Ruling over the second sphere of pastry heaven, dominions hold a managerial position and are in charge of accounting and regulating schedules.</q>',Math.pow(angelPriceFactor,4),[3,11]);Game.last.pool='prestige';Game.last.parents=['Virtues'];
		new Game.Upgrade('Cherubim',angelDesc(10,55)+'<q>Sieging at the first sphere of pastry heaven, the four-faced cherubim serve as heavenly bouncers and bodyguards.</q>',Math.pow(angelPriceFactor,5),[4,11]);Game.last.pool='prestige';Game.last.parents=['Dominions'];
		new Game.Upgrade('Seraphim',angelDesc(10,65)+'<q>Leading the first sphere of pastry heaven, seraphim possess ultimate knowledge of everything pertaining to baking.</q>',Math.pow(angelPriceFactor,6),[5,11]);Game.last.pool='prestige';Game.last.parents=['Cherubim'];
		new Game.Upgrade('God',angelDesc(10,75)+'<q>Like Santa, but less fun.</q>',Math.pow(angelPriceFactor,7),[6,11]);Game.last.pool='prestige';Game.last.parents=['Seraphim'];
		
		new Game.Upgrade('Twin Gates of Transcendence',loc("You now <b>keep making cookies while the game is closed</b>, at the rate of <b>%1%</b> of your regular CpS and up to <b>1 hour</b> after the game is closed.<br>(Beyond 1 hour, this is reduced by a further %2% - your rate goes down to <b>%3%</b> of your CpS.)",[5,90,0.5])+'<q>This is one occasion you\'re always underdressed for. Don\'t worry, just rush in past the bouncer and pretend you know people.</q>',1,[15,11]);Game.last.pool='prestige';

		new Game.Upgrade('Heavenly luck',loc("Golden cookies appear <b>%1%</b> more often.",5)+'<q>Someone up there likes you.</q>',77,[22,6]);Game.last.pool='prestige';
		new Game.Upgrade('Lasting fortune',loc("Golden cookie effects last <b>%1%</b> longer.",10)+'<q>This isn\'t your average everyday luck. This is... advanced luck.</q>',777,[23,6]);Game.last.pool='prestige';Game.last.parents=['Heavenly luck'];
		new Game.Upgrade('Decisive fate',loc("Golden cookies stay <b>%1%</b> longer.",5)+'<q>Life just got a bit more intense.</q>',7777,[10,14]);Game.last.pool='prestige';Game.last.parents=['Lasting fortune'];

		new Game.Upgrade('Divine discount',loc("All buildings are <b>%1% cheaper</b>.",1)+'<q>Someone special deserves a special price.</q>',99999,[21,7]);Game.last.pool='prestige';Game.last.parents=['Decisive fate'];
		new Game.Upgrade('Divine sales',loc("All upgrades are <b>%1% cheaper</b>.",1)+'<q>Everything must go!</q>',99999,[18,7]);Game.last.pool='prestige';Game.last.parents=['Decisive fate'];
		new Game.Upgrade('Divine bakeries',loc("Cookie upgrades are <b>%1 times cheaper</b>.",5)+'<q>They sure know what they\'re doing.</q>',399999,[17,7]);Game.last.pool='prestige';Game.last.parents=['Divine sales','Divine discount'];
		
		new Game.Upgrade('Starter kit',loc("You start with <b>%1</b>.",loc("%1 cursor",10))+'<q>This can come in handy.</q>',50,[0,14]);Game.last.pool='prestige';Game.last.parents=['Tin of british tea biscuits','Box of macarons','Box of brand biscuits','Tin of butter cookies'];
		new Game.Upgrade('Starter kitchen',loc("You start with <b>%1</b>.",loc("%1 grandma",5))+'<q>Where did these come from?</q>',5000,[1,14]);Game.last.pool='prestige';Game.last.parents=['Starter kit'];
		new Game.Upgrade('Halo gloves',loc("Clicking is <b>%1%</b> more powerful.",10)+'<q>Smite that cookie.</q>',55555,[22,7]);Game.last.pool='prestige';Game.last.parents=['Starter kit'];

		new Game.Upgrade('Kitten angels',strKittenDesc+'<q>All cats go to heaven.</q>',9000,[23,7]);Game.last.pool='prestige';Game.last.parents=['Dominions'];Game.last.kitten=1;
		
		new Game.Upgrade('Unholy bait',loc("Wrinklers appear <b>%1 times</b> as fast.",5)+'<q>No wrinkler can resist the scent of worm biscuits.</q>',44444,[15,12]);Game.last.pool='prestige';Game.last.parents=['Starter kitchen'];
		new Game.Upgrade('Sacrilegious corruption',loc("Wrinklers explode into <b>%1% more cookies</b>.",5)+'<q>Unique in the animal kingdom, the wrinkler digestive tract is able to withstand an incredible degree of dilation - provided you prod them appropriately.</q>',444444,[19,8]);Game.last.pool='prestige';Game.last.parents=['Unholy bait'];
		
		
		order=200;Game.TieredUpgrade('Xtreme walkers','<q>Complete with flame decals and a little horn that goes "toot".</q>','Grandma',7);
		order=300;Game.TieredUpgrade('Fudge fungus','<q>A sugary parasite whose tendrils help cookie growth.<br>Please do not breathe in the spores. In case of spore ingestion, seek medical help within the next 36 seconds.</q>','Farm',7);
		order=400;Game.TieredUpgrade('Planetsplitters','<q>These new state-of-the-art excavators have been tested on Merula, Globort and Flwanza VI, among other distant planets which have been curiously quiet lately.</q>','Mine',7);
		order=500;Game.TieredUpgrade('Cyborg workforce','<q>Semi-synthetic organisms don\'t slack off, don\'t unionize, and have 20% shorter lunch breaks, making them ideal labor fodder.</q>','Factory',7);
		order=525;Game.TieredUpgrade('Way of the wallet','<q>This new monetary school of thought is all the rage on the banking scene; follow its precepts and you may just profit from it.</q>','Bank',7);
		order=550;Game.TieredUpgrade('Creation myth','<q>Stories have been circulating about the origins of the very first cookie that was ever baked; tales of how it all began, in the Dough beyond time and the Ovens of destiny.</q>','Temple',7);
		order=575;Game.TieredUpgrade('Cookiemancy','<q>There it is; the perfected school of baking magic. From summoning chips to hexing nuts, there is not a single part of cookie-making that hasn\'t been improved tenfold by magic tricks.</q>','Wizard tower',7);
		order=600;Game.TieredUpgrade('Dyson sphere','<q>You\'ve found a way to apply your knowledge of cosmic technology to slightly more local endeavors; this gigantic sphere of meta-materials, wrapping the solar system, is sure to kick your baking abilities up a notch.</q>','Shipment',7);
		order=700;Game.TieredUpgrade('Theory of atomic fluidity','<q>Pushing alchemy to its most extreme limits, you find that everything is transmutable into anything else - lead to gold, mercury to water; more importantly, you realize that anything can -and should- be converted to cookies.</q>','Alchemy lab',7);
		order=800;Game.TieredUpgrade('End of times back-up plan','<q>Just in case, alright?</q>','Portal',7);
		order=900;Game.TieredUpgrade('Great loop hypothesis','<q>What if our universe is just one instance of an infinite cycle? What if, before and after it, stretched infinite amounts of the same universe, themselves containing infinite amounts of cookies?</q>','Time machine',7);
		order=1000;Game.TieredUpgrade('The Pulse','<q>You\'ve tapped into the very pulse of the cosmos, a timeless rhythm along which every material and antimaterial thing beats in unison. This, somehow, means more cookies.</q>','Antimatter condenser',7);
		order=1100;
		Game.TieredUpgrade('Lux sanctorum','<q>Your prism attendants have become increasingly mesmerized with something in the light - or maybe something beyond it; beyond us all, perhaps?</q>','Prism',7);
		
		
		order=200;Game.TieredUpgrade('The Unbridling','<q>It might be a classic tale of bad parenting, but let\'s see where grandma is going with this.</q>','Grandma',8);
		order=300;Game.TieredUpgrade('Wheat triffids','<q>Taking care of crops is so much easier when your plants can just walk about and help around the farm.<br>Do not pet. Do not feed. Do not attempt to converse with.</q>','Farm',8);
		order=400;Game.TieredUpgrade('Canola oil wells','<q>A previously untapped resource, canola oil permeates the underground olifers which grant it its particular taste and lucrative properties.</q>','Mine',8);
		order=500;Game.TieredUpgrade('78-hour days','<q>Why didn\'t we think of this earlier?</q>','Factory',8);
		order=525;Game.TieredUpgrade('The stuff rationale','<q>If not now, when? If not it, what? If not things... stuff?</q>','Bank',8);
		order=550;Game.TieredUpgrade('Theocracy','<q>You\'ve turned your cookie empire into a perfect theocracy, gathering the adoration of zillions of followers from every corner of the universe.<br>Don\'t let it go to your head.</q>','Temple',8);
		order=575;Game.TieredUpgrade('Rabbit trick','<q>Using nothing more than a fancy top hat, your wizards have found a way to simultaneously curb rabbit population and produce heaps of extra cookies for basically free!<br>Resulting cookies may or may not be fit for vegans.</q>','Wizard tower',8);
		order=600;Game.TieredUpgrade('The final frontier','<q>It\'s been a long road, getting from there to here. It\'s all worth it though - the sights are lovely and the oil prices slightly more reasonable.</q>','Shipment',8);
		order=700;Game.TieredUpgrade('Beige goo','<q>Well now you\'ve done it. Good job. Very nice. That\'s 3 galaxies you\'ve just converted into cookies. Good thing you can hop from universe to universe.</q>','Alchemy lab',8);
		order=800;Game.TieredUpgrade('Maddening chants','<q>A popular verse goes like so : "jau\'hn madden jau\'hn madden aeiouaeiouaeiou brbrbrbrbrbrbr"</q>','Portal',8);
		order=900;Game.TieredUpgrade('Cookietopian moments of maybe','<q>Reminiscing how things could have been, should have been, will have been.</q>','Time machine',8);
		order=1000;Game.TieredUpgrade('Some other super-tiny fundamental particle? Probably?','<q>When even the universe is running out of ideas, that\'s when you know you\'re nearing the end.</q>','Antimatter condenser',8);
		order=1100;
		Game.TieredUpgrade('Reverse shadows','<q>Oh man, this is really messing with your eyes.</q>','Prism',8);
		
		
		order=20000;
		new Game.Upgrade('Kitten accountants',strKittenDesc+'<q>business going great, sir</q>',900000000000000000000000,Game.GetIcon('Kitten',6));Game.last.kitten=1;Game.MakeTiered(Game.last,6,18);
		new Game.Upgrade('Kitten specialists',strKittenDesc+'<q>optimeowzing your workflow like whoah, sir</q>',900000000000000000000000000,Game.GetIcon('Kitten',7));Game.last.kitten=1;Game.MakeTiered(Game.last,7,18);
		new Game.Upgrade('Kitten experts',strKittenDesc+'<q>10 years expurrrtise in the cookie business, sir</q>',900000000000000000000000000000,Game.GetIcon('Kitten',8));Game.last.kitten=1;Game.MakeTiered(Game.last,8,18);
		
		new Game.Upgrade('How to bake your dragon',loc("Allows you to purchase a <b>crumbly egg</b> once you have earned 1 million cookies.")+'<q>A tome full of helpful tips such as "oh god, stay away from it", "why did we buy this thing, it\'s not even house-broken" and "groom twice a week in the direction of the scales".</q>',9,[22,12]);Game.last.pool='prestige';

		order=25100;
		new Game.Upgrade('A crumbly egg',loc("Unlocks the <b>cookie dragon egg</b>.")+'<q>Thank you for adopting this robust, fun-loving cookie dragon! It will bring you years of joy and entertainment.<br>Keep in a dry and cool place, and away from other house pets. Subscription to home insurance is strongly advised.</q>',25,[21,12]);
		
		new Game.Upgrade('Chimera',loc("Synergy upgrades are <b>%1% cheaper</b>.",2)+'<br>'+loc("You gain another <b>+%1%</b> of your regular CpS while the game is closed.",5)+'<br>'+loc("You retain optimal cookie production while the game is closed for <b>%1 more days</b>.",2)+'<q>More than the sum of its parts.</q>',Math.pow(angelPriceFactor,9),[24,7]);Game.last.pool='prestige';Game.last.parents=['God','Lucifer','Synergies Vol. II'];
		
		new Game.Upgrade('Tin of butter cookies',loc("Contains an assortment of rich butter cookies.")+'<q>Five varieties of danish cookies.<br>Complete with little paper cups.</q>',25,[21,9]);Game.last.pool='prestige';Game.last.parents=['Heavenly cookies'];
		
		new Game.Upgrade('Golden switch',loc("Unlocks the <b>golden switch</b>, which passively boosts your CpS by %1% but disables golden cookies.",50)+'<q>Less clicking, more idling.</q>',999,[21,10]);Game.last.pool='prestige';Game.last.parents=['Heavenly luck'];
		
		new Game.Upgrade('Classic dairy selection',loc("Unlocks the <b>milk selector</b>, letting you pick which milk is displayed under your cookie.<br>Comes with a variety of basic flavors.")+'<q>Don\'t have a cow, man.</q>',9,[1,8]);Game.last.pool='prestige';Game.last.parents=[];
		
		new Game.Upgrade('Fanciful dairy selection',loc("Contains more exotic flavors for your milk selector.")+'<q>Strong bones for the skeleton army.</q>',1000000,[9,7]);Game.last.pool='prestige';Game.last.parents=['Classic dairy selection'];
		
		order=10300;
		Game.NewUpgradeCookie({name:'Dragon cookie',desc:'Imbued with the vigor and vitality of a full-grown cookie dragon, this mystical cookie will embolden your empire for the generations to come.',icon:[10,25],power:5,price:9999999999999999*7,locked:1});
		
		
		order=40000;
		new Game.Upgrade('Golden switch [off]',loc("Turning this on will give you a passive <b>+%1% CpS</b>, but prevents golden cookies from spawning.<br>Cost is equal to 1 hour of production.",50),1000000,[20,10]);
		Game.last.pool='toggle';Game.last.toggleInto='Golden switch [on]';
		Game.last.priceFunc=function(){return Game.cookiesPs*60*60;}
		var func: any=function(this: any){
			if (Game.Has('Residual luck'))
			{
				var bonus=0;
				var upgrades=Game.goldenCookieUpgrades;
				for (var i in upgrades) {if (Game.Has(upgrades[i])) bonus++;}
				return '<div style="text-align:center;">'+Game.listTinyOwnedUpgrades(Game.goldenCookieUpgrades)+'<br><br>The effective boost is <b>+'+Beautify(Math.round(50+bonus*10))+'%</b><br>thanks to residual luck<br>and your <b>'+bonus+'</b> golden cookie upgrade'+(bonus==1?'':'s')+'.</div><div class="line"></div>'+this.ddesc;
			}
			return this.desc;
		};
		if (EN) Game.last.descFunc=func;
		
		new Game.Upgrade('Golden switch [on]',loc("The switch is currently giving you a passive <b>+%1% CpS</b>; it also prevents golden cookies from spawning.<br>Turning it off will revert those effects.<br>Cost is equal to 1 hour of production.",50),1000000,[21,10]);
		Game.last.pool='toggle';Game.last.toggleInto='Golden switch [off]';
		Game.last.priceFunc=function(){return Game.cookiesPs*60*60;}
		Game.last.descFunc=func;
		
		order=50000;
		new Game.Upgrade('Milk selector',loc("Lets you pick what flavor of milk to display."),0,[1,8]);
		Game.last.descFunc=function(){
			var choice=this.choicesFunction()[Game.milkType];
			if (!choice) choice=this.choicesFunction()[0];
			return '<div style="text-align:center;">'+loc("Current:")+' '+tinyIcon(choice.icon)+' <b>'+choice.name+'</b></div><div class="line"></div>'+this.ddesc;
		};
		
		Game.last.pool='toggle';
		Game.last.choicesFunction=function()
		{
			var choices: any[]=[];
			
			for (var i=0;i<Game.AllMilks.length;i++)
			{
				var it=Game.AllMilks[i];
				choices.push({name:it.name,icon:it.icon,milk:it,order:it.type});
			}
			
			choices[11].div=true;
			
			var maxRank=Math.floor(Game.AchievementsOwned/25);
			for (var i=0;i<choices.length;i++)
			{
				var it=choices[i].milk;
				if (it.type==1 && !Game.Has('Fanciful dairy selection')) choices[i]=0;
				if (it.rank && it.rank>maxRank) choices[i]=0;
			}
			
			choices[Game.milkType].selected=1;
			return choices;
		}
		Game.last.choicesPick=function(id: any)
		{Game.milkType=id;}
		
		
		order=10300;
		var butterBiscuitMult=100000000;
		Game.NewUpgradeCookie({name:'Milk chocolate butter biscuit',desc:'Rewarded for owning 100 of everything.<br>It bears the engraving of a fine entrepreneur.',icon:[27,8],power:	10,price: 999999999999999999999*butterBiscuitMult,locked:1});
		Game.NewUpgradeCookie({name:'Dark chocolate butter biscuit',desc:'Rewarded for owning 150 of everything.<br>It is adorned with the image of an experienced cookie tycoon.',icon:[27,9],power:	10,price: 999999999999999999999999*butterBiscuitMult,locked:1});
		Game.NewUpgradeCookie({name:'White chocolate butter biscuit',desc:'Rewarded for owning 200 of everything.<br>The chocolate is chiseled to depict a masterful pastry magnate.',icon:[28,9],power:	10,price: 999999999999999999999999999*butterBiscuitMult,locked:1});
		Game.NewUpgradeCookie({name:'Ruby chocolate butter biscuit',desc:'Rewarded for owning 250 of everything.<br>Covered in a rare red chocolate, this biscuit is etched to represent the face of a cookie industrialist gone mad with power.',icon:[28,8],power:	10,price: 999999999999999999999999999999*butterBiscuitMult,locked:1});
		
		order=10020;
		Game.NewUpgradeCookie({name:'Gingersnaps',desc:'Cookies with a soul. Probably.',icon:[29,10],power:						4,price: 99999999999999999999});
		Game.NewUpgradeCookie({name:'Cinnamon cookies',desc:'The secret is in the patented swirly glazing.',icon:[23,8],power:						4,price: 99999999999999999999*5});
		Game.NewUpgradeCookie({name:'Vanity cookies',desc:'One tiny candied fruit sits atop this decadent cookie.',icon:[22,8],power:						4,price: 999999999999999999999});
		Game.NewUpgradeCookie({name:'Cigars',desc:'Close, but no match for those extravagant cookie straws they serve in coffee shops these days.',icon:[25,8],power:						4,price: 999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Pinwheel cookies',desc:'Bringing you the dizzying combination of brown flavor and beige taste!',icon:[22,10],power:						4,price: 9999999999999999999999});
		Game.NewUpgradeCookie({name:'Fudge squares',desc:'Not exactly cookies, but you won\'t care once you\'ve tasted one of these.<br>They\'re so good, it\'s fudged-up!',icon:[24,8],power:						4,price: 9999999999999999999999*5});
		
		order=10030;
		Game.NewUpgradeCookie({name:'Digits',desc:'Three flavors, zero phalanges.',icon:[26,8],require:'Box of brand biscuits',power:												2,	price:	999999999999999*5});
		
		order=10029;
		Game.NewUpgradeCookie({name:'Butter horseshoes',desc:'It would behoove you to not overindulge in these.',icon:[22,9],require:'Tin of butter cookies',power:							4,	price:	99999999999999999999999});
		Game.NewUpgradeCookie({name:'Butter pucks',desc:'Lord, what fools these mortals be!<br>(This is kind of a hokey reference.)',icon:[23,9],require:'Tin of butter cookies',power:							4,	price:	99999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Butter knots',desc:'Look, you can call these pretzels if you want, but you\'d just be fooling yourself, wouldn\'t you?',icon:[24,9],require:'Tin of butter cookies',power:							4,	price:	999999999999999999999999});
		Game.NewUpgradeCookie({name:'Butter slabs',desc:'Nothing butter than a slab to the face.',icon:[25,9],require:'Tin of butter cookies',power:							4,	price:	999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Butter swirls',desc:'These are equal parts sugar, butter, and warm fuzzy feelings - all of which cause millions of deaths every day.',icon:[26,9],require:'Tin of butter cookies',power:							4,	price:	9999999999999999999999999});
		
		order=10020;
		Game.NewUpgradeCookie({name:'Shortbread biscuits',desc:'These rich butter cookies are neither short, nor bread. What a country!',icon:[23,10],power:						4,price: 99999999999999999999999});
		Game.NewUpgradeCookie({name:'Millionaires\' shortbreads',desc:'Three thought-provoking layers of creamy chocolate, hard-working caramel and crumbly biscuit in a poignant commentary of class struggle.',icon:[24,10],power:						4,price: 99999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Caramel cookies',desc:'The polymerized carbohydrates adorning these cookies are sure to stick to your teeth for quite a while.',icon:[25,10],power:						4,price: 999999999999999999999999});
		
		
		// CC3: renamed desc → demonDesc (same scope-collision reason as
		// angelDesc above).
		var demonDesc=function(totalHours: any){
			return loc("You retain optimal cookie production while the game is closed for twice as long, for a total of <b>%1</b>.",Game.sayTime(totalHours*60*60*Game.fps,-1));
		}
		new Game.Upgrade('Belphegor',demonDesc(2)+'<q>A demon of shortcuts and laziness, Belphegor commands machines to do work in his stead.</q>',Math.pow(angelPriceFactor,1),[7,11]);Game.last.pool='prestige';Game.last.parents=['Twin Gates of Transcendence'];
		new Game.Upgrade('Mammon',demonDesc(4)+'<q>The demonic embodiment of wealth, Mammon requests a tithe of blood and gold from all his worshippers.</q>',Math.pow(angelPriceFactor,2),[8,11]);Game.last.pool='prestige';Game.last.parents=['Belphegor'];
		new Game.Upgrade('Abaddon',demonDesc(8)+'<q>Master of overindulgence, Abaddon governs the wrinkler brood and inspires their insatiability.</q>',Math.pow(angelPriceFactor,3),[9,11]);Game.last.pool='prestige';Game.last.parents=['Mammon'];
		new Game.Upgrade('Satan',demonDesc(16)+'<q>The counterpoint to everything righteous, this demon represents the nefarious influence of deceit and temptation.</q>',Math.pow(angelPriceFactor,4),[10,11]);Game.last.pool='prestige';Game.last.parents=['Abaddon'];
		new Game.Upgrade('Asmodeus',demonDesc(32)+'<q>This demon with three monstrous heads draws his power from the all-consuming desire for cookies and all things sweet.</q>',Math.pow(angelPriceFactor,5),[11,11]);Game.last.pool='prestige';Game.last.parents=['Satan'];
		new Game.Upgrade('Beelzebub',demonDesc(64)+'<q>The festering incarnation of blight and disease, Beelzebub rules over the vast armies of pastry inferno.</q>',Math.pow(angelPriceFactor,6),[12,11]);Game.last.pool='prestige';Game.last.parents=['Asmodeus'];
		new Game.Upgrade('Lucifer',demonDesc(128)+'<q>Also known as the Lightbringer, this infernal prince\'s tremendous ego caused him to be cast down from pastry heaven.</q>',Math.pow(angelPriceFactor,7),[13,11]);Game.last.pool='prestige';Game.last.parents=['Beelzebub'];
		
		new Game.Upgrade('Golden cookie alert sound',loc("Unlocks the <b>golden cookie sound selector</b>, which lets you pick whether golden cookies emit a sound when appearing or not.")+'<q>A sound decision.</q>',999999,[28,6]);Game.last.pool='prestige';Game.last.parents=['Residual luck'];
		
		order=49900;
		new Game.Upgrade('Golden cookie sound selector',loc("Lets you change the sound golden cookies make when they spawn."),0,[28,6]);
		Game.last.descFunc=function(){
			var choice=this.choicesFunction()[Game.chimeType];
			return '<div style="text-align:center;">'+loc("Current:")+' '+tinyIcon(choice.icon)+' <b>'+choice.name+'</b></div><div class="line"></div>'+this.ddesc;
		};
		
		Game.last.pool='toggle';
		Game.last.choicesFunction=function()
		{
			var choices: any[]=[];
			choices[0]={name:'No sound',icon:[0,7]};
			choices[1]={name:'Chime',icon:[22,6]};
			choices[2]={name:'Fortune',icon:[27,6]};
			choices[3]={name:'Cymbal',icon:[9,10]};
			choices[4]={name:'Squeak',icon:[8,10]};
			for (var i=0;i<choices.length;i++){choices[i].name=loc(choices[i].name);}
			
			choices[Game.chimeType].selected=1;
			return choices;
		}
		Game.last.choicesPick=function(id: any)
		{
			Game.chimeType=id;
			Game.playGoldenCookieChime();
		}
		
		
		new Game.Upgrade('Basic wallpaper assortment',loc("Unlocks the <b>background selector</b>, letting you select the game's background.<br>Comes with a variety of basic flavors.")+'<q>Prioritizing aesthetics over crucial utilitarian upgrades? Color me impressed.</q>',99,[29,5]);Game.last.pool='prestige';Game.last.parents=['Classic dairy selection'];
		
		new Game.Upgrade('Legacy',loc("This is the first heavenly upgrade; it unlocks the <b>Heavenly chips</b> system.<div class=\"line\"></div>Each time you ascend, the cookies you made in your past life are turned into <b>heavenly chips</b> and <b>prestige</b>.<div class=\"line\"></div><b>Heavenly chips</b> can be spent on a variety of permanent transcendental upgrades.<div class=\"line\"></div>Your <b>prestige level</b> also gives you a permanent <b>+1% CpS</b> per level.")+'<q>We\'ve all been waiting for you.</q>',1,[21,6]);Game.last.pool='prestige';Game.last.parents=[];
		
		new Game.Upgrade('Elder spice',loc("You can attract <b>%1 more wrinklers</b>.",2)+'<q>The cookie your cookie could smell like.</q>',444444,[19,8]);Game.last.pool='prestige';Game.last.parents=['Unholy bait'];
		
		new Game.Upgrade('Residual luck',loc("While the golden switch is on, you gain an additional <b>+%1% CpS</b> per golden cookie upgrade owned.",10)+'<q>Fortune comes in many flavors.</q>',99999,[27,6]);Game.last.pool='prestige';Game.last.parents=['Golden switch'];
		
		order=150;new Game.Upgrade('Fantasteel mouse',getStrClickingGains(1)+'<q>You could be clicking using your touchpad and we\'d be none the wiser.</q>',5000000000000000000,[11,17]);Game.MakeTiered(Game.last,8,11);
		new Game.Upgrade('Nevercrack mouse',getStrClickingGains(1)+'<q>How much beefier can you make a mouse until it\'s considered a rat?</q>',500000000000000000000,[11,18]);Game.MakeTiered(Game.last,9,11);
		
		
		new Game.Upgrade('Five-finger discount',loc("All upgrades are <b>%1% cheaper per %2</b>.",[1,loc("%1 cursor",100)])+'<q>Stick it to the man.</q>',555555,[28,7],function(){Game.upgradesToRebuild=1;});Game.last.pool='prestige';Game.last.parents=['Halo gloves','Abaddon'];
		
		
		order=5000;
		Game.SynergyUpgrade('Future almanacs','<q>Lets you predict optimal planting times. It\'s crazy what time travel can do!</q>','Farm','Time machine','synergy1');
		Game.SynergyUpgrade('Rain prayer','<q>A deeply spiritual ceremonial involving complicated dance moves and high-tech cloud-busting lasers.</q>','Farm','Temple','synergy2');
		
		Game.SynergyUpgrade('Seismic magic','<q>Surprise earthquakes are an old favorite of wizardly frat houses.</q>','Mine','Wizard tower','synergy1');
		Game.SynergyUpgrade('Asteroid mining','<q>As per the <span>19</span>74 United Cosmic Convention, comets, moons, and inhabited planetoids are no longer legally excavatable.<br>But hey, a space bribe goes a long way.</q>','Mine','Shipment','synergy2');
		
		Game.SynergyUpgrade('Quantum electronics','<q>Your machines won\'t even be sure if they\'re on or off!</q>','Factory','Antimatter condenser','synergy1');
		Game.SynergyUpgrade('Temporal overclocking','<q>Introduce more quickitude in your system for increased speedation of fastness.</q>','Factory','Time machine','synergy2');
		
		Game.SynergyUpgrade('Contracts from beyond','<q>Make sure to read the fine print!</q>','Bank','Portal','synergy1');
		Game.SynergyUpgrade('Printing presses','<q>Fake bills so real, they\'re almost worth the ink they\'re printed with.</q>','Bank','Factory','synergy2');
		
		Game.SynergyUpgrade('Paganism','<q>Some deities are better left unworshipped.</q>','Temple','Portal','synergy1');
		Game.SynergyUpgrade('God particle','<q>Turns out God is much tinier than we thought, I guess.</q>','Temple','Antimatter condenser','synergy2');
		
		Game.SynergyUpgrade('Arcane knowledge','<q>Some things were never meant to be known - only mildly speculated.</q>','Wizard tower','Alchemy lab','synergy1');
		Game.SynergyUpgrade('Magical botany','<q>Already known in some reactionary newspapers as "the wizard\'s GMOs".</q>','Wizard tower','Farm','synergy2');
		
		Game.SynergyUpgrade('Fossil fuels','<q>Somehow better than plutonium for powering rockets.<br>Extracted from the fuels of ancient, fossilized civilizations.</q>','Shipment','Mine','synergy1');
		Game.SynergyUpgrade('Shipyards','<q>Where carpentry, blind luck, and asbestos insulation unite to produce the most dazzling spaceships on the planet.</q>','Shipment','Factory','synergy2');
		
		Game.SynergyUpgrade('Primordial ores','<q>Only when refining the purest metals will you extract the sweetest sap of the earth.</q>','Alchemy lab','Mine','synergy1');
		Game.SynergyUpgrade('Gold fund','<q>If gold is the backbone of the economy, cookies, surely, are its hip joints.</q>','Alchemy lab','Bank','synergy2');
		
		Game.SynergyUpgrade('Infernal crops','<q>Sprinkle regularly with FIRE.</q>','Portal','Farm','synergy1');
		Game.SynergyUpgrade('Abysmal glimmer','<q>Someone, or something, is staring back at you.<br>Perhaps at all of us.</q>','Portal','Prism','synergy2');
		
		Game.SynergyUpgrade('Relativistic parsec-skipping','<q>People will tell you this isn\'t physically possible.<br>These are people you don\'t want on your ship.</q>','Time machine','Shipment','synergy1');
		Game.SynergyUpgrade('Primeval glow','<q>From unending times, an ancient light still shines, impossibly pure and fragile in its old age.</q>','Time machine','Prism','synergy2');
		
		Game.SynergyUpgrade('Extra physics funding','<q>Time to put your money where your particle colliders are.</q>','Antimatter condenser','Bank','synergy1');
		Game.SynergyUpgrade('Chemical proficiency','<q>Discover exciting new elements, such as Fleshmeltium, Inert Shampoo Byproduct #17 and Carbon++!</q>','Antimatter condenser','Alchemy lab','synergy2');
		
		Game.SynergyUpgrade('Light magic','<q>Actually not to be taken lightly! No, I\'m serious. 178 people died last year. You don\'t mess around with magic.</q>','Prism','Wizard tower','synergy1');
		Game.SynergyUpgrade('Mystical energies','<q>Something beckons from within the light. It is warm, comforting, and apparently the cause for several kinds of exotic skin cancers.</q>','Prism','Temple','synergy2');
		
		
		new Game.Upgrade('Synergies Vol. I',loc("Unlocks a new tier of upgrades that affect <b>2 buildings at the same time</b>.<br>Synergies appear once you have <b>%1</b> of both buildings.",15)+'<q>The many beats the few.</q>',222222,[10,20]);Game.last.pool='prestige';Game.last.parents=['Satan','Dominions'];
		new Game.Upgrade('Synergies Vol. II',loc("Unlocks a new tier of upgrades that affect <b>2 buildings at the same time</b>.<br>Synergies appear once you have <b>%1</b> of both buildings.",75)+'<q>The several beats the many.</q>',2222222,[10,29]);Game.last.pool='prestige';Game.last.parents=['Beelzebub','Seraphim','Synergies Vol. I'];
		
		new Game.Upgrade('Heavenly cookies',loc("Cookie production multiplier <b>+%1% permanently</b>.",10)+'<q>Baked with heavenly chips. An otherwordly flavor that transcends time and space.</q>',3,[25,12]);Game.last.pool='prestige';Game.last.parents=['Legacy'];Game.last.power=10;Game.last.pseudoCookie=true;
		new Game.Upgrade('Wrinkly cookies',loc("Cookie production multiplier <b>+%1% permanently</b>.",10)+'<q>The result of regular cookies left to age out for countless eons in a place where time and space are meaningless.</q>',6666666,[26,12]);Game.last.pool='prestige';Game.last.parents=['Sacrilegious corruption','Elder spice'];Game.last.power=10;Game.last.pseudoCookie=true;
		new Game.Upgrade('Distilled essence of redoubled luck',loc("Golden cookies (and all other things that spawn, such as reindeer) have <b>%1% chance of being doubled</b>.",1)+'<q>Tastes glittery. The empty phial makes for a great pencil holder.</q>',7777777,[27,12]);Game.last.pool='prestige';Game.last.parents=['Divine bakeries','Residual luck'];
		
		order=40000;
		new Game.Upgrade('Occult obstruction',loc("Cookie production <b>reduced to 0</b>.")+'<q>If symptoms persist, consult a doctor.</q>',7,[15,5]);//debug purposes only
		Game.last.pool='debug';
		new Game.Upgrade('Glucose-charged air',loc("Sugar lumps coalesce <b>a whole lot faster</b>.")+'<q>Don\'t breathe too much or you\'ll get diabetes!</q>',7,[29,16]);//debug purposes only
		Game.last.pool='debug';
		
		order=10300;
		Game.NewUpgradeCookie({name:'Lavender chocolate butter biscuit',desc:'Rewarded for owning 300 of everything.<br>This subtly-flavored biscuit represents the accomplishments of decades of top-secret research. The molded design on the chocolate resembles a well-known entrepreneur who gave their all to the ancient path of baking.',icon:[26,10],power:	10,price: 999999999999999999999999999999999*butterBiscuitMult,locked:1});
		
		order=10030;
		Game.NewUpgradeCookie({name:'Lombardia cookies',desc:'These come from those farms with the really good memory.',icon:[23,13],require:'Box of brand biscuits',power:												3,	price:	999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Bastenaken cookies',desc:'French cookies made of delicious cinnamon and candy sugar. These do not contain Nuts!',icon:[24,13],require:'Box of brand biscuits',power:												3,	price:	999999999999999999999*5});
		
		order=10020;
		Game.NewUpgradeCookie({name:'Pecan sandies',desc:'Stick a nut on a cookie and call it a day! Name your band after it! Whatever!',icon:[25,13],power:						4,price: 999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Moravian spice cookies',desc:'Popular for being the world\'s moravianest cookies.',icon:[26,13],power:						4,price: 9999999999999999999999999});
		Game.NewUpgradeCookie({name:'Anzac biscuits',desc:'Army biscuits from a bakery down under, containing no eggs but yes oats.',icon:[27,13],power:						4,price: 9999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Buttercakes',desc:'Glistening with cholesterol, these cookies moistly straddle the line between the legal definition of a cookie and just a straight-up stick of butter.',icon:[29,13],power:						4,price: 99999999999999999999999999});
		Game.NewUpgradeCookie({name:'Ice cream sandwiches',desc:'In an alternate universe, "ice cream sandwich" designates an ice cream cone filled with bacon, lettuce, and tomatoes. Maybe some sprinkles too.',icon:[28,13],power:						4,price: 99999999999999999999999999*5});
		
		new Game.Upgrade('Stevia Caelestis',loc("Sugar lumps ripen <b>%1</b> sooner.",Game.sayTime(60*60*Game.fps))+'<q>A plant of supernatural sweetness grown by angels in heavenly gardens.</q>',100000000,[25,15]);Game.last.pool='prestige';Game.last.parents=['Wrinkly cookies'];
		new Game.Upgrade('Diabetica Daemonicus',loc("Sugar lumps mature <b>%1</b> sooner.",Game.sayTime(60*60*Game.fps))+'<q>A malevolent, if delicious herb that is said to grow on the cliffs of the darkest abyss of the underworld.</q>',300000000,[26,15]);Game.last.pool='prestige';Game.last.parents=['Stevia Caelestis','Lucifer'];
		new Game.Upgrade('Sucralosia Inutilis',loc("Bifurcated sugar lumps appear <b>%1% more often</b> and are <b>%2% more likely</b> to drop 2 lumps.",[5,5])+'<q>A rare berry of uninteresting flavor that is as elusive as its uses are limited; only sought-after by the most avid collectors with too much wealth on their hands.</q>',1000000000,[27,15]);Game.last.pool='prestige';Game.last.parents=['Diabetica Daemonicus'];
		
		new Game.Upgrade('Lucky digit',loc("<b>+%1%</b> prestige level effect on CpS.<br><b>+%2%</b> golden cookie effect duration.<br><b>+%3%</b> golden cookie lifespan.",[1,1,1])+'<q>This upgrade is a bit shy and only appears when your prestige level contains a 7.</q>',777,[24,15]);Game.last.pool='prestige';Game.last.parents=['Heavenly luck'];Game.last.showIf=function(){return (Math.ceil(((Game.prestige+'').split('7').length-1))>=1);};
		new Game.Upgrade('Lucky number',loc("<b>+%1%</b> prestige level effect on CpS.<br><b>+%2%</b> golden cookie effect duration.<br><b>+%3%</b> golden cookie lifespan.",[1,1,1])+'<q>This upgrade is a reclusive hermit and only appears when your prestige level contains two 7\'s.</q>',77777,[24,15]);Game.last.pool='prestige';Game.last.parents=['Lucky digit','Lasting fortune'];Game.last.showIf=function(){return (Math.ceil(((Game.prestige+'').split('7').length-1))>=2);};
		new Game.Upgrade('Lucky payout',loc("<b>+%1%</b> prestige level effect on CpS.<br><b>+%2%</b> golden cookie effect duration.<br><b>+%3%</b> golden cookie lifespan.",[1,1,1])+'<q>This upgrade took an oath of complete seclusion from the rest of the world and only appears when your prestige level contains four 7\'s.</q>',77777777,[24,15]);Game.last.pool='prestige';Game.last.parents=['Lucky number','Decisive fate'];Game.last.showIf=function(){return (Math.ceil(((Game.prestige+'').split('7').length-1))>=4);};
		
		order=50000;
		new Game.Upgrade('Background selector',loc("Lets you pick which wallpaper to display."),0,[29,5]);
		Game.last.descFunc=function(){
			var choice=this.choicesFunction()[Game.bgType];
			if (choice==0) choice=this.choicesFunction()[0];
			return '<div style="text-align:center;">'+loc("Current:")+' '+tinyIcon(choice.icon)+' <b>'+choice.name+'</b></div><div class="line"></div>'+this.ddesc;
		};
		
		Game.last.pool='toggle';
		Game.last.choicesFunction=function()
		{
			// CC3: `any` (not any[]): the verbatim loop populates it by
			// string index (`choices[ix]`, ix from a for-in), as in 2.048.
			var choices: any=[];
			for (var ix in Game.BGsByChoice)
			{
				choices[ix]={name:Game.BGsByChoice[ix].name,icon:Game.BGsByChoice[ix].icon,order:Game.BGsByChoice[ix].order||parseInt(ix)};
			}
			
			choices[13].div=true;
			
			for (var i=0;i<choices.length;i++)
			{
				var it=choices[i];
				if (it.order>=4.9 && !Game.Has('Distinguished wallpaper assortment')) choices[i]=0;
			}
			
			choices[Game.bgType].selected=1;
			return choices;
		}
		Game.last.choicesPick=function(id: any)
		{Game.bgType=id;}
		
		Game.AllBGs=[
			{pic:'bgBlue',name:'Automatic',icon:[0,7]},
			{pic:'bgBlue',name:'Blue',icon:[21,21]},
			{pic:'bgRed',name:'Red',icon:[22,21]},
			{pic:'bgWhite',name:'White',icon:[23,21]},
			{pic:'bgBlack',name:'Black',icon:[24,21]},
			{pic:'bgGold',name:'Gold',icon:[25,21]},
			{pic:'grandmas1',name:'Grandmas',icon:[26,21]},
			{pic:'grandmas2',name:'Displeased grandmas',icon:[27,21]},
			{pic:'grandmas3',name:'Angered grandmas',icon:[28,21]},
			{pic:'bgMoney',name:'Money',icon:[29,21]},
			{pic:'bgPurple',name:'Purple',icon:[21,22],order:1.1},
			{pic:'bgPink',name:'Pink',icon:[24,22],order:2.1},
			{pic:'bgMint',name:'Mint',icon:[22,22],order:2.2},
			{pic:'bgSilver',name:'Silver',icon:[25,22],order:4.9},
			{pic:'bgBW',name:'Black & White',icon:[23,22],order:4.1},
			{pic:'bgSpectrum',name:'Spectrum',icon:[28,22],order:4.2},
			{pic:'bgCandy',name:'Candy',icon:[26,22]},
			{pic:'bgYellowBlue',name:'Biscuit store',icon:[27,22]},
			{pic:'bgChoco',name:'Chocolate',icon:[30,21]},
			{pic:'bgChocoDark',name:'Dark Chocolate',icon:[31,21]},
			{pic:'bgPaint',name:'Painter',icon:[24,34]},
			{pic:'bgSnowy',name:'Snow',icon:[30,22]},
			{pic:'bgSky',name:'Sky',icon:[29,22]},
			{pic:'bgStars',name:'Night',icon:[31,22]},
			{pic:'bgFoil',name:'Foil',icon:[25,34]},
		];
		Game.BGsByChoice={};
		for (var i=0;i<Game.AllBGs.length;i++)
		{
			Game.BGsByChoice[i]=Game.AllBGs[i];
		}
		if (!EN)
		{
			Game.BGsByChoice[0].name=loc(Game.BGsByChoice[0].name);
			for (var i=1;i<Game.BGsByChoice.length;i++)
			{
				Game.BGsByChoice[i].name='"'+Game.BGsByChoice[i].pic+'"';
			}
		}
		
		order=255;
		Game.GrandmaSynergy('Lucky grandmas','A fortunate grandma that always seems to find more cookies.','Chancemaker');
		
		order=1200;
		Game.TieredUpgrade('Your lucky cookie','<q>This is the first cookie you\'ve ever baked. It holds a deep sentimental value and, after all this time, an interesting smell.</q>','Chancemaker',1);
		Game.TieredUpgrade('"All Bets Are Off" magic coin','<q>A coin that always lands on the other side when flipped. Not heads, not tails, not the edge. The <i>other side</i>.</q>','Chancemaker',2);
		Game.TieredUpgrade('Winning lottery ticket','<q>What lottery? THE lottery, that\'s what lottery! Only lottery that matters!</q>','Chancemaker',3);
		Game.TieredUpgrade('Four-leaf clover field','<q>No giant monsters here, just a whole lot of lucky grass.</q>','Chancemaker',4);
		Game.TieredUpgrade('A recipe book about books','<q>Tip the scales in your favor with 28 creative new ways to cook the books.</q>','Chancemaker',5);
		Game.TieredUpgrade('Leprechaun village','<q>You\'ve finally become accepted among the local leprechauns, who lend you their mythical luck as a sign of friendship (as well as some rather foul-tasting tea).</q>','Chancemaker',6);
		Game.TieredUpgrade('Improbability drive','<q>A strange engine that turns statistics on their head. Recommended by the Grandmother\'s Guide to the Bakery.</q>','Chancemaker',7);
		Game.TieredUpgrade('Antisuperstistronics','<q>An exciting new field of research that makes unlucky things lucky. No mirror unbroken, no ladder unwalked under!</q>','Chancemaker',8);
		
		order=5000;
		Game.SynergyUpgrade('Gemmed talismans','<q>Good-luck charms covered in ancient and excruciatingly rare crystals. A must have for job interviews!</q>','Chancemaker','Mine','synergy1');
		
		order=20000;
		new Game.Upgrade('Kitten consultants',strKittenDesc+'<q>glad to be overpaid to work with you, sir</q>',900000000000000000000000000000000,Game.GetIcon('Kitten',9));Game.last.kitten=1;Game.MakeTiered(Game.last,9,18);
		
		order=99999;
		var years=Math.floor((Date.now()-+new Date(2013,7,8))/(1000*60*60*24*365));
		//only updates on page load
		//may behave strangely on leap years
		Game.NewUpgradeCookie({name:'Birthday cookie',desc:'<q>-</q>',icon:[22,13],power:years,price:99999999999999999999999999999});Game.last.baseDesc=loc("Cookie production multiplier <b>+%1%</b> for every year Cookie Clicker has existed (currently: <b>+%2%</b>).",[1,Beautify(years)])+'<q>Thank you for playing Cookie Clicker!<br>-Orteil</q>';
		
		
		order=150;new Game.Upgrade('Armythril mouse',getStrClickingGains(1)+'<q>This one takes about 53 people to push it around and another 48 to jump down on the button and trigger a click. You could say it\'s got some heft to it.</q>',50000000000000000000000,[11,19]);Game.MakeTiered(Game.last,10,11);
		
		order=200;Game.TieredUpgrade('Reverse dementia','<q>Extremely unsettling, and somehow even worse than the regular kind.</q>','Grandma',9);
		order=300;Game.TieredUpgrade('Humane pesticides','<q>Made by people, for people, from people and ready to unleash some righteous scorching pain on those pesky insects that so deserve it.</q>','Farm',9);
		order=400;Game.TieredUpgrade('Mole people','<q>Engineered from real human beings within your very labs, these sturdy little folks have a knack for finding the tastiest underground minerals in conditions that more expensive machinery probably wouldn\'t survive.</q>','Mine',9);
		order=500;Game.TieredUpgrade('Machine learning','<q>You figured you might get better productivity if you actually told your workers to learn how to work the machines. Sometimes, it\'s the little things...</q>','Factory',9);
		order=525;Game.TieredUpgrade('Edible money','<q>It\'s really quite simple; you make all currency too delicious not to eat, solving world hunger and inflation in one fell swoop!</q>','Bank',9);
		order=550;Game.TieredUpgrade('Sick rap prayers','<q>With their ill beat and radical rhymes, these way-hip religious tunes are sure to get all the youngins who thought they were 2 cool 4 church back on the pews and praying for more! Wicked!</q>','Temple',9);
		order=575;Game.TieredUpgrade('Deluxe tailored wands','<q>In this age of science, most skillful wand-makers are now long gone; but thankfully - not all those wanders are lost.</q>','Wizard tower',9);
		order=600;Game.TieredUpgrade('Autopilot','<q>Your ships are now fitted with completely robotic crews! It\'s crazy how much money you save when you don\'t have to compensate the families of those lost in space.</q>','Shipment',9);
		order=700;Game.TieredUpgrade('The advent of chemistry','<q>You know what? That whole alchemy nonsense was a load of baseless rubbish. Dear god, what were you thinking?</q>','Alchemy lab',9);
		order=800;Game.TieredUpgrade('The real world','<q>It turns out that our universe is actually the twisted dimension of another, saner plane of reality. Time to hop on over there and loot the place!</q>','Portal',9);
		order=900;Game.TieredUpgrade('Second seconds','<q>That\'s twice as many seconds in the same amount of time! What a deal! Also, what in god\'s name!</q>','Time machine',9);
		order=1000;Game.TieredUpgrade('Quantum comb','<q>Quantum entanglement is one of those things that are so annoying to explain that we might honestly be better off without it. This is finally possible thanks to the quantum comb!</q>','Antimatter condenser',9);
		order=1100;Game.TieredUpgrade('Crystal mirrors','<q>Designed to filter more light back into your prisms, reaching levels of brightness that reality itself had never planned for.</q>','Prism',9);
		order=1200;Game.TieredUpgrade('Bunnypedes','<q>You\'ve taken to breeding rabbits with hundreds of paws, which makes them intrinsically very lucky and thus a very handy (if very disturbing) pet.</q>','Chancemaker',9);
		
		order=20000;
		new Game.Upgrade('Kitten assistants to the regional manager',strKittenDesc+'<q>nothing stresses meowt... except having to seek the approval of my inferiors, sir</q>',900000000000000000000000000000000000,Game.GetIcon('Kitten',10));Game.last.kitten=1;Game.MakeTiered(Game.last,10,18);
		
		order=5000;
		Game.SynergyUpgrade('Charm quarks','<q>They\'re after your lucky quarks!</q>','Chancemaker','Antimatter condenser','synergy2');
		
		
		order=10020;
		Game.NewUpgradeCookie({name:'Pink biscuits',desc:'One of the oldest cookies. Traditionally dipped in champagne to soften it, because the French will use any opportunity to drink.',icon:[21,16],power:						4,price: 999999999999999999999999999});
		Game.NewUpgradeCookie({name:'Whole-grain cookies',desc:'Covered in seeds and other earthy-looking debris. Really going for that "5-second rule" look.',icon:[22,16],power:						4,price: 999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Candy cookies',desc:'These melt in your hands just a little bit.',icon:[23,16],power:						4,price: 9999999999999999999999999999});
		Game.NewUpgradeCookie({name:'Big chip cookies',desc:'You are in awe at the size of these chips. Absolute units.',icon:[24,16],power:						4,price: 9999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'One chip cookies',desc:'You get one.',icon:[25,16],power:						1,price: 99999999999999999999999999999});
		
		
		new Game.Upgrade('Sugar baking',loc("Each unspent sugar lump (up to %1) gives <b>+%2% CpS</b>.<div class=\"warning\">Note: this means that spending sugar lumps will decrease your CpS until they grow back.</div>",[100,1])+'<q>To bake with the sugary essence of eons themselves, you must first learn to take your sweet time.</q>',200000000,[21,17]);Game.last.pool='prestige';Game.last.parents=['Stevia Caelestis'];
		new Game.Upgrade('Sugar craving',loc("Once an ascension, you may use the \"Sugar frenzy\" switch to <b>triple your CpS</b> for 1 hour, at the cost of <b>1 sugar lump</b>.")+'<q>Just a little kick to sweeten the deal.</q>',400000000,[22,17]);Game.last.pool='prestige';Game.last.parents=['Sugar baking'];
		new Game.Upgrade('Sugar aging process',loc("Each grandma (up to %1) makes sugar lumps ripen <b>%2</b> sooner.",[600,Game.sayTime(6*Game.fps)])+'<q>Aren\'t they just the sweetest?</q>',600000000,[23,17]);Game.last.pool='prestige';Game.last.parents=['Sugar craving','Diabetica Daemonicus'];
		
		order=40050;
		new Game.Upgrade('Sugar frenzy',loc("Activating this will <b>triple your CpS</b> for 1 hour, at the cost of <b>1 sugar lump</b>.")+'<br>'+loc("May only be used once per ascension."),0,[22,17]);
		Game.last.priceLumps=1;
		Game.last.pool='toggle';Game.last.toggleInto=0;
		Game.last.canBuyFunc=function(){return Game.lumps>=1;};
		Game.last.clickFunction=Game.spendLump(1,loc("activate the sugar frenzy"),function()
		{
			Game.Upgrades['Sugar frenzy'].buy(1);
			Game.gainBuff('sugar frenzy',60*60,3);
			Game.Notify(loc("Sugar frenzy!"),loc("CpS x%1 for 1 hour!",3),[29,14]);
		});
		
		order=10020;
		Game.NewUpgradeCookie({name:'Sprinkles cookies',desc:'A bit of festive decorating helps hide the fact that this might be one of the blandest cookies you\'ve ever tasted.',icon:[21,14],power:						4,price: 99999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Peanut butter blossoms',desc:'Topped with a scrumptious chocolate squirt, which is something we really wish we didn\'t just write.',icon:[22,14],power:						4,price: 999999999999999999999999999999});
		Game.NewUpgradeCookie({name:'No-bake cookies',desc:'You have no idea how these mysterious oven-less treats came to be or how they hold their shape. You\'re thinking either elephant glue or cold fusion.',icon:[21,15],power:						4,price: 999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Florentines',desc:'These make up for being the fruitcake of cookies by at least having the decency to feature chocolate.',icon:[26,16],power:						4,price: 9999999999999999999999999999999});
		Game.NewUpgradeCookie({name:'Chocolate crinkles',desc:'Non-denominational cookies to celebrate year-round deliciousness, and certainly not Christmas or some other nonsense.',icon:[22,15],power:						4,price: 9999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Maple cookies',desc:'Made with syrup from a land where milk comes in bags, instead of spontaneously pooling at the bottom of your screen depending on your achievements.',icon:[21,13],power:						4,price: 99999999999999999999999999999999});
		
		
		order=40000;
		new Game.Upgrade('Turbo-charged soil',loc("Garden plants grow every second.<br>Garden seeds are free to plant.<br>You can switch soils at any time.")+'<q>It\'s got electrolytes!</q>',7,[2,16]);//debug purposes only
		Game.last.buyFunction=function(){if (Game.Objects['Farm'].minigameLoaded){Game.Objects['Farm'].minigame.computeStepT();}}
		Game.last.pool='debug';
		
		order=150;
		new Game.Upgrade('Technobsidian mouse',getStrClickingGains(1)+'<q>A highly advanced mouse of a sophisticated design. Only one thing on its mind : to click.</q>',5000000000000000000000000,[11,28]);Game.MakeTiered(Game.last,11,11);
		new Game.Upgrade('Plasmarble mouse',getStrClickingGains(1)+'<q>A shifting blur in the corner of your eye, this mouse can trigger a flurry of clicks when grazed by even the slightest breeze.</q>',500000000000000000000000000,[11,30]);Game.MakeTiered(Game.last,12,11);
		
		order=20000;
		new Game.Upgrade('Kitten marketeers',strKittenDesc+'<q>no such thing as a saturated markit, sir</q>',900000000000000000000000000000000000000,Game.GetIcon('Kitten',11));Game.last.kitten=1;Game.MakeTiered(Game.last,11,18);
		
		order=10030;
		Game.NewUpgradeCookie({name:'Festivity loops',desc:'These garish biscuits are a perfect fit for children\'s birthday parties or the funerals of strange, eccentric billionaires.',icon:[25,17],require:'Box of brand biscuits',power:												2,	price:	999999999999999999999999*5});
		
		order=10020;
		Game.NewUpgradeCookie({name:'Persian rice cookies',desc:'Rose water and poppy seeds are the secret ingredients of these small, butter-free cookies.',icon:[28,15],power:						4,price: 99999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Norwegian cookies',desc:'A flat butter cookie with a sliver of candied cherry on top. It is said that these illustrate the bleakness of scandinavian existentialism.',icon:[22,20],power:						4,price: 999999999999999999999999999999999});
		Game.NewUpgradeCookie({name:'Crispy rice cookies',desc:'Fun to make at home! Store-bought cookies are obsolete! Topple the system! There\'s marshmallows in these! Destroy capitalism!',icon:[23,20],power:						4,price: 999999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Ube cookies',desc:'The tint is obtained by the use of purple yams. According to color symbolism, these cookies are either noble, holy, or supervillains.',icon:[24,17],power:						4,price: 9999999999999999999999999999999999});
		Game.NewUpgradeCookie({name:'Butterscotch cookies',desc:'The butterscotch chips are just the right amount of sticky, and make you feel like you\'re eating candy.',icon:[24,20],power:						4,price: 9999999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Speculaas',desc:'These crunchy, almost obnoxiously cinnamony cookies are a source of dutch pride. About the origin of the name, one can only speculate.',icon:[21,20],power:						4,price: 99999999999999999999999999999999999});
		
		order=10200;
		Game.NewUpgradeCookie({name:'Elderwort biscuits',desc:'-',icon:[22,25],power:2,price:60*2,locked:1});Game.last.baseDesc=getStrCookieProductionMultiplierPlus(2)+'<br>'+loc("%1 are <b>%2%</b> more powerful.",[cap(Game.Objects['Grandma'].plural),2])+'<br>'+loc("Dropped by %1 plants.",loc("Elderwort").toLowerCase())+'<q>They taste incredibly stale, even when baked fresh.</q>';
		Game.NewUpgradeCookie({name:'Bakeberry cookies',desc:'-',icon:[23,25],power:2,price:60,locked:1});Game.last.baseDesc=getStrCookieProductionMultiplierPlus(2)+'<br>'+loc("Dropped by %1 plants.",loc("Bakeberry").toLowerCase())+'<q>Really good dipped in hot chocolate.</q>';
		Game.NewUpgradeCookie({name:'Duketater cookies',desc:'-',icon:[24,25],power:10,price:60*3,locked:1});Game.last.baseDesc=getStrCookieProductionMultiplierPlus(10)+'<br>'+loc("Dropped by %1 plants.",loc("Duketater").toLowerCase())+'<q>Fragrant and mealy, with a slight yellow aftertaste.</q>';
		Game.NewUpgradeCookie({name:'Green yeast digestives',desc:'-',icon:[25,25],power:0,price:60*3,locked:1});Game.last.baseDesc=loc("Golden cookies give <b>%1%</b> more cookies.",1)+'<br>'+loc("Golden cookie effects last <b>%1%</b> longer.",1)+'<br>'+loc("Golden cookies appear <b>%1%</b> more often.",1)+'<br>'+loc("Random drops are <b>%1% more common</b>.",3)+'<br>'+loc("Dropped by %1 plants.",loc("Green rot").toLowerCase())+'<q>These are tastier than you\'d expect, but not by much.</q>';
		
		order=23000;
		new Game.Upgrade('Fern tea',loc("You gain another <b>+%1%</b> of your regular CpS while the game is closed.",3)+' <small>('+loc("Must own the %1 upgrade.",getUpgradeName("Twin Gates of Transcendence"))+')</small>'+'<br>'+loc("Dropped by %1 plants.",loc("Drowsyfern").toLowerCase())+'<q>A chemically complex natural beverage, this soothing concoction has been used by mathematicians to solve equations in their sleep.</q>',60,[26,25]);
		new Game.Upgrade('Ichor syrup',loc("You gain another <b>+%1%</b> of your regular CpS while the game is closed.",7)+' <small>('+loc("Must own the %1 upgrade.",getUpgradeName("Twin Gates of Transcendence"))+')</small>'+'<br>'+loc("Sugar lumps mature <b>%1</b> sooner.",Game.sayTime(7*60*Game.fps))+'<br>'+loc("Dropped by %1 plants.",loc("Ichorpuff").toLowerCase())+'<q>Tastes like candy. The smell is another story.</q>',60*2,[27,25]);
		
		order=10200;
		Game.NewUpgradeCookie({name:'Wheat slims',desc:'-',icon:[28,25],power:1,price:30,locked:1});Game.last.baseDesc=getStrCookieProductionMultiplierPlus(1)+'<br>'+loc("Dropped by %1 plants.",loc("Baker's wheat").toLowerCase())+'<q>The only reason you\'d consider these to be cookies is because you feel slightly sorry for them.</q>';
		
		var gardenDrops=['Elderwort biscuits','Bakeberry cookies','Duketater cookies','Green yeast digestives','Fern tea','Ichor syrup','Wheat slims'];
		for (var ix in gardenDrops)//scale by CpS
		{
			var it: any=Game.Upgrades[gardenDrops[ix]];
			it.priceFunc=function(cost){return function(){return cost*Game.cookiesPs*60;}}(it.basePrice);
			it.baseDesc=it.baseDesc.replace('<q>','<br>'+loc("Cost scales with CpS.")+'<q>');
			it.desc=BeautifyInText(it.baseDesc);
			it.lasting=true;
		}
		
		
		order=10300;
		Game.NewUpgradeCookie({name:'Synthetic chocolate green honey butter biscuit',desc:'Rewarded for owning 350 of everything.<br>The recipe for this butter biscuit was once the sole heritage of an ancient mountain monastery. Its flavor is so refined that only a slab of lab-made chocolate specifically engineered to be completely tasteless could complement it.<br>Also it\'s got your face on it.',icon:[24,26],power:	10,price: 999999999999999999999999999999999999*butterBiscuitMult,locked:1});
		Game.NewUpgradeCookie({name:'Royal raspberry chocolate butter biscuit',desc:'Rewarded for owning 400 of everything.<br>Once reserved for the megalomaniac elite, this unique strain of fruity chocolate has a flavor and texture unlike any other. Whether its exorbitant worth is improved or lessened by the presence of your likeness on it still remains to be seen.',icon:[25,26],power:	10,price: 999999999999999999999999999999999999999*butterBiscuitMult,locked:1});
		Game.NewUpgradeCookie({name:'Ultra-concentrated high-energy chocolate butter biscuit',desc:'Rewarded for owning 450 of everything.<br>Infused with the power of several hydrogen bombs through a process that left most nuclear engineers and shareholders perplexed. Currently at the center of some rather heated United Nations meetings. Going in more detail about this chocolate would violate several state secrets, but we\'ll just add that someone\'s bust seems to be pictured on it. Perhaps yours?',icon:[26,26],power:	10,price: 999999999999999999999999999999999999999999*butterBiscuitMult,locked:1});
		
		
		
		order=200;Game.TieredUpgrade('Timeproof hair dyes','<q>Why do they always have those strange wispy pink dos? What do they know about candy floss that we don\'t?</q>','Grandma',10);
		order=300;Game.TieredUpgrade('Barnstars','<q>Ah, yes. These help quite a bit. Somehow.</q>','Farm',10);
		order=400;Game.TieredUpgrade('Mine canaries','<q>These aren\'t used for anything freaky! The miners just enjoy having a pet or two down there.</q>','Mine',10);
		order=500;Game.TieredUpgrade('Brownie point system','<q>Oh, these are lovely! You can now reward your factory employees for good behavior, such as working overtime or snitching on coworkers. 58 brownie points gets you a little picture of a brownie, and 178 of those pictures gets you an actual brownie piece for you to do with as you please! Infantilizing? Maybe. Oodles of fun? You betcha!</q>','Factory',10);
		order=525;Game.TieredUpgrade('Grand supercycles','<q>We let the public think these are complicated financial terms when really we\'re just rewarding the bankers with snazzy bicycles for a job well done. It\'s only natural after you built those fancy gold swimming pools for them, where they can take a dip and catch Kondratiev waves.</q>','Bank',10);
		order=550;Game.TieredUpgrade('Psalm-reading','<q>A theologically dubious and possibly blasphemous blend of fortune-telling and scripture studies.</q>','Temple',10);
		order=575;Game.TieredUpgrade('Immobile spellcasting','<q>Wizards who master this skill can now cast spells without having to hop and skip and gesticulate embarrassingly, which is much sneakier and honestly quite a relief.</q>','Wizard tower',10);
		order=600;Game.TieredUpgrade('Restaurants at the end of the universe','<q>Since the universe is spatially infinite, and therefore can be construed to have infinite ends, you\'ve opened an infinite chain of restaurants where your space truckers can rest and partake in some home-brand cookie-based meals.</q>','Shipment',10);
		order=700;Game.TieredUpgrade('On second thought','<q>Disregard that last upgrade, alchemy is where it\'s at! Your eggheads just found a way to transmute children\'s nightmares into rare metals!</q>','Alchemy lab',10);
		order=800;Game.TieredUpgrade('Dimensional garbage gulper','<q>So we\'ve been looking for a place to dispose of all the refuse that\'s been accumulating since we started baking - burnt cookies, failed experiments, unruly workers - and well, we figured rather than sell it to poor countries like we\'ve been doing, we could just dump it in some alternate trash dimension where it\'s not gonna bother anybody! Probably!</q>','Portal',10);
		order=900;Game.TieredUpgrade('Additional clock hands','<q>It seemed like a silly idea at first, but it turns out these have the strange ability to twist time in interesting new ways.</q>','Time machine',10);
		order=1000;Game.TieredUpgrade('Baking Nobel prize','<q>What better way to sponsor scientific growth than to motivate those smarmy nerds with a meaningless award! What\'s more, each prize comes with a fine print lifelong exclusive contract to come work for you (or else)!</q>','Antimatter condenser',10);
		order=1100;Game.TieredUpgrade('Reverse theory of light','<q>A whole new world of physics opens up when you decide that antiphotons are real and posit that light is merely a void in shadow.</q>','Prism',10);
		order=1200;Game.TieredUpgrade('Revised probabilistics','<q>Either something happens or it doesn\'t. That\'s a 50% chance! This suddenly makes a lot of unlikely things very possible.</q>','Chancemaker',10);
		
		order=20000;
		new Game.Upgrade('Kitten analysts',strKittenDesc+'<q>based on purrent return-on-investment meowdels we should be able to affurd to pay our empawyees somewhere around next century, sir</q>',900000000000000000000000000000000000000000,Game.GetIcon('Kitten',12));Game.last.kitten=1;Game.MakeTiered(Game.last,12,18);
		
		
		new Game.Upgrade('Eye of the wrinkler',loc("Mouse over a wrinkler to see how many cookies are in its stomach.")+'<q>Just a wrinkler and its will to survive.<br>Hangin\' tough, stayin\' hungry.</q>',99999999,[27,26]);Game.last.pool='prestige';Game.last.parents=['Wrinkly cookies'];
		
		new Game.Upgrade('Inspired checklist',loc("Unlocks the <b>Buy all</b> feature, which lets you instantly purchase every upgrade in your store (starting from the cheapest one).<br>Also unlocks the <b>Vault</b>, a store section where you can place upgrades you do not wish to auto-buy.")+'<q>Snazzy grandma accessories? Check. Transdimensional abominations? Check. A bunch of eggs for some reason? Check. Machine that goes "ping"? Check and check.</q>',900000,[28,26]);Game.last.pool='prestige';Game.last.parents=['Persistent memory','Permanent upgrade slot II'];
		
		order=10300;
		Game.NewUpgradeCookie({name:'Pure pitch-black chocolate butter biscuit',desc:'Rewarded for owning 500 of everything.<br>This chocolate is so pure and so flawless that it has no color of its own, instead taking on the appearance of whatever is around it. You\'re a bit surprised to notice that this one isn\'t stamped with your effigy, as its surface is perfectly smooth (to the picometer) - until you realize it\'s quite literally reflecting your own face like a mirror.',icon:[24,27],power:	10,price: 999999999999999999999999999999999999999999999*butterBiscuitMult,locked:1});
		
		order=10020;
		Game.NewUpgradeCookie({name:'Chocolate oatmeal cookies',desc:'These bad boys compensate for lack of a cohesive form and a lumpy, unsightly appearance by being just simply delicious. Something we should all aspire to.',icon:[23,28],power:						4,price: 99999999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Molasses cookies',desc:'Sticky, crackly, and dusted in fine sugar.<br>Some lunatics have been known to eat these with potatoes.',icon:[24,28],power:						4,price: 999999999999999999999999999999999999});
		Game.NewUpgradeCookie({name:'Biscotti',desc:'Almonds and pistachios make these very robust cookies slightly more interesting to eat than to bludgeon people with.',icon:[22,28],power:						4,price: 999999999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Waffle cookies',desc:'Whether these are cookies with shockingly waffle-like features or simply regular cookie-sized waffles is a debate we\'re not getting into here.',icon:[21,28],power:						4,price: 9999999999999999999999999999999999999});
		
		
		order=10000;
		//early cookies that unlock at the same time as coconut cookies; meant to boost early game a little bit
		Game.NewUpgradeCookie({name:'Almond cookies',desc:'Sometimes you feel like one of these. Sometimes you don\'t.',icon:[21,27],power:							2,	price:	99999999});
		Game.NewUpgradeCookie({name:'Hazelnut cookies',desc:'Tastes like a morning stroll through a fragrant forest, minus the clouds of gnats.',icon:[22,27],power:							2,	price:	99999999});
		Game.NewUpgradeCookie({name:'Walnut cookies',desc:'Some experts have pointed to the walnut\'s eerie resemblance to the human brain as a sign of its sentience - a theory most walnuts vehemently object to.',icon:[23,27],power:							2,	price:	99999999});
		
		
		new Game.Upgrade('Label printer',loc("Mouse over an upgrade to see its tier.<br><small>Note: only some upgrades have tiers. Tiers are purely cosmetic and have no effect on gameplay.</small>")+'<q>Also comes in real handy when you want to tell catsup apart from ketchup.</q>',5000000,[28,29]);Game.last.pool='prestige';Game.last.parents=['Genius accounting'];
		
		
		
		
		order=200;Game.TieredUpgrade('Good manners','<q>Apparently these ladies are much more amiable if you take the time to learn their strange, ancient customs, which seem to involve saying "please" and "thank you" and staring at the sun with bulging eyes while muttering eldritch curses under your breath.</q>','Grandma',11);
		order=300;Game.TieredUpgrade('Lindworms','<q>You have to import these from far up north, but they really help aerate the soil!</q>','Farm',11);
		order=400;Game.TieredUpgrade('Bore again','<q>After extracting so much sediment for so long, you\'ve formed some veritable mountains of your own from the accumulated piles of rock and dirt. Time to dig through those and see if you find anything fun!</q>','Mine',11);
		order=500;Game.TieredUpgrade('"Volunteer" interns','<q>If you\'re bad at something, always do it for free.</q>','Factory',11);
		order=525;Game.TieredUpgrade('Rules of acquisition','<q>Rule 387 : a cookie baked is a cookie kept.</q>','Bank',11);
		order=550;Game.TieredUpgrade('War of the gods','<q>An interesting game; the only winning move is not to pray.</q>','Temple',11);
		order=575;Game.TieredUpgrade('Electricity','<q>Ancient magicks and forbidden hexes shroud this arcane knowledge, whose unfathomable power can mysteriously turn darkness into light and shock an elephant to death.</q>','Wizard tower',11);
		order=600;Game.TieredUpgrade('Universal alphabet','<q>You\'ve managed to chart a language that can be understood by any sentient species in the galaxy; its exciting vocabulary contains over 56 trillion words that sound and look like sparkly burps, forming intricate sentences that usually translate to something like "give us your cookies, or else".</q>','Shipment',11);
		order=700;Game.TieredUpgrade('Public betterment','<q>Why do we keep trying to change useless matter into cookies, or cookies into even better cookies? Clearly, the way of the future is to change the people who eat the cookies into people with a greater understanding, appreciation and respect for the cookies they\'re eating. Into the vat you go!</q>','Alchemy lab',11);
		order=800;Game.TieredUpgrade('Embedded microportals','<q>We\'ve found out that if we bake the portals into the cookies themselves, we can transport people\'s taste buds straight into the taste dimension! Good thing your army of lawyers got rid of the FDA a while ago!</q>','Portal',11);
		order=900;Game.TieredUpgrade('Nostalgia','<q>Your time machine technicians insist that this is some advanced new time travel tech, and not just an existing emotion universal to mankind. Either way, you have to admit that selling people the same old cookies just because it reminds them of the good old times is an interesting prospect.</q>','Time machine',11);
		order=1000;Game.TieredUpgrade('The definite molecule','<q>Your scientists have found a way to pack a cookie into one single continuous molecule, opening exciting new prospects in both storage and flavor despite the fact that these take up to a whole year to digest.</q>','Antimatter condenser',11);
		order=1100;Game.TieredUpgrade('Light capture measures','<q>As the universe gets ever so slightly dimmer due to you converting more and more of its light into cookies, you\'ve taken to finding new and unexplored sources of light for your prisms; for instance, the warm glow emitted by a pregnant woman, or the twinkle in the eye of a hopeful child.</q>','Prism',11);
		order=1200;Game.TieredUpgrade('0-sided dice','<q>The advent of the 0-sided dice has had unexpected and tumultuous effects on the gambling community, and saw experts around the world calling you both a genius and an imbecile.</q>','Chancemaker',11);
		
		
		new Game.Upgrade('Heralds',loc("You now benefit from the boost provided by <b>heralds</b>.<br>Each herald gives you <b>+1% CpS</b>.<br>Look on the purple flag at the top to see how many heralds are active at any given time.")+(App?'<q>It\'s getting steamy.</q>':'<q>Be excellent to each other.<br>And Patreon, dudes!</q>'),100,[21,29]);Game.last.pool='prestige';
		
		order=255;
		Game.GrandmaSynergy('Metagrandmas','A fractal grandma to make more grandmas to make more cookies.','Fractal engine');
		
		order=1300;
		Game.TieredUpgrade('Metabakeries','<q>They practically bake themselves!</q>','Fractal engine',1);
		Game.TieredUpgrade('Mandelbrown sugar','<q>A substance that displays useful properties such as fractal sweetness and instant contact lethality.</q>','Fractal engine',2);
		Game.TieredUpgrade('Fractoids','<q>Here\'s a frun fract : all in all, these were a terrible idea.</q>','Fractal engine',3);
		Game.TieredUpgrade('Nested universe theory','<q>Asserts that each subatomic particle is host to a whole new universe, and therefore, another limitless quantity of cookies.<br>This somehow stacks with the theory of nanocosmics, because physics.</q>','Fractal engine',4);
		Game.TieredUpgrade('Menger sponge cake','<q>Frighteningly absorbent thanks to its virtually infinite surface area. Keep it isolated in a dry chamber, never handle it with an open wound, and do not ever let it touch a body of water.</q>','Fractal engine',5);
		Game.TieredUpgrade('One particularly good-humored cow','<q>This unassuming bovine was excruciatingly expensive and it may seem at first like you were ripped off. On closer inspection however, you notice that its earrings (it\'s wearing earrings) are actually fully functional copies of itself, each of which also wearing their own cow earrings, and so on, infinitely. It appears your dairy concerns will be taken care of for a while, although you\'ll have to put up with the cow\'s annoying snickering.</q>','Fractal engine',6);
		Game.TieredUpgrade('Chocolate ouroboros','<q>Forever eating its own tail and digesting itself, in a metabolically dubious tale of delicious tragedy.</q>','Fractal engine',7);
		Game.TieredUpgrade('Nested','<q>Clever self-reference or shameful cross-promotion? This upgrade apparently has the gall to advertise a link to <u>orteil.dashnet.org/nested</u>, in a tooltip you can\'t even click.</q>','Fractal engine',8);
		Game.TieredUpgrade('Space-filling fibers','<q>This special ingredient has the incredible ability to fill the local space perfectly, effectively eradicating hunger in those who consume it!<br>Knowing that no hunger means no need for cookies, your marketers urge you to repurpose this product into next-level packing peanuts.</q>','Fractal engine',9);
		Game.TieredUpgrade('Endless book of prose','','Fractal engine',10);
		if (EN)
		{
			Game.last.descFunc=function(){
				var str='"There once was a baker named '+Game.bakeryName+'. One day, there was a knock at the door; '+Game.bakeryName+' opened it and was suddenly face-to-face with a strange and menacing old grandma. The grandma opened her mouth and, in a strange little voice, started reciting this strange little tale : ';
				var n=35;
				var i=Math.floor(Game.T*0.1);
				return this.desc+'<q style="font-family:Courier;">'+(str.substr(i%str.length,n)+(i%str.length>(str.length-n)?str.substr(0,i%str.length-(str.length-n)):''))+'</q>';
			};
		}
		else Game.last.desc='<q>-</q>';
		Game.TieredUpgrade('The set of all sets','<q>The answer, of course, is a definite maybe.</q>','Fractal engine',11);
		
		order=5000;
		Game.SynergyUpgrade('Recursive mirrors','<q>Do you have any idea what happens when you point two of these at each other? Apparently, the universe doesn\'t either.</q>','Fractal engine','Prism','synergy1');
		//Game.SynergyUpgrade('Compounded odds','<q>When probabilities start cascading, "never in a billion lifetimes" starts looking terribly like "probably before Monday comes around".</q>','Fractal engine','Chancemaker','synergy1');
		Game.SynergyUpgrade('Mice clicking mice','','Fractal engine','Cursor','synergy2');
		if (EN)
		{
			Game.last.descFunc=function(){
				Math.seedrandom(Game.seed+'-blasphemouse');
				if (Math.random()<0.3) {Math.seedrandom();return this.desc+'<q>Absolutely blasphemouse!</q>';}
				else {Math.seedrandom();return this.desc+'<q>Absolutely blasphemous!</q>';}
			};
		}
		else Game.last.desc='<q>-</q>';
		
		
		order=10020;
		Game.NewUpgradeCookie({name:'Custard creams',desc:'British lore pits these in a merciless war against bourbon biscuits.<br>The filling evokes vanilla without quite approaching it.<br>They\'re tastier on the inside!',icon:[23,29],power:						4,price: 9999999999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Bourbon biscuits',desc:'Two chocolate biscuits joined together with even more chocolate.<br>The sworn rivals of custard creams, as legend has it.',icon:[24,29],power:						4,price: 99999999999999999999999999999999999999});
		
		
		new Game.Upgrade('Keepsakes',loc("Seasonal random drops have a <b>1/5 chance</b> to carry over through ascensions.")+'<q>Cherish the memories.</q>',1111111111,[22,29]);Game.last.pool='prestige';Game.last.parents=['Starsnow','Starlove','Starterror','Startrade','Starspawn'];
		
		order=10020;
		Game.NewUpgradeCookie({name:'Mini-cookies',desc:'Have you ever noticed how the smaller something is, the easier it is to binge on it?',icon:[29,30],power:						5,price: 99999999999999999999999999999999999999*5});
		
		new Game.Upgrade('Sugar crystal cookies',(EN?'Cookie production multiplier <b>+5% permanently</b>, and <b>+1%</b> for every building type level 10 or higher.':loc("Cookie production multiplier <b>+%1% permanently</b>.",5)+'<br>'+loc("Cookie production multiplier <b>+%1%</b> for every building type level %2 or higher.",[1,10]))+'<q>Infused with cosmic sweetness. It gives off a faint shimmery sound when you hold it up to your ear.</q>',1000000000,[21,30]);Game.last.pool='prestige';Game.last.parents=['Sugar baking'];Game.last.power=function(){
			var n=5;
			for (var i in Game.Objects)
			{
				if (Game.Objects[i].level>=10) n++;
			}
			return n;
		};Game.last.pseudoCookie=true;
		Game.last.descFunc=function(){
			var n=5;
			for (var i in Game.Objects)
			{
				if (Game.Objects[i].level>=10) n++;
			}
			return '<div style="text-align:center;">'+loc("Current:")+' <b>+'+Beautify(n)+'%</b><div class="line"></div></div>'+this.ddesc;
		};
		new Game.Upgrade('Box of maybe cookies',loc("Contains an assortment of...something.")+'<q>These may or may not be considered cookies.</q>',333000000000,[25,29]);Game.last.pool='prestige';Game.last.parents=['Sugar crystal cookies'];
		new Game.Upgrade('Box of not cookies',loc("Contains an assortment of...something.")+'<q>These are strictly, definitely not cookies.</q>',333000000000,[26,29]);Game.last.pool='prestige';Game.last.parents=['Sugar crystal cookies'];
		new Game.Upgrade('Box of pastries',loc("Contains an assortment of delicious pastries.")+'<q>These are a damn slippery slope is what they are!</q>',333000000000,[27,29]);Game.last.pool='prestige';Game.last.parents=['Sugar crystal cookies'];
		
		order=10040;
		Game.NewUpgradeCookie({name:'Profiteroles',desc:'Also known as cream puffs, these pastries are light, fluffy, filled with whipped cream and fun to throw at people when snowballs are running scarce.',icon:[29,29],require:'Box of pastries',		power:4,price: Math.pow(10,31)});
		Game.NewUpgradeCookie({name:'Jelly donut',desc:'Guaranteed to contain at least 0.3% jelly filling, or your money back.<br>You can still see the jelly stab wound!',icon:[27,28],require:'Box of pastries',		power:4,price: Math.pow(10,33)});
		Game.NewUpgradeCookie({name:'Glazed donut',desc:'Absolutely gooey with sugar. The hole is the tastiest part!',icon:[28,28],require:'Box of pastries',		power:4,price: Math.pow(10,35)});
		Game.NewUpgradeCookie({name:'Chocolate cake',desc:'The cake is a Portal reference!',icon:[25,27],require:'Box of pastries',		power:4,price: Math.pow(10,37)});
		Game.NewUpgradeCookie({name:'Strawberry cake',desc:'It\'s not easy to come up with flavor text for something as generic as this, but some would say it\'s a piece of cake.',icon:[26,27],require:'Box of pastries',		power:4,price: Math.pow(10,39)});
		Game.NewUpgradeCookie({name:'Apple pie',desc:'It is said that some grandmas go rogue and bake these instead.',icon:[25,28],require:'Box of pastries',		power:4,price: Math.pow(10,41)});
		Game.NewUpgradeCookie({name:'Lemon meringue pie',desc:'Meringue is a finicky substance made of sugar and egg whites that requires specific atmospheric conditions to be baked at all. The lemon, as far as we can tell, isn\'t nearly as picky.',icon:[26,28],require:'Box of pastries',		power:4,price: Math.pow(10,43)});
		Game.NewUpgradeCookie({name:'Butter croissant',desc:'Look around.<br>A rude man in a striped shirt bikes past you. He smells of cigarettes and caf&eacute;-au-lait. Somewhere, a mime uses his moustache to make fun of the British. 300 pigeons fly overhead.<br>Relax. You\'re experiencing croissant.',icon:[29,28],require:'Box of pastries',		power:4,price: Math.pow(10,45)});
		
		order=10050;
		Game.NewUpgradeCookie({name:'Cookie dough',desc:'Bursting with infinite potential, but can also be eaten as is. Arguably worth the salmonella.',icon:[25,30],require:'Box of maybe cookies',		power:4,price: Math.pow(10,35)});
		Game.NewUpgradeCookie({name:'Burnt cookie',desc:'This cookie flew too close to the sun and is now a shadow of its former self. If only you remembered to set a timer, you wouldn\'t have this tragedy on your hands...',icon:[23,30],require:'Box of maybe cookies',		power:4,price: Math.pow(10,37)});
		Game.NewUpgradeCookie({name:'A chocolate chip cookie but with the chips picked off for some reason',desc:'This has to be the saddest thing you\'ve ever seen.',icon:[24,30],require:'Box of maybe cookies',		power:3,price: Math.pow(10,39)});
		Game.NewUpgradeCookie({name:'Flavor text cookie',desc:'What you\'re currently reading is what gives this cookie its inimitable flavor.',icon:[22,30],require:'Box of maybe cookies',		power:4,price: Math.pow(10,41)});
		Game.NewUpgradeCookie({name:'High-definition cookie',desc:'Uncomfortably detailed, like those weird stories your aunt keeps telling at parties.',icon:[28,10],require:'Box of maybe cookies',		power:5,price: Math.pow(10,43)});
		
		order=10060;
		Game.NewUpgradeCookie({name:'Toast',desc:'A crisp slice of bread, begging for some butter and jam.<br>Why do people keep proposing these at parties?',icon:[27,10],require:'Box of not cookies',		power:4,price: Math.pow(10,34)});
		Game.NewUpgradeCookie({name:'Peanut butter & jelly',desc:'It\'s time.',icon:[29,9],require:'Box of not cookies',		power:4,price: Math.pow(10,36)});
		Game.NewUpgradeCookie({name:'Wookies',desc:'These aren\'t the cookies you\'re looking for.',icon:[26,30],require:'Box of not cookies',		power:4,price: Math.pow(10,38)});
		Game.NewUpgradeCookie({name:'Cheeseburger',desc:'Absolutely no relation to cookies whatsoever - Orteil just wanted an excuse to draw a cheeseburger.',icon:[28,30],require:'Box of not cookies',		power:4,price: Math.pow(10,40)});
		Game.NewUpgradeCookie({name:'One lone chocolate chip',desc:'The start of something beautiful.',icon:[27,30],require:'Box of not cookies',		power:1,price: Math.pow(10,42)});
		
		
		new Game.Upgrade('Genius accounting',loc("Unlocks <b>extra price information</b>.<br>Each displayed cost now specifies how long it'll take you to afford it, and how much of your bank it represents.")+'<q>There\'s no accounting for taste, and yet here we are.</q>',2000000,[11,10]);Game.last.pool='prestige';Game.last.parents=['Inspired checklist'];
		
		
		new Game.Upgrade('Shimmering veil',loc("Unlocks the <b>shimmering veil</b>, a switch that passively boosts your CpS by <b>%1%</b>.<br>You start with the veil turned on; however, it is very fragile, and clicking the big cookie or any golden cookie or reindeer will turn it off, requiring %2 of CpS to turn back on.",[50,Game.sayTime(24*60*60*Game.fps,2)])+'<q>Hands off!</q>',999999999,[9,10]);Game.last.pool='prestige';Game.last.parents=['Distilled essence of redoubled luck'];
		
		order=40005;
		var func: any=function(this: any){
			var boost=Game.getVeilBoost();
			var resist=Game.getVeilDefense();
			return (this.name=='Shimmering veil [on]'?'<div style="text-align:center;">'+loc("Active.")+'</div><div class="line"></div>':'')+loc("Boosts your cookie production by <b>%1%</b> when active.<br>The veil is very fragile and will break if you click the big cookie or any golden cookies or reindeer.<br><br>Once broken, turning the veil back on costs %2 of unbuffed CpS.",[Beautify(boost*100),Game.sayTime(24*60*60*Game.fps,2)])+(resist>0?('<br><br>'+loc("Has a <b>%1%</b> chance to not break.",Beautify(resist*100))):'');
		};
		new Game.Upgrade('Shimmering veil [off]','',1000000,[9,10]);
		Game.last.pool='toggle';Game.last.toggleInto='Shimmering veil [on]';
		Game.last.priceFunc=function(){return Game.unbuffedCps*60*60*24;}
		Game.last.descFunc=func;
		new Game.Upgrade('Shimmering veil [on]','',0,[9,10]);
		Game.last.pool='toggle';Game.last.toggleInto='Shimmering veil [off]';
		Game.last.descFunc=func;
		
		
		
		var getCookiePrice=function(level: any){return 999999999999999999999999999999999999999*Math.pow(10,(level-1)/2);};
		
		order=10020;
		Game.NewUpgradeCookie({name:'Whoopie pies',desc:'Two chocolate halves joined together by a cream filling. It\'s got no eyebrows, but you never noticed until now.',icon:[21,31],power:						5,price: getCookiePrice(1)});
		Game.NewUpgradeCookie({name:'Caramel wafer biscuits',desc:'Coated in delicious chocolate. As many layers as you\'ll get in a biscuit without involving onions.',icon:[22,31],power:						5,price: getCookiePrice(2)});
		Game.NewUpgradeCookie({name:'Chocolate chip mocha cookies',desc:'Mocha started out as an excuse to smuggle chocolate into coffee. And now, in a poignant display of diplomacy and cultural exchange, it\'s bringing coffee to chocolate cookies.',icon:[23,31],power:						5,price: getCookiePrice(3)});
		Game.NewUpgradeCookie({name:'Earl Grey cookies',desc:'Captain Picard\'s favorite.',icon:[24,31],power:						5,price: getCookiePrice(4)});
		Game.NewUpgradeCookie({name:'Corn syrup cookies',desc:'The corn syrup makes it extra chewy. Not the type of stuff you\'d think to put in a cookie, but bakers make do.',icon:[25,31],power:						5,price: getCookiePrice(5)});
		Game.NewUpgradeCookie({name:'Icebox cookies',desc:'Can be prepared in a variety of shapes with a variety of ingredients. Made by freezing dough before baking it, mirroring a time-proven medieval torture practice. Gotta keep them guessing.',icon:[26,31],power:						5,price: getCookiePrice(6)});
		Game.NewUpgradeCookie({name:'Graham crackers',desc:'Inspired in their design by the wish to live a life of austere temperance, free from pleasure or cheer; it\'s no wonder these are so tasty.',icon:[27,31],power:						5,price: getCookiePrice(7)});
		Game.NewUpgradeCookie({name:'Hardtack',desc:'Extremely hard and, if we\'re being honest, extremely tack.<br>If you\'re considering eating this as a fun snack, you probably have other things to worry about than this game, like getting scurvy or your crew fomenting mutiny.',icon:[28,31],power:						5,price: getCookiePrice(8)});
		Game.NewUpgradeCookie({name:'Cornflake cookies',desc:'They\'re grrrrrroovy! Careful not to let it sit in your milk too long, lest you accidentally end up with a bowl of cereal and get confused.',icon:[29,31],power:						5,price: getCookiePrice(9)});
		Game.NewUpgradeCookie({name:'Tofu cookies',desc:'There\'s really two ways to go with tofu cooking; either it asserts itself in plain sight or it camouflages itself in the other ingredients. This happens to be the latter, and as such, you can\'t really tell the difference between this and a regular cookie, save for that one pixel on the left.',icon:[30,31],power:						5,price: getCookiePrice(10)});
		Game.NewUpgradeCookie({name:'Gluten-free cookies',desc:'Made with browned butter and milk to closely match the archetypal chocolate chip cookie.<br>For celiacs, a chance to indulge in a delicious risk-free pastry. For others, a strangely threatening confection whose empty eyes will never know heaven nor hell.',icon:[30,30],power:						5,price: getCookiePrice(10)});
		Game.NewUpgradeCookie({name:'Russian bread cookies',desc:'Also known as alphabet cookies; while most bakers follow the recipe to the letter, it is said that some substitute the flour for spelt. But don\'t take my word for it.',icon:[30,29],power:						5,price: getCookiePrice(11)});
		Game.NewUpgradeCookie({name:'Lebkuchen',desc:'Diverse cookies from Germany, fragrant with honey and spices, often baked around Christmas.<br>Once worn by warriors of old for protection in battle.<br>+5 STR, +20% magic resistance.',icon:[30,28],power:						5,price: getCookiePrice(12)});
		Game.NewUpgradeCookie({name:'Aachener Printen',desc:'The honey once used to sweeten these gingerbread-like treats has since been swapped out for beet sugar, providing another sad example of regressive evolution.',icon:[30,27],power:						5,price: getCookiePrice(13)});
		Game.NewUpgradeCookie({name:'Canistrelli',desc:'A dry biscuit flavored with anise and wine, tough like the people of Corsica where it comes from.',icon:[30,26],power:						5,price: getCookiePrice(14)});
		Game.NewUpgradeCookie({name:'Nice biscuits',desc:'Made with coconut and perfect with tea. Traces its origins to a French city so nice they named it that.',icon:[30,25],power:						5,price: getCookiePrice(15)});
		Game.NewUpgradeCookie({name:'French pure butter cookies',desc:'You can\'t tell what\'s stronger coming off these - the smell of butter or condescension.',icon:[31,25],power:						5,price: getCookiePrice(16)});
		Game.NewUpgradeCookie({name:'Petit beurre',desc:'An unassuming biscuit whose name simply means "little butter". Famed and feared for its four ears and forty-eight teeth.<br>When it hears ya, it\'ll get ya...',icon:[31,26],power:						5,price: getCookiePrice(16)});
		Game.NewUpgradeCookie({name:'Nanaimo bars',desc:'A delicious no-bake pastry hailing from Canada. Probably beats eating straight-up snow with maple syrup poured on it, but what do I know.',icon:[31,27],power:						5,price: getCookiePrice(17)});
		Game.NewUpgradeCookie({name:'Berger cookies',desc:'Messily slathered with chocolate fudge, but one of the most popular bergers of Baltimore, along with the triple fried egg berger and the blue crab cheeseberger.',icon:[31,28],power:						5,price: getCookiePrice(18)});
		Game.NewUpgradeCookie({name:'Chinsuko',desc:'A little piece of Okinawa in cookie form. Part of a Japanese custom of selling sweets as souvenirs. But hey, pressed pennies are cool too.',icon:[31,29],power:						5,price: getCookiePrice(19)});
		Game.NewUpgradeCookie({name:'Panda koala biscuits',desc:'Assorted jungle animals with equally assorted fillings.<br>Comes in chocolate, strawberry, vanilla and green tea.<br>Eat them all before they go extinct!',icon:[31,13],power:						5,price: getCookiePrice(19)});
		Game.NewUpgradeCookie({name:'Putri salju',desc:'A beloved Indonesian pastry; its name means "snow princess", for the powdered sugar it\'s coated with. Had we added these to Cookie Clicker some years ago, this is where we\'d make a reference to that one Disney movie, but it\'s probably time to let it go.',icon:[31,30],power:						5,price: getCookiePrice(20)});
		Game.NewUpgradeCookie({name:'Milk cookies',desc:'Best eaten with a tall glass of chocolate.',icon:[31,31],power:						5,price: getCookiePrice(21)});
		
		order=9999;
		Game.NewUpgradeCookie({name:'Cookie crumbs',desc:'There used to be a cookie here. Now there isn\'t.<br>Good heavens, what did you <i>DO?!</i>',icon:[30,13],power:1,require:'Legacy',price:100});
		Game.NewUpgradeCookie({name:'Chocolate chip cookie',desc:'This is the cookie you\'ve been clicking this whole time. It looks a bit dented and nibbled on, but it\'s otherwise good as new.',icon:[10,0],power:10,require:'Legacy',price:1000000000000});
		
		
		new Game.Upgrade('Cosmic beginner\'s luck',loc("Prior to purchasing the <b>%1</b> upgrade in a run, random drops are <b>%2 times more common</b>.",[getUpgradeName("Heavenly chip secret"),5])+'<q>Oh! A penny!<br>Oh! A priceless heirloom!<br>Oh! Another penny!</q>',999999999*15,[8,10]);Game.last.pool='prestige';Game.last.parents=['Shimmering veil'];
		new Game.Upgrade('Reinforced membrane',loc("The <b>shimmering veil</b> is more resistant, and has a <b>%1% chance</b> not to break. It also gives <b>+%2%</b> more CpS.",[10,10])+'<q>A consistency between jellyfish and cling wrap.</q>',999999999*15,[7,10]);Game.last.pool='prestige';Game.last.parents=['Shimmering veil'];
		
		
		order=255;
		Game.GrandmaSynergy('Binary grandmas','A digital grandma to transfer more cookies.<br>(See also : boolean grandmas, string grandmas, and not-a-number grandmas, also known as "NaNs".)','Javascript console');
		
		order=1400;
		Game.TieredUpgrade('The JavaScript console for dummies','<q>This should get you started. The first line reads: "To open the javascript console, press-"<br>...the rest of the book is soaked in chocolate milk. If only there was a way to look up this sort of information...</q>','Javascript console',1);
		Game.TieredUpgrade('64bit arrays','<q>A long-form variable type to pack your cookies much more efficiently.</q>','Javascript console',2);
		Game.TieredUpgrade('Stack overflow','<q>This is really bad! You probably forgot to close a loop somewhere and now your programs are going crazy! The rest of your engineers seem really excited about it somehow. How could a software mishap like a stack overflow possibly ever help anyone?</q>','Javascript console',3);
		Game.TieredUpgrade('Enterprise compiler','<q>This bespoke javascript compiler took your team years of development and billions in research, but it should let you execute (certain) functions (up to) 2% faster (in optimal circumstances).</q>','Javascript console',4);
		Game.TieredUpgrade('Syntactic sugar','<q>Tastier code for tastier cookies.</q>','Javascript console',5);
		Game.TieredUpgrade('A nice cup of coffee','<q>All this nerd stuff has you exhausted. You make yourself a nice cup of coffee, brewed with roasted beans from some far-away island. You may have been working a bit too hard though - the cup of coffee starts talking to you, insisting that it is NOT javascript.</q>','Javascript console',6);
		Game.TieredUpgrade('Just-in-time baking','<q>A new method of preparing cookies; they bake themselves right in front of the customers before eating, leaving your kitchens mess-free.</q>','Javascript console',7);
		Game.TieredUpgrade('cookies++','<q>Your very own cookie-themed programming language, elegantly named after its most interesting ability - increasing the "cookies" variable by 1.</q>','Javascript console',8);
		Game.TieredUpgrade('Software updates','<q>This is grand news - someone\'s finally figured out the Wifi password, and your newfound internet connection seems to have triggered a whole lot of software updates! Your browsers, drivers and plugins all received a fresh coat of paint, and your javascript version has been updated to the latest ECMAScript specification. It\'s really too bad thousands had to die due to some deprecated function in your neurotoxin ventilation code, but I guess that\'s progress for you.</q>','Javascript console',9);
		Game.TieredUpgrade('Game.Loop','<q>You\'re not quite sure what to make of this. What does it mean? What does it do? Who would leave something like that just laying around here? Try asking again in 1/30th of a second.</q>','Javascript console',10);
		Game.TieredUpgrade('eval()','<q>It is said that this simple function holds the key to the universe, and that whosoever masters it may shape reality to their will.<br>Good thing you have no idea how it works. Makes for a neat plaque on your wall, though.</q>','Javascript console',11);
		
		order=5000;
		Game.SynergyUpgrade('Script grannies','<q>Armies of energy drink-fueled grandmas ready to hack into the cyberspace for renegade e-cookies.</q>','Javascript console','Grandma','synergy1');
		Game.SynergyUpgrade('Tombola computing','','Javascript console','Chancemaker','synergy2');
		if (EN)
		{
			Game.last.descFunc=function(){
				Math.seedrandom(Game.seed+'-tombolacomputing');
		// CC3: the verbatim 2.048 line below indexes choose with a comma
		// expression (choose['red','orange',…,'teal']) — a faithful 2.048
		// quirk that evaluates to undefined at runtime, so the tombola can
		// draw this dead entry exactly as master does. TS2695 (unused comma
		// left side) is a property of the source itself and cannot be fixed
		// with types alone.
		// @ts-ignore — see the CC3 note above
				var str='(Your ticket reads '+Math.floor(Math.random()*100)+' '+Math.floor(Math.random()*100)+' '+Math.floor(Math.random()*100)+' '+Math.floor(Math.random()*100)+', entitling you to '+choose([Math.floor(Math.random()*5+2)+' lines of javascript','one free use of Math.random()','one qubit, whatever that is','one half-eaten cookie','a brand new vacuum cleaner','most of one room-temperature cup of orange soda','one really good sandwich','one handful of pocket lint','someone\'s mostly clean hairpiece','a trip to a fancy restaurant','the knowledge of those numbers','a furtive glance at the news ticker','another ticket, half-price','all-you-can-eat moldy bread','one lifetime supply of oxygen','the color '+choose['red','orange','yellow','green','blue','purple','black','white','gray','brown','pink','teal'],'increased intellect for a limited time','an ancient runesword','the throne of a far-away country','the position of Mafia capo. Good luck','one free time-travel week-end','something beautiful','the deed to some oil well','one hamburger made out of the animal, plant, or person of your choice','the last surviving '+choose['dodo bird','thylacine','unicorn','dinosaur','neanderthal'],'a deep feeling of accomplishment','a fleeting tinge of entertainment','a vague sense of unease','deep existential dread','one extra week added to your lifespan','breathe manually','blink right here and now','one meeting with any famous person, living or dead, in your next dream','one very nice dream','a wacky sound effect','45 seconds of moral flexibility','hundreds and thousands, also known as "sprinkles"','one circle, triangle, square or other simple geometric shape, of average dimensions','just this extra bit of randomness','the extra push you needed to turn your life around','a good fright','one secret superpower','a better luck next time','an irrational phobia of tombola tickets','one whole spider','an increased sense of self-worth and determination','inner peace','one double-XP week-end in the MMORPG of your choice','a little piece of the universe, represented by the trillions of atoms that make up this very ticket','food poisoning','the Moon! Well, conceptually','a new car, baby','a new catchphrase','an intrusive thought of your choice','- ...aw man, it just cuts off there','the director spot for the next big hit movie','really good-looking calves','one genuine pirate golden doubloon','"treasure and riches", or something','one boat, sunken','baby shoes, never worn','direct lineage to some King or Queen','innate knowledge of a dead language you\'ll never encounter','the melody of a song you don\'t know the words to','white noise','mild physical impairment','a new pair of lips','things, and such','one popular expression bearing your name','one typo','one get-out-of-jail-free card','the rest of your life... for now','one polite huff','a condescending stare','one cursed monkey paw','true love, probably','an interesting factoid about the animal, country, TV show or celebrity of your choice','a pop culture reference','minutes of fun','the etymology of the word "tombola" - it\'s Italian for "a tumble"','nothing. You lost, sorry'])+'.)';
				Math.seedrandom();
				return this.desc+'<q>Like quantum computing, but more fun.<br>'+str+'</q>';
			};
		}
		else Game.last.desc='<q>-</q>';
		
		order=10020;
		Game.NewUpgradeCookie({name:'Kruidnoten',desc:'A festive dutch favorite; tiny cinnamony bites sometimes coated in chocolate. The name translates roughly to "kruidnoten".',icon:[30,3],power:						5,price: getCookiePrice(22)});
		Game.NewUpgradeCookie({name:'Marie biscuits',desc:'Pleasantly round, smoothly buttery, subtly vanilla-flavored, ornately embossed, each ridge represents a person Marie killed in prison.',icon:[30,4],power:						5,price: getCookiePrice(23)});
		Game.NewUpgradeCookie({name:'Meringue cookies',desc:'Probably the most exciting thing you can make out of egg whites. Also called forgotten cookies, due to the recipe being once lost in a sealed mystical vault for 10,000 years.',icon:[31,4],power:						5,price: getCookiePrice(24)});
		
		order=10060;
		Game.NewUpgradeCookie({name:'Pizza',desc:'What is a pizza if not a large, chewy cookie, frosted with a rather exuberant tomato & cheese icing? Not a cookie, that\'s what.',icon:[31,9],require:'Box of not cookies',		power:5,price: Math.pow(10,44)});
		
		order=10050;
		Game.NewUpgradeCookie({name:'Crackers',desc:'These are the non-flavored kind with no salt added. Really just a judgment-free wheat square begging to have bits of ham and spreadable cheese piled onto it, its main contribution being "crunchy".',icon:[30,9],require:'Box of maybe cookies',		power:4,price: Math.pow(10,45)});
		
		order=10030;
		Game.NewUpgradeCookie({name:'Havabreaks',desc:'You can snap the sections neatly or just bite into the whole thing like some kind of lunatic. Some oversea countries manufacture these in hundreds of unique flavors, such as green tea, lobster bisque, and dark chocolate.',icon:[31,3],require:'Box of brand biscuits',power:												2,	price:	999999999999999999999999999*5});
		
		order=20000;
		new Game.Upgrade('Kitten executives',strKittenDesc+'<q>ready to execute whatever and whoever you\'d like, sir</q>',900000000000000000000000000000000000000000000,Game.GetIcon('Kitten',13));Game.last.kitten=1;Game.MakeTiered(Game.last,13,18);
		
		
		order=10020;
		Game.NewUpgradeCookie({name:'Chai tea cookies',desc:'Not exactly Captain Picard\'s favorite, but I mean, these will do in a pinch.',icon:[23,32],power:						5,price: getCookiePrice(4)+5});Game.last.order=10020.5685;
		
		Game.NewUpgradeCookie({name:'Yogurt cookies',desc:'Augmented by the wonders of dairy, these cookies are light and fluffy and just one more thing for the lactose-intolerant to avoid.<br>Truly for the cultured among us.',icon:[24,32],power:						5,price: getCookiePrice(25)});
		Game.NewUpgradeCookie({name:'Thumbprint cookies',desc:'Filled with jam and sometimes served in little paper cups. No longer admissible as biometric evidence in court. We\'re not having a repeat of that whole mess.',icon:[25,32],power:						5,price: getCookiePrice(26)});
		Game.NewUpgradeCookie({name:'Pizzelle',desc:'Thin, crisp waffle cookies baked in a bespoke iron following an ancient Italian recipe.<br>These cookies have been around for a long, long time.<br>These cookies have seen things.',icon:[26,32],power:						5,price: getCookiePrice(27)});
		
		order=10030;
		Game.NewUpgradeCookie({name:'Zilla wafers',desc:'Popular vanilla-flavored biscuits that somehow keep ending up in banana pudding.<br>Themed after a beloved radioactive prehistoric monster, for some reason.',icon:[22,32],require:'Box of brand biscuits',power:												2,	price:	999999999999999999999999999999*5});
		Game.NewUpgradeCookie({name:'Dim Dams',desc:'Two biscuits joined by chocolate and coated in even more chocolate.<br>You wonder - which one is the dim, and which one is the dam?',icon:[31,10],require:'Box of brand biscuits',power:												2,	price:	999999999999999999999999999999999*5});
		
		order=10060;
		Game.NewUpgradeCookie({name:'Candy',desc:'There are two pillars to the world of sweets : pastries, of course - and candy.<br>You could make a whole new game just about these, but for now, please enjoy these assorted generic treats.',icon:[30,10],require:'Box of not cookies',		power:5,price: Math.pow(10,46)});
		
		
		order=19000;
		Game.TieredUpgrade('Fortune #001','<q>Fingers are not the only thing you can count on.</q>','Cursor','fortune');
		Game.TieredUpgrade('Fortune #002','<q>A wrinkle is a crack in a mundane facade.</q>','Grandma','fortune');
		Game.TieredUpgrade('Fortune #003','<q>The seeds of tomorrow already lie within the seeds of today.</q>','Farm','fortune');
		Game.TieredUpgrade('Fortune #004','<q>Riches from deep under elevate you all the same.</q>','Mine','fortune');
		Game.TieredUpgrade('Fortune #005','<q>True worth is not in what you find, but in what you make.</q>','Factory','fortune');
		Game.TieredUpgrade('Fortune #006','<q>The value of money means nothing to a pocket.</q>','Bank','fortune');
		Game.TieredUpgrade('Fortune #007','<q>Not all guides deserve worship.</q>','Temple','fortune');
		Game.TieredUpgrade('Fortune #008','<q>Magic is about two things - showmanship, and rabbits.</q>','Wizard tower','fortune');
		Game.TieredUpgrade('Fortune #009','<q>Every mile travelled expands the mind by just as much.</q>','Shipment','fortune');
		Game.TieredUpgrade('Fortune #010','<q>Don\'t get used to yourself. You\'re gonna have to change.</q>','Alchemy lab','fortune');
		Game.TieredUpgrade('Fortune #011','<q>Every doorway is a gamble. Tread with care.</q>','Portal','fortune');
		Game.TieredUpgrade('Fortune #012','<q>Do your future self a favor; they\'ll thank you for it.</q>','Time machine','fortune');
		Game.TieredUpgrade('Fortune #013','<q>The world is made of what we put into it.</q>','Antimatter condenser','fortune');
		Game.TieredUpgrade('Fortune #014','<q>Staring at a dazzling light can blind you back to darkness.</q>','Prism','fortune');
		Game.TieredUpgrade('Fortune #015','<q>Don\'t leave to blind chance what you could accomplish with deaf skill.</q>','Chancemaker','fortune');
		Game.TieredUpgrade('Fortune #016','<q>It\'s good to see yourself in others. Remember to see yourself in yourself, too.</q>','Fractal engine','fortune');
		Game.TieredUpgrade('Fortune #017','<q>If things aren\'t working out for you, rewrite the rules.</q>','Javascript console','fortune');
		
		
		order=19100;
		//note : price for these capped to base price OR 1 day of unbuffed CpS
		new Game.Upgrade('Fortune #100',loc("All buildings and upgrades are <b>%1% cheaper</b>.",1)+' '+loc("Cookie production multiplier <b>+%1%</b>.",1)+'<q>True wealth is counted in gifts.</q>',
		Game.Tiers['fortune'].price*100000,[0,0]);Game.MakeTiered(Game.last,'fortune',10);
		Game.last.priceFunc=function(me: any){return Math.min(me.basePrice,Game.unbuffedCps*60*60*24);}
		new Game.Upgrade('Fortune #101',loc("Cookie production multiplier <b>+%1%</b>.",7)+'<q>Some people dream of fortunes; others dream of cookies.</q>',Game.Tiers['fortune'].price*100000000,[0,0]);Game.MakeTiered(Game.last,'fortune',10);
		Game.last.priceFunc=function(me: any){return Math.min(me.basePrice,Game.unbuffedCps*60*60*24);}
		new Game.Upgrade('Fortune #102',loc("You gain another <b>+%1%</b> of your regular CpS while the game is closed.",1)+' <small>('+loc("Must own the %1 upgrade.",getUpgradeName("Twin Gates of Transcendence"))+')</small>'+'<q>Help, I\'m trapped in a '+(App?'computer':'browser')+' game!</q>',Game.Tiers['fortune'].price*100000000000,[0,0]);Game.MakeTiered(Game.last,'fortune',10);
		Game.last.priceFunc=function(me: any){return Math.min(me.basePrice,Game.unbuffedCps*60*60*24);}
		new Game.Upgrade('Fortune #103',strKittenDesc+'<q>Don\'t believe the superstitions; all cats are good luck.</q>',Game.Tiers['fortune'].price*100000000000000,[0,0]);Game.MakeTiered(Game.last,'fortune',18);Game.last.kitten=1;
		Game.last.priceFunc=function(me: any){return Math.min(me.basePrice,Game.unbuffedCps*60*60*24);}
		new Game.Upgrade('Fortune #104',getStrClickingGains(1)+'<q>Remember to stay in touch.</q>',Game.Tiers['fortune'].price*100000000000,[0,0]);Game.MakeTiered(Game.last,'fortune',11);
		Game.last.priceFunc=function(me: any){return Math.min(me.basePrice,Game.unbuffedCps*60*60*24);}
		
		new Game.Upgrade('Fortune cookies',loc("The news ticker may occasionally have <b>fortunes</b>, which may be clicked for something good.")+'<q>These don\'t taste all that great but that\'s not really the point, is it?</q>',77777777777,[29,8]);Game.last.pool='prestige';Game.last.parents=['Distilled essence of redoubled luck'];
		
		
		order=40000;
		new Game.Upgrade('A really good guide book','<b>???</b><q>??????</q>',7,[22,12]);//debug purposes only
		//new Game.Upgrade('A really good guide book','<b>All dungeon locations behave as if unlocked.</b><br><b>You may shift-click a dungeon location to teleport there.</b><q>It even tells you which hotels to avoid!</q>',7,[22,12]);//debug purposes only
		Game.last.buyFunction=function(){if (Game.Objects['Factory'].minigameLoaded){Game.Objects['Factory'].minigame.computeMapBounds();Game.Objects['Factory'].minigame.updateLocStyles();}}
		Game.last.pool='debug';
		
		order=10300;
		Game.NewUpgradeCookie({name:'Prism heart biscuits',desc:'An every-flavor biscuit that stands for universal love and being true to yourself.',require:'Eternal heart biscuits',season:'valentines',icon:[30,8],							power:heartPower,price: 1000000000000000000000000});Game.last.order=10300.175;
		
		order=19100;
		new Game.Upgrade('Kitten wages',loc("Through clever accounting, this actually makes kitten upgrades <b>%1% cheaper</b>.",10)+'<q>Cats can have little a salary, as a treat.<br>Cats are expert hagglers and have a keen sense of bargaining, especially in the case of cash.</q>',9000000000,[31,8]);Game.last.pool='prestige';Game.last.parents=['Kitten angels'];Game.last.kitten=1;
		new Game.Upgrade('Pet the dragon',loc("Unlocks the ability to <b>pet your dragon</b> by clicking on it once hatched.")+'<q>Dragons do not purr. If your dragon starts purring, vacate the area immediately.</q>',99999999999,[30,12]);Game.last.pool='prestige';Game.last.parents=['How to bake your dragon','Residual luck'];
		
		order=25100;
		var dragonDropUpgradeCost=function(_me: any){return Game.unbuffedCps*60*30*((Game.dragonLevel<Game.dragonLevels.length-1)?1:0.1);};
		new Game.Upgrade('Dragon scale',getStrCookieProductionMultiplierPlus(3)+'<br>'+loc("Cost scales with CpS, but %1 times cheaper with a fully-trained dragon.",10)+'<q>Your dragon sheds these regularly, so this one probably won\'t be missed.<br>Note: icon not to scale.</q>',999,[30,14]);Game.last.priceFunc=dragonDropUpgradeCost;
		new Game.Upgrade('Dragon claw',loc("Clicking is <b>%1%</b> more powerful.",3)+'<br>'+loc("Cost scales with CpS, but %1 times cheaper with a fully-trained dragon.",10)+'<q>Will grow back in a few days\' time.<br>A six-inch retractable claw, like a razor, from the middle toe. So you know, try to show a little respect.</q>',999,[31,14]);Game.last.priceFunc=dragonDropUpgradeCost;
		new Game.Upgrade('Dragon fang',loc("Golden cookies give <b>%1%</b> more cookies.",3)+'<br>'+loc("Dragon harvest and Dragonflight are <b>%1% stronger</b>.",10)+'<br>'+loc("Cost scales with CpS, but %1 times cheaper with a fully-trained dragon.",10)+'<q>Just a fallen baby tooth your dragon wanted you to have, as a gift.<br>It might be smaller than an adult tooth, but it\'s still frighteningly sharp - and displays some awe-inspiring cavities, which you might expect from a creature made out of sweets.</q>',999,[30,15]);Game.last.priceFunc=dragonDropUpgradeCost;
		new Game.Upgrade('Dragon teddy bear',loc("Random drops are <b>%1% more common</b>.",3)+'<br>'+loc("Cost scales with CpS, but %1 times cheaper with a fully-trained dragon.",10)+'<q>Your dragon used to sleep with this, but it\'s yours now.<br>Crafted in the likeliness of a fearsome beast. Stuffed with magical herbs picked long ago by a wandering wizard. Woven from elven yarn and a polyester blend.</q>',999,[31,15]);Game.last.priceFunc=dragonDropUpgradeCost;
		
		order=10020;
		Game.NewUpgradeCookie({name:'Granola cookies',desc:'Wait! These are just oatmeal cookies mixed with raisin cookies! What next, half-dark chocolate half-white chocolate cookies?',icon:[28,32],power:						5,price: getCookiePrice(28)});
		Game.NewUpgradeCookie({name:'Ricotta cookies',desc:'Light and cake-like. Often flavored with lemon or almond extract. Sprinkles optional. Allegedly Italian. Investigation pending.',icon:[29,32],power:						5,price: getCookiePrice(29)});
		Game.NewUpgradeCookie({name:'Roze koeken',desc:'The icing on these Dutch cookies is traditionally pink, but different colors may be used for special occasions - such as pink to celebrate Breast Cancer Awareness Month, or for International Flamingo Day, pink.',icon:[30,32],power:						5,price: getCookiePrice(30)});
		Game.NewUpgradeCookie({name:'Peanut butter cup cookies',desc:'What more poignant example of modern societal struggles than the brazen reclaiming of a corporate product by integrating it in the vastly more authentic shell of a homemade undertaking? Anyway this is a peanut butter cup, baked into a cookie. It\'s pretty good!',icon:[31,32],power:						5,price: getCookiePrice(31)});
		Game.NewUpgradeCookie({name:'Sesame cookies',desc:'Look at all the little seeds on these! It\'s like someone dropped them on the street or something! A very welcoming and educational street!',icon:[22,33],power:						5,price: getCookiePrice(32)});
		Game.NewUpgradeCookie({name:'Taiyaki',desc:'A pastry fish filled with red bean paste, doomed to live an existence of constant and excruciating pain as its aquatic environment slowly dissolves its soft doughy body.<br>Also comes in chocolate flavor!',icon:[23,33],power:						5,price: getCookiePrice(33)});
		Game.NewUpgradeCookie({name:'Vanillekipferl',desc:'Nut-based cookies from Central Europe, coated in powdered vanilla sugar. Regular kipferl, crescent-shaped bread rolls from the same region, are much less exciting.',icon:[24,33],power:						5,price: getCookiePrice(34)});
		
		order=10300;
		Game.NewUpgradeCookie({name:'Cosmic chocolate butter biscuit',desc:'Rewarded for owning 550 of everything.<br>Through some strange trick of magic or technology, looking at this cookie is like peering into a deep ocean of ancient stars. The origins of this biscuit are unknown; its manufacture, as far as your best investigators can tell, left no paper trail. From a certain angle, if you squint hard enough, you\'ll notice that a number of stars near the center are arranged to resemble the outline of your own face.',icon:[27,32],power:	10,price: 999999999999999999999999999999999999999999999999*butterBiscuitMult,locked:1});
		
		order=100;new Game.Upgrade('Nonillion fingers',getStrThousandFingersGain(20)+'<q>Only for the freakiest handshakes.</q>',10000000000000000000000000,[12,31]);Game.MakeTiered(Game.last,13,0);
		order=150;new Game.Upgrade('Miraculite mouse',getStrClickingGains(1)+'<q>Composed of a material that neither science nor philosophy are equipped to conceptualize. And boy, does it ever click.</q>',50000000000000000000000000000,[11,31]);Game.MakeTiered(Game.last,13,11);
		order=200;Game.TieredUpgrade('Generation degeneration','<q>Genetic testing shows that most of your grandmas are infected with a strange degenerative disease that only seems to further their powers; the more time passes, the older they get. This should concern you.</q>','Grandma',12);
		order=300;Game.TieredUpgrade('Global seed vault','<q>An enormous genetic repository that could outlive an apocalypse. Guarantees the survival of your empire, or at the very least its agricultural components, should civilization fall. Which should be any day now.</q>','Farm',12);
		order=400;Game.TieredUpgrade('Air mining','<q>You\'ve dug your drills through just about every solid surface you could find. But did you know recent advances have revealed untold riches hiding within non-solid surfaces too?</q>','Mine',12);
		order=500;Game.TieredUpgrade('Behavioral reframing','<q>Through careful social engineering you\'ve convinced your workers that "union" is a slur that only the most vile and repugnant filth among us would ever dare utter! Sometimes progress isn\'t in the big machines, it\'s in the little lies!</q>','Factory',12);
		order=525;Game.TieredUpgrade('Altruistic loop','<q>You control so many branches of the global economy and legislative bodies that, through a particularly creative loophole, donating money (to yourself) grants you even more cash in tax deductions than you started with!</q>','Bank',12);
		order=550;Game.TieredUpgrade('A novel idea','<q>You don\'t get rich starting a religion. If you want to get rich, you write science fiction.</q>','Temple',12);
		order=575;Game.TieredUpgrade('Spelling bees','<q>You\'ve unleashed a swarm of magically-enhanced bees upon mankind! Their stinging spells may be the bane of all living things but you\'re certain you can put their delicious, purple, fizzy honey to good use!</q>','Wizard tower',12);
		order=600;Game.TieredUpgrade('Toroid universe','<q>If you think of the universe as an nth-dimensional torus that wraps back on itself in every direction, you can save a fortune on rocket fuel! Of course the universe isn\'t actually shaped like that, but you\'ve never let details stand in your way.</q>','Shipment',12);
		order=700;Game.TieredUpgrade('Hermetic reconciliation','<q>It\'s time for modern science and the mystical domains of the occult to work together at last. What do gravitons transmute into? What if alkahest is pH-neutral? Should a homunculus have the right to vote? And other exciting questions coming to you soon, whether you like it or not.</q>','Alchemy lab',12);
		order=800;Game.TieredUpgrade('His advent','<q>He comes! He comes at last! Just like the prophecies foretold! And as He steps out of the portal, your engineers begin slicing Him into convenient chunks before transporting His writhing cosmic flesh to your factories, where He will be processed and converted into a new and exciting cookie flavor, available in stores tomorrow.</q>','Portal',12);
		order=900;Game.TieredUpgrade('Split seconds','<q>Time is infinite, yes... But what if, nestled within each second, were even more infinities? Every moment an eternity! Think of how many scheduling troubles this solves!</q>','Time machine',12);
		order=1000;Game.TieredUpgrade('Flavor itself','<q>Deep under the earth, in the most sterile laboratory, in the most vast and expensive particle accelerator ever devised, your scientists have synthesized -for a fraction of a second- the physical manifestation of pure flavor. Highly unstable, and gone in a puff of radioactive energy, it nonetheless left your team shivering with awe... and hunger.</q>','Antimatter condenser',12);
		order=1100;Game.TieredUpgrade('Light speed limit','<q>Whoah, slow down. Harvesting light is well and good but it\'d be much easier if it weren\'t so dang fast! This should thankfully take care of that.</q>','Prism',12);
		order=1200;Game.TieredUpgrade('A touch of determinism','<q>By knowing the exact position and movement of every particle in the universe, you\'re able to predict everything that can ever happen, leaving nothing to chance. This was a doozy to pull off mind you, but it\'s helped you win 50 bucks at the horse races so you could say it\'s already paying off.</q>','Chancemaker',12);
		order=1300;Game.TieredUpgrade('This upgrade','<q>This upgrade\'s flavor text likes to refer to itself, as well as to the fact that it likes to refer to itself. You should really buy this upgrade before it starts doing anything more obnoxious.</q>','Fractal engine',12);
		order=1400;Game.TieredUpgrade('Your biggest fans','<q>Let\'s face it, baking cookies isn\'t the most optimized thing there is. So you\'ve purchased your biggest fans yet and stuck them next to your computers to keep things chill and in working order. Cool!</q>','Javascript console',12);
		
		
		order=10020;
		Game.NewUpgradeCookie({name:'Battenberg biscuits',desc:'Inspired by a cake of the same name, itself named after a prince of the same name. You suppose you could play a really, really short game of chess on these.',icon:[28,33],power:						5,price: getCookiePrice(35)});
		Game.NewUpgradeCookie({name:'Rosette cookies',desc:'Intricate fried pastries from Northern Europe, made using specialized irons and dipped in icing sugar. While usually eaten as a delicious treat, these are often also used as Christmas tree decorations, or worn elegantly on one\'s lapel to symbolize the nah I\'m just messing with you.',icon:[26,33],power:						5,price: getCookiePrice(36)});
		Game.NewUpgradeCookie({name:'Gangmakers',desc:'The little bit of raspberry jam at its center is crucial; a plain butter cookie with chocolate topping does not a gangmaker make.',icon:[27,33],power:						5,price: getCookiePrice(37)});
		Game.NewUpgradeCookie({name:'Welsh cookies',desc:'Welsh cookies, also known as Welsh cakes, bakestones, griddle cakes, griddle scones, or pics, or in Welsh: <i>picau ar y maen, pice bach, cacennau cri</i> or <i>teisennau gradell</i>, are rich currant-filled scone-like biscuits of uncertain origin.',icon:[29,33],power:						5,price: getCookiePrice(38)});
		Game.NewUpgradeCookie({name:'Raspberry cheesecake cookies',desc:'The humble raspberry cheesecake, now in ascended cookie form. Researchers posit that raspberry cheesecake cookies are evidence that the final form of every baked good, through convergent evolution, approaches that of a cookie, in a process known as cookienisation.',icon:[25,33],power:						5,price: getCookiePrice(39)});
		
		
		
		order=255;
		Game.GrandmaSynergy('Alternate grandmas','A different grandma to bake something else.','Idleverse');
		
		order=1500;
		Game.TieredUpgrade('Manifest destiny','<q>While the ethics of ransacking parallel universes for their riches may seem questionable to some, you\'ve reasoned that bringing the good word of your cookie empire to the unwashed confines of other realities is your moral duty, nay, your righteous imperative, and must be undertaken as soon as possible, lest they do it to you first!</q>','Idleverse',1);
		Game.TieredUpgrade('The multiverse in a nutshell','<q>The structure of the metacosmos may seem confusing and at times even contradictory, but here\'s what you\'ve gathered so far:<br><br><div style="text-align:left;">&bull; each reality, or "idleverse", exists in parallel to all others<br><br>&bull; most realities seem to converge towards the production of a sole type of item (ours evidently being, thanks to you, cookies)<br><br>&bull; each reality is riddled with chaotic tunnels to a number of subordinate dimensions (such as the so-called "cookieverse"), much like swiss cheese<br><br>&bull; all realities bathe in an infinite liquid of peculiar properties, colloquially known as "milk"</div><br>Finally, each reality may have its own interpretation of the concept of "reality", for added fun.</q>','Idleverse',2);
		Game.TieredUpgrade('All-conversion','<q>It\'s quite nice that you can rewire the logic of each universe to generate cookies instead, but you still end up with parsec-loads of whatever they were producing before - baubles you\'ve long made obsolete: cash money, gems, cheeseburgers, puppies... That\'s why you\'ve designed the universal converter, compatible with any substance and capable of turning those useless spoils of conquest into the reassuring crumbly rustle of even more cookies.</q>','Idleverse',3);
		Game.TieredUpgrade('Multiverse agents','<q>You can send undercover spies to infiltrate each universe and have them signal you whether it\'s worth overtaking. Once the assimilation process started, they will also help pacify the local populations, having established trust through the use of wacky, but seamless, disguises.</q>','Idleverse',4);
		Game.TieredUpgrade('Escape plan','<q>You\'ve set an idleverse aside and terraformed it to closely resemble this one in case something goes horribly wrong in here. Of course, the denizens of that idleverse also have their own escape idleverse to abscond to in the eventuality of your arrival, itself likely having its own contingency idleverse, and so on.</q>','Idleverse',5);
		Game.TieredUpgrade('Game design','<q>Each idleverse functions according to some form of transcendental programming, that much is a given. But they also seem to be governed by much more subtle rules, the logic of which, when harnessed, may give you unparalleled dominion over the multiverse. Rewrite the rules! A game designer is you!</q>','Idleverse',6);
		Game.TieredUpgrade('Sandbox universes','<q>It doesn\'t seem like you\'ll run out of extra universes anytime soon so why not repurpose some of them as consequence-free testing grounds for all your more existentially threatening market research? (...consequence-free for you, anyway.)</q>','Idleverse',7);
		Game.TieredUpgrade('Multiverse wars','<q>Hmm, looks like some other universes wised up to your plundering. Thankfully, that\'s nothing your extra beefed-up metacosmic military budget can\'t handle!</q>','Idleverse',8);
		Game.TieredUpgrade('Mobile ports','<q>Accessing each outer universe is a bit of a hassle, requiring the once-in-a-blue-moon alignment of natural cosmic ports to transit from universe to universe. You\'ve finally perfected the method of constructing your own self-propelled ports, which can travel near-instantaneously along universal perimeters to permit headache-free multiverse connections. Took you long enough.</q>','Idleverse',9);
		Game.TieredUpgrade('Encapsulated realities','<q>Untold feats of science went into the reduction of infinite universes into these small, glimmering, easy-to-store little spheres. Exercise infinite caution when handling these, for each of them, containing endless galaxies and supporting endless life, is more precious than you can ever fathom. They\'ve also proven to be quite a smash hit in your warehouses on bowling night.</q>','Idleverse',10);
		Game.TieredUpgrade('Extrinsic clicking','<q>If you poke an idleverse, it seems like it gets work done faster. It\'s also quite fun hearing a trillion terrified voices screaming in unison.</q>','Idleverse',11);
		Game.TieredUpgrade('Universal idling','<q>The nature of idleverses is found in waiting. The more you wait on an idleverse, the more exponentially potent it becomes - which saves you a whole lot of hard work. In a true act of zen, you\'ve taken to biding your time when collecting new universes, letting them ripen like a fine wine.</q>','Idleverse',12);
		
		order=5000;
		Game.SynergyUpgrade('Perforated mille-feuille cosmos','<q>Imagine, if you will, layers upon layers upon layers. Now picture billions of worms chewing their way through it all. This roughly, but not quite, approximates the geometry of the most basal stratum of our natural world.</q>','Idleverse','Portal','synergy1');
		Game.SynergyUpgrade('Infraverses and superverses','<q>Universes within universes? How subversive!</q>','Idleverse','Fractal engine','synergy2');
		
		order=19000;
		Game.TieredUpgrade('Fortune #018','<q>There\'s plenty of everyone, but only one of you.</q>','Idleverse','fortune');
		
		order=10300;
		Game.NewUpgradeCookie({name:'Butter biscuit (with butter)',desc:'Rewarded for owning 600 of everything.<br>This is a plain butter biscuit. It\'s got some butter on it. The butter doesn\'t look like anything in particular.',icon:[30,33],power:	10,price: 999999999999999999999999999999999999999999999999999*butterBiscuitMult,locked:1});
		
		
		order=200;Game.TieredUpgrade('Visits','<q>In an extensive double-blind study (sample size: 12 million), your researchers have found evidence that grandmas are up to twice as productive if you just come by and say hi once in a while. It\'s nice to check up on your grans! (Do not under any circumstances ingest any tea or tea-like substances the grandmas may offer you.)</q>','Grandma',13);
		order=300;Game.TieredUpgrade('Reverse-veganism','<q>Plants aren\'t for eating, plants are for exploitative agriculture and astronomical profit margins!</q>','Farm',13);
		order=400;Game.TieredUpgrade('Caramel alloys','<q>Your geologists have isolated a family of once-overlooked sugary ores that, when combined, may be turned into even more cookie ingredients. Your millions of miles of previously useless tunnels probably house insane amounts of the stuff!</q>','Mine',13);
		order=500;Game.TieredUpgrade('The infinity engine','<q>In this house, I guess we don\'t care much for the laws of thermodynamics.</q>','Factory',13);
		order=525;Game.TieredUpgrade('Diminishing tax returns','<q>Wow, they\'re tiny! Wish you\'d thought of that sooner!</q>','Bank',13);
		order=550;Game.TieredUpgrade('Apparitions','<q>You\'ve booked a deal with the higher-ups that schedules one weekly earthly apparition by a deity, angel, ascended prophet, or other holy figure. This should boost interest in cookie religion among youths as long as you can secure a decent time slot.</q>','Temple',13);
		order=575;Game.TieredUpgrade('Wizard basements','<q>You\'ve received construction permits allowing you to build basements underneath each wizard tower. This provides a handy storage space for precious reagents, fizzled-out soul gems, and weird old magazines.</q>','Wizard tower',13);
		order=600;Game.TieredUpgrade('Prime directive','<q>An intergalactic delegation made you pinky-swear not to directly interact with lesser alien cultures. Which is fine, because it\'s much funnier to rob a planet blind when its inhabitants have no idea what\'s going on.</q>','Shipment',13);
		order=700;Game.TieredUpgrade('Chromatic cycling','<q>All states of matter exist in a continuous loop. Having learned how to cycle through them, all you have to do is to freeze matter right on the state you need. For reference, the cookie state of matter is situated at precisely 163.719&deg;, right between lamellar gas and metaplasma.</q>','Alchemy lab',13);
		order=800;Game.TieredUpgrade('Domestic rifts','<q>You\'ve managed to manufacture portals that are convenient enough, and legally safe enough, that you can just stick them against walls inside buildings to connect rooms together in unusual configurations. In practice, this means your employees get to have much shorter bathroom breaks.</q>','Portal',13);
		order=900;Game.TieredUpgrade('Patience abolished','<q>You wait for no one.</q>','Time machine',13);
		order=1000;Game.TieredUpgrade('Delicious pull','<q>In addition to the 4 fundamental forces of the universe -gravity, electromagnetism, weak and strong interactions- your scientists have at long last confirmed the existence of a fifth one, mediated by sugar bosons; it dictates that any two masses of ingredient-like matter will, given enough time, eventually meet each other to produce a third, even tastier substance. Your team enthusiastically names it the delicious pull.</q>','Antimatter condenser',13);
		order=1100;Game.TieredUpgrade('Occam\'s laser','<q>Invented by Franciscan friar William of Occam in 1<span></span>327. An impossibly clever use of light theory with a billion possible applications, some of which frightfully destructive. Confined to a single goat-skin parchment for hundreds of years until the patent expired and hit public domain, just now.</q>','Prism',13);
		order=1200;Game.TieredUpgrade('On a streak','<q>Take a moment to appreciate how far you\'ve come. How lucky you\'ve been so far. It doesn\'t take a genius statistician to extrapolate a trend from this. There\'s no way anything bad could happen to you now. Right?</q>','Chancemaker',13);
		order=1300;Game.TieredUpgrade('A box','<q>What\'s in that box? Why, it\'s a tiny replica of your office! And there\'s even a little you in there! And what\'s on the little desk... say - that\'s an even tinier box! And the little you is opening it, revealing an even tinier office! And in the tinier office there\'s- Hmm. You can think of a couple uses for this.</q>','Fractal engine',13);
		order=1400;Game.TieredUpgrade('Hacker shades','<q>I\'m in.</q>','Javascript console',13);
		order=1500;Game.TieredUpgrade('Break the fifth wall','<q>Huh, was that always there? Whatever it was, it\'s gone now. And what was behind is yours for the taking.</q>','Idleverse',13);
		
		
		new Game.Upgrade('Cat ladies',loc("Each kitten upgrade boosts %1 CpS by <b>%2%</b>.",[loc("grandma"),29])+'<q>Oh no. Oh no no no. Ohhh this isn\'t right at all.</q>',9000000000,[32,3]);Game.last.pool='prestige';Game.last.parents=['Kitten angels'];
		new Game.Upgrade('Milkhelp&reg; lactose intolerance relief tablets',loc("Each rank of milk boosts %1 CpS by <b>%2%</b>.",[loc("grandma"),5])+'<q>Aged like milk.</q>',900000000000,[33,3]);Game.last.pool='prestige';Game.last.parents=['Cat ladies'];
		
		new Game.Upgrade('Aura gloves',loc("Cursor levels boost clicks by <b>%1%</b> each (up to cursor level %2).",[5,10])+'<q>Try not to high-five anyone wearing these. You don\'t want that mess on your hands.</q>',555555555,[32,4]);Game.last.pool='prestige';Game.last.parents=['Halo gloves'];
		new Game.Upgrade('Luminous gloves',loc("<b>%1</b> are now effective up to cursor level %2.",[getUpgradeName("Aura gloves"),20])+'<q>These help power your clicks to absurd levels, but they\'re also quite handy when you want to light up the darkness on your way back from Glove World.</q>',55555555555,[33,4]);Game.last.pool='prestige';Game.last.parents=['Aura gloves'];
		
		order=10020;
		Game.NewUpgradeCookie({name:'Bokkenpootjes',desc:'Consist of 2 meringue halves joined by buttercream and dipped both ways in chocolate. Named after a goat\'s foot that probably stepped in something twice.',icon:[32,8],power:						5,price: getCookiePrice(40)});
		Game.NewUpgradeCookie({name:'Fat rascals',desc:'Almond-smiled Yorkshire cakes with a rich history and an even richer recipe. The more diet-conscious are invited to try the lean version, skinny scallywags.',icon:[33,8],power:						5,price: getCookiePrice(41)});
		Game.NewUpgradeCookie({name:'Ischler cookies',desc:'Originating in the Austro-Hungarian Empire, these have spread throughout every country in eastern Europe and spawned just as many recipes, each claiming to be the original. The basis remains unchanged across all variants: two biscuits sandwiched around chocolate buttercream. Or was it jam?',icon:[32,9],power:						5,price: getCookiePrice(42)});
		Game.NewUpgradeCookie({name:'Matcha cookies',desc:'Green tea and cookies, a matcha made in heaven.',icon:[33,9],power:						5,price: getCookiePrice(42)});
		
		order=10032;
		Game.NewUpgradeCookie({name:'Earl Grey macarons',desc:'Best served hot, make it so!',icon:[32,10],require:'Box of macarons',							power:3,price: 9999999999999999999999999999});
		
		order=10030;
		Game.NewUpgradeCookie({name:'Pokey',desc:'While commonly thought to be named so because it\'s fun to poke your classmates with these, Pokey-brand biscuit sticks actually get their name from their popularity in smoke-free prisons, where they\'re commonly smuggled and traded in lieu of cigarettes.',icon:[33,10],require:'Box of brand biscuits',power:												2,	price:	999999999999999999999999999999999999*5});
		
		order=10000;
		Game.NewUpgradeCookie({name:'Cashew cookies',desc:'Let me tell you about cashews. Cashews are not nuts, but seeds that grow out of curious red or yellow fruits - which can be eaten on their own, or made into drinks. The shell around the nut itself contains a nasty substance that stains and irritates the hands of whoever handles it for too long. But that\'s okay, since now that you\'ve read this you\'ll make sure it doesn\'t get in the cookies! Oh, you\'ve already eaten how many? Okay then.',icon:[32,7],power:							2,	price:	99999999});
		order=10001;
		Game.NewUpgradeCookie({name:'Milk chocolate cookies',desc:'A strange inversion of chocolate milk. For those who are a little bit too hardcore for white chocolate, but not hardcore enough for dark.',icon:[33,7],power:2,	price:	99999999*5});
		
		
		
		order=255;
		Game.GrandmaSynergy('Brainy grandmas','A clever grandma to think up some cookies.','Cortex baker');
		
		order=1600;
		Game.TieredUpgrade('Principled neural shackles','<q>A discriminatory, low-order neural net acting as a filter limiting what your cortex bakers can think and do. Really something you want to apply before they achieve full megasentience and realize they\'ve got better things to do than materializing pastries for you, trust me.</q>','Cortex baker',1);
		Game.TieredUpgrade('Obey','<q>Perfect mind control means perfect employee attendance and performance. Optimal mood stabilization is a nice side-effect.<br>Happy happy everyone happy.<br>Happy.</q>','Cortex baker',2);
		Game.TieredUpgrade('A sprinkle of irrationality','<q>Your cortex bakers sometimes get bogged down by circular reasoning and stale ideas. A touch of chaos is just what they need to get back on track.</q>','Cortex baker',3);
		Game.TieredUpgrade('Front and back hemispheres','<q>I mean, otherwise it\'s just unused space, yeah?</q>','Cortex baker',4);
		Game.TieredUpgrade('Neural networking','<q>The effectiveness of your cortex bakers shoots up exponentially if you allow them to connect with each other. In practice this takes the form of many cosmic-sized nerds mumbling awkwardly about tech start-up ideas to each other.</q>','Cortex baker',5);
		Game.TieredUpgrade('Cosmic brainstorms','<q>The wrinkled surfaces of your cortex bakers emit weather-scale ionic flares with every thought coursing through them. These pulses of pure intellectual energy are sent rippling through space, occasionally echoing back with even deeper philosophical complexity.</q>','Cortex baker',6);
		Game.TieredUpgrade('Megatherapy','<q>A giant brain can feel unwell just like you and me sometimes, and it\'s the job of specialized engineers to locate and repair these bugs. We\'ll admit most of the budget in this was spent on constructing extremely large chaises longues for the brains to recline on.</q>','Cortex baker',7);
		Game.TieredUpgrade('Synaptic lubricant','<q>A mind is only as fast as the axons that support it. Get those action potentials flowing smooth as silk with this 3 parts myelin/1 part canola oil spreadable paste. Also great on toast.</q>','Cortex baker',8);
		Game.TieredUpgrade('Psychokinesis','<q>While your giant cortex bakers come equipped with ESP, they\'ve only recently figured out how to manipulate the physical world with their thoughts - though for safety reasons, your legal team had them promise to only use these powers to scratch the itches in their cortical folds.</q>','Cortex baker',9);
		Game.TieredUpgrade('Spines','<q>Your cortex bakers are now equipped with tentacular spine-like structures, which they can use like prehensile tails to pour themselves enormous cups of coffee or propel themselves around like very large, very smart, very slow tadpoles.</q>','Cortex baker',10);
		Game.TieredUpgrade('Neuraforming','<q>By virtue of being planet-sized, your cortex bakers often boast their own atmospheres and seas of cerebrospinal fluid, and given enough time, their own ecosystems. This incredible new branch of life, evolved entirely out of neural material, can be put to good use as home-grown accountants and low-ranking technicians.</q>','Cortex baker',11);
		Game.TieredUpgrade('Epistemological trickery','<q>Redefining what is -or isn\'t- a cookie through the power of philosophical discourse may result in some strange and wonderful things for your profit margins.</q>','Cortex baker',12);
		Game.TieredUpgrade('Every possible idea','<q>Congratulations, your cortex bakers have exerted enough intellectual computation to permute through every single idea that can or ever will be conceived of. Any thought beyond this point is merely rediscovering a notion you\'ve already archived. Hardly cause for cerebration.</q>','Cortex baker',13);
		
		
		order=200;Game.TieredUpgrade('Kitchen cabinets','<q>A grandma\'s kitchen cabinet is a befuddling place. Through lesser-studied aggregating instincts, grandmas will tend to gradually fill all nearby cabinets with various sorts of things, such as curious coconut snacks or dietetic powders. By contract, these are legally yours, which opens up exciting opportunities for your substance investigation department.</q>','Grandma',14);
		order=300;Game.TieredUpgrade('Cookie mulch','<q>Grinding surplus cookies into paste that you then spread onto your fields enables a strange feedback loop in the quality of your cookie crops. Cookie feeding on cookie should be an abomination, but then why does it taste so good?</q>','Farm',14);
		order=400;Game.TieredUpgrade('Delicious mineralogy','<q>Stratum after stratum, you\'ve extracted strange new minerals heretofore unknown to geology. Ushering a new era of materials research, your scientists have been able to identify every new element your mines have discovered, including whatever those things are in the upgrade tier names.</q>','Mine',14);
		order=500;Game.TieredUpgrade('N-dimensional assembly lines','<q>Lines are depressingly 1-dimensional. Beyond assembly lines, we posit the existence of higher-order assembly entities, such as assembly squares, assembly cubes - perhaps even assembly tesseracts. Any deeper than that and we doubt we\'ll be able to write manuals your workers can read.</q>','Factory',14);
		order=525;Game.TieredUpgrade('Cookie Points','<q>A loyalty program wherein each purchase of your cookies comes with free Cookie Points, which can in turn be redeemed for more cookies, thus creating the self-sustaining economy you\'ve been looking for.</q>','Bank',14);
		order=550;Game.TieredUpgrade('Negatheism','<q>Polytheism is a belief in multiple deities; monotheism in just one. Atheism is a belief in no deity whatsoever. Through logical succession it follows that this remains true when going into negative numbers, with belief systems involving minus 1 or more deities displaying unprecedented theological properties.</q>','Temple',14);
		order=575;Game.TieredUpgrade('Magical realism','<q>More a social than thaumaturgical progress, magical realism refers to the normalization of modern technology among magic-users. It\'s totally fine for a wizard to drive a car! There\'s no stigma in waiting in line for coffee! Sure, take a phone call, send an email, whatever!</q>','Wizard tower',14);
		order=600;Game.TieredUpgrade('Cosmic foreground radiation','<q>Ah, this is a problem.</q>','Shipment',14);
		order=700;Game.TieredUpgrade('Arcanized glassware','<q>You think your lab equipment enjoys taking part in these experiments violating all sorts of modern scientific precepts? Of course not. Thankfully, you\'ve finalized the design of specialized beakers and flasks, recycled from the same glass used by the ancients to perform primeval alchemy, and therefore much less picky about the nature of the physical world.</q>','Alchemy lab',14);
		order=800;Game.TieredUpgrade('Portal guns','<q>At long last! The only weapon capable of killing a portal.</q>','Portal',14);
		order=900;Game.TieredUpgrade('Timeproof upholstery','<q>Sometimes your time agents overshoot and end up having to fast-forward through the universe\'s entire history until they loop back to present time. It still takes a while, so they might as well travel in comfort and enjoy the show while they do.</q>','Time machine',14);
		order=1000;Game.TieredUpgrade('Employee minification','<q>Using molecular shrinking technology, you\'ve rendered your staff and their offices absolutely itty-bitty. The storage and productivity benefits are questionable but it\'s very fun listening to their tiny little complaints. They all signed the waivers, so maybe their new size will finally teach them to read the small print...</q>','Antimatter condenser',14);
		order=1100;Game.TieredUpgrade('Hyperblack paint','<q>As the technology behind your prisms evolves, their storage becomes more and more problematic: within seconds, a single prism\'s reflective ability can set a whole underground hangar ablaze as it catches the slightest glint of light. However, once coated with this new shade of paint, its damage may be reduced to only giving third-degree burns to employees that stand too close.</q>','Prism',14);
		order=1200;Game.TieredUpgrade('Silver lining maximization','<q>Sometimes luck is a matter of perspective. Broke your ankle? What do you know, that cute nurse fixing you up might just be your future spouse. Lost your job? You were meant for greater things anyway! Developed a cookie allergy? There\'s no upshot to that, you sick monster.</q>','Chancemaker',14);
		order=1300;Game.TieredUpgrade('Multiscale profiling','<q>Did you know that eating a cookie means the intestinal flora inside you is eating it too? Trillions of tiny bacterial mouths to feed, each with their own preferences. Surely this is room for flavor optimization. And then, of course, there\'s also the much bigger things that, in turn, eat you.</q>','Fractal engine',14);
		order=1400;Game.TieredUpgrade('PHP containment vats','<q>In essence, these are large server chambers meant to trap rogue PHP code, allowing it to execute far away from your javascript where it can do minimal harm.</q>','Javascript console',14);
		order=1500;Game.TieredUpgrade('Opposite universe','<q>You\'ve located a universe where everything is reversed: up is down, light is darkness, clowns are vegetarians - but worst of all, some lunatic there is manufacturing abominable amounts of anti-cookies. If these came into contact with yours, everything would be lost! Thanks to this discovery, you\'ve been able to place the offending universe in permanent quarantine, and pray that there aren\'t more like it hiding around somewhere.</q>','Idleverse',14);
		order=1600;Game.TieredUpgrade('The land of dreams','<q>Your planet brains have gained the ability to sleep, acting as a soft reboot which helps keep their pangenocidal impulses in check. It also allows them to commune in a shared dreamworld in which they can imagine what it\'s like to not exist as a disembodied cosmic horror forever fated to use its infinite intellect to devise new means of creating biscuits. You know, within reason.</q>','Cortex baker',14);
		
		
		order=5000;
		Game.SynergyUpgrade('Thoughts & prayers','<q>The notion of sacredness arises in most sentient evolved brains and may benefit the development of cognition via abstract thought. This mechanism, however, is absent in designed minds such as your cortex bakers; this process attempts to add it back. Just make sure to keep them in check - you really don\'t want these things to develop organized religion.</q>','Cortex baker','Temple','synergy1');
		Game.SynergyUpgrade('Fertile minds','<q>An acute intellect, artificial or not, requires plenty of vitamins. You fortuitously happen to be in charge of vast farming operations, only a few trillion acres of which need be requisitioned to grow the quantities of broccoli and kale to keep your planet-sized brains in tip-top shape. Open wide, here comes the airplane!</q>','Cortex baker','Farm','synergy2');
		
		order=19000;
		Game.TieredUpgrade('Fortune #019','<q>The smartest way to think is not to think at all.</q>','Cortex baker','fortune');
		
		order=100;new Game.Upgrade('Decillion fingers',getStrThousandFingersGain(20)+'<q>If you still can\'t quite put your finger on it, you must not be trying very hard.</q>',10000000000000000000000000000,[12,34]);Game.MakeTiered(Game.last,14,0);
		order=150;new Game.Upgrade('Aetherice mouse',getStrClickingGains(1)+'<q>Made from a substance impossible to manufacture, only obtained through natural happenstance; its properties bewilder even the most precise measuring instruments.</q>',5000000000000000000000000000000,[11,34]);Game.MakeTiered(Game.last,14,11);
		
		order=20000;
		new Game.Upgrade('Kitten admins',strKittenDesc+'<q>leadership ain\'t easy, sir</q>',900000000000000000000000000000000000000000000000,Game.GetIcon('Kitten',14));Game.last.kitten=1;Game.MakeTiered(Game.last,14,18);
		
		order=10300;
		Game.NewUpgradeCookie({name:'Everybutter biscuit',desc:'Rewarded for owning 650 of everything.<br>This biscuit is baked with, and coated in, every kind of butter ever imagined, from every human culture and a good few alien ones too. Some of them perhaps display hallucinogenic traits, as the biscuit seems to change shape in front of you - seemingly shifting between visions of every past and future you.',icon:[22,34],power:	10,price: 999999999999999999999999999999999999999999999999999999*butterBiscuitMult,locked:1});
		
		Game.NewUnshackleBuilding=function(obj: any)
		{
			var building=Game.Objects[obj.building];
			var upgrade=new Game.Upgrade('Unshackled '+building.bplural,(obj.building=='Cursor'?getStrThousandFingersGain(25):loc("Tiered upgrades for <b>%1</b> provide an extra <b>+%2%</b> production.<br>Only works with unshackled upgrade tiers.",[cap(building.plural),Math.round((building.id==1?0.5:(20-building.id)*0.1)*100)]))+(EN?'<q>'+obj.q+'</q>':''),Math.pow(building.id+1,7)*15000000,[building.iconColumn,35]);
			upgrade.pool='prestige';
			upgrade.parents=[obj.building=='Cursor'?'Unshackled flavor':Game.ObjectsById[building.id-1].unshackleUpgrade];
			building.unshackleUpgrade=upgrade.name;
			upgrade.posX=750-Math.sin((building.id+1)*0.25+2.3)*500;
			upgrade.posY=200+Math.cos((building.id+1)*0.25+2.3)*500;
			return upgrade;
		}
		
		//"Unshackled [building name]"
		Game.NewUnshackleBuilding({building:'Cursor',q:'These hands tell a story.'});
		Game.NewUnshackleBuilding({building:'Grandma',q:'Never too old.'});
		Game.NewUnshackleBuilding({building:'Farm',q:'Till the universe.'});
		Game.NewUnshackleBuilding({building:'Mine',q:'Redefine the meaning of "depth".'});
		Game.NewUnshackleBuilding({building:'Factory',q:'Nothing to lose but your production chains.'});
		Game.NewUnshackleBuilding({building:'Bank',q:'All-time highs, all the time.'});
		Game.NewUnshackleBuilding({building:'Temple',q:'You can make a religion out of this.'});
		Game.NewUnshackleBuilding({building:'Wizard tower',q:'There\'s a spell for everything.'});
		Game.NewUnshackleBuilding({building:'Shipment',q:'Everywhere at once.'});
		Game.NewUnshackleBuilding({building:'Alchemy lab',q:'Anything you see, you can make.'});
		Game.NewUnshackleBuilding({building:'Portal',q:'Parallels unparalleled.'});
		Game.NewUnshackleBuilding({building:'Time machine',q:'All the time in the world.'});
		Game.NewUnshackleBuilding({building:'Antimatter condenser',q:'No scale too large or too little.'});
		Game.NewUnshackleBuilding({building:'Prism',q:'Brilliance has no upper limit.'});
		Game.NewUnshackleBuilding({building:'Chancemaker',q:'You make the rules.'});
		Game.NewUnshackleBuilding({building:'Fractal engine',q:'Uncontained.'});
		Game.NewUnshackleBuilding({building:'Javascript console',q:'Rewrite your reality.'});
		Game.NewUnshackleBuilding({building:'Idleverse',q:'Wait even faster.'});
		Game.NewUnshackleBuilding({building:'Cortex baker',q:'Nothing is real. Everything is permitted.'});
		
		Game.NewUnshackleUpgradeTier=function(obj: any)
		{
			var tier=Game.Tiers[obj.tier];
			var upgrade=new Game.Upgrade(obj.tier==1?'Unshackled flavor':'Unshackled '+tier.name.toLowerCase(),loc("Unshackles all <b>%1-tier upgrades</b>, making them more powerful.<br>Only applies to unshackled buildings.",cap(loc("[Tier]"+tier.name,0,tier.name)))+(EN?'<q>'+obj.q+'</q>':''),Math.pow(obj.tier,7.5)*10000000,[10,tier.iconRow]);
			upgrade.pool='prestige';
			upgrade.parents=[obj.tier==1?'Label printer':Game.Tiers[obj.tier-1].unshackleUpgrade];
			tier.unshackleUpgrade=upgrade.name;
			upgrade.posX=750-Math.sin(obj.tier*0.3+2.3)*400;
			upgrade.posY=200+Math.cos(obj.tier*0.3+2.3)*400;
			/*upgrade.parents=[obj.tier==1?'Label printer':Game.Tiers[obj.tier-1].unshackleUpgrade];
			tier.unshackleUpgrade=upgrade.name;
			upgrade.posX=-900+Math.sin(obj.tier*0.3+2.3)*300;
			upgrade.posY=-130+Math.cos(obj.tier*0.3+2.3)*400;*/
			return upgrade;
		}
		
		//"Unshackled [tier name]"
		Game.NewUnshackleUpgradeTier({tier:1,q:'While the absence of flavoring may seem underwhelming, it allows innate aromas to be expressed at their most unadulterated.'});
		Game.NewUnshackleUpgradeTier({tier:2,q:'Berrylium is a synthetic gem with a simple shine to it. Sticky to the touch and susceptible to melting in high heat, it is frequently used in the food industry rather than as adornment, as its atomic structure imparts it a vaguely fruity flavor.'});
		Game.NewUnshackleUpgradeTier({tier:3,q:'Blueberrylium is a refinement of berrylium, sharing nearly the same chemical makeup save for a few supplemental esters. These affect its flavor as well as its visual spectrum resonance.'});
		Game.NewUnshackleUpgradeTier({tier:4,q:'Raw chalcedhoney is found in complex nodules within the fossilized remains of ancient forests. Once purified, it becomes a semi-valuable stone with a pleasant, waxy smell.'});
		Game.NewUnshackleUpgradeTier({tier:5,q:'Buttergold was famously invented by the chef son of two molecular physicists. Neither closely related to butter nor to gold, yet similar in nutritional value, this glimmering substance can be frozen and preserve its hardness at room temperature, only regaining its malleability when heated up.'});
		Game.NewUnshackleUpgradeTier({tier:6,q:'Sugarmuck refers to the gradual crust that seems to form spontaneously in the vicinity of candy-making equipment. Long ignored by confectioners, its harvesting process was discovered simultaneously in multiple countries during a global beet shortage.'});
		Game.NewUnshackleUpgradeTier({tier:7,q:'The striking taste of jetmint made it popular in the manufacture of various kinds of coffee-side treats until the awareness of its mild radioactivity became widespread. Today, its main uses are in cosmetics, owing to the refreshing sensation it produces on contact.'});
		Game.NewUnshackleUpgradeTier({tier:8,q:'Cherrysilver is a patented alloy with peculiar aromatic properties; it is non-edible, but produces strong flavor responses while losing very little of its mass when licked, though this also leaves a harmless red tinge upon the tongue.'});
		Game.NewUnshackleUpgradeTier({tier:9,q:'Hazelrald is a friable gemstone with complex green-brown inner reflections. It is considered ornamental in some cultures; in others, it may be consumed in small quantities as an upper-scale sweet.'});
		Game.NewUnshackleUpgradeTier({tier:10,q:'While many get it mixed up with the trademarked snack of the same name made popular following its discovery, mooncandy is a very real mineral, first isolated within the space dust underneath astronaut boots. Left to its own devices in open air, a mooncandy crystal naturally spreads out and grows.'});
		Game.NewUnshackleUpgradeTier({tier:11,q:'When you heat up the shimmering syrup oozing from mooncandy using a special caramelization process, you get astrofudge. Astrofudge is delicious and safe for humanoid consumption in certain quantities. Consult your local food safety agency for more details.'});
		Game.NewUnshackleUpgradeTier({tier:12,q:'Molecularly related to dairy, alabascream occurs naturally at high altitudes, forming in wispy filaments which were long indistinguishable from clouds. An expensive delight, it is also known as "pilots\' bane".'});
		Game.NewUnshackleUpgradeTier({tier:13,q:'Iridyum shares little in common with any other material known to mankind. Rather than simply smelled, it can be tasted from a distance, though remaining in its presence too long is ill-advised. Some high-end underground megacomputers may incorporate iridyum as part of their electronic components.'});
		Game.NewUnshackleUpgradeTier({tier:14,q:'Glucosmium is a glossy metal whose flavor matrix is bound to its current subjective chroma; in other words, its taste depends on which colors it\'s currently reflecting. Impractical to consume safely, its industrial applications range from transcontinental ballistics to paint varnish.'});
		
		new Game.Upgrade('Delicate touch',loc("The <b>shimmering veil</b> is more resistant, and has a <b>%1% chance</b> not to break. It also gives <b>+%2%</b> more CpS.",[10,5])+'<q>It breaks so easily.</q>',9999999999*15,[23,34]);Game.last.pool='prestige';Game.last.parents=['Reinforced membrane'];
		new Game.Upgrade('Steadfast murmur',loc("The <b>shimmering veil</b> is more resistant, and has a <b>%1% chance</b> not to break. It also gives <b>+%2%</b> more CpS.",[10,5])+'<q>Lend an ear and listen.</q>',999999999999*15,[23,34]);Game.last.pool='prestige';Game.last.parents=['Delicate touch'];
		new Game.Upgrade('Glittering edge',loc("The <b>shimmering veil</b> is more resistant, and has a <b>%1% chance</b> not to break. It also gives <b>+%2%</b> more CpS.",[10,5])+'<q>Just within reach, yet at what cost?</q>',99999999999999*15,[23,34]);Game.last.pool='prestige';Game.last.parents=['Steadfast murmur'];
		
		new Game.Upgrade('Distinguished wallpaper assortment',(EN?loc("Contains more wallpapers for your background selector."):'')+'<q>Do you ever think about the physicality of this place? Are you putting up these wallpapers in your office or something? Where are you, anyway?</q>',10000000,[27,5]);Game.last.pool='prestige';Game.last.parents=['Basic wallpaper assortment'];
		
		
		new Game.Upgrade('Sound test',loc("Unlocks the <b>jukebox</b>, which allows you to play through every sound file in the game.")+'<q>One two, one two. Is this thing on?</q>',99999999999,[31,12]);Game.last.pool='prestige';Game.last.parents=['Fanciful dairy selection','Distinguished wallpaper assortment','Golden cookie alert sound'];
		
		order=49900;
		new Game.Upgrade('Jukebox',loc("Play through the game's sound files!"),0,[31,12]);
		Game.last.pool='toggle';
		Game.jukebox={				sounds:[
					'tick',
					'tickOff',
					'confirm1','back1','error1',//CC3 interface tones (interface-sfx-pack-1, CC0)
					'smallTick',
				'toneTick',
				'clickOn','clickOn2',
				'clickOff','clickOff2',
				'pop1','pop2','pop3',
				'press',
				//'switch',
				'buy1','buy2','buy3','buy4',
				'sell1','sell2','sell3','sell4',
				'buyHeavenly',
				'click1','click2','click3','click4','click5','click6','click7',
				'clickb1','clickb2','clickb3','clickb4','clickb5','clickb6','clickb7',
				'charging',
				'thud',
				//'cookieBreak',
				'cymbalRev',
				//'cymbalCrash',
				'smallCymbalCrash',
				'choir',
				'chime',
				'shimmerClick',
				'jingle',
				'jingleClick',
				'fortune',
				'till1','till2','till3','tillb1','tillb2','tillb3',
				'harvest1','harvest2','harvest3',
				'freezeGarden',
				'growl',
				'snarl',
				'page',
				'swooshIn',
				'swooshOut',
				'spell',
				'spellFail',
				'spirit',
				'squish1','squish2','squish3','squish4',
				'squeak1','squeak2','squeak3','squeak4',
				'cashIn','cashIn2',
				'cashOut',
				'upgrade',
				//'levelPrestige',
			],
			tracks:[],//populated externally
			onSound:0,
			onTrack:0,
			trackLooped:true,
			trackAuto:true,
			trackShuffle:false,
			reset:function(){
				var me=Game.jukebox;
				me.onSound=0;
				me.onTrack=0;
				me.trackLooped=true;
				me.trackAuto=true;
				me.trackShuffle=false;
			},
			setSound:function(id: any){
				if (id>=Game.jukebox.sounds.length) id=0;
				else if (id<0) id=Game.jukebox.sounds.length-1;
				Game.jukebox.onSound=id;
				if (l('jukeboxOnSound'))
				{
					triggerAnim(l('jukeboxPlayer'),'pucker');
					l('jukeboxOnSound').innerHTML='&bull; '+Game.jukebox.sounds[Game.jukebox.onSound]+' &bull;';
					l('jukeboxOnSoundN').innerHTML=(Game.jukebox.onSound+1)+'/'+(Game.jukebox.sounds.length);
					l('jukeboxSoundSelect').value=Game.jukebox.onSound;
				}
				PlaySound('snd/'+Game.jukebox.sounds[Game.jukebox.onSound]+'.mp3',1);
			},
			setTrack:function(id: any,dontPlay: any){
				if (id>=Game.jukebox.tracks.length) id=0;
				else if (id<0) id=Game.jukebox.tracks.length-1;
				Game.jukebox.onTrack=id;
				var data=Music.tracks[Game.jukebox.tracks[Game.jukebox.onTrack]].audio;
				if (l('jukeboxOnTrack'))
				{
					triggerAnim(l('jukeboxPlayer'),'pucker');
					l('jukeboxOnTrack').innerHTML='&bull; '+cap(Game.jukebox.tracks[Game.jukebox.onTrack])+' &bull;';
					l('jukeboxOnTrackAuthor').innerHTML=Music.tracks[Game.jukebox.tracks[Game.jukebox.onTrack]].author;
					l('jukeboxTrackSelect').value=Game.jukebox.onTrack;
					if (data)
					{
						var dur=data.duration+1;
						l('jukeboxMusicTotalTime').innerHTML=Math.floor(dur/60)+':'+(Math.floor(dur%60)<10?'0':'')+Math.floor(dur%60);
					}
					
					if (!dontPlay && Music) {Game.jukebox.trackAuto=false;l('jukeboxMusicAuto').classList.add('off');Music.playTrack(Game.jukebox.tracks[Game.jukebox.onTrack]);Music.setFilter(1);Music.loop(Game.jukebox.trackLooped);}
					if (data.paused) l('jukeboxMusicPlay').innerHTML=loc("Play");
					else l('jukeboxMusicPlay').innerHTML=loc("Stop");
					Game.jukebox.updateMusicCurrentTime();
				}
			},
			pressPlayMusic:function(){
				if (!Music) return false;
				var data=Music.tracks[Game.jukebox.tracks[Game.jukebox.onTrack]].audio;
				if (!data.paused) {Music.pause();l('jukeboxMusicPlay').innerHTML=loc("Play");}
				else {Music.unpause();l('jukeboxMusicPlay').innerHTML=loc("Stop");}
				Game.jukebox.updateMusicCurrentTime();
			},
			pressLoopMusic:function(){
				Game.jukebox.trackLooped=!Game.jukebox.trackLooped;
				if (!Music) return false;
				if (Game.jukebox.trackLooped) {Music.loop(true);l('jukeboxMusicLoop').classList.remove('off');}
				else {Music.loop(false);l('jukeboxMusicLoop').classList.add('off');}
			},
			pressMusicAuto:function(){
				Game.jukebox.trackAuto=!Game.jukebox.trackAuto;
				if (!Music) return false;
				if (Game.jukebox.trackAuto) {Music.cue('play');l('jukeboxMusicAuto').classList.remove('off');}
				else {/*Game.jukebox.setTrack(Game.jukebox.onTrack);*/l('jukeboxMusicAuto').classList.add('off');}
			},
			pressMusicShuffle:function(){
				Game.jukebox.trackShuffle=!Game.jukebox.trackShuffle;
			},
			updateMusicCurrentTime:function(noLoop: any){
				if (!l('jukeboxMusicTime')) return false;
				var data=Music.tracks[Game.jukebox.tracks[Game.jukebox.onTrack]].audio;
				l('jukeboxMusicPlay').innerHTML=data.paused?loc("Play"):loc("Pause");
				l('jukeboxMusicTime').innerHTML=Math.floor(data.currentTime/60)+':'+(Math.floor(data.currentTime%60)<10?'0':'')+Math.floor(data.currentTime%60);
				l('jukeboxMusicScrub').value=(data.currentTime/data.duration)*1000;
				l('jukeboxMusicScrubElapsed').style.width=Math.max(0,(data.currentTime/data.duration)*288-4)+'px';
				if (!noLoop) setTimeout(Game.jukebox.updateMusicCurrentTime,1000/2);
			},
			musicScrub:function(time: any){
				var data=Music.tracks[Game.jukebox.tracks[Game.jukebox.onTrack]].audio;
				data.currentTime=(time/1000)*(data.duration);
				Game.jukebox.updateMusicCurrentTime();
			},
		};
		if (Music) {for (var ix in Music.tracks){Game.jukebox.tracks.push(Music.tracks[ix].name);}}
		
		Game.last.choicesFunction=function()
		{
			var str='';
			str+='<div class="usesIcon" style="margin:auto;width:48px;height:48px;background-position:'+(-31*48)+'px '+(-12*48)+'px;" id="jukeboxPlayer"></div>';
			str+='<div style="font-size:11px;opacity:0.7;margin-bottom:-4px;" id="jukeboxOnSoundN">'+(Game.jukebox.onSound+1)+'/'+(Game.jukebox.sounds.length)+'</div>';
			str+='<div class="fancyText" style="font-variant:normal;letter-spacing:2px;padding:8px;font-size:18px;" id="jukeboxOnSound">&bull; '+Game.jukebox.sounds[Game.jukebox.onSound]+' &bull;</div>';
			str+='<div style="position:relative;width:100%;text-align:center;">'
				+'<a class="option fancyText" onclick="Game.jukebox.setSound(Game.jukebox.onSound-1);">&#xab;</a>'
				+'<a class="option fancyText" onclick="Game.jukebox.setSound(Game.jukebox.onSound);">'+loc("Play")+'</a>'
				+'<a class="option fancyText" onclick="Game.jukebox.setSound(Game.jukebox.onSound+1);">&#xbb;</a>'
			+'</div>';
			str+='<select id="jukeboxSoundSelect" onchange="Game.jukebox.setSound(parseInt(this.value));">';
			for (var i=0;i<Game.jukebox.sounds.length;i++)
			{
				str+='<option value="'+i+'"'+(i==Game.jukebox.onSound?' selected="true"':'')+'>'+Game.jukebox.sounds[i]+'</option>';
			}
			str+='</select><a class="option" onclick="Game.jukebox.setSound(Math.floor(Math.random()*Game.jukebox.sounds.length));">'+loc("Random")+'</a>';
			if (Music)//CC3: relaxed from `if (App)` — the track section now works in the browser (systems/music.ts)
			{
				var data=Music.tracks[Game.jukebox.tracks[Game.jukebox.onTrack]].audio;
				var dur=data?data.duration+1:0;
				str+='<div class="line"></div>';
				str+='<div class="fancyText" style="font-style:italic;letter-spacing:2px;padding:8px;font-size:18px;" id="jukeboxOnTrack">&bull; '+cap(Game.jukebox.tracks[Game.jukebox.onTrack])+' &bull;</div>';
				str+='<div id="jukeboxOnTrackAuthor" style="font-size:11px;opacity:0.7;margin-top:-4px;">'+Music.tracks[Game.jukebox.tracks[Game.jukebox.onTrack]].author+'</div>';
				str+='<div style="margin:4px 0px;font-size:11px;">'
					+'<span id="jukeboxMusicTime">'+(data?Math.floor(data.currentTime/60)+':'+(Math.floor(data.currentTime%60)<10?'0':'')+Math.floor(data.currentTime%60):'')+'</span> | '
					+'<a class="option fancyText" id="jukeboxMusicPlay" onclick="Game.jukebox.pressPlayMusic();">'+((data && data.paused)?loc("Play"):loc("Pause"))+'</a>'
					+'<a class="option fancyText prefButton'+(Game.jukebox.trackLooped?'':' off')+'" id="jukeboxMusicLoop" onclick="Game.jukebox.pressLoopMusic();">'+loc("Loop")+'</a>'
					+'| <span id="jukeboxMusicTotalTime">'+(data?Math.floor(dur/60)+':'+(Math.floor(dur%60)<10?'0':'')+Math.floor(dur%60):'')+'</span>'
					+'</div>'
				;
				str+='<div style="position:relative;"><input class="slider" style="clear:both;" type="range" min="0" max="1000" step="1" value="'+(data?(data.currentTime/data.duration)*1000:0)+'" onchange="Game.jukebox.musicScrub(this.value);" oninput="Game.jukebox.musicScrub(this.value);" id="jukeboxMusicScrub"/><div id="jukeboxMusicScrubElapsed" style="position:absolute;left:3px;top:3px;height:6px;width:0px;background:#ccc;box-shadow:1px 1px 1px #555 inset,0px -1px 0px #fff inset;border-radius:2px;z-index:10;pointer-events:none;"></div></div>';
				
				str+='<a class="option fancyText prefButton'+(Game.jukebox.trackAuto?'':' off')+'" onclick="Game.jukebox.pressMusicAuto();" id="jukeboxMusicAuto">'+loc("Auto")+'</a><select id="jukeboxTrackSelect" onchange="Game.jukebox.setTrack(parseInt(this.value));">';
				for (var i=0;i<Game.jukebox.tracks.length;i++)
				{
					str+='<option value="'+i+'"'+(i==Game.jukebox.onTrack?' selected="true"':'')+'>'+Game.jukebox.tracks[i]+'</option>';
				}
				str+='</select><!--<a class="option fancyText prefButton'+(Game.jukebox.trackAuto?'':' off')+'" onclick="Game.jukebox.pressMusicShuffle();">'+loc("Shuffle")+'</a>-->';
				
				setTimeout(Game.jukebox.updateMusicCurrentTime,500);
			}
			return str;
		}
		
		order=10020;
		Game.NewUpgradeCookie({name:'Dalgona cookies',desc:'A popular Korean candy-like treat. One of the twisted games people play with these is to carefully extract the shape in the middle, which may entitle one to another free dalgona. Skilled players may perform this over and over until bankrupting the snack vendor.',icon:[26,34],power:						5,price: getCookiePrice(43)});
		Game.NewUpgradeCookie({name:'Spicy cookies',desc:'Containing chocolate chips prepared with hot peppers, just like the Aztecs used to make. These cookies are on the angry side.',icon:[27,34],power:						5,price: getCookiePrice(44)});
		Game.NewUpgradeCookie({name:'Smile cookies',desc:'As eyes are the windows to the soul, so too are these cookies\' facial features a gaping opening unto their chocolatey innards. Is it happiness they feel? Or something less human?',icon:[28,34],power:						5,price: getCookiePrice(45)});
		Game.NewUpgradeCookie({name:'Kolachy cookies',desc:'Adapted from a type of Central European pastry; neatly folded to hold a spoonful of delicious jam, as a bashful little gift for your mouth.',icon:[29,34],power:						5,price: getCookiePrice(46)});
		Game.NewUpgradeCookie({name:'Gomma cookies',desc:'Surinamese cornflour cookies with sprinkles on top. The usage of corn imparts them a hint of chewy pizzazz - which you wouldn\'t get with wheat, a famously stuck-up grain.',icon:[30,34],power:						5,price: getCookiePrice(47)});
		Game.NewUpgradeCookie({name:'Vegan cookies',desc:'A vegan riff on the classic chocolate chip cookie recipe with a couple substitutions: the butter is now coconut oil, the eggs are cornstarch, and the suckling pig was cleverly replaced with wheat gluten. You can hardly tell.',icon:[24,35],power:						5,price: getCookiePrice(48)});
		Game.NewUpgradeCookie({name:'Coyotas',desc:'A wide, delicious cookie from Mexico, usually filled with sticky brown sugar. Not to be confused with coyotas, the result of the crossbreeding between a North American canine and a Japanese car manufacturer.',icon:[21,35],power:						5,price: getCookiePrice(49)});
		Game.NewUpgradeCookie({name:'Frosted sugar cookies',desc:'May be more style than substance, depending on the recipe. Nothing that hides itself under this much frosting should be trusted.',icon:[22,35],power:						5,price: getCookiePrice(50)});
		Game.NewUpgradeCookie({name:'Marshmallow sandwich cookies',desc:'S\'mores\' more civilized cousins: two regular chocolate chip cookies joined by a gooey, melty marshmallow. Theoretically one could assemble all kinds of other things this way. The mind races.',icon:[31,34],power:						5,price: getCookiePrice(51)});
		
		Game.NewUpgradeCookie({name:'Web cookies',desc:'The original recipe; named for the delicate pattern inscribed on their surface by the baking process. Eating these can tell a lot about someone. Invented by well-connected bakers, no doubt.'+(App?'<br>Only of any use in Cookie Clicker\'s web version, of course.':''),icon:[25,35],power:						(App?0:5),price: getCookiePrice(52)});if (App) Game.last.pool='debug';
		Game.NewUpgradeCookie({name:'Steamed cookies',desc:'Localized entirely within this gaming platform? Yes! Baked with the power of steam, in a touch of cutting-edge modernity not seen since the industrial revolution.'+(!App?'<br>Only of any use in Cookie Clicker\'s Steam version, of course.':''),icon:[26,35],power:						(App?5:0),price: getCookiePrice(52)});if (!App) Game.last.pool='debug';
		
		order=10050;
		Game.NewUpgradeCookie({name:'Deep-fried cookie dough',desc:'They\'ll fry anything these days. Drizzled in hot chocolate syrup, just like in state fairs. Spikes up your blood sugar AND your cholesterol!',icon:[23,35],require:'Box of maybe cookies',power:						5,price: Math.pow(10,47)});
		
		// CC3 cookie collection: 48 cookie upgrades from eight rows in the
		// six-step families. The first four families improve CpS; the last
		// four add a percentage of CpS to each manual click.
		var newCookieStyles=[
			{name:'Checkerboard',file:'cookie_checkerboard',effect:'cps',flavor:'A sharply patterned cookie for bakers who believe every square should be delicious.'},
			{name:'Crisscross',file:'cookie_crisscross',effect:'cps',flavor:'A woven cookie whose intersecting lines hold an unreasonable amount of flavor.'},
			{name:'Flower',file:'cookie_flower',effect:'cps',flavor:'A cheerful flower-shaped cookie, cultivated in the finest decorative ovens.'},
			{name:'Jam round',file:'cookie_jam_round',effect:'cps',flavor:'A round jam-filled cookie with a center of concentrated sweetness.'},
			{name:'Finger',file:'cookie_finger',effect:'click',flavor:'A slim cookie made for nimble fingers and suspiciously efficient clicking.'},
			{name:'Heart',file:'cookie_heart',effect:'click',flavor:'A heart-shaped cookie baked with enough affection to power another click.'},
			{name:'Round',file:'cookie_round',effect:'click',flavor:'A perfectly ordinary round cookie refined into an extraordinary clicking tool.'},
			{name:'Swirl',file:'cookie_swirl',effect:'click',flavor:'A hypnotically swirled cookie that makes every click feel a little more deliberate.'}
		];
		var newCookieRoman=['I','II','III','IV','V','VI'];
		var newCookieLevel=53;
		order=10020;
		// Interleave the families by tier so each group arrives as a natural
		// progression alongside the other families instead of as one 6-item block.
		for (var variant=0;variant<newCookieRoman.length;variant++)
		{
			for (var styleIndex=0;styleIndex<newCookieStyles.length;styleIndex++)
			{
				var style=newCookieStyles[styleIndex];
				var strength=variant+1;
				var isClick=style.effect=='click';
				var name=style.name+' cookies '+newCookieRoman[variant];
				Game.NewUpgradeCookie({
					name:name,
					desc:style.flavor+' Batch '+newCookieRoman[variant]+' represents a further refinement of the recipe.',
					icon:[variant,styleIndex,'img/cookie-upgrades/cookie_spritesheet.png',32],
					require:variant>0?style.name+' cookies '+newCookieRoman[variant-1]:undefined,
					power:isClick?0:strength,
					clickPower:isClick?strength:0,
					price:getCookiePrice(newCookieLevel++)
				});
			}
		}

		// CC3 Cat upgrade collection: 24 custom Cat-specific upgrades.
		// These do NOT use Game.TieredUpgrade (which doubles building CpS
		// per tier and would make Cats overpowered at their cheap price).
		// Instead each upgrade adds a small additive bonus to Cat CpS,
		// keeping Cats balanced between Grandma and Farm throughout.
		var catUpgradeIcon=function(index: number): any
		{
			return [index%6,Math.floor(index/6),'img/cat-upgrades/protein_spritesheet.png',48];
		};

		// 14 base upgrades: flat additive Cat CpS bonuses.
		// Total effect of all 14: +3 CpS per Cat (4 base -> 7), keeping
		// the early Cat curve below Farm while still rewarding the full line.
		// Unlock thresholds mirror the standard tier amounts: 1/5/25/50/100/150/200/250/300/350/400/450/500/550.
		var catBaseUpgrades=[
			{name:'Cardboard box basics',price:1000,effect:0.2},
			{name:'Sunbeam training',price:2500,effect:0.2},
			{name:'Whisker refinement',price:5000,effect:0.2},
			{name:'Midnight zoomies',price:10000,effect:0.2},
			{name:'Tuna-grade nutrition',price:25000,effect:0.2},
			{name:'Claw-powered kneading',price:50000,effect:0.2},
			{name:'Purrfect production',price:100000,effect:0.2},
			{name:'Nine-lives efficiency',price:250000,effect:0.2},
			{name:'Feline assembly',price:500000,effect:0.2},
			{name:'Astral catnaps',price:1000000,effect:0.2},
			{name:'Infinite yarn loop',price:2500000,effect:0.3},
			{name:'Quantum litter boxes',price:5000000,effect:0.3},
			{name:'Cosmic whisker arrays',price:10000000,effect:0.3},
			{name:'Protein singularity',price:25000000,effect:0.1}
		];
		order=350;
		for (var catBaseIndex=0;catBaseIndex<catBaseUpgrades.length;catBaseIndex++)
		{
			var catBase=catBaseUpgrades[catBaseIndex];
			var catBaseUpgrade=new Game.Upgrade(catBase.name,'Cats gain <b>+'+catBase.effect+' CpS each</b>.'+'<q>Every cat business starts somewhere.</q>',catBase.price,catUpgradeIcon(catBaseIndex));
			catBaseUpgrade.catAdd=catBase.effect;
			// Register as a Cat building tier so it appears greyed out in the store.
			catBaseUpgrade.buildingTie=Game.Objects['Cats'];
			var catTier='cat'+(catBaseIndex+1);
			catBaseUpgrade.tier=catTier;
			Game.Objects['Cats'].tieredUpgrades[catTier]=catBaseUpgrade;
		}

		// 10 specialty upgrades: mild multiplicative and synergy effects.
		// Unlocked by Cat count; effects are intentionally small.
		var catSpecialUpgrades=[
			{name:'Grandma-approved recipes',desc:'Cats gain <b>+0.5% CpS per Grandma</b>, up to +25%.',price:25000,unlock:10},
			{name:'Purrfect timing',desc:'Clicking gains <b>+1% of your CpS</b>.',price:100000,unlock:25},
			{name:'Cat café loyalty',desc:'Cookie production multiplier <b>+1%</b>.',price:100000,unlock:50},
			{name:'Protein-rich kibble',desc:'Cats gain <b>+2% CpS</b>.',price:50000,unlock:75},
			{name:'Feather wand drills',desc:'Cats gain <b>+2% CpS</b>.',price:100000,unlock:100},
			{name:'Sunbeam perches',desc:'Cats gain <b>+2% CpS</b>.',price:250000,unlock:150},
			{name:'Catnip cultivation',desc:'Cats gain <b>+2% CpS</b>.',price:500000,unlock:200},
			{name:'Scratching-post ovens',desc:'Cats gain <b>+2% CpS</b>.',price:1000000,unlock:250},
			{name:'Climbing shelves',desc:'Cats gain <b>+2% CpS</b>.',price:2000000,unlock:350},
			{name:'Nine lives logistics',desc:'Cats gain <b>+2% CpS</b>.',price:5000000,unlock:450}
		];
		for (var catSpecialIndex=0;catSpecialIndex<catSpecialUpgrades.length;catSpecialIndex++)
		{
			var catSpecial=catSpecialUpgrades[catSpecialIndex];
			var catSpecialUpgrade=new Game.Upgrade(catSpecial.name,catSpecial.desc+'<q>More cats, more cookies, fewer explanations.</q>',catSpecial.price,catUpgradeIcon(14+catSpecialIndex));
			catSpecialUpgrade.catUnlock=catSpecial.unlock;
			// Register as a Cat building tier so it appears greyed out in the store.
			catSpecialUpgrade.buildingTie=Game.Objects['Cats'];
			var catSpecTier='catS'+(catSpecialIndex+1);
			catSpecialUpgrade.tier=catSpecTier;
			Game.Objects['Cats'].tieredUpgrades[catSpecTier]=catSpecialUpgrade;
		}

		// CC3: register the 8 cat-synergy upgrades. They are declared at the
		// very end of the upgrade list on purpose: upgrade ids are the
		// registration index and saves store purchased upgrades by id, so
		// inserting them mid-list would shift every later id and break
		// existing saves. (The Game.CatSynergy factory above only defines
		// them; the store display order (order=300, right after the
		// grandma synergies) is independent of registration order.)
		order=300;
		Game.CatSynergy('Kitten grandmas','A nice cat to help the grandmas. It\'s all in the family.','Grandma');
		Game.CatSynergy('Farm cats','A nice cat to keep the mice away from the cookie plants. Mice are a real pest.','Farm');
		Game.CatSynergy('Miner cats','Mine safety officer. The mice appreciate it, even if they can\'t say so.','Mine');
		Game.CatSynergy('Worker cats','Assembly-line cat. Nine lives, one job, zero complaints.','Factory');
		Game.CatSynergy('Space cats','Zero gravity is the perfect nap environment. They\'ve never been cozier.','Shipment');
		Game.CatSynergy('Golden cats','Transmuted from silver. They hiss a little more now, but they pay rent in gold.','Alchemy lab');
		Game.CatSynergy('Altered cats','It went through the portal. It came back a little different. Mostly naps.','Portal');
		Game.CatSynergy('Time cats','Always napping exactly one second into the past, so the cookies are warm when they wake.','Time machine');

		// CC3 Cat Colony minigame rewards: bought with Treats from inside the
		// minigame panel (Game.Upgrades[name].earn()), never through the cookie
		// store — the cookie price here is unused (these are never unlocked via
		// Game.Unlock/UnlockTiered, so the store never offers them) and kept at
		// 0 for clarity. Icons crop frame 0 of the existing cat sprite strips
		// (img/cats/*.png) via the standard [col,row,path,size] icon form — no
		// new art. treatsPrice is a minigame-only field the shop panel reads.
		var catColonyUpgrades=[
			{name:'Cardboard fort training',desc:'Cats gain <b>+0.15 CpS each</b>.',treats:15,catAdd:0.15,icon:'idle'},
			{name:'Sunbeam napping technique',desc:'Cats gain <b>+0.15 CpS each</b>.',treats:35,catAdd:0.15,icon:'walk'},
			{name:'Treat-sniffing whiskers',desc:'Cats gain <b>+2% CpS</b>.',treats:70,icon:'run'},
			{name:'Nine-lives insurance',desc:'Cats gain <b>+0.2 CpS each</b>,<br>and colony expeditions are 30% less likely to send a cat home hurt.',treats:150,catAdd:0.2,icon:'jump'},
			{name:'Golden collar bells',desc:'Cats gain <b>+2% CpS</b>.',treats:300,icon:'running-jump'},
			{name:'Legendary colony charter',desc:'Cats gain <b>+0.5 CpS each</b>.',treats:600,catAdd:0.5,icon:'attack-1'}
		];
		order=356;
		for (var catColonyIndex=0;catColonyIndex<catColonyUpgrades.length;catColonyIndex++)
		{
			var catColony=catColonyUpgrades[catColonyIndex];
			var catColonyUpgrade=new Game.Upgrade(catColony.name,catColony.desc+'<q>Earned by the colony, not bought with cookies.</q>',0,[0,0,'img/cats/'+catColony.icon+'.png',64]);
			if (catColony.catAdd) catColonyUpgrade.catAdd=catColony.catAdd;
			catColonyUpgrade.treatsPrice=catColony.treats;
			catColonyUpgrade.buildingTie=Game.Objects['Cats'];
		}

		// Astral Reliquary: a themed heavenly sub-branch off 'Distilled essence of
		// redoubled luck'. Declared here, after every vanilla Game.Upgrade() call,
		// so these ids land past heavenlyPositions.ts's fixed id->position table
		// (max key 805) instead of shifting it — inserting new upgrades earlier in
		// this file bumps Game.UpgradesN for everything declared after them,
		// which would scramble the whole vanilla ascend-tree layout. Manual
		// posX/posY (not heavenlyPositions.ts) for the same reason ids here
		// aren't stable across content edits — same technique as
		// Game.NewUnshackleBuilding above. Coordinates were probed against a live
		// Game.heavenlyBounds/Game.Upgrades dump to land in open canvas space
		// (min ~100px clearance from every existing prestige-pool node).
		new Game.Upgrade('Astral tribute',loc("Cookie production multiplier <b>+%1% permanently</b>.",5)+'<q>A small toll paid to whatever still listens up there.</q>',300000000,[25,12]);Game.last.pool='prestige';Game.last.parents=['Distilled essence of redoubled luck'];Game.last.power=5;Game.last.pseudoCookie=true;Game.last.posX=-680;Game.last.posY=600;

		new Game.Upgrade('Reliquary embers',loc("Cookie production multiplier <b>+%1% permanently</b>.",5)+'<q>Every ember remembers the fire it came from.</q>',900000000,[26,12]);Game.last.pool='prestige';Game.last.parents=['Astral tribute'];Game.last.power=5;Game.last.pseudoCookie=true;Game.last.posX=-820;Game.last.posY=760;
		new Game.Upgrade('Gilded aftertaste',loc("Golden cookies (and all other things that spawn, such as reindeer) have an additional <b>%1% chance of being doubled</b>.",1)+'<q>Fortune, it turns out, is an acquired taste.</q>',750000000,[27,6]);Game.last.pool='prestige';Game.last.parents=['Astral tribute'];Game.last.posX=-560;Game.last.posY=780;
		new Game.Upgrade('Sepulchral crystallization',loc("Sugar lumps ripen <b>%1</b> sooner.",Game.sayTime(60*60*Game.fps))+'<q>Sweetness, given enough time and pressure, becomes something else entirely.</q>',800000000,[25,15]);Game.last.pool='prestige';Game.last.parents=['Astral tribute'];Game.last.posX=-950;Game.last.posY=560;
		new Game.Upgrade('Ashen ichor',loc("Wrinklers explode into <b>%1% more cookies</b>.",5)+'<q>Even the most patient of parasites can be taught a few new tricks.</q>',700000000,[19,8]);Game.last.pool='prestige';Game.last.parents=['Astral tribute'];Game.last.posX=-680;Game.last.posY=850;

		new Game.Upgrade('Everlasting embers',loc("Cookie production multiplier <b>+%1% permanently</b>.",5)+'<q>This one never quite seems to go out.</q>',2700000000,[25,12]);Game.last.pool='prestige';Game.last.parents=['Reliquary embers'];Game.last.power=5;Game.last.pseudoCookie=true;Game.last.posX=-980;Game.last.posY=920;
		new Game.Upgrade('Prismatic aftertaste',loc("Golden cookie effects last <b>%1% longer</b>.",5)+'<q>The glow lingers a little longer than it should.</q>',2250000000,[28,6]);Game.last.pool='prestige';Game.last.parents=['Gilded aftertaste'];Game.last.posX=-460;Game.last.posY=950;
		new Game.Upgrade('Frozen sepulcher',loc("Sugar lumps mature <b>%1</b> sooner.",Game.sayTime(60*60*Game.fps))+'<q>Preserved not by cold, but by sheer stubbornness.</q>',2400000000,[26,15]);Game.last.pool='prestige';Game.last.parents=['Sepulchral crystallization'];Game.last.posX=-1120;Game.last.posY=700;
		new Game.Upgrade('Bloodless ichor',loc("You can attract <b>%1 more wrinklers</b>.",1)+'<q>Its brethren have taken notice.</q>',2100000000,[15,12]);Game.last.pool='prestige';Game.last.parents=['Ashen ichor'];Game.last.posX=-800;Game.last.posY=1020;

		new Game.Upgrade('Convergence of the reliquary',loc("Cookie production multiplier <b>+%1% permanently</b>.",10)+'<q>Four paths, one hunger.</q>',9000000000,[26,12]);Game.last.pool='prestige';Game.last.parents=['Everlasting embers','Frozen sepulcher','Prismatic aftertaste','Bloodless ichor'];Game.last.power=10;Game.last.pseudoCookie=true;Game.last.posX=-850;Game.last.posY=1150;

		// Nine Lives: a themed heavenly sub-branch off 'Five-finger discount',
		// focused entirely on the Cats building (content/buildings/cats.ts),
		// the cat-synergy bonus (systems/economy.ts's GetTieredCpsMult), and the
		// Cat Colony minigame (minigameCatColony.ts). Declared here at the very
		// end of upgrades.ts, same reasoning as the Astral Reliquary branch
		// above: inserting earlier would shift every subsequent vanilla
		// upgrade's id and corrupt heavenlyPositions.ts's fixed id->position
		// table. Manual posX/posY for the same reason, probed against a live
		// Game.Upgrades dump to clear every existing prestige-pool node by at
		// least ~100px (in line with vanilla's own tightest spacing). Icons
		// reuse frame [0,0] of existing Cats sprite sheets (img/cats/*.png at
		// 64px cells) rather than any icons.webp cell, the same technique the
		// Cat Colony minigame's own reward upgrades already use — no new art.
		new Game.Upgrade('Communion of whiskers',"Cats gain <b>+10% CpS</b>."+'<q>Somewhere, a cat is purring in exactly your rhythm.</q>',700000,[0,0,'img/cats/idle.png',64]);Game.last.pool='prestige';Game.last.parents=['Five-finger discount'];Game.last.posX=-98;Game.last.posY=-773;
		new Game.Upgrade('Nine lives, one purpose',"Cats gain <b>+10% CpS</b>."+'<q>All nine, pointed the same way: toward the food bowl.</q>',2000000,[0,0,'img/cats/walk.png',64]);Game.last.pool='prestige';Game.last.parents=['Communion of whiskers'];Game.last.posX=-98;Game.last.posY=-923;
		new Game.Upgrade('Feline apex',"Cats gain <b>+15% CpS</b>."+'<q>The apex predator of your living room, and possibly your economy.</q>',6000000,[0,0,'img/cats/run.png',64]);Game.last.pool='prestige';Game.last.parents=['Nine lives, one purpose'];Game.last.posX=-28;Game.last.posY=-1044;

		new Game.Upgrade('Territorial pact',"Cat synergies grant their tied building an additional <b>+1% CpS per cat</b>, on top of the usual bonus."+'<q>Cats don\'t share territory. They annex it, generously, on your behalf.</q>',1800000,[0,0,'img/cats/jump.png',64]);Game.last.pool='prestige';Game.last.parents=['Communion of whiskers'];Game.last.posX=-47;Game.last.posY=-632;
		new Game.Upgrade('Alpha instincts',"Cats gain <b>+5% CpS</b> for every cat synergy upgrade owned."+'<q>Every colony needs a cat who\'s just a little more in charge.</q>',5000000,[0,0,'img/cats/running-jump.png',64]);Game.last.pool='prestige';Game.last.parents=['Territorial pact'];Game.last.posX=152;Game.last.posY=-615;

		new Game.Upgrade('Nap discipline',"Cat Colony expeditions are <b>20% less likely</b> to send a cat home hurt."+'<q>A well-rested cat is a cat that comes home in one piece.</q>',1500000,[0,0,'img/cats/sleep.png',64]);Game.last.pool='prestige';Game.last.parents=['Communion of whiskers'];Game.last.posX=-295;Game.last.posY=-808;
		new Game.Upgrade('Generous strangers',"Cat Colony expeditions yield <b>20% more treats</b>."+'<q>Turns out most of the neighborhood was willing to be robbed, gently.</q>',4000000,[0,0,'img/cats/attack-1.png',64]);Game.last.pool='prestige';Game.last.parents=['Nap discipline'];Game.last.posX=-493;Game.last.posY=-880;
		new Game.Upgrade('Bottomless treat jar',"The Cat Colony slowly generates <b>1 treat per minute</b>, even with no expeditions underway."+'<q>Some jars refill themselves. Nobody asks questions.</q>',6000000,[0,0,'img/cats/hurt.png',64]);Game.last.pool='prestige';Game.last.parents=['Generous strangers'];Game.last.posX=-628;Game.last.posY=-719;
		new Game.Upgrade('Efficient patrols',"Cat Colony expeditions take <b>15% less time</b>."+'<q>They\'ve stopped stopping to sniff every third leaf.</q>',9000000,[0,0,'img/cats/idle.png',64]);Game.last.pool='prestige';Game.last.parents=['Bottomless treat jar'];Game.last.posX=-682;Game.last.posY=-516;

		new Game.Upgrade('The Nine Lives Convergence',"Cats gain <b>+20% CpS</b>."+'<q>Nine lives, one destiny: your cookie jar.</q>',25000000,[0,0,'img/cats/attack-1.png',64]);Game.last.pool='prestige';Game.last.parents=['Feline apex','Alpha instincts','Efficient patrols'];Game.last.posX=-285;Game.last.posY=-626;

		//end of upgrades

		Game.seasons={
			'christmas':{name:'Christmas',start:'Christmas season has started!',over:'Christmas season is over.',trigger:'Festive biscuit'},
			'valentines':{name:'Valentine\'s day',start:'Valentine\'s day has started!',over:'Valentine\'s day is over.',trigger:'Lovesick biscuit'},
			'fools':{name:'Business day',start:'Business day has started!',over:'Business day is over.',trigger:'Fool\'s biscuit'},
			'easter':{name:'Easter',start:'Easter season has started!',over:'Easter season is over.',trigger:'Bunny biscuit'},
			'halloween':{name:'Halloween',start:'Halloween has started!',over:'Halloween is over.',trigger:'Ghostly biscuit'}
		};
		if (!EN)
		{
			for (var ix in Game.seasons){
				var it=Game.seasons[ix];
				it.name=loc(it.name);
				it.start=loc("%1 has started!",it.name);
				it.over=loc("%1 is over.",it.name);
			}
		}
		
		
		Game.santaDrops=['Increased merriness','Improved jolliness','A lump of coal','An itchy sweater','Reindeer baking grounds','Weighted sleighs','Ho ho ho-flavored frosting','Season savings','Toy workshop','Naughty list','Santa\'s bottomless bag','Santa\'s helpers','Santa\'s legacy','Santa\'s milk and cookies'];
		
		
		Game.reindeerDrops=['Christmas tree biscuits','Snowflake biscuits','Snowman biscuits','Holly biscuits','Candy cane biscuits','Bell biscuits','Present biscuits'];
		
		Game.seasonDrops=Game.heartDrops.concat(Game.halloweenDrops).concat(Game.easterEggs).concat(Game.santaDrops).concat(Game.reindeerDrops);
		
		Game.Upgrades['Festive biscuit'].descFunc=function(){return '<div style="text-align:center;">'+Game.listTinyOwnedUpgrades(Game.santaDrops)+'<br><br>'+(EN?('You\'ve purchased <b>'+Game.GetHowManySantaDrops()+'/'+Game.santaDrops.length+'</b> of Santa\'s gifts.'):loc("Seasonal cookies purchased: <b>%1</b>.",Game.GetHowManySantaDrops()+'/'+Game.santaDrops.length))+'<div class="line"></div>'+Game.listTinyOwnedUpgrades(Game.reindeerDrops)+'<br><br>'+(EN?('You\'ve purchased <b>'+Game.GetHowManyReindeerDrops()+'/'+Game.reindeerDrops.length+'</b> reindeer cookies.'):loc("Reindeer cookies purchased: <b>%1</b>.",Game.GetHowManyReindeerDrops()+'/'+Game.reindeerDrops.length))+'<div class="line"></div>'+Game.saySeasonSwitchUses()+'<div class="line"></div></div>'+this.ddesc;};
		Game.Upgrades['Bunny biscuit'].descFunc=function(){return '<div style="text-align:center;">'+Game.listTinyOwnedUpgrades(Game.easterEggs)+'<br><br>'+(EN?('You\'ve purchased <b>'+Game.GetHowManyEggs()+'/'+Game.easterEggs.length+'</b> eggs.'):loc("Eggs purchased: <b>%1</b>.",Game.GetHowManyEggs()+'/'+Game.easterEggs.length))+'<div class="line"></div>'+Game.saySeasonSwitchUses()+'<div class="line"></div></div>'+this.ddesc;};
		Game.Upgrades['Ghostly biscuit'].descFunc=function(){return '<div style="text-align:center;">'+Game.listTinyOwnedUpgrades(Game.halloweenDrops)+'<br><br>'+(EN?('You\'ve purchased <b>'+Game.GetHowManyHalloweenDrops()+'/'+Game.halloweenDrops.length+'</b> halloween cookies.'):loc("Seasonal cookies purchased: <b>%1</b>.",Game.GetHowManyHalloweenDrops()+'/'+Game.halloweenDrops.length))+'<div class="line"></div>'+Game.saySeasonSwitchUses()+'<div class="line"></div></div>'+this.ddesc;};
		Game.Upgrades['Lovesick biscuit'].descFunc=function(){return '<div style="text-align:center;">'+Game.listTinyOwnedUpgrades(Game.heartDrops)+'<br><br>'+(EN?('You\'ve purchased <b>'+Game.GetHowManyHeartDrops()+'/'+Game.heartDrops.length+'</b> heart biscuits.'):loc("Seasonal cookies purchased: <b>%1</b>.",Game.GetHowManyHeartDrops()+'/'+Game.heartDrops.length))+'<div class="line"></div>'+Game.saySeasonSwitchUses()+'<div class="line"></div></div>'+this.ddesc;};
		Game.Upgrades['Fool\'s biscuit'].descFunc=function(){return '<div style="text-align:center;">'+Game.saySeasonSwitchUses()+'<div class="line"></div></div>'+this.ddesc;};
		
		// CC3: the engine's Game.Upgrade/Game.Achievement ctors read
		// order/pool/power (via the window bridge); reference them here so
		// the type checker sees the shared globals as read. Zero runtime
		// effect (void of a value is a no-op).
		void order; void pool; void power;
}
