import {
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  subMonths,
  format,
} from "date-fns";

export type DateRange = { from: string; to: string };

const BOGOTA_TZ = "America/Bogota";

/**
 * "Hoy" en Bogotá, representado como un Date construido con getters/setters
 * locales (no UTC) para que toda la aritmética de date-fns —que opera sobre
 * componentes locales— sea consistente sin depender de date-fns-tz.
 */
function hoyBogota(): Date {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOGOTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const y = Number(partes.find((p) => p.type === "year")!.value);
  const m = Number(partes.find((p) => p.type === "month")!.value);
  const d = Number(partes.find((p) => p.type === "day")!.value);

  return new Date(y, m - 1, d);
}

function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function rango(from: Date, to: Date): DateRange {
  return { from: toISODate(from), to: toISODate(to) };
}

export type PresetId =
  | "hoy"
  | "ayer"
  | "7d"
  | "14d"
  | "30d"
  | "este-mes"
  | "mes-pasado"
  | "este-anio"
  | "todo";

export type Preset = {
  id: PresetId;
  label: string;
  getRange: () => DateRange;
};

export const PRESETS: Preset[] = [
  {
    id: "hoy",
    label: "Hoy",
    getRange: () => {
      const hoy = hoyBogota();
      return rango(hoy, hoy);
    },
  },
  {
    id: "ayer",
    label: "Ayer",
    getRange: () => {
      const ayer = subDays(hoyBogota(), 1);
      return rango(ayer, ayer);
    },
  },
  {
    id: "7d",
    label: "Últimos 7 días",
    getRange: () => rango(subDays(hoyBogota(), 6), hoyBogota()),
  },
  {
    id: "14d",
    label: "Últimos 14 días",
    getRange: () => rango(subDays(hoyBogota(), 13), hoyBogota()),
  },
  {
    id: "30d",
    label: "Últimos 30 días",
    getRange: () => rango(subDays(hoyBogota(), 29), hoyBogota()),
  },
  {
    id: "este-mes",
    label: "Este mes",
    getRange: () => rango(startOfMonth(hoyBogota()), hoyBogota()),
  },
  {
    id: "mes-pasado",
    label: "Mes pasado",
    getRange: () => {
      const mesPasado = subMonths(hoyBogota(), 1);
      return rango(startOfMonth(mesPasado), endOfMonth(mesPasado));
    },
  },
  {
    id: "este-anio",
    label: "Este año",
    getRange: () => rango(startOfYear(hoyBogota()), hoyBogota()),
  },
  {
    id: "todo",
    label: "Todo el histórico",
    getRange: () => rango(new Date(2000, 0, 1), hoyBogota()),
  },
];

export const PRESET_POR_DEFECTO: PresetId = "30d";

export function rangoPorDefecto(): DateRange {
  return PRESETS.find((p) => p.id === PRESET_POR_DEFECTO)!.getRange();
}

export function presetPorRango(range: DateRange): PresetId | null {
  for (const preset of PRESETS) {
    const r = preset.getRange();
    if (r.from === range.from && r.to === range.to) return preset.id;
  }
  return null;
}

export function esRangoValido(
  from?: string | null,
  to?: string | null
): { from: string; to: string } | null {
  if (!from || !to) return null;
  const patron = /^\d{4}-\d{2}-\d{2}$/;
  if (!patron.test(from) || !patron.test(to) || from > to) return null;
  return { from, to };
}
