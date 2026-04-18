"use client";
import { useEffect, useState } from "react";
import { getTrackerSummary } from "@/lib/api";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { StatCardSkeleton } from "@/components/ui/Skeleton";

interface Summary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  returnOnInvestment: number;
}

export default function FinanceSummary() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrackerSummary()
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {[0, 1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!summary) return null;

  const cards = [
    { label: "Revenue", value: summary.totalRevenue, icon: TrendingUp, color: "text-green-600 bg-green-50" },
    { label: "Expenses", value: summary.totalExpenses, icon: TrendingDown, color: "text-red-500 bg-red-50" },
    { label: "Net Profit", value: summary.netProfit, icon: DollarSign, color: summary.netProfit >= 0 ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50" },
    { label: "ROI", value: null, roi: summary.returnOnInvestment, icon: Percent, color: "text-blue-600 bg-blue-50" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {cards.map(({ label, value, roi, icon: Icon, color }, i) => (
        <div
          key={label}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 animate-slide-up hover:shadow-md transition-all duration-300"
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          <div className={`${color} rounded-lg p-2 shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`font-semibold text-sm ${color.split(" ")[0]}`}>
              {roi !== undefined ? `${roi.toFixed(1)}%` : `₹${value!.toLocaleString("en-IN")}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
