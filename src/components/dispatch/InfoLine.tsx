interface InfoLineProps {
  label: string;
  value: string;
}

export function InfoLine({ label, value }: InfoLineProps) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value || "—"}</p>
    </div>
  );
}
