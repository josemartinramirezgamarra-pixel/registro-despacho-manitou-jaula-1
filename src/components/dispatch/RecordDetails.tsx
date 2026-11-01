import type { DispatchRecord, DispatchSchema } from "@/lib/dispatch-model";

interface RecordDetailsProps {
  record: DispatchRecord;
  schema: DispatchSchema;
}

function displayValue(value: string | boolean | undefined): string {
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value ?? "") || "—";
}

export function RecordDetails({ record, schema }: RecordDetailsProps) {
  const schemaFieldIds = schema.campos.map((field) => field.id);
  const ids = [
    ...schemaFieldIds.filter((id) => Object.hasOwn(record.valores, id)),
    ...Object.keys(record.valores).filter((id) => !schemaFieldIds.includes(id)),
  ];
  const currentLabels = new Map(schema.campos.map((field) => [field.id, field.etiqueta]));

  return (
    <div className="grid gap-2 py-2 sm:grid-cols-2">
      {ids.map((id) => (
        <div key={id} className="min-w-0 rounded-xl border border-border bg-background px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{record.etiquetas[id] ?? currentLabels.get(id) ?? "Dato guardado"}</p>
          <p className="mt-1 break-words text-sm font-medium">{displayValue(record.valores[id])}</p>
        </div>
      ))}
      {ids.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground sm:col-span-2">Este registro no tiene campos guardados.</p> : null}
    </div>
  );
}
