/**
 * content/achievements.ts — the 501 vanilla achievement declarations
 * (192 `new Game.Achievement`, 252 `Game.TieredAchievement`, 57
 * `Game.ProductionAchievement`), plus the 46 `Game.BankAchievement` and
 * 46 `Game.CpsAchievement` calls, ported verbatim from the 2.048 engine
 * (engine/main.ts, the ACHIEVEMENTS block inside Game.Init): the same
 * constructor calls, in the same order, with the same `order`
 * bookkeeping — only the file moved.
 *
 * The engine calls declareVanillaAchievements(Game) from Game.Init (which
 * the asset Loader guarantees runs exactly once per page load), so the
 * ctors and declarations run at this exact Init point and the declaration
 * order (and every id, save slot and Game.last hand-off) is unchanged.
 *
 * Moved here with the declarations (assigned on Game, so the modding
 * surface is unchanged): the Game.Achievement ctor + getType/toggle
 * prototype methods, Game.Win, Game.RemoveAchiev,
 * Game.CountsAsAchievementOwned, Game.HasAchiev, the
 * Game.TieredAchievement / Game.ProductionAchievement /
 * Game.BankAchievement / Game.CpsAchievement factories,
 * Game.thresholdIcons, and the Game.BankAchievements /
 * Game.CpsAchievements registries. (The four Game.Achievements* init
 * lines stay in the engine under the ACHIEVEMENTS banner, exactly as the
 * Game.Upgrades* init lines do for the upgrades slice.)
 *
 * Rewiring notes (runtime-identical):
 *  - `order` was an Init-scoped closure var the Game.Achievement ctor
 *    read; it is now a bare global live-bridged to the engine's
 *    module-level var through the window accessors (the slice-3
 *    order/pool/power bridge, inherited as-is). The original
 *    `var order=0` declaration is dropped: the bare assignment runs at
 *    this same point, and a local `var` would shadow the bridge and
 *    break every order assignment.
 *  - The four write-only `var achiev=` bindings (the dungeon
 *    achievements) are dropped for noUnusedLocals; the ctor calls run
 *    identically.
 *  - One non-null assertion (`Game.Tiers[tier].achievUnlock!`):
 *    TieredAchievement is only ever called with building tiers, and every
 *    numeric tier defines achievUnlock — compile-erased, runtime-identical.
 */
import type { Game as EngineGame } from '../types';
import { Achievement, TieredAchievement, ProductionAchievement, BankAchievement, CpsAchievement } from '../core/achievement';

