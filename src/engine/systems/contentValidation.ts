/**
 * systems/contentValidation.ts — typed development checks for content data.
 *
 * These helpers inspect the live engine registries without changing save data,
 * prices, unlocks, or CpS rules. They make content mistakes visible while new
 * buildings and upgrades are being added, and provide a compact economy
 * snapshot for balancing work.
 */
import type {
	Building,
	ContentValidationIssue,
	ContentValidationReport,
	EconomyBuildingReport,
	EconomyReport,
	EconomySimulationPoint,
	EconomyAnalysisOptions,
	EconomyStrategyName,
	EconomyStrategyOptions,
	EconomyStrategyReport,
	EconomyStrategySample,
	EconomyMilestoneReport,
	EconomyBuildingBalanceMilestone,
	EconomyBuildingBalanceReport,
	EconomyUpgradeCategory,
	EconomyUpgradeReport,
	FullEconomyReport,
	Game,
	Upgrade,
} from '../types';

function issue(
	severity: ContentValidationIssue['severity'],
	code: string,
	message: string,
	item?: string,
): ContentValidationIssue {
	return { severity, code, message, item };
}

function effectiveStoreOrder(building: Building): number {
	return typeof building.storeOrder === 'number' ? building.storeOrder : building.id;
}

function validateIcon(upgrade: Upgrade, issues: ContentValidationIssue[]): void {
	if (!Array.isArray(upgrade.icon)) return;
	if (upgrade.icon.length < 2 || typeof upgrade.icon[0] !== 'number' || typeof upgrade.icon[1] !== 'number') {
		issues.push(issue('error', 'invalid-icon', 'Upgrade icon must contain numeric column and row coordinates.', upgrade.name));
		return;
	}
	if (upgrade.icon.length >= 3 && typeof upgrade.icon[2] !== 'string') {
		issues.push(issue('error', 'invalid-icon-source', 'Custom upgrade icon source must be a sprite path string.', upgrade.name));
	}
}

/** Validate registered building, upgrade, tier, and store relationships. */
export function ValidateContent(game: Game): ContentValidationReport {
	const issues: ContentValidationIssue[] = [];
	const buildings = Object.values(game.Objects) as Building[];
	const upgrades = Object.values(game.Upgrades) as Upgrade[];
	const buildingIds = new Map<number, string>();
	const upgradeIds = new Map<number, string>();
	const storeOrders = new Map<number, string>();

	for (const building of buildings) {
		if (buildingIds.has(building.id)) {
			issues.push(issue('error', 'duplicate-building-id', `Building id ${building.id} is already used by ${buildingIds.get(building.id)}.`, building.name));
		} else {
			buildingIds.set(building.id, building.name);
		}
		if (game.ObjectsById[building.id] !== building) {
			issues.push(issue('error', 'building-index-mismatch', 'Building is not reachable at ObjectsById[id].', building.name));
		}
		if (game.Objects[building.name] !== building) {
			issues.push(issue('error', 'building-registry-mismatch', 'Building name map does not point to the registered instance.', building.name));
		}
		const order = effectiveStoreOrder(building);
		if (storeOrders.has(order)) {
			issues.push(issue('error', 'duplicate-store-order', `Store order ${order} is already used by ${storeOrders.get(order)}.`, building.name));
		} else {
			storeOrders.set(order, building.name);
		}
		for (const tierKey of Object.keys(building.tieredUpgrades || {})) {
			const upgrade = building.tieredUpgrades[tierKey];
			if (!game.Tiers[tierKey]) {
				issues.push(issue('error', 'missing-tier', `Tier ${tierKey} is not defined in Game.Tiers.`, `${building.name}:${tierKey}`));
			}
			if (upgrade && upgrade.buildingTie !== building) {
				issues.push(issue('error', 'tier-building-mismatch', 'Tiered upgrade is registered to a different building.', upgrade.name));
			}
		}
		for (const tierKey of Object.keys(building.tieredAchievs || {})) {
			const achievement = building.tieredAchievs[tierKey];
			if (!game.Tiers[tierKey]) {
				issues.push(issue('error', 'missing-achievement-tier', `Achievement tier ${tierKey} is not defined in Game.Tiers.`, `${building.name}:${tierKey}`));
			}
			if (achievement && achievement.buildingTie !== building) {
				issues.push(issue('error', 'achievement-building-mismatch', 'Tiered achievement is registered to a different building.', achievement.name));
			}
		}
	}

	for (const upgrade of upgrades) {
		if (upgradeIds.has(upgrade.id)) {
			issues.push(issue('error', 'duplicate-upgrade-id', `Upgrade id ${upgrade.id} is already used by ${upgradeIds.get(upgrade.id)}.`, upgrade.name));
		} else {
			upgradeIds.set(upgrade.id, upgrade.name);
		}
		if (game.UpgradesById[upgrade.id] !== upgrade) {
			issues.push(issue('error', 'upgrade-index-mismatch', 'Upgrade is not reachable at UpgradesById[id].', upgrade.name));
		}
		validateIcon(upgrade, issues);
		if (upgrade.buildingTie && typeof upgrade.buildingTie !== 'number' && upgrade.tier && !game.Tiers[upgrade.tier]) {
			issues.push(issue('error', 'upgrade-missing-tier', `Upgrade references undefined tier ${upgrade.tier}.`, upgrade.name));
		}
	}

	for (const [tierKey, tier] of Object.entries(game.Tiers)) {
		if (!Number.isFinite(tier.unlock)) {
			issues.push(issue('error', 'invalid-tier-unlock', 'Tier unlock must be a finite number.', tierKey));
		}
	}

	const errors = issues.filter((entry) => entry.severity === 'error').length;
	return {
		valid: errors === 0,
		errors,
		warnings: issues.filter((entry) => entry.severity === 'warning').length,
		buildingCount: buildings.length,
		upgradeCount: upgrades.length,
		issues,
	};
}

