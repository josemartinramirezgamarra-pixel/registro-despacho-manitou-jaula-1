export type FieldType =
  | "texto"
  | "numero"
  | "decimal"
  | "fecha"
  | "hora"
  | "select"
  | "textarea"
  | "checkbox";

export interface DispatchSection {
  id: string;
  titulo: string;
  orden: number;
}

export interface DispatchField {
  id: string;
  etiqueta: string;
  seccion_id: string;
  tipo: FieldType;
  obligatorio: boolean;
  opciones: string[];
  ayuda: string;
  ancho: "completo" | "medio";
  orden: number;
  maxlength?: number;
}

export interface DispatchSchema {
  secciones: DispatchSection[];
  campos: DispatchField[];
}

export type DispatchValues = Record<string, string | boolean>;

export interface DispatchRecord {
  id: string;
  creado_en: string;
  estado_sync: "pendiente" | "sincronizado";
  valores: DispatchValues;
  etiquetas: Record<string, string>;
}

export const SCHEMA_STORAGE_KEY = "despachos_manitou_schema_v1";
export const RECORDS_STORAGE_KEY = "despachos_manitou_v1";
export const LEGACY_RECORDS_STORAGE_KEY = "despachos_aves_v3";

const sectionId = "datos-del-despacho";

const defaultFields: Array<Omit<DispatchField, "orden" | "opciones">> = [
  { id: "fecha", etiqueta: "Fecha", seccion_id: sectionId, tipo: "fecha", obligatorio: true, ayuda: "", ancho: "medio" },
  { id: "plantel", etiqueta: "Plantel", seccion_id: sectionId, tipo: "texto", obligatorio: true, ayuda: "", ancho: "medio" },
  { id: "galpon", etiqueta: "Galpón", seccion_id: sectionId, tipo: "texto", obligatorio: false, ayuda: "", ancho: "medio" },
  { id: "placa", etiqueta: "Placa", seccion_id: sectionId, tipo: "texto", obligatorio: false, ayuda: "", ancho: "medio" },
  { id: "grupo", etiqueta: "Grupo", seccion_id: sectionId, tipo: "numero", obligatorio: false, ayuda: "", ancho: "medio" },
  { id: "coordinador", etiqueta: "Coordinador", seccion_id: sectionId, tipo: "texto", obligatorio: false, ayuda: "", ancho: "medio" },
  { id: "varones", etiqueta: "Varones", seccion_id: sectionId, tipo: "numero", obligatorio: false, ayuda: "", ancho: "medio" },
  { id: "mujeres", etiqueta: "Mujeres", seccion_id: sectionId, tipo: "numero", obligatorio: false, ayuda: "", ancho: "medio" },
  { id: "jabas", etiqueta: "Jabas", seccion_id: sectionId, tipo: "numero", obligatorio: false, ayuda: "", ancho: "medio" },
  { id: "densidad", etiqueta: "Densidad", seccion_id: sectionId, tipo: "numero", obligatorio: false, ayuda: "", ancho: "medio" },
  { id: "estiba-inicio", etiqueta: "Estiba inicio", seccion_id: sectionId, tipo: "hora", obligatorio: false, ayuda: "", ancho: "medio" },
  { id: "estiba-termino", etiqueta: "Estiba término", seccion_id: sectionId, tipo: "hora", obligatorio: false, ayuda: "", ancho: "medio" },
];

export const DEFAULT_SCHEMA: DispatchSchema = {
  secciones: [{ id: sectionId, titulo: "Datos del despacho", orden: 0 }],
  campos: defaultFields.map((field, orden) => ({ ...field, opciones: [], orden })),
};

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  texto: "Texto",
  numero: "Número entero",
  decimal: "Número decimal",
  fecha: "Fecha",
  hora: "Hora",
  select: "Lista de opciones",
  textarea: "Texto largo",
  checkbox: "Casilla de verificación",
};

export const FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as FieldType[];

export function localDateValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createInitialValues(plantel?: string, fecha?: string): DispatchValues {
  return {
    fecha: fecha || localDateValue(),
    plantel: plantel ?? "",
  };
}

export function computeValues(_fields: DispatchField[], values: DispatchValues): DispatchValues {
  return { ...values };
}

export function validateField(field: DispatchField, value: string | boolean | undefined): string | undefined {
  const textValue = typeof value === "boolean" ? "" : String(value ?? "").trim();
  if (field.obligatorio) {
    if (field.tipo === "checkbox" && value !== true) return "Debes marcar esta casilla.";
    if (field.tipo !== "checkbox" && textValue.length === 0) return "Este dato es obligatorio.";
  }

  if (!textValue || field.tipo === "checkbox") return undefined;
  if (field.tipo === "select" && !field.opciones.includes(textValue)) {
    return "Selecciona una de las opciones disponibles.";
  }
  if (field.tipo === "numero" && (!/^\d+$/.test(textValue) || Number(textValue) < 0)) {
    return "Ingresa un número entero igual o mayor que cero.";
  }
  if (field.tipo === "decimal" && (!/^\d+(\.\d+)?$/.test(textValue) || Number(textValue) < 0)) {
    return "Ingresa un número igual o mayor que cero.";
  }
  if (field.maxlength && textValue.length > field.maxlength) {
    return `Usa un máximo de ${field.maxlength} caracteres.`;
  }
  return undefined;
}

export function isDispatchSchema(value: unknown): value is DispatchSchema {
  if (!value || typeof value !== "object") return false;
  const schema = value as Partial<DispatchSchema>;
  if (!Array.isArray(schema.secciones) || !Array.isArray(schema.campos)) return false;
  const sections = schema.secciones as DispatchSection[];
  const fields = schema.campos as DispatchField[];
  const sectionIds = new Set<string>();

  for (const section of sections) {
    if (
      !section ||
      typeof section.id !== "string" ||
      !section.id ||
      typeof section.titulo !== "string" ||
      typeof section.orden !== "number" ||
      !Number.isFinite(section.orden) ||
      sectionIds.has(section.id)
    ) return false;
    sectionIds.add(section.id);
  }

  const fieldIds = new Set<string>();
  for (const field of fields) {
    if (
      !field ||
      typeof field.id !== "string" ||
      !field.id ||
      fieldIds.has(field.id) ||
      typeof field.etiqueta !== "string" ||
      typeof field.seccion_id !== "string" ||
      !sectionIds.has(field.seccion_id) ||
      !FIELD_TYPES.includes(field.tipo) ||
      typeof field.obligatorio !== "boolean" ||
      !Array.isArray(field.opciones) ||
      !field.opciones.every((option) => typeof option === "string") ||
      typeof field.ayuda !== "string" ||
      (field.ancho !== "completo" && field.ancho !== "medio") ||
      typeof field.orden !== "number" ||
      !Number.isFinite(field.orden) ||
      (field.maxlength !== undefined && (!Number.isInteger(field.maxlength) || field.maxlength < 1)) ||
      Object.hasOwn(field, "calculo")
    ) return false;
    fieldIds.add(field.id);
  }

  return true;
}

export function sortSchema(schema: DispatchSchema): DispatchSchema {
  return {
    secciones: [...schema.secciones].sort((first, second) => first.orden - second.orden),
    campos: [...schema.campos].sort((first, second) => first.orden - second.orden),
  };
}

export function makeStableId(label: string): string {
  const slug = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "campo"}-${Math.random().toString(36).slice(2, 7)}`;
}
