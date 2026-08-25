"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange as DayPickerRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { PRESETS, presetPorRango, type DateRange, type PresetId } from "@/lib/date-ranges";

function parseISODateLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatISODateLocal(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function formatLabel(range: DateRange): string {
  const from = parseISODateLocal(range.from);
  const to = parseISODateLocal(range.to);
  if (range.from === range.to) return format(from, "d MMM yyyy", { locale: es });
  return `${format(from, "d MMM yyyy", { locale: es })} – ${format(to, "d MMM yyyy", { locale: es })}`;
}

const CALENDAR_START_MONTH = new Date(2020, 0, 1);

function formatDraftLabel(range: DayPickerRange | undefined): string {
  if (!range?.from) return "Selecciona una fecha";
  if (!range.to) return format(range.from, "d MMM yyyy", { locale: es });
  return `${format(range.from, "d MMM yyyy", { locale: es })} – ${format(range.to, "d MMM yyyy", { locale: es })}`;
}

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DayPickerRange | undefined>({
    from: parseISODateLocal(value.from),
    to: parseISODateLocal(value.to),
  });
  const hoy = new Date();

  const activePreset: PresetId | null = presetPorRango(value);

  function aplicarPreset(id: PresetId) {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const rango = preset.getRange();
    onChange(rango);
    setDraft({ from: parseISODateLocal(rango.from), to: parseISODateLocal(rango.to) });
    setOpen(false);
  }

  function confirmar() {
    if (!draft?.from) return;
    const to = draft.to ?? draft.from;
    onChange({ from: formatISODateLocal(draft.from), to: formatISODateLocal(to) });
    setOpen(false);
  }

  function cancelar() {
    setDraft({ from: parseISODateLocal(value.from), to: parseISODateLocal(value.to) });
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraft({ from: parseISODateLocal(value.from), to: parseISODateLocal(value.to) });
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "justify-start gap-2 rounded-full border-border bg-card text-sm font-medium text-foreground"
            )}
          >
            <CalendarIcon className="size-4 text-muted-foreground" />
            {formatLabel(value)}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-col gap-1 p-3 sm:w-44">
            {PRESETS.map((preset) => (
              <Button
                key={preset.id}
                variant={activePreset === preset.id ? "secondary" : "ghost"}
                size="sm"
                className="justify-start"
                onClick={() => aplicarPreset(preset.id)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Separator orientation="vertical" className="hidden sm:block" />
          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-2.5">
              <span className="text-sm font-medium text-foreground">
                {formatDraftLabel(draft)}
              </span>
            </div>
            <Calendar
              mode="range"
              numberOfMonths={2}
              locale={es}
              selected={draft}
              onSelect={setDraft}
              defaultMonth={draft?.from}
              captionLayout="dropdown"
              startMonth={CALENDAR_START_MONTH}
              endMonth={hoy}
              disabled={{ after: hoy }}
            />
            <Separator />
            <div className="flex items-center justify-end gap-2 px-4 py-3">
              <Button variant="ghost" size="sm" onClick={cancelar}>
                Cancelar
              </Button>
              <Button size="sm" disabled={!draft?.from} onClick={confirmar}>
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
