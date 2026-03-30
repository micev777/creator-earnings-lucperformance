// Commission calculation module
// Supports both flat rate (Plyska) and tiered Option B structure

export type CommissionStructure = "flat" | "tiered_option_b";

/**
 * Calculate earnings based on total monthly spend.
 *
 * Option B uses a MARGINAL (tax-bracket) structure:
 *   3% on the first £50,000
 *   4% on the portion between £50,000 – £100,000
 *   5% on the portion above £100,000
 *
 * e.g. £75,000 spend = (£50,000 × 3%) + (£25,000 × 4%) = £1,500 + £1,000 = £2,500
 */
export function calculateMonthlyCommission(
  monthlySpend: number,
  structure: CommissionStructure
): number {
  if (structure === "tiered_option_b") {
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
 * Returns the effective commission rate (total earnings / total spend).
 * Used to distribute earnings proportionally across ads.
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
