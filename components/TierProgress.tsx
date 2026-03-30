"use client";

interface Props {
  currentMonthSpend: number;
  currentMonth: string;
}

const TIERS = [
  { threshold: 0, rate: 3, label: "3%", color: "#94a3b8" },
  { threshold: 50000, rate: 4, label: "4%", color: "#2d5a8e" },
  { threshold: 100000, rate: 5, label: "5%", color: "#10b981" },
];

function formatCurrency(val: number): string {
  if (val >= 1000) return `£${(val / 1000).toFixed(1)}k`;
  return `£${val.toFixed(0)}`;
}

function getStatus(spend: number) {
  if (spend >= 100000) {
    return { currentTier: 2, nextTier: null, amountToNext: 0, progress: 100 };
  } else if (spend >= 50000) {
    return {
      currentTier: 1,
      nextTier: TIERS[2],
      amountToNext: 100000 - spend,
      progress: ((spend - 50000) / 50000) * 100,
      tierStart: 50000,
      tierEnd: 100000,
    };
  } else {
    return {
      currentTier: 0,
      nextTier: TIERS[1],
      amountToNext: 50000 - spend,
      progress: (spend / 50000) * 100,
      tierStart: 0,
      tierEnd: 50000,
    };
  }
}


export default function TierProgress({ currentMonthSpend, currentMonth }: Props) {
  const status = getStatus(currentMonthSpend);
  const currentTier = TIERS[status.currentTier];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Commission Tier Progress</h2>
          <p className="text-xs text-gray-500 mt-0.5">{currentMonth} · Tiers reset each month</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Current rate</p>
          <p className="text-2xl font-bold text-[#1e3a5f]">{currentTier.rate}%</p>
        </div>
      </div>

      {/* Tier Blocks */}
      <div className="flex gap-2 mb-6">
        {TIERS.map((tier, i) => {
          const isActive = status.currentTier === i;
          const isUnlocked = status.currentTier >= i;
          return (
            <div
              key={tier.rate}
              className={`flex-1 rounded-lg p-3 border-2 transition-all ${
                isActive
                  ? "border-[#1e3a5f] bg-[#1e3a5f]/5"
                  : isUnlocked
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-lg font-bold ${isActive ? "text-[#1e3a5f]" : isUnlocked ? "text-emerald-600" : "text-gray-400"}`}>
                  {tier.label}
                </span>
                {isUnlocked && (
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${isActive ? "bg-[#1e3a5f] text-white" : "bg-emerald-100 text-emerald-700"}`}>
                    {isActive ? "Active" : "✓"}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {tier.threshold === 0 ? "0 – £50k" : tier.threshold === 50000 ? "£50k – £100k" : "£100k+"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      {status.nextTier ? (
        <>
          <div className="mb-2 flex justify-between items-end">
            <div>
              <span className="text-sm font-medium text-gray-700">This month's spend</span>
              <span className="text-sm text-gray-400 ml-2">
                {formatCurrency(status.tierStart!)} → {formatCurrency(status.tierEnd!)}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(currentMonthSpend)} / {formatCurrency(status.tierEnd!)}
            </span>
          </div>

          {/* Progress Track */}
          <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(status.progress, 100)}%`,
                background: "linear-gradient(90deg, #1e3a5f, #2d5a8e)",
              }}
            />
            {/* Tick marks at 25%, 50%, 75% */}
            {[25, 50, 75].map((pct) => (
              <div
                key={pct}
                className="absolute top-0 bottom-0 w-px bg-white/60"
                style={{ left: `${pct}%` }}
              />
            ))}
          </div>

          {/* Callout */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
            <div className="text-2xl leading-none mt-0.5">🎯</div>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {formatCurrency(status.amountToNext)} more spend to unlock {status.nextTier.label}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
          <div className="text-2xl leading-none mt-0.5">🏆</div>
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              Maximum tier unlocked — earning 5% on all spend above £100k!
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              You're in the top tier. Every additional £1,000 of spend earns you £50.
            </p>
          </div>
        </div>
      )}

      {/* Mini tier summary */}
      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-400">Earned at 3%</p>
          <p className="text-sm font-semibold text-gray-700">
            £{(Math.min(currentMonthSpend, 50000) * 0.03).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Earned at 4%</p>
          <p className="text-sm font-semibold text-gray-700">
            £{(Math.max(0, Math.min(currentMonthSpend - 50000, 50000)) * 0.04).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Earned at 5%</p>
          <p className="text-sm font-semibold text-gray-700">
            £{(Math.max(0, currentMonthSpend - 100000) * 0.05).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
