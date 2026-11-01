import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: "green" | "blue" | "gold" | "slate";
}

export function MetricCard({ label, value, hint, icon: Icon, tone }: MetricCardProps) {
  const toneClasses = {
    green: "bg-primary/10 text-primary",
    blue: "bg-chart-4/10 text-chart-4",
    gold: "bg-chart-3/10 text-chart-3",
    slate: "bg-muted text-muted-foreground",
  };

  return (
    <article className="rounded-[16px] border border-border bg-card p-4 shadow-[0_2px_10px_hsl(174_31%_13%/0.035)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="max-w-[18ch] text-sm font-semibold text-muted-foreground">{label}</p>
        <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${toneClasses[tone]}`}><Icon size={18} /></div>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </article>
  );
}
