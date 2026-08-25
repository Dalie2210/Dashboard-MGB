import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
  hint,
  loading,
  updating,
  empty,
  className,
  children,
}: {
  span?: 4 | 5 | 6 | 7 | 8 | 12;
  title: string;
  hint?: string;
  loading?: boolean;
  /** Refetch en segundo plano (React Query + keepPreviousData): atenúa sin reemplazar por skeleton. */
  updating?: boolean;
  empty?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "rounded-[20px] border border-border bg-card shadow-sm transition-opacity",
        SPAN_CLASSES[span],
        updating && "opacity-60",
        className
      )}
    >
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
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