/** Declare the 501 vanilla achievements (and their bookkeeping) on Game. */
export function declareVanillaAchievements(Game: EngineGame) {
		Game.Achievement=Achievement;//CC3 rewrite (phase 3, slice 4): the ctor + getType/toggle prototype methods moved to core/achievement.ts as the real Achievement class; the same Game.Achievement slot, same call sites, same self-registration.
		Game.Win=function(what)
		{
			if (typeof what==='string')
			{
				if (Game.Achievements[what])
				{
					var it=Game.Achievements[what];
					if (it.won==0)
					{
						var name=it.shortName?it.shortName:it.dname;
						it.won=1;
						PlaySound('snd/confirm1.mp3',0.5);//CC3: interface confirm tone on achievement unlock
						Game.Notify(loc("Achievement unlocked"),'<div class="title" style="font-size:18px;margin-top:-2px;">'+name+'</div>',it.icon);
						Game.NotifyTooltip('function(){return Game.crateTooltip(Game.AchievementsById['+it.id+']);}');
						if (Game.CountsAsAchievementOwned(it.pool)) Game.AchievementsOwned++;
						Game.recalculateGains=1;
						if (App && it.vanilla) App.gotAchiev(it.id);
					}
				}
			}
			else {for (var i in what) {Game.Win(what[i]);}}
		}
		Game.RemoveAchiev=function(what: any)
		{
			if (Game.Achievements[what])
			{
				if (Game.Achievements[what].won==1)
				{
					Game.Achievements[what].won=0;
					if (Game.CountsAsAchievementOwned(Game.Achievements[what].pool)) Game.AchievementsOwned--;
					Game.recalculateGains=1;
				}
			}
		}
		
		Game.CountsAsAchievementOwned=function(pool)
		{
			if (pool=='' || pool=='normal') return true; else return false;
		}
		
		Game.HasAchiev=function(what: any)
		{
			return (Game.Achievements[what]?Game.Achievements[what].won:0);
		}
		
		Game.TieredAchievement=TieredAchievement;//CC3 rewrite (phase 3, slice 4): the non-capturing factory moved to core/achievement.ts; the same Game.TieredAchievement slot and call order.
		
		Game.ProductionAchievement=ProductionAchievement;//CC3 rewrite (phase 3, slice 4): the non-capturing factory moved to core/achievement.ts; the same Game.ProductionAchievement slot and call order.
		
		Game.thresholdIcons=[0,1,2,3,4,5,6,7,8,9,10,11,18,19,20,21,22,23,24,25,26,27,28,29,21,22,23,24,25,26,27,28,29,21,22,23,24,25,26,27,28,29,30,31,30,31];
		Game.BankAchievements=[];
		Game.BankAchievement=BankAchievement;//CC3 rewrite (phase 3, slice 4): the non-capturing factory moved to core/achievement.ts; the same Game.BankAchievement slot and call order.
		Game.CpsAchievements=[];
		Game.CpsAchievement=CpsAchievement;//CC3 rewrite (phase 3, slice 4): the non-capturing factory moved to core/achievement.ts; the same Game.CpsAchievement slot and call order.
		
		//define achievements
		//WARNING : do NOT add new achievements in between, this breaks the saves. Add them at the end !
		
		order=0;//this is used to set the order in which the items are listed
		
		Game.BankAchievement('Wake and bake');
		Game.BankAchievement('Making some dough');
		Game.BankAchievement('So baked right now');
		Game.BankAchievement('Fledgling bakery');
		Game.BankAchievement('Affluent bakery');
		Game.BankAchievement('World-famous bakery');
		Game.BankAchievement('Cosmic bakery');
		Game.BankAchievement('Galactic bakery');
		Game.BankAchievement('Universal bakery');
		Game.BankAchievement('Timeless bakery');
		Game.BankAchievement('Infinite bakery');
		Game.BankAchievement('Immortal bakery');
		Game.BankAchievement('Don\'t stop me now');
		Game.BankAchievement('You can stop now');
		Game.BankAchievement('Cookies all the way down');
		Game.BankAchievement('Overdose');
		
		Game.CpsAchievement('Casual baking');
		Game.CpsAchievement('Hardcore baking');
		Game.CpsAchievement('Steady tasty stream');
		Game.CpsAchievement('Cookie monster');
		Game.CpsAchievement('Mass producer');
		Game.CpsAchievement('Cookie vortex');
		Game.CpsAchievement('Cookie pulsar');
		Game.CpsAchievement('Cookie quasar');
		Game.CpsAchievement('Oh hey, you\'re still here');
		Game.CpsAchievement('Let\'s never bake again');
		
		order=30010;
		new Game.Achievement('Sacrifice',loc("Ascend with <b>%1</b> baked.",loc("%1 cookie",LBeautify(1e6)))+'<q>Easy come, easy go.</q>',[11,6]);
		new Game.Achievement('Oblivion',loc("Ascend with <b>%1</b> baked.",loc("%1 cookie",LBeautify(1e9)))+'<q>Back to square one.</q>',[11,6]);
		new Game.Achievement('From scratch',loc("Ascend with <b>%1</b> baked.",loc("%1 cookie",LBeautify(1e12)))+'<q>It\'s been fun.</q>',[11,6]);
		
		order=11010;
		new Game.Achievement('Neverclick',loc("Make <b>%1</b> by only having clicked <b>%2 times</b>.",[loc("%1 cookie",LBeautify(1e6)),15]),[12,0]);//Game.last.pool='shadow';
		order=1000;
		new Game.Achievement('Clicktastic',loc("Make <b>%1</b> from clicking.",loc("%1 cookie",LBeautify(1e3))),[11,0]);
		new Game.Achievement('Clickathlon',loc("Make <b>%1</b> from clicking.",loc("%1 cookie",LBeautify(1e5))),[11,1]);
		new Game.Achievement('Clickolympics',loc("Make <b>%1</b> from clicking.",loc("%1 cookie",LBeautify(1e7))),[11,2]);
		new Game.Achievement('Clickorama',loc("Make <b>%1</b> from clicking.",loc("%1 cookie",LBeautify(1e9))),[11,13]);
		
		order=1050;
		new Game.Achievement('Click',loc("Have <b>%1</b>.",loc("%1 cursor",LBeautify(1))),[0,0]);
		new Game.Achievement('Double-click',loc("Have <b>%1</b>.",loc("%1 cursor",LBeautify(2))),[0,6]);
		new Game.Achievement('Mouse wheel',loc("Have <b>%1</b>.",loc("%1 cursor",LBeautify(50))),[1,6]);
		new Game.Achievement('Of Mice and Men',loc("Have <b>%1</b>.",loc("%1 cursor",LBeautify(100))),[0,1]);
		new Game.Achievement('The Digital',loc("Have <b>%1</b>.",loc("%1 cursor",LBeautify(200))),[0,2]);
		
		order=1098;
		new Game.Achievement('Just wrong',loc("Sell a grandma.")+'<q>I thought you loved me.</q>',[10,9]);
		order=1100;
		Game.TieredAchievement('Grandma\'s cookies','','Grandma',1);
		Game.TieredAchievement('Sloppy kisses','','Grandma',2);
		Game.TieredAchievement('Retirement home','','Grandma',3);
		
		order=1200;
		Game.TieredAchievement('Bought the farm','','Farm',1);
		Game.TieredAchievement('Reap what you sow','','Farm',2);
		Game.TieredAchievement('Farm ill','','Farm',3);
		
		order=1400;
		Game.TieredAchievement('Production chain','','Factory',1);
		Game.TieredAchievement('Industrial revolution','','Factory',2);
		Game.TieredAchievement('Global warming','','Factory',3);
		
		order=1300;
		Game.TieredAchievement('You know the drill','','Mine',1);
		Game.TieredAchievement('Excavation site','','Mine',2);
		Game.TieredAchievement('Hollow the planet','','Mine',3);
		
		order=1500;
		Game.TieredAchievement('Expedition','','Shipment',1);
		Game.TieredAchievement('Galactic highway','','Shipment',2);
		Game.TieredAchievement('Far far away','','Shipment',3);
		
		order=1600;
		Game.TieredAchievement('Transmutation','','Alchemy lab',1);
		Game.TieredAchievement('Transmogrification','','Alchemy lab',2);
		Game.TieredAchievement('Gold member','','Alchemy lab',3);
		
		order=1700;
		Game.TieredAchievement('A whole new world','','Portal',1);
		Game.TieredAchievement('Now you\'re thinking','','Portal',2);
		Game.TieredAchievement('Dimensional shift','','Portal',3);
		
		order=1800;
		Game.TieredAchievement('Time warp','','Time machine',1);
		Game.TieredAchievement('Alternate timeline','','Time machine',2);
		Game.TieredAchievement('Rewriting history','','Time machine',3);
		
		
		order=7000;
		new Game.Achievement('One with everything',loc("Have <b>at least %1</b> of every building.",1),[2,7]);
		new Game.Achievement('Mathematician',loc("Have at least <b>1 of the most expensive object, 2 of the second-most expensive, 4 of the next</b> and so on (capped at %1).",128),[23,12]);
		new Game.Achievement('Base 10',loc("Have at least <b>10 of the most expensive object, 20 of the second-most expensive, 30 of the next</b> and so on."),[23,12]);
		
		order=10000;
		new Game.Achievement('Golden cookie',loc("Click a <b>golden cookie</b>."),[10,14]);
		new Game.Achievement('Lucky cookie',loc("Click <b>%1</b>.",loc("%1 golden cookie",LBeautify(7))),[22,6]);
		new Game.Achievement('A stroke of luck',loc("Click <b>%1</b>.",loc("%1 golden cookie",LBeautify(27))),[23,6]);
		
		order=30200;
		new Game.Achievement('Cheated cookies taste awful',loc("Hack in some cookies."),[10,6]);Game.last.pool='shadow';
		order=11010;
		new Game.Achievement('Uncanny clicker',loc("Click really, really fast.")+'<q>Well I\'ll be!</q>',[12,0]);
		
		order=5000;
		new Game.Achievement('Builder',loc("Own <b>%1</b>.",loc("%1 building",LBeautify(100))),[2,6]);
		new Game.Achievement('Architect',loc("Own <b>%1</b>.",loc("%1 building",LBeautify(500))),[3,6]);
		order=6000;
		new Game.Achievement('Enhancer',loc("Purchase <b>%1</b>.",loc("%1 upgrade",LBeautify(20))),[9,0]);
		new Game.Achievement('Augmenter',loc("Purchase <b>%1</b>.",loc("%1 upgrade",LBeautify(50))),[9,1]);
		
		order=11000;
		new Game.Achievement('Cookie-dunker',loc("Dunk the cookie.")+'<q>You did it!</q>',[1,8]);
		
		order=10000;
		new Game.Achievement('Fortune',loc("Click <b>%1</b>.",loc("%1 golden cookie",LBeautify(77)))+'<q>You should really go to bed.</q>',[24,6]);
		order=31000;
		new Game.Achievement('True Neverclick',loc("Make <b>%1</b> with <b>no</b> cookie clicks.",loc("%1 cookie",LBeautify(1e6)))+'<q>This kinda defeats the whole purpose, doesn\'t it?</q>',[12,0]);Game.last.pool='shadow';
		
		order=20000;
		new Game.Achievement('Elder nap',loc("Appease the grandmatriarchs at least <b>once</b>.")+'<q>we<br>are<br>eternal</q>',[8,9]);
		new Game.Achievement('Elder slumber',loc("Appease the grandmatriarchs at least <b>%1 times</b>.",5)+'<q>our mind<br>outlives<br>the universe</q>',[8,9]);
		
		order=1098;
		new Game.Achievement('Elder',loc("Own at least <b>%1</b> grandma types.",7),[10,9]);
		
		order=20000;
		new Game.Achievement('Elder calm',loc("Declare a covenant with the grandmatriarchs.")+'<q>we<br>have<br>fed</q>',[8,9]);
		
		order=5000;
		new Game.Achievement('Engineer',loc("Own <b>%1</b>.",loc("%1 building",LBeautify(1000))),[4,6]);
		
		order=10000;
		new Game.Achievement('Leprechaun',loc("Click <b>%1</b>.",loc("%1 golden cookie",LBeautify(777))),[25,6]);
		new Game.Achievement('Black cat\'s paw',loc("Click <b>%1</b>.",loc("%1 golden cookie",LBeautify(7777))),[26,6]);
		
		order=30050;
		new Game.Achievement('Nihilism',loc("Ascend with <b>%1</b> baked.",loc("%1 cookie",LBeautify(1e15)))+'<q>There are many things<br>that need to be erased</q>',[11,7]);
		
		order=1900;
		Game.TieredAchievement('Antibatter','','Antimatter condenser',1);
		Game.TieredAchievement('Quirky quarks','','Antimatter condenser',2);
		Game.TieredAchievement('It does matter!','','Antimatter condenser',3);
		
		order=6000;
		new Game.Achievement('Upgrader',loc("Purchase <b>%1</b>.",loc("%1 upgrade",LBeautify(100))),[9,2]);
		
		order=7000;
		new Game.Achievement('Centennial',loc("Have at least <b>%1 of everything</b>.",100),[6,6]);
		
		order=30500;
		new Game.Achievement('Hardcore',loc("Get to <b>%1</b> baked with <b>no upgrades purchased</b>.",loc("%1 cookie",LBeautify(1e9))),[12,6]);//Game.last.pool='shadow';
		
		order=30600;
		new Game.Achievement('Speed baking I',loc("Get to <b>%1</b> baked in <b>%2</b>.",[loc("%1 cookie",LBeautify(1e6)),Game.sayTime(60*35*Game.fps)]),[12,5]);Game.last.pool='shadow';
		new Game.Achievement('Speed baking II',loc("Get to <b>%1</b> baked in <b>%2</b>.",[loc("%1 cookie",LBeautify(1e6)),Game.sayTime(60*25*Game.fps)]),[13,5]);Game.last.pool='shadow';
		new Game.Achievement('Speed baking III',loc("Get to <b>%1</b> baked in <b>%2</b>.",[loc("%1 cookie",LBeautify(1e6)),Game.sayTime(60*15*Game.fps)]),[14,5]);Game.last.pool='shadow';
		
		
		order=61000;
		new Game.Achievement('Getting even with the oven',EN?'Defeat the <b>Sentient Furnace</b> in the factory dungeons.':'???',[12,7]);Game.last.pool='dungeon';
		new Game.Achievement('Now this is pod-smashing',EN?'Defeat the <b>Ascended Baking Pod</b> in the factory dungeons.':'???',[12,7]);Game.last.pool='dungeon';
		new Game.Achievement('Chirped out',EN?'Find and defeat <b>Chirpy</b>, the dysfunctionning alarm bot.':'???',[13,7]);Game.last.pool='dungeon';
		new Game.Achievement('Follow the white rabbit',EN?'Find and defeat the elusive <b>sugar bunny</b>.':'???',[14,7]);Game.last.pool='dungeon';
		
		order=1000;
		new Game.Achievement('Clickasmic',loc("Make <b>%1</b> from clicking.",loc("%1 cookie",LBeautify(1e11))),[11,14]);
		
		order=1100;
		Game.TieredAchievement('Friend of the ancients','','Grandma',4);
		Game.TieredAchievement('Ruler of the ancients','','Grandma',5);
		
		order=32000;
		new Game.Achievement('Wholesome',loc("Unlock <b>100%</b> of your heavenly chips power."),[15,7]);
		
		order=33000;
		new Game.Achievement('Just plain lucky',loc("You have <b>1 chance in %1</b> every second of earning this achievement.",Beautify(1000000)),[15,6]);Game.last.pool='shadow';
		
		order=21000;
		new Game.Achievement('Itchscratcher',loc("Burst <b>1 wrinkler</b>."),[19,8]);
		new Game.Achievement('Wrinklesquisher',loc("Burst <b>%1 wrinklers</b>.",50),[19,8]);
		new Game.Achievement('Moistburster',loc("Burst <b>%1 wrinklers</b>.",200),[19,8]);
		
		order=22000;
		new Game.Achievement('Spooky cookies',loc("Unlock <b>every Halloween-themed cookie</b>.<div class=\"line\"></div>Owning this achievement makes Halloween-themed cookies drop more frequently in future playthroughs."),[12,8]);
		
		order=22100;
		new Game.Achievement('Coming to town',loc("Reach <b>Santa's 7th form</b>."),[18,9]);
		new Game.Achievement('All hail Santa',loc("Reach <b>Santa's final form</b>."),[19,10]);
		new Game.Achievement('Let it snow',loc("Unlock <b>every Christmas-themed cookie</b>.<div class=\"line\"></div>Owning this achievement makes Christmas-themed cookies drop more frequently in future playthroughs."),[19,9]);
		new Game.Achievement('Oh deer',loc("Pop <b>1 reindeer</b>."),[12,9]);
		new Game.Achievement('Sleigh of hand',loc("Pop <b>%1 reindeer</b>.",50),[12,9]);
		new Game.Achievement('Reindeer sleigher',loc("Pop <b>%1 reindeer</b>.",200),[12,9]);

		order=1200;
		Game.TieredAchievement('Perfected agriculture','','Farm',4);
		order=1400;
		Game.TieredAchievement('Ultimate automation','','Factory',4);
		order=1300;
		Game.TieredAchievement('Can you dig it','','Mine',4);
		order=1500;
		Game.TieredAchievement('Type II civilization','','Shipment',4);
		order=1600;
		Game.TieredAchievement('Gild wars','','Alchemy lab',4);
		order=1700;
		Game.TieredAchievement('Brain-split','','Portal',4);
		order=1800;
		Game.TieredAchievement('Time duke','','Time machine',4);
		order=1900;
		Game.TieredAchievement('Molecular maestro','','Antimatter condenser',4);
		
		order=2000;
		Game.TieredAchievement('Lone photon','','Prism',1);
		Game.TieredAchievement('Dazzling glimmer','','Prism',2);
		Game.TieredAchievement('Blinding flash','','Prism',3);
		Game.TieredAchievement('Unending glow','','Prism',4);
		
		order=5000;
		new Game.Achievement('Lord of Constructs',loc("Own <b>%1</b>.",loc("%1 building",LBeautify(2500)))+'<q>He saw the vast plains stretching ahead of him, and he said : let there be civilization.</q>',[5,6]);
		order=6000;
		new Game.Achievement('Lord of Progress',loc("Purchase <b>%1</b>.",loc("%1 upgrade",LBeautify(200)))+'<q>One can always do better. But should you?</q>',[9,14]);
		order=7002;
		new Game.Achievement('Bicentennial',loc("Have at least <b>%1 of everything</b>.",200)+'<q>You crazy person.</q>',[8,6]);
		
		order=22300;
		new Game.Achievement('Lovely cookies',loc("Unlock <b>every Valentine-themed cookie</b>."),[20,3]);
		
		order=7001;
		new Game.Achievement('Centennial and a half',loc("Have at least <b>%1 of everything</b>.",150),[7,6]);
		
		order=11000;
		new Game.Achievement('Tiny cookie',loc("Click the tiny cookie.")+'<q>These aren\'t the cookies<br>you\'re clicking for.</q>',[0,5]);
		
		order=400000;
		new Game.Achievement('You win a cookie',loc("This is for baking %1 and making it on the local news.",loc("%1 cookie",LBeautify(1e13)))+'<q>We\'re all so proud of you.</q>',[10,0]);
		
		order=1070;
		Game.ProductionAchievement('Click delegator','Cursor',1,0,7);
		order=1120;
		Game.ProductionAchievement('Gushing grannies','Grandma',1,0,6);
		order=1220;
		Game.ProductionAchievement('I hate manure','Farm',1);
		order=1320;
		Game.ProductionAchievement('Never dig down','Mine',1);
		order=1420;
		Game.ProductionAchievement('The incredible machine','Factory',1);
		order=1520;
		Game.ProductionAchievement('And beyond','Shipment',1);
		order=1620;
		Game.ProductionAchievement('Magnum Opus','Alchemy lab',1);
		order=1720;
		Game.ProductionAchievement('With strange eons','Portal',1);
		order=1820;
		Game.ProductionAchievement('Spacetime jigamaroo','Time machine',1);
		order=1920;
		Game.ProductionAchievement('Supermassive','Antimatter condenser',1);
		order=2020;
		Game.ProductionAchievement('Praise the sun','Prism',1);
		
		
		order=1000;
		new Game.Achievement('Clickageddon',loc("Make <b>%1</b> from clicking.",loc("%1 cookie",LBeautify(1e13))),[11,15]);
		new Game.Achievement('Clicknarok',loc("Make <b>%1</b> from clicking.",loc("%1 cookie",LBeautify(1e15))),[11,16]);
		
		order=1050;
		new Game.Achievement('Extreme polydactyly',loc("Have <b>%1</b>.",loc("%1 cursor",LBeautify(300))),[0,13]);
		new Game.Achievement('Dr. T',loc("Have <b>%1</b>.",loc("%1 cursor",LBeautify(400))),[0,14]);
		
		order=1100;Game.TieredAchievement('The old never bothered me anyway','','Grandma',6);
		order=1200;Game.TieredAchievement('Homegrown','','Farm',5);
		order=1400;Game.TieredAchievement('Technocracy','','Factory',5);
		order=1300;Game.TieredAchievement('The center of the Earth','','Mine',5);
		order=1500;Game.TieredAchievement('We come in peace','','Shipment',5);
		order=1600;Game.TieredAchievement('The secrets of the universe','','Alchemy lab',5);
		order=1700;Game.TieredAchievement('Realm of the Mad God','','Portal',5);
		order=1800;Game.TieredAchievement('Forever and ever','','Time machine',5);
		order=1900;Game.TieredAchievement('Walk the planck','','Antimatter condenser',5);
		order=2000;Game.TieredAchievement('Rise and shine','','Prism',5);
		
		order=30200;
		new Game.Achievement('God complex',loc("Name yourself <b>Orteil</b>.<div class=\"warning\">Note: usurpers incur a -%1% CpS penalty until they rename themselves something else.</div>",1)+'<q>But that\'s not you, is it?</q>',[17,5]);Game.last.pool='shadow';
		new Game.Achievement('Third-party',loc("Use an <b>add-on</b>.")+'<q>Some find vanilla to be the most boring flavor.</q>',[16,5]);Game.last.pool='shadow';//if you're making a mod, add a Game.Win('Third-party') somewhere in there!
		
		order=30050;
		new Game.Achievement('Dematerialize',loc("Ascend with <b>%1</b> baked.",loc("%1 cookie",LBeautify(1e18)))+'<q>Presto!<br>...where\'d the cookies go?</q>',[11,7]);
		new Game.Achievement('Nil zero zilch',loc("Ascend with <b>%1</b> baked.",loc("%1 cookie",LBeautify(1e21)))+'<q>To summarize : really not very much at all.</q>',[11,7]);
		new Game.Achievement('Transcendence',loc("Ascend with <b>%1</b> baked.",loc("%1 cookie",LBeautify(1e24)))+'<q>Your cookies are now on a higher plane of being.</q>',[11,8]);
		new Game.Achievement('Obliterate',loc("Ascend with <b>%1</b> baked.",loc("%1 cookie",LBeautify(1e27)))+'<q>Resistance is futile, albeit entertaining.</q>',[11,8]);
		new Game.Achievement('Negative void',loc("Ascend with <b>%1</b> baked.",loc("%1 cookie",LBeautify(1e30)))+'<q>You now have so few cookies that it\'s almost like you have a negative amount of them.</q>',[11,8]);
		
		order=22400;
		new Game.Achievement('The hunt is on',loc("Unlock <b>1 egg</b>."),[1,12]);
		new Game.Achievement('Egging on',loc("Unlock <b>%1 eggs</b>.",7),[4,12]);
		new Game.Achievement('Mass Easteria',loc("Unlock <b>%1 eggs</b>.",14),[7,12]);
		new Game.Achievement('Hide & seek champion',loc("Unlock <b>all the eggs</b>.<div class=\"line\"></div>Owning this achievement makes eggs drop more frequently in future playthroughs."),[13,12]);
	
		order=11000;
		new Game.Achievement('What\'s in a name',loc("Give your bakery a name."),[15,9]);
	
	
		order=1425;
		Game.TieredAchievement('Pretty penny','','Bank',1);
		Game.TieredAchievement('Fit the bill','','Bank',2);
		Game.TieredAchievement('A loan in the dark','','Bank',3);
		Game.TieredAchievement('Need for greed','','Bank',4);
		Game.TieredAchievement('It\'s the economy, stupid','','Bank',5);
		order=1450;
		Game.TieredAchievement('Your time to shrine','','Temple',1);
		Game.TieredAchievement('Shady sect','','Temple',2);
		Game.TieredAchievement('New-age cult','','Temple',3);
		Game.TieredAchievement('Organized religion','','Temple',4);
		Game.TieredAchievement('Fanaticism','','Temple',5);
		order=1475;
		Game.TieredAchievement('Bewitched','','Wizard tower',1);
		Game.TieredAchievement('The sorcerer\'s apprentice','','Wizard tower',2);
		Game.TieredAchievement('Charms and enchantments','','Wizard tower',3);
		Game.TieredAchievement('Curses and maledictions','','Wizard tower',4);
		Game.TieredAchievement('Magic kingdom','','Wizard tower',5);
		
		order=1445;
		Game.ProductionAchievement('Vested interest','Bank',1);
		order=1470;
		Game.ProductionAchievement('New world order','Temple',1);
		order=1495;
		Game.ProductionAchievement('Hocus pocus','Wizard tower',1);
		
		
		
		order=1070;
		Game.ProductionAchievement('Finger clickin\' good','Cursor',2,0,7);
		order=1120;
		Game.ProductionAchievement('Panic at the bingo','Grandma',2,0,6);
		order=1220;
		Game.ProductionAchievement('Rake in the dough','Farm',2);
		order=1320;
		Game.ProductionAchievement('Quarry on','Mine',2);
		order=1420;
		Game.ProductionAchievement('Yes I love technology','Factory',2);
		order=1445;
		Game.ProductionAchievement('Paid in full','Bank',2);
		order=1470;
		Game.ProductionAchievement('Church of Cookiology','Temple',2);
		order=1495;
		Game.ProductionAchievement('Too many rabbits, not enough hats','Wizard tower',2);
		order=1520;
		Game.ProductionAchievement('The most precious cargo','Shipment',2);
		order=1620;
		Game.ProductionAchievement('The Aureate','Alchemy lab',2);
		order=1720;
		Game.ProductionAchievement('Ever more hideous','Portal',2);
		order=1820;
		Game.ProductionAchievement('Be kind, rewind','Time machine',2);
		order=1920;
		Game.ProductionAchievement('Infinitesimal','Antimatter condenser',2);
		order=2020;
		Game.ProductionAchievement('A still more glorious dawn','Prism',2);
		
		order=30000;
		new Game.Achievement('Rebirth',loc("Ascend at least once."),[21,6]);
		
		order=11000;
		new Game.Achievement('Here you go',loc("Click this achievement's slot.")+'<q>All you had to do was ask.</q>',[1,7]);Game.last.clickFunction=function(){if (!Game.HasAchiev('Here you go')){PlaySound('snd/tick.mp3');Game.Win('Here you go');}};
		
		order=30000;
		new Game.Achievement('Resurrection',loc("Ascend <b>%1 times</b>.",10),[21,6]);
		new Game.Achievement('Reincarnation',loc("Ascend <b>%1 times</b>.",100),[21,6]);
		new Game.Achievement('Endless cycle',loc("Ascend <b>%1 times</b>.",1000)+'<q>Oh hey, it\'s you again.</q>',[2,7]);Game.last.pool='shadow';
		
		
		
		order=1100;
		Game.TieredAchievement('The agemaster','','Grandma',7);
		Game.TieredAchievement('To oldly go','','Grandma',8);
		
		order=1200;Game.TieredAchievement('Gardener extraordinaire','','Farm',6);
		order=1300;Game.TieredAchievement('Tectonic ambassador','','Mine',6);
		order=1400;Game.TieredAchievement('Rise of the machines','','Factory',6);
		order=1425;Game.TieredAchievement('Acquire currency','','Bank',6);
		order=1450;Game.TieredAchievement('Zealotry','','Temple',6);
		order=1475;Game.TieredAchievement('The wizarding world','','Wizard tower',6);
		order=1500;Game.TieredAchievement('Parsec-masher','','Shipment',6);
		order=1600;Game.TieredAchievement('The work of a lifetime','','Alchemy lab',6);
		order=1700;Game.TieredAchievement('A place lost in time','','Portal',6);
		order=1800;Game.TieredAchievement('Heat death','','Time machine',6);
		order=1900;Game.TieredAchievement('Microcosm','','Antimatter condenser',6);
		order=2000;Game.TieredAchievement('Bright future','','Prism',6);
		
		order=25000;
		new Game.Achievement('Here be dragon',loc("Complete your <b>dragon's training</b>."),[21,12]);
		
		Game.BankAchievement('How?');
		Game.BankAchievement('The land of milk and cookies');
		Game.BankAchievement('He who controls the cookies controls the universe','The milk must flow!');
		Game.BankAchievement('Tonight on Hoarders');
		Game.BankAchievement('Are you gonna eat all that?');
		Game.BankAchievement('We\'re gonna need a bigger bakery');
		Game.BankAchievement('In the mouth of madness','A cookie is just what we tell each other it is.');
		Game.BankAchievement('Brought to you by the letter <div style="display:inline-block;background:url(img/money.webp);width:16px;height:16px;"></div>');
		
		
		Game.CpsAchievement('A world filled with cookies');
		Game.CpsAchievement('When this baby hits '+Beautify(10000000000000*60*60)+' cookies per hour');
		Game.CpsAchievement('Fast and delicious');
		Game.CpsAchievement('Cookiehertz : a really, really tasty hertz','Tastier than a hertz donut, anyway.');
		Game.CpsAchievement('Woops, you solved world hunger');
		Game.CpsAchievement('Turbopuns','Mother Nature will be like "slowwwww dowwwwwn".');
		Game.CpsAchievement('Faster menner');
		Game.CpsAchievement('And yet you\'re still hungry');
		Game.CpsAchievement('The Abakening');
		Game.CpsAchievement('There\'s really no hard limit to how long these achievement names can be and to be quite honest I\'m rather curious to see how far we can go.<br>Adolphus W. Green (1844–1917) started as the Principal of the Groton School in 1864. By 1865, he became second assistant librarian at the New York Mercantile Library; from 1867 to 1869, he was promoted to full librarian. From 1869 to 1873, he worked for Evarts, Southmayd & Choate, a law firm co-founded by William M. Evarts, Charles Ferdinand Southmayd and Joseph Hodges Choate. He was admitted to the New York State Bar Association in 1873.<br>Anyway, how\'s your day been?');//Game.last.shortName='There\'s really no hard limit to how long these achievement names can be and to be quite honest I\'m [...]';
		Game.CpsAchievement('Fast','Wow!');
		
		order=7002;
		new Game.Achievement('Bicentennial and a half',loc("Have at least <b>%1 of everything</b>.",250)+'<q>Keep on truckin\'.</q>',[9,6]);
		
		order=11000;
		new Game.Achievement('Tabloid addiction',loc("Click on the news ticker <b>%1 times</b>.",50)+'<q>Page 6: Mad individual clicks on picture of pastry in a futile attempt to escape boredom!<br>Also page 6: British parliament ate my baby!</q>',[27,7]);
		
		order=1000;
		new Game.Achievement('Clickastrophe',loc("Make <b>%1</b> from clicking.",loc("%1 cookie",LBeautify(1e17))),[11,17]);
		new Game.Achievement('Clickataclysm',loc("Make <b>%1</b> from clicking.",loc("%1 cookie",LBeautify(1e19))),[11,18]);
		
		order=1050;
		new Game.Achievement('Thumbs, phalanges, metacarpals',loc("Have <b>%1</b>.",loc("%1 cursor",LBeautify(500)))+'<q>& KNUCKLES</q>',[0,15]);
		
		order=6002;
		new Game.Achievement('Polymath',loc("Own <b>%1</b> upgrades and <b>%2</b> buildings.",[300,4000])+'<q>Excellence doesn\'t happen overnight - it usually takes a good couple days.</q>',[29,7]);
		
		order=1099;
		new Game.Achievement('The elder scrolls',loc("Own a combined <b>%1</b> %2 and %3.",[777,loc("grandmas"),loc("cursors")])+'<q>Let me guess. Someone stole your cookie.</q>',[10,9]);
		
		order=30050;
		new Game.Achievement('To crumbs, you say?',loc("Ascend with <b>%1</b> baked.",loc("%1 cookie",LBeautify(1e33)))+'<q>Very well then.</q>',[29,6]);
		
		order=1200;Game.TieredAchievement('Seedy business','','Farm',7);
		order=1300;Game.TieredAchievement('Freak fracking','','Mine',7);
		order=1400;Game.TieredAchievement('Modern times','','Factory',7);
		order=1425;Game.TieredAchievement('The nerve of war','','Bank',7);
		order=1450;Game.TieredAchievement('Wololo','','Temple',7);
		order=1475;Game.TieredAchievement('And now for my next trick, I\'ll need a volunteer from the audience','','Wizard tower',7);
		order=1500;Game.TieredAchievement('It\'s not delivery','','Shipment',7);
		order=1600;Game.TieredAchievement('Gold, Jerry! Gold!','','Alchemy lab',7);
		order=1700;Game.TieredAchievement('Forbidden zone','','Portal',7);
		order=1800;Game.TieredAchievement('cookie clicker forever and forever a hundred years cookie clicker, all day long forever, forever a hundred times, over and over cookie clicker adventures dot com','','Time machine',7);
		order=1900;Game.TieredAchievement('Scientists baffled everywhere','','Antimatter condenser',7);
		order=2000;Game.TieredAchievement('Harmony of the spheres','','Prism',7);
		
		order=35000;
		new Game.Achievement('Last Chance to See',loc("Burst the near-extinct <b>shiny wrinkler</b>.")+'<q>You monster!</q>',[24,12]);Game.last.pool='shadow';
		
		order=10000;
		new Game.Achievement('Early bird',loc("Click a golden cookie <b>less than 1 second after it spawns</b>."),[10,14]);
		new Game.Achievement('Fading luck',loc("Click a golden cookie <b>less than 1 second before it dies</b>."),[10,14]);
		
		order=22100;
		new Game.Achievement('Eldeer',loc("Pop a reindeer <b>during an elder frenzy</b>."),[12,9]);
		
		order=21100;
		new Game.Achievement('Dude, sweet',loc("Harvest <b>%1 coalescing sugar lumps</b>.",7),[24,14]);
		new Game.Achievement('Sugar rush',loc("Harvest <b>%1 coalescing sugar lumps</b>.",30),[26,14]);
		new Game.Achievement('Year\'s worth of cavities',loc("Harvest <b>%1 coalescing sugar lumps</b>.",365)+'<q>My lumps my lumps my lumps.</q>',[29,14]);
		new Game.Achievement('Hand-picked',loc("Successfully harvest a coalescing sugar lump before it's ripe."),[28,14]);
		new Game.Achievement('Sugar sugar',loc("Harvest a <b>bifurcated sugar lump</b>."),[29,15]);
		new Game.Achievement('All-natural cane sugar',loc("Harvest a <b>golden sugar lump</b>."),[29,16]);Game.last.pool='shadow';
		new Game.Achievement('Sweetmeats',loc("Harvest a <b>meaty sugar lump</b>."),[29,17]);
		
		order=7002;
		new Game.Achievement('Tricentennial',loc("Have at least <b>%1 of everything</b>.",300)+'<q>Can\'t stop, won\'t stop. Probably should stop, though.</q>',[29,12]);
		
		Game.CpsAchievement('Knead for speed','How did we not make that one yet?');
		Game.CpsAchievement('Well the cookies start coming and they don\'t stop coming','Didn\'t make sense not to click for fun.');
		Game.CpsAchievement('I don\'t know if you\'ve noticed but all these icons are very slightly off-center');
		Game.CpsAchievement('The proof of the cookie is in the baking','How can you have any cookies if you don\'t bake your dough?');
		Game.CpsAchievement('If it\'s worth doing, it\'s worth overdoing');
		
		Game.BankAchievement('The dreams in which I\'m baking are the best I\'ve ever had');
		Game.BankAchievement('Set for life');
		
		order=1200;Game.TieredAchievement('You and the beanstalk','','Farm',8);
		order=1300;Game.TieredAchievement('Romancing the stone','','Mine',8);
		order=1400;Game.TieredAchievement('Ex machina','','Factory',8);
		order=1425;Game.TieredAchievement('And I need it now','','Bank',8);
		order=1450;Game.TieredAchievement('Pray on the weak','','Temple',8);
		order=1475;Game.TieredAchievement('It\'s a kind of magic','','Wizard tower',8);
		order=1500;Game.TieredAchievement('Make it so','','Shipment',8);
		order=1600;Game.TieredAchievement('All that glitters is gold','','Alchemy lab',8);
		order=1700;Game.TieredAchievement('H̸̷͓̳̳̯̟͕̟͍͍̣͡ḛ̢̦̰̺̮̝͖͖̘̪͉͘͡ ̠̦͕̤̪̝̥̰̠̫̖̣͙̬͘ͅC̨̦̺̩̲̥͉̭͚̜̻̝̣̼͙̮̯̪o̴̡͇̘͎̞̲͇̦̲͞͡m̸̩̺̝̣̹̱͚̬̥̫̳̼̞̘̯͘ͅẹ͇̺̜́̕͢s̶̙̟̱̥̮̯̰̦͓͇͖͖̝͘͘͞','','Portal',8);
		order=1800;Game.TieredAchievement('Way back then','','Time machine',8);
		order=1900;Game.TieredAchievement('Exotic matter','','Antimatter condenser',8);
		order=2000;Game.TieredAchievement('At the end of the tunnel','','Prism',8);
		
		
		
		order=1070;
		Game.ProductionAchievement('Click (starring Adam Sandler)','Cursor',3,0,7);
		order=1120;
		Game.ProductionAchievement('Frantiquities','Grandma',3,0,6);
		order=1220;
		Game.ProductionAchievement('Overgrowth','Farm',3);
		order=1320;
		Game.ProductionAchievement('Sedimentalism','Mine',3);
		order=1420;
		Game.ProductionAchievement('Labor of love','Factory',3);
		order=1445;
		Game.ProductionAchievement('Reverse funnel system','Bank',3);
		order=1470;
		Game.ProductionAchievement('Thus spoke you','Temple',3);
		order=1495;
		Game.ProductionAchievement('Manafest destiny','Wizard tower',3);
		order=1520;
		Game.ProductionAchievement('Neither snow nor rain nor heat nor gloom of night','Shipment',3);
		order=1620;
		Game.ProductionAchievement('I\'ve got the Midas touch','Alchemy lab',3);
		order=1720;
		Game.ProductionAchievement('Which eternal lie','Portal',3);
		order=1820;
		Game.ProductionAchievement('D&eacute;j&agrave; vu','Time machine',3);
		order=1920;
		Game.ProductionAchievement('Powers of Ten','Antimatter condenser',3);
		order=2020;
		Game.ProductionAchievement('Now the dark days are gone','Prism',3);
		
		order=1070;
		new Game.Achievement('Freaky jazz hands','',[0,26]);Game.Objects['Cursor'].levelAchiev10=Game.last;
		order=1120;
		new Game.Achievement('Methuselah','',[1,26]);Game.Objects['Grandma'].levelAchiev10=Game.last;
		order=1220;
		new Game.Achievement('Huge tracts of land','',[2,26]);Game.Objects['Farm'].levelAchiev10=Game.last;
		order=1320;
		new Game.Achievement('D-d-d-d-deeper','',[3,26]);Game.Objects['Mine'].levelAchiev10=Game.last;
		order=1420;
		new Game.Achievement('Patently genius','',[4,26]);Game.Objects['Factory'].levelAchiev10=Game.last;
		order=1445;
		new Game.Achievement('A capital idea','',[15,26]);Game.Objects['Bank'].levelAchiev10=Game.last;
		order=1470;
		new Game.Achievement('It belongs in a bakery','',[16,26]);Game.Objects['Temple'].levelAchiev10=Game.last;
		order=1495;
		new Game.Achievement('Motormouth','',[17,26]);Game.Objects['Wizard tower'].levelAchiev10=Game.last;
		order=1520;
		new Game.Achievement('Been there done that','',[5,26]);Game.Objects['Shipment'].levelAchiev10=Game.last;
		order=1620;
		new Game.Achievement('Phlogisticated substances','',[6,26]);Game.Objects['Alchemy lab'].levelAchiev10=Game.last;
		order=1720;
		new Game.Achievement('Bizarro world','',[7,26]);Game.Objects['Portal'].levelAchiev10=Game.last;
		order=1820;
		new Game.Achievement('The long now','',[8,26]);Game.Objects['Time machine'].levelAchiev10=Game.last;
		order=1920;
		new Game.Achievement('Chubby hadrons','',[13,26]);Game.Objects['Antimatter condenser'].levelAchiev10=Game.last;
		order=2020;
		new Game.Achievement('Palettable','',[14,26]);Game.Objects['Prism'].levelAchiev10=Game.last;
		
		order=61470;
		order=61495;
		new Game.Achievement('Bibbidi-bobbidi-boo',loc("Cast <b>%1</b> spells.",9),[21,11]);
		new Game.Achievement('I\'m the wiz',loc("Cast <b>%1</b> spells.",99),[22,11]);
		new Game.Achievement('A wizard is you',loc("Cast <b>%1</b> spells.",999)+'<q>I\'m a what?</q>',[29,11]);
		
		order=10000;
		new Game.Achievement('Four-leaf cookie',loc("Have <b>%1</b> golden cookies simultaneously.",4)+'<q>Fairly rare, considering cookies don\'t even have leaves.</q>',[27,6]);Game.last.pool='shadow';
		
		order=2100;
		Game.TieredAchievement('Lucked out','','Chancemaker',1);
		Game.TieredAchievement('What are the odds','','Chancemaker',2);
		Game.TieredAchievement('Grandma needs a new pair of shoes','','Chancemaker',3);
		Game.TieredAchievement('Million to one shot, doc','','Chancemaker',4);
		Game.TieredAchievement('As luck would have it','','Chancemaker',5);
		Game.TieredAchievement('Ever in your favor','','Chancemaker',6);
		Game.TieredAchievement('Be a lady','','Chancemaker',7);
		Game.TieredAchievement('Dicey business','','Chancemaker',8);
		
		order=2120;
		Game.ProductionAchievement('Fingers crossed','Chancemaker',1);
		Game.ProductionAchievement('Just a statistic','Chancemaker',2);
		Game.ProductionAchievement('Murphy\'s wild guess','Chancemaker',3);
		
		new Game.Achievement('Let\'s leaf it at that','',[19,26]);Game.Objects['Chancemaker'].levelAchiev10=Game.last;
		
		order=1000;
		new Game.Achievement('The ultimate clickdown',loc("Make <b>%1</b> from clicking.",loc("%1 cookie",LBeautify(1e21)))+'<q>(of ultimate destiny.)</q>',[11,19]);
		
		
		order=1100;
		Game.TieredAchievement('Aged well','','Grandma',9);
		Game.TieredAchievement('101st birthday','','Grandma',10);
		Game.TieredAchievement('But wait \'til you get older','','Grandma',11);
		order=1200;Game.TieredAchievement('Harvest moon','','Farm',9);
		order=1300;Game.TieredAchievement('Mine?','','Mine',9);
		order=1400;Game.TieredAchievement('In full gear','','Factory',9);
		order=1425;Game.TieredAchievement('Treacle tart economics','','Bank',9);
		order=1450;Game.TieredAchievement('Holy cookies, grandma!','','Temple',9);
		order=1475;Game.TieredAchievement('The Prestige','<q>(Unrelated to the Cookie Clicker feature of the same name.)</q>','Wizard tower',9);
		order=1500;Game.TieredAchievement('That\'s just peanuts to space','','Shipment',9);
		order=1600;Game.TieredAchievement('Worth its weight in lead','','Alchemy lab',9);
		order=1700;Game.TieredAchievement('What happens in the vortex stays in the vortex','','Portal',9);
		order=1800;Game.TieredAchievement('Invited to yesterday\'s party','','Time machine',9);
		order=1900;Game.TieredAchievement('Downsizing','','Antimatter condenser',9);//the trailer got me really hyped up but i've read some pretty bad reviews. is it watchable ? is it worth seeing ? i don't mind matt damon
		order=2000;Game.TieredAchievement('My eyes','','Prism',9);
		order=2100;Game.TieredAchievement('Maybe a chance in hell, actually','','Chancemaker',9);
		
		order=1200;Game.TieredAchievement('Make like a tree','','Farm',10);
		order=1300;Game.TieredAchievement('Cave story','','Mine',10);
		order=1400;Game.TieredAchievement('In-cog-neato','','Factory',10);
		order=1425;Game.TieredAchievement('Save your breath because that\'s all you\'ve got left','','Bank',10);
		order=1450;Game.TieredAchievement('Vengeful and almighty','','Temple',10);
		order=1475;Game.TieredAchievement('Spell it out for you','','Wizard tower',10);
		order=1500;Game.TieredAchievement('Space space space space space','<q>It\'s too far away...</q>','Shipment',10);
		order=1600;Game.TieredAchievement('Don\'t get used to yourself, you\'re gonna have to change','','Alchemy lab',10);
		order=1700;Game.TieredAchievement('Objects in the mirror dimension are closer than they appear','','Portal',10);
		order=1800;Game.TieredAchievement('Groundhog day','','Time machine',10);
		order=1900;Game.TieredAchievement('A matter of perspective','','Antimatter condenser',10);
		order=2000;Game.TieredAchievement('Optical illusion','','Prism',10);
		order=2100;Game.TieredAchievement('Jackpot','','Chancemaker',10);
		
		order=36000;
		new Game.Achievement('So much to do so much to see',loc("Manage a cookie legacy for <b>at least a year</b>.")+'<q>Thank you so much for playing Cookie Clicker!</q>',[23,11]);Game.last.pool='shadow';
		
		
		
		Game.CpsAchievement('Running with scissors');
		Game.CpsAchievement('Rarefied air');
		Game.CpsAchievement('Push it to the limit');
		Game.CpsAchievement('Green cookies sleep furiously');
		
		Game.BankAchievement('Panic! at Nabisco');
		Game.BankAchievement('Bursting at the seams');
		Game.BankAchievement('Just about full');
		Game.BankAchievement('Hungry for more');
		
		order=1000;
		new Game.Achievement('All the other kids with the pumped up clicks',loc("Make <b>%1</b> from clicking.",loc("%1 cookie",LBeautify(1e23))),[11,28]);
		new Game.Achievement('One...more...click...',loc("Make <b>%1</b> from clicking.",loc("%1 cookie",LBeautify(1e25))),[11,30]);
		
		order=61515;
		new Game.Achievement('Botany enthusiast',loc("Harvest <b>%1</b> mature garden plants.",100),[26,20]);
		new Game.Achievement('Green, aching thumb',loc("Harvest <b>%1</b> mature garden plants.",1000),[27,20]);
		new Game.Achievement('In the garden of Eden (baby)',loc("Fill every tile of the biggest garden plot with plants.")+'<q>Isn\'t tending to those precious little plants just so rock and/or roll?</q>',[28,20]);
		
		new Game.Achievement('Keeper of the conservatory',loc("Unlock every garden seed."),[25,20]);
		new Game.Achievement('Seedless to nay',loc("Convert a complete seed log into sugar lumps by sacrificing your garden to the sugar hornets.<div class=\"line\"></div>Owning this achievement makes seeds <b>%1% cheaper</b>, plants mature <b>%2% sooner</b>, and plant upgrades drop <b>%3% more</b>.",[5,5,5]),[29,20]);
		
		order=30050;
		new Game.Achievement('You get nothing',loc("Ascend with <b>%1</b> baked.",loc("%1 cookie",LBeautify(1e36)))+'<q>Good day sir!</q>',[29,6]);
		new Game.Achievement('Humble rebeginnings',loc("Ascend with <b>%1</b> baked.",loc("%1 cookie",LBeautify(1e39)))+'<q>Started from the bottom, now we\'re here.</q>',[29,6]);
		new Game.Achievement('The end of the world',loc("Ascend with <b>%1</b> baked.",loc("%1 cookie",LBeautify(1e42)))+'<q>(as we know it)</q>',[21,25]);
		new Game.Achievement('Oh, you\'re back',loc("Ascend with <b>%1</b> baked.",loc("%1 cookie",LBeautify(1e45)))+'<q>Missed us?</q>',[21,25]);
		new Game.Achievement('Lazarus',loc("Ascend with <b>%1</b> baked.",loc("%1 cookie",LBeautify(1e48)))+'<q>All rise.</q>',[21,25]);
		
		Game.CpsAchievement('Leisurely pace');
		Game.CpsAchievement('Hypersonic');
		
		Game.BankAchievement('Feed me, Orteil');
		Game.BankAchievement('And then what?');
		
		order=7002;
		new Game.Achievement('Tricentennial and a half',loc("Have at least <b>%1 of everything</b>.",350)+'<q>(it\'s free real estate)</q>',[21,26]);
		new Game.Achievement('Quadricentennial',loc("Have at least <b>%1 of everything</b>.",400)+'<q>You\'ve had to do horrible things to get this far.<br>Horrible... horrible things.</q>',[22,26]);
		new Game.Achievement('Quadricentennial and a half',loc("Have at least <b>%1 of everything</b>.",450)+'<q>At this point, you might just be compensating for something.</q>',[23,26]);
		
		new Game.Achievement('Quincentennial',loc("Have at least <b>%1 of everything</b>.",500)+'<q>Some people would say you\'re halfway there.<br>We do not care for those people and their reckless sense of unchecked optimism.</q>',[29,25]);
		
		order=21100;
		new Game.Achievement('Maillard reaction',loc("Harvest a <b>caramelized sugar lump</b>."),[29,27]);
		
		order=30250;
		new Game.Achievement('When the cookies ascend just right',loc("Ascend with exactly <b>%1</b>.",loc("%1 cookie",LBeautify(1e12))),[25,7]);Game.last.pool='shadow';//this achievement is shadow because it is only achievable through blind luck or reading external guides; this may change in the future
		
		
		order=1050;
		new Game.Achievement('With her finger and her thumb',loc("Have <b>%1</b>.",loc("%1 cursor",LBeautify(600))),[0,16]);
		
		order=1100;Game.TieredAchievement('Defense of the ancients','','Grandma',12);
		order=1200;Game.TieredAchievement('Sharpest tool in the shed','','Farm',11);
		order=1300;Game.TieredAchievement('Hey now, you\'re a rock','','Mine',11);
		order=1400;Game.TieredAchievement('Break the mold','','Factory',11);
		order=1425;Game.TieredAchievement('Get the show on, get paid','','Bank',11);
		order=1450;Game.TieredAchievement('My world\'s on fire, how about yours','','Temple',11);
		order=1475;Game.TieredAchievement('The meteor men beg to differ','','Wizard tower',11);
		order=1500;Game.TieredAchievement('Only shooting stars','','Shipment',11);
		order=1600;Game.TieredAchievement('We could all use a little change','','Alchemy lab',11);//"all that glitters is gold" was already an achievement
		order=1700;Game.TieredAchievement('Your brain gets smart but your head gets dumb','','Portal',11);
		order=1800;Game.TieredAchievement('The years start coming','','Time machine',11);
		order=1900;Game.TieredAchievement('What a concept','','Antimatter condenser',11);
		order=2000;Game.TieredAchievement('You\'ll never shine if you don\'t glow','','Prism',11);
		order=2100;Game.TieredAchievement('You\'ll never know if you don\'t go','','Chancemaker',11);
		
		order=2200;
		Game.TieredAchievement('Self-contained','','Fractal engine',1);
		Game.TieredAchievement('Threw you for a loop','','Fractal engine',2);
		Game.TieredAchievement('The sum of its parts','','Fractal engine',3);
		Game.TieredAchievement('Bears repeating','<q>Where did these come from?</q>','Fractal engine',4);
		Game.TieredAchievement('More of the same','','Fractal engine',5);
		Game.TieredAchievement('Last recurse','','Fractal engine',6);
		Game.TieredAchievement('Out of one, many','','Fractal engine',7);
		Game.TieredAchievement('An example of recursion','','Fractal engine',8);
		Game.TieredAchievement('For more information on this achievement, please refer to its title','','Fractal engine',9);
		Game.TieredAchievement('I\'m so meta, even this achievement','','Fractal engine',10);
		Game.TieredAchievement('Never get bored','','Fractal engine',11);
		
		order=2220;
		Game.ProductionAchievement('The needs of the many','Fractal engine',1);
		Game.ProductionAchievement('Eating its own','Fractal engine',2);
		Game.ProductionAchievement('We must go deeper','Fractal engine',3);
		
		new Game.Achievement('Sierpinski rhomboids','',[20,26]);Game.Objects['Fractal engine'].levelAchiev10=Game.last;
		
		Game.CpsAchievement('Gotta go fast');
		Game.BankAchievement('I think it\'s safe to say you\'ve got it made');
		
		order=6002;
		new Game.Achievement('Renaissance baker',loc("Own <b>%1</b> upgrades and <b>%2</b> buildings.",[400,8000])+'<q>If you have seen further, it is by standing on the shoulders of giants - a mysterious species of towering humanoids until now thought long-extinct.</q>',[10,10]);
		
		order=1098;
		new Game.Achievement('Veteran',loc("Own at least <b>%1</b> grandma types.",14)+'<q>14\'s a crowd!</q>',[10,9]);
		
		order=10000;
		new Game.Achievement('Thick-skinned',loc("Have your <b>reinforced membrane</b> protect the <b>shimmering veil</b>."),[7,10]);
		
		
		order=2300;
		Game.TieredAchievement('F12','','Javascript console',1);
		Game.TieredAchievement('Variable success','','Javascript console',2);
		Game.TieredAchievement('No comments','','Javascript console',3);
		Game.TieredAchievement('Up to code','','Javascript console',4);
		Game.TieredAchievement('Works on my machine','','Javascript console',5);
		Game.TieredAchievement('Technical debt','','Javascript console',6);
		Game.TieredAchievement('Mind your language','','Javascript console',7);
		Game.TieredAchievement('Inconsolable','','Javascript console',8);
		Game.TieredAchievement('Closure','','Javascript console',9);
		Game.TieredAchievement('Dude what if we\'re all living in a simulation like what if we\'re all just code on a computer somewhere','','Javascript console',10);
		Game.TieredAchievement('Taking the back streets','','Javascript console',11);
		
		order=2320;
		Game.ProductionAchievement('Inherited prototype','Javascript console',1);
		Game.ProductionAchievement('A model of document object','Javascript console',2);
		Game.ProductionAchievement('First-class citizen','Javascript console',3);
		
		new Game.Achievement('Alexandria','',[32,26]);Game.Objects['Javascript console'].levelAchiev10=Game.last;
		
		Game.CpsAchievement('Bake him away, toys');
		Game.CpsAchievement('You\'re #1 so why try harder');
		Game.CpsAchievement('Haven\'t even begun to peak');
		Game.BankAchievement('A sometimes food');
		Game.BankAchievement('Not enough of a good thing');
		Game.BankAchievement('Horn of plenty');
		
		order=30050;
		new Game.Achievement('Smurf account',loc("Ascend with <b>%1</b> baked.",loc("%1 cookie",LBeautify(1e51)))+'<q>It\'s like you just appeared out of the blue!</q>',[21,32]);
		new Game.Achievement('If at first you don\'t succeed',loc("Ascend with <b>%1</b> baked.",loc("%1 cookie",LBeautify(1e54)))+'<q>If at first you don\'t succeed, try, try, try again.<br>But isn\'t that the definition of insanity?</q>',[21,32]);
		
		order=33000;
		new Game.Achievement('O Fortuna',loc("Own every <b>fortune upgrade</b>.<div class=\"line\"></div>Owning this achievement makes fortunes appear <b>twice as often</b>; unlocked fortune upgrades also have a <b>%1% chance</b> to carry over after ascending.",40),[29,8]);
		
		order=61615;
		new Game.Achievement('Initial public offering',loc("Make your first stock market profit."),[0,33]);
		new Game.Achievement('Rookie numbers',loc("Own at least <b>%1</b> of every stock market good.",100)+'<q>Gotta pump those numbers up!</q>',[9,33]);
		new Game.Achievement('No nobility in poverty',loc("Own at least <b>%1</b> of every stock market good.",500)+'<q>What kind of twisted individual is out there cramming camels through needle holes anyway?</q>',[10,33]);
		new Game.Achievement('Full warehouses',loc("Own at least <b>%1</b> of a stock market good.",1000),[11,33]);
		new Game.Achievement('Make my day',loc("Make <b>a day</b> of CpS ($%1) in 1 stock market sale.",86400),[1,33]);
		new Game.Achievement('Buy buy buy',loc("Spend <b>a day</b> of CpS ($%1) in 1 stock market purchase.",86400),[1,33]);
		new Game.Achievement('Gaseous assets',loc("Have your stock market profits surpass <b>a whole year</b> of CpS ($%1).",31536000)+'<q>Boy, how volatile!</q>',[18,33]);Game.last.pool='shadow';
		new Game.Achievement('Pyramid scheme',loc("Unlock the <b>highest-tier</b> stock market headquarters."),[18,33]);
		
		order=10000;
		new Game.Achievement('Jellicles',loc("Own <b>%1</b> kitten upgrades.",10)+'<q>Jellicles can and jellicles do! Make sure to wash your jellicles every day!</q>',[18,19]);
		
		order=7002;
		new Game.Achievement('Quincentennial and a half',loc("Have at least <b>%1 of everything</b>.",550)+'<q>This won\'t fill the churning void inside, you know.</q>',[29,26]);
		
		Game.CpsAchievement('What did we even eat before these');
		Game.CpsAchievement('Heavy flow');
		Game.CpsAchievement('More you say?');
		Game.BankAchievement('Large and in charge');
		Game.BankAchievement('Absolutely stuffed');
		Game.BankAchievement('It\'s only wafer-thin','Just the one!');
		
		order=1000;new Game.Achievement('Clickety split',loc("Make <b>%1</b> from clicking.",loc("%1 cookie",LBeautify(1e27))),[11,31]);
		order=1050;new Game.Achievement('Gotta hand it to you',loc("Have <b>%1</b>.",loc("%1 cursor",LBeautify(700))),[0,17]);
		order=1100;Game.TieredAchievement('Okay boomer','','Grandma',13);
		order=1200;Game.TieredAchievement('Overripe','','Farm',12);
		order=1300;Game.TieredAchievement('Rock on','','Mine',12);
		order=1400;Game.TieredAchievement('Self-manmade man','','Factory',12);
		order=1425;Game.TieredAchievement('Checks out','','Bank',12);
		order=1450;Game.TieredAchievement('Living on a prayer','','Temple',12);
		order=1475;Game.TieredAchievement('Higitus figitus migitus mum','','Wizard tower',12);
		order=1500;Game.TieredAchievement('The incredible journey','','Shipment',12);
		order=1600;Game.TieredAchievement('Just a phase','','Alchemy lab',12);
		order=1700;Game.TieredAchievement('Don\'t let me leave, Murph','','Portal',12);
		order=1800;Game.TieredAchievement('Caveman to cosmos','','Time machine',12);
		order=1900;Game.TieredAchievement('Particular tastes','','Antimatter condenser',12);
		order=2000;Game.TieredAchievement('A light snack','','Prism',12);
		order=2100;Game.TieredAchievement('Tempting fate','','Chancemaker',12);
		order=2200;Game.TieredAchievement('Tautological','','Fractal engine',12);
		order=2300;Game.TieredAchievement('Curly braces','<q>Or as the French call them, mustache boxes.<br>Go well with quotes.</q>','Javascript console',12);
		
		order=10000;
		new Game.Achievement('Seven horseshoes',loc("Click <b>%1</b>.",loc("%1 golden cookie",LBeautify(27777)))+'<q>Enough for one of those funky horses that graze near your factories.</q>',[21,33]);Game.last.pool='shadow';
		
		order=11005;
		new Game.Achievement('Olden days',loc("Find the <b>forgotten madeleine</b>.")+'<q>DashNet Farms remembers.</q>',[12,3]);
		
		
		order=1050;new Game.Achievement('The devil\'s workshop',loc("Have <b>%1</b>.",loc("%1 cursor",LBeautify(800))),[0,18]);
		order=1200;Game.TieredAchievement('In the green','','Farm',13);
		order=1300;Game.TieredAchievement('Mountain out of a molehill, but like in a good way','','Mine',13);
		order=1400;Game.TieredAchievement('The wheels of progress','','Factory',13);
		order=1425;Game.TieredAchievement('That\'s rich','','Bank',13);
		order=1450;Game.TieredAchievement('Preaches and cream','','Temple',13);
		order=1475;Game.TieredAchievement('Magic thinking','','Wizard tower',13);
		order=1500;Game.TieredAchievement('Is there life on Mars?','<q>Yes, there is. You\'re currently using it as filling in experimental flavor prototype #810657.</q>','Shipment',13);
		order=1600;Game.TieredAchievement('Bad chemistry','','Alchemy lab',13);
		order=1700;Game.TieredAchievement('Reduced to gibbering heaps','','Portal',13);
		order=1800;Game.TieredAchievement('Back already?','','Time machine',13);
		order=1900;Game.TieredAchievement('Nuclear throne','','Antimatter condenser',13);
		order=2000;Game.TieredAchievement('Making light of the situation','','Prism',13);
		order=2100;Game.TieredAchievement('Flip a cookie. Chips, I win. Crust, you lose.','','Chancemaker',13);
		order=2200;Game.TieredAchievement('In and of itself','','Fractal engine',13);
		order=2300;Game.TieredAchievement('Duck typing','<q>Hello, this is a duck typing. Got any grapes?</q>','Javascript console',13);
		
		order=2400;
		Game.TieredAchievement('They\'ll never know what hit \'em','','Idleverse',1);
		Game.TieredAchievement('Well-versed','','Idleverse',2);
		Game.TieredAchievement('Ripe for the picking','','Idleverse',3);
		Game.TieredAchievement('Unreal','','Idleverse',4);
		Game.TieredAchievement('Once you\'ve seen one','','Idleverse',5);
		Game.TieredAchievement('Spoils and plunder','','Idleverse',6);
		Game.TieredAchievement('Nobody exists on purpose, nobody belongs anywhere','<q>Come watch TV?</q>','Idleverse',7);
		Game.TieredAchievement('Hyperspace expressway','','Idleverse',8);
		Game.TieredAchievement('Versatile','','Idleverse',9);
		Game.TieredAchievement('You are inevitable','','Idleverse',10);
		Game.TieredAchievement('Away from this place','','Idleverse',11);
		Game.TieredAchievement('Everywhere at once','','Idleverse',12);
		Game.TieredAchievement('Reject reality, substitute your own','','Idleverse',13);
		
		order=2420;
		Game.ProductionAchievement('Fringe','Idleverse',1);
		Game.ProductionAchievement('Coherence','Idleverse',2);
		Game.ProductionAchievement('Earth-616','Idleverse',3);
		
		new Game.Achievement('Strange topologies','',[33,26]);Game.Objects['Idleverse'].levelAchiev10=Game.last;
		
		order=5000;
		new Game.Achievement('Grand design',loc("Own <b>%1</b>.",loc("%1 building",LBeautify(5000)))+'<q>They\'ll remember you forever!</q>',[32,12]);
		new Game.Achievement('Ecumenopolis',loc("Own <b>%1</b>.",loc("%1 building",LBeautify(7500)))+'<q>Getting a wee bit cramped.</q>',[33,12]);
		
		order=6000;
		new Game.Achievement('The full picture',loc("Purchase <b>%1</b>.",loc("%1 upgrade",LBeautify(300)))+'<q>So that\'s where that fits in!</q>',[32,11]);
		new Game.Achievement('When there\'s nothing left to add',loc("Purchase <b>%1</b>.",loc("%1 upgrade",LBeautify(400)))+'<q>...keep going.</q>',[33,11]);
		
		order=7002;
		new Game.Achievement('Sexcentennial',loc("Have at least <b>%1 of everything</b>.",600)+'<q>Hey, nice milestone!</q>',[31,33]);
		
		Game.CpsAchievement('Keep going until I say stop');
		Game.CpsAchievement('But I didn\'t say stop, did I?');
		Game.CpsAchievement('With unrivaled fervor');
		Game.BankAchievement('Think big');
		Game.BankAchievement('Hypersize me');
		Game.BankAchievement('Max capacity');
		
		order=61616;
		new Game.Achievement('Liquid assets',loc("Have your stock market profits surpass <b>$%1</b>.",1e7),[12,33]);
		
		order=11000;
		new Game.Achievement('Stifling the press',loc("Squish the news ticker flat, then click on it.")+'<q>Narrow in here or is it just me?</q>',[27,7]);
		
		
		order=2500;
		Game.TieredAchievement('It\'s big brain time','','Cortex baker',1);
		Game.TieredAchievement('Just my imagination','','Cortex baker',2);
		Game.TieredAchievement('Now there\'s an idea','','Cortex baker',3);
		Game.TieredAchievement('The organ that named itself','','Cortex baker',4);
		Game.TieredAchievement('Gyrification','','Cortex baker',5);
		Game.TieredAchievement('A trademarked portmanteau of "imagination" and "engineering"','','Cortex baker',6);
		Game.TieredAchievement('Mindfulness','','Cortex baker',7);
		Game.TieredAchievement('The 10% myth','','Cortex baker',8);
		Game.TieredAchievement('Don\'t think about it too hard','','Cortex baker',9);
		Game.TieredAchievement('Though fools seldom differ','','Cortex baker',10);
		Game.TieredAchievement('Looking kind of dumb','','Cortex baker',11);
		Game.TieredAchievement('A beautiful mind','','Cortex baker',12);
		Game.TieredAchievement('Cardinal synapses','','Cortex baker',13);
		
		order=2520;
		Game.ProductionAchievement('Positive thinking','Cortex baker',1);
		Game.ProductionAchievement('The thought that counts','Cortex baker',2);
		Game.ProductionAchievement('Unthinkable','Cortex baker',3);
		
		new Game.Achievement('Gifted','',[34,26]);Game.Objects['Cortex baker'].levelAchiev10=Game.last;
		
		
		order=1100;Game.TieredAchievement('They moistly come at night','','Grandma',14);
		order=1200;Game.TieredAchievement('It\'s grown on you','','Farm',14);
		order=1300;Game.TieredAchievement('Don\'t let the walls cave in on you','','Mine',14);
		order=1400;Game.TieredAchievement('Replaced by robots','','Factory',14);
		order=1425;Game.TieredAchievement('Financial prodigy','<q>Imagine how it would be, to be at the top making cash money.</q>','Bank',14);
		order=1450;Game.TieredAchievement('And I will pray to a big god','','Temple',14);
		order=1475;Game.TieredAchievement('Shosple Colupis','','Wizard tower',14);
		order=1500;Game.TieredAchievement('False vacuum','','Shipment',14);
		order=1600;Game.TieredAchievement('Metallic taste','','Alchemy lab',14);
		order=1700;Game.TieredAchievement('Swiss cheese','','Portal',14);
		order=1800;Game.TieredAchievement('But the future refused to change','','Time machine',14);
		order=1900;Game.TieredAchievement('What\'s the dark matter with you','','Antimatter condenser',14);
		order=2000;Game.TieredAchievement('Enlightenment','','Prism',14);
		order=2100;Game.TieredAchievement('Never tell me the odds','','Chancemaker',14);
		order=2200;Game.TieredAchievement('Blowing an Apollonian gasket','','Fractal engine',14);
		order=2300;Game.TieredAchievement('Get with the program','','Javascript console',14);
		order=2400;Game.TieredAchievement('Lost your cosmic marbles','','Idleverse',14);
		order=2500;Game.TieredAchievement('By will alone I set my mind in motion','','Cortex baker',14);
		
		order=1000;new Game.Achievement('Ain\'t that a click in the head',loc("Make <b>%1</b> from clicking.",loc("%1 cookie",LBeautify(1e29))),[11,34]);
		
		order=7002;
		new Game.Achievement('Sexcentennial and a half',loc("Have at least <b>%1 of everything</b>.",650)+'<q>Hope you\'re enjoying the grind so far! It gets worse.</q>',[21,34]);
		
		Game.CpsAchievement('I am speed');
		Game.CpsAchievement('And on and on');
		Game.BankAchievement('Fake it till you bake it');
		Game.BankAchievement('History in the baking');
		
		order=22100;new Game.Achievement('Baby it\'s old outside',loc("Click one of Santa's helper grandmas during Christmas season."),[10,9]);
		
		order=5000;
		new Game.Achievement('Myriad',loc("Own <b>%1</b>.",loc("%1 building",LBeautify(10000)))+'<q>At this point, most of your assets lie in real estate.</q>',[31,6]);
		
		order=6000;
		new Game.Achievement('Kaizen',loc("Purchase <b>%1</b>.",loc("%1 upgrade",LBeautify(500)))+'<q>Just a little more.</q>',[31,5]);
		new Game.Achievement('Beyond quality',loc("Purchase <b>%1</b>.",loc("%1 upgrade",LBeautify(600)))+'<q>Dwarfing all of mankind\'s accomplishments.</q>',[32,5]);
		
		Game.CpsAchievement('Everything happens so much');
		Game.CpsAchievement('I\'ll rest when I\'m dead');
		Game.BankAchievement('What do you get for the baker who has everything');
		Game.BankAchievement('Bottomless pit');
		
		order=6001;
		new Game.Achievement('All the stars in heaven',loc("Own <b>%1</b> heavenly upgrades.",100),[30,5]);

		// CC3 expansion achievements are appended so existing achievement ids
		// remain stable for imported saves.
		order=1200;
		Game.TieredAchievement('Cat nap council','','Cats',1);
		Game.TieredAchievement('Purrfectly populated','','Cats',5);
		Game.TieredAchievement('Nine lives, nine rows','','Cats',10);
		Game.ProductionAchievement('The purrduction line','Cats',1);
		new Game.Achievement('A cat for every cushion',loc("Own <b>%1</b> cats.",100),[0,26]);
		new Game.Achievement('The whole litter',loc("Own <b>%1</b> cats.",450),[1,26]);

		order=1200;
		new Game.Achievement('Barnstormer',loc("Own <b>%1</b> farms.",25),[2,26]);
		new Game.Achievement('A field of dreams',loc("Own <b>%1</b> farms.",100),[3,26]);
		Game.ProductionAchievement('From barn to bakery','Farm',4);
		
		//end of achievements
}