function snapshotBuildings(game: Game): EconomyBuildingReport[] {
	return (Object.values(game.Objects) as Building[])
		.sort((a, b) => effectiveStoreOrder(a) - effectiveStoreOrder(b))
		.map((building): EconomyBuildingReport => ({
			name: building.name,
			storeOrder: effectiveStoreOrder(building),
			amount: building.amount,
			baseCps: typeof building.baseCps === 'number' ? building.baseCps : 0,
			cpsPerBuilding: building.storedCps,
			totalCps: building.storedTotalCps,
			share: game.cookiesPs > 0 ? building.storedTotalCps / game.cookiesPs : 0,
			nextPurchaseCost: 0,
			marginalCps: 0,
			paybackSeconds: Infinity,
		}));
}

/** Recalculate and return the current production snapshot for balancing. */
export function GetEconomyReport(game: Game): EconomyReport {
	game.CalculateGains();
	const buildings = snapshotBuildings(game);
	for (const report of buildings) {
		const building = game.Objects[report.name];
		report.nextPurchaseCost = building.getPrice();
		const originalAmount = building.amount;
		const originalTotalCps = building.storedTotalCps;
		building.amount = originalAmount + 1;
		game.CalculateGains();
		report.marginalCps = Math.max(0, building.storedTotalCps - originalTotalCps);
		building.amount = originalAmount;
		game.CalculateGains();
		report.paybackSeconds = report.marginalCps > 0 ? report.nextPurchaseCost / report.marginalCps : Infinity;
	}
	return {
		totalCps: game.cookiesPs,
		buildings,
	};
}

function withEconomySandbox<T>(game: Game, callback: (buildings: Building[], upgrades: Upgrade[]) => T): T {
	const buildings = Object.values(game.Objects) as Building[];
	const upgrades = Object.values(game.Upgrades) as Upgrade[];
	const originalBuildings = new Map(buildings.map((building) => [building.name, {
		amount: building.amount,
		bought: building.bought,
		unlocked: building.unlocked,
	}]));
	const originalUpgrades = new Map(upgrades.map((upgrade) => [upgrade.name, {
		bought: upgrade.bought,
		unlocked: upgrade.unlocked,
	}]));
	const achievements = Object.values(game.Achievements || {}) as any[];
	const originalAchievements = new Map(achievements.map((achievement) => [achievement.name, achievement.won]));
	const originalState = {
		cookies: game.cookies,
		cookiesEarned: game.cookiesEarned,
		buildingsOwned: game.BuildingsOwned,
		upgradesOwned: game.UpgradesOwned,
	};
	try {
		return callback(buildings, upgrades);
	} finally {
		for (const building of buildings) {
			const state = originalBuildings.get(building.name);
			if (!state) continue;
			building.amount = state.amount;
			building.bought = state.bought;
			building.unlocked = state.unlocked;
		}
		for (const upgrade of upgrades) {
			const state = originalUpgrades.get(upgrade.name);
			if (!state) continue;
			upgrade.bought = state.bought;
			upgrade.unlocked = state.unlocked;
		}
		for (const achievement of achievements) {
			if (originalAchievements.has(achievement.name)) achievement.won = originalAchievements.get(achievement.name);
		}
		game.cookies = originalState.cookies;
		game.cookiesEarned = originalState.cookiesEarned;
		game.BuildingsOwned = originalState.buildingsOwned;
		game.UpgradesOwned = originalState.upgradesOwned;
		game.recalculateGains = 1;
		game.CalculateGains();
	}
}

