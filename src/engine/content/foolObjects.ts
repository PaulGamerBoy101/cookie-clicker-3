/**
 * content/foolObjects.ts — the foolObjects joke-business map + its localization loop.
 *
 * Ported verbatim from the 2.048 engine (engine/main.ts, the Game.foolObjects
 * block immediately after the building declarations inside Game.Init). Same
 * map data, same `if (true)//if (!EN)` localization loop, same position in
 * Init — only the file moved, and the bare globals (loc,
 * FindLocStringByPart) now resolve through the typed boundary.
 *
 * The engine calls declareVanillaFoolObjects(Game) from Game.Init (which the
 * asset-Loader guarantees runs exactly once per page load), so the loop reads
 * Game.Objects through the same Game object the original bare-global
 * reference resolved to.
 */
import type { Game as EngineGame } from "../types";

/** Declare the foolObjects map and run its localization loop on it. */
export function declareVanillaFoolObjects(Game: EngineGame) {
		Game.foolObjects={
			'Unknown':{name:'Investment',desc:'You\'re not sure what this does, you just know it means profit.',icon:0},
			'Cursor':{name:'Rolling pin',desc:'Essential in flattening dough. The first step in cookie-making.',icon:0},
			'Grandma':{name:'Oven',desc:'A crucial element of baking cookies.',icon:1},
			'Farm':{name:'Kitchen',desc:'The more kitchens, the more cookies your employees can produce.',icon:2},
			'Mine':{name:'Secret recipe',desc:'These give you the edge you need to outsell those pesky competitors.',icon:3},
			'Factory':{name:'Factory',desc:'Mass production is the future of baking. Seize the day, and synergize!',icon:4},
			'Bank':{name:'Investor',desc:'Business folks with a nose for profit, ready to finance your venture as long as there\'s money to be made.',icon:5},
			'Temple':{name:'Like',desc:'Your social media page is going viral! Amassing likes is the key to a lasting online presence and juicy advertising deals.',icon:9},
			'Wizard tower':{name:'Meme',desc:'Cookie memes are all the rage! With just the right amount of social media astroturfing, your brand image will be all over the cyberspace.',icon:6},
			'Shipment':{name:'Supermarket',desc:'A gigantic cookie emporium - your very own retail chain.',icon:7},
			'Alchemy lab':{name:'Stock share',desc:'You\'re officially on the stock market, and everyone wants a piece!',icon:8},
			'Portal':{name:'TV show',desc:'Your cookies have their own sitcom! Hilarious baking hijinks set to the cheesiest laughtrack.',icon:10},
			'Time machine':{name:'Theme park',desc:'Cookie theme parks, full of mascots and roller-coasters. Build one, build a hundred!',icon:11},
			'Antimatter condenser':{name:'Cookiecoin',desc:'A virtual currency, already replacing regular money in some small countries.',icon:12},
			'Prism':{name:'Corporate country',desc:'You\'ve made it to the top, and you can now buy entire nations to further your corporate greed. Godspeed.',icon:13},
			'Chancemaker':{name:'Privatized planet',desc:'Actually, you know what\'s cool? A whole planet dedicated to producing, advertising, selling, and consuming your cookies.',icon:15},
			'Fractal engine':{name:'Senate seat',desc:'Only through political dominion can you truly alter this world to create a brighter, more cookie-friendly future.',icon:16},
			'Javascript console':{name:'Doctrine',desc:'Taking many forms -religion, culture, philosophy- a doctrine may, when handled properly, cause a lasting impact on civilizations, reshaping minds and people and ensuring all future generations share a singular goal - the production, and acquisition, of more cookies.',icon:17},
			'Idleverse':{name:'Lateral expansions',desc:'Sometimes the best way to keep going up is sideways. Diversify your ventures through non-cookie investments.',icon:18},
			'Cortex baker':{name:'Think tank',desc:'There\'s only so many ways you can bring in more profit. Or is there? Hire the most brilliant experts in the known universe and let them scrape their brains for you!',icon:19},
			'Cats':{name:'Cat cafe',desc:'A cozy little business where every customer leaves with more cookies than they came in with.',icon:1},
		};
		
		if (true)//if (!EN)
		{
			Game.foolObjects['Unknown'].name=loc("Investment");
			Game.foolObjects['Unknown'].desc=loc("You're not sure what this does, you just know it means profit.");
			for (var i in Game.Objects)
			{
				Game.foolObjects[i].name=loc(FindLocStringByPart(Game.Objects[i].name+' business name'))||Game.foolObjects[i].name;
				Game.foolObjects[i].desc=loc(FindLocStringByPart(Game.Objects[i].name+' business quote'))||Game.foolObjects[i].desc;
			}
		}
}
