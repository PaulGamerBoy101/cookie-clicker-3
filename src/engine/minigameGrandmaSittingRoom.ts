/* CC3: Grandma's Sitting Room minigame (engine/minigameGrandmaSittingRoom.ts).
 *
 * Follows the established minigame shape (see minigameCatColony.ts): a plain
 * `M` object hung off the parent building, `M.launch` building `M.init` /
 * `M.save` / `M.load` / `M.reset` / `M.logic` / `M.draw`, no imports — every
 * helper (`l`, `Pic`, `AddEvent`, `PlaySound`, `Beautify`, `loc`, `Game`)
 * resolves through src/globals.d.ts exactly like the other minigames.
 *
 * Concept: seat grandmas in a sitting room with different activities. Cozy
 * activities (knitting, tea) produce Yarn and calm the Grandmapocalypse;
 * eldritch activities (chanting, choir) produce more Yarn but accelerate the
 * wrath, boosting wrath-cookie gains and wrinkler economy. Yarn buys
 * REPEATABLE stacks of Grandma upgrades (flat price, endless sink), which
 * feed into the Grandma CpS formula via grandmaAdd/grandmaMult arrays in
 * content/buildings/grandma.ts.
 *
 * Grandmapocalypse integration: the minigame only REPORTS its comfort dial
 * (M.currentComfort(), -6..+6); it never mutates Game.elderWrath itself. The
 * canonical updater Game.UpdateGrandmapocalypse (engine/main.ts) reads the
 * comfort every tick and does all the wrath mutation: cozy rooms (>= +2)
 * calm the elders and hold wrath at 0, eldritch rooms (<= -2) add to the
 * per-tick drift that climbs it, and the 'Elder hospitality' heavenly upgrade
 * doubles the comfort-driven rates. This keeps the Elder Pledge / Elder
 * Covenant bookkeeping (same function) in charge of the wrath state.
 *
 * Deliberately reuses only assets already in the repo: the background is
 * img/grandmaBackground.webp (the same scene the Grandma building room already
 * draws), the activity icons are grandma-variant 64x64 webp icons (already
 * shipped), and every sound is one already in public/snd/.
 */
