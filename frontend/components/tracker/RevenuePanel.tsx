"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Transaction {
  type: string;
  amount: number;
  date: string;
}

interface Props {
  transactions: Transaction[];
}

export default function RevenuePanel({ transactions }: Props) {
  const monthly: Record<string, { income: number; expense: number }> = {};
  for (const t of transactions) {
    const month = t.date ? new Date(t.date).toLocaleString("default", { month: "short", year: "2-digit" }) : "Unknown";
    if (!monthly[month]) monthly[month] = { income: 0, expense: 0 };
    if (t.type === "income") monthly[month].income += t.amount;
    else monthly[month].expense += t.amount;
  }

  const data = Object.entries(monthly).map(([month, v]) => ({ month, ...v }));

  if (data.length === 0) return <div className="text-sm text-gray-400 text-center py-8">No data yet</div>;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
        <Legend />
        <Bar dataKey="income" name="Revenue" fill="#52b788" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Expense" fill="#f4a261" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
