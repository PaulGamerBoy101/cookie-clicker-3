/**
 * content/changelog.ts — the version-history / info HTML (Game.updateLog).
 *
 * Ported verbatim from the 2.048 engine (engine/main.ts, inside Game.Launch,
 * right after the season detection). The engine assigns Game.updateLog =
 * '<info/about html>' then appends each localized patch note from the
 * locPatches table (the locPatches loop) then the full vanilla changelog
 * chain. Same statements, same order, same position — only the file moved;
 * loc, EN, App, locPatches resolve through src/globals.d.ts at runtime
 * (Launch runs after the engine's window shim).
 */
import type { Game as EngineGame } from "../types";

/** Build the info + version-history HTML into Game.updateLog. */
export function declareVanillaChangelog(Game: EngineGame) {
	Game.updateLog=
	'<div class="selectable">'+
	'<div class="section">'+loc("Info")+'</div>'+
	'<div class="subsection">'+
	'<div class="title">'+loc("About")+'</div>'+
	(App?'<div class="listing" style="font-weight:bold;font-style:italic;opacity:0.5;">'+loc("Note: links will open in your web browser.")+'</div>':'')+
	'<div class="listing">'+loc("Cookie Clicker is a javascript game by %1 and %2.",['<a href="//orteil.dashnet.org" target="_blank">Orteil</a>','<a href="//dashnet.org" target="_blank">Opti</a>'])+'</div>'+
	(App?'<div class="listing">'+loc("Music by %1.",'<a href="https://twitter.com/C418" target="_blank">C418</a>')+'</div>':'')+
	//'<div class="listing">We have an <a href="https://discordapp.com/invite/cookie" target="_blank">official Discord</a>, as well as a <a href="http://forum.dashnet.org" target="_blank">forum</a>; '+
	'<div class="listing">'+(EN?
		'We have an <a href="https://discordapp.com/invite/cookie" target="_blank">official Discord</a>; if you\'re looking for help, you may also want to visit the <a href="https://www.reddit.com/r/CookieClicker" target="_blank">subreddit</a> or the <a href="https://cookieclicker.wikia.com/wiki/Cookie_Clicker_Wiki" target="_blank">wiki</a>.<br>News and teasers are usually posted on Orteil\'s <a href="https://orteil42.tumblr.com/" target="_blank">tumblr</a> and <a href="https://twitter.com/orteil42" target="_blank">twitter</a>.'
		:
		loc("Useful links: %1, %2, %3, %4.",[
		'<a href="https://discordapp.com/invite/cookie" target="_blank" class="highlightHover smallBlackButton">Discord</a>',
		'<a href="https://cookieclicker.wikia.com/wiki/Cookie_Clicker_Wiki" target="_blank" class="highlightHover smallBlackButton">wiki</a>',
		'<a href="https://orteil42.tumblr.com/" target="_blank" class="highlightHover smallBlackButton">tumblr</a>',
		'<a href="https://twitter.com/orteil42" target="_blank" class="highlightHover smallBlackButton">twitter</a>',
		]))
	+'</div>'+
	(!App?'<div class="listing block" style="margin:8px 32px;font-size:11px;line-height:110%;color:rgba(200,200,255,1);background:rgba(128,128,255,0.15);" id="supportSection">'+loc(
		"This version of Cookie Clicker is 100% free, forever. Want to support us so we can keep developing games? Here's some ways you can help:%1",
		[(!App?'<br><br>&bull; '+(EN?'get ':'')+'<a href="https://store.steampowered.com/app/1454400/Cookie_Clicker/" target="_blank" class="highlightHover smallWhiteButton">Cookie Clicker on Steam</a>':'')+''+(EN?' (it\'s about 5 bucks)':'')+'<br><br>&bull; '+(EN?'support us on ':'')+'<a href="https://www.patreon.com/dashnet" target="_blank" class="highlightHover smallOrangeButton">Patreon</a>'+(EN?' (there\'s perks!)':'')+'<br><br>&bull; '+(EN?'check out our ':'')+'<a href="http://www.redbubble.com/people/dashnet" target="_blank" class="highlightHover smallWhiteButton">Shop</a>'+(EN?' with rad cookie shirts, hoodies and stickers':'')+((!App && EN)?'<br><br>&bull; disable your adblocker (if you want!)':'')]
	)+
	'</div></div>':'')+
	'<div class="listing warning">'+loc("Note: if you find a new bug after an update and you're using a 3rd-party add-on, make sure it's not just your add-on causing it!")+'</div>'+
	(!App?('<div class="listing warning">'+loc("Warning: clearing your browser cache or cookies <small>(what else?)</small> will result in your save being wiped. Export your save and back it up first!")+'</div>'):'')+
	
	'</div><div class="subsection">'+
	'<div class="title">Cookie Clicker 3</div>'+
	'<div class="listing">'+loc("This is %1, a modern community rewrite of Cookie Clicker 2.048.",'<a href="https://github.com/giveen/cookie-clicker-3" target="_blank">Cookie Clicker 3</a>')+'</div>'+
	'<div class="listing">'+loc("The 2.048 engine was rebuilt as strictly typed TypeScript ES modules on a zero-dependency Vite build. Behavior, numbers and the save format stay compatible with 2.048 — your existing save imports without changes.")+'</div>'+
	'<div class="listing">'+loc("Compared to the original browser version: no ads, no trackers and no CDN requests (fonts included), an offline-capable PWA with a self-updating service worker, and a one-column layout for phones.")+'</div>'+
	'<div class="listing">'+loc("Music by Bert Cole.")+'</div>'+
	'<div class="listing">'+loc("Where the project is headed: %1.",'<a href="https://github.com/giveen/cookie-clicker-3/blob/master/docs/ROADMAP.md" target="_blank" class="highlightHover smallBlackButton">the roadmap</a>')+'</div>'+
	'</div><div class="subsection">'+
	'<div class="title">'+loc("Version history")+'</div>';
	
	for (var i=0;i<locPatches.length;i++)
	{
		var patch=locPatches[i];
		var patchText=
		'</div><div class="subsection update'+(patch.type==2?' small':'')+'">'+
		'<div class="title">'+patch.title+'</div>';
		for (var ii=0;ii<patch.points.length;ii++)
		{
			patchText+='<div class="listing">&bull; '+patch.points[ii]+'</div>';
		}
		Game.updateLog+=patchText;
	}
	
	if (!EN) Game.updateLog+='<div class="listing" style="font-weight:bold;font-style:italic;opacity:0.5;">'+loc("Note: older update notes are in English.")+'</div>';
	
	Game.updateLog+=

	'</div><div class="subsection update">'+
	'<div class="title">01/09/2026 - purchase feedback, copy-to-clipboard</div>'+
	'<div class="listing">&bull; every building now gets a short grounded bounce on purchase (not just Grandma) — the store-wide feedback the roadmap called for</div>'+
	'<div class="listing">&bull; the Export save prompt now has a "Copy to clipboard" button so you can grab the save code without manually selecting the textarea</div>'+
	'</div><div class="subsection update">'+
	'<div class="title">01/09/2026 - challenges, a roomier store, and cozier minigames</div>'+
	'<div class="listing">&bull; added 4 new challenge modes (pick one when ascending): <b>Trigger finger</b> (scroll over the cookie = click it, no clicking achievements), <b>Ascetic</b> (golden and wrath cookies never spawn), <b>Monoculture</b> (the first building you buy locks in your only building type for the run), and <b>Spender</b> (no upgrades may be purchased, buildings only). Each has a completion shadow achievement that permanently unlocks a reward heavenly upgrade: Scrolling adept (+2% click power, +5% golden effect duration), Golden heart (+15% duration, +5% spawn frequency), Unity (+1% CpS per 100 of your most-owned building), and Minimalist (+2% CpS per 100 prestige upgrades owned)</div>'+
	'<div class="listing">&bull; the building store is no longer a single column: buildings now sit in a staggered, overlapping grid that fills the box, so far more of them are visible at once; also fixed the Mines\' back rows looking transparent and made farms/mines rebuild their sprites when the sprite sheet loads</div>'+
	'<div class="listing">&bull; the heavenly upgrade tree now derives its layout automatically from the upgrade parent graph, and you can rearrange it with clickable presets (Auto / By branch / By generation / Grid) plus drag-to-reposition — the layout saves with your game</div>'+
	'<div class="listing">&bull; Grandma\'s Sitting Room redesigned: the cramped 6&times;6 activity-button table became a proper room layout — seat cards in a 3-column grid with each seat\'s activity icon and stats, a labelled Cozy/Eldritch activity shelf with per-activity comfort and yarn rates, a clearer comfort bar, and card-style shop rows</div>'+
	'<div class="listing">&bull; Cat Colony got the same visual pass: expedition cards with cat-sprite poses and stat chips (cats, duration, treats, risk), color-coded roster chips for idle/away/resting cats, and card-style shop rows</div>'+
	'<div class="listing">&bull; built-in extras (American Season, Casino, Daily Crumb, Black Hole Inverter, Decide Your Destiny, Tutorial) no longer award the "Third-party" achievement on every page load — a genuinely third-party mod still does</div>'+
	'</div><div class="subsection update">'+
	'<div class="title">31/08/2026 - a fuller heavenly chip shop</div>'+
	'<div class="listing">&bull; added 12 low-tier heavenly upgrades (2-30 chips): Blessed apron, Second helping and Angelic recipe (+cookie production), Firm handshake and Demonic hustle (+clicking), Morning bells (golden cookies appear more often), Sugar glaze (golden cookie effects last longer), Patient tongue (golden cookies stay longer), Night watch (offline earnings), Bargaining table (buildings 1% cheaper), Tidy pantry (upgrades 1% cheaper) and Lucky start (start each run with 3 free cursors)</div>'+
	'<div class="listing">&bull; the Ascend confirmation now offers a "Browse the tree" option: view the heavenly upgrades without ascending (nothing resets, no chips earned) — and you can even buy upgrades with the chips you already have. The Reincarnate button becomes a "Back to game" button while browsing</div>'+
	'</div><div class="subsection update">'+
	'<div class="title">23/08/2026 - cookie clicker 3</div>'+
	'<div class="listing">&bull; Cookie Clicker 3: the 2.048 engine, rebuilt as strictly typed TypeScript ES modules on a Vite build — same game, same numbers, same puns</div>'+
	'<div class="listing">&bull; saves stay byte-compatible with Cookie Clicker 2.048 (verified by an automated export/import round-trip)</div>'+
	'<div class="listing">&bull; no ads, no trackers, no CDN requests — every script, image, font and sound is self-hosted</div>'+
	'<div class="listing">&bull; the game now boots offline (PWA), with a self-updating service worker</div>'+
	'<div class="listing">&bull; added the Cats building (with roaming animated cats), 24 cat upgrades, and a full achievement set — 14 tiered, 3 production, 1 level, plus cat-count milestones up to 1,000</div>'+
	'<div class="listing">&bull; muting the Cats store now leaves a little sleeping cat (breathing, tail-flick and zzz) in the muted-icons bar</div>'+
	'<div class="listing">&bull; added the cat synergy system: 8 cat upgrades (Kitten grandmas, Farm cats, Miner cats, Worker cats, Space cats, Golden cats, Altered cats, Time cats) that each make Cats twice as efficient and boost their building +1% per (id-1) cats, plus the "The purr-fect match" achievement for owning all of them</div>'+
	'<div class="listing">&bull; added the Black Hole Inverter building, a native mod with 17 upgrades and 18 achievements</div>'+
	'<div class="listing">&bull; added Decide Your Destiny: spend sugar lumps to choose the outcome of the next natural golden cookie (a native port of klattmose\'s mod)</div>'+
	'<div class="listing">&bull; added American Season: a July 1st season with rockets and a left-panel fireworks canvas (a native port of klattmose\'s mod)</div>'+
	'<div class="listing">&bull; added background music (8 tracks by Bert Cole) and interface tones, with Music and volume settings</div>'+
	'<div class="listing">&bull; rebalanced the late-game building tail back onto the ~2.1x-per-store-step price curve, checked by a full building balance audit</div>'+
	'<div class="listing">&bull; added economy analysis tooling (Game.AnalyzeEconomy / Game.SimulateStrategy) behind the ?qa=content probe</div>'+
	'<div class="listing">&bull; added rolling save backups (history, restore and download from the Options menu)</div>'+
	'<div class="listing">&bull; added one-column responsive mode for phones — the "todo!" Orteil left in the 2.048 CSS, now completed</div>'+
	'<div class="listing">&bull; the v3.0 animation pass: display-rate smooth cookie counter, slide-in columns and notifications, ascend-intro flash + shake (all disabled by "Fancy graphics" off or the OS reduce-motion setting)</div>'+
	'<div class="listing">&bull; added a Content-Security-Policy; deploys are gated by a 21-probe Playwright CI on GitHub Pages</div>'+

	'</div><div class="subsection update">'+
	'<div class="title">31/05/2022 - a mind of its own</div>'+
	'<div class="listing">&bull; added a new building</div>'+
	'<div class="listing">&bull; added a new tier of upgrades and achievements</div>'+
	'<div class="listing">&bull; multi-language support added to web version</div>'+
	'<div class="listing">&bull; added a few new heavenly upgrades</div>'+
	'<div class="listing">&bull; added the jukebox</div>'+
	'<div class="listing">&bull; the 3 secret heavenly upgrades now rely on how many times the relevant digit is present in total, rather than at the end</div>'+
	'<div class="listing">&bull; backgrounds overhauled; extra options for the background selector</div>'+
	'<div class="listing">&bull; extra options for the golden cookie sound selector</div>'+
	'<div class="listing">&bull; the bank minigame now tells you the value you previously bought a stock at</div>'+
	'<div class="listing">&bull; the bank minigame flow is a little more exciting</div>'+
	(App?'<div class="listing">&bull; new option to disable your game activity showing up in Discord</div>':'')+
	(App?'<div class="listing">&bull; launch errors now provide the option to restart without mods</div>':'')+
	
	(App?('</div><div class="subsection update small">'+
	'<div class="title">18/12/2021 - work it</div>'+
	'<div class="listing">&bull; added Steam Workshop support (lets you install mods and upload your own)</div>'+
	'<div class="listing">&bull; added Korean language support</div>'+
	'<div class="listing">&bull; added back "short numbers" option for non-english languages (uses english terms for the time being)</div>'+
	'<div class="listing">&bull; added tooltips on achievement notifications</div>'+
	'<div class="listing">&bull; added Discord rich presence support</div>'):'')+
	
	'</div><div class="subsection update">'+
	'<div class="title">01/09/2021 - give me Steam</div>'+
	'<div class="listing">&bull; Cookie Clicker has been <a href="https://store.steampowered.com/app/1454400/Cookie_Clicker/" target="_blank">released on Steam</a> with music by C418!</div>'+
	'<div class="listing">&bull; web version and Steam version will receive the same updates from now on</div>'+
	'<div class="listing">&bull; you can now play in 13 different languages</div>'+
	'<div class="listing">&bull; new option to disable scary stuff</div>'+
	'<div class="listing">&bull; basic screen-reader support</div>'+
	'<div class="listing">&bull; various other improvements</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">01/11/2020 - alternate reality</div>'+
	'<div class="listing">&bull; new building</div>'+
	'<div class="listing">&bull; new upgrade tier</div>'+
	'<div class="listing">&bull; new achievement tier</div>'+
	'<div class="listing">&bull; new heavenly upgrades</div>'+
	'<div class="listing">&bull; new modding API</div>'+
	'<div class="listing">&bull; new rebalancing (ascension slot prices, finger upgrades...)</div>'+
	'<div class="listing">&bull; new fixes (leap years, ghost swaps, carryover seeds...)</div>'+
	'<div class="listing">&bull; new stuff</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">23/08/2020 - money me, money now</div>'+
	'<div class="listing">&bull; finalized stock market minigame beta and added it to live version</div>'+
	'<div class="listing">&bull; dark mode added to stock market minigame</div>'+
	'<div class="listing">&bull; can no longer select a milk before unlocking it; milk selector layout has been improved</div>'+
	'<div class="listing">&bull; stock market goods have higher value caps and a larger spread; can also shift-click the hide buttons to hide/show all other stocks</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">08/08/2020 - checking account (beta)</div>'+
	'<div class="listing">&bull; stock market layout has been revised</div>'+
	'<div class="listing">&bull; selling stocks no longer increases cookies baked all time</div>'+
	'<div class="listing">&bull; stock prices are now defined by your highest raw CpS this ascension (which is now displayed in the stats screen)</div>'+
	'<div class="listing">&bull; can no longer buy and sell a stock in the same tick</div>'+
	'<div class="listing">&bull; warehouse space now gains +10 per associated building level (up from +5)</div>'+
	'<div class="listing">&bull; bank level now improves average (and maximum) stock values</div>'+
	'<div class="listing">&bull; later stocks are worth more</div>'+
	'<div class="listing">&bull; Cookie Clicker turns 7!</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">18/06/2020 - making bank (beta)</div>'+
	'<div class="listing">&bull; added the stock market minigame, accessible with level 1 banks or above; buy low, sell high!</div>'+
	'<div class="listing">&bull; (minigame subject to heavy rebalancing over the coming patches)</div>'+
	'<div class="listing">&bull; added a couple heavenly upgrades, including one that lets you pet your dragon</div>'+
	'<div class="listing">&bull; added a new tier of building upgrades and achievements</div>'+
	'<div class="listing">&bull; reindeer clicks now properly count for shimmering veil</div>'+
	'<div class="listing">&bull; numbers in scientific notation should display better with Short numbers off</div>'+
	'<div class="listing">&bull; replaced ツ in the javascript console building display with more accurate ッ</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">28/09/2019 - going off-script</div>'+
	'<div class="listing">&bull; added a new building</div>'+
	'<div class="listing">&bull; added fortune cookies (a new heavenly upgrade)</div>'+
	'<div class="listing">&bull; more upgrades, achievements etc</div>'+
	'<div class="listing">&bull; updated the Russian bread cookies icon to better reflect their cyrillic origins</div>'+
	'<div class="listing">&bull; <i style="font-style:italic;">stealth update :</i> the sugar lump refill timeout (not sugar lump growth) now no longer ticks down while the game is closed (this fixes an exploit)</div>'+
	'<div class="listing">&bull; also released the official Android version of Cookie Clicker, playable <a href="https://play.google.com/store/apps/details?id=org.dashnet.cookieclicker" target="_blank">here</a> (iOS version will come later)</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">01/04/2019 - 2.019 (the "this year" update)</div>'+
	'<div class="listing">&bull; game has been renamed to "Cookie Clicker" to avoid confusion</div>'+
	'<div class="listing">&bull; can now click the big cookie to generate cookies for free</div>'+
	'<div class="listing">&bull; removed fall damage</div>'+
	//'<div class="listing">&bull; fixed various typos : player\'s name is now correctly spelled as "[bakeryName]"</div>'+
	'<div class="listing">&bull; removed all references to computer-animated movie <i style="font-style:italic;">Hoodwinked!</i> (2005)</div>'+
	'<div class="listing">&bull; went back in time and invented cookies and computer mice, ensuring Cookie Clicker would one day come to exist</div>'+
	'<div class="listing">&bull; game now fully compliant with Geneva Conventions</div>'+
	'<div class="listing">&bull; dropped support for TI-84 version</div>'+
	'<div class="listing">&bull; released a low-res retro version of the game, playable here : <a href="//orteil.dashnet.org/experiments/cookie/" target="_blank">orteil.dashnet.org/experiments/cookie</a></div>'+
	'<div class="listing">&bull; updated version number</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">05/03/2019 - cookies for days</div>'+
	'<div class="listing">&bull; added over 20 new cookies, all previously suggested by our supporters on <a href="https://www.patreon.com/dashnet" target="_blank">Patreon</a></div>'+
	'<div class="listing">&bull; added 2 heavenly upgrades</div>'+
	'<div class="listing">&bull; the Golden goose egg now counts as a golden cookie upgrade for Residual luck purposes</div>'+
	'<div class="listing">&bull; golden sugar lumps now either double your cookies, or give you 24 hours of your CpS, whichever is lowest (previously was doubling cookies with no cap)</div>'+
	'<div class="listing">&bull; the amount of heralds is now saved with your game, and is used to compute offline CpS the next time the game is loaded; previously, on page load, the offline calculation assumed heralds to be 0</div>'+
	'<div class="listing">&bull; added a system to counteract the game freezing up (and not baking cookies) after being inactive for a long while on slower computers; instead, this will now trigger sleep mode, during which you still produce cookies as if the game was closed; to enable this feature, use the "Sleep mode timeout" option in the settings</div>'+
	'<div class="listing">&bull; vaulting upgrades is now done with shift-click, as ctrl-click was posing issues for Mac browsers</div>'+
	'<div class="listing">&bull; made tooltips for building CpS boosts from synergies hopefully clearer</div>'+
	'<div class="listing">&bull; fixed an exploit with gambler\'s fever dream working across exports and ascensions</div>'+
	'<div class="listing">&bull; can now hide tooltips in the garden by keeping the shift key pressed to make it easier to see where you\'re planting</div>'+
	'<div class="listing">&bull; fixed a bug with golden cookies/reindeer not disappearing properly in some circumstances</div>'+
	'<div class="listing">&bull; the Dragon\'s Curve aura should now properly make sugar lumps twice as weird</div>'+
	'<div class="listing">&bull; the ctrl key should less often register incorrectly as pressed</div>'+
	'<div class="listing">&bull; added a new ad slot in the top-right, as while our playerbase is strong and supportive as ever, our ad revenue sometimes fluctuates badly; we may remove the ad again should our income stabilize</div>'+
	'<div class="listing">&bull; made a few adjustments to make the game somewhat playable in mobile browsers; it\'s not perfect and can get buggy, but it\'s functional! (you may need to zoom out or scroll around to view the game properly)</div>'+
	'<div class="listing">&bull; speaking of which, we also got some good progress on the mobile app version (built from scratch for mobile), so stay tuned!</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">25/10/2018 - feedback loop</div>'+
	'<div class="listing">&bull; added a new building</div>'+
	'<div class="listing">&bull; launched our <a href="https://www.patreon.com/dashnet" class="orangeLink" target="_blank">Patreon</a> <span style="font-size:80%;">(the link is orange so you\'ll notice it!)</span></div>'+
	'<div class="listing">&bull; added a bunch of new heavenly upgrades, one of which ties into our Patreon but benefits everyone (this is still experimental!)</div>'+
	'<div class="listing">&bull; when hovering over grandmas, you can now see their names and ages</div>'+
	'<div class="listing">&bull; "make X cookies just from Y" requirements are now higher</div>'+
	'<div class="listing">&bull; tweaked the prices of some heavenly upgrades to better fit the current cookie economy (it turns out billions of heavenly chips is now very achievable)</div>'+
	'<div class="listing">&bull; building tooltips now display what % of CpS they contribute through synergy upgrades</div>'+
	'<div class="listing">&bull; queenbeets now give up to 4% of bank, down from 6%</div>'+
	'<div class="listing">&bull; among other things, season switches now display how many seasonal upgrades you\'re missing, and permanent upgrade slots now display the name of the slotted upgrade</div>'+
	'<div class="listing">&bull; season switches have reworked prices</div>'+
	'<div class="listing">&bull; season switches can now be cancelled by clicking them again</div>'+
	'<div class="listing">&bull; can no longer accidentally click wrinklers through other elements</div>'+
	'<div class="listing">&bull; sugar frenzy now triples your CpS for an hour instead of doubling it</div>'+
	'<div class="listing">&bull; this text is now selectable</div>'+
	'<div class="listing">&bull; progress on dungeons minigame is still very much ongoing</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">08/08/2018 - hey now</div>'+
	'<div class="listing">&bull; Cookie Clicker somehow turns 5, going against doctors\' most optimistic estimates</div>'+
	'<div class="listing">&bull; added a new tier of building achievements, all named after Smash Mouth\'s classic 1999 hit "All Star"</div>'+
	'<div class="listing">&bull; added a new tier of building upgrades, all named after nothing in particular</div>'+
	'<div class="listing">&bull; <b>to our players :</b> thank you so much for sticking with us all those years and allowing us to keep making the dumbest game known to mankind</div>'+
	'<div class="listing">&bull; resumed work on the dungeons minigame</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">01/08/2018 - buy buy buy</div>'+
	'<div class="listing">&bull; added a heavenly upgrade that lets you buy all your upgrades instantly</div>'+
	'<div class="listing">&bull; added a heavenly upgrade that lets you see upgrade tiers (feature was previously removed due to being confusing)</div>'+
	'<div class="listing">&bull; added a new wrinkler-related heavenly upgrade</div>'+
	'<div class="listing">&bull; added a new upgrade tier</div>'+
	'<div class="listing">&bull; added a couple new cookies and achievements</div>'+
	'<div class="listing">&bull; new "extra buttons" setting; turning it on adds buttons that let you minimize buildings</div>'+
	'<div class="listing">&bull; new "lump confirmation" setting; turning it on will show a confirmation prompt when you spend sugar lumps</div>'+
	'<div class="listing">&bull; buildings now sell back for 25% of their current price (down from 50%); Earth Shatterer modified accordingly, now gives back 50% (down from 85%)</div>'+
	'<div class="listing">&bull; farm soils now unlock correctly based on current amount of farms</div>'+
	'<div class="listing">&bull; cheapcaps have a new exciting nerf</div>'+
	'<div class="listing">&bull; wrinklegill spawns a bunch more</div>'+
	'<div class="listing">&bull; can now ctrl-shift-click on "Harvest all" to only harvest mature, non-immortal plants</div>'+
	'<div class="listing">&bull; added a new rare type of sugar lump</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">20/04/2018 - weeding out some bugs</div>'+
	'<div class="listing">&bull; golden clovers and wrinklegills should spawn a bit more often</div>'+
	'<div class="listing">&bull; cronerice matures a lot sooner</div>'+
	'<div class="listing">&bull; mature elderworts stay mature after reloading</div>'+
	'<div class="listing">&bull; garden interface occupies space more intelligently</div>'+
	'<div class="listing">&bull; seed price displays should be better behaved with short numbers disabled</div>'+
	'<div class="listing">&bull; minigame animations are now turned off if using the "Fancy graphics" option is disabled</div>'+
	'<div class="listing">&bull; CpS achievement requirements were dialed down a wee tad</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">19/04/2018 - garden patch</div>'+
	'<div class="listing">&bull; upgrades dropped by garden plants now stay unlocked forever (but drop much more rarely)</div>'+
	'<div class="listing">&bull; garden sugar lump refill now also makes plants spread and mutate 3 times more during the bonus tick</div>'+
	'<div class="listing">&bull; a few new upgrades</div>'+
	'<div class="listing">&bull; a couple bug fixes and rephrasings</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">18/04/2018 - your garden-variety update</div>'+
	'<div class="listing">&bull; added the garden, a minigame unlocked by having at least level 1 farms</div>'+
	'<div class="listing">&bull; added a little arrow and a blinky label to signal the game has updated since you last played it (hi!)</div>'+
	'<div class="listing">&bull; new cookies, milk flavors and achievements</div>'+
	'<div class="listing">&bull; sugar lumps are now unlocked whenever you\'ve baked at least a billion cookies, instead of on your first ascension</div>'+
	'<div class="listing">&bull; sugar lump type now saves correctly</div>'+
	'<div class="listing">&bull; minigame sugar lump refills can now only be done every 15 minutes (timer shared across all minigames)</div>'+
	'<div class="listing">&bull; CpS achievements now have steeper requirements</div>'+
	'<div class="listing">&bull; golden cookies now last 5% shorter for every other golden cookie on the screen</div>'+
	'<div class="listing">&bull; the game now remembers which minigames are closed or open</div>'+
	'<div class="listing">&bull; added a popup that shows when a season starts (so people won\'t be so confused about "the game looking weird today")</div>'+
	'<div class="listing">&bull; permanent upgrade slots now show a tooltip for the selected upgrade</div>'+
	'<div class="listing">&bull; finally fixed the save corruption bug, hopefully</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">24/02/2018 - sugar coating</div>'+
	'<div class="listing">&bull; added link to <a href="https://discordapp.com/invite/cookie" target="_blank">official Discord server</a></div>'+
	'<div class="listing">&bull; felt weird about pushing an update without content so :</div>'+
	'<div class="listing">&bull; added a handful of new cookies</div>'+
	'<div class="listing">&bull; added 3 new heavenly upgrades</div>'+
	'<div class="listing">&bull; short numbers should now be displayed up to novemnonagintillions</div>'+
	'<div class="listing">&bull; cookie chains no longer spawn from the Force the Hand of Fate spell</div>'+
	'<div class="listing">&bull; bigger, better Cookie Clicker content coming later this year</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">08/08/2017 - 4 more years</div>'+
	'<div class="listing">&bull; new building : Chancemakers</div>'+
	'<div class="listing">&bull; new milk, new kittens, new dragon aura, new cookie, new upgrade tier</div>'+
	'<div class="listing">&bull; buffs no longer affect offline CpS</div>'+
	'<div class="listing">&bull; Godzamok\'s hunger was made less potent (this is a nerf, very sorry)</div>'+
	'<div class="listing">&bull; grimoire spell costs and maximum magic work differently</div>'+
	'<div class="listing">&bull; Spontaneous Edifice has been reworked</div>'+
	'<div class="listing">&bull; changed unlock levels and prices for some cursor upgrades</div>'+
	'<div class="listing">&bull; fixed buggy pantheon slots, hopefully</div>'+
	'<div class="listing">&bull; fixed "Legacy started a long while ago" showing as "a few seconds ago"</div>'+
	'<div class="listing">&bull; Cookie Clicker just turned 4. Thank you for sticking with us this long!</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">15/07/2017 - the spiritual update</div>'+
	'<div class="listing">&bull; implemented sugar lumps, which start coalescing if you\'ve ascended at least once and can be used as currency for special things</div>'+
	'<div class="listing">&bull; buildings can now level up by using sugar lumps in the main buildings display, permanently boosting their CpS</div>'+
	'<div class="listing">&bull; added two new features unlocked by levelling up their associated buildings, Temples and Wizard towers; more building-related minigames will be implemented in the future</div>'+
	'<div class="listing">&bull; active buffs are now saved</div>'+
	'<div class="listing">&bull; the background selector upgrade is now functional</div>'+
	'<div class="listing">&bull; the top menu no longer scrolls with the rest</div>'+
	'<div class="listing">&bull; timespans are written nicer</div>'+
	'<div class="listing">&bull; Dragonflights now tend to supercede Click frenzies, you will rarely have both at the same time</div>'+
	'<div class="listing">&bull; some old bugs were phased out and replaced by new ones</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">24/07/2016 - golden cookies overhaul</div>'+
	'<div class="listing">&bull; golden cookies and reindeer now follow a new system involving explicitly defined buffs</div>'+
	'<div class="listing">&bull; a bunch of new golden cookie effects have been added</div>'+
	'<div class="listing">&bull; CpS gains from eggs are now multiplicative</div>'+
	'<div class="listing">&bull; shiny wrinklers are now saved</div>'+
	'<div class="listing">&bull; reindeer have been rebalanced ever so slightly</div>'+
	'<div class="listing">&bull; added a new cookie upgrade near the root of the heavenly upgrade tree; this is intended to boost early ascensions and speed up the game as a whole</div>'+
	'<div class="listing">&bull; due to EU legislation, implemented a warning message regarding browser cookies; do understand that the irony is not lost on us</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">08/02/2016 - legacy</div>'+
	'<div class="listing"><b>Everything that was implemented during the almost 2-year-long beta has been added to the live game. To recap :</b></div>'+
	'<div class="listing">&bull; 3 new buildings : banks, temples, and wizard towers; these have been added in-between existing buildings and as such, may disrupt some building-related achievements</div>'+
	'<div class="listing">&bull; the ascension system has been redone from scratch, with a new heavenly upgrade tree</div>'+
	'<div class="listing">&bull; mysterious new features such as angel-powered offline progression, challenge runs, and a cookie dragon</div>'+
	'<div class="listing">&bull; sounds have been added (can be disabled in the options)</div>'+
	'<div class="listing">&bull; heaps of rebalancing and bug fixes</div>'+
	'<div class="listing">&bull; a couple more upgrades and achievements, probably</div>'+
	'<div class="listing">&bull; fresh new options to further customize your cookie-clicking experience</div>'+
	'<div class="listing">&bull; quality-of-life improvements : better bulk-buy, better switches etc</div>'+
	'<div class="listing">&bull; added some <a href="http://en.wikipedia.org/wiki/'+choose(['Krzysztof_Arciszewski','Eustachy_Sanguszko','Maurycy_Hauke','Karol_Turno','Tadeusz_Kutrzeba','Kazimierz_Fabrycy','Florian_Siwicki'])+'" target="_blank">general polish</a></div>'+/* i liked this dumb pun too much to let it go unnoticed */
	'<div class="listing">&bull; tons of other little things we can\'t even remember right now</div>'+
	'<div class="listing">Miss the old version? Your old save was automatically exported <a href="//orteil.dashnet.org/cookieclicker/v10466/" target="_blank">here</a>!</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">05/02/2016 - legacy beta, more fixes</div>'+
	'<div class="listing">&bull; added challenge modes, which can be selected when ascending (only 1 for now : "Born again")</div>'+
	'<div class="listing">&bull; changed the way bulk-buying and bulk-selling works</div>'+
	'<div class="listing">&bull; more bugs ironed out</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">03/02/2016 - legacy beta, part III</div>'+
	'<div class="listing warning">&bull; Not all bugs have been fixed, but everything should be much less broken.</div>'+
	'<div class="listing">&bull; Additions'+
		'<div style="opacity:0.8;margin-left:12px;">'+
		'-a few more achievements<br>'+
		'-new option for neat, but slow CSS effects (disabled by default)<br>'+
		'-new option for a less grating cookie sound (enabled by default)<br>'+
		'-new option to bring back the boxes around icons in the stats screen<br>'+
		'-new buttons for saving and loading your game to a text file<br>'+
		'</div>'+
	'</div>'+
	'<div class="listing">&bull; Changes'+
		'<div style="opacity:0.8;margin-left:12px;">'+
		'-early game should be a bit faster and very late game was kindly asked to tone it down a tad<br>'+
		'-dragonflight should be somewhat less ridiculously overpowered<br>'+
		'-please let me know if the rebalancing was too heavy or not heavy enough<br>'+
		'-santa and easter upgrades now depend on Santa level and amount of eggs owned, respectively, instead of costing several minutes worth of CpS<br>'+
		'-cookie upgrades now stack multiplicatively rather than additively<br>'+
		'-golden switch now gives +50% CpS, and residual luck is +10% CpS per golden cookie upgrade (up from +25% and +1%, respectively)<br>'+
		'-lucky cookies and cookie chain payouts have been modified a bit, possibly for the better, who knows!<br>'+
		'-wrinklers had previously been reduced to a maximum of 8 (10 with a heavenly upgrade), but are now back to 10 (12 with the upgrade)<br>'+
		/*'-all animations are now handled by requestAnimationFrame(), which should hopefully help make the game less resource-intensive<br>'+*/
		'-an ascension now only counts for achievement purposes if you earned at least 1 prestige level from it<br>'+
		'-the emblematic Cookie Clicker font (Kavoon) was bugged in Firefox, and has been replaced with a new font (Merriweather)<br>'+
		'-the mysterious wrinkly creature is now even rarer, but has a shadow achievement tied to it<br>'+
		'</div>'+
	'</div>'+
	'<div class="listing">&bull; Fixes'+
		'<div style="opacity:0.8;margin-left:12px;">'+
		'-prestige now grants +1% CpS per level as intended, instead of +100%<br>'+
		'-heavenly chips should no longer add up like crazy when you ascend<br>'+
		'-upgrades in the store should no longer randomly go unsorted<br>'+
		'-window can be resized to any size again<br>'+
		'-the "Stats" and "Options" buttons have been swapped again<br>'+
		'-the golden cookie sound should be somewhat clearer<br>'+
		'-the ascend screen should be less CPU-hungry<br>'+
		'</div>'+
	'</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">20/12/2015 - legacy beta, part II</div>'+
	'<div class="listing warning">&bull; existing beta saves have been wiped due to format inconsistencies and just plain broken balance; you\'ll have to start over from scratch - which will allow you to fully experience the update and find all the awful little bugs that no doubt plague it</div>'+
	'<div class="listing warning">&bull; importing your save from the live version is also fine</div>'+
	'<div class="listing">&bull; we took so long to make this update, Cookie Clicker turned 2 years old in the meantime! Hurray!</div>'+
	'<div class="listing">&bull; heaps of new upgrades and achievements</div>'+
	'<div class="listing">&bull; fixed a whole bunch of bugs</div>'+
	'<div class="listing">&bull; did a lot of rebalancing</div>'+
	'<div class="listing">&bull; reworked heavenly chips and heavenly cookies (still experimenting, will probably rebalance things further)</div>'+
	'<div class="listing">&bull; you may now unlock a dragon friend</div>'+
	'<div class="listing">&bull; switches and season triggers now have their own store section</div>'+
	'<div class="listing">&bull; ctrl-s and ctrl-o now save the game and open the import menu, respectively</div>'+
	'<div class="listing">&bull; added some quick sounds, just as a test</div>'+
	'<div class="listing">&bull; a couple more options</div>'+
	'<div class="listing">&bull; even more miscellaneous changes and additions</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">25/08/2014 - legacy beta, part I</div>'+
	'<div class="listing">&bull; 3 new buildings</div>'+
	'<div class="listing">&bull; price and CpS curves revamped</div>'+
	'<div class="listing">&bull; CpS calculations revamped; cookie upgrades now stack multiplicatively</div>'+
	'<div class="listing">&bull; prestige system redone from scratch, with a whole new upgrade tree</div>'+
	'<div class="listing">&bull; added some <a href="http://en.wikipedia.org/wiki/'+choose(['Krzysztof_Arciszewski','Eustachy_Sanguszko','Maurycy_Hauke','Karol_Turno','Tadeusz_Kutrzeba','Kazimierz_Fabrycy','Florian_Siwicki'])+'" target="_blank">general polish</a></div>'+
	'<div class="listing">&bull; tons of other miscellaneous fixes and additions</div>'+
	'<div class="listing">&bull; Cookie Clicker is now 1 year old! (Thank you guys for all the support!)</div>'+
	'<div class="listing warning">&bull; Note : this is a beta; you are likely to encounter bugs and oversights. Feel free to send me feedback if you find something fishy!</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">18/05/2014 - better late than easter</div>'+
	'<div class="listing">&bull; bunnies and eggs, somehow</div>'+
	'<div class="listing">&bull; prompts now have keyboard shortcuts like system prompts would</div>'+
	'<div class="listing">&bull; naming your bakery? you betcha</div>'+
	'<div class="listing">&bull; "Fast notes" option to make all notifications close faster; new button to close all notifications</div>'+
	'<div class="listing">&bull; the dungeons beta is now available on <a href="//orteil.dashnet.org/cookieclicker/betadungeons" target="_blank">/betadungeons</a></div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">09/04/2014 - nightmare in heaven</div>'+
	'<div class="listing">&bull; broke a thing; heavenly chips were corrupted for some people</div>'+
	'<div class="listing">&bull; will probably update to /beta first in the future</div>'+
	'<div class="listing">&bull; sorry again</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">09/04/2014 - quality of life</div>'+
	'<div class="listing">&bull; new upgrade and achievement tier</div>'+
	'<div class="listing">&bull; popups and prompts are much nicer</div>'+
	'<div class="listing">&bull; tooltips on buildings are more informative</div>'+
	'<div class="listing">&bull; implemented a simplified version of the <a href="https://github.com/Icehawk78/FrozenCookies" target="_blank">Frozen Cookies</a> add-on\'s short number formatting</div>'+
	'<div class="listing">&bull; you can now buy 10 and sell all of a building at a time</div>'+
	'<div class="listing">&bull; tons of optimizations and subtler changes</div>'+
	'<div class="listing">&bull; you can now <a href="//orteil.dashnet.org/cookies2cash/" target="_blank">convert your cookies to cash</a>!</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">05/04/2014 - pity the fool</div>'+
	'<div class="listing">&bull; wrinklers should now be saved so you don\'t have to pop them every time you refresh the game</div>'+
	'<div class="listing">&bull; you now properly win 1 cookie upon reaching 10 billion cookies and making it on the local news</div>'+
	'<div class="listing">&bull; miscellaneous fixes and tiny additions</div>'+
	'<div class="listing">&bull; added a few very rudimentary mod hooks</div>'+
	'<div class="listing">&bull; the game should work again in Opera</div>'+
	'<div class="listing">&bull; don\'t forget to check out <a href="//orteil.dashnet.org/randomgen/" target="_blank">RandomGen</a>, our all-purpose random generator maker!</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">01/04/2014 - fooling around</div>'+
	'<div class="listing">&bull; it\'s about time : Cookie Clicker has turned into the much more realistic Cookie Baker</div>'+
	'<div class="listing">&bull; season triggers are cheaper and properly unlock again when they run out</div>'+
	'<div class="listing">&bull; buildings should properly unlock (reminder : building unlocking is completely cosmetic and does not change the gameplay)</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">14/02/2014 - lovely rainbowcalypse</div>'+
	'<div class="listing">&bull; new building (it\'s been a while). More to come!</div>'+
	'<div class="listing">&bull; you can now trigger seasonal events to your heart\'s content (upgrade unlocks at 5000 heavenly chips)</div>'+
	'<div class="listing">&bull; new ultra-expensive batch of seasonal cookie upgrades you\'ll love to hate</div>'+
	'<div class="listing">&bull; new timer bars for golden cookie buffs</div>'+
	'<div class="listing">&bull; buildings are now hidden when you start out and appear as they become available</div>'+
	'<div class="listing">&bull; technical stuff : the game is now saved through localstorage instead of browser cookies, therefore ruining a perfectly good pun</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">22/12/2013 - merry fixmas</div>'+
	'<div class="listing">&bull; some issues with the christmas upgrades have been fixed</div>'+
	'<div class="listing">&bull; reindeer cookie drops are now more common</div>'+
	'<div class="listing">&bull; reindeers are now reindeer</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">20/12/2013 - Christmas is here</div>'+
	'<div class="listing">&bull; there is now a festive new evolving upgrade in store</div>'+
	'<div class="listing">&bull; reindeer are running amok (catch them if you can!)</div>'+
	'<div class="listing">&bull; added a new option to warn you when you close the window, so you don\'t lose your un-popped wrinklers</div>'+
	'<div class="listing">&bull; also added a separate option for displaying cursors</div>'+
	'<div class="listing">&bull; all the Halloween features are still there (and having the Spooky cookies achievements makes the Halloween cookies drop much more often)</div>'+
	'<div class="listing">&bull; oh yeah, we now have <a href="http://www.redbubble.com/people/dashnet" target="_blank">Cookie Clicker shirts, stickers and hoodies</a>! (they\'re really rad)</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">29/10/2013 - spooky update</div>'+
	'<div class="listing">&bull; the Grandmapocalypse now spawns wrinklers, hideous elderly creatures that damage your CpS when they reach your big cookie. Thankfully, you can click on them to make them explode (you\'ll even gain back the cookies they\'ve swallowed - with interest!).</div>'+
	'<div class="listing">&bull; wrath cookie now 27% spookier</div>'+
	'<div class="listing">&bull; some other stuff</div>'+
	'<div class="listing">&bull; you should totally go check out <a href="http://candybox2.net/" target="_blank">Candy Box 2</a>, the sequel to the game that inspired Cookie Clicker</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">15/10/2013 - it\'s a secret</div>'+
	'<div class="listing">&bull; added a new heavenly upgrade that gives you 5% of your heavenly chips power for 11 cookies (if you purchased the Heavenly key, you might need to buy it again, sorry)</div>'+
	'<div class="listing">&bull; golden cookie chains should now work properly</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">15/10/2013 - player-friendly</div>'+
	'<div class="listing">&bull; heavenly upgrades are now way, way cheaper</div>'+
	'<div class="listing">&bull; tier 5 building upgrades are 5 times cheaper</div>'+
	'<div class="listing">&bull; cursors now just plain disappear with Fancy Graphics off, I might add a proper option to toggle only the cursors later</div>'+
	'<div class="listing">&bull; warning : the Cookie Monster add-on seems to be buggy with this update, you might want to wait until its programmer updates it</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">15/10/2013 - a couple fixes</div>'+
	'<div class="listing">&bull; golden cookies should no longer spawn embarrassingly often</div>'+
	'<div class="listing">&bull; cursors now stop moving if Fancy Graphics is turned off</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">14/10/2013 - going for the gold</div>'+
	'<div class="listing">&bull; golden cookie chains work a bit differently</div>'+
	'<div class="listing">&bull; golden cookie spawns are more random</div>'+
	'<div class="listing">&bull; CpS achievements are no longer affected by golden cookie frenzies</div>'+
	'<div class="listing">&bull; revised cookie-baking achievement requirements</div>'+
	'<div class="listing">&bull; heavenly chips now require upgrades to function at full capacity</div>'+
	'<div class="listing">&bull; added 4 more cookie upgrades, unlocked after reaching certain amounts of Heavenly Chips</div>'+
	'<div class="listing">&bull; speed baking achievements now require you to have no heavenly upgrades; as such, they have been reset for everyone (along with the Hardcore achievement) to better match their initially intended difficulty</div>'+
	'<div class="listing">&bull; made good progress on the mobile port</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">01/10/2013 - smoothing it out</div>'+
	'<div class="listing">&bull; some visual effects have been completely rewritten and should now run more smoothly (and be less CPU-intensive)</div>'+
	'<div class="listing">&bull; new upgrade tier</div>'+
	'<div class="listing">&bull; new milk tier</div>'+
	'<div class="listing">&bull; cookie chains have different capping mechanics</div>'+
	'<div class="listing">&bull; antimatter condensers are back to their previous price</div>'+
	'<div class="listing">&bull; heavenly chips now give +2% CpS again (they will be extensively reworked in the future)</div>'+
	'<div class="listing">&bull; farms have been buffed a bit (to popular demand)</div>'+
	'<div class="listing">&bull; dungeons still need a bit more work and will be released soon - we want them to be just right! (you can test an unfinished version in <a href="//orteil.dashnet.org/cookieclicker/betadungeons/" target="_blank">the beta</a>)</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">28/09/2013 - dungeon beta</div>'+
	'<div class="listing">&bull; from now on, big updates will come through a beta stage first (you can <a href="//orteil.dashnet.org/cookieclicker/betadungeons/" target="_blank">try it here</a>)</div>'+
	'<div class="listing">&bull; first dungeons! (you need 50 factories to unlock them!)</div>'+
	'<div class="listing">&bull; cookie chains can be longer</div>'+
	'<div class="listing">&bull; antimatter condensers are a bit more expensive</div>'+
	'<div class="listing">&bull; heavenly chips now only give +1% cps each (to account for all the cookies made from condensers)</div>'+
	'<div class="listing">&bull; added flavor text on all upgrades</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">15/09/2013 - anticookies</div>'+
	'<div class="listing">&bull; ran out of regular matter to make your cookies? Try our new antimatter condensers!</div>'+
	'<div class="listing">&bull; renamed Hard-reset to "Wipe save" to avoid confusion</div>'+
	'<div class="listing">&bull; reset achievements are now regular achievements and require cookies baked all time, not cookies in bank</div>'+
	'<div class="listing">&bull; heavenly chips have been nerfed a bit (and are now awarded following a geometric progression : 1 trillion for the first, 2 for the second, etc); the prestige system will be extensively reworked in a future update (after dungeons)</div>'+
	'<div class="listing">&bull; golden cookie clicks are no longer reset by soft-resets</div>'+
	'<div class="listing">&bull; you can now see how long you\'ve been playing in the stats</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">08/09/2013 - everlasting cookies</div>'+
	'<div class="listing">&bull; added a prestige system - resetting gives you permanent CpS boosts (the more cookies made before resetting, the bigger the boost!)</div>'+
	'<div class="listing">&bull; save format has been slightly modified to take less space</div>'+
	'<div class="listing">&bull; Leprechaun has been bumped to 777 golden cookies clicked and is now shadow; Fortune is the new 77 golden cookies achievement</div>'+
	'<div class="listing">&bull; clicking frenzy is now x777</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">04/09/2013 - smarter cookie</div>'+
	'<div class="listing">&bull; golden cookies only have 20% chance of giving the same outcome twice in a row now</div>'+
	'<div class="listing">&bull; added a golden cookie upgrade</div>'+
	'<div class="listing">&bull; added an upgrade that makes pledges last twice as long (requires having pledged 10 times)</div>'+
	'<div class="listing">&bull; Quintillion fingers is now twice as efficient</div>'+
	'<div class="listing">&bull; Uncanny clicker was really too unpredictable; it is now a regular achievement and no longer requires a world record, just *pretty fast* clicking</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">02/09/2013 - a better way out</div>'+
	'<div class="listing">&bull; Elder Covenant is even cheaper, and revoking it is cheaper still (also added a new achievement for getting it)</div>'+
	'<div class="listing">&bull; each grandma upgrade now requires 15 of the matching building</div>'+
	'<div class="listing">&bull; the dreaded bottom cursor has been fixed with a new cursor display style</div>'+
	'<div class="listing">&bull; added an option for faster, cheaper graphics</div>'+
	'<div class="listing">&bull; base64 encoding has been redone; this might make saving possible again on some older browsers</div>'+
	'<div class="listing">&bull; shadow achievements now have their own section</div>'+
	'<div class="listing">&bull; raspberry juice is now named raspberry milk, despite raspberry juice being delicious and going unquestionably well with cookies</div>'+
	'<div class="listing">&bull; HOTFIX : cursors now click; fancy graphics button renamed; cookies amount now more visible against cursors</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">01/09/2013 - sorting things out</div>'+
	'<div class="listing">&bull; upgrades and achievements are properly sorted in the stats screen</div>'+
	'<div class="listing">&bull; made Elder Covenant much cheaper and less harmful</div>'+
	'<div class="listing">&bull; importing from the first version has been disabled, as promised</div>'+
	'<div class="listing">&bull; "One mind" now actually asks you to confirm the upgrade</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">31/08/2013 - hotfixes</div>'+
	'<div class="listing">&bull; added a way to permanently stop the grandmapocalypse</div>'+
	'<div class="listing">&bull; Elder Pledge price is now capped</div>'+
	'<div class="listing">&bull; One Mind and other grandma research upgrades are now a little more powerful, if not 100% accurate</div>'+
	'<div class="listing">&bull; "golden" cookie now appears again during grandmapocalypse; Elder Pledge-related achievements are now unlockable</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">31/08/2013 - too many grandmas</div>'+
	'<div class="listing">&bull; the grandmapocalypse is back, along with more grandma types</div>'+
	'<div class="listing">&bull; added some upgrades that boost your clicking power and make it scale with your cps</div>'+
	'<div class="listing">&bull; clicking achievements made harder; Neverclick is now a shadow achievement; Uncanny clicker should now truly be a world record</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">28/08/2013 - over-achiever</div>'+
	'<div class="listing">&bull; added a few more achievements</div>'+
	'<div class="listing">&bull; reworked the "Bake X cookies" achievements so they take longer to achieve</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">27/08/2013 - a bad idea</div>'+
	'<div class="listing">&bull; due to popular demand, retired 5 achievements (the "reset your game" and "cheat" ones); they can still be unlocked, but do not count toward your total anymore. Don\'t worry, there will be many more achievements soon!</div>'+
	'<div class="listing">&bull; made some achievements hidden for added mystery</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">27/08/2013 - a sense of achievement</div>'+
	'<div class="listing">&bull; added achievements (and milk)</div>'+
	'<div class="listing"><i>(this is a big update, please don\'t get too mad if you lose some data!)</i></div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">26/08/2013 - new upgrade tier</div>'+
	'<div class="listing">&bull; added some more upgrades (including a couple golden cookie-related ones)</div>'+
	'<div class="listing">&bull; added clicking stats</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">26/08/2013 - more tweaks</div>'+
	'<div class="listing">&bull; tweaked a couple cursor upgrades</div>'+
	'<div class="listing">&bull; made time machines less powerful</div>'+
	'<div class="listing">&bull; added offline mode option</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">25/08/2013 - tweaks</div>'+
	'<div class="listing">&bull; rebalanced progression curve (mid- and end-game objects cost more and give more)</div>'+
	'<div class="listing">&bull; added some more cookie upgrades</div>'+
	'<div class="listing">&bull; added CpS for cursors</div>'+
	'<div class="listing">&bull; added sell button</div>'+
	'<div class="listing">&bull; made golden cookie more useful</div>'+
	
	'</div><div class="subsection update small">'+
	'<div class="title">24/08/2013 - hotfixes</div>'+
	'<div class="listing">&bull; added import/export feature, which also allows you to retrieve a save game from the old version (will be disabled in a week to prevent too much cheating)</div>'+
	'<div class="listing">&bull; upgrade store now has unlimited slots (just hover over it), due to popular demand</div>'+
	'<div class="listing">&bull; added update log</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">24/08/2013 - big update!</div>'+
	'<div class="listing">&bull; revamped the whole game (new graphics, new game mechanics)</div>'+
	'<div class="listing">&bull; added upgrades</div>'+
	'<div class="listing">&bull; much safer saving</div>'+
	
	'</div><div class="subsection update">'+
	'<div class="title">08/08/2013 - game launch</div>'+
	'<div class="listing">&bull; made <a href="https://orteil.dashnet.org/experiments/cookie/" target="_blank">the game</a> in a couple hours, for laughs</div>'+
	'<div class="listing">&bull; kinda starting to regret it</div>'+
	'<div class="listing">&bull; ah well</div>'+
	'</div>'+
	'</div>'
	;
}
