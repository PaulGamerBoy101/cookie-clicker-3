/**
 * systems/bakeryName.ts — the engine's bakery-name system (Phase 6, slice 3).
 *
 * The 2.048 engine defined `Game.RandomBakeryName`, `Game.GetBakeryName`,
 * `Game.bakeryNameSet`, `Game.bakeryNameRefresh`, `Game.bakeryNamePrompt`
 * and `Game.bakeryNamePromptRandom` inside `Game.Init`. They are now typed
 * exports; the engine keeps the same `Game.X = X` slots at the exact
 * original Init positions, and keeps the state-init lines that sit between
 * them (`Game.bakeryNameL=l('bakeryName')`, the click binding, and the
 * initial `Game.bakeryNameSet(Game.GetBakeryName())` call).
 *
 * Bodies are verbatim (original indentation kept); only parameter
 * annotations were added (`:any` where call sites pass optional or
 * heterogeneous values).
 *
 * Runtime imports: none — `Game`, `App`, `EN`, `choose`, `loc`,
 * `locStrings`, `l`, `PlaySound` resolve through src/globals.d.ts.
 */

export function RandomBakeryName()
{
	var str='';
	if (EN)
	{
		return (Math.random()>0.05?(choose(['Magic','Fantastic','Fancy','Sassy','Snazzy','Pretty','Cute','Pirate','Ninja','Zombie','Robot','Radical','Urban','Cool','Hella','Sweet','Awful','Double','Triple','Turbo','Techno','Disco','Electro','Dancing','Wonder','Mutant','Space','Science','Medieval','Future','Captain','Bearded','Lovely','Tiny','Big','Fire','Water','Frozen','Metal','Plastic','Solid','Liquid','Moldy','Shiny','Happy','Happy Little','Slimy','Tasty','Delicious','Hungry','Greedy','Lethal','Professor','Doctor','Power','Chocolate','Crumbly','Choklit','Righteous','Glorious','Mnemonic','Psychic','Frenetic','Hectic','Crazy','Royal','El','Von'])+' '):'Mc')+choose(['Cookie','Biscuit','Muffin','Scone','Cupcake','Pancake','Chip','Sprocket','Gizmo','Puppet','Mitten','Sock','Teapot','Mystery','Baker','Cook','Grandma','Click','Clicker','Spaceship','Factory','Portal','Machine','Experiment','Monster','Panic','Burglar','Bandit','Booty','Potato','Pizza','Burger','Sausage','Meatball','Spaghetti','Macaroni','Kitten','Puppy','Giraffe','Zebra','Parrot','Dolphin','Duckling','Sloth','Turtle','Goblin','Pixie','Gnome','Computer','Pirate','Ninja','Zombie','Robot']);
	}
	else
	{
		if (locStrings["bakery random name, 1st half"] && locStrings["bakery random name, 2nd half"]) str+=choose(loc("bakery random name, 1st half") as any)+' '+choose(loc("bakery random name, 2nd half") as any);
		else str+=choose(loc("bakery random name") as any);
	}
	return str;
}
export function GetBakeryName() {return Game.RandomBakeryName();}
export function bakeryNameSet(what: any)
{
	try
	{
		var exp=new RegExp('[^\'\\-_0-9 \\p{L}]','gu');
		Game.bakeryName=what.replace(exp,' ');
		//Game.bakeryName=what.replace(/[^'\-_0-9 \p{L}]/gu,' ');
		Game.bakeryName=Game.bakeryName.trim().substring(0,28);
	}
	catch(e)
	{
		var exp=new RegExp('\W+','g');
		Game.bakeryName=what.replace(exp,' ');
		//Game.bakeryName=what.replace(/\W+/g,' ');
		Game.bakeryName=Game.bakeryName.substring(0,28);
	}
	Game.bakeryNameRefresh();
	if (Game.bakeryName=='RESTORE BACKUP' && App && App.restoreBackup) App.restoreBackup();
}
export function bakeryNameRefresh()
{
	var name=Game.bakeryName;
	if (EN) {if (name.slice(-1).toLowerCase()=='s') name+='\' bakery'; else name+='\'s bakery';}
	else name=loc("%1's bakery",name);
	Game.bakeryNameL.textContent=name;
	name=Game.bakeryName.toLowerCase();
	if (name=='orteil') Game.Win('God complex');
	if (!App && name.indexOf('saysopensesame',name.length-('saysopensesame').length)>0 && !Game.sesame) Game.OpenSesame();
	Game.recalculateGains=1;
}
export function bakeryNamePrompt()
{
	PlaySound('snd/tick.mp3');
	Game.Prompt('<id NameBakery><h3>'+loc("Name your bakery")+'</h3><div class="block" style="text-align:center;">'+loc("What should your bakery's name be?")+'</div><div class="block"><input type="text" style="text-align:center;width:100%;" id="bakeryNameInput" value="'+Game.bakeryName+'"/></div>',[[loc("Confirm"),'if (l(\'bakeryNameInput\').value.length>0) {Game.bakeryNameSet(l(\'bakeryNameInput\').value);Game.Win(\'What\\\'s in a name\');Game.ClosePrompt();}'],[loc("Random"),'Game.bakeryNamePromptRandom();'],loc("Cancel")]);
	l('bakeryNameInput').focus();
	l('bakeryNameInput').select();
}
export function bakeryNamePromptRandom()
{
	l('bakeryNameInput').value=Game.RandomBakeryName();
}
