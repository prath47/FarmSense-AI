"use client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#2d6a4f", "#52b788", "#f4a261", "#8d6748", "#74c69d", "#d8f3dc", "#b7e4c7"];

interface Props {
  byCategory: Record<string, number>;
}

export default function CategoryChart({ byCategory }: Props) {
  const data = Object.entries(byCategory).map(([name, value]) => ({ name: name.replace("_", " "), value }));
  if (data.length === 0) return <div className="text-sm text-gray-400 text-center py-8">No data yet</div>;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name }) => name}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
