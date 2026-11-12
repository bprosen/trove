import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type BookStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: Record<BookStatus, string> = {
  want: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  reading: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  finished: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  dnf: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: BookStatus; className?: string }) {
  return (
    <Badge variant="secondary" className={cn("border-transparent", STYLES[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
