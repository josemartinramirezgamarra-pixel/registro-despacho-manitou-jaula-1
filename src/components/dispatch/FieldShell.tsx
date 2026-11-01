"use client";

import { Label } from "@/components/ui/label";
import type { DispatchField } from "@/lib/dispatch-model";

interface FieldShellProps {
  field: DispatchField;
  inputId: string;
  error?: string;
  children: React.ReactNode;
}

export function FieldShell({ field, inputId, error, children }: FieldShellProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="flex min-h-6 items-center gap-1.5 text-sm font-semibold">
        <span>{field.etiqueta}</span>
        {field.obligatorio ? <span className="text-destructive" aria-label="obligatorio">*</span> : null}
      </Label>
      {children}
      {field.ayuda ? <p className="px-1 text-xs leading-relaxed text-muted-foreground">{field.ayuda}</p> : null}
      {error ? <p className="px-1 text-xs font-medium text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}
