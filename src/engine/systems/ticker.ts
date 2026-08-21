/**
 * systems/ticker.ts — the engine's news ticker system (Phase 6, slice 3).
 *
 * The 2.048 engine defined `Game.UpdateTicker`, `Game.getNewTicker` and
 * `Game.TickerDraw` inside `Game.Init`. They are now typed exports and the
 * engine keeps the same `Game.X = X` slots at the exact original Init
 * positions, so every call site (`Game.getNewTicker(true)` on window
 * resize, the `Game.UpdateTicker()` frame update, mod hooks) is unchanged.
 *
 * Slice scope (all closure-free over Init vars):
 *   - `UpdateTicker`  (engine ~5007–5012)
 *   - `getNewTicker`  (engine ~5013–5622)
 *   - `TickerDraw`    (engine ~5626–5639)
 *
 * Bodies are verbatim (original indentation kept).
 *
 * The ticker state-init lines (`Game.Ticker`, `Game.TickerAge`,
 * `Game.TickerEffect`, `Game.TickerN`, `Game.TickerClicks`,
 * `Game.tickerL`, `Game.tickerBelowL`, `Game.tickerTooNarrow`) and the
 * `AddEvent(Game.tickerL,'click',…)'` fortune handler stay in the engine —
 * they run at Init time and set up the state these functions operate on.
 *
 * No runtime imports except `choose`: `Game`, `loc`, `l`, `EN`, `PlaySound`
 * resolve through src/globals.d.ts / lib.dom. `choose` is imported from
 * utils/helpers — the same binding the engine used for these call sites
 * (the global shim's `choose` only accepts arrays, while the ticker also
 * picks from single localized strings).
 */
