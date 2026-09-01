/* CC3: Cat Colony minigame (engine/minigameCatColony.ts).
 *
 * Follows the established minigame shape (see minigamePantheon.ts): a plain
 * `M` object hung off the parent building, `M.launch` building `M.init` /
 * `M.save` / `M.load` / `M.reset` / `M.logic` / `M.draw`, no imports — every
 * helper (`l`, `Pic`, `AddEvent`, `PlaySound`, `Beautify`, `loc`, `Game`)
 * resolves through src/globals.d.ts exactly like the other four minigames.
 *
 * Concept: dispatch idle colony cats on timed expeditions; they come home
 * with Treats (a minigame-local currency) or, occasionally, a scuffle that
 * needs a nap to sleep off. Treats buy REPEATABLE stacks of the six Cat
 * Colony upgrades declared in content/upgrades.ts (flat price every stack,
 * each stack adds its full effect — the stacks are this minigame's endless
 * treat sink), which feed straight into the Cats CpS formula's existing
 * catAdd/catMult arrays (content/buildings/cats.ts, which read
 * M.effectiveStacks rather than Game.Has for these six). The first stack of
 * an upgrade still marks it bought in the main save (via .earn()), so
 * pre-stacking saves migrate cleanly.
 *
 * Deliberately reuses only assets already in the repo: the background is
 * img/cats/Summer1.png (the same scene the Cats building room already
 * draws), the roster visualization is CSS keyframe sprite-stepping over
 * img/cats/idle.png and img/cats/sleep.png (the same technique
 * styles/main.css already uses for the muted-Cats sleeping store icon), and
 * every sound is one already shipped in public/snd/.
 */
