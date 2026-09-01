/* Casino — a native CC3 port of klattmose's Casino mod (v4.0, targets CC
 * 2.052 + CCSE). Blackjack minigame on the Chancemaker building.
 *
 * Original: https://github.com/klattmose/CookieClicker (mods/Casino.js)
 * The repo carries no license file; per the porting agreement this is a
 * faithful re-implementation on the native CC3 mod + minigame APIs (no CCSE
 * dependency), with the original card sprite, table background and icon
 * sheet art vendored into public/ and credited in CREDITS.md.
 *
 * Porting notes:
 * - The original piggybacks the vanilla minigame slot on Game.Objects
 *   ['Chancemaker'] and loads its UI through CCSE. Here the mod registers
 *   via Game.registerMod (init runs from Game.launchMods during Init,
 *   after vanilla content) and reuses the VANILLA minigame mechanism:
 *   M is attached as the building's `minigame`, minigameUrl is 'casino.js'
 *   (registered in src/main.ts as a no-op module — the original pointed it
 *   at a remote "dummyFile.js" for exactly this reason), and the engine's
 *   scriptLoaded calls M.launch and restores M.parent.minigameSave through
 *   M.reset(true) + M.load. M.save therefore RETURNS the state string
 *   (the original stashed it in CCSE.config.OtherMods and returned ''); the
 *   string format itself is byte-identical, so CCSE-era casino saves keep
 *   working.
 * - Fresh CC3 has no legacy CCSE/localStorage saves to import (the
 *   original's import path in M.init and CCSE.customLoad is omitted).
 * - CCSE.MenuHelper.ToggleButton / Slider / AppendCollapsibleOptionsMenu /
 *   AppendStatsVersionNumber / AppendStatsGeneral / AppendStatsSpecial are
 *   reproduced inline with the same markup.
 */
