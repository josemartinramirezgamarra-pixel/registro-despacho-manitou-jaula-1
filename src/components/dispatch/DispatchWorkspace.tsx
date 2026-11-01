"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bird,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  FileDown,
  FileJson2,
  FileSpreadsheet,
  FolderPlus,
  ListChecks,
  MapPin,
  Pencil,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  Upload,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { DispatchFormField } from "@/components/dispatch/DispatchFormField";
import { EmptyState } from "@/components/dispatch/EmptyState";
import { FieldEditorDialog } from "@/components/dispatch/FieldEditorDialog";
import { IconButton } from "@/components/dispatch/IconButton";
import { InfoLine } from "@/components/dispatch/InfoLine";
import { MetricCard } from "@/components/dispatch/MetricCard";
import { RecordDetails } from "@/components/dispatch/RecordDetails";
import {
  DEFAULT_SCHEMA,
  FIELD_TYPE_LABELS,
  LEGACY_RECORDS_STORAGE_KEY,
  RECORDS_STORAGE_KEY,
  SCHEMA_STORAGE_KEY,
  computeValues,
  createInitialValues,
  isDispatchSchema,
  localDateValue,
  makeStableId,
  sortSchema,
  validateField,
  type DispatchField,
  type DispatchRecord,
  type DispatchSchema,
  type DispatchSection,
  type DispatchValues,
} from "@/lib/dispatch-model";

type WorkspaceTab = "nuevo" | "registros" | "resumen" | "campos";

interface ToastMessage {
  id: number;
  title: string;
  detail?: string;
  kind: "success" | "info" | "error";
}

type ConfirmationTarget =
  | { type: "record"; id: string }
  | { type: "field"; id: string }
  | { type: "section"; id: string }
  | { type: "reset" }
  | null;

interface PendingBackup {
  esquema?: DispatchSchema;
  registros: DispatchRecord[];
}

const NAV_ITEMS: Array<{
  id: WorkspaceTab;
  label: string;
  description: string;
  icon: typeof ClipboardList;
}> = [
  { id: "nuevo", label: "Nuevo registro", description: "Registrar", icon: ClipboardList },
  { id: "registros", label: "Registros", description: "Historial", icon: FileSpreadsheet },
  { id: "resumen", label: "Resumen", description: "Indicadores", icon: ListChecks },
  { id: "campos", label: "Campos", description: "Personalizar", icon: Settings2 },
];

const TAB_COPY: Record<WorkspaceTab, { eyebrow: string }> = {
  nuevo: {
    eyebrow: "Nuevo registro",
  },
  registros: {
    eyebrow: "Historial de registros",
  },
  resumen: {
    eyebrow: "Resumen de operación",
  },
  campos: {
    eyebrow: "Personaliza el formulario",
  },
};

function copySchema(schema: DispatchSchema): DispatchSchema {
  return {
    secciones: schema.secciones.map((section) => ({ ...section })),
    campos: schema.campos.map((field) => ({
      ...field,
      opciones: [...field.opciones],
    })),
  };
}

function getStoredRecords(value: unknown): DispatchRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter((record): record is DispatchRecord => {
    if (!record || typeof record !== "object") return false;
    const candidate = record as Partial<DispatchRecord>;
    const values = candidate.valores;
    const labels = candidate.etiquetas;
    return (
      typeof candidate.id === "string" &&
      typeof candidate.creado_en === "string" &&
      (candidate.estado_sync === "pendiente" || candidate.estado_sync === "sincronizado") &&
      Boolean(values) &&
      typeof values === "object" &&
      !Array.isArray(values) &&
      Object.values(values).every((item) => typeof item === "string" || typeof item === "boolean") &&
      Boolean(labels) &&
      typeof labels === "object" &&
      !Array.isArray(labels) &&
      Object.values(labels).every((label) => typeof label === "string")
    );
  });
}

