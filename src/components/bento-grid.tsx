"use client";

import { Info, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function BentoGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-12", className)}>
      {children}
    </div>
  );
}

const SPAN_CLASSES: Record<number, string> = {
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  12: "md:col-span-12",
};

export function BentoCard({
  span = 4,
  title,
  nota,
  hint,
  loading,
  updating,
  empty,
  className,
  onClick,
  expandible,
  children,
}: {
  span?: 4 | 5 | 6 | 7 | 8 | 12;
  title: string;
  /** Explicación fija de qué mide la tarjeta; se muestra en un tooltip junto al título. */
  nota?: string;
  hint?: string;
  loading?: boolean;
  /** Refetch en segundo plano (React Query + keepPreviousData): atenúa sin reemplazar por skeleton. */
  updating?: boolean;
  empty?: boolean;
  className?: string;
  /** Hace la tarjeta entera clicable (p. ej. para abrir un detalle). */
  onClick?: () => void;
  /** Marca la tarjeta como expandible cuando el clic vive en su contenido (p. ej. barras de un gráfico). */
  expandible?: boolean;
  children: React.ReactNode;
}) {
  const clicable = onClick != null && !loading && !empty;
  const conDetalle = (clicable || expandible) && !loading && !empty;

  return (
    <Card
      className={cn(
        "relative rounded-[20px] border border-border bg-card shadow-sm transition-opacity",
        SPAN_CLASSES[span],
        updating && "opacity-60",
        clicable && "cursor-pointer transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-primary",
        className
      )}
      {...(clicable
        ? {
            role: "button",
            tabIndex: 0,
            onClick,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            },
          }
        : {})}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          {title}
          {nota ? (
            <Tooltip>
              <TooltipTrigger
                aria-label={`Qué mide: ${title}`}
                className="rounded-full text-muted-foreground/60 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Info className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start">
                {nota}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </CardTitle>
        {conDetalle ? (
          <Maximize2
            aria-label="Ver detalle"
            className="absolute top-4 right-4 size-4 text-muted-foreground/60 transition-colors group-hover/card:text-primary"
          />
        ) : null}
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ) : empty ? (
          <p className="py-6 text-sm text-muted-foreground">Sin datos en este período</p>
        ) : (
          children
        )}
      </CardContent>
      {hint && !loading && !empty ? (
        <p className="px-(--card-spacing) text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </Card>
  );
}
