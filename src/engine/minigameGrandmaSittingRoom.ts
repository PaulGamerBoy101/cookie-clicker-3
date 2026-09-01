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
		// CC3: which seat the player has clicked to select (0-5, or -1 for none)
		M.selectedSeat = -1;

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
			/* ---- base card ---- */
			'.roomBox{position:relative;margin:8px auto;padding:8px 12px;max-width:600px;background:rgba(0,0,0,0.75);border-radius:12px;color:rgba(255,255,255,0.9);}' +
			'.roomTitle{font-weight:bold;font-size:13px;margin-bottom:4px;text-shadow:0px 0px 4px #000;}' +
			'.roomTitleSmall{font-weight:bold;font-size:11px;margin-bottom:4px;opacity:0.7;text-transform:uppercase;letter-spacing:1px;}' +
			'.roomStats{text-align:center;font-size:12px;margin-bottom:4px;}' +
			/* ---- comfort bar ---- */
			'.roomComfortWrap{display:flex;align-items:center;gap:6px;margin:2px 0;}' +
			'.roomComfortLabel{font-size:10px;white-space:nowrap;min-width:25px;text-align:center;}' +
			'.roomComfortBar{flex:1;height:8px;border-radius:4px;background:rgba(255,255,255,0.15);overflow:hidden;position:relative;}' +
			'.roomComfortFill{height:100%;border-radius:4px;transition:width 0.3s;}' +
			'.roomCenterMark{position:absolute;left:50%;top:0;bottom:0;width:2px;background:rgba(255,255,255,0.5);}' +
			'.roomWrathLabel{font-size:10px;text-align:center;opacity:0.7;}' +
			/* ---- seat grid ---- */
			'.roomSeatGrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:6px 0;}' +
			'.roomSeatCard{position:relative;background:rgba(255,255,255,0.08);border-radius:8px;padding:6px;min-height:72px;cursor:pointer;border:2px solid transparent;transition:border-color 0.2s,background 0.2s;}' +
			'.roomSeatCard:hover{background:rgba(255,255,255,0.15);}' +
			'.roomSeatCardSelected{border-color:rgba(255,215,0,0.7);background:rgba(255,215,0,0.12);}' +
			'.roomSeatCardLocked{opacity:0.45;cursor:default;}' +
			'.roomSeatCardLocked:hover{background:rgba(255,255,255,0.08);}' +
			'.roomSeatNum{font-size:9px;font-weight:bold;opacity:0.5;position:absolute;top:3px;right:5px;}' +
			'.roomSeatIcon{width:48px;height:48px;float:left;margin-right:6px;border-radius:6px;object-fit:cover;}' +
			'.roomSeatName{font-size:11px;font-weight:bold;line-height:1.2;}' +
			'.roomSeatStats{font-size:9px;opacity:0.8;line-height:1.3;margin-top:2px;}' +
			'.roomSeatTag{display:inline-block;padding:1px 5px;border-radius:3px;font-size:8px;font-weight:bold;margin-right:2px;}' +
			'.roomSeatTagCozy{background:rgba(100,200,100,0.3);color:#8c8;}' +
			'.roomSeatTagEldritch{background:rgba(200,100,100,0.3);color:#c88;}' +
			'.roomSeatTagNeutral{background:rgba(200,200,200,0.2);color:#aaa;}' +
			'.roomSeatClear{float:right;cursor:pointer;padding:0 4px;border-radius:3px;font-size:10px;opacity:0.5;}' +
			'.roomSeatClear:hover{opacity:1;background:rgba(255,80,80,0.3);}' +
			'.roomSeatEmpty{font-size:10px;opacity:0.5;text-align:center;padding-top:16px;}' +
			'.roomSeatLockedTxt{font-size:9px;opacity:0.6;text-align:center;padding-top:10px;font-style:italic;}' +
			/* ---- activity shelf ---- */
			'.roomShelf{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0;}' +
			'.roomShelfGroup{flex:1;min-width:180px;}' +
			'.roomShelfBtn{display:flex;align-items:center;gap:4px;cursor:pointer;padding:4px 6px;border-radius:6px;background:rgba(255,255,255,0.08);margin-bottom:3px;font-size:10px;line-height:1.2;transition:background 0.15s;}' +
			'.roomShelfBtn:hover{background:rgba(255,255,255,0.22);}' +
			'.roomShelfBtnLocked{opacity:0.35;cursor:default;}' +
			'.roomShelfBtnLocked:hover{background:rgba(255,255,255,0.08);}' +
			'.roomShelfIcon{width:32px;height:32px;border-radius:4px;object-fit:cover;flex:none;}' +
			'.roomShelfLabel{flex:1;}' +
			'.roomShelfRate{font-size:9px;opacity:0.7;}' +
			'.roomShelfComfort{font-size:9px;font-weight:bold;margin-left:auto;white-space:nowrap;}' +
			/* ---- shop ---- */
			'.roomShopList{display:flex;flex-direction:column;gap:4px;margin:4px 0;}' +
			'.roomShopItem{display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:6px;background:rgba(255,255,255,0.06);font-size:10px;line-height:1.3;}' +
			'.roomShopInfo{flex:1;}' +
			'.roomShopName{font-weight:bold;}' +
			'.roomShopStack{opacity:0.6;}' +
			'.roomShopDesc{opacity:0.7;font-size:9px;}' +
			'.roomShopBtn{cursor:pointer;padding:3px 10px;border-radius:4px;background:rgba(100,180,255,0.2);font-size:10px;font-weight:bold;white-space:nowrap;transition:background 0.15s;flex:none;}' +
			'.roomShopBtn:hover{background:rgba(100,180,255,0.35);}' +
			'.roomShopBtnLocked{opacity:0.35;cursor:default;}' +
			'.roomShopBtnLocked:hover{background:rgba(100,180,255,0.2);}' +
			/* ---- misc ---- */
			'.roomHelpBtn{cursor:pointer;padding:1px 7px;border-radius:4px;background:rgba(255,255,255,0.12);font-size:10px;font-weight:bold;margin-left:6px;white-space:nowrap;}' +
			'.roomHelpBtn:hover{background:rgba(255,255,255,0.3);}' +
			'.roomTutorial{margin:0px auto 8px;max-width:600px;background:rgba(0,0,0,0.85);border-radius:12px;padding:8px 12px;color:rgba(255,255,255,0.9);}' +
			'.roomTutorial ul{margin:6px 0 4px 16px;padding:0;font-size:11px;line-height:1.5;}' +
			'.roomTutorial li{margin-bottom:6px;}' +
			'</style>';
		str += '<div id="roomBG"></div>';
		str += '<div id="roomContent">';
		str += '<div id="roomTutorial" style="display:none;"></div>';
		str += '<div id="roomHeader"></div>';
		str += '<div id="roomSeats"></div>';
		str += '<div id="roomShelf"></div>';
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
		str += '<div class="roomStats">🧶 Yarn: <b>' + Beautify(M.yarn) + '</b> &nbsp;|&nbsp; Rate: <b>' + Beautify(M.yarnPerSecond(), 2) + '</b>/s</div>';
		// Comfort bar: -6 to +6, centered at 0
		var pct = 50 + (comfort / 6) * 50;
		pct = Math.max(0, Math.min(100, pct));
		var fillColor = comfort >= 0 ? 'rgba(100,200,100,0.8)' : 'rgba(200,100,100,0.8)';
		var comfortLabel = '';
		if (comfort > 0) comfortLabel = '<span style="color:#8c8;">+' + comfort + ' (cozy)</span>';
		else if (comfort < 0) comfortLabel = '<span style="color:#c88;">− comfort ' + comfort + ' (eldritch)</span>';
		else comfortLabel = '<span style="color:#888;">comfort 0 (neutral)</span>';
		// Left label: cozy, Right label: eldritch
		var leftLabel = comfort >= 0 ? '<span style="color:#8c8;font-weight:bold;">+</span>' : '<span style="opacity:0.4;">+</span>';
		var rightLabel = comfort <= 0 ? '<span style="color:#c88;font-weight:bold;">−</span>' : '<span style="opacity:0.4;">−</span>';
		str += '<div class="roomComfortWrap">';
		str += '<span class="roomComfortLabel" style="min-width:36px;text-align:right;">' + leftLabel + ' Cozy</span>';
		str += '<div class="roomComfortBar"><div class="roomCenterMark"></div><div class="roomComfortFill" style="width:' + pct + '%;background:' + fillColor + ';margin-left:0;"></div></div>';
		str += '<span class="roomComfortLabel" style="min-width:36px;text-align:left;">Eldritch ' + rightLabel + '</span>';
		str += '</div>';
		str += '<div style="text-align:center;font-size:10px;margin:2px 0;">' + comfortLabel + '</div>';
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
		str += '<li><b>Assign activities</b> — click a seat card to select it, then click an activity in the shelf below to assign it there. Click ✕ on an assigned seat to empty it. Or just click an activity to fill the next empty seat automatically.</li>';
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

	M.selectSeat = function (seatIdx: any) {
		if (seatIdx >= 0 && seatIdx < M.seats.length && M.parent.amount >= M.seatUnlocks[seatIdx]) {
			M.selectedSeat = (M.selectedSeat === seatIdx) ? -1 : seatIdx;
		}
		M.refresh();
	};

	M.renderSeats = function () {
		var str = '<div class="roomBox"><div class="roomTitle">The Sitting Room</div>';
		str += '<div style="font-size:10px;opacity:0.7;margin-bottom:2px;">Select a seat, then pick an activity below — or just click an activity to fill the next empty seat.</div>';
		str += '<div class="roomSeatGrid">';
		for (var s = 0; s < M.seats.length; s++) {
			var seatLocked = M.parent.amount < M.seatUnlocks[s];
			var selected = (M.selectedSeat === s);
			var cls = 'roomSeatCard';
			if (seatLocked) cls += ' roomSeatCardLocked';
			else if (selected) cls += ' roomSeatCardSelected';
			str += '<div class="' + cls + '" id="roomSeatCard' + s + '">';
			str += '<span class="roomSeatNum">' + (s + 1) + '</span>';
			if (seatLocked) {
				str += '<div class="roomSeatLockedTxt">🔒 Requires<br><b>' + M.seatUnlocks[s] + '</b> grandmas</div>';
			} else {
				var current = M.seats[s];
				if (current < 0) {
					str += '<div class="roomSeatEmpty">Empty seat<br>+</div>';
				} else {
					var act = M.activities[current];
					var tagCls = act.comfort > 0 ? 'roomSeatTagCozy' : (act.comfort < 0 ? 'roomSeatTagEldritch' : 'roomSeatTagNeutral');
					var tagTxt = act.comfort > 0 ? '+' + act.comfort : (act.comfort < 0 ? act.comfort : '0');
					str += '<span class="roomSeatClear" id="roomSeatClear' + s + '" title="Empty this seat">✕</span>';
					str += '<img class="roomSeatIcon" src="img/' + act.icon + '" alt="' + act.name + '">';
					str += '<div class="roomSeatName">' + act.name + '</div>';
					str += '<div class="roomSeatStats">';
					str += '<span class="roomSeatTag ' + tagCls + '">' + tagTxt + ' comfort</span>';
					str += '<span class="roomSeatTag roomSeatTagNeutral">+' + Beautify(act.yarnRate, 2) + ' yarn/s</span>';
					str += '</div>';
				}
			}
			str += '</div>';
		}
		str += '</div>';
		str += '</div>';
		return str;
	};

	M.renderShelf = function () {
		var str = '<div class="roomBox"><div class="roomTitle">Activities</div>';
		var cozy = '';
		var eldritch = '';
		for (var a = 0; a < M.activities.length; a++) {
			var act = M.activities[a];
			var actLocked = M.parent.amount < act.unlock;
			var wrathLocked = (act.comfort < 0 && Game.elderWrath <= 0);
			var cls = 'roomShelfBtn';
			if (actLocked || wrathLocked) cls += ' roomShelfBtnLocked';
			var title = act.name + ' — ' + act.desc;
			if (actLocked) title += ' (needs ' + act.unlock + ' grandmas)';
			if (wrathLocked) title += ' (needs active Grandmapocalypse)';
			var comfortTxt = act.comfort > 0 ? '<span style="color:#8c8;">+' + act.comfort + '</span>' : (act.comfort < 0 ? '<span style="color:#c88;">' + act.comfort + '</span>' : '<span style="color:#aaa;">0</span>');
			var btn = '<div class="' + cls + '" title="' + title + '" id="roomShelfAct' + a + '">' +
				'<img class="roomShelfIcon" src="img/' + act.icon + '" alt="">' +
				'<span class="roomShelfLabel"><b>' + act.name + '</b><br><span class="roomShelfRate">' + act.desc + '</span></span>' +
				'<span class="roomShelfComfort">' + comfortTxt + ' &nbsp;+' + Beautify(act.yarnRate, 2) + '/s</span>' +
				'</div>';
			if (act.comfort < 0) eldritch += btn; else cozy += btn;
		}
		str += '<div class="roomShelfGroup"><div class="roomTitleSmall">Cozy activities</div><div class="roomShelf">' + cozy + '</div></div>';
		str += '<div class="roomShelfGroup"><div class="roomTitleSmall">Eldritch activities</div><div class="roomShelf">' + eldritch + '</div></div>';
		str += '<div class="roomWrathLabel" style="margin-top:4px;">Eldritch activities unlock when the Grandmapocalypse is active (own <b>One mind</b>).</div>';
		str += '</div>';
		return str;
	};

	M.renderShop = function () {
		var str = '<div class="roomBox"><div class="roomTitle">Sitting Room Upgrades</div>';
		str += '<div style="font-size:10px;opacity:0.7;margin-bottom:2px;">Each upgrade is repeatable — every stack boosts Grandma output, and stacks persist in your save.</div>';
		str += '<div class="roomShopList">';
		for (var i = 0; i < M.upgradeNames.length; i++) {
			var name = M.upgradeNames[i];
			var up = Game.Upgrades[name];
			if (!up) continue;
			var price = up.yarnPrice || 0;
			var stacks = M.effectiveStacks(name);
			var canBuy = M.yarn >= price;
			str += '<div class="roomShopItem">';
			str += '<div class="icon shadowFilter" style="flex:none;margin:0;' + writeIcon(up.icon) + '"></div>';
			str += '<div class="roomShopInfo"><span class="roomShopName">' + name + '</span>' + (stacks > 0 ? ' <span class="roomShopStack">×' + stacks + '</span>' : '') + '<br><span class="roomShopDesc">' + up.baseDesc + '</span></div>';
			str += '<div class="roomShopBtn' + (canBuy ? '' : ' roomShopBtnLocked') + '" id="roomBuy' + i + '">' + Beautify(price) + ' 🧶</div>';
			str += '</div>';
		}
		str += '</div>';
		str += '</div>';
		return str;
	};

	M.refresh = function () {
		if (!l('roomHeader')) return;
		l('roomHeader').innerHTML = M.renderHeader();
		l('roomSeats').innerHTML = M.renderSeats();
		l('roomShelf').innerHTML = M.renderShelf();
		l('roomShop').innerHTML = M.renderShop();
		// Bind the How-to-play button (the header re-renders every refresh).
		var helpBtn = l('roomHelpBtn');
		if (helpBtn) AddEvent(helpBtn, 'click', function () { M.toggleTutorial(); });
		// Bind seat card clicks
		for (var s = 0; s < M.seats.length; s++) {
			var card = l('roomSeatCard' + s);
			if (card) AddEvent(card, 'click', function (si: any) { return function () { M.selectSeat(si); }; }(s));
			var clearBtn = l('roomSeatClear' + s);
			if (clearBtn) {
				AddEvent(clearBtn, 'click', function (si: any) { return function (e: any) { e.stopPropagation(); M.assignSeat(si, -1); }; }(s));
			}
		}
		// Bind activity shelf buttons — assign to selected seat or first empty unlocked seat
		for (var a = 0; a < M.activities.length; a++) {
			var btn = l('roomShelfAct' + a);
			if (btn) {
				AddEvent(btn, 'click', function (ai: any) { return function () {
					var act = M.activities[ai];
					if (M.parent.amount < act.unlock) return;
					if (act.comfort < 0 && Game.elderWrath <= 0) { PlaySound('snd/error1.mp3',0.5); return; }
					// Assign to selected seat, or first empty unlocked seat
					var target = M.selectedSeat;
					if (target < 0 || target >= M.seats.length || M.parent.amount < M.seatUnlocks[target]) {
						target = -1;
						for (var si = 0; si < M.seats.length; si++) {
							if (M.parent.amount >= M.seatUnlocks[si] && M.seats[si] < 0) { target = si; break; }
						}
					}
					if (target < 0) { PlaySound('snd/error1.mp3',0.5); return; }
					M.assignSeat(target, ai);
				}; }(a));
			}
		}
		// Bind shop buttons
		for (var j = 0; j < M.upgradeNames.length; j++) {
			var btn2 = l('roomBuy' + j);
			if (btn2) {
				AddEvent(btn2, 'click', function (name: any) { return function () { if (M.yarn >= (Game.Upgrades[name] ? Game.Upgrades[name].yarnPrice : 0)) M.buyUpgrade(name); }; }(M.upgradeNames[j]));
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
		M.selectedSeat = -1;
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