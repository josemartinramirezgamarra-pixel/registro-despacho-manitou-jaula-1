"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldShell } from "@/components/dispatch/FieldShell";
import {
  normalizePlate,
  type DispatchField,
} from "@/lib/dispatch-model";

interface DispatchFormFieldProps {
  field: DispatchField;
  value: string | boolean | undefined;
  error?: string;
  inputId?: string;
  onChange: (fieldId: string, value: string | boolean) => void;
}

export function DispatchFormField({
  field,
  value,
  error,
  inputId,
  onChange,
}: DispatchFormFieldProps) {
  const id = inputId ?? `dispatch-${field.id}`;
  const textValue = typeof value === "boolean" ? "" : String(value ?? "");
  const isInvalid = Boolean(error);
  const fieldClass = `h-12 text-base ${isInvalid ? "border-destructive focus-visible:ring-destructive/30" : ""}`;

  if (field.tipo === "checkbox") {
    return (
      <div className="space-y-2">
        <div className={`flex min-h-14 items-center gap-3 rounded-[14px] border px-4 ${isInvalid ? "border-destructive bg-destructive/5" : "border-border bg-card"}`}>
          <Checkbox
            id={id}
            checked={value === true}
            onCheckedChange={(checked) => onChange(field.id, checked === true)}
            aria-invalid={isInvalid}
            className="size-5"
          />
          <Label htmlFor={id} className="cursor-pointer text-sm leading-relaxed">
            {field.etiqueta}
            {field.obligatorio ? <span className="ml-1 text-destructive" aria-label="obligatorio">*</span> : null}
          </Label>
        </div>
        {field.ayuda ? <p className="px-1 text-xs leading-relaxed text-muted-foreground">{field.ayuda}</p> : null}
        {error ? <p className="px-1 text-xs font-medium text-destructive" role="alert">{error}</p> : null}
      </div>
    );
  }

  if (field.tipo === "auto") {
    return (
      <FieldShell field={field} inputId={id} error={error}>
        <Input id={id} value={textValue} readOnly aria-readonly="true" className={`${fieldClass} bg-muted/70 font-semibold text-foreground`} />
      </FieldShell>
    );
  }

  if (field.tipo === "select") {
    return (
      <FieldShell field={field} inputId={id} error={error}>
        <Select
          value={textValue || null}
          onValueChange={(nextValue) => onChange(field.id, nextValue ?? "")}
        >
          <SelectTrigger id={id} className={`h-12 w-full bg-card text-base ${isInvalid ? "border-destructive" : ""}`} aria-invalid={isInvalid}>
            <SelectValue placeholder="Selecciona una opción" />
          </SelectTrigger>
          <SelectContent>
            {field.opciones.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldShell>
    );
  }

  if (field.tipo === "textarea") {
    return (
      <FieldShell field={field} inputId={id} error={error}>
        <Textarea
          id={id}
          value={textValue}
          onChange={(event) => onChange(field.id, event.target.value)}
          maxLength={field.maxlength}
          rows={4}
          className={`min-h-28 resize-y text-base ${isInvalid ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
          aria-invalid={isInvalid}
        />
        {field.maxlength ? (
          <p className="text-right text-xs text-muted-foreground">
            {textValue.length} / {field.maxlength} caracteres
          </p>
        ) : null}
      </FieldShell>
    );
  }

  const inputType =
    field.tipo === "fecha"
      ? "date"
      : field.tipo === "hora"
        ? "time"
        : field.tipo === "numero" || field.tipo === "decimal"
      ? "number"
      : field.tipo === "email" || field.tipo === "telefono"
        ? field.tipo === "telefono" ? "tel" : "email"
        : "text";
  const inputMode =
    field.tipo === "ruc" || field.tipo === "dni" || field.tipo === "numero"
      ? "numeric"
      : field.tipo === "decimal"
        ? "decimal"
        : field.tipo === "telefono"
          ? "tel"
          : undefined;

  return (
    <FieldShell field={field} inputId={id} error={error}>
      <Input
        id={id}
        type={inputType}
        inputMode={inputMode}
        min={field.tipo === "numero" || field.tipo === "decimal" ? 0 : undefined}
        step={field.tipo === "decimal" ? "any" : field.tipo === "numero" ? 1 : undefined}
        maxLength={field.maxlength}
        value={textValue}
        onChange={(event) => onChange(field.id, event.target.value)}
        onBlur={(event) => {
          if (field.tipo === "placa" && event.target.value) {
            onChange(field.id, normalizePlate(event.target.value));
          }
        }}
        className={fieldClass}
        aria-invalid={isInvalid}
      />
    </FieldShell>
  );
}
