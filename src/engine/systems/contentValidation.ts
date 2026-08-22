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

/** Recalculate and return the current production snapshot for balancing. */
export function GetEconomyReport(game: Game): EconomyReport {
	game.CalculateGains();
	const buildings = (Object.values(game.Objects) as Building[])
		.sort((a, b) => effectiveStoreOrder(a) - effectiveStoreOrder(b))
		.map((building): EconomyBuildingReport => ({
			name: building.name,
			storeOrder: effectiveStoreOrder(building),
			amount: building.amount,
			baseCps: typeof building.baseCps === 'number' ? building.baseCps : 0,
			cpsPerBuilding: building.storedCps,
			totalCps: building.storedTotalCps,
			share: game.cookiesPs > 0 ? building.storedTotalCps / game.cookiesPs : 0,
		}));
	return {
		totalCps: game.cookiesPs,
		buildings,
	};
}
