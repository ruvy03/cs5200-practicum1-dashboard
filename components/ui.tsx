import type { ReactNode } from "react";

// white card with a soft pine ring, used for every panel
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[18px] bg-white p-4 ring-1 ring-pine/10 short:p-3 ${className}`}>{children}</div>;
}

// small uppercase label above titles
export function Eyebrow({ children, className = "text-leaf" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[11px] font-medium uppercase tracking-[0.14em] ${className}`}>{children}</p>;
}

export function CardTitle({ children, className = "text-pine-ink" }: { children: ReactNode; className?: string }) {
  return <h2 className={`font-serif text-lg leading-tight short:text-base ${className}`}>{children}</h2>;
}

// one key number in the top row
export function Kpi({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <Card className="flex flex-col justify-center">
      <Eyebrow>{label}</Eyebrow>
      <p className="mt-1 font-serif text-3xl leading-none text-pine-ink short:text-2xl">{value}</p>
      <p className="mt-1.5 truncate text-xs text-pine-ink/70 short:mt-1">{caption}</p>
    </Card>
  );
}

// small pill-shaped toggle buttons
export function PillToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-mint p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            value === option.value ? "bg-pine text-white" : "text-pine-ink hover:bg-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// share bar with a label, value and percentage, used for meal types and payment methods
export function ShareRow({
  label,
  detail,
  share,
  color,
}: {
  label: string;
  detail: string;
  share: number;
  color: string;
}) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-pine-ink/70">
          {detail} · <span className="font-medium text-pine-ink">{(share * 100).toFixed(1)}%</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-mint short:mt-0.5">
        <div className="h-1.5 rounded-full" style={{ width: `${share * 100}%`, background: color }} />
      </div>
    </li>
  );
}