function upgradeCategory(upgrade: Upgrade, passiveEffect: number, clickEffect: number): EconomyUpgradeCategory {
	if (upgrade.pool === 'debug') return 'debug';
	if (upgrade.pool === 'prestige' || upgrade.pool === 'prestigeDecor') return 'prestige';
	if (upgrade.pool === 'toggle') return 'toggle';
	if (upgrade.pool === 'tech') return 'tech';
	if (upgrade.season || /biscuit|egg|reindeer|Santa|Valentine|Halloween|Easter|fools/i.test(upgrade.name)) return 'seasonal';
	const hasPassive = passiveEffect > 0 || Boolean(upgrade.power || upgrade.catAdd || upgrade.kitten);
	const hasClick = clickEffect > 0 || Boolean(upgrade.clickPower || /finger|mouse|click/i.test(upgrade.name));
	if (hasPassive && hasClick) return 'mixed';
	if (hasClick) return 'click';
	if (hasPassive || upgrade.pool === 'cookie') return 'passive';
	return 'utility';
}

function buildingNamesForUpgrade(upgrade: Upgrade): string[] {
	const names: string[] = [];
	for (const tie of [upgrade.buildingTie, upgrade.buildingTie1, upgrade.buildingTie2]) {
		if (tie && typeof tie === 'object' && typeof tie.name === 'string' && !names.includes(tie.name)) names.push(tie.name);
	}
	return names;
}

function upgradeReport(game: Game, upgrade: Upgrade): EconomyUpgradeReport {
	game.CalculateGains();
	const baselineCps = game.cookiesPs;
	const baselineClickCps = Number(game.computedMouseCps || 0);
	const bought = upgrade.bought > 0;
	let ownedCps = 0;
	let purchaseCps = 0;
	let ownedClickCps = 0;
	let purchaseClickCps = 0;

	if (bought) {
		upgrade.bought = 0;
		game.CalculateGains();
		ownedCps = Math.max(0, baselineCps - game.cookiesPs);
		ownedClickCps = Math.max(0, baselineClickCps - Number(game.computedMouseCps || 0));
		upgrade.bought = 1;
	} else {
		upgrade.bought = 1;
		game.CalculateGains();
		purchaseCps = Math.max(0, game.cookiesPs - baselineCps);
		purchaseClickCps = Math.max(0, Number(game.computedMouseCps || 0) - baselineClickCps);
		upgrade.bought = 0;
	}
	game.CalculateGains();

	const currentPrice = upgrade.getPrice();
	const category = upgradeCategory(upgrade, bought ? ownedCps : purchaseCps, bought ? ownedClickCps : purchaseClickCps);
	const clickPayback = (clicksPerSecond: number): number => {
		if (purchaseClickCps <= 0 || clicksPerSecond <= 0) return Infinity;
		return currentPrice / (purchaseClickCps * clicksPerSecond);
	};
	let balanceWarning: string | undefined;
	const tiedBuildings = buildingNamesForUpgrade(upgrade);
	const tier = upgrade.tier && game.Tiers[upgrade.tier];
	const tierReached = tiedBuildings.length > 0 && (!tier || tier.unlock < 0 || tiedBuildings.some((name) => game.Objects[name].amount >= tier.unlock));
	if (tierReached && category === 'passive' && purchaseCps > 0 && currentPrice / purchaseCps > 60 * 60 * 24 * 7) balanceWarning = 'passive payback exceeds 7 days at its current unlock context';
	if (tierReached && category === 'click' && purchaseClickCps > 0 && clickPayback(5) > 60 * 60 * 24 * 7) balanceWarning = 'click payback exceeds 7 days at 5 clicks/sec at its current unlock context';
	return {
		name: upgrade.name,
		id: upgrade.id,
		pool: upgrade.pool,
		category,
		buildingNames: buildingNamesForUpgrade(upgrade),
		basePrice: upgrade.basePrice,
		currentPrice,
		bought,
		unlocked: upgrade.unlocked > 0,
		ownedCps,
		purchaseCps,
		ownedClickCps,
		purchaseClickCps,
		paybackSeconds: purchaseCps > 0 ? currentPrice / purchaseCps : Infinity,
		clickPaybackSeconds: { one: clickPayback(1), five: clickPayback(5), ten: clickPayback(10) },
		balanceWarning,
	};
}