function makeDownload(content: string, type: string, filename: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function quoteCsv(value: unknown): string {
  const text = typeof value === "boolean" ? (value ? "Sí" : "No") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-PE").format(value);
}

function totalBirds(values: DispatchValues): number {
  return (Number(values.varones) || 0) + (Number(values.mujeres) || 0);
}

function migrateLegacyRecords(records: DispatchRecord[]): DispatchRecord[] {
  const legacyIds: Record<string, string[]> = {
    fecha: ["fecha"],
    plantel: ["plantel"],
    galpon: ["galpon", "galpon-lote"],
    placa: ["placa", "placa-camion"],
    grupo: ["grupo"],
    coordinador: ["coordinador", "responsable"],
    varones: ["varones", "machos"],
    mujeres: ["mujeres", "hembras"],
    jabas: ["jabas"],
    densidad: ["densidad"],
    "estiba-inicio": ["estiba-inicio"],
    "estiba-termino": ["estiba-termino"],
  };
  const labels = Object.fromEntries(DEFAULT_SCHEMA.campos.map((field) => [field.id, field.etiqueta]));

  return records.map((record) => {
    const valores: DispatchValues = {};
    Object.entries(legacyIds).forEach(([fieldId, candidates]) => {
      const value = candidates.map((id) => record.valores[id]).find((item) => typeof item === "string");
      if (typeof value === "string") valores[fieldId] = value;
    });
    return { ...record, estado_sync: "pendiente", valores, etiquetas: labels };
  });
}

export function DispatchWorkspace() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("nuevo");
  const [schema, setSchema] = useState<DispatchSchema>(() => copySchema(DEFAULT_SCHEMA));
  const [records, setRecords] = useState<DispatchRecord[]>([]);
  const [formValues, setFormValues] = useState<DispatchValues>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [fieldBeingEdited, setFieldBeingEdited] = useState<DispatchField | undefined>();
  const [fieldInitialSection, setFieldInitialSection] = useState<string | undefined>();
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [sectionBeingEdited, setSectionBeingEdited] = useState<string | null>(null);
  const [sectionDraft, setSectionDraft] = useState("");
  const [sectionError, setSectionError] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationTarget>(null);
  const [detailRecord, setDetailRecord] = useState<DispatchRecord | null>(null);
  const [searchText, setSearchText] = useState("");
  const [plantelFilter, setPlantelFilter] = useState("all");
  const [pendingBackup, setPendingBackup] = useState<PendingBackup | null>(null);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const schemaInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const firstInvalidRef = useRef<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let storedSchema: DispatchSchema = copySchema(DEFAULT_SCHEMA);
    let storedRecords: DispatchRecord[] = [];

    try {
      const parsedSchema: unknown = JSON.parse(localStorage.getItem(SCHEMA_STORAGE_KEY) ?? "null");
      if (isDispatchSchema(parsedSchema)) storedSchema = sortSchema(parsedSchema);
    } catch {
      storedSchema = copySchema(DEFAULT_SCHEMA);
    }

    try {
      const currentRecords = localStorage.getItem(RECORDS_STORAGE_KEY);
      if (currentRecords !== null) {
        storedRecords = getStoredRecords(JSON.parse(currentRecords));
      } else {
        const legacyRecords = localStorage.getItem(LEGACY_RECORDS_STORAGE_KEY);
        storedRecords = migrateLegacyRecords(getStoredRecords(JSON.parse(legacyRecords ?? "[]")));
      }
    } catch {
      storedRecords = [];
    }

    setSchema(storedSchema);
    setRecords(storedRecords);
    const lastPlantel = [...storedRecords]
      .sort((first, second) => second.creado_en.localeCompare(first.creado_en))
      .find((record) => typeof record.valores.plantel === "string")?.valores.plantel;
    setFormValues(createInitialValues(typeof lastPlantel === "string" ? lastPlantel : undefined));
    setOnline(navigator.onLine);
    setReady(true);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(schema));
  }, [ready, schema]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
  }, [ready, records]);

  const sortedSchema = useMemo(() => sortSchema(schema), [schema]);
  const currentTabCopy = TAB_COPY[activeTab];
  const computedValues = useMemo(
    () => computeValues(sortedSchema.campos, formValues),
    [formValues, sortedSchema.campos],
  );
  const visibleRecords = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase("es");
    return [...records]
      .filter((record) => plantelFilter === "all" || String(record.valores.plantel ?? "") === plantelFilter)
      .filter((record) => {
        if (!query) return true;
        const searchable = ["plantel", "galpon", "placa", "coordinador", "grupo"]
          .map((id) => String(record.valores[id] ?? ""))
          .join(" ");
        return searchable.toLocaleLowerCase("es").includes(query);
      })
      .sort((first, second) => second.creado_en.localeCompare(first.creado_en));
  }, [plantelFilter, records, searchText]);

  const plantelOptions = useMemo(() => {
    const values = records
      .map((record) => record.valores.plantel)
      .filter((value): value is string => typeof value === "string" && value.length > 0);
    return [...new Set(values)].sort((first, second) => first.localeCompare(second, "es"));
  }, [records]);

  const summary = useMemo(() => {
    const today = localDateValue();
    const byPlantel = new Map<string, { registros: number; varones: number; mujeres: number; aves: number }>();
    let totalVarones = 0;
    let totalMujeres = 0;
    let totalAves = 0;
    let todayRecords = 0;

    records.forEach((record) => {
      const varones = Number(record.valores.varones ?? 0) || 0;
      const mujeres = Number(record.valores.mujeres ?? 0) || 0;
      const birds = varones + mujeres;
      const plantel = String(record.valores.plantel ?? "Sin plantel");
      totalVarones += varones;
      totalMujeres += mujeres;
      totalAves += birds;
      if (record.valores.fecha === today) todayRecords += 1;
      const current = byPlantel.get(plantel) ?? { registros: 0, varones: 0, mujeres: 0, aves: 0 };
      current.registros += 1;
      current.varones += varones;
      current.mujeres += mujeres;
      current.aves += birds;
      byPlantel.set(plantel, current);
    });

    return {
      totalVarones,
      totalMujeres,
      totalAves,
      todayRecords,
      byPlantel: [...byPlantel.entries()]
        .map(([plantel, values]) => ({ plantel, ...values }))
        .sort((first, second) => second.aves - first.aves),
    };
  }, [records]);

  function showToast(title: string, detail?: string, kind: ToastMessage["kind"] = "success") {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ id: Date.now(), title, detail, kind });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4200);
  }

  function updateValue(fieldId: string, value: string | boolean) {
    setFormValues((current) => computeValues(sortedSchema.campos, { ...current, [fieldId]: value }));
    setFieldErrors((current) => {
      if (!current[fieldId]) return current;
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const latestValues = computeValues(sortedSchema.campos, formValues);
    const nextErrors: Record<string, string> = {};
    sortedSchema.campos.forEach((field) => {
      const error = validateField(field, latestValues[field.id]);
      if (error) nextErrors[field.id] = error;
    });

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      firstInvalidRef.current = Object.keys(nextErrors)[0];
      requestAnimationFrame(() => {
        const invalidField = firstInvalidRef.current;
        if (!invalidField) return;
        const element = document.getElementById(`dispatch-${invalidField}`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
        element?.focus({ preventScroll: true });
      });
      showToast("Revisa los datos marcados", "Hay información que necesita corregirse antes de guardar.", "error");
      return;
    }

    const now = new Date();
    const labels = Object.fromEntries(sortedSchema.campos.map((field) => [field.id, field.etiqueta]));
    if (editingRecordId) {
      const existing = records.find((record) => record.id === editingRecordId);
      if (!existing) {
        showToast("No encontramos ese despacho", "Actualiza la lista e inténtalo de nuevo.", "error");
        return;
      }
      setRecords((current) =>
        current.map((record) =>
          record.id === editingRecordId
            ? {
                ...record,
                valores: { ...record.valores, ...latestValues },
                etiquetas: { ...record.etiquetas, ...labels },
              }
            : record,
        ),
      );
      showToast("Registro actualizado", "Los cambios quedaron guardados en este dispositivo.");
    } else {
      const newRecord: DispatchRecord = {
        id: crypto.randomUUID(),
        creado_en: now.toISOString(),
        estado_sync: "pendiente",
        valores: latestValues,
        etiquetas: labels,
      };
      setRecords((current) => [newRecord, ...current]);
      showToast("Registro guardado", "El registro quedó guardado en este dispositivo.");
    }

    const plantel = typeof latestValues.plantel === "string" ? latestValues.plantel : undefined;
    const fecha = typeof latestValues.fecha === "string" ? latestValues.fecha : undefined;
    setFormValues(createInitialValues(plantel, fecha));
    setFieldErrors({});
    setEditingRecordId(null);
    setActiveTab("nuevo");
  }

  function startEditingRecord(record: DispatchRecord) {
    setEditingRecordId(record.id);
    setFormValues(computeValues(sortedSchema.campos, { ...record.valores }));
    setFieldErrors({});
    setActiveTab("nuevo");
    showToast("Despacho listo para editar", "Al guardar, se actualizará este registro.", "info");
  }

  function cancelRecordEdit() {
    setEditingRecordId(null);
    const plantel = typeof formValues.plantel === "string" ? formValues.plantel : undefined;
    const fecha = typeof formValues.fecha === "string" ? formValues.fecha : undefined;
    setFormValues(createInitialValues(plantel, fecha));
    setFieldErrors({});
    showToast("Edición cancelada", "El registro original no se modificó.", "info");
  }

  function openFieldEditor(field?: DispatchField, sectionId?: string) {
    setFieldBeingEdited(field);
    setFieldInitialSection(sectionId);
    setFieldDialogOpen(true);
  }

  function saveField(fieldDraft: Omit<DispatchField, "id" | "orden"> & { id?: string }) {
    const existing = fieldDraft.id ? sortedSchema.campos.find((field) => field.id === fieldDraft.id) : undefined;
    setSchema((current) => {
      const nextFields = current.campos.filter((field) => field.id !== existing?.id);
      const currentOrder = current.campos
        .filter((field) => field.seccion_id === fieldDraft.seccion_id && field.id !== existing?.id)
        .reduce((maximum, field) => Math.max(maximum, field.orden), -1);
      const nextField: DispatchField = {
        ...fieldDraft,
        id: existing?.id ?? makeStableId(fieldDraft.etiqueta),
        orden: existing?.seccion_id === fieldDraft.seccion_id ? existing.orden : currentOrder + 1,
      };
      return { ...current, campos: [...nextFields, nextField] };
    });
    setFieldBeingEdited(undefined);
    showToast(existing ? "Campo actualizado" : "Campo agregado", "El formulario ya usa este cambio.");
  }

  function duplicateField(field: DispatchField) {
    const label = `Copia de ${field.etiqueta}`;
    const nextField: DispatchField = {
      ...field,
      id: makeStableId(label),
      etiqueta: label,
      orden:
        sortedSchema.campos
          .filter((item) => item.seccion_id === field.seccion_id)
          .reduce((maximum, item) => Math.max(maximum, item.orden), -1) + 1,
      opciones: [...field.opciones],
    };
    setSchema((current) => ({ ...current, campos: [...current.campos, nextField] }));
    showToast("Campo duplicado", "Puedes cambiar su nombre y configuración.");
  }

  function toggleFieldRequired(fieldId: string, required: boolean) {
    setSchema((current) => ({
      ...current,
      campos: current.campos.map((field) =>
        field.id === fieldId ? { ...field, obligatorio: required } : field,
      ),
    }));
  }

  function moveField(fieldId: string, direction: -1 | 1) {
    const field = sortedSchema.campos.find((item) => item.id === fieldId);
    if (!field) return;
    const group = sortedSchema.campos.filter((item) => item.seccion_id === field.seccion_id);
    const index = group.findIndex((item) => item.id === fieldId);
    const other = group[index + direction];
    if (!other) return;
    setSchema((current) => ({
      ...current,
      campos: current.campos.map((item) =>
        item.id === field.id ? { ...item, orden: other.orden } : item.id === other.id ? { ...item, orden: field.orden } : item,
      ),
    }));
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    const ordered = sortedSchema.secciones;
    const index = ordered.findIndex((section) => section.id === sectionId);
    const other = ordered[index + direction];
    if (!other) return;
    setSchema((current) => ({
      ...current,
      secciones: current.secciones.map((section) =>
        section.id === sectionId ? { ...section, orden: other.orden } : section.id === other.id ? { ...section, orden: ordered[index].orden } : section,
      ),
    }));
  }

  function openSectionDialog(section?: DispatchSection) {
    setSectionBeingEdited(section?.id ?? null);
    setSectionDraft(section?.titulo ?? "");
    setSectionError("");
    setSectionDialogOpen(true);
  }

  function saveSection() {
    const title = sectionDraft.trim();
    if (!title) {
      setSectionError("Escribe un nombre para la sección.");
      return;
    }
    if (sortedSchema.secciones.some((section) => section.id !== sectionBeingEdited && section.titulo.toLocaleLowerCase("es") === title.toLocaleLowerCase("es"))) {
      setSectionError("Ya existe una sección con ese nombre.");
      return;
    }
    if (sectionBeingEdited) {
      setSchema((current) => ({
        ...current,
        secciones: current.secciones.map((section) => section.id === sectionBeingEdited ? { ...section, titulo: title } : section),
      }));
      showToast("Sección renombrada", "La organización del formulario se actualizó.");
    } else {
      const id = makeStableId(title);
      setSchema((current) => ({
        ...current,
        secciones: [...current.secciones, { id, titulo: title, orden: current.secciones.length }],
      }));
      showToast("Sección agregada", "Ya puedes añadir campos en ella.");
    }
    setSectionDialogOpen(false);
  }

  function confirmAction() {
    if (!confirmation) return;
    if (confirmation.type === "record") {
      setRecords((current) => current.filter((record) => record.id !== confirmation.id));
      showToast("Despacho eliminado", "El registro se quitó de este dispositivo.", "info");
    }
    if (confirmation.type === "field") {
      const removed = sortedSchema.campos.find((field) => field.id === confirmation.id);
      setSchema((current) => ({ ...current, campos: current.campos.filter((field) => field.id !== confirmation.id) }));
      showToast("Campo eliminado", removed ? `Los registros anteriores conservan “${removed.etiqueta}”.` : "Los registros anteriores conservan sus datos.", "info");
    }
    if (confirmation.type === "section") {
      const removed = sortedSchema.secciones.find((section) => section.id === confirmation.id);
      setSchema((current) => ({
        secciones: current.secciones.filter((section) => section.id !== confirmation.id),
        campos: current.campos.filter((field) => field.seccion_id !== confirmation.id),
      }));
      showToast("Sección eliminada", removed ? `Los datos guardados de “${removed.titulo}” no se borraron.` : "Los registros anteriores se mantienen.", "info");
    }
    if (confirmation.type === "reset") {
      const defaultSchema = copySchema(DEFAULT_SCHEMA);
      setSchema(defaultSchema);
      showToast("Formulario restaurado", "Volvieron los campos originales; tus registros siguen guardados.", "info");
    }
    setConfirmation(null);
  }

  function exportSchema() {
    makeDownload(JSON.stringify(schema, null, 2), "application/json;charset=utf-8", "esquema-despacho-manitou.json");
    showToast("Esquema exportado", "Puedes importarlo en otro dispositivo.", "info");
  }

  function exportBackup() {
  makeDownload(
      JSON.stringify({ esquema: schema, registros: records }, null, 2),
      "application/json;charset=utf-8",
      "respaldo-despacho-manitou.json",
    );
    showToast("Respaldo descargado", `${records.length} registros incluidos.`, "info");
  }

  function exportCsv() {
    const columns = [
      ["fecha", "Fecha"],
      ["plantel", "Plantel"],
      ["galpon", "Galpón"],
      ["placa", "Placa"],
      ["grupo", "Grupo"],
      ["coordinador", "Coordinador"],
      ["varones", "Varones"],
      ["mujeres", "Mujeres"],
      ["jabas", "Jabas"],
      ["densidad", "Densidad"],
      ["estiba-inicio", "Estiba inicio"],
      ["estiba-termino", "Estiba término"],
    ] as const;
    const rows = [
      [...columns.map(([, label]) => quoteCsv(label)), quoteCsv("Total de aves")].join(","),
      ...visibleRecords.map((record) => [
        ...columns.map(([id]) => quoteCsv(record.valores[id])),
        quoteCsv(totalBirds(record.valores)),
      ].join(",")),
    ];
    makeDownload(`\uFEFF${rows.join("\r\n")}`, "text/csv;charset=utf-8", "registros-despacho-manitou.csv");
    showToast("CSV descargado", `${visibleRecords.length} registros exportados.`, "info");
  }

  function readImportFile(event: ChangeEvent<HTMLInputElement>, kind: "schema" | "backup") {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result ?? ""));
        if (kind === "schema") {
          if (!isDispatchSchema(parsed)) throw new Error("El archivo no contiene un esquema de campos válido.");
          const incoming = sortSchema(parsed);
          if (!incoming.secciones.length || incoming.campos.some((field) => !incoming.secciones.some((section) => section.id === field.seccion_id))) {
            throw new Error("Cada campo necesita pertenecer a una sección existente.");
          }
          setSchema(incoming);
          showToast("Esquema importado", "El nuevo formato se aplicó sin borrar tus despachos.");
          return;
        }

        if (!parsed || typeof parsed !== "object") throw new Error("El archivo no tiene el formato de respaldo esperado.");
        const candidate = parsed as { esquema?: unknown; registros?: unknown };
        if (!Array.isArray(candidate.registros)) throw new Error("No encontramos una lista de registros en el respaldo.");
        const incomingSchema = isDispatchSchema(candidate.esquema) ? sortSchema(candidate.esquema) : undefined;
        const parsedRecords = getStoredRecords(candidate.registros);
        const incomingRecords = incomingSchema ? parsedRecords : migrateLegacyRecords(parsedRecords);
        setPendingBackup({ esquema: incomingSchema, registros: incomingRecords });
        setBackupDialogOpen(true);
      } catch (error) {
        showToast("No se pudo importar", error instanceof Error ? error.message : "Revisa el archivo e inténtalo otra vez.", "error");
      }
    };
    reader.onerror = () => showToast("No se pudo leer el archivo", "Vuelve a intentarlo.", "error");
    reader.readAsText(file);
  }

  function applyBackup(mode: "merge" | "replace") {
    if (!pendingBackup) return;
    if (mode === "replace") {
      setRecords(pendingBackup.registros);
      if (pendingBackup.esquema) setSchema(pendingBackup.esquema);
    } else {
      setRecords((current) => {
        const known = new Set(current.map((record) => record.id));
        return [...pendingBackup.registros.filter((record) => !known.has(record.id)), ...current];
      });
      if (pendingBackup.esquema) setSchema(pendingBackup.esquema);
    }
    const restoredRecords = mode === "replace" ? pendingBackup.registros : [...pendingBackup.registros, ...records];
    const lastPlantel = restoredRecords.find((record) => typeof record.valores.plantel === "string")?.valores.plantel;
    setFormValues(createInitialValues(typeof lastPlantel === "string" ? lastPlantel : undefined));
    setPendingBackup(null);
    setBackupDialogOpen(false);
    showToast(mode === "replace" ? "Respaldo restaurado" : "Respaldo combinado", `${pendingBackup.registros.length} registros del archivo procesados.`);
  }

  function exportCurrentTab() {
    if (activeTab === "campos") exportSchema();
    else if (activeTab === "registros") exportCsv();
    else exportBackup();
  }

  const confirmationContent = confirmation ? {
    record: {
      title: "¿Eliminar este registro?",
      description: "Se quitará de este dispositivo. Esta acción no se puede deshacer.",
      action: "Eliminar registro",
    },
    field: {
      title: "¿Eliminar este campo?",
      description: "Dejará de aparecer en el formulario. Los datos ya guardados se conservan en cada registro.",
      action: "Eliminar campo",
    },
    section: {
      title: "¿Eliminar esta sección?",
      description: "La sección y sus campos dejarán de estar en el formulario. Los registros anteriores no se borran.",
      action: "Eliminar sección",
    },
    reset: {
      title: "¿Restaurar el formulario original?",
      description: "Se reemplazan las secciones y campos actuales. Tus despachos guardados permanecen intactos.",
      action: "Restaurar formulario",
    },
  }[confirmation.type] : null;

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-border bg-card px-4 py-5 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="grid size-11 place-items-center rounded-[14px] bg-primary text-primary-foreground shadow-sm">
            <Bird size={23} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight">Registro Despacho</p>
            <p className="truncate text-xs text-muted-foreground">Manitou jaula</p>
          </div>
        </div>

        <div className="mt-10 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Operación diaria</div>
        <nav className="mt-3 flex flex-col gap-1" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const selected = item.id === activeTab;
            return (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                onClick={() => setActiveTab(item.id)}
                aria-current={selected ? "page" : undefined}
                className={`h-12 w-full justify-start gap-3 rounded-xl px-3 text-left ${selected ? "bg-primary/10 font-semibold text-primary hover:bg-primary/15 hover:text-primary" : "text-muted-foreground"}`}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span className="flex-1">{item.label}</span>
                {item.id === "registros" && records.length > 0 ? (
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs tabular-nums">{records.length}</span>
                ) : null}
              </Button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-[14px] border border-border bg-background p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {online ? <Wifi size={16} className="text-primary" /> : <WifiOff size={16} className="text-destructive" />}
            {online ? "En línea" : "Sin conexión"}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">El registro queda guardado en este dispositivo.</p>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col lg:pl-[250px]">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="mx-auto flex min-h-[76px] w-full max-w-[1480px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
            <div className="min-w-0">
              <p className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-primary sm:block">{currentTabCopy.eyebrow}</p>
              <h1 className="truncate text-base font-bold tracking-tight sm:mt-0.5 sm:text-xl">Registro Despacho Manitou jaula</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">Control de despachos de jaula</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className={`flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold ${online ? "border-primary/20 bg-primary/5 text-primary" : "border-destructive/20 bg-destructive/5 text-destructive"}`}>
                {online ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span className="hidden sm:inline">{online ? "En línea" : "Sin conexión"}</span>
                <span className="sm:hidden">{online ? "En línea" : "Sin red"}</span>
              </div>
              {activeTab === "nuevo" ? null : (
                <Button variant="outline" onClick={exportCurrentTab} className="min-h-10 gap-2 px-3">
                  <Download size={16} />
                  <span className="hidden sm:inline">{activeTab === "campos" ? "Exportar esquema" : activeTab === "registros" ? "Exportar CSV" : "Respaldo"}</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pb-12 sm:pt-7 lg:px-10">
          {activeTab === "nuevo" ? (
            <section className="mx-auto max-w-[1080px]">
              <div className="mb-4 flex min-h-11 items-center justify-between gap-3">
                <p className="text-sm font-semibold text-muted-foreground">{editingRecordId ? "Editando registro" : "Completa los datos del despacho"}</p>
                {editingRecordId ? (
                  <Button variant="outline" onClick={cancelRecordEdit} className="min-h-11 gap-2 bg-card">
                    <X size={16} /> Cancelar edición
                  </Button>
                ) : null}
              </div>

              {sortedSchema.secciones.length === 0 ? (
                <EmptyState
                  icon={Settings2}
                  title="Aún no hay secciones"
                  description="Crea una sección desde Campos para empezar a armar tu formulario."
                  actionLabel="Personalizar campos"
                  onAction={() => setActiveTab("campos")}
                />
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {sortedSchema.secciones.map((section, sectionIndex) => {
                    const sectionFields = sortedSchema.campos
                      .filter((field) => field.seccion_id === section.id)
                      .sort((first, second) => first.orden - second.orden);
                    return (
                      <section key={section.id} className="overflow-hidden rounded-[16px] border border-border bg-card shadow-[0_2px_10px_hsl(174_31%_13%/0.035)]">
                        <div className="flex items-center gap-3 border-b border-border bg-[linear-gradient(90deg,hsl(156_35%_95%),hsl(0_0%_100%))] px-4 py-4 sm:px-5">
                          <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-primary/15 bg-card text-sm font-bold tabular-nums text-primary">
                            {String(sectionIndex + 1).padStart(2, "0")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h2 className="truncate text-sm font-bold sm:text-base">{section.titulo}</h2>
                            <p className="text-xs text-muted-foreground">{sectionFields.length} {sectionFields.length === 1 ? "dato" : "datos"}</p>
                          </div>
                        </div>
                        {sectionFields.length > 0 ? (
                          <div className="grid gap-x-5 gap-y-5 p-4 sm:grid-cols-2 sm:p-5">
                            {sectionFields.map((field) => (
                              <div key={field.id} className={field.ancho === "completo" ? "sm:col-span-2" : ""}>
                                <DispatchFormField
                                  field={field}
                                  value={computedValues[field.id]}
                                  error={fieldErrors[field.id]}
                                  onChange={updateValue}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-5 py-8 text-center text-sm text-muted-foreground">No hay campos en esta sección.</div>
                        )}
                      </section>
                    );
                  })}
                  <div className="sticky bottom-[76px] z-10 -mx-1 rounded-[14px] border border-border/80 bg-background/95 p-2 shadow-[0_8px_24px_hsl(174_31%_13%/0.09)] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
                    <Button type="submit" className="min-h-14 w-full gap-2 rounded-[14px] text-base font-bold shadow-sm sm:w-auto sm:min-w-[240px]">
                      <CheckCircle2 size={19} />
                      {editingRecordId ? "Guardar cambios" : "Guardar registro"}
                    </Button>
                    <p className="mt-2 hidden text-xs text-muted-foreground sm:block">Se guarda en este dispositivo, incluso si no tienes conexión.</p>
                  </div>
                </form>
              )}
            </section>
          ) : null}

          {activeTab === "campos" ? (
            <section className="mx-auto max-w-[1120px]">
              <div className="mb-5 flex flex-col gap-4 rounded-[14px] border border-primary/20 bg-primary/[0.045] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Settings2 size={19} />
                  </div>
                  <p className="max-w-[60ch] text-sm leading-relaxed text-foreground/80">
                    Los cambios se aplican al instante. <span className="font-semibold text-foreground">Los despachos guardados no se borran.</span> Si eliminas un campo, sus datos anteriores seguirán en el detalle de cada registro.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => openFieldEditor(undefined, sortedSchema.secciones[0]?.id)} className="min-h-11 flex-1 gap-2 sm:flex-none">
                    <Plus size={17} /> Nuevo campo
                  </Button>
                  <Button variant="outline" onClick={() => openSectionDialog()} className="min-h-11 flex-1 gap-2 bg-card sm:flex-none">
                    <FolderPlus size={16} /> Nueva sección
                  </Button>
                </div>
              </div>

              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold">Tu formato de despacho</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{sortedSchema.campos.length} campos en {sortedSchema.secciones.length} secciones</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={exportSchema} className="min-h-11 gap-2 bg-card">
                    <FileJson2 size={16} /> Exportar esquema JSON
                  </Button>
                  <Button variant="outline" onClick={() => schemaInputRef.current?.click()} className="min-h-11 gap-2 bg-card">
                    <Upload size={16} /> Importar esquema
                  </Button>
                  <input ref={schemaInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => readImportFile(event, "schema")} />
                </div>
              </div>

              {sortedSchema.secciones.length === 0 ? (
                <EmptyState
                  icon={FolderPlus}
                  title="Crea la primera sección"
                  description="Agrupa datos relacionados para que el equipo encuentre cada campo con facilidad."
                  actionLabel="Agregar sección"
                  onAction={() => openSectionDialog()}
                />
              ) : (
                <div className="space-y-4">
                  {sortedSchema.secciones.map((section, sectionIndex) => {
                    const sectionFields = sortedSchema.campos
                      .filter((field) => field.seccion_id === section.id)
                      .sort((first, second) => first.orden - second.orden);
                    return (
                      <article key={section.id} className="overflow-hidden rounded-[16px] border border-border bg-card shadow-[0_2px_10px_hsl(174_31%_13%/0.035)]">
                        <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold tabular-nums text-primary">
                              {String(sectionIndex + 1).padStart(2, "0")}
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate font-bold">{section.titulo}</h3>
                              <p className="text-xs text-muted-foreground">{sectionFields.length} {sectionFields.length === 1 ? "campo" : "campos"}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 sm:justify-end">
                            <Button variant="outline" onClick={() => openSectionDialog(section)} className="min-h-10 gap-2 bg-card px-3 text-xs">
                              <Pencil size={14} /> Renombrar
                            </Button>
                            <Button variant="outline" onClick={() => openFieldEditor(undefined, section.id)} className="min-h-10 gap-2 bg-card px-3 text-xs">
                              <Plus size={14} /> Agregar campo aquí
                            </Button>
                            <IconButton label="Subir sección" disabled={sectionIndex === 0} onClick={() => moveSection(section.id, -1)}>
                              <ArrowUp size={16} />
                            </IconButton>
                            <IconButton label="Bajar sección" disabled={sectionIndex === sortedSchema.secciones.length - 1} onClick={() => moveSection(section.id, 1)}>
                              <ArrowDown size={16} />
                            </IconButton>
                            <IconButton label="Eliminar sección" destructive onClick={() => {
                              if (sortedSchema.secciones.length === 1) {
                                showToast("No se puede eliminar", "El formulario necesita conservar al menos una sección.", "error");
                                return;
                              }
                              setConfirmation({ type: "section", id: section.id });
                            }}>
                              <Trash2 size={16} />
                            </IconButton>
                          </div>
                        </div>

                        {sectionFields.length > 0 ? (
                          <div className="divide-y divide-border/80">
                            {sectionFields.map((field, index) => (
                              <div key={field.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <p className="font-semibold leading-snug">{field.etiqueta}</p>
                                    {field.obligatorio ? <Badge variant="secondary" className="h-6 border border-primary/15 bg-primary/5 text-[10px] text-primary">Obligatorio</Badge> : null}
                                  </div>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {FIELD_TYPE_LABELS[field.tipo]}
                                    {field.ayuda ? <span> · {field.ayuda}</span> : null}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <label className="mr-1 flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs text-muted-foreground">
                                    <Checkbox checked={field.obligatorio} onCheckedChange={(checked) => toggleFieldRequired(field.id, checked === true)} />
                                    Obligatorio
                                  </label>
                                  <IconButton label="Subir campo" disabled={index === 0} onClick={() => moveField(field.id, -1)}>
                                    <ArrowUp size={15} />
                                  </IconButton>
                                  <IconButton label="Bajar campo" disabled={index === sectionFields.length - 1} onClick={() => moveField(field.id, 1)}>
                                    <ArrowDown size={15} />
                                  </IconButton>
                                  <Button variant="outline" onClick={() => openFieldEditor(field)} className="min-h-10 gap-2 bg-card px-3 text-xs">
                                    <Pencil size={14} /> Editar
                                  </Button>
                                  <IconButton label="Duplicar campo" onClick={() => duplicateField(field)}>
                                    <Copy size={15} />
                                  </IconButton>
                                  <IconButton label="Eliminar campo" destructive onClick={() => setConfirmation({ type: "field", id: field.id })}>
                                    <Trash2 size={15} />
                                  </IconButton>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-start gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">Esta sección todavía no tiene campos.</p>
                            <Button variant="outline" onClick={() => openFieldEditor(undefined, section.id)} className="min-h-11 gap-2 bg-card">
                              <Plus size={16} /> Agregar primer campo
                            </Button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 rounded-[14px] border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <p className="font-semibold">¿Quieres volver al formato inicial?</p>
                  <p className="mt-1 text-sm text-muted-foreground">Restaurar no elimina ninguno de tus despachos guardados.</p>
                </div>
                <Button variant="outline" onClick={() => setConfirmation({ type: "reset" })} className="min-h-11 gap-2 bg-card">
                  <ArrowLeft size={16} /> Restaurar formulario por defecto
                </Button>
              </div>
            </section>
          ) : null}

          {activeTab === "registros" ? (
            <section className="mx-auto max-w-[1200px]">
              <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_240px]">
                <div className="relative">
                  <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Buscar plantel, galpón, placa, coordinador o grupo…"
                    aria-label="Buscar registros"
                    className="h-12 bg-card pl-10 text-base"
                  />
                </div>
                <Select value={plantelFilter} onValueChange={(value) => setPlantelFilter(value ?? "all")}>
                  <SelectTrigger className="h-12 w-full bg-card text-base" aria-label="Filtrar por plantel">
                    <MapPin size={16} className="mr-1 text-muted-foreground" />
                    <SelectValue placeholder="Todos los planteles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los planteles</SelectItem>
                    {plantelOptions.map((plantel) => <SelectItem key={plantel} value={plantel}>{plantel}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">{visibleRecords.length}</span> {visibleRecords.length === 1 ? "registro encontrado" : "registros encontrados"}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportCsv} className="min-h-10 gap-2 bg-card px-3 text-xs sm:text-sm">
                    <FileSpreadsheet size={15} /> CSV
                  </Button>
                  <Button variant="outline" onClick={exportBackup} className="min-h-10 gap-2 bg-card px-3 text-xs sm:text-sm">
                    <FileDown size={15} /> Respaldo
                  </Button>
                  <Button variant="outline" onClick={() => backupInputRef.current?.click()} className="min-h-10 gap-2 bg-card px-3 text-xs sm:text-sm">
                    <Upload size={15} /> <span className="hidden sm:inline">Importar</span>
                  </Button>
                  <input ref={backupInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => readImportFile(event, "backup")} />
                </div>
              </div>

              {visibleRecords.length === 0 ? (
                <EmptyState
                  icon={FileSpreadsheet}
                  title={records.length === 0 ? "Todavía no hay registros" : "No encontramos coincidencias"}
                  description={records.length === 0 ? "Cuando guardes un registro, aparecerá aquí para consultarlo o editarlo." : "Prueba con otra búsqueda o quita el filtro de plantel."}
                  actionLabel={records.length === 0 ? "Registrar ahora" : undefined}
                  onAction={records.length === 0 ? () => setActiveTab("nuevo") : undefined}
                />
              ) : (
                <div className="grid gap-3 xl:grid-cols-2">
                  {visibleRecords.map((record) => {
                    const birds = totalBirds(record.valores);
                    return (
                      <article key={record.id} className="rounded-[16px] border border-border bg-card p-4 shadow-[0_2px_10px_hsl(174_31%_13%/0.035)] sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold">{String(record.valores.plantel ?? "Sin plantel")}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{formatDate(String(record.valores.fecha ?? record.creado_en.slice(0, 10)))}</p>
                          </div>
                          <div className="rounded-xl bg-primary/5 px-3 py-2 text-right">
                            <p className="text-lg font-bold tabular-nums text-primary">{formatNumber(birds)}</p>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total de aves</p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                          <InfoLine label="Galpón" value={String(record.valores.galpon ?? "—")} />
                          <InfoLine label="Placa" value={String(record.valores.placa ?? "—")} />
                          <InfoLine label="Grupo" value={String(record.valores.grupo ?? "—")} />
                          <InfoLine label="Coordinador" value={String(record.valores.coordinador ?? "—")} />
                          <InfoLine label="Varones" value={String(record.valores.varones ?? "—")} />
                          <InfoLine label="Mujeres" value={String(record.valores.mujeres ?? "—")} />
                          <InfoLine label="Jabas" value={String(record.valores.jabas ?? "—")} />
                          <InfoLine label="Densidad" value={String(record.valores.densidad ?? "—")} />
                          <InfoLine label="Estiba" value={`${String(record.valores["estiba-inicio"] ?? "—")} – ${String(record.valores["estiba-termino"] ?? "—")}`} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                          <Button variant="outline" onClick={() => setDetailRecord(record)} className="min-h-11 flex-1 gap-2 bg-card sm:flex-none">
                            <ClipboardList size={15} /> Ver detalle
                          </Button>
                          <Button variant="outline" onClick={() => startEditingRecord(record)} className="min-h-11 flex-1 gap-2 bg-card sm:flex-none">
                            <Pencil size={15} /> Editar
                          </Button>
                          <Button variant="ghost" onClick={() => setConfirmation({ type: "record", id: record.id })} className="min-h-11 gap-2 px-3 text-destructive hover:bg-destructive/5 hover:text-destructive">
                            <Trash2 size={15} /> <span className="sm:hidden">Eliminar</span>
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "resumen" ? (
            <section className="mx-auto max-w-[1200px]">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <MetricCard label="Total de registros" value={formatNumber(records.length)} hint="En este dispositivo" icon={ClipboardList} tone="green" />
                <MetricCard label="Total de varones" value={formatNumber(summary.totalVarones)} hint="Todos los registros" icon={Bird} tone="blue" />
                <MetricCard label="Total de mujeres" value={formatNumber(summary.totalMujeres)} hint="Todos los registros" icon={Bird} tone="gold" />
                <MetricCard label="Total de aves" value={formatNumber(summary.totalAves)} hint="Varones + mujeres" icon={ListChecks} tone="slate" />
                <MetricCard label="Registros de hoy" value={formatNumber(summary.todayRecords)} hint={formatDate(localDateValue())} icon={CheckCircle2} tone="green" />
              </div>

              <div className="mt-6 overflow-hidden rounded-[16px] border border-border bg-card shadow-[0_2px_10px_hsl(174_31%_13%/0.035)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
                  <div>
                    <h2 className="font-bold">Registros por plantel</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Ordenados de mayor a menor por total de aves.</p>
                  </div>
                  <Badge variant="outline" className="h-7 gap-1.5 px-2.5 text-xs"><MapPin size={13} />{summary.byPlantel.length} {summary.byPlantel.length === 1 ? "plantel" : "planteles"}</Badge>
                </div>
                {summary.byPlantel.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead className="bg-muted/60 text-xs text-muted-foreground">
                        <tr>
                          <th scope="col" className="px-5 py-3 font-semibold">Plantel</th>
                          <th scope="col" className="px-5 py-3 text-right font-semibold">Registros</th>
                          <th scope="col" className="px-5 py-3 text-right font-semibold">Varones</th>
                          <th scope="col" className="px-5 py-3 text-right font-semibold">Mujeres</th>
                          <th scope="col" className="px-5 py-3 text-right font-semibold">Total de aves</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {summary.byPlantel.map((row) => (
                          <tr key={row.plantel}>
                            <th scope="row" className="px-5 py-4 font-semibold">{row.plantel}</th>
                            <td className="px-5 py-4 text-right tabular-nums">{formatNumber(row.registros)}</td>
                            <td className="px-5 py-4 text-right tabular-nums">{formatNumber(row.varones)}</td>
                            <td className="px-5 py-4 text-right tabular-nums">{formatNumber(row.mujeres)}</td>
                            <td className="px-5 py-4 text-right font-bold tabular-nums">{formatNumber(row.aves)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-5 py-12 text-center">
                    <p className="font-semibold">El resumen aparecerá aquí</p>
                    <p className="mt-1 text-sm text-muted-foreground">Guarda tu primer registro para empezar a ver los totales.</p>
                    <Button onClick={() => setActiveTab("nuevo")} className="mt-4 min-h-11 gap-2"><Plus size={16} /> Nuevo registro</Button>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-3 rounded-[14px] border border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-start gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldCheck size={17} /></div>
                  <div>
                    <p className="text-sm font-semibold">Tus datos se conservan en este dispositivo</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Descarga un respaldo JSON para guardar una copia o trasladarla a otro equipo.</p>
                  </div>
                </div>
                <Button variant="outline" onClick={exportBackup} className="min-h-11 gap-2 bg-card"><FileJson2 size={16} /> Descargar respaldo</Button>
              </div>
            </section>
          ) : null}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-1 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1 backdrop-blur-sm lg:hidden" aria-label="Navegación principal">
          <div className="mx-auto grid max-w-xl grid-cols-4 gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const selected = item.id === activeTab;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={selected ? "page" : undefined}
                  className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition-colors ${selected ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <Icon size={19} strokeWidth={selected ? 2.2 : 1.8} />
                  <span className="max-w-full truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <FieldEditorDialog
        open={fieldDialogOpen}
        onOpenChange={setFieldDialogOpen}
        sections={sortedSchema.secciones}
        fields={sortedSchema.campos}
        editingField={fieldBeingEdited}
        initialSectionId={fieldInitialSection}
        onSave={saveField}
      />

      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pr-8">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Organiza el formato</p>
            <DialogTitle>{sectionBeingEdited ? "Renombrar sección" : "Nueva sección"}</DialogTitle>
            <DialogDescription>Las secciones ayudan a encontrar rápido cada grupo de datos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="section-name">Nombre de la sección</Label>
            <Input id="section-name" value={sectionDraft} onChange={(event) => { setSectionDraft(event.target.value); setSectionError(""); }} autoFocus className="h-12 text-base" placeholder="Ej. Control de calidad" />
            {sectionError ? <p className="text-sm text-destructive" role="alert">{sectionError}</p> : null}
          </div>
          <DialogFooter className="flex-row justify-end">
            <Button variant="outline" onClick={() => setSectionDialogOpen(false)} className="min-h-11">Cancelar</Button>
            <Button onClick={saveSection} className="min-h-11">{sectionBeingEdited ? "Guardar nombre" : "Crear sección"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(confirmation)} onOpenChange={(open) => !open && setConfirmation(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pr-8">
            <div className="mb-1 grid size-10 place-items-center rounded-xl bg-destructive/10 text-destructive"><Trash2 size={18} /></div>
            <DialogTitle>{confirmationContent?.title}</DialogTitle>
            <DialogDescription>{confirmationContent?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end">
            <Button variant="outline" onClick={() => setConfirmation(null)} className="min-h-11">Conservar</Button>
            <Button variant="destructive" onClick={confirmAction} className="min-h-11">{confirmationContent?.action}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detailRecord)} onOpenChange={(open) => !open && setDetailRecord(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="pr-8">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Detalle del registro</p>
            <DialogTitle>{String(detailRecord?.valores.plantel ?? "Registro")}</DialogTitle>
            <DialogDescription>
              {detailRecord ? `${formatDate(String(detailRecord.valores.fecha ?? ""))} · Estiba ${String(detailRecord.valores["estiba-inicio"] ?? "—")} – ${String(detailRecord.valores["estiba-termino"] ?? "—")}` : ""}
            </DialogDescription>
          </DialogHeader>
          {detailRecord ? <RecordDetails record={detailRecord} schema={sortedSchema} /> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailRecord(null)} className="min-h-11">Cerrar</Button>
            {detailRecord ? <Button onClick={() => { startEditingRecord(detailRecord); setDetailRecord(null); }} className="min-h-11 gap-2"><Pencil size={15} /> Editar registro</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pr-8">
            <div className="mb-1 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><FileJson2 size={18} /></div>
            <DialogTitle>¿Cómo quieres importar el respaldo?</DialogTitle>
            <DialogDescription>
              {pendingBackup ? `El archivo incluye ${pendingBackup.registros.length} despachos${pendingBackup.esquema ? " y un formato de campos" : ""}.` : "Elige cómo combinar la información."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-1">
            <Button variant="outline" onClick={() => applyBackup("merge")} className="min-h-[60px] justify-start gap-3 bg-card px-4 text-left">
              <ArrowDown size={18} className="shrink-0 text-primary" />
              <span><span className="block font-semibold">Combinar con los actuales</span><span className="block text-xs font-normal text-muted-foreground">Conserva los registros existentes y agrega los nuevos.</span></span>
            </Button>
            <Button variant="outline" onClick={() => applyBackup("replace")} className="min-h-[60px] justify-start gap-3 bg-card px-4 text-left">
              <ArrowRight size={18} className="shrink-0 text-primary" />
              <span><span className="block font-semibold">Reemplazar por el respaldo</span><span className="block text-xs font-normal text-muted-foreground">Sustituye los registros actuales por los del archivo.</span></span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setBackupDialogOpen(false); setPendingBackup(null); }} className="min-h-11">Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast ? (
        <div className={`fixed bottom-[calc(78px+env(safe-area-inset-bottom))] left-4 right-4 z-[60] flex items-start gap-3 rounded-[14px] border bg-card px-4 py-3 shadow-lg sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-md ${toast.kind === "error" ? "border-destructive/30" : "border-primary/20"}`} role="status" aria-live="polite">
          <div className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${toast.kind === "error" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
            {toast.kind === "error" ? <X size={15} /> : toast.kind === "success" ? <Check size={15} /> : <CheckCircle2 size={15} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{toast.title}</p>
            {toast.detail ? <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{toast.detail}</p> : null}
          </div>
          <button type="button" onClick={() => setToast(null)} aria-label="Cerrar aviso" className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><X size={15} /></button>
        </div>
      ) : null}
    </div>
  );
}
