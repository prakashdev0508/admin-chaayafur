import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatPoAmount,
  lineCgstAmount,
  lineDiscAmount,
  lineFinalAmount,
  lineSgstAmount,
  lineTotal,
  parseMoney,
} from "@/lib/purchase-order";
import type { PurchaseOrderLine } from "@/types/purchase-order";

type PurchaseOrderLineItemsEditorProps = {
  items: PurchaseOrderLine[];
  onChange: (items: PurchaseOrderLine[]) => void;
};

export function PurchaseOrderLineItemsEditor({
  items,
  onChange,
}: PurchaseOrderLineItemsEditorProps) {
  function patchItem(id: string, patch: Partial<PurchaseOrderLine>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Select order items above to edit PO line details.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">Description</TableHead>
            <TableHead className="w-24">HSN/SAC</TableHead>
            <TableHead className="w-32">Work date</TableHead>
            <TableHead className="w-16">UOM</TableHead>
            <TableHead className="w-16">Qty</TableHead>
            <TableHead className="w-28">Basic</TableHead>
            <TableHead className="w-20">Disc %</TableHead>
            <TableHead className="w-20">CGST %</TableHead>
            <TableHead className="w-20">SGST %</TableHead>
            <TableHead className="w-24 text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Input
                  value={item.description}
                  onChange={(e) =>
                    patchItem(item.id, { description: e.target.value })
                  }
                />
                <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                  Disc {formatPoAmount(lineDiscAmount(item))} · Final{" "}
                  {formatPoAmount(lineFinalAmount(item))} · Tax{" "}
                  {formatPoAmount(
                    lineCgstAmount(item) + lineSgstAmount(item),
                  )}
                </p>
              </TableCell>
              <TableCell>
                <Input
                  value={item.hsn}
                  onChange={(e) => patchItem(item.id, { hsn: e.target.value })}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="date"
                  value={item.workCompDate}
                  onChange={(e) =>
                    patchItem(item.id, { workCompDate: e.target.value })
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  value={item.uom}
                  onChange={(e) => patchItem(item.id, { uom: e.target.value })}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={item.quantity}
                  onChange={(e) =>
                    patchItem(item.id, {
                      quantity: Math.max(
                        1,
                        Math.floor(Number(e.target.value) || 1),
                      ),
                    })
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.basicAmount}
                  onChange={(e) =>
                    patchItem(item.id, {
                      basicAmount: parseMoney(e.target.value),
                    })
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.discPercent}
                  onChange={(e) =>
                    patchItem(item.id, {
                      discPercent: parseMoney(e.target.value),
                    })
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.cgstPercent}
                  onChange={(e) =>
                    patchItem(item.id, {
                      cgstPercent: parseMoney(e.target.value),
                    })
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.sgstPercent}
                  onChange={(e) =>
                    patchItem(item.id, {
                      sgstPercent: parseMoney(e.target.value),
                    })
                  }
                />
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatPoAmount(lineTotal(item))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