function scenarioAmounts(buildings: Building[], requested: Record<string, number>): Record<string, number> {
	const amounts: Record<string, number> = {};
	for (const building of buildings) {
		const requestedAmount = requested[building.name];
		const amount = Number.isFinite(requestedAmount) ? Math.max(0, Math.floor(requestedAmount)) : 0;
		building.amount = amount;
		if (amount > 0) amounts[building.name] = amount;
	}
	return amounts;
}

function runMilestone(game: Game, buildings: Building[], label: string, requested: Record<string, number>, upgrades?: string[]): EconomyMilestoneReport {
	for (const upgrade of Object.values(game.Upgrades) as Upgrade[]) upgrade.bought = 0;
	for (const name of upgrades || []) {
		if (game.Upgrades[name]) game.Upgrades[name].bought = 1;
	}
	const amounts = scenarioAmounts(buildings, requested);
	let totalInvestment = 0;
	for (const building of buildings) {
		const targetAmount = building.amount;
		building.amount = 0;
		totalInvestment += building.getSumPrice(targetAmount);
		building.amount = targetAmount;
	}
	game.CalculateGains();
	const report = snapshotBuildings(game);
	const leaders = [...report].sort((a, b) => b.totalCps - a.totalCps).filter((building) => building.totalCps > 0).slice(0, 3).map((building) => building.name);
	return {
		label,
		buildingAmounts: amounts,
		totalInvestment,
		totalCps: game.cookiesPs,
		clickCps: Number(game.computedMouseCps || 0),
		leadingBuildings: leaders,
	};
}

function isStrategyUpgrade(upgrade: Upgrade): boolean {
	return upgrade.pool !== 'debug' && upgrade.pool !== 'prestige' && upgrade.pool !== 'prestigeDecor' && upgrade.pool !== 'toggle' && upgrade.pool !== 'tech' && !upgrade.season;
}

function unlockStrategyContent(game: Game): void {
	for (const building of Object.values(game.Objects) as Building[]) {
		if (building.id === 0 || building.amount > 0 || game.cookiesEarned >= building.basePrice) building.unlocked = 1;
	}
	for (const entry of (game.UnlockAt || []) as any[]) {
		const upgrade = game.Upgrades[entry.name];
		if (!upgrade || game.cookiesEarned < entry.cookies) continue;
		if (entry.require && !game.Has(entry.require) && !game.HasAchiev(entry.require)) continue;
		if (entry.season && game.season !== entry.season) continue;
		upgrade.unlocked = 1;
	}
}

function measureStrategyPurchase(game: Game, kind: 'building' | 'upgrade', item: Building | Upgrade, clicksPerSecond: number): number {
	game.CalculateGains();
	const before = game.cookiesPs + Number(game.computedMouseCps || 0) * clicksPerSecond;
	if (kind === 'building') (item as Building).amount++;
	else (item as Upgrade).bought = 1;
	game.CalculateGains();
	const after = game.cookiesPs + Number(game.computedMouseCps || 0) * clicksPerSecond;
	if (kind === 'building') (item as Building).amount--;
	else (item as Upgrade).bought = 0;
	game.CalculateGains();
	return Math.max(0, after - before);
}

