/**
 * content/milks.ts — the vanilla milk definitions + their localization loop.
 *
 * Ported verbatim from the 2.048 engine (engine/main.ts, the Game.AllMilks
 * block + the Game.Milks build loop inside Game.Init, under "VISUAL
 * EFFECTS"). Same data, same loop, same Init position — only the file
 * moved. The engine calls declareVanillaMilks(Game) from Game.Init (which
 * the asset Loader guarantees runs exactly once per page load), so the
 * loop reads Game.AllMilks / writes Game.Milks / Game.Milk through the same
 * Game object the original bare-global reference resolved to.
 */
import type { Game as EngineGame } from "../types";

/** Declare the milk list and build the type-0 (milky) subset. */
export function declareVanillaMilks(Game: EngineGame) {
	Game.AllMilks=[
		{name:'Automatic',icon:[0,7],type:-1,pic:'milkPlain'},
		{name:'Plain milk',icon:[1,8],type:0,pic:'milkPlain'},
		{name:'Chocolate milk',icon:[2,8],type:0,pic:'milkChocolate'},
		{name:'Raspberry milk',icon:[3,8],type:0,pic:'milkRaspberry'},
		{name:'Orange milk',icon:[4,8],type:0,pic:'milkOrange'},
		{name:'Caramel milk',icon:[5,8],type:0,pic:'milkCaramel'},
		{name:'Banana milk',icon:[6,8],type:0,pic:'milkBanana'},
		{name:'Lime milk',icon:[7,8],type:0,pic:'milkLime'},
		{name:'Blueberry milk',icon:[8,8],type:0,pic:'milkBlueberry'},
		{name:'Strawberry milk',icon:[9,8],type:0,pic:'milkStrawberry'},
		{name:'Vanilla milk',icon:[10,8],type:0,pic:'milkVanilla'},
		{name:'Zebra milk',icon:[10,7],type:1,pic:'milkZebra'},
		{name:'Cosmic milk',icon:[9,7],type:1,pic:'milkStars'},
		{name:'Flaming milk',icon:[8,7],type:1,pic:'milkFire'},
		{name:'Sanguine milk',icon:[7,7],type:1,pic:'milkBlood'},
		{name:'Midas milk',icon:[6,7],type:1,pic:'milkGold'},
		{name:'Midnight milk',icon:[5,7],type:1,pic:'milkBlack'},
		{name:'Green inferno milk',icon:[4,7],type:1,pic:'milkGreenFire'},
		{name:'Frostfire milk',icon:[3,7],type:1,pic:'milkBlueFire'},
		{name:'Honey milk',icon:[21,23],type:0,pic:'milkHoney'},
		{name:'Coffee milk',icon:[22,23],type:0,pic:'milkCoffee'},
		{name:'Tea milk',icon:[23,23],type:0,pic:'milkTea'},
		{name:'Coconut milk',icon:[24,23],type:0,pic:'milkCoconut'},
		{name:'Cherry milk',icon:[25,23],type:0,pic:'milkCherry'},
		{name:'Soy milk',icon:[27,23],type:1,pic:'milkSoy'},
		{name:'Spiced milk',icon:[26,23],type:0,pic:'milkSpiced'},
		{name:'Maple milk',icon:[28,23],type:0,pic:'milkMaple'},
		{name:'Mint milk',icon:[29,23],type:0,pic:'milkMint'},
		{name:'Licorice milk',icon:[30,23],type:0,pic:'milkLicorice'},
		{name:'Rose milk',icon:[31,23],type:0,pic:'milkRose'},
		{name:'Dragonfruit milk',icon:[21,24],type:0,pic:'milkDragonfruit'},
		{name:'Melon milk',icon:[22,24],type:0,pic:'milkMelon'},
		{name:'Blackcurrant milk',icon:[23,24],type:0,pic:'milkBlackcurrant'},
	];
	
	Game.Milks=[];
	for (var i=0;i<Game.AllMilks.length;i++)
	{
		Game.AllMilks[i].bname=Game.AllMilks[i].name;
		Game.AllMilks[i].name=loc(Game.AllMilks[i].name);
		Game.AllMilks[i].pic+='.webp';
		if (Game.AllMilks[i].type==0)
		{
			Game.AllMilks[i].rank=Game.Milks.length;
			Game.Milks.push(Game.AllMilks[i]);
		}
	}
	Game.Milk=Game.Milks[0];
}
