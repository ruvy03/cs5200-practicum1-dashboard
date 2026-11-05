"use client";

import { useEffect, useState } from "react";
import type { RestaurantRow, Stats } from "@/lib/types";
import { count, money, moneyCents, moneyCompact, monthLabel, percent } from "@/lib/format";
import { Card, CardTitle, Eyebrow, Kpi, PillToggle, ShareRow } from "./ui";
import { COLORS, RevenueByMonthChart } from "./charts";

type SortKey = "revenue" | "visits" | "customers";
type Failure = { message: string; code?: string };

const selectClass =
  "rounded-full border border-pine/20 bg-white px-3 py-1.5 text-sm text-pine-ink focus:outline-none focus:ring-2 focus:ring-leaf/40";

export default function Dashboard() {
  const [restaurant, setRestaurant] = useState("all");
  const [year, setYear] = useState("all");
  const [reloads, setReloads] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>("revenue");
  const [stats, setStats] = useState<Stats | null>(null);
  const [result, setResult] = useState<{ key: string; failure?: Failure } | null>(null);

  // every filter change (or Refresh) makes a new request key
  const requestKey = `${restaurant}|${year}|${reloads}`;
  const loading = result?.key !== requestKey;
  const failure = result?.failure;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/stats?restaurant=${restaurant}&year=${year}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw Object.assign(new Error(body.error ?? "The request failed."), { code: body.code });
        setStats(body as Stats);
        setResult({ key: requestKey });
      })
      .catch((err: Error & { code?: string }) => {
        if (err.name === "AbortError") return;
        // the database is down: show that, and no data
        setStats(null);
        setResult({ key: requestKey, failure: { message: err.message, code: err.code } });
      });
    return () => controller.abort();
  }, [requestKey, restaurant, year]);

  const refresh = () => setReloads((n) => n + 1);

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:min-h-[680px]">
      <header className="border-b border-pine/10 bg-white">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3 short:py-2">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pine">
              <span className="h-3 w-3 rounded-full bg-sage" />
            </span>
            <div>
              <h1 className="font-serif text-2xl leading-none text-sky">Restaurant visits, at a glance</h1>
              <p className="mt-1 text-xs text-leaf">Restaurant Group · CS5200 Practicum I · Dhruv Sinha</p>
            </div>
          </div>

          <StatusPill loading={loading} failure={failure} stats={stats} />

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select aria-label="Restaurant" className={selectClass} value={restaurant} onChange={(e) => setRestaurant(e.target.value)}>
              <option value="all">All restaurants</option>
              {stats?.options.restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <select aria-label="Year" className={selectClass} value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="all">All years</option>
              {stats?.options.years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={refresh}
              className="rounded-full bg-pine px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pine-ink"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col p-4 short:p-3">
        {failure ? (
          <Offline failure={failure} retrying={loading} onRetry={refresh} />
        ) : stats ? (
          <DashboardBody stats={stats} loading={loading} sortBy={sortBy} setSortBy={setSortBy} />
        ) : (
          <Skeleton />
        )}
      </main>
    </div>
  );
}

function StatusPill({ loading, failure, stats }: { loading: boolean; failure?: Failure; stats: Stats | null }) {
  if (failure) {
    return (
      <span className="flex items-center gap-2 rounded-full bg-peach px-3 py-1 text-xs font-medium text-pine-ink">
        <span className="h-2 w-2 rounded-full bg-ember" /> Database offline
      </span>
    );
  }
  if (!stats) {
    return (
      <span className="flex items-center gap-2 rounded-full bg-mint px-3 py-1 text-xs text-leaf">
        <span className="h-2 w-2 animate-pulse rounded-full bg-leaf" /> Connecting to Aiven…
      </span>
    );
  }
  const updated = new Date(stats.generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return (
    <span className="flex items-center gap-2 rounded-full bg-mint px-3 py-1 text-xs text-pine-ink">
      <span className={`h-2 w-2 rounded-full bg-leaf ${loading ? "animate-pulse" : ""}`} />
      Live from Aiven MySQL · updated {updated}
    </span>
  );
}

function Offline({ failure, retrying, onRetry }: { failure: Failure; retrying: boolean; onRetry: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="max-w-md p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-peach">
          <span className="h-3 w-3 rounded-full bg-ember" />
        </span>
        <Eyebrow className="mt-4 text-ember">Database offline</Eyebrow>
        <h2 className="mt-1 font-serif text-3xl text-pine-ink">No data to show right now</h2>
        <p className="mt-3 text-sm text-pine-ink/80">{failure.message}</p>
        {failure.code && <p className="mt-1 text-xs text-pine-ink/50">Error code: {failure.code}</p>}
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-full bg-pine px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-pine-ink"
        >
          {retrying ? "Trying again…" : "Try again"}
        </button>
      </Card>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid flex-1 gap-3 lg:grid-rows-[auto_minmax(0,1.75fr)_minmax(0,1fr)]">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-[88px] animate-pulse rounded-[18px] bg-white/70" />
        ))}
      </div>
      <div className="min-h-48 animate-pulse rounded-[18px] bg-white/70" />
      <div className="min-h-32 animate-pulse rounded-[18px] bg-white/70" />
    </div>
  );
}

