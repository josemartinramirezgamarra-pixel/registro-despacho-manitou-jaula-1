"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  FIELD_TYPE_LABELS,
  FIELD_TYPES,
  createsCalculationCycle,
  type DispatchCalculation,
  type DispatchField,
  type DispatchSection,
  type FieldType,
} from "@/lib/dispatch-model";

interface FieldEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: DispatchSection[];
  fields: DispatchField[];
  editingField?: DispatchField;
  initialSectionId?: string;
  onSave: (field: Omit<DispatchField, "id" | "orden"> & { id?: string }) => void;
}

interface FieldDraft {
  etiqueta: string;
  seccion_id: string;
  tipo: FieldType;
  obligatorio: boolean;
  opciones: string;
  ayuda: string;
  ancho: "completo" | "medio";
  maxlength: string;
  operacion: DispatchCalculation["operacion"];
  campo_a: string;
  campo_b: string;
  decimales: string;
}

const EMPTY_DRAFT: FieldDraft = {
  etiqueta: "",
  seccion_id: "",
  tipo: "texto",
  obligatorio: false,
  opciones: "",
  ayuda: "",
  ancho: "medio",
  maxlength: "",
  operacion: "suma",
  campo_a: "",
  campo_b: "",
  decimales: "0",
};

export function FieldEditorDialog({
  open,
  onOpenChange,
  sections,
  fields,
  editingField,
  initialSectionId,
  onSave,
}: FieldEditorDialogProps) {
  const [draft, setDraft] = useState<FieldDraft>(EMPTY_DRAFT);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const numericFields = fields.filter(
      (field) => field.tipo === "numero" || field.tipo === "decimal" || field.tipo === "auto",
    );
    const first = numericFields.find((field) => field.id !== editingField?.id)?.id ?? "";
    const second = numericFields.find((field) => field.id !== editingField?.id && field.id !== first)?.id ?? "";

    if (editingField) {
      setDraft({
        etiqueta: editingField.etiqueta,
        seccion_id: editingField.seccion_id,
        tipo: editingField.tipo,
        obligatorio: editingField.obligatorio,
        opciones: editingField.opciones.join("\n"),
        ayuda: editingField.ayuda,
        ancho: editingField.ancho,
        maxlength: editingField.maxlength?.toString() ?? "",
        operacion: editingField.calculo?.operacion ?? "suma",
        campo_a: editingField.calculo?.campo_a ?? first,
        campo_b: editingField.calculo?.campo_b ?? second,
        decimales: editingField.calculo?.decimales?.toString() ?? "0",
      });
    } else {
      setDraft({
        ...EMPTY_DRAFT,
        seccion_id: initialSectionId ?? sections[0]?.id ?? "",
        campo_a: first,
        campo_b: second,
      });
    }
    setError("");
  }, [editingField, fields, initialSectionId, open, sections]);

  const numericFields = fields.filter(
    (field) =>
      (field.tipo === "numero" || field.tipo === "decimal" || field.tipo === "auto") &&
      field.id !== editingField?.id,
  );

  function updateDraft<K extends keyof FieldDraft>(key: K, value: FieldDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function handleTypeChange(value: string | null) {
    if (!value || !FIELD_TYPES.includes(value as FieldType)) return;
    const nextType = value as FieldType;
    const hasFormula = draft.campo_a && draft.campo_b;
    const first = numericFields[0]?.id ?? "";
    const second = numericFields.find((field) => field.id !== first)?.id ?? "";
    setDraft((current) => ({
      ...current,
      tipo: nextType,
      campo_a: hasFormula ? current.campo_a : first,
      campo_b: hasFormula ? current.campo_b : second,
    }));
    setError("");
  }

  function handleSave() {
    const label = draft.etiqueta.trim();
    if (!label) {
      setError("Escribe el nombre que verá el equipo en el formulario.");
      return;
    }
    if (
      fields.some(
        (field) =>
          field.id !== editingField?.id &&
          field.etiqueta.trim().toLocaleLowerCase("es") === label.toLocaleLowerCase("es"),
      )
    ) {
      setError("Ya existe un campo con ese nombre. Elige otro para distinguirlo.");
      return;
    }
    if (!draft.seccion_id) {
      setError("Elige en qué sección aparecerá este campo.");
      return;
    }

    const options = draft.opciones
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);

    if (draft.tipo === "select" && options.length < 2) {
      setError("Una lista necesita al menos dos opciones, una por línea.");
      return;
    }
    if (
      draft.tipo === "auto" &&
      (!draft.campo_a || !draft.campo_b || draft.campo_a === draft.campo_b)
    ) {
      setError("Elige dos campos numéricos diferentes para completar la fórmula.");
      return;
    }
    if (
      draft.tipo === "auto" &&
      createsCalculationCycle(fields, editingField?.id, draft.campo_a, draft.campo_b)
    ) {
      setError("Esa fórmula crea un ciclo. Elige campos que no dependan de este resultado.");
      return;
    }
    if (
      editingField &&
      (editingField.tipo === "numero" || editingField.tipo === "decimal" || editingField.tipo === "auto") &&
      draft.tipo !== "numero" &&
      draft.tipo !== "decimal" &&
      draft.tipo !== "auto" &&
      fields.some(
        (field) =>
          field.tipo === "auto" &&
          (field.calculo?.campo_a === editingField.id || field.calculo?.campo_b === editingField.id),
      )
    ) {
      setError("Otro cálculo usa este dato. Actualiza primero esa fórmula antes de cambiar el tipo.");
      return;
    }
    if (draft.maxlength && (!/^\d+$/.test(draft.maxlength) || Number(draft.maxlength) < 1)) {
      setError("El máximo de caracteres debe ser un número mayor que cero.");
      return;
    }

    const calculo =
      draft.tipo === "auto"
        ? {
            operacion: draft.operacion,
            campo_a: draft.campo_a,
            campo_b: draft.campo_b,
            decimales: Math.min(4, Math.max(0, Number(draft.decimales) || 0)),
          }
        : undefined;

    onSave({
      id: editingField?.id,
      etiqueta: label,
      seccion_id: draft.seccion_id,
      tipo: draft.tipo,
      obligatorio: draft.obligatorio,
      opciones: draft.tipo === "select" ? options : [],
      ayuda: draft.ayuda.trim(),
      ancho: draft.ancho,
      maxlength: draft.maxlength ? Number(draft.maxlength) : undefined,
      calculo,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="pr-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            Personaliza tu formato
          </p>
          <DialogTitle className="text-xl">
            {editingField ? "Editar campo" : "Agregar un campo"}
          </DialogTitle>
          <DialogDescription>
            Define qué dato se pedirá y en qué parte del despacho aparecerá.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="field-label">Nombre del campo</Label>
            <Input
              id="field-label"
              autoFocus
              value={draft.etiqueta}
              onChange={(event) => updateDraft("etiqueta", event.target.value)}
              placeholder="Ej. Sello de seguridad"
              className="h-11 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label>Sección</Label>
            <Select value={draft.seccion_id || null} onValueChange={(value) => updateDraft("seccion_id", value ?? "")}>
              <SelectTrigger className="h-11 w-full text-base">
                <SelectValue placeholder="Elige una sección" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de dato</Label>
            <Select value={draft.tipo} onValueChange={handleTypeChange}>
              <SelectTrigger className="h-11 w-full text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {FIELD_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="field-help">Texto de ayuda <span className="font-normal text-muted-foreground">(opcional)</span></Label>
            <Input
              id="field-help"
              value={draft.ayuda}
              onChange={(event) => updateDraft("ayuda", event.target.value)}
              placeholder="Una indicación breve para quien registra"
              className="h-11 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label>Espacio que ocupa</Label>
            <Select value={draft.ancho} onValueChange={(value) => value && updateDraft("ancho", value as FieldDraft["ancho"])}>
              <SelectTrigger className="h-11 w-full text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medio">Medio ancho</SelectItem>
                <SelectItem value="completo">Ancho completo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-maxlength">Máximo de caracteres</Label>
            <Input
              id="field-maxlength"
              inputMode="numeric"
              value={draft.maxlength}
              onChange={(event) => updateDraft("maxlength", event.target.value.replace(/\D/g, ""))}
              placeholder="Sin límite"
              className="h-11 text-base"
            />
          </div>

          {draft.tipo === "select" ? (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="field-options">Opciones <span className="font-normal text-muted-foreground">(una por línea)</span></Label>
              <Textarea
                id="field-options"
                value={draft.opciones}
                onChange={(event) => updateDraft("opciones", event.target.value)}
                placeholder={"Opción 1\nOpción 2"}
                rows={4}
                className="resize-y text-base"
              />
            </div>
          ) : null}

          {draft.tipo === "auto" ? (
            <div className="grid gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:col-span-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Fórmula</Label>
                <Select value={draft.operacion} onValueChange={(value) => value && updateDraft("operacion", value as DispatchCalculation["operacion"])}>
                  <SelectTrigger className="h-11 w-full bg-background text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suma">Suma</SelectItem>
                    <SelectItem value="division">División</SelectItem>
                    <SelectItem value="promedio">Promedio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(["campo_a", "campo_b"] as const).map((key, index) => (
                <div className="space-y-2" key={key}>
                  <Label>{index === 0 ? "Primer dato" : "Segundo dato"}</Label>
                  <Select value={draft[key] || null} onValueChange={(value) => updateDraft(key, value ?? "")}>
                    <SelectTrigger className="h-11 w-full bg-background text-base">
                      <SelectValue placeholder="Elige un campo" />
                    </SelectTrigger>
                    <SelectContent>
                      {numericFields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.etiqueta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="field-decimals">Decimales del resultado</Label>
                <Input
                  id="field-decimals"
                  inputMode="numeric"
                  value={draft.decimales}
                  onChange={(event) => updateDraft("decimales", event.target.value.replace(/\D/g, "").slice(0, 1))}
                  className="h-11 bg-background text-base"
                />
              </div>
              <p className="self-end text-sm leading-relaxed text-muted-foreground sm:col-span-2">
                El resultado se actualiza automáticamente mientras registras el despacho.
              </p>
            </div>
          ) : null}

          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-3 sm:col-span-2">
            <Checkbox
              checked={draft.obligatorio}
              onCheckedChange={(checked) => updateDraft("obligatorio", checked === true)}
            />
            <span className="text-sm font-medium">Este dato será obligatorio para guardar</span>
          </label>

          {error ? (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive sm:col-span-2" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="flex-row justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="min-h-11">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="min-h-11 px-5">
            {editingField ? "Guardar cambios" : "Agregar campo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