function strategySample(game: Game, elapsedSeconds: number): EconomyStrategySample {
	return {
		elapsedSeconds,
		cookies: game.cookies,
		cookiesEarned: game.cookiesEarned,
		cps: game.cookiesPs,
		clickCps: Number(game.computedMouseCps || 0),
		buildingAmounts: Object.fromEntries((Object.values(game.Objects) as Building[]).filter((building) => building.amount > 0).map((building) => [building.name, building.amount])),
		upgradesBought: (Object.values(game.Upgrades) as Upgrade[]).filter((upgrade) => upgrade.bought > 0).length,
	};
}

/** Run a deterministic, engine-backed purchase strategy in a fully restored sandbox. */
export function SimulateStrategy(game: Game, options: EconomyStrategyOptions = {}): EconomyStrategyReport {
	const strategy: EconomyStrategyName = options.strategy || 'bestPayback';
	const durationSeconds = Math.max(1, options.durationSeconds || 60 * 60);
	const clicksPerSecond = Math.max(0, options.clicksPerSecond === undefined ? 5 : options.clicksPerSecond);
	const sampleEverySeconds = Math.max(1, options.sampleEverySeconds || 60);
	const maxPurchases = Math.max(1, Math.floor(options.maxPurchases || 5000));
	return withEconomySandbox(game, (buildings, upgrades) => {
		for (const building of buildings) {
			building.amount = 0;
			building.bought = 0;
			building.unlocked = 0;
		}
		for (const upgrade of upgrades) {
			upgrade.bought = 0;
			upgrade.unlocked = 0;
		}
		game.cookies = 0;
		game.cookiesEarned = 0;
		game.BuildingsOwned = 0;
		game.UpgradesOwned = 0;
		game.recalculateGains = 1;
		game.CalculateGains();

		let elapsedSeconds = 0;
		let purchases = 0;
		let nextSample = sampleEverySeconds;
		let stoppedReason: string | undefined;
		const samples: EconomyStrategySample[] = [strategySample(game, 0)];
		const recordSamples = () => {
			while (elapsedSeconds >= nextSample && nextSample <= durationSeconds) {
				samples.push(strategySample(game, nextSample));
				nextSample += sampleEverySeconds;
			}
		};
		while (elapsedSeconds < durationSeconds && purchases < maxPurchases) {
			unlockStrategyContent(game);
			game.CalculateGains();
			const buildingCandidates = buildings.filter((building) => (building.id === 0 || building.unlocked > 0) && building.getPrice() > 0);
			const upgradeCandidates = upgrades.filter((upgrade) => isStrategyUpgrade(upgrade) && upgrade.unlocked > 0 && upgrade.bought === 0 && upgrade.getPrice() > 0);
			const candidates = [
				...buildingCandidates.map((building) => ({ kind: 'building' as const, item: building, price: building.getPrice() })),
				...upgradeCandidates.map((upgrade) => ({ kind: 'upgrade' as const, item: upgrade, price: upgrade.getPrice() })),
			];
			const affordable = candidates.filter((candidate) => candidate.price <= game.cookies);
			let chosen = affordable[0];
			if (affordable.length > 1) {
				if (strategy === 'cheapest') chosen = affordable.sort((a, b) => a.price - b.price)[0];
				else if (strategy === 'upgradesFirst') chosen = affordable.sort((a, b) => Number(b.kind === 'upgrade') - Number(a.kind === 'upgrade') || a.price - b.price)[0];
				else chosen = affordable.map((candidate) => ({ ...candidate, score: candidate.price / Math.max(0.000001, measureStrategyPurchase(game, candidate.kind, candidate.item, clicksPerSecond)) })).sort((a, b) => a.score - b.score)[0];
			}
			if (chosen) {
				game.cookies -= chosen.price;
				if (chosen.kind === 'building') {
					const building = chosen.item as Building;
					building.amount++;
					building.bought++;
					game.BuildingsOwned++;
					if (building.buyFunction) building.buyFunction();
				} else {
					const upgrade = chosen.item as Upgrade;
					upgrade.bought = 1;
					if (upgrade.buyFunction) upgrade.buyFunction();
					if (game.CountsAsUpgradeOwned(upgrade.pool)) game.UpgradesOwned++;
				}
				purchases++;
				game.recalculateGains = 1;
				game.CalculateGains();
				continue;
			}

			game.CalculateGains();
			const rate = game.cookiesPs + Number(game.computedMouseCps || 0) * clicksPerSecond;
			if (rate <= 0) {
				stoppedReason = 'no passive or click income';
				break;
			}
			let delta = durationSeconds - elapsedSeconds;
			for (const candidate of candidates) {
				if (candidate.price > game.cookies) delta = Math.min(delta, (candidate.price - game.cookies) / rate);
			}
			for (const building of buildings) {
				if (building.id !== 0 && building.unlocked === 0 && building.basePrice > game.cookiesEarned) delta = Math.min(delta, (building.basePrice - game.cookiesEarned) / rate);
			}
			if (!Number.isFinite(delta) || delta <= 0) delta = Math.min(1, durationSeconds - elapsedSeconds);
			delta = Math.max(0.001, delta);
			game.cookies += rate * delta;
			game.cookiesEarned += rate * delta;
			elapsedSeconds += delta;
			recordSamples();
		}
		if (purchases >= maxPurchases && elapsedSeconds < durationSeconds) stoppedReason = 'purchase limit reached';
		if (!stoppedReason && elapsedSeconds >= durationSeconds) stoppedReason = 'duration reached';
		game.CalculateGains();
		if (samples[samples.length - 1]?.elapsedSeconds !== Math.floor(elapsedSeconds)) samples.push(strategySample(game, elapsedSeconds));
		return {
			strategy,
			durationSeconds,
			elapsedSeconds,
			cookies: game.cookies,
			cookiesEarned: game.cookiesEarned,
			cps: game.cookiesPs,
			clickCps: Number(game.computedMouseCps || 0),
			buildingAmounts: Object.fromEntries(buildings.filter((building) => building.amount > 0).map((building) => [building.name, building.amount])),
			upgradesBought: upgrades.filter((upgrade) => upgrade.bought > 0).map((upgrade) => upgrade.name),
			purchases,
			stoppedReason,
			samples,
		};
	});
}