(function () {
	if (window.__cc3Casino) return;
	window.__cc3Casino = 1;

	const NAME = 'casino';
	const DISPLAY = 'Casino';
	const VERSION = '4.0';
	const ICONS_URL = 'img/customIcons.png';
	const ICON: any[] = [0, 3, ICONS_URL];
	const CARDS_IMAGE = 'img/phantasypantsCards.png';

	/** The minigame object; attached to the Chancemaker in init(). */
	let M: any = null;

	/* ------------------------------------------------------------------ */
	/* CCSE helpers, reproduced (same markup the original emitted).        */
	/* ------------------------------------------------------------------ */
	function appendCollapsibleOptionsMenu(title: string, body: string) {
		//CCSE.AppendCollapsibleOptionsMenu, reproduced.
		const menu = l('menu');
		if (!menu) return;

		const titleDiv = document.createElement('div');
		titleDiv.className = 'title';
		titleDiv.appendChild(document.createTextNode(title + ' '));

		const span = document.createElement('span');
		span.style.cursor = 'pointer';
		span.style.display = 'inline-block';
		span.style.height = '14px';
		span.style.width = '14px';
		span.style.borderRadius = '7px';
		span.style.textAlign = 'center';
		span.style.backgroundColor = '#C0C0C0';
		span.style.color = 'black';
		span.style.fontSize = '13px';
		span.style.verticalAlign = 'middle';
		span.textContent = collapsed ? '+' : '-';
		span.addEventListener('click', function () {
			collapsed = collapsed ? 0 : 1;
			Game.UpdateMenu();
		});
		titleDiv.appendChild(span);

		const bodyDiv = document.createElement('div');
		bodyDiv.innerHTML = body;

		const wrap = document.createElement('div');
		wrap.style.padding = '0px';
		wrap.style.margin = '8px 4px';
		wrap.appendChild(titleDiv);
		if (!collapsed) wrap.appendChild(bodyDiv);

		menu.appendChild(wrap);
	}
	let collapsed = 0;

	function toggleButtonHTML(prefName: string, button: string, on: string, off: string, callback: string, invert: number) {
		//CCSE.MenuHelper.ToggleButton, reproduced.
		let cb = callback;
		cb += `('${prefName}', '${button}', '${on.replace(/'/g, "\\'")}', '${off.replace(/'/g, "\\'")}', '${invert}');`;
		cb += "PlaySound('snd/tick.mp3');";
		const className = `smallFancyButton prefButton option${(M[prefName] ^ invert) ? '' : ' off'}`;
		return `<a id="${button}" class="${className}" ${Game.clickStr}="${cb}">${M[prefName] ? on : off}</a>`;
	}

	function sliderHTML(slider: string, leftText: string, rightText: string, startValueFunction: () => number, callback: string, min: number, max: number, step: number) {
		//CCSE.MenuHelper.Slider, reproduced.
		const value = startValueFunction();
		const rt = rightText.replace('[$]', String(value));
		return `<div class="sliderBox"><div style="float:left;" class="smallFancyButton">${leftText}</div>` +
			`<div style="float:right;" class="smallFancyButton" id="${slider}RightText">${rt}</div>` +
			`<input type="range" id="${slider}" class="slider" style="clear:both;" min="${min}" max="${max}" step="${step}"` +
			` value="${value}" onchange="${callback}" oninput="${callback}" onmouseup="PlaySound('snd/tick.mp3');"></div>`;
	}

	function appendStatsVersionNumber(name: string, version: string) {
		//CCSE.AppendStatsVersionNumber, reproduced.
		const general = l('statsGeneral');
		if (!general || !general.parentNode) return;
		const div = document.createElement('div');
		div.className = 'listing';
		div.innerHTML = '<b>' + name + ':</b> ' + version;
		general.parentNode.appendChild(div);
	}

	function appendStatsGeneral(html: string) {
		//CCSE.AppendStatsGeneral, reproduced.
		const general = l('statsGeneral');
		if (!general) return;
		const div = document.createElement('div');
		div.innerHTML = html;
		general.appendChild(div);
	}

	function appendStatsSpecial(html: string) {
		//CCSE.AppendStatsSpecial, reproduced.
		const special = l('statsSpecial');
		if (!special) return;
		const div = document.createElement('div');
		div.innerHTML = html;
		special.appendChild(div);
	}

	/* ------------------------------------------------------------------ */
	/* init — runs from Game.launchMods() during Init, after vanilla       */
	/* content exists. Mirrors the original M.launcher (which ran after    */
	/* CCSE loaded).                                                       */
	/* ------------------------------------------------------------------ */
	function init() {
		const G = Game as any;
		if (!G.Objects || !G.Objects['Chancemaker']) return;
		if (G.Objects['Chancemaker'].minigame) throw new Error('Casino: Chancemaker already has a minigame');

		M = {};
		M.parent = G.Objects['Chancemaker'];
		M.parent.minigame = M;

		//Stuff that needs to wait for CCSE but should only run once goes here
		M.parent.minigameUrl = 'casino.js';
		M.parent.minigameName = DISPLAY;

		M.name = M.parent.minigameName;
		M.version = VERSION;
		M.savePrefix = 'minigameCasino';
		M.cardsImage = CARDS_IMAGE;
		M.iconsImage = ICONS_URL;
		M.chancemakerChance = 0.0002;
		M.beatLength = 750;
		M.loadedCount = 0;

		//Called by the engine (Game.scriptLoaded) when the Chancemaker
		//reaches level 1 and the (no-op) minigame module loads.
		M.launch = function () {
			const M = this;

			M.div = l('rowSpecial' + M.parent.id);

			//***********************************
			//    Initial support for multiple games
			//***********************************
			M.games = {
				choice: 0,
				Blackjack: {},
			};

			M.cards = [];
			M.cards.push({pip: 0, value: 0, suit: 0});
			for (let j = 0; j < 4; j++) for (let i = 1; i <= 13; i++) M.cards.push({pip: i, value: (i < 10 ? i : 10), suit: j});

			M.reshuffle = function () {
				M.Deck = [];
				for (let i = 0; i < M.deckCount; i++) for (let j = 1; j < M.cards.length; j++) M.Deck.push(M.cards[j]);
			};

			M.cardImage = function (card: any) {
				let left, top;
				if (!card.pip) {
					left = 2 * 79;
					top = 4 * 123;
				} else {
					left = (card.pip - 1) * 79;
					top = card.suit * 123;
				}
				return `-${left}px -${top}px `;
			};

			M.buildSidebar = function () {
				if (M.games.choice == 0) M.games.Blackjack.buildSidebar();
			};

			M.buildTable = function () {
				if (M.games.choice == 0) M.games.Blackjack.buildTable();
			};

			M.formatPercentage = function (value: number) {
				if (!M.percentagePrecision) {
					return value * 100 + '%';
				} else {
					const sign = value < 0 ? '-' : '';
					const v = Math.abs(value);
					if (v < M.minPercentage) {
						if (sign) {
							return '-' + M.minPercentageStr + 'to 0%';
						} else {
							return '<' + M.minPercentageStr;
						}
					} else {
						//Decided on floor instead of round, it is more similar to the expectations
						const scaled = Math.round(v * 100 * M.percentagePow10);
						let low = scaled % M.percentagePow10;
						let low_digits = M.percentagePrecision;
						while (low > 0 && low % 10 === 0) {
							low /= 10;
							low_digits -= 1;
						}
						let lowStr = '';
						if (low) {
							lowStr = String(low);
							while (lowStr.length < low_digits) {
								lowStr = '0' + lowStr;
							}
							lowStr = '.' + lowStr;
						}
						const high = Math.floor(scaled / M.percentagePow10);
						return sign + high + lowStr + '%';
					}
				}
			};

			M.setPercentagePrecision = function (precision: number) {
				if (precision < 0) {
					throw `In setPercentagePrecision: precision must be >= 0, got ${precision}`;
				} else {
					M.percentagePrecision = precision;
					if (!precision) {
						M.minPercentage = null;
						M.minPercentageStr = null;
						M.percentagePow10 = null;
					} else {
						M.minPercentage = Math.pow(10, -precision - 2);
						M.minPercentageStr = String(Math.pow(10, -precision)) + '%';
						M.percentagePow10 = Math.pow(10, precision);
					}
				}
			};

			//***********************************
			//    Blackjack
			//***********************************
			M.games.Blackjack = {
				wins: 0,
				winsT: 0,
				losses: 0,
				tiesLost: 0,
				ownLuckWins: 0,
				doubleDown: 0,
				splits: 0,
				netTotal: 0,

				phases: {
					inactive: 0,
					deal: 1,
					firstTurn: 2,
					playerTurn: 3,
					dealerTurn: 4,
					evaluate: 5,
					surrender: 6,
				},

				getHandValue: function (hand: any) {
					hand.value = 0;
					for (let i = 0; i < hand.cards.length; i++) hand.value += hand.cards[i].value;
					for (let i = 0; i < hand.cards.length; i++) if (hand.value <= 11 && hand.cards[i].value == 1) hand.value += 10;
				},

				drawCard: function (deck: any[]) {
					const i = Math.floor(Math.random() * deck.length);
					const res = deck[i];
					deck.splice(i, 1);

					if (M.Deck.length < M.minDecks * 52) {
						G.Unlock('Counting cards');
						M.reshuffle();
						G.Popup(loc('Decks reshuffled!'), G.mouseX, G.mouseY);
					}
					return res;
				},

				hit: function (hand: any, player: boolean) {
					this.getHandValue(hand);
					const oldValue = hand.value;
					hand.cards.push(this.drawCard(M.Deck));
					this.getHandValue(hand);

					if (hand.value > 21) {
						if (player) {
							G.Unlock('Math lessons');
							this.stand();
						}
					} else if (player && oldValue >= 17 && hand.value > oldValue) {
						G.Win('I like to live dangerously');
					}

					this.buildTable();
				},

				doubledown: function () {
					G.Spend(M.betAmount);
					M.betAmount *= 2;
					M.games.Blackjack.doubleDown++;
					this.hit(M.hands.player[M.currentPlayerHand], true);
					this.stand();
				},

				split: function () {
					G.Spend(M.betAmount);

					M.hands.player.push({value: 0, cards: []});
					M.hands.player[1].cards.push(M.hands.player[0].cards[1]);
					M.hands.player[0].cards.splice(1, 1);
					M.hands.player[0].splitFirstTurn = true;
					M.hands.player[1].splitFirstTurn = true;
					M.games.Blackjack.splits += 2;

					this.hit(M.hands.player[0], true);
					this.hit(M.hands.player[1], true);
					for (let i = 0; i < 2; i++) {
						if (M.hands.player[i].value == 21) {
							G.tooltip.shouldHide = 1;
							M.currentPlayerHand = i;
							M.games.Blackjack.phase = M.games.Blackjack.phases.playerTurn;
							M.games.Blackjack.stand();
						} else {
							this.buildSidebar();
							this.buildTable();
						}
					}
				},

				surrender: function () {
					this.phase = this.phases.surrender;
					M.nextBeat = Date.now() + M.beatLength;
					this.buildSidebar();
					this.buildTable();
				},

				stand: function () {
					if (M.currentPlayerHand >= M.hands.player.length - 1) {
						let allBust = true;
						for (let i = 0; i < M.hands.player.length; i++) if (M.hands.player[i].value <= 21) allBust = false;

						if (allBust) {
							M.nextBeat = Date.now() + M.beatLength;
							this.phase = this.phases.evaluate;
						} else {
							M.hands.dealer.cards[1] = this.hiddenCard;
							this.getHandValue(M.hands.dealer);
							this.phase = this.phases.dealerTurn;
							if (M.hands.dealer.value >= 17) {
								M.currentPlayerHand = 0;
								this.phase = this.phases.evaluate;
							}
							M.nextBeat = Date.now() + M.beatLength;
						}
					} else {
						M.nextBeat = Date.now() + M.beatLength;
						M.currentPlayerHand++;
					}

					this.buildSidebar();
					this.buildTable();
				},

				instantWinChance: function () {
					return G.Has('I make my own luck') ? 1 - Math.pow(1 - M.chancemakerChance * (G.Has('Infinite Improbability Drive') ? 2 : 1), M.parent.amount) : 0;
				},

				toggleBetMode: function () {
					if (M.betMode == 1 && G.Has('Raise the stakes')) M.betMode = 2;
					else if (M.betMode < 3 && G.Has('High roller!')) M.betMode = 3;
					else if (M.betMode < 4 && G.Has('Big spender!')) M.betMode = 4;
					else if (M.betMode < 5 && G.Has('Main player')) M.betMode = 5;
					else if (M.betMode < 6 && G.Has('True gambler')) M.betMode = 6;
					else M.betMode = 1;

					this.buildSidebar();
				},

				toggleBetChoice: function () {
					if (M.betChoice == 1 && G.Has('Double or nothing')) M.betChoice = 2;
					else if (M.betChoice < 3 && G.Has('Stoned cows')) M.betChoice = 5;
					else if (M.betChoice < 10 && G.Has('Game for Pros')) M.betChoice = 20;
					else M.betChoice = 1;

					this.buildSidebar();
				},

				dealProbabilities: function () {
					let res = '<div style="padding:8px 4px; min-width:125px;">';
					const iwc = M.games.Blackjack.instantWinChance();
					const chances: Record<number, number> = {};
					const cards: Record<number, number> = {};
					const possibles = M.Deck.length * (M.Deck.length - 1) / 2;

					for (let i = 4; i <= 21; i++) chances[i] = 0;
					for (let i = 1; i <= 10; i++) cards[i] = 0;

					for (let i = 0; i < M.Deck.length; i++) {
						const card = M.Deck[i];
						cards[card.value]++;
					}

					for (let i = 1; i <= 10; i++)
						for (let j = 1; j <= 10; j++) {
							let val = j + i;
							if (i == 1 || j == 1) val += 10;
							chances[val] += (cards[i] * (cards[j] + (i == j ? -1 : 0))) / possibles / 2;
						}

					chances[21] = 1 - (1 - chances[21]) * (1 - iwc);
					for (let i = 4; i <= 20; i++) chances[i] *= 1 - iwc;

					if (chances[21] != 0) res += `<b>${loc('Blackjack : ')}</b>` + M.formatPercentage(chances[21]) + '<br/>';
					for (let i = 20; i >= 4; i--) if (chances[i] != 0) res += `<b>${i} : </b>` + M.formatPercentage(chances[i]) + '<br/>';

					return res + '</div>';
				},

				drawProbabilities: function () {
					let res = '<div style="padding:8px 4px; min-width:125px;">';
					const cards: Record<number, number> = {};
					const outcomes: Record<number, number> = {};
					outcomes[22] = 0;

					for (let i = 1; i <= 10; i++) cards[i] = 0;
					for (let i = 0; i < M.Deck.length; i++) {
						const card = M.Deck[i];
						cards[card.value]++;
					}
					cards[M.games.Blackjack.hiddenCard.value]++;

					for (let i = 1; i <= 10; i++) {
						const prob = cards[i] / (M.Deck.length + 1);
						let value = 0;
						const hand = M.hands.player[M.currentPlayerHand];

						for (let j = 0; j < hand.cards.length; j++) value += hand.cards[j].value;
						value += i;
						if (value <= 11 && i == 1) value += 10;
						for (let j = 0; j < hand.cards.length; j++) if (value <= 11 && hand.cards[j].value == 1) value += 10;

						if (value > 21) outcomes[22] += prob;
						else outcomes[value] = prob;
					}

					if (outcomes[22]) res += `<b>${loc('Bust : ')}</b>` + M.formatPercentage(outcomes[22]) + '<br/>';
					for (let i = 21; i > 5; i--) if (outcomes[i]) res += `<b>${i} : </b>` + M.formatPercentage(outcomes[i]) + '<br/>';

					return res + '</div>';
				},

				standProbabilities: function () {
					let res = '<div style="padding:8px 4px; min-width:125px;">';
					const cards: Record<number, number> = {};
					const outcomes: Record<number, number> = {};
					const simHand: number[] = [];
					let winChance = 0;
					let lossChance = 0;

					for (let i = 0; i < M.hands.dealer.cards.length; i++) if (M.hands.dealer.cards[i].value) simHand.push(M.hands.dealer.cards[i].value);
					for (let i = 17; i <= 22; i++) outcomes[i] = 0;

					for (let i = 1; i <= 10; i++) cards[i] = 0;
					for (let i = 0; i < M.Deck.length; i++) {
						const card = M.Deck[i];
						cards[card.value]++;
					}
					cards[M.games.Blackjack.hiddenCard.value]++;

					M.games.Blackjack.recursiveDealerSim(cards, outcomes, simHand, M.Deck.length + 1, 1);

					winChance += outcomes[22];
					if (G.Has('Tiebreaker') || !G.Has('Standard push'))
						for (let i = 21; i >= 17; i--) if (i >= M.hands.player[M.currentPlayerHand].value + (G.Has('Tiebreaker') ? 1 : 0)) lossChance += outcomes[i];
					else winChance += outcomes[i];
					if (winChance) res += `<b>${loc('Win : ')}</b><span class="green">` + M.formatPercentage(winChance) + '</span><br/>';
					if (lossChance) res += `<b>${loc('Lose : ')}</b><span class="red">` + M.formatPercentage(lossChance) + '</span><br/>';

					if (outcomes[22]) res += `<br/><b>${loc('Dealer chances')}</b><br/><br/><b>${loc('Bust : ')}</b>` + M.formatPercentage(outcomes[22]) + '<br/>';
					for (let i = 21; i >= 17; i--) if (outcomes[i]) res += `<b>${i} : </b>` + M.formatPercentage(outcomes[i]) + '<br/>';

					return res + '</div>';
				},

				recursiveDealerSim: function (cards: Record<number, number>, outcomes: Record<number, number>, simHand: number[], deckLength: number, stateChance: number) {
					for (let i = 1; i <= 10; i++) {
						if (cards[i]) {
							simHand.push(i);

							let value = 0;
							const chance = (stateChance * cards[i]) / deckLength;
							for (let j = 0; j < simHand.length; j++) value += simHand[j];
							for (let j = 0; j < simHand.length; j++) if (value <= 11 && simHand[j] == 1) value += 10;

							if (value > 21) value = 22;
							if (value >= 17) {
								outcomes[value] += chance;
							} else {
								cards[i]--;
								M.games.Blackjack.recursiveDealerSim(cards, outcomes, simHand, deckLength - 1, chance);
								cards[i]++;
							}

							simHand.splice(simHand.length - 1);
						}
					}
				},

				buildSidebar: function () {
					const mode = (() => {
						if (M.betMode == 1) return loc('second');
						else if (M.betMode == 2) return loc('minute');
						else if (M.betMode == 3) return loc('hour');
						else if (M.betMode == 4) return loc('day');
						else if (M.betMode == 5) return loc('month');
						else if (M.betMode == 6) return loc('decade');
						return '';
					})();

					let str = '';
					const strBet = M.bankPercentage == true ? Beautify(M.betChoice / 10, 1) : Beautify(M.betChoice);
					if (G.Has('Double or nothing') || G.Has('Stoned cows') || G.Has('Game for Pros'))
						str += `<div>${loc('Bet: ')}<a class="option" id="casinoBetChoiceToggle" ${G.clickStr}="PlaySound('snd/tick.mp3');Casino.games.Blackjack.toggleBetChoice();">${strBet}</a> `;
					else str += `<div>${loc('Bet: ')}${strBet} `;

					if (M.bankPercentage == true) {
						str += loc('percent of bank') + '</div>';
					} else if (G.Has('Raise the stakes') || G.Has('High roller!') || G.Has('Big spender!') || G.Has('Main player') || G.Has('True gambler'))
						str += `<a class="option" id="casinoBetModeToggle" ${G.clickStr}="PlaySound('snd/tick.mp3');Casino.games.Blackjack.toggleBetMode();">${mode}${M.betChoice == 1 ? '' : 's'}</a>${loc(' of CPS')}</div>`;
					else str += `${mode}${M.betChoice == 1 ? '' : 's'}${loc(' of CPS')}</div>`;

					str += `<div id="casinoCurrentBet">(${Beautify(M.betAmount)} ${loc('cookies')})</div>`;
					M.moneyL.innerHTML = str;

					str = '<table class="casinoActionsTable">';
					if (this.phase == this.phases.inactive) str += `<tr><td><div class="listing"><a class="option" id="casinoDeal" ${G.clickStr}="PlaySound('snd/tick.mp3');Game.tooltip.shouldHide=1;Casino.games.Blackjack.istep=0;Casino.games.Blackjack.phase=Casino.games.Blackjack.phases.deal;Casino.nextBeat=Date.now();">${loc('Deal')}</a></div></td></tr>`;
					else str += `<tr><td><div class="listing">${loc('Deal')}</div></td></tr>`;
					if (this.phase == this.phases.firstTurn || this.phase == this.phases.playerTurn) str += `<tr><td><div class="listing"><a class="option" id="casinoHit" ${G.clickStr}="PlaySound('snd/tick.mp3');Game.tooltip.shouldHide=1;Casino.games.Blackjack.phase=Casino.games.Blackjack.phases.playerTurn;Casino.games.Blackjack.hit(Casino.hands.player[Casino.currentPlayerHand],true);Casino.hands.player[Casino.currentPlayerHand].splitFirstTurn=false;if (Casino.hands.player[Casino.currentPlayerHand].value == 21) {Game.tooltip.shouldHide = 1;Casino.games.Blackjack.phase = Casino.games.Blackjack.phases.playerTurn;Casino.games.Blackjack.stand();} else Casino.games.Blackjack.buildSidebar();">${loc('Hit')}</a></div></td></tr>`;
					else str += `<tr><td><div class="listing">${loc('Hit')}</div></td></tr>`;
					if ((this.phase == this.phases.firstTurn || (M.games.Blackjack.splits && G.Has('Double down') && M.hands.player[M.currentPlayerHand].splitFirstTurn)) && G.cookies >= M.betAmount) {
						str += `<tr><td><div class="listing"><a class="option" id="casinoDoubledown" ${G.clickStr}="PlaySound('snd/tick.mp3');Game.tooltip.shouldHide=1;Casino.games.Blackjack.phase=Casino.games.Blackjack.phases.playerTurn;Casino.games.Blackjack.doubledown();">${loc('Double Down')}</a></div></td></tr>`;
					} else str += `<tr><td><div class="listing">${loc('Double Down')}</div></td></tr>`;
					if (this.phase == this.phases.firstTurn && G.cookies >= M.betAmount && M.hands.player[0].cards[0].pip == M.hands.player[0].cards[1].pip)
						str += `<tr><td><div class="listing"><a class="option" id="casinoSplit" ${G.clickStr}="PlaySound('snd/tick.mp3');Game.tooltip.shouldHide=1;Casino.games.Blackjack.phase=Casino.games.Blackjack.phases.playerTurn;Casino.games.Blackjack.split();">${loc('Split')}</a></div></td></tr>`;
					else str += `<tr><td><div class="listing">${loc('Split')}</div></td></tr>`;
					if (G.Has('Surrender') && (this.phase == this.phases.firstTurn || (M.games.Blackjack.splits && M.hands.player[M.currentPlayerHand].splitFirstTurn)))
						str += `<tr><td><div class="listing"><a class="option" id="casinoSurrender" ${G.clickStr}="PlaySound('snd/tick.mp3');Game.tooltip.shouldHide=1;Casino.games.Blackjack.phase=Casino.games.Blackjack.phases.playerTurn;Casino.games.Blackjack.surrender();">${loc('Surrender')}</a></div></td></tr>`;
					else str += `<tr><td><div class="listing">${loc('Surrender')}</div></td></tr>`;
					if (this.phase == this.phases.firstTurn || this.phase == this.phases.playerTurn) str += `<tr><td><div class="listing"><a class="option" id="casinoStand" ${G.clickStr}="PlaySound('snd/tick.mp3');Game.tooltip.shouldHide=1;Casino.games.Blackjack.phase=Casino.games.Blackjack.phases.playerTurn;Casino.games.Blackjack.stand();">${loc('Stand')}</a></div></td></tr>`;
					else str += `<tr><td><div class="listing">${loc('Stand')}</div></td></tr>`;
					str += '</table>';
					M.actionsL.innerHTML = str;

					if (G.Has('Actually, do tell me the odds')) {
						if (l('casinoDeal')) G.attachTooltip(l('casinoDeal'), this.dealProbabilities, 'this');
						if (l('casinoHit')) G.attachTooltip(l('casinoHit'), this.drawProbabilities, 'this');
						if (l('casinoDoubledown')) G.attachTooltip(l('casinoDoubledown'), this.drawProbabilities, 'this');
						//if(l('casinoSplit')) G.attachTooltip(l('casinoSplit'), this.drawProbabilities, 'this');
						if (l('casinoSurrender')) G.attachTooltip(l('casinoSurrender'), this.standProbabilities, 'this');
						if (l('casinoStand')) G.attachTooltip(l('casinoStand'), this.standProbabilities, 'this');
					}
				},

				buildTable: function () {
					this.getHandValue(M.hands.dealer);
					this.getHandValue(M.hands.player[M.currentPlayerHand]);

					let str = '<table id="casinoBJTable">';
					str += `<tr><td>${loc("Dealer's hand:")}${G.Has('Math lessons') ? '<br/>' + loc('Score: ') + M.hands.dealer.value : ''}</td>`;
					for (let i = 0; i < M.hands.dealer.cards.length; i++) str += `<td><div class="casinoBJCardImage" style="background-image:url(${M.cardsImage}); background-position:${M.cardImage(M.hands.dealer.cards[i])};" /></td>`;
					str += '</tr>';
					str += '<tr style="height:75px;"><td></td></tr>';
					str += `<tr><td>${loc("Player's hand")}${M.hands.player.length > 1 ? `(${M.currentPlayerHand + 1}${loc(' of ')}${M.hands.player.length})` : ''}:${G.Has('Math lessons') ? '<br/>' + loc('Score: ') + M.hands.player[M.currentPlayerHand].value : ''}</td>`;
					for (let i = 0; i < M.hands.player[M.currentPlayerHand].cards.length; i++) str += `<td><div class="casinoBJCardImage" style="background-image:url(${M.cardsImage}); background-position:${M.cardImage(M.hands.player[M.currentPlayerHand].cards[i])};" /></td>`;
					str += '</tr>';
					str += '</table>';

					M.gameL.innerHTML = str;

					let cardCount = 0;
					for (let i = 0; i < M.Deck.length; i++) {
						if (M.Deck[i].value >= 2 && M.Deck[i].value <= 6) cardCount--;
						else if (M.Deck[i].value == 1 || M.Deck[i].value >= 10) cardCount++;
					}
					if (this.hiddenCard && M.hands.dealer.cards[1] && M.hands.dealer.cards[1].value == 0) {
						if (this.hiddenCard.value >= 2 && this.hiddenCard.value <= 6) cardCount--;
						else if (this.hiddenCard.value == 1 || this.hiddenCard.value >= 10) cardCount++;
					}
					M.infoL.innerHTML = `${loc('Hands won : ')}${Beautify(this.wins)} (${loc('total : ')}${Beautify(this.winsT)})` + (G.Has('Counting cards') ? `<br/>${loc('Cards left in deck : ')}${M.Deck.length}<br/>${loc('Count : ')}${cardCount}` : '');
				},

				logic: function () {
					//run each frame
					if (this.phase == this.phases.inactive) {
						if (M.bankPercentage == true) {
							M.betAmount = G.cookies * (M.betChoice / 1000);
						} else {
							if (M.betMode == 1) {
								M.betAmount = Math.min(G.cookies * 0.1, G.cookiesPsRawHighest * M.betChoice);
							} else if (M.betMode == 2) {
								M.betAmount = Math.min(G.cookies * 0.1, G.cookiesPsRawHighest * M.betChoice * 60);
							} else if (M.betMode == 3) {
								M.betAmount = Math.min(G.cookies * 0.1, G.cookiesPsRawHighest * M.betChoice * 60 * 60);
							} else if (M.betMode == 4) {
								M.betAmount = Math.min(G.cookies * 0.1, G.cookiesPsRawHighest * M.betChoice * 60 * 60 * 24);
							} else if (M.betMode == 5) {
								M.betAmount = Math.min(G.cookies * 0.1, G.cookiesPsRawHighest * M.betChoice * 60 * 60 * 24 * 30);
							} else if (M.betMode == 6) {
								M.betAmount = Math.min(G.cookies * 0.1, G.cookiesPsRawHighest * M.betChoice * 60 * 60 * 24 * 365.259636 * 10);
							}
						}
					}

					if (Date.now() > M.nextBeat) {
						M.nextBeat = Date.now() + M.beatLength;
						let outcome: string | number = 0;

						if (this.phase == this.phases.inactive) {
							//nothing
						} else if (this.phase == this.phases.deal) {
							if (this.istep == 0) {
								if (M.Deck.length < M.minDecks * 52) M.reshuffle();
								M.hands = {dealer: {value: 0, cards: []}, player: [{value: 0, splitFirstTurn: true, cards: []}]};
								M.currentPlayerHand = 0;
								G.Spend(M.betAmount);

								this.hit(M.hands.player[0], true);
								this.istep = 1;
							} else if (this.istep == 1) {
								this.hit(M.hands.dealer, false);
								this.istep = 2;
							} else if (this.istep == 2) {
								this.hit(M.hands.player[0], true);
								this.istep = 3;
							} else if (this.istep == 3) {
								this.hit(M.hands.dealer, false);

								this.hiddenCard = M.hands.dealer.cards[1];
								M.hands.dealer.cards[1] = M.cards[0];

								this.phase = this.phases.firstTurn;
								if (M.games.Blackjack.splits) {
									//nothing
								} else if (M.hands.player[0].value == 21) {
									M.hands.dealer.cards[1] = this.hiddenCard;
									outcome = 'playerblackjack';
									this.phase = this.phases.inactive;
								} else if (Math.random() < this.instantWinChance()) {
									M.hands.dealer.cards[1] = this.hiddenCard;

									M.hands.player[0].cards[0] = {pip: choose([10, 11, 12, 13]), value: 10, suit: choose([0, 1, 2, 3])};
									M.hands.player[0].cards[1] = {pip: 1, value: 1, suit: choose([0, 1, 2, 3])};

									outcome = 'instantWin';
									this.phase = this.phases.inactive;
								} else if (M.hands.dealer.value == 21) {
									M.hands.dealer.cards[1] = this.hiddenCard;
									outcome = 'dealerblackjack';
									this.phase = this.phases.inactive;
								}
							}

							this.buildTable();
							this.buildSidebar();
							M.hands.player[M.currentPlayerHand].splitFirstTurn = false;
						} else if (this.phase == this.phases.playerTurn || this.phase == this.phases.firstTurn) {
							//waiting for the player
						} else if (this.phase == this.phases.dealerTurn) {
							if (M.hands.dealer.value < 17) {
								this.hit(M.hands.dealer, false);
							}
							if (M.hands.dealer.value >= 17) {
								M.currentPlayerHand = 0;
								this.phase = this.phases.evaluate;
							}

							this.buildTable();
							this.buildSidebar();
						} else if (this.phase == this.phases.evaluate) {
							let playerHand = M.currentPlayerHand;
							M.hands.dealer.cards[1] = this.hiddenCard;
							this.buildTable();

							if (M.hands.player[playerHand].value > 21) outcome = 'bust';
							else if (M.hands.dealer.value > 21) {
								outcome = 'dealerbust';
							} else if (M.hands.dealer.value < M.hands.player[playerHand].value) {
								outcome = 'win';
							} else if (M.hands.dealer.value > M.hands.player[playerHand].value) outcome = 'lose';
							else if (M.hands.dealer.value == M.hands.player[playerHand].value) {
								outcome = 'push';
							}

							playerHand++;
							if (playerHand < M.hands.player.length) {
								M.currentPlayerHand = playerHand;
								this.phase = this.phases.evaluate;
							} else {
								this.phase = this.phases.inactive;
							}

							this.buildTable();
							this.buildSidebar();
						} else if (this.phase == this.phases.surrender) {
							let playerHand = M.currentPlayerHand;
							M.hands.dealer.cards[1] = this.hiddenCard;
							this.buildTable();
							outcome = 'surrender';
							playerHand++;
							if (playerHand < M.hands.player.length) {
								M.currentPlayerHand = playerHand;
								this.phase = this.phases.evaluate;
							} else {
								this.phase = this.phases.inactive;
							}
							this.buildTable();
							this.buildSidebar();
						}

						this.getHandValue(M.hands.dealer);
						this.getHandValue(M.hands.player[M.currentPlayerHand]);

						if (outcome) {
							let messg = '';
							let winnings = M.betAmount;

							switch (outcome) {
								case 'instantWin':
									winnings *= 2.5;
									messg = loc('You make your own luck!');
									this.ownLuckWins++;

									if (this.ownLuckWins >= 13) G.Win('Ace up your sleeve');
									if (G.Has('I make my own luck') && this.ownLuckWins >= 52) G.Unlock('Infinite Improbability Drive');
									if (this.ownLuckWins >= 13 * 13) G.Win('Paid off the dealer');
									if (this.ownLuckWins >= 666) G.Win('Deal with the Devil');
									break;

								case 'playerblackjack':
									winnings *= 2.5;
									messg = loc('Blackjack!');
									G.Unlock('I make my own luck');
									G.Win('Blackjack!');
									break;

								case 'dealerblackjack':
									winnings *= 0;
									messg = loc('Dealer blackjack');
									break;

								case 'bust':
									winnings *= 0;
									messg = loc('Over 21!');
									break;

								case 'dealerbust':
									winnings *= 2;
									messg = loc('Dealer went over 21!');
									break;

								case 'win':
									winnings *= 2;
									messg = loc('You win!');
									break;

								case 'lose':
									winnings *= 0;
									messg = loc('You lose');
									break;

								case 'surrender':
									winnings *= 0.5;
									messg = loc('You lose half your bet');
									break;

								case 'push':
									if (G.Has('Tiebreaker')) {
										winnings *= 2;
										messg = loc('Tie goes to player!');
										if (!G.Has('Standard push')) {
											G.Unlock('Standard push');
										}
									} else if (G.Has('Standard push')) {
										messg = loc('True push - nobody wins!');
										this.tiesLost++;
										if (this.tiesLost >= 7) G.Unlock('Tiebreaker');
									} else {
										winnings *= 0;
										messg = loc('Tie goes to dealer');
										this.tiesLost++;
										if (this.tiesLost >= 3) G.Unlock('Standard push');
									}

									break;

								default:
									break;
							}

							if (M.games.Blackjack.splits) {
								M.games.Blackjack.splits--;
							}
							messg += '<div style="font-size:65%;">';
							G.Earn(winnings);
							if (winnings >= M.betAmount) {
								this.wins++;
								this.winsT++;
								messg += `${loc('Gain ')}${Beautify(Math.abs(winnings - M.betAmount))} ${loc('cookies!')}`;

								if (M.bankPercentage == false) {
									if (this.winsT >= 7) G.Unlock('Raise the stakes');
									if (G.Has('Raise the stakes') && this.winsT >= 49) G.Unlock('High roller!');
									if (G.Has('High roller!') && this.winsT >= 77) G.Unlock('Big spender!');
									if (G.Has('Big spender!') && this.winsT >= 108) G.Unlock('Main player');
									if (G.Has('Main player') && this.winsT >= 150) G.Unlock('True gambler');
								}
								if (this.winsT >= 21) G.Win('Card minnow');
								if (this.winsT >= 210) G.Win('Card trout');
								if (this.winsT >= 2100) G.Win('Card shark');

								if (M.hands.player[M.currentPlayerHand].cards.length >= 5) G.Win('Five card stud');
								if (M.hands.player[M.currentPlayerHand].cards.length >= 6) G.Win("Why can't I hold all these cards?");
								if (M.hands.player[M.currentPlayerHand].value <= 5) G.Win('I also like to live dangerously');
							} else {
								this.losses++;
								messg += `${loc('Lost ')}${Beautify(Math.abs(M.betAmount) - winnings)} ${loc('cookies')}`;
								if (this.losses >= 21) G.Unlock('Surrender');
							}
							messg += '</div>';

							this.netTotal += winnings - M.betAmount;
							G.Popup(messg, G.mouseX, G.mouseY);

							this.buildTable();
							this.buildSidebar();
						}
					}
				},

				draw: function () {
					//run each draw frame
					l('casinoCurrentBet').innerHTML = `(${Beautify(M.betAmount)} ${loc('cookies')})`;
				},
			};

			//***********************************
			//    UI
			//***********************************
			let str = '';
			str += `<style>
			#casinoBG{background:url(img/shadedBorders.png), url(img/BGcasino.jpg); background-size:100% 100%, auto; position:absolute; left:0px; right:0px; top:0px; bottom:16px;}
			#casinoContent{position:relative; box-sizing:border-box; padding:4px 24px; height:450px;}
			#casinoSidebar{text-align:center; margin:0px; padding:0px; position:absolute; left:4px; top:4px; bottom:4px; right:65%; overflow-y:auto; overflow-x:hidden; box-shadow:8px 0px 8px rgba(0,0,0,0.5);}
			#casinoSidebar .listing{text-align:left;}
			#casinoTable{text-align:center; position:absolute; right:0px; top:0px; bottom:0px; overflow-x:auto; overflow:hidden;}
			.casinoBJCardImage{position: relative; width: 79px; height: 123px; left: 0px; top: 0px; overflow: visible;}
			.casinoSpacer{position: relative; width: 79px; height: 123px; left: 0px; top: 0px; overflow: visible;}
			#casinoBJTable td{text-align:center; vertical-align: middle; width:90px;}
			#casinoBJTable tr{height:150px}
			#casinoBJTable{margin-left:auto; margin-right:auto;}
			.casinoSidebarLabel{font-size:12px;width:100%;padding:2px;margin-top:4px;margin-bottom:-4px;}
			.casinoActionsTable tr{height: 40px;}
			#casinoGame{position: relative;}
			#casinoInfo{position: relative;text-align:center; font-size:11px; margin-top:12px; color:rgba(255,255,255,0.75); text-shadow:-1px 1px 0px #000;}
			</style>`;
			str += '<div id="casinoBG"></div>';
			str += '<div id="casinoContent">';
			str += '<div id="casinoSidebar" class="framed">';
			str += `<div class="title casinoSidebarLabel">${loc('Cash')}</div><div class="line"></div>`;
			str += '<div id="casinoMoney"></div>';
			str += `<div class="title casinoSidebarLabel">${loc('Actions')}</div><div class="line"></div>`;
			str += '<div id="casinoActions"></div>';
			str += '</div>';
			str += '<div id="casinoTable">';
			str += '<div id="casinoGame"></div>';
			str += '<div id="casinoInfo">Hello World!</div>';
			str += '</div>';
			str += '</div>';
			M.div.innerHTML = str;

			M.sidebarL = l('casinoSidebar');
			M.moneyL = l('casinoMoney');
			M.actionsL = l('casinoActions');
			M.tableL = l('casinoTable');
			M.gameL = l('casinoGame');
			M.infoL = l('casinoInfo');

			M.reset();

			M.buildSidebar();
			M.buildTable();

			M.loadedCount++;
			if (G.prefs.popups) G.Popup(loc('Casino loaded!'));
			else G.Notify(loc('Casino loaded!'), '', '', 1, 1);
		};

		//Called by the engine's save system (the string lands in the
		//Chancemaker's minigame save slot); see the file header for the
		//CCSE difference.
		M.save = function () {
			//output cannot use ",", ";" or "|"

			const getMinigameStateSave = function () {
				let res = '';
				res += parseInt(M.parent.onMinigame ? '1' : '0');
				res += '_' + parseInt(M.games.Blackjack.wins);
				res += '_' + parseInt(M.games.Blackjack.winsT);
				res += '_' + parseInt(M.games.Blackjack.ownLuckWins);
				res += '_' + parseInt(M.games.Blackjack.tiesLost);
				res += '_' + parseInt(M.betMode);
				res += '_' + parseInt(M.betChoice);
				res += '_' + parseFloat(M.games.Blackjack.netTotal);
				res += '_' + parseInt(0);
				res += '_' + parseInt(M.beatLength);
				res += '_' + Number(M.bankPercentage);
				return res;
			};

			const getGameStateSave = function () {
				let res = '';
				res += parseInt(M.currentPlayerHand);
				res += '_' + parseInt(M.nextBeat);
				res += '_' + parseInt(M.games.Blackjack.phase);
				res += '_' + parseInt(M.games.Blackjack.istep);
				res += '_' + parseFloat(M.betAmount);
				res += '_' + parseInt(M.games.Blackjack.hiddenCard.pip + 13 * M.games.Blackjack.hiddenCard.suit);
				return res;
			};

			const getCardSave = function (deck: any[]) {
				let res = '';
				for (let i = 0; i < deck.length; i++) res += (res.length ? '-' : '') + (deck[i].pip + 13 * deck[i].suit);
				return res;
			};

			const getPlayerHandsSave = function () {
				let res = '';
				for (let i = 0; i < M.hands.player.length; i++) res += (res.length ? '_' : '') + getCardSave(M.hands.player[i].cards);
				return res;
			};

			const getAchievementSave = function () {
				let res = '';
				for (let i = 0; i < M.Achievements.length; i++) res += Math.min(M.Achievements[i].won);
				return res;
			};

			const getUpgradeSave = function () {
				let res = '';
				for (const i in M.Upgrades) {
					const me = M.Upgrades[i];
					res += Math.min(me.unlocked, 1) + '' + Math.min(me.bought, 1);
				}
				return res;
			};

			let res = getMinigameStateSave();
			res += ' ' + getGameStateSave();
			res += ' ' + getCardSave(M.hands.dealer.cards);
			res += ' ' + getPlayerHandsSave();
			res += ' ' + getCardSave(M.Deck);
			res += ' ' + getAchievementSave();
			res += ' ' + getUpgradeSave();

			M.saveString = res;
			return res;
		};

		M.load = function (str: string) {
			//interpret str; called by the engine after .launch/.reset
			if (!str) return false;
			M.saveString = str;

			const parseMinigameStateSave = function (str: string) {
				let i = 0;
				const spl = str.split('_');
				const on = parseInt(spl[i++] || 0);
				M.games.Blackjack.wins = parseInt(spl[i++] || 0);
				M.games.Blackjack.winsT = parseInt(spl[i++] || 0);
				M.games.Blackjack.ownLuckWins = parseInt(spl[i++] || 0);
				M.games.Blackjack.tiesLost = parseInt(spl[i++] || 0);
				M.betMode = parseInt(spl[i++] || 0);
				M.betChoice = parseInt(spl[i++] || 0);
				M.games.Blackjack.netTotal = parseFloat(spl[i++] || 0);
				i++; //legacy dummy field
				M.beatLength = parseInt(spl[i++] || 750);
				M.bankPercentage = Number(spl[i++] || true);

				if (on && G.ascensionMode != 1) M.parent.switchMinigame(1);
			};

			const parseGameStateSave = function (str: string) {
				let i = 0;
				const spl = str.split('_');
				M.currentPlayerHand = parseInt(spl[i++] || 0);
				M.nextBeat = parseInt(spl[i++] || 0);
				M.games.Blackjack.phase = parseInt(spl[i++] || 0);
				M.games.Blackjack.istep = parseInt(spl[i++] || 0);
				M.betAmount = parseFloat(spl[i++] || 0);
				M.games.Blackjack.hiddenCard = M.cards[parseInt(spl[i++] || 0)];
			};

			const parseCardSave = function (str: string) {
				const res: any[] = [];
				if (str) {
					const arr = str.split('-');
					for (let i = 0; i < arr.length; i++) {
						res.push(M.cards[arr[i]]);
					}
				}
				return res;
			};

			const parsePlayerHandsSave = function (str: string) {
				M.hands.player = [];
				if (str) {
					const hands = str.split('_');
					for (let i = 0; i < hands.length; i++) {
						M.hands.player.push({cards: parseCardSave(hands[i])});
						M.games.Blackjack.getHandValue(M.hands.player[i]);
					}
				} else {
					M.hands.player = [{value: 0, cards: []}];
				}
			};

			const parseAchievementSave = function (str: string) {
				const spl = str.split('');
				for (const i in M.Achievements) {
					const me = M.Achievements[i];
					const idx = Number(i);
					if (spl[idx]) {
						const mestr = [spl[idx]];
						me.won = parseInt(mestr[0]);
					} else {
						me.won = 0;
					}
					if (me.won && G.CountsAsAchievementOwned(me.pool)) G.AchievementsOwned++;
				}
			};

			const parseUpgradeSave = function (str: string) {
				const spl = str.split('');
				for (const i in M.Upgrades) {
					const me = M.Upgrades[i];
					const idx = Number(i);
					if (spl[idx * 2]) {
						const mestr = [spl[idx * 2], spl[idx * 2 + 1]];
						me.unlocked = parseInt(mestr[0]);
						me.bought = parseInt(mestr[1]);
						if (me.bought && G.CountsAsUpgradeOwned(me.pool)) G.UpgradesOwned++;
					} else {
						me.unlocked = 0;
						me.bought = 0;
					}
				}
			};

			let i = 0;
			const spl = str.split(' ');
			parseMinigameStateSave(spl[i++] || '');
			parseGameStateSave(spl[i++] || '');
			M.hands.dealer = {cards: parseCardSave(spl[i++] || '')};
			parsePlayerHandsSave(spl[i++] || '');
			M.Deck = parseCardSave(spl[i++] || '');
			parseAchievementSave(spl[i++] || '');
			parseUpgradeSave(spl[i++] || '');

			M.games.Blackjack.getHandValue(M.hands.dealer);
			if (M.Deck.length < M.minDecks * 52) M.reshuffle();
			if (M.games.Blackjack.phase == M.games.Blackjack.phases.inactive) {
				M.hands = {dealer: {value: 0, cards: []}, player: [{value: 0, splitFirstTurn: false, cards: []}]};
				M.currentPlayerHand = 0;
			}

			M.games.Blackjack.buildSidebar();
			M.games.Blackjack.buildTable();
		};

		M.reset = function (hard?: boolean) {
			//Game.Reset() (reincarnate — the non-hard path) calls reset() on
			//every attached minigame, including before launch() has ever run
			//(fresh profile, Chancemaker below level 1). M.games only exists
			//after launch(), so skip until then — there is no state to reset.
			if (!M.games) return;
			M.deckCount = 4;
			M.Deck = [];
			M.hands = {dealer: {value: 0, cards: []}, player: [{value: 0, splitFirstTurn: false, cards: []}]};
			M.games.Blackjack.hiddenCard = M.cards[0];
			M.currentPlayerHand = 0;
			M.minDecks = 2;
			M.betAmount = 0;
			M.betChoice = 1;
			M.betMode = 1;
			M.games.Blackjack.wins = 0;
			M.games.Blackjack.losses = 0;
			M.games.Blackjack.ownLuckWins = 0;
			M.games.Blackjack.tiesLost = 0;
			M.games.Blackjack.phase = 0;
			M.games.Blackjack.istep = 0;
			M.nextBeat = Date.now();
			M.bankPercentage = true;

			M.setPercentagePrecision(1);

			if (hard) {
				M.saveString = '';
			}

			M.reshuffle();

			M.buildSidebar();
			M.buildTable();

			window.setTimeout(function () {
				M.onResize();
			}, 10);
		};

		M.logic = function () {
			//run each frame
			if (M.games.choice == 0) M.games.Blackjack.logic();
		};

		M.onResize = function () {
			//The engine dispatches Game.resize (and thus this) from the moment
			//init() attaches M to the building, i.e. before the minigame script
			//loads and launch() builds the UI. Skip until then.
			if (!M.loadedCount) return;
			const el = l('casinoContent') as HTMLElement;
			if (!el) return;
			const width = el.offsetWidth;
			const sidebarW = width * 0.2 - 8;
			const tableW = width * 0.8 - 8;
			M.sidebarL.style.width = sidebarW + 'px';
			M.tableL.style.width = tableW + 'px';
		};

		M.draw = function () {
			//run each draw frame
			if (M.games.choice == 0) M.games.Blackjack.draw();

			l('casinoCurrentBet').innerHTML = `(${Beautify(M.betAmount)} ${loc('cookies')})`;
		};

		M.Toggle = function (prefName: string, button: string, on: string, off: string, invert: number) {
			if (M[prefName]) {
				l(button).innerHTML = off;
				M.bankPercentage = false;
			} else {
				l(button).innerHTML = on;
				M.bankPercentage = true;
			}
			l(button).className = 'smallFancyButton prefButton option' + ((M[prefName] ^ invert) ? '' : ' off');
			M.save();
			//M.init(M.div);
			M.buildSidebar();
		};

		//***********************************
		//    Upgrades
		//***********************************
		M.Upgrades = [];

		const addUpgrade = function (name: string, desc: string, price: number) {
			const up = new G.Upgrade(name, desc, price, ICON);
			M.Upgrades.push(up);
			return up;
		};

		addUpgrade('Raise the stakes', loc("Can bet a minute of CPS at a time.<q>Now we're getting somewhere!</q>"), 10);
		addUpgrade('High roller!', loc("Can bet an hour of CPS at a time.<q>If you have to ask, you can't afford it.</q>"), 60);
		addUpgrade('Big spender!', loc("Can bet a day of CPS at a time.<q>Now you're getting serious.</q>"), 90);
		addUpgrade('Main player', loc("Can bet a month of CPS at a time.<q>Don't even think about it.</q>"), 120);
		addUpgrade('True gambler', loc("Can bet a decade of CPS at a time.<q>Putting your life savings on the line.</q>"), 180);

		addUpgrade('Math lessons', loc("Show the value of your current blackjack hand.<q>C'mon, it's not that hard.</q>"), 1);
		addUpgrade('Counting cards', loc('Keeps track of which cards have been played. 2-6 increase the count by 1. 10-K and Aces decrease the count by 1. Higher counts give better odds.<q>Technically not cheating, but casinos frown on this sort of thing.</q>'), 21);
		addUpgrade('Standard push', loc("A true tie - nobody wins.<q>Well, it's better than losing to the dealer.</q>"), 8);
		addUpgrade('Tiebreaker', loc("Ties push to the player.<q>Look at me. I'm the dealer now.</q>"), 15);
		addUpgrade('Double down', loc("Doubling down after splits is permitted.<q>Time to make some real money!</q>"), 18);
		addUpgrade('Surrender', loc("Surrendering allows half your bet to be returned to you.<q>It's better than losing everyting!</q>"), 35);
		addUpgrade('I make my own luck', loc('Each Chancemaker gives a <b>0.0<span></span>2%</b> chance to instantly win the hand.<q>Wait, that\'s illegal.</q>'), 60);
		addUpgrade('Infinite Improbability Drive', loc('Chancemaker chance to instantly win the hand is <b>doubled</b>.<q>You stole a protoype spaceship just to cheat at cards?</q>'), 250);

		addUpgrade('Double or nothing', loc('Multiply your bet by <b>2</b>.<q>The Martingale System sounds good on paper, but one losing streak long enough will bankrupt anyone.</q>'), 120);
		addUpgrade('Stoned cows', loc('Multiply your bet by <b>5</b>.<q>The steaks have never been higher!</q>'), 300);
		addUpgrade('Game for Pros', loc('Multiply your bet by <b>20</b>.<q>Much skill is required here.</q>'), 600);

		const oddsUp = new G.Upgrade('Actually, do tell me the odds', loc('Display the probabilities of various outcomes of taking an action in the Casino.<q>2 + 2 is 4 minus 1 that\'s 3 quick maffs.</q>'), 21000000, ICON);
		G.PrestigeUpgrades.push(oddsUp);
		oddsUp.pool = 'prestige';
		oddsUp.posX = 38;
		oddsUp.posY = -188;
		oddsUp.parents = [];
		oddsUp.showIf = function () {
			return G.HasAchiev('Card shark');
		};
		M.Upgrades.push(oddsUp);

		for (let i = 0; i < M.Upgrades.length; i++) {
			M.Upgrades[i].order = 1000000 + i / 100;
			if (M.Upgrades[i].pool != 'prestige') M.Upgrades[i].priceFunc = function () {
				return this.basePrice * G.cookiesPsRawHighest * 60;
			};
		}
		G.Upgrades['Double or nothing'].order = G.Upgrades['True gambler'].order + 0.001;
		G.Upgrades['Stoned cows'].order = G.Upgrades['Double or nothing'].order + 0.001;
		G.Upgrades['Game for Pros'].order = G.Upgrades['Stoned cows'].order + 0.001;

		//***********************************
		//    Achievements
		//***********************************
		M.Achievements = [];
		const addAchievement = function (name: string, desc: string) {
			const a = new G.Achievement(name, desc, ICON);
			M.Achievements.push(a);
			return a;
		};

		addAchievement('Card minnow', loc('Win <b>21</b> hands of blackjack.'));
		addAchievement('Card trout', loc('Win <b>210</b> hands of blackjack.'));
		addAchievement('Card shark', loc('Win <b>2100</b> hands of blackjack.'));
		addAchievement('Five card stud', loc('Win a hand of blackjack with <b>5</b> cards in your hand.<q>Wait, what game are you playing again?</q>'));
		addAchievement("Why can't I hold all these cards?", loc('Win a hand of blackjack with <b>6</b> cards in your hand.'));
		const sleeve = addAchievement('Ace up your sleeve', loc('Win <b>13</b> hands of blackjack through chancemaker intervention in one ascension.<q>I\'ll tell you what the odds are.</q>'));
		sleeve.pool = 'shadow';
		const paid = addAchievement('Paid off the dealer', loc(`Win <b>${13 * 13}</b> hands of blackjack through chancemaker intervention in one ascension.<q>Takes money to make money.</q>`));
		paid.pool = 'shadow';
		const devil = addAchievement('Deal with the Devil', loc('Win <b>666</b> hands of blackjack through chancemaker intervention in one ascension.<q>Just sign right here.</q>'));
		devil.pool = 'shadow';
		addAchievement('Blackjack!', loc('Be dealt a hand totaling 21 naturally.'));
		addAchievement('I like to live dangerously', loc('Hit on <b>17</b> or above without going over <b>21</b>.'));
		const alsoDangerous = addAchievement('I also like to live dangerously', loc('Win with a hand of <b>5</b> or less.<q>Yeah baby!</q>'));
		alsoDangerous.pool = 'shadow';

		for (let i = 0; i < M.Achievements.length; i++) M.Achievements[i].order = 1000000 + i / 100;

		//***********************************
		//    Mod menus
		//***********************************
		G.customOptionsMenu.push(function () {
			const onText = loc('Bank Percentage ON');
			const offText = loc('Bank Percentage OFF');
			let str = '<div class="listing">' +
				toggleButtonHTML('bankPercentage', 'Casino_bankPercentageButton', onText, offText, `Game.Objects['Chancemaker'].minigame.Toggle`, 0) +
				`<label>${loc('Calculate all bets as a percentage of the current bank.')}</label></div>`;
			const callback = `Game.Objects['Chancemaker'].minigame.beatLength = Math.round(l('beatLengthSlider').value); l('beatLengthSliderRightText').innerHTML = Game.Objects['Chancemaker'].minigame.beatLength;`;
			str += '<div class="listing">' +
				sliderHTML('beatLengthSlider', loc('Beat Length'), '[$]', () => M.beatLength, callback, 0, 1000, 10) +
				` ${loc('This is the time in milliseconds between each card deal.')}</div>`;

			appendCollapsibleOptionsMenu(M.name, str);
		});

		G.customStatsMenu.push(function () {
			appendStatsVersionNumber(M.name, M.version);
			if (M.loadedCount) {
				if (M.games.Blackjack.netTotal) appendStatsGeneral(`<div class="listing"><b>${loc('Blackjack has earned you :')}</b> <div class="price plain">${G.tinyCookie()}${Beautify(M.games.Blackjack.netTotal)}</div></div>`);
				if (M.games.Blackjack.ownLuckWins) appendStatsSpecial(`<div class="listing"><b>${loc('Made your own luck :')}</b> ${M.games.Blackjack.ownLuckWins} ${loc('times')}</div>`);
			}
		});

		//***********************************
		//    Check hook
		//***********************************
		G.registerHook('check', function () {
			if (M.loadedCount) {
				if (M.games.Blackjack.winsT >= 7) G.Unlock('Raise the stakes');
				if (G.Has('Raise the stakes') && M.games.Blackjack.winsT >= 49) G.Unlock('High roller!');
				if (G.Has('High roller!') && G.cookies >= 4 * G.cookiesPs * 60 * 60) G.Unlock('Double or nothing');
				if (G.Has('Double or nothing') && G.cookies >= 10 * G.cookiesPs * 60 * 60) G.Unlock('Stoned cows');
				if (G.Has('Stoned cows') && G.cookies >= 30 * G.cookiesPs * 60 * 60) G.Unlock('Game for Pros');

				if (G.Has('I make my own luck') && M.games.Blackjack.ownLuckWins >= 52) G.Unlock('Infinite Improbability Drive');
				if (M.games.Blackjack.tiesLost >= 3) G.Unlock('Standard push');
				if (M.games.Blackjack.tiesLost >= 7) G.Unlock('Tiebreaker');
				if (M.games.Blackjack.doubleDown >= 7) G.Unlock('Double down');

				if (M.games.Blackjack.winsT >= 21) G.Win('Card minnow');
				if (M.games.Blackjack.winsT >= 210) G.Win('Card trout');
				if (M.games.Blackjack.winsT >= 2100) G.Win('Card shark');
				if (M.games.Blackjack.ownLuckWins >= 13) G.Win('Ace up your sleeve');
				if (M.games.Blackjack.ownLuckWins >= 13 * 13) G.Win('Paid off the dealer');
				if (M.games.Blackjack.ownLuckWins >= 666) G.Win('Deal with the Devil');

				if (M.games.choice == 0) M.games.Blackjack.buildSidebar();
			}
		});

		window.Casino = M;
		G.LoadMinigames();
	}

	function register() {
		const G = window.Game;
		if (!G || typeof G.registerMod !== 'function') return false;
		G.registerMod(NAME, {
			name: DISPLAY,
			version: VERSION,
			init: init,
			//The casino state lives in the Chancemaker's vanilla minigame
			//save slot (see file header), so the mod API save section
			//intentionally stays empty.
		}, true);
		return true;
	}

	if (!register()) {
		const t = window.setInterval(function () {
			if (register()) window.clearInterval(t);
		}, 25);
		window.addEventListener('load', function () {
			window.clearInterval(t);
		}, {once: true});
	}
})();
export {};
