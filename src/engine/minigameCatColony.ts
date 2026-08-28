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
 * needs a nap to sleep off. Treats buy the six Cat Colony upgrades declared
 * in content/upgrades.ts (via .earn() — never the cookie store), which feed
 * straight into the Cats CpS formula's existing catAdd/catMult arrays
 * (content/buildings/cats.ts).
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

		M.missions = [
			{ id: 'yarn', name: 'Yarn Ball Retrieval', desc: 'Send cats to liberate a yarn ball from the neighbor\'s porch. Low risk, low reward.', catCost: 1, duration: 20, hurtChance: 0.05, treatsMin: 1, treatsMax: 3, unlock: 1 },
			{ id: 'sunbeam', name: 'The Great Sunbeam Hunt', desc: 'A perfect patch of sunlight has been sighted two yards over. Time is of the essence.', catCost: 2, duration: 45, hurtChance: 0.08, treatsMin: 3, treatsMax: 6, unlock: 10 },
			{ id: 'pantry', name: 'Pantry Reconnaissance', desc: 'Scout the kitchen pantry for unattended treats.', catCost: 3, duration: 90, hurtChance: 0.12, treatsMin: 6, treatsMax: 12, unlock: 25 },
			{ id: 'wrinkler', name: 'Wrinkler Standoff', desc: 'A wrinkler has been spotted near the cookie stash. Someone has to deal with it.', catCost: 4, duration: 180, hurtChance: 0.25, treatsMin: 14, treatsMax: 24, unlock: 50 },
			{ id: 'alley', name: 'Back-Alley Turf Summit', desc: 'Negotiate territory with the alley cat coalition.', catCost: 5, duration: 300, hurtChance: 0.18, treatsMin: 24, treatsMax: 40, unlock: 100 },
			{ id: 'ninelives', name: 'The Nine Lives Expedition', desc: 'A legendary trek said to grant a cat back one of its nine lives.', catCost: 6, duration: 600, hurtChance: 0.15, treatsMin: 50, treatsMax: 80, unlock: 200 }
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

		M.awayCount = function () { var n = 0; for (var i = 0; i < M.away.length; i++) n += M.away[i].count; return n; };
		M.restingCount = function () { var n = 0; for (var i = 0; i < M.resting.length; i++) n += M.resting[i].count; return n; };
		M.idleCats = function () { return Math.max(0, Math.floor(M.parent.amount) - M.awayCount() - M.restingCount()); };

		M.hurtChanceFor = function (mission: any) { return mission.hurtChance * (Game.Has('Nine-lives insurance') ? 0.7 : 1); };

		M.dispatch = function (id: any) {
			var mission = M.missionsById[id];
			if (!mission) return false;
			if (M.parent.amount < mission.unlock) return false;
			if (M.idleCats() < mission.catCost) return false;
			M.away.push({ uid: M.uidN++, id: id, count: mission.catCost, returnAt: Date.now() + mission.duration * 1000 });
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

		M.buyUpgrade = function (name: any) {
			var up = Game.Upgrades[name];
			if (!up || up.bought) return false;
			var price = up.treatsPrice || 0;
			if (M.treats < price) return false;
			M.treats -= price;
			up.earn();
			PlaySound('snd/buy' + (Math.floor(Math.random() * 4) + 1) + '.mp3', 0.75);
			var allBought = true;
			for (var i = 0; i < M.upgradeNames.length; i++) { if (!Game.Has(M.upgradeNames[i])) allBought = false; }
			if (allBought) Game.Win('Fully catified');
			M.refresh();
			return true;
		};

		var str = '';
		str += '<style>' +
			'#colonyBG{background:url(img/shadedBorders.webp),url(img/cats/Summer1.png);background-size:100% 100%,auto;position:absolute;left:0px;right:0px;top:0px;bottom:16px;}' +
			'#colonyContent{position:relative;box-sizing:border-box;padding:8px 16px;max-height:100%;overflow-y:auto;}' +
			'.colonyBox{position:relative;margin:8px auto;padding:8px 12px;max-width:520px;background:rgba(0,0,0,0.75);border-radius:12px;color:rgba(255,255,255,0.9);}' +
			'.colonyTitle{font-weight:bold;font-size:13px;margin-bottom:4px;text-shadow:0px 0px 4px #000;}' +
			'.colonyStats{text-align:center;font-size:12px;margin-bottom:4px;}' +
			'.colonyRow{display:flex;align-items:center;gap:8px;padding:4px 0px;border-top:1px solid rgba(255,255,255,0.15);}' +
			'.colonyRow:first-of-type{border-top:none;}' +
			'.colonyRowText{flex:1;font-size:11px;line-height:1.4;}' +
			'.colonyRowName{font-weight:bold;font-size:12px;}' +
			'.colonyLocked{opacity:0.5;}' +
			'.colonyBtn{cursor:pointer;padding:4px 10px;border-radius:6px;background:rgba(255,255,255,0.15);font-size:11px;font-weight:bold;white-space:nowrap;}' +
			'.colonyBtn:hover{background:rgba(255,255,255,0.3);}' +
			'.colonyBtnDisabled{cursor:default;opacity:0.35;}' +
			'.colonyBtnDisabled:hover{background:rgba(255,255,255,0.15);}' +
			'.colonyCatStrip{display:flex;flex-wrap:wrap;gap:2px;min-height:36px;align-items:center;}' +
			// Source strips are 8 frames of 80x64 (640x64 total). Halved via
			// background-size to a 320x32 sheet so the 40x32 box shows one
			// frame exactly — no transform needed, unlike the scaled-icon
			// idiom elsewhere (tinyIcon()) which shrinks a fixed 48x48 icon.
			'.colonyCat{width:40px;height:32px;background-image:url(img/cats/idle.png);background-repeat:no-repeat;background-size:320px 32px;}' +
			'.colonyCatResting{background-image:url(img/cats/sleep.png);}' +
			'@keyframes colonyCatIdleAnim{0%,12.5%{background-position:0px 0px;}12.5%,25%{background-position:-40px 0px;}25%,37.5%{background-position:-80px 0px;}37.5%,50%{background-position:-120px 0px;}50%,62.5%{background-position:-160px 0px;}62.5%,75%{background-position:-200px 0px;}75%,87.5%{background-position:-240px 0px;}87.5%,100%{background-position:-280px 0px;}}' +
			'body:not(.noMotion) .colonyCat{animation:colonyCatIdleAnim 1.6s steps(1) infinite;}' +
			'.colonyEmpty{font-size:11px;opacity:0.6;font-style:italic;}' +
			'</style>';
		str += '<div id="colonyBG"></div>';
		str += '<div id="colonyContent">';
		str += '<div id="colonyRoster"></div>';
		str += '<div id="colonyMissions"></div>';
		str += '<div id="colonyShop"></div>';
		str += '</div>';
		div.innerHTML = str;

		M.refresh();
	};

	M.renderRoster = function () {
		var idle = M.idleCats();
		var away = M.awayCount();
		var resting = M.restingCount();
		var str = '<div class="colonyBox">';
		str += '<div class="colonyTitle">Cat Colony</div>';
		str += '<div class="colonyStats">Treats: <b>' + Beautify(M.treats) + '</b> &nbsp;|&nbsp; Idle: <b>' + idle + '</b> &nbsp;|&nbsp; Away: <b>' + away + '</b> &nbsp;|&nbsp; Resting: <b>' + resting + '</b></div>';
		str += '<div class="colonyCatStrip">';
		var idleShown = Math.min(idle, 24);
		for (var i = 0; i < idleShown; i++) { str += '<div class="colonyCat"></div>'; }
		var restingShown = Math.min(resting, 12);
		for (var j = 0; j < restingShown; j++) { str += '<div class="colonyCat colonyCatResting"></div>'; }
		if (idle === 0 && resting === 0) { str += '<div class="colonyEmpty">Every cat is out on an expedition.</div>'; }
		str += '</div>';
		if (M.away.length > 0) {
			str += '<div class="colonyEmpty" style="margin-top:4px;" id="colonyTimers"></div>';
		}
		str += '</div>';
		return str;
	};

	M.renderMissions = function () {
		var str = '<div class="colonyBox"><div class="colonyTitle">Expeditions</div>';
		for (var i = 0; i < M.missions.length; i++) {
			var mission = M.missions[i];
			var locked = M.parent.amount < mission.unlock;
			var canGo = !locked && M.idleCats() >= mission.catCost;
			str += '<div class="colonyRow' + (locked ? ' colonyLocked' : '') + '">';
			str += '<div class="colonyRowText"><div class="colonyRowName">' + mission.name + '</div>' +
				(locked ? ('Requires <b>' + mission.unlock + '</b> cats.') :
					(mission.desc + '<br>' + mission.catCost + ' cat(s) &middot; ' + Game.sayTime(mission.duration * Game.fps, -1) + ' &middot; ' + mission.treatsMin + '-' + mission.treatsMax + ' treats &middot; ' + Math.round(M.hurtChanceFor(mission) * 100) + '% risk')) +
				'</div>';
			if (!locked) {
				str += '<div class="colonyBtn' + (canGo ? '' : ' colonyBtnDisabled') + '" id="colonyDispatch' + mission.id + '">Dispatch</div>';
			}
			str += '</div>';
		}
		str += '</div>';
		return str;
	};

	M.renderShop = function () {
		var str = '<div class="colonyBox"><div class="colonyTitle">Colony Upgrades</div>';
		for (var i = 0; i < M.upgradeNames.length; i++) {
			var name = M.upgradeNames[i];
			var up = Game.Upgrades[name];
			if (!up) continue;
			var price = up.treatsPrice || 0;
			var owned = !!up.bought;
			var canBuy = !owned && M.treats >= price;
			str += '<div class="colonyRow">';
			str += '<div class="icon shadowFilter" style="flex:none;' + writeIcon(up.icon) + '"></div>';
			str += '<div class="colonyRowText"><div class="colonyRowName">' + name + '</div>' + up.baseDesc + '</div>';
			if (owned) { str += '<div class="colonyBtn colonyBtnDisabled">Owned</div>'; }
			else { str += '<div class="colonyBtn' + (canBuy ? '' : ' colonyBtnDisabled') + '" id="colonyBuy' + i + '">' + price + ' treats</div>'; }
			str += '</div>';
		}
		str += '</div>';
		return str;
	};

	M.refresh = function () {
		if (!l('colonyRoster')) return; //not on this view yet
		l('colonyRoster').innerHTML = M.renderRoster();
		l('colonyMissions').innerHTML = M.renderMissions();
		l('colonyShop').innerHTML = M.renderShop();
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
		return parseFloat(M.treats) + ' ' + parseFloat(M.missionsCompleted) + ' ' + parseFloat(M.treatsEarnedTotal) + ' ' + awayStr + ' ' + restStr;
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
		M.refresh();
	};
	M.reset = function (_hard: any) {
		M.treats = 0;
		M.missionsCompleted = 0;
		M.treatsEarnedTotal = 0;
		M.away = [];
		M.resting = [];
		M.refresh();
	};
	M.logic = function () {
		//run each game tick, whether or not the panel is open
		M.resolveExpeditions();
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
