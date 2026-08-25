import { Badge } from "@/components/ui/badge";
import { formatNumero } from "@/lib/format";
import type { ConversacionesMetric } from "@/types/metrics";

export function TotalConversacionesCard({ data }: { data: ConversacionesMetric }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-4xl font-semibold tabular-nums text-foreground">
        {formatNumero(data.total)}
      </p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="bg-[var(--sage-light)] text-foreground">
          {formatNumero(data.abiertas)} abiertas
        </Badge>
        <Badge variant="outline" className="text-muted-foreground">
          {formatNumero(data.cerradas)} cerradas
        </Badge>
      </div>
    </div>
  );
}
