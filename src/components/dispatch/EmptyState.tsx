import { Plus, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[16px] border border-dashed border-border bg-card px-6 py-12 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon size={23} /></div>
      <h2 className="mt-4 text-base font-bold">{title}</h2>
      <p className="mt-1 max-w-[44ch] text-sm leading-relaxed text-muted-foreground">{description}</p>
      {actionLabel && onAction ? <Button onClick={onAction} className="mt-5 min-h-11 gap-2"><Plus size={16} />{actionLabel}</Button> : null}
    </div>
  );
}
