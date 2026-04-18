"use client";
import { useState } from "react";
import { addTransaction } from "@/lib/api";
import { Plus, Check, Loader2, X } from "lucide-react";
import type { TrackerItem } from "./ChatWindow";

interface Props {
  item: TrackerItem;
}

export default function LogToTrackerChip({ item }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(item.estimatedAmount.toString());
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await addTransaction({
        type: "expense",
        category: item.category,
        description: item.description,
        amount: parseFloat(amount),
        date,
      });
      setDone(true);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
        <Check className="w-3 h-3" /> Logged
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-xs bg-farm-pale text-farm-green hover:bg-farm-light hover:text-white px-2.5 py-1 rounded-full font-medium transition-all duration-150 cursor-pointer active:scale-95"
      >
        <Plus className="w-3 h-3" />
        {item.description}
        {item.estimatedAmount > 0 && <span className="opacity-70 ml-0.5">~₹{item.estimatedAmount}</span>}
      </button>

      {open && (
        <div className="absolute bottom-8 left-0 z-50 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-4 animate-scale-in">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-700">Log to Tracker</p>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3 truncate">{item.description}</p>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-farm-light mt-0.5"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-farm-light mt-0.5"
              />
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[10px] text-gray-400 capitalize">{item.category}</span>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-1 bg-farm-green text-white text-xs px-3 py-1.5 rounded-lg hover:bg-farm-light transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
