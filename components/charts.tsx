"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthRow } from "@/lib/types";
import { money, moneyCompact, monthLabel } from "@/lib/format";

// same palette as globals.css (charts need plain color values)
export const COLORS = {
  pine: "#005450",
  pineInk: "#004d49",
  leaf: "#068466",
  sage: "#abcc76",
  apricot: "#ffc776",
  sky: "#0578ff",
  mint: "#eef6f4",
};

// stacked area of food and alcohol revenue per month, drawn on the dark pine card.
// It fills whatever height its parent gives it.
export function RevenueByMonthChart({ data }: { data: MonthRow[] }) {
  // with many months, label only each January with its year
  const yearTicks = data.length > 24 ? data.filter((row) => row.month.endsWith("-01")).map((row) => row.month) : undefined;
  const tick = { fill: "rgba(255, 255, 255, 0.75)", fontSize: 11 };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255, 255, 255, 0.12)" vertical={false} />
        <XAxis
          dataKey="month"
          ticks={yearTicks}
          tickFormatter={(month: string) => (yearTicks ? month.slice(0, 4) : monthLabel(month).slice(0, 3))}
          tick={tick}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tickFormatter={moneyCompact} tick={tick} axisLine={false} tickLine={false} width={60} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "none", fontSize: 12, color: COLORS.pineInk }}
          labelFormatter={(label) => monthLabel(String(label))}
          formatter={(value) => money(Number(value))}
        />
        <Area type="monotone" dataKey="food" name="Food" stackId="revenue" stroke={COLORS.sage} fill={COLORS.sage} fillOpacity={0.35} strokeWidth={2} />
        <Area type="monotone" dataKey="alcohol" name="Alcohol" stackId="revenue" stroke={COLORS.apricot} fill={COLORS.apricot} fillOpacity={0.45} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
