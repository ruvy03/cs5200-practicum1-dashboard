// Number and date formatting used across the dashboard

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usdCents = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});
const whole = new Intl.NumberFormat("en-US");

export const money = (n: number) => usd.format(n);
export const moneyCents = (n: number) => usdCents.format(n);
export const moneyCompact = (n: number) => usdCompact.format(n);
export const count = (n: number) => whole.format(n);

export function percent(part: number, total: number) {
  return total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "0%";
}

// "2024-03" -> "Mar 2024"
export function monthLabel(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