var M: any = {};
M.parent = Game.Objects['Grandma'];
M.parent.minigame = M;
M.launch = function () {
	var M = this;
	M.name = M.parent.minigameName;
	M.init = function (div: any) {
		// Activities — each has a comfort contribution and yarn rate.
		// Eldritch activities (chant, choir) require elderWrath > 0 to assign.
		M.activities = [
			{ id: 'knitting', name: 'Knitting circle', desc: 'Cozy handiwork. The needles click in rhythm.', yarnRate: 0.02, comfort: 1, icon: 'grandmaIcon.webp', unlock: 1 },
			{ id: 'tea', name: 'Tea party', desc: 'A proper pot of tea and cookies on doilies.', yarnRate: 0.03, comfort: 1, icon: 'grandmaIconB.webp', unlock: 10 },
			{ id: 'rocking', name: 'Rocking chairs', desc: 'Peaceful creaking on the porch. No fuss.', yarnRate: 0.04, comfort: 0, icon: 'grandmaIconC.webp', unlock: 25 },
			{ id: 'story', name: 'Story time', desc: 'Tales of the old country, passed down.', yarnRate: 0.05, comfort: 0, icon: 'grandmaIconD.webp', unlock: 50 },
			{ id: 'chant', name: 'Eldritch chant', desc: 'Ancient words. The air grows thick.', yarnRate: 0.07, comfort: -1, icon: 'witchGrandma.webp', unlock: 100 },
			{ id: 'choir', name: 'Grandmapocalypse choir', desc: 'The elders sing in harmony.', yarnRate: 0.09, comfort: -1, icon: 'antiGrandma.webp', unlock: 200 }
		];
		M.activitiesById = {};
		for (var mi = 0; mi < M.activities.length; mi++) { M.activitiesById[M.activities[mi].id] = M.activities[mi]; }

		// Ordered to match the .grandmaAdd/.grandmaMult declarations in
		// content/upgrades.ts; price and description live on the real
		// Game.Upgrade object (.yarnPrice), not duplicated here.
		M.upgradeNames = ['Lap blanket weaving', 'Rocking chair maintenance', 'Tea leaf cultivation', 'Elder shawl', 'Chamomile incense', 'The Grandmother Tree'];

		M.yarn = 0;
		M.yarnEarned = 0;
		// Seats: 6 slots, each holds an activity index (0-5) or -1 (empty).
		// Unlocked by grandma count [1,10,25,50,100,200].
		M.seats = [-1, -1, -1, -1, -1, -1];
		M.seatUnlocks = [1, 10, 25, 50, 100, 200];
		// Repeatable stacks per upgrade (parallel to M.upgradeNames):
		M.upgradeStacks = [0, 0, 0, 0, 0, 0];
		// Fractional yarn accumulator (not persisted — small rounding).
		M.yarnTrickle = 0;

		M.effectiveStacks = function (name: any) {
			var i = M.upgradeNames.indexOf(name);
			var n = i >= 0 ? (M.upgradeStacks[i] || 0) : 0;
			var up = Game.Upgrades[name];
			if (up && up.bought && n < 1) { n = 1; if (i >= 0) M.upgradeStacks[i] = 1; }
			return n;
		};

		M.unlockedSeats = function () {
			var n = 0;
			for (var i = 0; i < M.seatUnlocks.length; i++) { if (M.parent.amount >= M.seatUnlocks[i]) n++; }
			return n;
		};

		M.currentComfort = function () {
			var c = 0;
			for (var i = 0; i < M.seats.length; i++) { if (M.seats[i] >= 0) c += M.activities[M.seats[i]].comfort; }
			return c;
		};

		M.yarnPerSecond = function () {
			var r = 0;
			for (var i = 0; i < M.seats.length; i++) { if (M.seats[i] >= 0) r += M.activities[M.seats[i]].yarnRate; }
			// Heavenly upgrade: Grandma's knitting circle → 50% faster yarn.
			if (Game.Has("Grandma's knitting circle")) r *= 1.5;
			return r;
		};

		// Compute effs from current comfort and stash them on M so the engine
		// picks them up in CalculateGains (the engine iterates M.effs keys).
		M.computeEffs = function () {
			var comfort = M.currentComfort();
			var effs: any = { grandmaCps: 1, wrathCookieGain: 1, wrathCookieFreq: 1, wrathCookieDur: 1, wrinklerSpawn: 1, wrinklerEat: 1 };
			if (comfort >= 0) {
				effs.grandmaCps = 1 + 0.02 * comfort;           // up to +12% at +6
				effs.wrathCookieFreq = 1 + 0.01 * comfort;       // fewer wrath cookies when cozy
			} else {
				var w = -comfort;
				effs.wrathCookieGain = 1 + 0.03 * w;             // up to +18%
				effs.wrathCookieFreq = 1 / (1 + 0.02 * w);       // more frequent (shimmerTypes: m*=1/eff)
				effs.wrinklerEat = 1 + 0.02 * w;                 // wrinklers eat more → bigger refund
				effs.wrinklerSpawn = 1 + 0.03 * w;               // more wrinklers
				effs.grandmaCps = 1 - 0.01 * w;                  // angry grandmas bake slightly less
			}
			M.effs = effs;
		};
		M.computeEffs();

		M.assignSeat = function (seatIdx: any, activityIdx: any) {
			if (seatIdx < 0 || seatIdx >= M.seats.length) return false;
			if (activityIdx >= 0 && activityIdx < M.activities.length) {
				// Check seat unlocked
				if (M.parent.amount < M.seatUnlocks[seatIdx]) return false;
				// Check activity unlocked
				if (M.parent.amount < M.activities[activityIdx].unlock) return false;
				// Eldritch activities require elder wrath active
				if (M.activities[activityIdx].comfort < 0 && Game.elderWrath <= 0) return false;
				M.seats[seatIdx] = activityIdx;
			} else {
				M.seats[seatIdx] = -1;
			}
			M.computeEffs();
			Game.recalculateGains = 1;
			PlaySound('snd/tick.mp3', 0.75);
			M.refresh();
			M.checkAchievements();
			return true;
		};

		M.buyUpgrade = function (name: any) {
			var up = Game.Upgrades[name];
			var i = M.upgradeNames.indexOf(name);
			if (!up || i < 0) return false;
			var price = up.yarnPrice || 0;
			if (M.yarn < price) return false;
			M.yarn -= price;
			var n = M.effectiveStacks(name);
			if (n < 1) up.earn(); // first-ever stack → mark in the main save
			M.upgradeStacks[i] = n + 1;
			Game.recalculateGains = 1;
			PlaySound('snd/buy' + (Math.floor(Math.random() * 4) + 1) + '.mp3', 0.75);
			var allOwned = true;
			for (var j = 0; j < M.upgradeNames.length; j++) { if (M.effectiveStacks(M.upgradeNames[j]) < 1) allOwned = false; }
			if (allOwned) Game.Win('Fully furnished');
			M.refresh();
			return true;
		};

		M.checkAchievements = function () {
			if (M.yarnEarned >= 1) Game.Win('First knit');
			if (M.yarnEarned >= 1000) Game.Win('Yarn hoard');
			var comfort = M.currentComfort();
			if (comfort >= 6) Game.Win("Grandma's peace");
			if (comfort <= -6) Game.Win('The elders sing');
		};

		// Build the panel HTML
		var str = '';
		str += '<style>' +
			'#roomBG{background:url(img/shadedBorders.webp),url(img/grandmaBackground.webp);background-size:100% 100%,auto;position:absolute;left:0px;right:0px;top:0px;bottom:16px;}' +
			'#roomContent{position:relative;box-sizing:border-box;padding:8px 16px;max-height:100%;overflow-y:auto;}' +
			'.roomBox{position:relative;margin:8px auto;padding:8px 12px;max-width:520px;background:rgba(0,0,0,0.75);border-radius:12px;color:rgba(255,255,255,0.9);}' +
			'.roomTitle{font-weight:bold;font-size:13px;margin-bottom:4px;text-shadow:0px 0px 4px #000;}' +
			'.roomStats{text-align:center;font-size:12px;margin-bottom:4px;}' +
			'.roomSeatRow{display:flex;align-items:center;gap:6px;padding:4px 0px;border-top:1px solid rgba(255,255,255,0.15);flex-wrap:wrap;}' +
			'.roomSeatRow:first-of-type{border-top:none;}' +
			'.roomSeatLabel{font-size:11px;font-weight:bold;min-width:20px;}' +
			'.roomActBtn{cursor:pointer;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.12);font-size:10px;white-space:nowrap;}' +
			'.roomActBtn:hover{background:rgba(255,255,255,0.3);}' +
			'.roomActBtnActive{background:rgba(200,255,200,0.25);border:1px solid rgba(200,255,200,0.5);}' +
			'.roomActBtnBad{background:rgba(255,200,200,0.25);border:1px solid rgba(255,200,200,0.5);}' +
			'.roomActBtnLocked{opacity:0.4;cursor:default;}' +
			'.roomActBtnLocked:hover{background:rgba(255,255,255,0.12);}' +
			'.roomEmpty{font-size:11px;opacity:0.6;font-style:italic;}' +
			'.roomComfortBar{margin:4px 0;height:8px;border-radius:4px;background:rgba(255,255,255,0.15);overflow:hidden;position:relative;}' +
			'.roomComfortFill{height:100%;border-radius:4px;transition:width 0.3s;}' +
			'.roomComfortLabel{font-size:10px;text-align:center;margin:2px 0;}' +
			'.roomWrathLabel{font-size:10px;text-align:center;opacity:0.7;}' +
			'.roomHelpBtn{cursor:pointer;padding:1px 7px;border-radius:4px;background:rgba(255,255,255,0.12);font-size:10px;font-weight:bold;margin-left:6px;white-space:nowrap;}' +
			'.roomHelpBtn:hover{background:rgba(255,255,255,0.3);}' +
			'.roomTutorial{margin:0px auto 8px;max-width:520px;background:rgba(0,0,0,0.85);border-radius:12px;padding:8px 12px;color:rgba(255,255,255,0.9);}' +
			'.roomTutorial ul{margin:6px 0 4px 16px;padding:0;font-size:11px;line-height:1.5;}' +
			'.roomTutorial li{margin-bottom:6px;}' +
			'</style>';
		str += '<div id="roomBG"></div>';
		str += '<div id="roomContent">';
		str += '<div id="roomTutorial" style="display:none;"></div>';
		str += '<div id="roomHeader"></div>';
		str += '<div id="roomSeats"></div>';
		str += '<div id="roomShop"></div>';
		str += '</div>';
		div.innerHTML = str;

		M.refresh();
	};

	M.renderHeader = function () {
		var comfort = M.currentComfort();
		var maxWrath = (Game.Has('One mind') ? 1 : 0) + (Game.Has('Communal brainsweep') ? 1 : 0) + (Game.Has('Elder Pact') ? 1 : 0);
		var wrathLabel = 'Elder Wrath: ' + Game.elderWrath + '/' + maxWrath;
		if (Game.Has('Elder Covenant')) wrathLabel = 'Elder Covenant (wrath suppressed)';
		var str = '<div class="roomBox">';
		str += '<div class="roomTitle">' + M.name + ' <span id="roomHelpBtn" class="roomHelpBtn" title="How to play" style="float:right;">How to play</span></div>';
		str += '<div class="roomStats">Yarn: <b>' + Beautify(M.yarn) + '</b> &nbsp;|&nbsp; Rate: <b>' + Beautify(M.yarnPerSecond(), 2) + '</b>/s</div>';
		// Comfort bar: -6 to +6, centered at 0
		var pct = 50 + (comfort / 6) * 50;
		pct = Math.max(0, Math.min(100, pct));
		var fillColor = comfort >= 0 ? 'rgba(100,200,100,0.8)' : 'rgba(200,100,100,0.8)';
		var comfortLabel = 'Comfort: ';
		if (comfort > 0) comfortLabel += '<span style="color:#8c8;">+' + comfort + ' (cozy)</span>';
		else if (comfort < 0) comfortLabel += '<span style="color:#c88;">' + comfort + ' (eldritch)</span>';
		else comfortLabel += '<span style="color:#888;">0 (neutral)</span>';
		str += '<div class="roomComfortLabel">' + comfortLabel + '</div>';
		str += '<div class="roomComfortBar"><div class="roomComfortFill" style="width:' + pct + '%;background:' + fillColor + ';margin-left:0;"></div></div>';
		str += '<div class="roomWrathLabel">' + wrathLabel + '</div>';
		str += '</div>';
		return str;
	};

	M.tutorialOpen = false;

	// How-to-play panel, toggled by the "How to play" button in the header.
	M.renderTutorial = function () {
		var str = '<div class="roomBox" style="margin:0;max-width:none;">';
		str += '<div class="roomTitle">How to play <span id="roomHelpClose" class="roomHelpBtn" title="Close" style="float:right;">✕</span></div>';
		str += '<ul>';
		str += '<li><b>Assign activities</b> — click an activity chip on a seat row to place it there; click ✕ to empty the seat. Dimmed chips show what is needed to unlock them.</li>';
		str += '<li><b>Unlock seats and activities</b> — each of the 6 seats and each activity unlocks at a higher number of owned Grandmas (1, 10, 25, 50, 100, 200).</li>';
		str += '<li><b>Earn yarn</b> — every assigned seat produces yarn per second; the total is shown at the top.</li>';
		str += '<li><b>Comfort dial</b> — cozy activities (green, +) boost Grandma CpS and calm the Grandmapocalypse; eldritch activities (red, −) cut Grandma CpS but amplify wrath-cookie and wrinkler effects while the Grandmapocalypse is active.</li>';
		str += '<li><b>Eldritch activities</b> (Eldritch chant, Grandmapocalypse choir) can only be assigned while the Grandmapocalypse is active — own the <b>One mind</b> upgrade to get wrath.</li>';
		str += '<li><b>Spend yarn</b> — buy the sitting room upgrades below; each is repeatable and every stack boosts Grandma output, and stacks are kept in your save.</li>';
		str += '<li><b>Goals</b> — reach <b>+6 comfort</b> ("Grandma\'s peace") or <b>−6</b> ("The elders sing"); buy every upgrade to become "Fully furnished".</li>';
		str += '</ul>';
		str += '</div>';
		return str;
	};

	M.toggleTutorial = function () {
		M.tutorialOpen = !M.tutorialOpen;
		var t = l('roomTutorial');
		if (!t) return;
		if (M.tutorialOpen) {
			t.innerHTML = M.renderTutorial();
			t.style.display = 'block';
			var close = l('roomHelpClose');
			if (close) AddEvent(close, 'click', function () { M.toggleTutorial(); });
		} else {
			t.innerHTML = '';
			t.style.display = 'none';
		}
	};

	M.renderSeats = function () {
		var str = '<div class="roomBox"><div class="roomTitle">Activities</div>';
		for (var s = 0; s < M.seats.length; s++) {
			var seatLocked = M.parent.amount < M.seatUnlocks[s];
			str += '<div class="roomSeatRow' + (seatLocked ? ' roomActBtnLocked' : '') + '">';
			if (seatLocked) {
				str += '<span class="roomSeatLabel">' + (s + 1) + '.</span>';
				str += '<span class="roomEmpty">Requires <b>' + M.seatUnlocks[s] + '</b> grandmas.</span>';
			} else {
				str += '<span class="roomSeatLabel">' + (s + 1) + '.</span>';
				// Activity buttons for this seat
				var current = M.seats[s];
				// Show activity buttons: the 6 activities, but only those unlocked
				for (var a = 0; a < M.activities.length; a++) {
					var act = M.activities[a];
					var actLocked = M.parent.amount < act.unlock;
					var wrathLocked = (act.comfort < 0 && Game.elderWrath <= 0);
					var isActive = (current === a);
					var cls = 'roomActBtn';
					if (actLocked || wrathLocked) cls += ' roomActBtnLocked';
					else if (isActive) cls += (act.comfort >= 0 ? ' roomActBtnActive' : ' roomActBtnBad');
					var title = act.name;
					if (actLocked) title += ' (needs ' + act.unlock + ' grandmas)';
					if (wrathLocked) title += ' (needs active Grandmapocalypse)';
					str += '<div class="' + cls + '" title="' + title + '" id="roomSeat' + s + 'Act' + a + '">' + act.name + '</div> ';
				}
				// Empty button
				var emptyCls = 'roomActBtn';
				if (current < 0) emptyCls += ' roomActBtnActive';
				str += '<div class="' + emptyCls + '" id="roomSeat' + s + 'Clear">✕</div>';
			}
			str += '</div>';
		}
		str += '<div class="roomWrathLabel" style="margin-top:4px;">Eldritch activities unlock when the Grandmapocalypse is active (Own <b>One mind</b>).</div>';
		str += '</div>';
		return str;
	};

	M.renderShop = function () {
		var str = '<div class="roomBox"><div class="roomTitle">Sitting Room Upgrades</div>';
		for (var i = 0; i < M.upgradeNames.length; i++) {
			var name = M.upgradeNames[i];
			var up = Game.Upgrades[name];
			if (!up) continue;
			var price = up.yarnPrice || 0;
			var stacks = M.effectiveStacks(name);
			var canBuy = M.yarn >= price;
			str += '<div class="roomSeatRow">';
			str += '<div class="icon shadowFilter" style="flex:none;' + writeIcon(up.icon) + '"></div>';
			str += '<div style="flex:1;font-size:11px;line-height:1.4;"><b>' + name + '</b>' + (stacks > 0 ? ' <span style="opacity:0.75;">×' + stacks + '</span>' : '') + '<br>' + up.baseDesc + '</div>';
			str += '<div class="roomActBtn' + (canBuy ? '' : ' roomActBtnLocked') + '" id="roomBuy' + i + '">' + price + ' yarn</div>';
			str += '</div>';
		}
		str += '</div>';
		return str;
	};

	M.refresh = function () {
		if (!l('roomHeader')) return;
		l('roomHeader').innerHTML = M.renderHeader();
		l('roomSeats').innerHTML = M.renderSeats();
		l('roomShop').innerHTML = M.renderShop();
		// Bind the How-to-play button (the header re-renders every refresh).
		var helpBtn = l('roomHelpBtn');
		if (helpBtn) AddEvent(helpBtn, 'click', function () { M.toggleTutorial(); });
		// Bind seat activity buttons
		for (var s = 0; s < M.seats.length; s++) {
			for (var a = 0; a < M.activities.length; a++) {
				var btn = l('roomSeat' + s + 'Act' + a);
				if (btn) {
					AddEvent(btn, 'click', function (si: any, ai: any) { return function () { M.assignSeat(si, ai); }; }(s, a));
				}
			}
			var clearBtn = l('roomSeat' + s + 'Clear');
			if (clearBtn) {
				AddEvent(clearBtn, 'click', function (si: any) { return function () { M.assignSeat(si, -1); }; }(s));
			}
		}
		// Bind shop buttons
		for (var j = 0; j < M.upgradeNames.length; j++) {
			var btn2 = l('roomBuy' + j);
			if (btn2) {
				AddEvent(btn2, 'click', function (name: any) { return function () { M.buyUpgrade(name); }; }(M.upgradeNames[j]));
			}
		}
		M.computeEffs();
	};

	M.save = function () {
		// output cannot use "," ";" or "|"
		var seatsStr = M.seats.join(':');
		var stacksStr = M.upgradeStacks.join(':');
		return parseFloat(M.yarn) + ' ' + parseFloat(M.yarnEarned) + ' ' + seatsStr + ' ' + stacksStr;
	};

	M.load = function (str: any) {
		if (!str) return false;
		var spl = str.split(' ');
		if (spl.length < 4) return false;
		var i = 0;
		M.yarn = parseFloat(spl[i++] || 0);
		M.yarnEarned = parseFloat(spl[i++] || 0);
		var seatsStr = spl[i++] || '';
		var seatParts = seatsStr.split(':');
		for (var s = 0; s < M.seats.length; s++) {
			var sv = seatParts.length > s ? parseInt(seatParts[s]) : -1;
			M.seats[s] = isNaN(sv) ? -1 : sv;
		}
		var stacksStr = spl[i++] || '';
		var stackParts = stacksStr.split(':');
		M.upgradeStacks = [0, 0, 0, 0, 0, 0];
		for (var u = 0; u < M.upgradeStacks.length; u++) {
			M.upgradeStacks[u] = Math.floor(parseFloat(stackParts[u] || 0) || 0);
		}
		// Pre-stacking saves: each one-time-bought upgrade migrates to 1 stack
		for (var v = 0; v < M.upgradeNames.length; v++) {
			var mUp = Game.Upgrades[M.upgradeNames[v]];
			if (mUp && mUp.bought && M.upgradeStacks[v] < 1) M.upgradeStacks[v] = 1;
		}
		M.computeEffs();
		M.refresh();
	};

	M.reset = function (_hard: any) {
		M.yarn = 0;
		M.yarnEarned = 0;
		M.seats = [-1, -1, -1, -1, -1, -1];
		M.upgradeStacks = [0, 0, 0, 0, 0, 0];
		M.yarnTrickle = 0;
		M.tutorialOpen = false;
		M.computeEffs();
		M.refresh();
		var t = l('roomTutorial');
		if (t) { t.innerHTML = ''; t.style.display = 'none'; }
	};

	M.logic = function () {
		// Run each game tick, whether or not the panel is open.
		// 1. Yarn production
		var rate = M.yarnPerSecond();
		if (rate > 0) {
			M.yarnTrickle += rate / Game.fps;
			if (M.yarnTrickle >= 1) {
				var gained = Math.floor(M.yarnTrickle);
				M.yarn += gained;
				M.yarnEarned += gained;
				M.yarnTrickle -= gained;
				M.checkAchievements();
				M.refresh();
			}
		}
		// 2. Wrath drift no longer happens here: Game.UpdateGrandmapocalypse
		// (engine/main.ts) reads M.currentComfort() every tick and nudges the
		// wrath to match the room (cozy calms + holds at 0, eldritch accelerates
		// the climb, 'Elder hospitality' doubles it) — all wrath mutation stays
		// in the canonical updater so the pledge/covenant logic stays in charge.
		// 3. Periodically recompute effs so the engine picks up changes
		M.computeEffs();
	};

	M.draw = function () {
		// Run each frame, only while the panel is visible.
		// Update the comfort bar live if the header is visible.
		if (l('roomHeader')) {
			var comfort = M.currentComfort();
			var pct = 50 + (comfort / 6) * 50;
			pct = Math.max(0, Math.min(100, pct));
			var fill = l('roomHeader').querySelector('.roomComfortFill');
			if (fill) {
				(fill as HTMLElement).style.width = pct + '%';
				(fill as HTMLElement).style.background = comfort >= 0 ? 'rgba(100,200,100,0.8)' : 'rgba(200,100,100,0.8)';
			}
		}
	};

	M.init(l('rowSpecial' + M.parent.id));
};
/* CC3: explicit module marker — at runtime these files are always ESM modules
 * (Vite bundles them as such), and this keeps their top-level var/function
 * declarations out of the TS global scope. Zero runtime effect. */
export {};