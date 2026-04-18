"use client";
import { useEffect, useState, useCallback } from "react";
import { getTrackerSummary, getTransactions, deleteTransaction } from "@/lib/api";
import TransactionForm from "@/components/tracker/TransactionForm";
import CategoryChart from "@/components/tracker/CategoryChart";
import RevenuePanel from "@/components/tracker/RevenuePanel";
import { StatCardSkeleton, TransactionRowSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { TrendingUp, TrendingDown, DollarSign, Percent, Trash2, Loader2 } from "lucide-react";

interface Summary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  returnOnInvestment: number;
  byCategory: Record<string, number>;
}

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  season?: string;
}

const seasons = ["Kharif 2025", "Rabi 2025", "Zaid 2025", "Kharif 2024", "Rabi 2024"];

export default function TrackerPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [season, setSeason] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    const [s, t] = await Promise.all([getTrackerSummary(), getTransactions(season || undefined)]);
    setSummary(s);
    setTransactions(t);
    setLoading(false);
  }, [season]);

  useEffect(() => { load(true); }, [load]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteTransaction(id);
    await load();
    setDeletingId(null);
  };

  const statCards = summary ? [
    { label: "Total Revenue", value: `₹${summary.totalRevenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-green-600 bg-green-50" },
    { label: "Total Invested", value: `₹${summary.totalExpenses.toLocaleString("en-IN")}`, icon: TrendingDown, color: "text-red-500 bg-red-50" },
    { label: "Net Profit", value: `₹${summary.netProfit.toLocaleString("en-IN")}`, icon: DollarSign, color: summary.netProfit >= 0 ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50" },
    { label: "ROI", value: `${summary.returnOnInvestment.toFixed(1)}%`, icon: Percent, color: "text-blue-600 bg-blue-50" },
  ] : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 page-enter">
      <div className="animate-slide-up">
        <h2 className="text-2xl font-bold text-gray-800">Finance Tracker</h2>
        <p className="text-gray-500 text-sm mt-1">Track your farm income and expenses in ₹ INR</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading
          ? [0, 1, 2, 3].map((i) => <StatCardSkeleton key={i} />)
          : statCards.map(({ label, value, icon: Icon, color }, i) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-slide-up hover:shadow-md transition-all duration-300"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <div className={`inline-flex p-2 rounded-lg ${color} mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-bold text-lg text-gray-800">{value}</p>
            </div>
          ))
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <TransactionForm onAdded={() => load()} />
        </div>
        <div className="lg:col-span-2 grid grid-rows-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-slide-up" style={{ animationDelay: "0.25s" }}>
            <h3 className="font-semibold text-gray-700 mb-3">Expenses by Category</h3>
            {loading ? <ChartSkeleton /> : summary && <CategoryChart byCategory={summary.byCategory} />}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <h3 className="font-semibold text-gray-700 mb-3">Monthly Revenue vs Expenses</h3>
            {loading ? <ChartSkeleton /> : <RevenuePanel transactions={transactions} />}
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-slide-up" style={{ animationDelay: "0.35s" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Transactions</h3>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-farm-light transition-all"
          >
            <option value="">All Seasons</option>
            {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 pr-4">Description</th>
                <th className="pb-3 pr-4">Season</th>
                <th className="pb-3 pr-4 text-right">Amount</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody>
              {loading
                ? [0, 1, 2, 3].map((i) => <TransactionRowSkeleton key={i} />)
                : transactions.length === 0
                  ? <tr><td colSpan={7} className="py-10 text-center text-gray-400 text-sm">No transactions yet — add one above</td></tr>
                  : transactions.map((t, i) => (
                    <tr
                      key={t.id}
                      className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors animate-fade-in"
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <td className="py-3 pr-4 text-gray-500 text-xs">{new Date(t.date).toLocaleDateString("en-IN")}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 capitalize">{t.category.replace("_", " ")}</td>
                      <td className="py-3 pr-4 text-gray-800">{t.description}</td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">{t.season || "—"}</td>
                      <td className={`py-3 pr-4 text-right font-semibold ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                        {t.type === "income" ? "+" : "-"}₹{t.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={deletingId === t.id}
                          className="text-gray-300 hover:text-red-500 transition-colors active:scale-90 disabled:opacity-50"
                        >
                          {deletingId === t.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
