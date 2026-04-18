"use client";
import { useState } from "react";
import { addTransaction } from "@/lib/api";

const expenseCategories = ["crops", "fertilizers", "electricity", "labor", "equipment", "irrigation", "other"];
const incomeCategories = ["crop_sale", "subsidy", "other"];
const seasons = ["Kharif 2025", "Rabi 2025", "Zaid 2025", "Kharif 2024", "Rabi 2024"];

interface Props {
  onAdded: () => void;
}

export default function TransactionForm({ onAdded }: Props) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("crops");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [season, setSeason] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = type === "expense" ? expenseCategories : incomeCategories;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    setLoading(true);
    try {
      await addTransaction({ type, category, amount: parseFloat(amount), description, date, season: season || undefined });
      setAmount("");
      setDescription("");
      onAdded();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h3 className="font-semibold text-gray-700">Add Transaction</h3>
      <div className="flex gap-2">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setType(t); setCategory(t === "expense" ? "crops" : "crop_sale"); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === t
                ? t === "expense" ? "bg-red-500 text-white" : "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-farm-light"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Amount (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-farm-light"
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-farm-light"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Season</label>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-farm-light"
          >
            <option value="">All seasons</option>
            {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-farm-light"
          placeholder="Brief description…"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-farm-green text-white font-medium py-2 rounded-lg hover:bg-farm-light transition-colors disabled:opacity-50"
      >
        {loading ? "Adding…" : "Add Transaction"}
      </button>
    </form>
  );
}