function analysisLevels(options: EconomyAnalysisOptions): number[] {
	return [...new Set((options.levels || [1, 10, 25, 50, 100, 250, 500])
		.filter((level) => Number.isFinite(level) && level > 0)
		.map((level) => Math.floor(level)))];
}

function buildingBaseCps(building: Building): number {
	if (typeof building.baseCps === 'number') return building.baseCps;
	if (typeof building.cps === 'function') return Number(building.cps(building));
	return 0;
}

/**
 * Compare every building at identical ownership levels using a clean
 * no-upgrade sandbox. This catches a building that is unusually expensive or
 * weak relative to the rest of the production curve, while avoiding a fixed
 * absolute payback threshold that would incorrectly flag normal late-game
 * price growth.
 */
function auditBuildingBalance(
	game: Game,
	buildings: Building[],
	levels: number[],
): EconomyBuildingBalanceReport[] {
	for (const building of buildings) {
		building.amount = 0;
		building.bought = 0;
	}
	for (const upgrade of Object.values(game.Upgrades) as Upgrade[]) upgrade.bought = 0;

	const orderedBuildings = buildings.slice().sort((a, b) => effectiveStoreOrder(a) - effectiveStoreOrder(b));
	const audits = new Map<string, EconomyBuildingBalanceReport>();
	for (const building of buildings) {
		audits.set(building.name, {
			name: building.name,
			storeOrder: effectiveStoreOrder(building),
			basePrice: building.basePrice,
			baseCps: buildingBaseCps(building),
			milestones: [],
			warnings: [],
		});
	}

	for (const level of levels) {
		const measurements = new Map<string, EconomyBuildingBalanceMilestone>();
		for (const building of buildings) {
			for (const other of buildings) {
				other.amount = 0;
				other.bought = 0;
			}
			building.amount = level;
			building.bought = level;
			game.CalculateGains();
			const totalCps = game.cookiesPs;
			building.amount = 0;
			const totalInvestment = building.getSumPrice(level);
			building.amount = level;
			const nextPurchaseCost = building.getPrice();
			game.CalculateGains();
			building.amount = level + 1;
			game.CalculateGains();
			const marginalCps = Math.max(0, game.cookiesPs - totalCps);
			building.amount = level;
			game.CalculateGains();
			const paybackSeconds = marginalCps > 0 ? nextPurchaseCost / marginalCps : Infinity;
			measurements.set(building.name, {
				level,
				totalInvestment,
				totalCps,
				nextPurchaseCost,
				marginalCps,
				paybackSeconds,
				paybackRatioToCurve: 1,
			});
		}

		for (let index = 0; index < orderedBuildings.length; index++) {
			const name = orderedBuildings[index].name;
			const measurement = measurements.get(name)!;
			const previous = index > 0 ? measurements.get(orderedBuildings[index - 1].name)! : undefined;
			const next = index + 1 < orderedBuildings.length ? measurements.get(orderedBuildings[index + 1].name)! : undefined;
			const previousPayback = previous?.paybackSeconds ?? 0;
			const nextPayback = next?.paybackSeconds ?? 0;
			const expectedPayback = Number.isFinite(previousPayback) && previousPayback > 0 && Number.isFinite(nextPayback) && nextPayback > 0
				? Math.sqrt(previousPayback * nextPayback)
				: 0;
			const ratio = expectedPayback > 0 && Number.isFinite(measurement.paybackSeconds)
				? measurement.paybackSeconds / expectedPayback
				: 1;
			measurement.paybackRatioToCurve = ratio;
			// Mod buildings (vanilla=0) are measured against the curve but are not
			// warned: their pricing is content-exotic by design. Only vanilla
			// buildings gate the balance audit.
			if (orderedBuildings[index].vanilla === 1 && expectedPayback > 0 && Number.isFinite(ratio) && (ratio >= 3 || ratio <= 1 / 3)) {
				const direction = ratio >= 3 ? 'longer' : 'shorter';
				measurement.balanceWarning = `x${level} purchase payback is ${direction} than the neighboring building curve (${ratio.toFixed(2)}x)`;
			}
			const audit = audits.get(name);
			if (audit) {
				audit.milestones.push(measurement);
				if (measurement.balanceWarning) audit.warnings.push(`${audit.name}: ${measurement.balanceWarning}`);
			}
		}
	}
	return buildings
		.slice()
		.sort((a, b) => effectiveStoreOrder(a) - effectiveStoreOrder(b))
		.map((building) => audits.get(building.name)!);
}

