// Commission calculation module
// Supports both flat rate (Plyska) and tiered Option B structure

export type CommissionStructure = "flat" | "tiered_option_b";

/**
 * Calculate earnings based on total monthly spend using the appropriate structure.
 * For tiered structures, this must be called on the MONTHLY total, not per-row.
 */
export function calculateMonthlyCommission(
  monthlySpend: number,
  structure: CommissionStructure
): number {
  if (structure === "tiered_option_b") {
    // Option B: "The Killer"
    // 3% on first £50,000
    // 4% on £50,000 – £100,000
    // 5% above £100,000
    if (monthlySpend <= 50000) {
      return monthlySpend * 0.03;
    } else if (monthlySpend <= 100000) {
      return 50000 * 0.03 + (monthlySpend - 50000) * 0.04;
    } else {
      return 50000 * 0.03 + 50000 * 0.04 + (monthlySpend - 100000) * 0.05;
    }
  }
  // Default: flat 5%
  return monthlySpend * 0.05;
}

/**
 * Returns the effective commission rate across all spend (total earnings / total spend).
 * Used to approximate per-ad earnings proportionally.
 */
export function getEffectiveRate(
  totalSpend: number,
  structure: CommissionStructure
): number {
  if (totalSpend === 0) return 0;
  return calculateMonthlyCommission(totalSpend, structure) / totalSpend;
}

export function getCommissionDescription(structure: CommissionStructure): string {
  if (structure === "tiered_option_b") {
    return "3% up to £50k · 4% up to £100k · 5% above £100k";
  }
  return "5% of total ad spend";
}

export function getCommissionStructure(): CommissionStructure {
  return (process.env.COMMISSION_STRUCTURE as CommissionStructure) || "flat";
}