var M: any = {};
M.parent = Game.Objects['Cats'];
M.parent.minigame = M;
M.launch = function () {
	var M = this;
	M.name = M.parent.minigameName;
	M.init = function (div: any) {
		//populate div with html and initialize values

		// Long-grind tuning: durations are ~4x the launch values and rewards
		// roughly halved, so a colony that used to run out of things to do in
		// a couple of hours now takes days of slow expeditions to work off —
		// and the (now repeatable) upgrade shop below is the treat sink that
		// keeps it meaningful. Net treat throughput lands at ~45-50/hour per
		// dispatched cat.
		M.missions = [
			{ id: 'yarn', name: 'Yarn Ball Retrieval', desc: 'Send cats to liberate a yarn ball from the neighbor\'s porch. Low risk, low reward.', catCost: 1, duration: 80, hurtChance: 0.05, treatsMin: 1, treatsMax: 1, unlock: 1 },
			{ id: 'sunbeam', name: 'The Great Sunbeam Hunt', desc: 'A perfect patch of sunlight has been sighted two yards over. Time is of the essence.', catCost: 2, duration: 180, hurtChance: 0.08, treatsMin: 1, treatsMax: 3, unlock: 10 },
			{ id: 'pantry', name: 'Pantry Reconnaissance', desc: 'Scout the kitchen pantry for unattended treats.', catCost: 3, duration: 360, hurtChance: 0.12, treatsMin: 3, treatsMax: 6, unlock: 25 },
			{ id: 'wrinkler', name: 'Wrinkler Standoff', desc: 'A wrinkler has been spotted near the cookie stash. Someone has to deal with it.', catCost: 4, duration: 720, hurtChance: 0.25, treatsMin: 7, treatsMax: 12, unlock: 50 },
			{ id: 'alley', name: 'Back-Alley Turf Summit', desc: 'Negotiate territory with the alley cat coalition.', catCost: 5, duration: 1200, hurtChance: 0.18, treatsMin: 12, treatsMax: 20, unlock: 100 },
			{ id: 'ninelives', name: 'The Nine Lives Expedition', desc: 'A legendary trek said to grant a cat back one of its nine lives.', catCost: 6, duration: 2400, hurtChance: 0.15, treatsMin: 25, treatsMax: 40, unlock: 200 }
		];
		M.missionsById = {};
		for (var mi = 0; mi < M.missions.length; mi++) { M.missionsById[M.missions[mi].id] = M.missions[mi]; }

		// Ordered to match the .catAdd/.catMult declarations in
		// content/upgrades.ts; price and description live on the real
		// Game.Upgrade object (.treatsPrice), not duplicated here.
		M.upgradeNames = ['Cardboard fort training', 'Sunbeam napping technique', 'Treat-sniffing whiskers', 'Nine-lives insurance', 'Golden collar bells', 'Legendary colony charter'];

		M.treats = 0;
		M.missionsCompleted = 0;
		M.treatsEarnedTotal = 0;
		M.away = []; //{uid,id (mission id),count,returnAt}
		M.resting = []; //{uid,count,returnAt}
		M.uidN = 1;
		// Fractional treat accumulator for the 'Bottomless treat jar' heavenly
		// upgrade (content/upgrades.ts). Intentionally not persisted in
		// M.save/M.load: it never holds more than 1 treat's worth, so losing it
		// across a save/reload is a sub-1-treat rounding error, not a real loss.
		M.treatTrickle = 0;
		// Repeatable stacks per colony upgrade (parallel to M.upgradeNames):
		// each purchase adds one stack, each stack adds its full effect, and
		// the price never changes. This is what keeps the colony relevant for
		// days — expeditions are slow now, so treats flow into an endless
		// upgrade sink instead of a six-item checklist. Persisted as the
		// final M.save field; pre-stacking saves migrate bought upgrades to
		// one stack each in M.load.
		M.upgradeStacks = [0,0,0,0,0,0];
		// Effective stack count for CpS/risk/purchase lookups. Also the lazy
		// migration: pre-stacking saves only know about an upgrade through its
		// main-save bought flag, and M.load can run BEFORE that flag is
		// restored (buildings load ahead of upgrades in Game.Load), so a
		// one-time-bought upgrade with 0 stacks self-migrates to 1 the first
		// time anything asks. After that the stacks array and the flag agree.
		M.effectiveStacks = function (name: any) {
			var i = M.upgradeNames.indexOf(name);
			var n = i >= 0 ? (M.upgradeStacks[i] || 0) : 0;
			var up = Game.Upgrades[name];
			if (up && up.bought && n < 1) { n = 1; if (i >= 0) M.upgradeStacks[i] = 1; }
			return n;
		};

		M.awayCount = function () { var n = 0; for (var i = 0; i < M.away.length; i++) n += M.away[i].count; return n; };
		M.restingCount = function () { var n = 0; for (var i = 0; i < M.resting.length; i++) n += M.resting[i].count; return n; };
		M.idleCats = function () { return Math.max(0, Math.floor(M.parent.amount) - M.awayCount() - M.restingCount()); };

		// Each Nine-lives insurance stack multiplies risk by 0.7 (0.7^n —
		// it approaches zero but never hits it, so no floor needed).
		M.hurtChanceFor = function (mission: any) { return mission.hurtChance * Math.pow(0.7, M.effectiveStacks('Nine-lives insurance')) * (Game.Has('Nap discipline') ? 0.8 : 1); };
		M.durationFor = function (mission: any) { return Game.Has('Efficient patrols') ? Math.ceil(mission.duration * 0.85) : mission.duration; };

		M.dispatch = function (id: any) {
			var mission = M.missionsById[id];
			if (!mission) return false;
			if (M.parent.amount < mission.unlock) return false;
			if (M.idleCats() < mission.catCost) return false;
			M.away.push({ uid: M.uidN++, id: id, count: mission.catCost, returnAt: Date.now() + M.durationFor(mission) * 1000 });
			PlaySound('snd/harvest2.mp3', 0.75);
			M.refresh();
			return true;
		};

		M.resolveExpeditions = function () {
			var now = Date.now();
			var changed = false;
			for (var i = M.away.length - 1; i >= 0; i--) {
				var entry = M.away[i];
				if (entry.returnAt > now) continue;
				var mission = M.missionsById[entry.id];
				M.away.splice(i, 1);
				changed = true;
				if (mission && Math.random() < M.hurtChanceFor(mission)) {
					var restSeconds = Math.max(15, Math.floor(mission.duration / 2));
					M.resting.push({ uid: M.uidN++, count: entry.count, returnAt: now + restSeconds * 1000 });
					Game.Notify(loc("A cat came home scuffed up"), (mission.name) + ' didn\'t go as planned. ' + entry.count + ' cat(s) are resting it off.', [6, 26]);
					PlaySound('snd/squeak2.mp3', 0.75);
				}
				else if (mission) {
					var reward = Math.floor(Math.random() * (mission.treatsMax - mission.treatsMin + 1)) + mission.treatsMin;
					if (Game.Has('Generous strangers')) reward = Math.ceil(reward * 1.2);
					M.treats += reward;
					M.treatsEarnedTotal += reward;
					M.missionsCompleted++;
					Game.Notify(loc("Expedition complete"), (mission.name) + ' brought home <b>' + reward + ' treats</b>.', [4, 26]);
					PlaySound('snd/harvest1.mp3', 0.75);
					M.checkExpeditionAchievements();
				}
			}
			for (var j = M.resting.length - 1; j >= 0; j--) {
				if (M.resting[j].returnAt > now) continue;
				M.resting.splice(j, 1);
				changed = true;
			}
			if (changed) M.refresh();
		};

		M.checkExpeditionAchievements = function () {
			if (M.missionsCompleted >= 1) Game.Win('First expedition');
			if (M.missionsCompleted >= 50) Game.Win('Seasoned adventurers');
			if (M.missionsCompleted >= 250) Game.Win('The nine-lives guild');
			if (M.treatsEarnedTotal >= 1000) Game.Win('Pocketful of treats');
		};

		// Repeatable: no bought check, flat price every time. The main-save
		// bought flag (via earn) is only set on the first stack — it exists
		// for save continuity (the pre-stacking effect code path reads it),
		// not as a purchase cap.
		M.buyUpgrade = function (name: any) {
			var up = Game.Upgrades[name];
			var i = M.upgradeNames.indexOf(name);
			if (!up || i < 0) return false;
			var price = up.treatsPrice || 0;
			if (M.treats < price) return false;
			M.treats -= price;
			// Increment from the effective count so a lazily-migrated
			// one-time purchase (bought flag, 0 stacks) counts as stack 1.
			var n = M.effectiveStacks(name);
			if (n < 1) up.earn(); // first-ever stack → mark in the main save
			M.upgradeStacks[i] = n + 1;
			PlaySound('snd/buy' + (Math.floor(Math.random() * 4) + 1) + '.mp3', 0.75);
			var allOwned = true;
			for (var j = 0; j < M.upgradeNames.length; j++) { if (M.effectiveStacks(M.upgradeNames[j]) < 1) allOwned = false; }
			if (allOwned) Game.Win('Fully catified');
			M.refresh();
			return true;
		};

		var str = '';
		str += '<style>' +
			'#colonyBG{background:url(img/shadedBorders.webp),url(img/cats/Summer1.png);background-size:100% 100%,auto;position:absolute;left:0px;right:0px;top:0px;bottom:16px;}' +
			'#colonyContent{position:relative;box-sizing:border-box;padding:8px 16px;max-height:100%;overflow-y:auto;}' +
			/* ---- base card ---- */
			'.colonyBox{position:relative;margin:8px auto;padding:8px 12px;max-width:600px;background:rgba(0,0,0,0.75);border-radius:12px;color:rgba(255,255,255,0.9);}' +
			'.colonyTitle{font-weight:bold;font-size:13px;margin-bottom:4px;text-shadow:0px 0px 4px #000;}' +
			'.colonyTitleSmall{font-weight:bold;font-size:11px;margin-bottom:4px;opacity:0.7;text-transform:uppercase;letter-spacing:1px;}' +
			'.colonyStats{text-align:center;font-size:12px;margin-bottom:4px;}' +
			/* ---- status chips ---- */
			'.colonyChip{display:inline-block;padding:1px 6px;border-radius:3px;font-size:9px;font-weight:bold;margin:0 2px 2px 0;}' +
			'.colonyChipBlue{background:rgba(100,150,255,0.25);color:#9cf;}' +
			'.colonyChipGreen{background:rgba(100,200,100,0.25);color:#8c8;}' +
			'.colonyChipRed{background:rgba(255,120,120,0.25);color:#f99;}' +
			'.colonyChipAmber{background:rgba(255,200,100,0.25);color:#fc9;}' +
			'.colonyChipGray{background:rgba(200,200,200,0.2);color:#aaa;}' +
			/* ---- roster / cat strip ---- */
			'.colonyCatStrip{display:flex;flex-wrap:wrap;gap:2px;min-height:36px;align-items:center;margin-top:4px;}' +
			// Source strips are 8 frames of 80x64 (640x64 total). Halved via
			// background-size to a 320x32 sheet so the 40x32 box shows one
			// frame exactly — no transform needed, unlike the scaled-icon
			// idiom elsewhere (tinyIcon()) which shrinks a fixed 48x48 icon.
			'.colonyCat{width:40px;height:32px;background-image:url(img/cats/idle.png);background-repeat:no-repeat;background-size:320px 32px;}' +
			'.colonyCatResting{background-image:url(img/cats/sleep.png);}' +
			'.colonyEmpty{font-size:11px;opacity:0.6;font-style:italic;}' +
			'@keyframes colonyCatIdleAnim{0%,12.5%{background-position:0px 0px;}12.5%,25%{background-position:-40px 0px;}25%,37.5%{background-position:-80px 0px;}37.5%,50%{background-position:-120px 0px;}50%,62.5%{background-position:-160px 0px;}62.5%,75%{background-position:-200px 0px;}75%,87.5%{background-position:-240px 0px;}87.5%,100%{background-position:-280px 0px;}}' +
			'body:not(.noMotion) .colonyCat{animation:colonyCatIdleAnim 1.6s steps(1) infinite;}' +
			'.colonyRosterLegend{font-size:9px;opacity:0.6;text-align:center;margin-top:2px;}' +
			'.colonyTimers{font-size:10px;opacity:0.8;text-align:center;margin-top:4px;}' +
			/* ---- mission cards ---- */
			'.colonyMissionList{display:flex;flex-direction:column;gap:4px;margin:4px 0;}' +
			'.colonyMission{display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:8px;background:rgba(255,255,255,0.06);font-size:10px;line-height:1.3;}' +
			'.colonyMissionLocked{opacity:0.4;}' +
			'.colonyMissionIcon{width:40px;height:32px;background-repeat:no-repeat;flex:none;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.5));}' +
			'.colonyMissionInfo{flex:1;}' +
			'.colonyMissionName{font-weight:bold;font-size:11px;}' +
			'.colonyMissionDesc{opacity:0.7;font-size:9px;}' +
			'.colonyBtn{cursor:pointer;padding:4px 10px;border-radius:6px;background:rgba(100,180,255,0.25);font-size:11px;font-weight:bold;white-space:nowrap;transition:background 0.15s;flex:none;}' +
			'.colonyBtn:hover{background:rgba(100,180,255,0.45);}' +
			'.colonyBtnDisabled{cursor:default;opacity:0.35;}' +
			'.colonyBtnDisabled:hover{background:rgba(100,180,255,0.25);}' +
			/* ---- shop ---- */
			'.colonyShopList{display:flex;flex-direction:column;gap:4px;margin:4px 0;}' +
			'.colonyShopItem{display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:8px;background:rgba(255,255,255,0.06);font-size:10px;line-height:1.3;}' +
			'.colonyShopInfo{flex:1;}' +
			'.colonyShopName{font-weight:bold;}' +
			'.colonyShopStack{opacity:0.6;}' +
			'.colonyShopDesc{opacity:0.7;font-size:9px;}' +
			/* ---- misc ---- */
			'.colonyHelpBtn{cursor:pointer;padding:1px 7px;border-radius:4px;background:rgba(255,255,255,0.12);font-size:10px;font-weight:bold;margin-left:6px;white-space:nowrap;}' +
			'.colonyHelpBtn:hover{background:rgba(255,255,255,0.3);}' +
			'.colonyTutorial{margin:0px auto 8px;max-width:600px;background:rgba(0,0,0,0.85);border-radius:12px;padding:8px 12px;color:rgba(255,255,255,0.9);}' +
			'.colonyTutorial ul{margin:6px 0 4px 16px;padding:0;font-size:11px;line-height:1.5;}' +
			'.colonyTutorial li{margin-bottom:6px;}' +
			'</style>';
		str += '<div id="colonyBG"></div>';
		str += '<div id="colonyContent">';
		str += '<div id="colonyTutorial" style="display:none;"></div>';
		str += '<div id="colonyRoster"></div>';
		str += '<div id="colonyMissions"></div>';
		str += '<div id="colonyShop"></div>';
		str += '</div>';
		div.innerHTML = str;

		M.refresh();
	};

	// Static single-frame sprite backgrounds for the mission cards — each
	// shows one cat pose from the existing sheets, no new art.
	M.missionArt = [
		{ sheet: 'idle.png', size: '320px 32px', pos: '0px 0px' },        // yarn ball — loafing around
		{ sheet: 'walk.png', size: '480px 32px', pos: '-160px 0px' },     // sunbeam — stalking
		{ sheet: 'run.png', size: '320px 32px', pos: '-80px 0px' },       // pantry — sneaking
		{ sheet: 'attack-1.png', size: '320px 32px', pos: '-120px 0px' }, // wrinkler — fighting
		{ sheet: 'jump.png', size: '120px 32px', pos: '-80px 0px' },      // alley — pouncing
		{ sheet: 'running-jump.png', size: '120px 32px', pos: '-40px 0px' } // nine lives — leaping
	];

	M.renderRoster = function () {
		var idle = M.idleCats();
		var away = M.awayCount();
		var resting = M.restingCount();
		var str = '<div class="colonyBox">';
		str += '<div class="colonyTitle">Cat Colony <span id="colonyHelpBtn" class="colonyHelpBtn" title="How to play" style="float:right;">How to play</span></div>';
		str += '<div class="colonyStats">🐾 Treats: <b>' + Beautify(M.treats) + '</b></div>';
		str += '<div style="text-align:center;font-size:10px;margin-bottom:2px;">' +
			'<span class="colonyChip colonyChipGreen">' + idle + ' idle</span>' +
			'<span class="colonyChip colonyChipBlue">' + away + ' away</span>' +
			'<span class="colonyChip colonyChipGray">' + resting + ' resting</span></div>';
		str += '<div class="colonyCatStrip">';
		var idleShown = Math.min(idle, 24);
		for (var i = 0; i < idleShown; i++) { str += '<div class="colonyCat"></div>'; }
		var restingShown = Math.min(resting, 12);
		for (var j = 0; j < restingShown; j++) { str += '<div class="colonyCat colonyCatResting"></div>'; }
		if (idle === 0 && resting === 0) { str += '<div class="colonyEmpty">Every cat is out on an expedition.</div>'; }
		str += '</div>';
		if (idle > 0 || resting > 0) { str += '<div class="colonyRosterLegend">Awake cats roam the yard; sleeping cats are resting after a scuffle.</div>'; }
		if (M.away.length > 0) {
			str += '<div class="colonyTimers" id="colonyTimers"></div>';
		}
		str += '</div>';
		return str;
	};

	M.tutorialOpen = false;

	// How-to-play panel, toggled by the "How to play" button in the roster header.
	M.renderTutorial = function () {
		var str = '<div class="colonyBox" style="margin:0;max-width:none;">';
		str += '<div class="colonyTitle">How to play <span id="colonyHelpClose" class="colonyHelpBtn" title="Close" style="float:right;">✕</span></div>';
		str += '<ul>';
		str += '<li><b>Dispatch expeditions</b> — click Dispatch on a mission to send its cats out. They return after the listed duration and bring home treats. A few of the cats shown are resting (sleeping) — they come back on their own.</li>';
		str += '<li><b>Cat capacity</b> — a mission only dispatches if you have enough <b>idle</b> cats (total cats − away − resting). Buy more cats to keep more expeditions running at once.</li>';
		str += '<li><b>Risk</b> — each mission has a small chance its cats come home scuffed up and need a nap. <b>Nine-lives insurance</b> stacks each cut that risk by 30%.</li>';
		str += '<li><b>Unlock missions</b> — bigger expeditions unlock at more owned cats (1, 10, 25, 50, 100, 200); the bigger ones are slower but pay far more treats.</li>';
		str += '<li><b>Spend treats</b> — buy the colony upgrades below; each is repeatable at a flat price, and every stack adds its full effect to your cats, with stacks kept in your save.</li>';
		str += '<li><b>Goals</b> — complete 1 / 50 / 250 expeditions ("First expedition", "Seasoned adventurers", "The nine-lives guild"), bank 1000 treats ("Pocketful of treats"), and buy every upgrade to become "Fully catified".</li>';
		str += '</ul>';
		str += '</div>';
		return str;
	};

	M.toggleTutorial = function () {
		M.tutorialOpen = !M.tutorialOpen;
		var t = l('colonyTutorial');
		if (!t) return;
		if (M.tutorialOpen) {
			t.innerHTML = M.renderTutorial();
			t.style.display = 'block';
			var close = l('colonyHelpClose');
			if (close) AddEvent(close, 'click', function () { M.toggleTutorial(); });
		} else {
			t.innerHTML = '';
			t.style.display = 'none';
		}
	};

	M.renderMissions = function () {
		var str = '<div class="colonyBox"><div class="colonyTitle">Expeditions</div>';
		str += '<div style="font-size:10px;opacity:0.7;margin-bottom:4px;">Send idle cats on timed expeditions to bring back treats. Bigger missions unlock at more cats and pay more — but carry more risk.</div>';
		str += '<div class="colonyMissionList">';
		for (var i = 0; i < M.missions.length; i++) {
			var mission = M.missions[i];
			var locked = M.parent.amount < mission.unlock;
			var canGo = !locked && M.idleCats() >= mission.catCost;
			var art = M.missionArt[i] || M.missionArt[0];
			str += '<div class="colonyMission' + (locked ? ' colonyMissionLocked' : '') + '">';
			str += '<div class="colonyMissionIcon" style="background-image:url(img/cats/' + art.sheet + ');background-size:' + art.size + ';background-position:' + art.pos + ';"></div>';
			str += '<div class="colonyMissionInfo">';
			str += '<div class="colonyMissionName">' + mission.name + (locked ? ' <span class="colonyChip colonyChipGray">🔒 ' + mission.unlock + ' cats</span>' : '') + '</div>';
			if (!locked) {
				str += '<div class="colonyMissionDesc">' + mission.desc + '</div>';
				str += '<div style="margin-top:2px;">' +
					'<span class="colonyChip colonyChipBlue">🐾 ' + mission.catCost + ' cats</span>' +
					'<span class="colonyChip colonyChipAmber">⏱ ' + Game.sayTime(M.durationFor(mission) * Game.fps, -1) + '</span>' +
					'<span class="colonyChip colonyChipGreen">🍬 ' + (Game.Has('Generous strangers') ? Math.ceil(mission.treatsMin * 1.2) + '–' + Math.ceil(mission.treatsMax * 1.2) : mission.treatsMin + '–' + mission.treatsMax) + ' treats</span>' +
					'<span class="colonyChip ' + (M.hurtChanceFor(mission) > 0.2 ? 'colonyChipRed' : 'colonyChipGray') + '">⚠ ' + Math.round(M.hurtChanceFor(mission) * 100) + '% risk</span>' +
					'</div>';
			} else {
				str += '<div class="colonyMissionDesc">Unlocks at <b>' + mission.unlock + '</b> cats.</div>';
			}
			str += '</div>';
			if (!locked) {
				str += '<div class="colonyBtn' + (canGo ? '' : ' colonyBtnDisabled') + '" id="colonyDispatch' + mission.id + '">Dispatch</div>';
			}
			str += '</div>';
		}
		str += '</div>';
		str += '</div>';
		return str;
	};

	M.renderShop = function () {
		var str = '<div class="colonyBox"><div class="colonyTitle">Colony Upgrades</div>';
		str += '<div style="font-size:10px;opacity:0.7;margin-bottom:4px;">Each upgrade is repeatable — every stack boosts your Cats\' output, and stacks persist in your save.</div>';
		str += '<div class="colonyShopList">';
		for (var i = 0; i < M.upgradeNames.length; i++) {
			var name = M.upgradeNames[i];
			var up = Game.Upgrades[name];
			if (!up) continue;
			var price = up.treatsPrice || 0;
			var stacks = M.effectiveStacks(name);
			var canBuy = M.treats >= price;
			str += '<div class="colonyShopItem">';
			str += '<div class="icon shadowFilter" style="flex:none;margin:0;' + writeIcon(up.icon) + '"></div>';
			str += '<div class="colonyShopInfo"><span class="colonyShopName">' + name + '</span>' + (stacks > 0 ? ' <span class="colonyShopStack">×' + stacks + '</span>' : '') + '<br><span class="colonyShopDesc">' + up.baseDesc + '</span></div>';
			str += '<div class="colonyBtn' + (canBuy ? '' : ' colonyBtnDisabled') + '" id="colonyBuy' + i + '">' + price + ' 🍬</div>';
			str += '</div>';
		}
		str += '</div>';
		str += '</div>';
		return str;
	};

	M.refresh = function () {
		if (!l('colonyRoster')) return; //not on this view yet
		l('colonyRoster').innerHTML = M.renderRoster();
		l('colonyMissions').innerHTML = M.renderMissions();
		l('colonyShop').innerHTML = M.renderShop();
		// Bind the How-to-play button (the roster re-renders every refresh).
		var helpBtn = l('colonyHelpBtn');
		if (helpBtn) AddEvent(helpBtn, 'click', function () { M.toggleTutorial(); });
		for (var i = 0; i < M.missions.length; i++) {
			var mission = M.missions[i];
			var btn = l('colonyDispatch' + mission.id);
			if (btn) { AddEvent(btn, 'click', function (id: any) { return function () { M.dispatch(id); }; }(mission.id)); }
		}
		for (var j = 0; j < M.upgradeNames.length; j++) {
			var btn2 = l('colonyBuy' + j);
			if (btn2) { AddEvent(btn2, 'click', function (name: any) { return function () { M.buyUpgrade(name); }; }(M.upgradeNames[j])); }
		}
	};

	M.save = function () {
		//output cannot use "," ";" or "|"
		var awayStr = '-';
		if (M.away.length > 0) {
			var awayParts = [];
			for (var i = 0; i < M.away.length; i++) { awayParts.push(M.away[i].id + ':' + M.away[i].count + ':' + M.away[i].returnAt); }
			awayStr = awayParts.join('/');
		}
		var restStr = '-';
		if (M.resting.length > 0) {
			var restParts = [];
			for (var j = 0; j < M.resting.length; j++) { restParts.push(M.resting[j].count + ':' + M.resting[j].returnAt); }
			restStr = restParts.join('/');
		}
		// stacks last: appended after the launch-era fields so pre-stacking
		// save strings (5 fields) still parse with spl[5] undefined.
		return parseFloat(M.treats) + ' ' + parseFloat(M.missionsCompleted) + ' ' + parseFloat(M.treatsEarnedTotal) + ' ' + awayStr + ' ' + restStr + ' ' + M.upgradeStacks.join(':');
	};
	M.load = function (str: any) {
		//interpret str; called after .init
		if (!str) return false;
		var spl = str.split(' ');
		var i = 0;
		M.treats = parseFloat(spl[i++] || 0);
		M.missionsCompleted = parseFloat(spl[i++] || 0);
		M.treatsEarnedTotal = parseFloat(spl[i++] || 0);
		var awayStr = spl[i++] || '-';
		M.away = [];
		if (awayStr !== '-') {
			var awayParts = awayStr.split('/');
			for (var a = 0; a < awayParts.length; a++) {
				var bits = awayParts[a].split(':');
				M.away.push({ uid: M.uidN++, id: bits[0], count: parseFloat(bits[1]), returnAt: parseFloat(bits[2]) });
			}
		}
		var restStr = spl[i++] || '-';
		M.resting = [];
		if (restStr !== '-') {
			var restParts = restStr.split('/');
			for (var r = 0; r < restParts.length; r++) {
				var rbits = restParts[r].split(':');
				M.resting.push({ uid: M.uidN++, count: parseFloat(rbits[0]), returnAt: parseFloat(rbits[1]) });
			}
		}
		var stackStr = spl[i++] || '';
		M.upgradeStacks = [0,0,0,0,0,0];
		if (stackStr) {
			var stackParts = stackStr.split(':');
			for (var s = 0; s < M.upgradeStacks.length; s++) { M.upgradeStacks[s] = Math.floor(parseFloat(stackParts[s] || 0) || 0); }
		}
		// Pre-stacking saves: each one-time-bought colony upgrade migrates to
		// exactly one stack, so old saves keep their effect value. Runs after
		// the stack field (usually absent) has been read.
		for (var u = 0; u < M.upgradeNames.length; u++) {
			var mUp = Game.Upgrades[M.upgradeNames[u]];
			if (mUp && mUp.bought && M.upgradeStacks[u] < 1) M.upgradeStacks[u] = 1;
		}
		M.refresh();
	};
	M.reset = function (_hard: any) {
		M.treats = 0;
		M.missionsCompleted = 0;
		M.treatsEarnedTotal = 0;
		M.away = [];
		M.resting = [];
		M.treatTrickle = 0;
		M.upgradeStacks = [0,0,0,0,0,0];
		M.tutorialOpen = false;
		M.refresh();
		var t = l('colonyTutorial');
		if (t) { t.innerHTML = ''; t.style.display = 'none'; }
	};
	M.logic = function () {
		//run each game tick, whether or not the panel is open
		M.resolveExpeditions();
		if (Game.Has('Bottomless treat jar')) {
			M.treatTrickle += 1 / (60 * Game.fps);
			if (M.treatTrickle >= 1) {
				var gained = Math.floor(M.treatTrickle);
				M.treats += gained;
				M.treatsEarnedTotal += gained;
				M.treatTrickle -= gained;
				// Mirror the sitting-room yarn trickle: a threshold crossed
				// purely by jar drip (no expedition in flight) still fires
				// its achievement on the spot, not at the next resolution.
				M.checkExpeditionAchievements();
				M.refresh();
			}
		}
	};
	M.draw = function () {
		//run each frame, only while the panel is visible
		if (M.away.length > 0 && l('colonyTimers')) {
			var soonest = M.away[0].returnAt;
			for (var i = 1; i < M.away.length; i++) { if (M.away[i].returnAt < soonest) soonest = M.away[i].returnAt; }
			var remain = Math.max(0, soonest - Date.now());
			l('colonyTimers').textContent = 'Next return in ' + Game.sayTime(Math.ceil(remain / 1000) * Game.fps, -1) + '.';
		}
	};
	M.init(l('rowSpecial' + M.parent.id));
};
/* CC3: explicit module marker — at runtime these files are always ESM modules
 * (Vite bundles them as such), and this keeps their top-level var/function
 * declarations out of the TS global scope. Zero runtime effect. */
export {};