/** Analyze every registered building and upgrade, plus controlled progression milestones. */
export function AnalyzeEconomy(game: Game, options: EconomyAnalysisOptions = {}): FullEconomyReport {
	return withEconomySandbox(game, (buildings, upgrades) => {
		game.CalculateGains();
		const baselineCps = game.cookiesPs;
		const baselineClickCps = Number(game.computedMouseCps || 0);
		const buildingReport = GetEconomyReport(game).buildings;
		const upgradeReports = upgrades.map((upgrade) => upgradeReport(game, upgrade));
		const levels = analysisLevels(options);
		const buildingBalance = auditBuildingBalance(game, buildings, levels);
		const milestones: EconomyMilestoneReport[] = [];
		const warnings: string[] = [];
		if (options.scenarios && options.scenarios.length > 0) {
			for (const scenario of options.scenarios) milestones.push(runMilestone(game, buildings, scenario.label, scenario.buildings, scenario.upgrades));
		} else {
			for (const building of buildings) {
				for (const level of levels) milestones.push(runMilestone(game, buildings, `${building.name} x${level}`, { [building.name]: level }));
			}
		}
		for (const upgrade of upgradeReports) {
			if (upgrade.balanceWarning) warnings.push(`${upgrade.name}: ${upgrade.balanceWarning}`);
		}
		for (const audit of buildingBalance) warnings.push(...audit.warnings);
		return {
			buildingCount: buildings.length,
			upgradeCount: upgrades.length,
			baselineCps,
			baselineClickCps,
			buildings: buildingReport,
			buildingBalance,
			upgrades: upgradeReports,
			milestones,
			warnings,
		};
	});
}

/** Run several named-building scenarios and restore the complete live economy state. */
export function SimulateEconomy(game: Game, scenarios: Record<string, number>[]): EconomySimulationPoint[] {
	return withEconomySandbox(game, (buildings) => scenarios.map((scenario) => {
		scenarioAmounts(buildings, scenario);
		game.CalculateGains();
		const report = GetEconomyReport(game);
		return { amounts: { ...scenario }, totalCps: report.totalCps, buildings: report.buildings };
	}));
}
