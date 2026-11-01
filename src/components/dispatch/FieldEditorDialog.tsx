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
    setDraft(editingField ? {
      etiqueta: editingField.etiqueta,
      seccion_id: editingField.seccion_id,
      tipo: editingField.tipo,
      obligatorio: editingField.obligatorio,
      opciones: editingField.opciones.join("\n"),
      ayuda: editingField.ayuda,
      ancho: editingField.ancho,
      maxlength: editingField.maxlength?.toString() ?? "",
    } : {
      ...EMPTY_DRAFT,
      seccion_id: initialSectionId ?? sections[0]?.id ?? "",
    });
    setError("");
  }, [editingField, initialSectionId, open, sections]);

  function updateDraft<K extends keyof FieldDraft>(key: K, value: FieldDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function handleTypeChange(value: string | null) {
    if (!value || !FIELD_TYPES.includes(value as FieldType)) return;
    updateDraft("tipo", value as FieldType);
  }

  function handleSave() {
    const label = draft.etiqueta.trim();
    if (!label) {
      setError("Escribe el nombre del campo.");
      return;
    }
    if (fields.some((field) => field.id !== editingField?.id && field.etiqueta.trim().toLocaleLowerCase("es") === label.toLocaleLowerCase("es"))) {
      setError("Ya existe un campo con ese nombre.");
      return;
    }
    if (!draft.seccion_id) {
      setError("Elige una sección.");
      return;
    }

    const opciones = draft.opciones.split("\n").map((option) => option.trim()).filter(Boolean);
    if (draft.tipo === "select" && opciones.length < 2) {
      setError("Una lista necesita al menos dos opciones, una por línea.");
      return;
    }

    onSave({
      ...(editingField ? { id: editingField.id } : {}),
      etiqueta: label,
      seccion_id: draft.seccion_id,
      tipo: draft.tipo,
      obligatorio: draft.obligatorio,
      opciones: draft.tipo === "select" ? opciones : [],
      ayuda: draft.ayuda.trim(),
      ancho: draft.ancho,
      ...(draft.maxlength ? { maxlength: Number(draft.maxlength) } : {}),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{editingField ? "Editar campo" : "Agregar campo"}</DialogTitle>
          <DialogDescription>Define el nombre, tipo y ubicación del dato.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="field-label">Nombre del campo</Label>
            <Input id="field-label" value={draft.etiqueta} onChange={(event) => updateDraft("etiqueta", event.target.value)} maxLength={80} className="h-11 text-base" />
          </div>

          <div className="space-y-2">
            <Label>Sección</Label>
            <Select value={draft.seccion_id || null} onValueChange={(value) => updateDraft("seccion_id", value ?? "")}>
              <SelectTrigger className="h-11 w-full text-base"><SelectValue placeholder="Elige una sección" /></SelectTrigger>
              <SelectContent>
                {sections.map((section) => <SelectItem key={section.id} value={section.id}>{section.titulo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de dato</Label>
            <Select value={draft.tipo} onValueChange={handleTypeChange}>
              <SelectTrigger className="h-11 w-full text-base"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((type) => <SelectItem key={type} value={type}>{FIELD_TYPE_LABELS[type]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ancho</Label>
            <Select value={draft.ancho} onValueChange={(value) => value && updateDraft("ancho", value as FieldDraft["ancho"])}>
              <SelectTrigger className="h-11 w-full text-base"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="medio">Medio ancho</SelectItem>
                <SelectItem value="completo">Ancho completo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-maxlength">Máximo de caracteres</Label>
            <Input id="field-maxlength" inputMode="numeric" value={draft.maxlength} onChange={(event) => updateDraft("maxlength", event.target.value.replace(/\D/g, ""))} placeholder="Sin límite" className="h-11 text-base" />
          </div>

          {draft.tipo === "select" ? (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="field-options">Opciones <span className="font-normal text-muted-foreground">(una por línea)</span></Label>
              <Textarea id="field-options" value={draft.opciones} onChange={(event) => updateDraft("opciones", event.target.value)} rows={4} className="resize-y text-base" />
            </div>
          ) : null}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="field-help">Ayuda breve <span className="font-normal text-muted-foreground">(opcional)</span></Label>
            <Input id="field-help" value={draft.ayuda} onChange={(event) => updateDraft("ayuda", event.target.value)} maxLength={120} className="h-11 text-base" />
          </div>

          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-3 sm:col-span-2">
            <Checkbox checked={draft.obligatorio} onCheckedChange={(checked) => updateDraft("obligatorio", checked === true)} />
            <span className="text-sm font-medium">Este dato será obligatorio para guardar</span>
          </label>

          {error ? <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive sm:col-span-2" role="alert">{error}</p> : null}
        </div>

        <DialogFooter className="flex-row justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="min-h-11">Cancelar</Button>
          <Button onClick={handleSave} className="min-h-11 px-5">{editingField ? "Guardar cambios" : "Agregar campo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