import { choose } from "../utils/helpers";

		export function UpdateTicker()
		{
			Game.TickerAge--;
			if (Game.TickerAge<=0) Game.getNewTicker();
			else if (Game.Ticker=='') Game.getNewTicker(true);
		}

		export function getNewTicker(manual: any)//note : "manual" is true if the ticker was clicked, but may also be true on startup etc
		{
			var list=[];
			
			var NEWS=loc("News :").replace(' ','&nbsp;')+' ';
			
			if (Game.TickerN%2==0 || Game.cookiesEarned>=10100000000)
			{
				var animals=['newts','penguins','scorpions','axolotls','puffins','porpoises','blowfish','horses','crayfish','slugs','humpback whales','nurse sharks','giant squids','polar bears','fruit bats','frogs','sea squirts','velvet worms','mole rats','paramecia','nematodes','tardigrades','giraffes','monkfish','wolfmen','goblins','hippies'];
				
				if (Math.random()<0.75 || Game.cookiesEarned<10000)
				{
					if (Game.Objects['Grandma'].amount>0) list.push('<q>'+choose(loc("Ticker (grandma)"))+'</q><sig>'+Game.Objects['Grandma'].single+'</sig>');
					
					if (!Game.prefs.notScary && Game.Objects['Grandma'].amount>=50) list.push('<q>'+choose(loc("Ticker (threatening grandma)"))+'</q><sig>'+Game.Objects['Grandma'].single+'</sig>');
					
					if (EN && Game.HasAchiev('Just wrong') && Math.random()<0.05) list.push(NEWS+'cookie manufacturer downsizes, sells own grandmother!');
					if (!Game.prefs.notScary && Game.HasAchiev('Just wrong') && Math.random()<0.4) list.push('<q>'+choose(loc("Ticker (angry grandma)"))+'</q><sig>'+Game.Objects['Grandma'].single+'</sig>');
					
					if (!Game.prefs.notScary && Game.Objects['Grandma'].amount>=1 && Game.pledges>0 && Game.elderWrath==0) list.push('<q>'+choose(loc("Ticker (grandmas return)"))+'</q><sig>'+Game.Objects['Grandma'].single+'</sig>');
					
					if (!EN)
					{
						for (var i in Game.Objects)
						{
							if (i!='Cursor' && i!='Grandma' && Game.Objects[i].amount>0) list.push(NEWS+choose(loc("Ticker ("+i+")")));
						}
						
						if (Game.cookiesEarned>=1000)
						{
							if (Game.season=='halloween') list.push(NEWS+choose(loc("Ticker (Halloween)")));
							if (Game.season=='christmas') list.push(NEWS+choose(loc("Ticker (Christmas)")));
							if (Game.season=='valentines') list.push(NEWS+choose(loc("Ticker (Valentines)")));
							if (Game.season=='easter') list.push(NEWS+choose(loc("Ticker (Easter)")));
						}
					}
					else
					{
						if (Game.Objects['Farm'].amount>0) list.push(choose([
						'News : cookie farms suspected of employing undeclared elderly workforce!',
						'News : cookie farms release harmful chocolate in our rivers, says scientist!',
						'News : genetically-modified chocolate controversy strikes cookie farmers!',
						'News : free-range farm cookies popular with today\'s hip youth, says specialist.',
						'News : farm cookies deemed unfit for vegans, says nutritionist.'
						]));
						
						if (Game.Objects['Mine'].amount>0) list.push(choose([
						'News : is our planet getting lighter? Experts examine the effects of intensive chocolate mining.',
						'News : '+Math.floor(Math.random()*1000+2)+' miners trapped in collapsed chocolate mine!',
						'News : chocolate mines found to cause earthquakes and sinkholes!',
						'News : chocolate mine goes awry, floods village in chocolate!',
						'News : depths of chocolate mines found to house "peculiar, chocolaty beings"!'
						]));
						
						if (Game.Objects['Factory'].amount>0) list.push(choose([
						'News : cookie factories linked to global warming!',
						'News : cookie factories involved in chocolate weather controversy!',
						'News : cookie factories on strike, robotic minions employed to replace workforce!',
						'News : cookie factories on strike - workers demand to stop being paid in cookies!',
						'News : factory-made cookies linked to obesity, says study.'
						]));
						
						if (Game.Objects['Bank'].amount>0) list.push(choose([
						'News : cookie loans on the rise as people can no longer afford them with regular money.',
						'News : cookies slowly creeping up their way as a competitor to traditional currency!',
						'News : most bakeries now fitted with ATMs to allow for easy cookie withdrawals and deposits.',
						'News : cookie economy now strong enough to allow for massive vaults doubling as swimming pools!',
						'News : "Tomorrow\'s wealthiest people will be calculated by their worth in cookies", predict economists.'
						]));
						
						if (Game.Objects['Temple'].amount>0) list.push(choose([
						'News : explorers bring back ancient artifact from abandoned temple; archeologists marvel at the centuries-old '+choose(['magic','carved','engraved','sculpted','royal','imperial','mummified','ritual','golden','silver','stone','cursed','plastic','bone','blood','holy','sacred','sacrificial','electronic','singing','tapdancing'])+' '+choose(['spoon','fork','pizza','washing machine','calculator','hat','piano','napkin','skeleton','gown','dagger','sword','shield','skull','emerald','bathtub','mask','rollerskates','litterbox','bait box','cube','sphere','fungus'])+'!',
						'News : recently-discovered chocolate temples now sparking new cookie-related cult; thousands pray to Baker in the sky!',
						'News : just how extensive is the cookie pantheon? Theologians speculate about possible '+choose(['god','goddess'])+' of '+choose([choose(animals),choose(['kazoos','web design','web browsers','kittens','atheism','handbrakes','hats','aglets','elevator music','idle games','the letter "P"','memes','hamburgers','bad puns','kerning','stand-up comedy','failed burglary attempts','clickbait','one weird tricks'])])+'.',
						'News : theists of the world discover new cookie religion - "Oh boy, guess we were wrong all along!"',
						'News : cookie heaven allegedly "sports elevator instead of stairway"; cookie hell "paved with flagstone, as good intentions make for poor building material".'
						]));
						
						if (Game.Objects['Wizard tower'].amount>0) list.push(choose([
						'News : all '+choose([choose(animals),choose(['public restrooms','clouds','politicians','moustaches','hats','shoes','pants','clowns','encyclopedias','websites','potted plants','lemons','household items','bodily fluids','cutlery','national landmarks','yogurt','rap music','underwear'])])+' turned into '+choose([choose(animals),choose(['public restrooms','clouds','politicians','moustaches','hats','shoes','pants','clowns','encyclopedias','websites','potted plants','lemons','household items','bodily fluids','cutlery','national landmarks','yogurt','rap music','underwear'])])+' in freak magic catastrophe!',
						'News : heavy dissent rages between the schools of '+choose(['water','fire','earth','air','lightning','acid','song','battle','peace','pencil','internet','space','time','brain','nature','techno','plant','bug','ice','poison','crab','kitten','dolphin','bird','punch','fart'])+' magic and '+choose(['water','fire','earth','air','lightning','acid','song','battle','peace','pencil','internet','space','time','brain','nature','techno','plant','bug','ice','poison','crab','kitten','dolphin','bird','punch','fart'])+' magic!',
						'News : get your new charms and curses at the yearly National Spellcrafting Fair! Exclusive prices on runes and spellbooks.',
						'News : cookie wizards deny involvement in shockingly ugly newborn - infant is "honestly grody-looking, but natural", say doctors.',
						'News : "Any sufficiently crude magic is indistinguishable from technology", claims renowned technowizard.'
						]));
						
						if (Game.Objects['Shipment'].amount>0) list.push(choose([
						'News : new chocolate planet found, becomes target of cookie-trading spaceships!',
						'News : massive chocolate planet found with 99.8% certified pure dark chocolate core!',
						'News : space tourism booming as distant planets attract more bored millionaires!',
						'News : chocolate-based organisms found on distant planet!',
						'News : ancient baking artifacts found on distant planet; "terrifying implications", experts say.'
						]));
						
						if (Game.Objects['Alchemy lab'].amount>0) list.push(choose([
						'News : national gold reserves dwindle as more and more of the precious mineral is turned to cookies!',
						'News : chocolate jewelry found fashionable, gold and diamonds "just a fad", says specialist.',
						'News : silver found to also be transmutable into white chocolate!',
						'News : defective alchemy lab shut down, found to convert cookies to useless gold.',
						'News : alchemy-made cookies shunned by purists!'
						]));
						
						if (Game.Objects['Portal'].amount>0) list.push(choose([
						'News : nation worried as more and more unsettling creatures emerge from dimensional portals!',
						'News : dimensional portals involved in city-engulfing disaster!',
						'News : tourism to cookieverse popular with bored teenagers! Casualty rate as high as 73%!',
						'News : cookieverse portals suspected to cause fast aging and obsession with baking, says study.',
						'News : "do not settle near portals," says specialist; "your children will become strange and corrupted inside."'
						]));
						
						if (Game.Objects['Time machine'].amount>0) list.push(choose([
						'News : time machines involved in history-rewriting scandal! Or are they?',
						'News : time machines used in unlawful time tourism!',
						'News : cookies brought back from the past "unfit for human consumption", says historian.',
						'News : various historical figures inexplicably replaced with talking lumps of dough!',
						'News : "I have seen the future," says time machine operator, "and I do not wish to go there again."'
						]));
						
						if (Game.Objects['Antimatter condenser'].amount>0) list.push(choose([
						'News : whole town seemingly swallowed by antimatter-induced black hole; more reliable sources affirm town "never really existed"!',
						'News : "explain to me again why we need particle accelerators to bake cookies?" asks misguided local woman.',
						'News : first antimatter condenser successfully turned on, doesn\'t rip apart reality!',
						'News : researchers conclude that what the cookie industry needs, first and foremost, is "more magnets".',
						'News : "unravelling the fabric of reality just makes these cookies so much tastier", claims scientist.'
						]));
						
						if (Game.Objects['Prism'].amount>0) list.push(choose([
						'News : new cookie-producing prisms linked to outbreak of rainbow-related viral videos.',
						'News : scientists warn against systematically turning light into matter - "One day, we\'ll end up with all matter and no light!"',
						'News : cookies now being baked at the literal speed of light thanks to new prismatic contraptions.',
						'News : "Can\'t you sense the prism watching us?", rambles insane local man. "No idea what he\'s talking about", shrugs cookie magnate/government official.',
						'News : world citizens advised "not to worry" about frequent atmospheric flashes.',
						]));
						
						if (Game.Objects['Chancemaker'].amount>0) list.push(choose([
						'News : strange statistical anomalies continue as weather forecast proves accurate an unprecedented 3 days in a row!',
						'News : local casino ruined as all gamblers somehow hit a week-long winning streak! "We might still be okay", says owner before being hit by lightning 47 times.',
						'News : neighboring nation somehow elects president with sensible policies in freak accident of random chance!',
						'News : million-to-one event sees gritty movie reboot turning out better than the original! "We have no idea how this happened", say movie execs.',
						'News : all scratching tickets printed as winners, prompting national economy to crash and, against all odds, recover overnight.',
						]));
						
						if (Game.Objects['Fractal engine'].amount>0) list.push(choose([
						'News : local man "done with Cookie Clicker", finds the constant self-references "grating and on-the-nose".',
						'News : local man sails around the world to find himself - right where he left it.',
						'News : local guru claims "there\'s a little bit of ourselves in everyone", under investigation for alleged cannibalism.',
						'News : news writer finds herself daydreaming about new career. Or at least a raise.',
						'News : polls find idea of cookies made of cookies "acceptable" - "at least we finally know what\'s in them", says interviewed citizen.',
						]));
						
						if (Game.Objects['Javascript console'].amount>0) list.push(choose([
						'News : strange fad has parents giving their newborns names such as Emma.js or Liam.js. At least one Baby.js reported.',
						'News : coding is hip! More and more teenagers turn to technical fields like programming, ensuring a future robot apocalypse and the doom of all mankind.',
						'News : developers unsure what to call their new javascript libraries as all combinations of any 3 dictionary words have already been taken.',
						'News : nation holds breath as nested ifs about to hatch.',
						'News : clueless copywriter forgets to escape a quote, ends news line prematurely; last words reported to be "Huh, why isn',
						]));
						
						if (Game.Objects['Idleverse'].amount>0) list.push(choose([
						'News : is another you living out their dreams in an alternate universe? Probably, you lazy bum!',
						'News : public recoils at the notion of a cosmos made of infinite idle games. "I kinda hoped there\'d be more to it", says distraught citizen.',
						'News : with an infinity of parallel universes, people turn to reassuring alternate dimensions, which only number "in the high 50s".',
						'News : "I find solace in the knowledge that at least some of my alternate selves are probably doing fine out there", says citizen\'s last remaining exemplar in the multiverse.',
						'News : comic book writers point to actual multiverse in defense of dubious plot points. "See? I told you it wasn\'t \'hackneyed and contrived\'!"'
						]));
						
						if (Game.Objects['Cortex baker'].amount>0) list.push(choose([
						'News : cortex baker wranglers kindly remind employees that cortex bakers are the bakery\'s material property and should not be endeared with nicknames.',
						'News : space-faring employees advised to ignore unusual thoughts and urges experienced within 2 parsecs of gigantic cortex bakers, say guidelines.',
						'News : astronomers warn of cortex baker trajectory drift, fear future head-on collisions resulting in costly concussions.',
						'News : runt cortex baker identified with an IQ of only quintuple digits: "just a bit of a dummy", say specialists.',
						'News : are you smarter than a cortex baker? New game show deemed "unfair" by contestants.'
						]));
						
						if (Game.season=='halloween' && Game.cookiesEarned>=1000) list.push(choose([
						'News : strange twisting creatures amass around cookie factories, nibble at assembly lines.',
						'News : ominous wrinkly monsters take massive bites out of cookie production; "this can\'t be hygienic", worries worker.',
						'News : pagan rituals on the rise as children around the world dress up in strange costumes and blackmail homeowners for candy.',
						'News : new-age terrorism strikes suburbs as houses find themselves covered in eggs and toilet paper.',
						'News : children around the world "lost and confused" as any and all Halloween treats have been replaced by cookies.'
						]));
						
						if (Game.season=='christmas' && Game.cookiesEarned>=1000) list.push(choose([
						'News : bearded maniac spotted speeding on flying sleigh! Investigation pending.',
						'News : Santa Claus announces new brand of breakfast treats to compete with cookie-flavored cereals! "They\'re ho-ho-horrible!" says Santa.',
						'News : "You mean he just gives stuff away for free?!", concerned moms ask. "Personally, I don\'t trust his beard."',
						'News : obese jolly lunatic still on the loose, warn officials. "Keep your kids safe and board up your chimneys. We mean it."',
						'News : children shocked as they discover Santa Claus isn\'t just their dad in a costume after all!<br>"I\'m reassessing my life right now", confides Laura, aged 6.',
						'News : mysterious festive entity with quantum powers still wrecking havoc with army of reindeer, officials say.',
						'News : elves on strike at toy factory! "We will not be accepting reindeer chow as payment anymore. And stop calling us elves!"',
						'News : elves protest around the nation; wee little folks in silly little outfits spread mayhem, destruction; rabid reindeer running rampant through streets.',
						'News : scholars debate regarding the plural of reindeer(s) in the midst of elven world war.',
						'News : elves "unrelated to gnomes despite small stature and merry disposition", find scientists.',
						'News : elves sabotage radioactive frosting factory, turn hundreds blind in vicinity - "Who in their right mind would do such a thing?" laments outraged mayor.',
						'News : drama unfolds at North Pole as rumors crop up around Rudolph\'s red nose; "I may have an addiction or two", admits reindeer.'
						]));
						
						if (Game.season=='valentines' && Game.cookiesEarned>=1000) list.push(choose([
						'News : organ-shaped confectioneries being traded in schools all over the world; gruesome practice undergoing investigation.',
						'News : heart-shaped candies overtaking sweets business, offering competition to cookie empire. "It\'s the economy, cupid!"',
						'News : love\'s in the air, according to weather specialists. Face masks now offered in every city to stunt airborne infection.',
						'News : marrying a cookie - deranged practice, or glimpse of the future?',
						'News : boyfriend dumped after offering his lover cookies for Valentine\'s Day, reports say. "They were off-brand", shrugs ex-girlfriend.'
						]));
						
						if (Game.season=='easter' && Game.cookiesEarned>=1000) list.push(choose([
						'News : long-eared critters with fuzzy tails invade suburbs, spread terror and chocolate!',
						'News : eggs have begun to materialize in the most unexpected places; "no place is safe", warn experts.',
						'News : packs of rampaging rabbits cause billions in property damage; new strain of myxomatosis being developed.',
						'News : egg-laying rabbits "not quite from this dimension", warns biologist; advises against petting, feeding, or cooking the creatures.',
						'News : mysterious rabbits found to be egg-layers, but mammalian, hinting at possible platypus ancestry.'
						]));
					}
				}
				if (!EN)
				{
					if (Game.cookiesEarned>=10000)
					{
						list.push(NEWS+choose(loc("Ticker (misc)")));
						list.push(NEWS+choose(loc("Ticker (misc)")));
						list.push(NEWS+choose(loc("Ticker (misc)")));
					}
				}
				else
				{
					if (Math.random()<0.05)
					{
						if (Game.HasAchiev('Base 10')) list.push('News : cookie manufacturer completely forgoes common sense, lets strange obsession with round numbers drive building decisions!');
						if (Game.HasAchiev('From scratch')) list.push('News : follow the tear-jerking, riches-to-rags story about a local cookie manufacturer who decided to give it all up!');
						if (Game.HasAchiev('A world filled with cookies')) list.push('News : known universe now jammed with cookies! No vacancies!');
						if (Game.HasAchiev('Last Chance to See')) list.push('News : incredibly rare albino wrinkler on the brink of extinction poached by cookie-crazed pastry magnate!');
						if (Game.Has('Serendipity')) list.push('News : local cookie manufacturer becomes luckiest being alive!');
						if (Game.Has('Season switcher')) list.push('News : seasons are all out of whack! "We need to get some whack back into them seasons", says local resident.');
						
						if (Game.Has('Kitten helpers')) list.push('News : faint meowing heard around local cookie facilities; suggests new ingredient being tested.');
						if (Game.Has('Kitten workers')) list.push('News : crowds of meowing kittens with little hard hats reported near local cookie facilities.');
						if (Game.Has('Kitten engineers')) list.push('News : surroundings of local cookie facilities now overrun with kittens in adorable little suits. Authorities advise to stay away from the premises.');
						if (Game.Has('Kitten overseers')) list.push('News : locals report troupe of bossy kittens meowing adorable orders at passersby.');
						if (Game.Has('Kitten managers')) list.push('News : local office cubicles invaded with armies of stern-looking kittens asking employees "what\'s happening, meow".');
						if (Game.Has('Kitten accountants')) list.push('News : tiny felines show sudden and amazing proficiency with fuzzy mathematics and pawlinomials, baffling scientists and pet store owners.');
						if (Game.Has('Kitten specialists')) list.push('News : new kitten college opening next week, offers courses on cookie-making and catnip studies.');
						if (Game.Has('Kitten experts')) list.push('News : unemployment rates soaring as woefully adorable little cats nab jobs on all levels of expertise, says study.');
						if (Game.Has('Kitten consultants')) list.push('News : "In the future, your job will most likely be done by a cat", predicts suspiciously furry futurologist.');
						if (Game.Has('Kitten assistants to the regional manager')) list.push('News : strange kittens with peculiar opinions on martial arts spotted loitering on local beet farms!');
						if (Game.Has('Kitten marketeers')) list.push('News : nonsensical kitten billboards crop up all over countryside, trying to sell people the cookies they already get for free!');
						if (Game.Has('Kitten analysts')) list.push('News : are your spending habits sensible? For a hefty fee, these kitten analysts will tell you!');
						if (Game.Has('Kitten executives')) list.push('News : kittens strutting around in hot little business suits shouting cut-throat orders at their assistants, possibly the cutest thing this reporter has ever seen!');
						if (Game.Has('Kitten admins')) list.push('News : all systems nominal, claim kitten admins obviously in way over their heads.');
						if (Game.Has('Kitten angels')) list.push('News : "Try to ignore any ghostly felines that may be purring inside your ears," warn scientists. "They\'ll just lure you into making poor life choices."');
						if (Game.Has('Kitten wages')) list.push('News : kittens break glass ceiling! Do they have any idea how expensive those are!');
						if (Game.HasAchiev('Jellicles')) list.push('News : local kittens involved in misguided musical production, leave audience perturbed and unnerved.');
					}
					
					if (Game.HasAchiev('Dude, sweet') && Math.random()<0.2) list.push(choose([
					'News : major sugar-smuggling ring dismantled by authorities; '+Math.floor(Math.random()*30+3)+' tons of sugar lumps seized, '+Math.floor(Math.random()*48+2)+' suspects apprehended.',
					'News : authorities warn tourists not to buy bootleg sugar lumps from street peddlers - "You think you\'re getting a sweet deal, but what you\'re being sold is really just ordinary cocaine", says agent.',
					'News : pro-diabetes movement protests against sugar-shaming. "I\'ve eaten nothing but sugar lumps for the past '+Math.floor(Math.random()*10+4)+' years and I\'m feeling great!", says woman with friable skin.',
					'News : experts in bitter disagreement over whether sugar consumption turns children sluggish or hyperactive.',
					'News : fishermen deplore upturn in fish tooth decay as sugar lumps-hauling cargo sinks into the ocean.',
					'News : rare black sugar lump that captivated millions in unprecedented auction revealed to be common toxic fungus.',
					'News : "Back in my day, sugar lumps were these little cubes you\'d put in your tea, not those fist-sized monstrosities people eat for lunch", whines curmudgeon with failing memory.',
					'News : sugar lump-snacking fad sweeps the nation; dentists everywhere rejoice.'
					]));
					
					if (Math.random()<0.001)//apologies to Will Wright
					{
						list.push(
						'You have been chosen. They will come soon.',
						'They\'re coming soon. Maybe you should think twice about opening the door.',
						'The end is near. Make preparations.',
						'News : broccoli tops for moms, last for kids; dads indifferent.',
						'News : middle age a hoax, declares study; turns out to be bad posture after all.',
						'News : kitties want answers in possible Kitty Kibble shortage.'
						);
					}
					
					if (Game.cookiesEarned>=10000) list.push(
					'News : '+choose([
						'cookies found to '+choose(['increase lifespan','sensibly increase intelligence','reverse aging','decrease hair loss','prevent arthritis','cure blindness'])+' in '+choose(animals)+'!',
						'cookies found to make '+choose(animals)+' '+choose(['more docile','more handsome','nicer','less hungry','more pragmatic','tastier'])+'!',
						'cookies tested on '+choose(animals)+', found to have no ill effects.',
						'cookies unexpectedly popular among '+choose(animals)+'!',
						'unsightly lumps found on '+choose(animals)+' near cookie facility; "they\'ve pretty much always looked like that", say biologists.',
						'new species of '+choose(animals)+' discovered in distant country; "yup, tastes like cookies", says biologist.',
						'cookies go well with '+choose([choose(['roasted','toasted','boiled','sauteed','minced'])+' '+choose(animals),choose(['sushi','soup','carpaccio','steak','nuggets'])+' made from '+choose(animals)])+', says controversial chef.',
						'"do your cookies contain '+choose(animals)+'?", asks PSA warning against counterfeit cookies.',
						'doctors recommend twice-daily consumption of fresh cookies.',
						'doctors warn against chocolate chip-snorting teen fad.',
						'doctors advise against new cookie-free fad diet.',
						'doctors warn mothers about the dangers of "home-made cookies".'
						]),
					'News : "'+choose([
						'I\'m all about cookies',
						'I just can\'t stop eating cookies. I think I seriously need help',
						'I guess I have a cookie problem',
						'I\'m not addicted to cookies. That\'s just speculation by fans with too much free time',
						'my upcoming album contains 3 songs about cookies',
						'I\'ve had dreams about cookies 3 nights in a row now. I\'m a bit worried honestly',
						'accusations of cookie abuse are only vile slander',
						'cookies really helped me when I was feeling low',
						'cookies are the secret behind my perfect skin',
						'cookies helped me stay sane while filming my upcoming movie',
						'cookies helped me stay thin and healthy',
						'I\'ll say one word, just one : cookies',
						'alright, I\'ll say it - I\'ve never eaten a single cookie in my life'
						])+'", reveals celebrity.',
					choose([
						'News : scientist predicts imminent cookie-related "end of the world"; becomes joke among peers.',
						'News : man robs bank, buys cookies.',
						'News : scientists establish that the deal with airline food is, in fact, a critical lack of cookies.',
						'News : hundreds of tons of cookies dumped into starving country from airplanes; thousands dead, nation grateful.',
						'News : new study suggests cookies neither speed up nor slow down aging, but instead "take you in a different direction".',
						'News : overgrown cookies found in fishing nets, raise questions about hormone baking.',
						'News : "all-you-can-eat" cookie restaurant opens in big city; waiters trampled in minutes.',
						'News : man dies in cookie-eating contest; "a less-than-impressive performance", says judge.',
						'News : what makes cookies taste so right? "Probably all the [*****] they put in them", says anonymous tipper.',
						'News : man found allergic to cookies; "what a weirdo", says family.',
						'News : foreign politician involved in cookie-smuggling scandal.',
						'News : cookies now more popular than '+choose(['cough drops','broccoli','smoked herring','cheese','video games','stable jobs','relationships','time travel','cat videos','tango','fashion','television','nuclear warfare','whatever it is we ate before','politics','oxygen','lamps'])+', says study.',
						'News : obesity epidemic strikes nation; experts blame '+choose(['twerking','that darn rap music','video-games','lack of cookies','mysterious ghostly entities','aliens','parents','schools','comic-books','cookie-snorting fad'])+'.',
						'News : cookie shortage strikes town, people forced to eat cupcakes; "just not the same", concedes mayor.',
						'News : "you gotta admit, all this cookie stuff is a bit ominous", says confused idiot.',
						//'News : scientists advise getting used to cookies suffusing every aspect of life; "this is the new normal", expert says.',
						//'News : doctors advise against wearing face masks when going outside. "You never know when you might need a cookie... a mask would just get in the way."',//these were written back when covid hadn't really done much damage yet but they just feel in poor taste now
						'News : is there life on Mars? Various chocolate bar manufacturers currently under investigation for bacterial contaminants.',
						'News : "so I guess that\'s a thing now", scientist comments on cookie particles now present in virtually all steel manufactured since cookie production ramped up worldwide.',
						'News : trace amounts of cookie particles detected in most living creatures, some of which adapting them as part of new and exotic metabolic processes.',
					]),
					choose([
						'News : movie cancelled from lack of actors; "everybody\'s at home eating cookies", laments director.',
						'News : comedian forced to cancel cookie routine due to unrelated indigestion.',
						'News : new cookie-based religion sweeps the nation.',
						'News : fossil records show cookie-based organisms prevalent during Cambrian explosion, scientists say.',
						'News : mysterious illegal cookies seized; "tastes terrible", says police.',
						'News : man found dead after ingesting cookie; investigators favor "mafia snitch" hypothesis.',
						'News : "the universe pretty much loops on itself," suggests researcher; "it\'s cookies all the way down."',
						'News : minor cookie-related incident turns whole town to ashes; neighboring cities asked to chip in for reconstruction.',
						'News : is our media controlled by the cookie industry? This could very well be the case, says crackpot conspiracy theorist.',
						'News : '+choose(['cookie-flavored popcorn pretty damn popular; "we kinda expected that", say scientists.','cookie-flavored cereals break all known cereal-related records','cookies popular among all age groups, including fetuses, says study.','cookie-flavored popcorn sales exploded during screening of Grandmothers II : The Moistening.']),
						'News : all-cookie restaurant opening downtown. Dishes such as braised cookies, cookie thermidor, and for dessert : crepes.',
						'News : "Ook", says interviewed orangutan.',
						'News : cookies could be the key to '+choose(['eternal life','infinite riches','eternal youth','eternal beauty','curing baldness','world peace','solving world hunger','ending all wars world-wide','making contact with extraterrestrial life','mind-reading','better living','better eating','more interesting TV shows','faster-than-light travel','quantum baking','chocolaty goodness','gooder thoughtness'])+', say scientists.',
						'News : flavor text '+choose(['not particularly flavorful','kind of unsavory','"rather bland"','pretty spicy lately'])+', study finds.',
					]),
					choose([
						'News : what do golden cookies taste like? Study reveals a flavor "somewhere between spearmint and liquorice".',
						'News : what do wrath cookies taste like? Study reveals a flavor "somewhere between blood sausage and seawater".',
						'News : '+Game.bakeryName+'-brand cookies "'+choose(['much less soggy','much tastier','relatively less crappy','marginally less awful','less toxic','possibly more edible','more fashionable','slightly nicer','trendier','arguably healthier','objectively better choice','slightly less terrible','decidedly cookier','a tad cheaper'])+' than competitors", says consumer survey.',
						'News : "'+Game.bakeryName+'" set to be this year\'s most popular baby name.',
						'News : new popularity survey says '+Game.bakeryName+'\'s the word when it comes to cookies.',
						'News : major city being renamed '+Game.bakeryName+'ville after world-famous cookie manufacturer.',
						'News : '+choose(['street','school','nursing home','stadium','new fast food chain','new planet','new disease','flesh-eating bacteria','deadly virus','new species of '+choose(animals),'new law','baby','programming language'])+' to be named after '+Game.bakeryName+', the world-famous cookie manufacturer.',
						'News : don\'t miss tonight\'s biopic on '+Game.bakeryName+'\'s irresistible rise to success!',
						'News : don\'t miss tonight\'s interview of '+Game.bakeryName+' by '+choose(['Bloprah','Blavid Bletterman','Blimmy Blimmel','Blellen Blegeneres','Blimmy Blallon','Blonan Blo\'Brien','Blay Bleno','Blon Blewart','Bleven Blolbert','Lord Toxikhron of dimension 7-B19',Game.bakeryName+'\'s own evil clone'])+'!',
						'News : people all over the internet still scratching their heads over nonsensical reference : "Okay, but why an egg?"',
						'News : viral video "Too Many Cookies" could be "a grim commentary on the impending crisis our world is about to face", says famous economist.',
						'News : "memes from last year somehow still relevant", deplore experts.',
						'News : cookie emoji most popular among teenagers, far ahead of "judgmental OK hand sign" and "shifty-looking dark moon", says study.',
					]),
					choose([
						'News : births of suspiciously bald babies on the rise; ancient alien cabal denies involvement.',
						'News : "at this point, cookies permeate the economy", says economist. "If we start eating anything else, we\'re all dead."',
						'News : pun in headline infuriates town, causes riot. 21 wounded, 5 dead; mayor still missing.',
						'Nws : ky btwn W and R brokn, plas snd nw typwritr ASAP.',
						'Neeeeews : "neeeew EEEEEE keeeeey working fineeeeeeeee", reeeports gleeeeeeeeful journalist.',
						'News : cookies now illegal in some backwards country nobody cares about. Political tensions rising; war soon, hopefully.',
						'News : irate radio host rambles about pixelated icons. "None of the cookies are aligned! Can\'t anyone else see it? I feel like I\'m taking crazy pills!"',
						'News : nation cheers as legislators finally outlaw '+choose(['cookie criticism','playing other games than Cookie Clicker','pineapple on pizza','lack of cheerfulness','mosquitoes','broccoli','the human spleen','bad weather','clickbait','dabbing','the internet','memes','millennials'])+'!',
						'News : '+choose(['local','area'])+' '+choose(['man','woman'])+' goes on journey of introspection, finds cookies : "I honestly don\'t know what I was expecting."',
						'News : '+choose(['man','woman'])+' wakes up from coma, '+choose(['tries cookie for the first time, dies.','regrets it instantly.','wonders "why everything is cookies now".','babbles incoherently about some supposed "non-cookie food" we used to eat.','cites cookies as main motivator.','asks for cookies.']),
						'News : pet '+choose(animals)+', dangerous fad or juicy new market?',
						'News : person typing these wouldn\'t mind someone else breaking the news to THEM, for a change.',
						'News : "average person bakes '+Beautify(Math.ceil(Game.cookiesEarned/7300000000))+' cookie'+(Math.ceil(Game.cookiesEarned/7300000000)==1?'':'s')+' a year" factoid actually just statistical error; '+Game.bakeryName+', who has produced '+Beautify(Game.cookiesEarned)+' cookies in their lifetime, is an outlier and should not have been counted.'
						])
					);
				}
			}
			
			if (list.length==0)
			{
				if (Game.cookiesEarned<5) list.push(loc("You feel like making cookies. But nobody wants to eat your cookies."));
				else if (Game.cookiesEarned<50) list.push(loc("Your first batch goes to the trash. The neighborhood raccoon barely touches it."));
				else if (Game.cookiesEarned<100) list.push(loc("Your family accepts to try some of your cookies."));
				else if (Game.cookiesEarned<500) list.push(loc("Your cookies are popular in the neighborhood."));
				else if (Game.cookiesEarned<1000) list.push(loc("People are starting to talk about your cookies."));
				else if (Game.cookiesEarned<5000) list.push(loc("Your cookies are talked about for miles around."));
				else if (Game.cookiesEarned<10000) list.push(loc("Your cookies are renowned in the whole town!"));
				else if (Game.cookiesEarned<50000) list.push(loc("Your cookies bring all the boys to the yard."));
				else if (Game.cookiesEarned<100000) list.push(loc("Your cookies now have their own website!"));
				else if (Game.cookiesEarned<500000) list.push(loc("Your cookies are worth a lot of money."));
				else if (Game.cookiesEarned<1000000) list.push(loc("Your cookies sell very well in distant countries."));
				else if (Game.cookiesEarned<5000000) list.push(loc("People come from very far away to get a taste of your cookies."));
				else if (Game.cookiesEarned<10000000) list.push(loc("Kings and queens from all over the world are enjoying your cookies."));
				else if (Game.cookiesEarned<50000000) list.push(loc("There are now museums dedicated to your cookies."));
				else if (Game.cookiesEarned<100000000) list.push(loc("A national day has been created in honor of your cookies."));
				else if (Game.cookiesEarned<500000000) list.push(loc("Your cookies have been named a part of the world wonders."));
				else if (Game.cookiesEarned<1000000000) list.push(loc("History books now include a whole chapter about your cookies."));
				else if (Game.cookiesEarned<5000000000) list.push(loc("Your cookies have been placed under government surveillance."));
				else if (Game.cookiesEarned<10000000000) list.push(loc("The whole planet is enjoying your cookies!"));
				else if (Game.cookiesEarned<50000000000) list.push(loc("Strange creatures from neighboring planets wish to try your cookies."));
				else if (Game.cookiesEarned<100000000000) list.push(loc("Elder gods from the whole cosmos have awoken to taste your cookies."));
				else if (Game.cookiesEarned<500000000000) list.push(loc("Beings from other dimensions lapse into existence just to get a taste of your cookies."));
				else if (Game.cookiesEarned<1000000000000) list.push(loc("Your cookies have achieved sentience."));
				else if (Game.cookiesEarned<5000000000000) list.push(loc("The universe has now turned into cookie dough, to the molecular level."));
				else if (Game.cookiesEarned<10000000000000) list.push(loc("Your cookies are rewriting the fundamental laws of the universe."));
				else if (Game.cookiesEarned<10000000000000) list.push(loc("A local news station runs a 10-minute segment about your cookies. Success!<br><span style=\"font-size:50%;\">(you win a cookie)</span>"));
				else if (Game.cookiesEarned<10100000000000) list.push(loc("it's time to stop playing"));//only show this for 100 millions (it's funny for a moment)
			}
			
			//if (Game.elderWrath>0 && (Game.pledges==0 || Math.random()<0.2))
			if (Game.elderWrath>0 && (((Game.pledges==0 && Game.resets==0) && Math.random()<0.3) || Math.random()<0.03))
			{
				list=[];
				if (Game.elderWrath==1) list.push(EN?choose([
					'News : millions of old ladies reported missing!',
					'News : processions of old ladies sighted around cookie facilities!',
					'News : families around the continent report agitated, transfixed grandmothers!',
					'News : doctors swarmed by cases of old women with glassy eyes and a foamy mouth!',
					'News : nurses report "strange scent of cookie dough" around female elderly patients!'
				]):(NEWS+choose(loc("Ticker (grandma invasion start)"))));
				if (Game.elderWrath==2) list.push(EN?choose([
					'News : town in disarray as strange old ladies break into homes to abduct infants and baking utensils!',
					'News : sightings of old ladies with glowing eyes terrify local population!',
					'News : retirement homes report "female residents slowly congealing in their seats"!',
					'News : whole continent undergoing mass exodus of old ladies!',
					'News : old women freeze in place in streets, ooze warm sugary syrup!'
				]):(NEWS+choose(loc("Ticker (grandma invasion rise)"))));
				if (Game.elderWrath==3) list.push(EN?choose([
					'News : large "flesh highways" scar continent, stretch between various cookie facilities!',
					'News : wrinkled "flesh tendrils" visible from space!',
					'News : remains of "old ladies" found frozen in the middle of growing fleshy structures!', 
					'News : all hope lost as writhing mass of flesh and dough engulfs whole city!',
					'News : nightmare continues as wrinkled acres of flesh expand at alarming speeds!'
				]):(NEWS+choose(loc("Ticker (grandma invasion full)"))));
			}
			
			if (EN && Game.season=='fools')
			{
				list=[];
				
				if (Game.cookiesEarned>=1000) list.push(choose([
					'Your office chair is really comfortable.',
					'Business meetings are such a joy!',
					'You\'ve spent the whole day '+choose(['signing contracts','filling out forms','touching base with the team','examining exciting new prospects','playing with your desk toys','getting new nameplates done','attending seminars','videoconferencing','hiring dynamic young executives','meeting new investors','playing minigolf in your office'])+'!',
					'The word of the day is : '+choose(['viral','search engine optimization','blags and wobsites','social networks','web 3.0','logistics','leveraging','branding','proactive','synergizing','market research','demographics','pie charts','blogular','blogulacious','blogastic','authenticity','electronic mail','cellular phones','rap music','cookies, I guess'])+'.',
					'Profit\'s in the air!'
				]));
				if (Game.cookiesEarned>=1000 && Math.random()<0.1) list.push(choose([
					'If you could get some more cookies baked, that\'d be great.',
					'So. About those TPS reports.',
					'Another day in paradise!',
					'Working hard, or hardly working?'
				]));
				
				
				if (Game.TickerN%2==0 || Game.cookiesEarned>=10100000000)
				{
					if (Game.Objects['Grandma'].amount>0) list.push(choose([
					'Your rolling pins are rolling and pinning!',
					'Production is steady!'
					]));
					
					if (Game.Objects['Grandma'].amount>0) list.push(choose([
					'Your ovens are diligently baking more and more cookies.',
					'Your ovens burn a whole batch. Ah well! Still good.'
					]));
					
					if (Game.Objects['Farm'].amount>0) list.push(choose([
					'Scores of cookies come out of your kitchens.',
					'Today, new recruits are joining your kitchens!'
					]));
					
					if (Game.Objects['Factory'].amount>0) list.push(choose([
					'Your factories are producing an unending stream of baked goods.',
					'Your factory workers decide to go on strike!',
					'It\'s safety inspection day in your factories.'
					]));
					
					if (Game.Objects['Mine'].amount>0) list.push(choose([
					'Your secret recipes are kept safely inside a giant underground vault.',
					'Your chefs are working on new secret recipes!'
					]));
					
					if (Game.Objects['Shipment'].amount>0) list.push(choose([
					'Your supermarkets are bustling with happy, hungry customers.',
					'Your supermarkets are full of cookie merch!'
					]));
					
					if (Game.Objects['Alchemy lab'].amount>0) list.push(choose([
					'It\'s a new trading day at the stock exchange, and traders can\'t get enough of your shares!',
					'Your stock is doubling in value by the minute!'
					]));
					
					if (Game.Objects['Portal'].amount>0) list.push(choose([
					'You just released a new TV show episode!',
					'Your cookie-themed TV show is being adapted into a new movie!'
					]));
					
					if (Game.Objects['Time machine'].amount>0) list.push(choose([
					'Your theme parks are doing well - puddles of vomit and roller-coaster casualties are being swept under the rug!',
					'Visitors are stuffing themselves with cookies before riding your roller-coasters. You might want to hire more clean-up crews.'
					]));
					
					if (Game.Objects['Antimatter condenser'].amount>0) list.push(choose([
					'Cookiecoin is officially the most mined digital currency in the history of mankind!',
					'Cookiecoin piracy is rampant!'
					]));
					
					if (Game.Objects['Prism'].amount>0) list.push(choose([
					'Your corporate nations just gained a new parliament!',
					'You\'ve just annexed a new nation!',
					'A new nation joins the grand cookie conglomerate!'
					]));
					
					if (Game.Objects['Chancemaker'].amount>0) list.push(choose([
					'Your intergalactic federation of cookie-sponsored planets reports record-breaking profits!',
					'Billions of unwashed aliens are pleased to join your workforce as you annex their planet!',
					'New toll opened on interstellar highway, funnelling more profits into the cookie economy!'
					]));
					
					if (Game.Objects['Fractal engine'].amount>0) list.push(choose([
					'Your cookie-based political party is doing fantastic in the polls!',
					'New pro-cookie law passes without a hitch thanks to your firm grasp of the political ecosystem!',
					'Your appointed senators are overturning cookie bans left and right!'
					]));
					
					if (Game.Objects['Javascript console'].amount>0) list.push(choose([
					'Cookies are now one of the defining aspects of mankind! Congratulations!',
					'Time travelers report that this era will later come to be known, thanks to you, as the cookie millennium!',
					'Cookies now deeply rooted in human culture, likely puzzling future historians!'
					]));
					
					if (Game.Objects['Idleverse'].amount>0) list.push(choose([
					'Public aghast as all remaining aspects of their lives overtaken by universal cookie industry!',
					'Every single product currently sold in the observable universe can be traced back to your company! And that\'s a good thing.',
					'Antitrust laws let out a helpless whimper before being engulfed by your sprawling empire!'
					]));
					
					if (Game.Objects['Cortex baker'].amount>0) list.push(choose([
					'Bold new law proposal would grant default ownership of every new idea by anyone anywhere to '+Game.bakeryName+'\'s bakery!',
					'Bakery think tanks accidentally reinvent cookies for the 57th time this week!',
					'Bakery think tanks invent entire new form of human communication to advertise and boost cookie sales!'
					]));
				}
				
				if (Game.cookiesEarned<5) list.push('Such a grand day to begin a new business.');
				else if (Game.cookiesEarned<50) list.push('You\'re baking up a storm!');
				else if (Game.cookiesEarned<100) list.push('You are confident that one day, your cookie company will be the greatest on the market!');
				else if (Game.cookiesEarned<1000) list.push('Business is picking up!');
				else if (Game.cookiesEarned<5000) list.push('You\'re making sales left and right!');
				else if (Game.cookiesEarned<20000) list.push('Everyone wants to buy your cookies!');
				else if (Game.cookiesEarned<50000) list.push('You are now spending most of your day signing contracts!');
				else if (Game.cookiesEarned<500000) list.push('You\'ve been elected "business tycoon of the year"!');
				else if (Game.cookiesEarned<1000000) list.push('Your cookies are a worldwide sensation! Well done, old chap!');
				else if (Game.cookiesEarned<5000000) list.push('Your brand has made its way into popular culture. Children recite your slogans and adults reminisce them fondly!');
				else if (Game.cookiesEarned<1000000000) list.push('A business day like any other. It\'s good to be at the top!');
				else if (Game.cookiesEarned<10100000000) list.push('You look back at your career. It\'s been a fascinating journey, building your baking empire from the ground up.');//only show this for 100 millions
			}
			
			for (var j=0;j<Game.modHooks['ticker'].length;j++)
			{
				var arr=Game.modHooks['ticker'][j]();
				if (arr) list=list.concat(arr);
			}
			
			Game.TickerEffect=0;
			
			if (!manual && Game.T>Game.fps*10 && Game.Has('Fortune cookies') && Math.random()<(Game.HasAchiev('O Fortuna')?0.04:0.02))
			{
				var fortunes=[];
				for (var i in Game.Tiers['fortune'].upgrades)
				{
					var it=Game.Tiers['fortune'].upgrades[+i];//+i: for-in yields string keys; coerce to number for typed array index
					if (!Game.HasUnlocked(it.name)) fortunes.push(it);
				}
				
				if (!Game.fortuneGC) fortunes.push('fortuneGC');
				if (!Game.fortuneCPS) fortunes.push('fortuneCPS');
				
				if (fortunes.length>0)
				{
					list=[];
					var me=choose(fortunes);
					Game.TickerEffect={type:'fortune',sub:me};
					
					if (me=='fortuneGC') me=loc("Today is your lucky day!");/*<br>Click here for a golden cookie.';*/
					else if (me=='fortuneCPS') {Math.seedrandom(Game.seed+'-fortune');me=loc("Your lucky numbers are:")+' '+Math.floor(Math.random()*100)+' '+Math.floor(Math.random()*100)+' '+Math.floor(Math.random()*100)+' '+Math.floor(Math.random()*100)/*+'<br>Click here to gain one hour of your CpS.'*/;Math.seedrandom();}
					else
					{
						if (EN)
						{
							me=me.dname.substring(me.name.indexOf('#'))+' : '+me.baseDesc.substring(me.baseDesc.indexOf('<q>')+3);
							me=me.substring(0,me.length-4);
						}
						else if (me.buildingTie) me=me.dname+' : '+loc(choose(["Never forget your %1.","Pay close attention to the humble %1.","You've been neglecting your %1.","Remember to visit your %1 sometimes."]),me.buildingTie.single);
						else me=me.dname+' : '+loc(choose(["You don't know what you have until you've lost it.","Remember to take breaks.","Hey, what's up. I'm a fortune cookie.","You think you have it bad? Look at me."]));
					}
					me='<span class="fortune"><div class="icon" style="vertical-align:middle;display:inline-block;background-position:'+(-29*48)+'px '+(-8*48)+'px;transform:scale(0.5);margin:-16px;position:relative;left:-4px;top:-2px;"></div>'+me+'</span>';
					list=[me];
				}
			}
			
			if (Game.windowW<Game.tickerTooNarrow) list=['<div style="transform:scale(0.8,1.2);">'+NEWS+(EN?'help!':loc("help me!"))+'</div>'];
			
			Game.TickerAge=Game.fps*10;
			Game.Ticker=choose(list);
			Game.AddToLog(Game.Ticker);
			Game.TickerN++;
			Game.TickerDraw();
		}

		export function TickerDraw()
		{
			var str='';
			if (Game.Ticker!='') str=Game.Ticker;
			Game.tickerBelowL.innerHTML=Game.tickerL.innerHTML;
			Game.tickerL.innerHTML=str;
			
			Game.tickerBelowL.className='commentsText';
			void Game.tickerBelowL.offsetWidth;
			Game.tickerBelowL.className='commentsText risingAway';
			Game.tickerL.className='commentsText';
			void Game.tickerL.offsetWidth;
			Game.tickerL.className='commentsText risingUp';
		}