function DashboardBody({
  stats,
  loading,
  sortBy,
  setSortBy,
}: {
  stats: Stats;
  loading: boolean;
  sortBy: SortKey;
  setSortBy: (key: SortKey) => void;
}) {
  const s = stats.summary;
  const revenue = s.food + s.alcohol;
  const first = stats.monthly[0]?.month;
  const last = stats.monthly[stats.monthly.length - 1]?.month;
  const range = first && last ? `${monthLabel(first)} to ${monthLabel(last)}` : "No visits";
  const topYear = Math.max(1, ...stats.yearly.map((y) => y.revenue));
  const mealTotal = stats.mealTypes.reduce((sum, row) => sum + row.visits, 0);
  const paymentTotal = stats.paymentMethods.reduce((sum, row) => sum + row.visits, 0);
  const mealColors = [COLORS.pine, COLORS.leaf, COLORS.sage, COLORS.apricot];
  const paymentColors = [COLORS.pine, COLORS.sky, COLORS.apricot];

  return (
    <div
      className={`grid flex-1 gap-3 transition-opacity short:gap-2 lg:min-h-0 lg:grid-rows-[auto_minmax(0,1.8fr)_minmax(0,1fr)] ${loading ? "opacity-60" : ""}`}
    >
      {/* key numbers */}
      <section className="grid grid-cols-2 gap-3 short:gap-2 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Visits" value={count(s.visits)} caption={range} />
        <Kpi label="Revenue" value={moneyCompact(revenue)} caption="Food and alcohol sales" />
        <Kpi label="Tips" value={moneyCompact(s.tips)} caption={`${percent(s.tips, revenue)} of sales`} />
        <Kpi label="Loyalty customers" value={count(s.customers)} caption="Identified by email" />
        <Kpi label="Average bill" value={moneyCents(s.avgBill)} caption="Per visit, food and alcohol" />
        <Kpi
          label="Average wait"
          value={s.avgWait !== null ? `${s.avgWait.toFixed(1)} min` : "None"}
          caption={s.avgParty !== null ? `${s.avgParty.toFixed(1)} guests per visit` : "No party size data"}
        />
      </section>

      {/* revenue over time, and every restaurant */}
      <section className="grid gap-3 short:gap-2 lg:min-h-0 lg:grid-cols-12">
        <div className="flex flex-col rounded-[18px] bg-pine p-4 text-white short:p-3 lg:col-span-7 lg:min-h-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Eyebrow className="text-sage">Totals per month and year</Eyebrow>
              <CardTitle className="text-white">Revenue by month</CardTitle>
            </div>
            <div className="flex gap-4 text-xs text-white/80">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sage" /> Food
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-apricot" /> Alcohol
              </span>
            </div>
          </div>
          <div className="relative mt-2 h-56 lg:h-auto lg:min-h-0 lg:flex-1">
            <div className="absolute inset-0">
              <RevenueByMonthChart data={stats.monthly} />
            </div>
          </div>
          <ul className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 short:mt-2 sm:grid-cols-5 xl:grid-cols-9">
            {stats.yearly.map((y) => (
              <li key={y.year} title={`${count(y.visits)} visits`}>
                <p className="font-serif text-sm leading-none">{y.year}</p>
                <p className="mt-0.5 text-[11px] text-white/80">{moneyCompact(y.revenue)}</p>
                <div className="mt-1 h-1 rounded-full bg-white/15">
                  <div className="h-1 rounded-full bg-sage" style={{ width: `${(y.revenue / topYear) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <Card className="flex flex-col lg:col-span-5 lg:min-h-0">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <Eyebrow>Visits, revenue, and customers</Eyebrow>
              <CardTitle>By restaurant</CardTitle>
            </div>
            <PillToggle
              options={[
                { value: "revenue", label: "Revenue" },
                { value: "visits", label: "Visits" },
                { value: "customers", label: "Customers" },
              ]}
              value={sortBy}
              onChange={setSortBy}
            />
          </div>
          <RestaurantList rows={stats.restaurants} sortBy={sortBy} />
        </Card>
      </section>

      {/* food vs alcohol, meal types, payment methods */}
      <section className="grid gap-3 short:gap-2 lg:min-h-0 lg:grid-cols-3">
        <Card className="flex flex-col lg:min-h-0">
          <Eyebrow>Food vs alcohol</Eyebrow>
          <CardTitle>Where the money comes from</CardTitle>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs text-pine-ink/70">
                <span className="h-2 w-2 rounded-full bg-pine" /> Food
              </p>
              <p className="font-serif text-2xl leading-tight">{moneyCompact(s.food)}</p>
              <p className="text-xs text-pine-ink/70">{percent(s.food, revenue)} of sales</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs text-pine-ink/70">
                <span className="h-2 w-2 rounded-full bg-apricot" /> Alcohol
              </p>
              <p className="font-serif text-2xl leading-tight">{moneyCompact(s.alcohol)}</p>
              <p className="text-xs text-pine-ink/70">{percent(s.alcohol, revenue)} of sales</p>
            </div>
          </div>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-mint">
            <div className="bg-pine" style={{ width: percent(s.food, revenue) }} />
            <div className="bg-apricot" style={{ width: percent(s.alcohol, revenue) }} />
          </div>
          <p className="mt-2 text-xs text-pine-ink/70">
            Alcohol was ordered on {percent(s.alcoholVisits, s.visits)} of visits ({count(s.alcoholVisits)}).
          </p>
        </Card>

        <Card className="flex flex-col lg:min-h-0">
          <Eyebrow>Meal types</Eyebrow>
          <CardTitle>When guests come in</CardTitle>
          <ul className="mt-3 flex flex-1 flex-col justify-between gap-2 short:mt-2 short:gap-1">
            {stats.mealTypes.map((row, i) => (
              <ShareRow
                key={row.label}
                label={row.label}
                detail={`${moneyCents(row.revenue / row.visits)} avg bill`}
                share={mealTotal > 0 ? row.visits / mealTotal : 0}
                color={mealColors[i % mealColors.length]}
              />
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col lg:min-h-0">
          <Eyebrow>Payment methods</Eyebrow>
          <CardTitle>How guests pay</CardTitle>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-mint">
            {stats.paymentMethods.map((row, i) => (
              <div
                key={row.label}
                style={{ width: percent(row.visits, paymentTotal), background: paymentColors[i % paymentColors.length] }}
              />
            ))}
          </div>
          <ul className="mt-3 flex flex-1 flex-col justify-between gap-2">
            {stats.paymentMethods.map((row, i) => (
              <li key={row.label} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2 w-2 rounded-full" style={{ background: paymentColors[i % paymentColors.length] }} />
                  {row.label}
                </span>
                <span className="text-pine-ink/70">
                  {count(row.visits)} visits ·{" "}
                  <span className="font-medium text-pine-ink">{percent(row.visits, paymentTotal)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}

const rowGrid = "grid grid-cols-[minmax(0,1.5fr)_56px_64px_minmax(0,1fr)_52px] items-center gap-3";

// one compact row per restaurant: visits, revenue, a food/alcohol bar, and loyalty customers
function RestaurantList({ rows, sortBy }: { rows: RestaurantRow[]; sortBy: SortKey }) {
  const value = (r: RestaurantRow) => (sortBy === "revenue" ? r.food + r.alcohol : sortBy === "visits" ? r.visits : r.customers);
  const sorted = [...rows].sort((a, b) => value(b) - value(a));
  const maxRevenue = Math.max(1, ...rows.map((r) => r.food + r.alcohol));

  return (
    <div className="mt-3 flex flex-col short:mt-2 lg:min-h-0 lg:flex-1">
      <div className={`${rowGrid} border-b border-pine/10 pb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-leaf short:pb-1`}>
        <span>Restaurant</span>
        <span className="text-right">Visits</span>
        <span className="text-right">Revenue</span>
        <span>Food / alcohol</span>
        <span className="text-right">Loyalty</span>
      </div>
      <ul className="flex flex-col justify-between lg:min-h-0 lg:flex-1">
        {sorted.map((r) => {
          const rowRevenue = r.food + r.alcohol;
          return (
            <li key={r.id} className={`${rowGrid} py-0.5 text-xs short:py-0 short:text-[11px] short:leading-[15px]`}>
              <span className="truncate font-medium" title={`${r.name}, ${r.city}, ${r.state}`}>
                {r.name}
              </span>
              <span className="text-right tabular-nums">{count(r.visits)}</span>
              <span className="text-right tabular-nums">{moneyCompact(rowRevenue)}</span>
              <span
                className="flex h-2 overflow-hidden rounded-full bg-mint"
                title={`Food ${money(r.food)} · Alcohol ${money(r.alcohol)}`}
              >
                <span className="bg-pine" style={{ width: `${(r.food / maxRevenue) * 100}%` }} />
                <span className="bg-apricot" style={{ width: `${(r.alcohol / maxRevenue) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums">{r.customers}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
