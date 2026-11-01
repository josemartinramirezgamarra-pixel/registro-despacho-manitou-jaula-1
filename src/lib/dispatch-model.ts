export type FieldType =
  | "texto"
  | "numero"
  | "decimal"
  | "fecha"
  | "hora"
  | "select"
  | "textarea"
  | "checkbox"
  | "ruc"
  | "dni"
  | "placa"
  | "email"
  | "telefono"
  | "auto";

export type CalculationOperation = "suma" | "division" | "promedio";

export interface DispatchSection {
  id: string;
  titulo: string;
  orden: number;
}

export interface DispatchCalculation {
  operacion: CalculationOperation;
  campo_a: string;
  campo_b: string;
  decimales?: number;
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
  calculo?: DispatchCalculation;
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

export const SCHEMA_STORAGE_KEY = "despachos_aves_schema_v3";
export const RECORDS_STORAGE_KEY = "despachos_aves_v3";
export const SECTION_STORAGE_KEY = "despachos_aves_section_v3";

const sectionDefinitions = [
  { id: "identificacion", titulo: "Identificación del despacho" },
  { id: "origen", titulo: "Origen" },
  { id: "destino", titulo: "Destino" },
  { id: "aves-carga", titulo: "Aves y carga" },
  { id: "transporte", titulo: "Transporte" },
  { id: "responsable-cierre", titulo: "Responsable y cierre" },
] as const;

type SeedField = Omit<DispatchField, "orden" | "opciones"> & {
  opciones?: string[];
  calculo?: DispatchCalculation;
};

const fieldDefinitions: SeedField[] = [
  {
    id: "numero-despacho",
    etiqueta: "N° de despacho",
    seccion_id: "identificacion",
    tipo: "texto",
    obligatorio: true,
    ayuda: "Se genera automáticamente, puedes editarlo",
    ancho: "medio",
  },
  {
    id: "fecha",
    etiqueta: "Fecha",
    seccion_id: "identificacion",
    tipo: "fecha",
    obligatorio: true,
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "hora",
    etiqueta: "Hora",
    seccion_id: "identificacion",
    tipo: "hora",
    obligatorio: true,
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "tipo-operacion",
    etiqueta: "Tipo de operación",
    seccion_id: "identificacion",
    tipo: "select",
    obligatorio: true,
    opciones: ["Despacho a cliente", "Traslado interno", "Retorno de aves"],
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "plantel",
    etiqueta: "Plantel",
    seccion_id: "origen",
    tipo: "select",
    obligatorio: true,
    opciones: ["Plantel 209", "Plantel 263", "Plantel 264", "Otro"],
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "plantel-especificar",
    etiqueta: "Plantel — especificar",
    seccion_id: "origen",
    tipo: "texto",
    obligatorio: false,
    ayuda: "Completa este dato si elegiste “Otro”",
    ancho: "medio",
  },
  {
    id: "codigo-senasa",
    etiqueta: "Código SENASA del establecimiento",
    seccion_id: "origen",
    tipo: "texto",
    obligatorio: false,
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "galpon-lote",
    etiqueta: "Galpón / Lote",
    seccion_id: "origen",
    tipo: "texto",
    obligatorio: true,
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "edad-semanas",
    etiqueta: "Edad de las aves en semanas",
    seccion_id: "origen",
    tipo: "numero",
    obligatorio: true,
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "cliente",
    etiqueta: "Cliente / Razón social",
    seccion_id: "destino",
    tipo: "texto",
    obligatorio: true,
    ayuda: "",
    ancho: "completo",
  },
  {
    id: "ruc-cliente",
    etiqueta: "RUC",
    seccion_id: "destino",
    tipo: "ruc",
    obligatorio: true,
    ayuda: "11 dígitos",
    ancho: "medio",
  },
  {
    id: "departamento",
    etiqueta: "Departamento",
    seccion_id: "destino",
    tipo: "texto",
    obligatorio: false,
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "provincia",
    etiqueta: "Provincia",
    seccion_id: "destino",
    tipo: "texto",
    obligatorio: false,
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "distrito",
    etiqueta: "Distrito",
    seccion_id: "destino",
    tipo: "texto",
    obligatorio: false,
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "direccion-destino",
    etiqueta: "Dirección de destino",
    seccion_id: "destino",
    tipo: "texto",
    obligatorio: false,
    ayuda: "",
    ancho: "completo",
  },
  {
    id: "machos",
    etiqueta: "Machos",
    seccion_id: "aves-carga",
    tipo: "numero",
    obligatorio: false,
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "hembras",
    etiqueta: "Hembras",
    seccion_id: "aves-carga",
    tipo: "numero",
    obligatorio: false,
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "total-aves",
    etiqueta: "Total de aves",
    seccion_id: "aves-carga",
    tipo: "auto",
    obligatorio: false,
    calculo: { operacion: "suma", campo_a: "machos", campo_b: "hembras", decimales: 0 },
    ayuda: "Se calcula automáticamente",
    ancho: "medio",
  },
  {
    id: "peso-total",
    etiqueta: "Peso total en kg",
    seccion_id: "aves-carga",
    tipo: "decimal",
    obligatorio: false,
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "peso-promedio",
    etiqueta: "Peso promedio por ave en kg",
    seccion_id: "aves-carga",
    tipo: "auto",
    obligatorio: false,
    calculo: { operacion: "division", campo_a: "peso-total", campo_b: "total-aves", decimales: 2 },
    ayuda: "Se calcula automáticamente",
    ancho: "medio",
  },
  {
    id: "jaulas",
    etiqueta: "N° de jaulas / guacales",
    seccion_id: "aves-carga",
    tipo: "numero",
    obligatorio: false,
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "aves-no-aptas",
    etiqueta: "Aves no aptas / mortandad",
    seccion_id: "aves-carga",
    tipo: "numero",
    obligatorio: false,
    ayuda: "Aves no aptas o muertas",
    ancho: "medio",
  },
  {
    id: "placa-camion",
    etiqueta: "Placa del camión o tracto",
    seccion_id: "transporte",
    tipo: "placa",
    obligatorio: true,
    ayuda: "Ejemplo: ABC-123",
    ancho: "medio",
  },
  {
    id: "placa-remolque",
    etiqueta: "Placa del remolque / carrocería",
    seccion_id: "transporte",
    tipo: "placa",
    obligatorio: false,
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "transportista",
    etiqueta: "Empresa transportista",
    seccion_id: "transporte",
    tipo: "texto",
    obligatorio: false,
    ayuda: "",
    ancho: "completo",
  },
  {
    id: "ruc-transportista",
    etiqueta: "RUC del transportista",
    seccion_id: "transporte",
    tipo: "ruc",
    obligatorio: false,
    ayuda: "11 dígitos",
    ancho: "medio",
  },
  {
    id: "conductor",
    etiqueta: "Conductor",
    seccion_id: "transporte",
    tipo: "texto",
    obligatorio: false,
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "dni-conductor",
    etiqueta: "DNI del conductor",
    seccion_id: "transporte",
    tipo: "dni",
    obligatorio: true,
    ayuda: "8 dígitos",
    ancho: "medio",
  },
  {
    id: "licencia",
    etiqueta: "Licencia / brevete",
    seccion_id: "transporte",
    tipo: "texto",
    obligatorio: false,
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "csti",
    etiqueta: "N° de Certificado Sanitario de Tránsito Interno — CSTI",
    seccion_id: "transporte",
    tipo: "texto",
    obligatorio: false,
    ayuda: "",
    ancho: "completo",
  },
  {
    id: "guia-remision",
    etiqueta: "Guía de remisión",
    seccion_id: "transporte",
    tipo: "texto",
    obligatorio: false,
    ayuda: "",
    ancho: "medio",
  },
  {
    id: "responsable",
    etiqueta: "Nombre del responsable del despacho",
    seccion_id: "responsable-cierre",
    tipo: "texto",
    obligatorio: true,
    ayuda: "",
    ancho: "completo",
  },
  {
    id: "dni-responsable",
    etiqueta: "DNI del responsable",
    seccion_id: "responsable-cierre",
    tipo: "dni",
    obligatorio: false,
    ayuda: "8 dígitos",
    ancho: "medio",
  },
  {
    id: "observaciones",
    etiqueta: "Observaciones",
    seccion_id: "responsable-cierre",
    tipo: "textarea",
    obligatorio: false,
    ayuda: "",
    ancho: "completo",
    maxlength: 500,
  },
  {
    id: "declaracion",
    etiqueta: "Declaro que la información registrada es veraz",
    seccion_id: "responsable-cierre",
    tipo: "checkbox",
    obligatorio: true,
    ayuda: "",
    ancho: "completo",
  },
];

export const DEFAULT_SCHEMA: DispatchSchema = {
  secciones: sectionDefinitions.map((section, orden) => ({ ...section, orden })),
  campos: fieldDefinitions.map((field, orden) => ({
    ...field,
    opciones: field.opciones ?? [],
    orden,
  })),
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
  ruc: "RUC peruano",
  dni: "DNI peruano",
  placa: "Placa peruana",
  email: "Correo electrónico",
  telefono: "Teléfono",
  auto: "Cálculo automático",
};

export const FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as FieldType[];

export function localDateValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function localTimeValue(date = new Date()): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function nextDispatchNumber(records: DispatchRecord[]): string {
  const highest = records.reduce((maximum, record) => {
    const match = record.valores["numero-despacho"]?.toString().match(/(\d+)$/);
    return match ? Math.max(maximum, Number(match[1])) : maximum;
  }, 0);
  return `DSP-${String(highest + 1).padStart(4, "0")}`;
}

export function createInitialValues(records: DispatchRecord[], plantel?: string, fecha?: string): DispatchValues {
  return {
    "numero-despacho": nextDispatchNumber(records),
    fecha: fecha || localDateValue(),
    hora: localTimeValue(),
    plantel: plantel ?? "Plantel 209",
  };
}

export function normalizePlate(value: string): string {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (/^[A-Z]{3}\d{3}$/.test(normalized)) return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
  if (/^[A-Z]{2}\d{4}$/.test(normalized)) return `${normalized.slice(0, 2)}-${normalized.slice(2)}`;
  if (/^[A-Z]\d[A-Z]\d{3}$/.test(normalized)) return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
  return value.toUpperCase();
}

export function isValidRuc(value: string): boolean {
  if (!/^\d{11}$/.test(value)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((total, weight, index) => total + Number(value[index]) * weight, 0);
  const remainder = 11 - (sum % 11);
  const checkDigit = remainder % 10;
  return checkDigit === Number(value[10]);
}

export function computeValues(fields: DispatchField[], values: DispatchValues): DispatchValues {
  const computed = { ...values };
  const automaticFields = fields.filter((field) => field.tipo === "auto" && field.calculo);
  const fieldsById = new Map(fields.map((field) => [field.id, field]));
  const resolved = new Set<string>();
  const resolving = new Set<string>();

  function numericValue(fieldId: string): number {
    const field = fieldsById.get(fieldId);
    if (field?.tipo === "auto") return calculate(field);
    const rawValue = computed[fieldId];
    const number = Number(rawValue ?? 0);
    return Number.isFinite(number) ? number : 0;
  }

  function calculate(field: DispatchField): number {
    if (resolved.has(field.id)) return Number(computed[field.id] ?? 0) || 0;
    if (resolving.has(field.id) || !field.calculo) {
      computed[field.id] = "";
      return 0;
    }

    resolving.add(field.id);
    const calculation = field.calculo;
    const firstValue = numericValue(calculation.campo_a);
    const secondValue = numericValue(calculation.campo_b);
    let result = 0;

    if (calculation.operacion === "suma") result = firstValue + secondValue;
    if (calculation.operacion === "division") result = secondValue === 0 ? 0 : firstValue / secondValue;
    if (calculation.operacion === "promedio") result = (firstValue + secondValue) / 2;

    resolving.delete(field.id);
    resolved.add(field.id);
    computed[field.id] = Number.isFinite(result) ? result.toFixed(calculation.decimales ?? 0) : "";
    return Number(computed[field.id]) || 0;
  }

  automaticFields.forEach(calculate);

  return computed;
}

export function validateField(field: DispatchField, value: string | boolean | undefined): string | undefined {
  const textValue = typeof value === "boolean" ? "" : String(value ?? "").trim();
  if (field.obligatorio) {
    if (field.tipo === "checkbox" && value !== true) return "Debes marcar esta casilla.";
    if (field.tipo !== "checkbox" && field.tipo !== "auto" && textValue.length === 0) {
      return "Este dato es obligatorio.";
    }
  }

  if (!textValue || field.tipo === "auto" || field.tipo === "checkbox") return undefined;
  if (field.tipo === "select" && !field.opciones.includes(textValue)) {
    return "Selecciona una de las opciones disponibles.";
  }
  if (field.tipo === "numero" && (!/^\d+$/.test(textValue) || Number(textValue) < 0)) {
    return "Ingresa un número entero igual o mayor que cero.";
  }
  if (field.tipo === "decimal" && (!/^\d+(\.\d+)?$/.test(textValue) || Number(textValue) < 0)) {
    return "Ingresa un número igual o mayor que cero.";
  }
  if (field.tipo === "ruc" && !isValidRuc(textValue)) return "Ingresa un RUC válido de 11 dígitos.";
  if (field.tipo === "dni" && !/^\d{8}$/.test(textValue)) return "El DNI debe tener exactamente 8 dígitos.";
  if (field.tipo === "placa" && !/^(?:[A-Z]{3}-\d{3}|[A-Z]{2}-\d{4}|[A-Z]\d[A-Z]-\d{3})$/.test(normalizePlate(textValue))) {
    return "Revisa la placa. Usa un formato peruano, por ejemplo ABC-123.";
  }
  if (field.tipo === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(textValue)) {
    return "Ingresa un correo electrónico válido.";
  }
  if (field.tipo === "telefono" && !/^\+?[\d\s()-]{7,15}$/.test(textValue)) {
    return "Ingresa un teléfono válido.";
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
      (field.maxlength !== undefined && (!Number.isInteger(field.maxlength) || field.maxlength < 1))
    ) return false;

    if (field.tipo === "auto" && field.calculo === undefined) return false;
    if (field.calculo !== undefined) {
      const calculation = field.calculo;
      if (
        !calculation ||
        !["suma", "division", "promedio"].includes(calculation.operacion) ||
        typeof calculation.campo_a !== "string" ||
        typeof calculation.campo_b !== "string" ||
        (calculation.decimales !== undefined && (!Number.isInteger(calculation.decimales) || calculation.decimales < 0 || calculation.decimales > 4))
      ) return false;
    }

    fieldIds.add(field.id);
  }

  const numericFieldIds = new Set(
    fields
      .filter((field) => field.tipo === "numero" || field.tipo === "decimal" || field.tipo === "auto")
      .map((field) => field.id),
  );
  for (const field of fields) {
    if (
      field.tipo === "auto" &&
      (!field.calculo ||
        field.calculo.campo_a === field.id ||
        field.calculo.campo_b === field.id ||
        !numericFieldIds.has(field.calculo.campo_a) ||
        !numericFieldIds.has(field.calculo.campo_b))
    ) return false;
  }

  const completed = new Set<string>();
  const inProgress = new Set<string>();
  function visitCalculation(fieldId: string): boolean {
    if (completed.has(fieldId)) return true;
    if (inProgress.has(fieldId)) return false;
    inProgress.add(fieldId);
    const field = fields.find((candidate) => candidate.id === fieldId);
    if (field?.tipo === "auto" && field.calculo) {
      if (!visitCalculation(field.calculo.campo_a) || !visitCalculation(field.calculo.campo_b)) return false;
    }
    inProgress.delete(fieldId);
    completed.add(fieldId);
    return true;
  }
  for (const field of fields) {
    if (field.tipo === "auto" && !visitCalculation(field.id)) return false;
  }

  return true;
}

export function createsCalculationCycle(
  fields: DispatchField[],
  targetId: string | undefined,
  firstSource: string,
  secondSource: string,
): boolean {
  if (!targetId) return false;
  const byId = new Map(fields.map((field) => [field.id, field]));
  const visited = new Set<string>();

  function reachesTarget(fieldId: string): boolean {
    if (fieldId === targetId) return true;
    if (visited.has(fieldId)) return false;
    visited.add(fieldId);
    const field = byId.get(fieldId);
    if (field?.tipo !== "auto" || !field.calculo) return false;
    return reachesTarget(field.calculo.campo_a) || reachesTarget(field.calculo.campo_b);
  }

  return reachesTarget(firstSource) || reachesTarget(secondSource);
}

export function sortSchema(schema: DispatchSchema): DispatchSchema {
  return {
    secciones: [...schema.secciones].sort((a, b) => a.orden - b.orden),
    campos: [...schema.campos].sort((a, b) => a.orden - b.orden),
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
