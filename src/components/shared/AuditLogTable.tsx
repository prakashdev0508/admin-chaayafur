import { formatDate } from "@/lib/format";
import type { AuditLog } from "@/types/audit-log";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ScrollText } from "lucide-react";

type AuditLogTableProps = {
  logs: AuditLog[];
  loading?: boolean;
};

function formatStaffName(changedBy: AuditLog["changedBy"]) {
  const name = [changedBy.firstName, changedBy.lastName]
    .filter(Boolean)
    .join(" ");
  return name || changedBy.email;
}

function formatValue(value: string | null) {
  if (value === null || value === "") return "—";
  if (value.length > 80) return `${value.slice(0, 80)}…`;
  return value;
}

export function AuditLogTable({ logs, loading }: AuditLogTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title="No activity yet"
        description="Changes to this record will appear here."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Field</TableHead>
            <TableHead>Change</TableHead>
            <TableHead>By</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {log.entityType}
                </span>
                <div>{log.fieldName}</div>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground line-through">
                  {formatValue(log.oldValue)}
                </span>
                <span className="mx-2 text-muted-foreground">→</span>
                <span>{formatValue(log.newValue)}</span>
              </TableCell>
              <TableCell className="text-sm">
                {formatStaffName(log.changedBy)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(log.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
