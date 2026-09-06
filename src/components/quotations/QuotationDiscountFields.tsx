import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatQuoteRupees,
  quotationTotals,
} from "@/lib/quotation";
import type {
  QuotationDiscountType,
  QuotationDraft,
} from "@/types/quotation";

type QuotationDiscountFieldsProps = {
  draft: QuotationDraft;
  onChange: (patch: Partial<QuotationDraft>) => void;
};

const TYPE_ITEMS = [
  { value: "none", label: "No discount" },
  { value: "FLAT", label: "Flat (INR)" },
  { value: "PERCENTAGE", label: "Percentage (%)" },
];

export function QuotationDiscountFields({
  draft,
  onChange,
}: QuotationDiscountFieldsProps) {
  const totals = quotationTotals(
    draft.items,
    draft.discountType,
    draft.discountValue,
  );
  const typeValue = draft.discountType ?? "none";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Discount type</Label>
        <Select
          value={typeValue}
          onValueChange={(value) => {
            if (!value || value === "none") {
              onChange({ discountType: null, discountValue: null });
              return;
            }
            onChange({
              discountType: value as QuotationDiscountType,
              discountValue: draft.discountValue ?? 0,
            });
          }}
          items={TYPE_ITEMS}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="No discount" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quote-discount-value">
          {draft.discountType === "PERCENTAGE"
            ? "Discount (%)"
            : "Discount amount (INR)"}
        </Label>
        <Input
          id="quote-discount-value"
          type="number"
          min={0}
          max={draft.discountType === "PERCENTAGE" ? 100 : undefined}
          step={draft.discountType === "PERCENTAGE" ? "0.01" : "1"}
          disabled={draft.discountType == null}
          value={
            draft.discountType == null
              ? ""
              : draft.discountValue != null
                ? String(draft.discountValue)
                : ""
          }
          onChange={(event) => {
            const raw = event.target.value.trim();
            if (raw === "") {
              onChange({ discountValue: null });
              return;
            }
            const n = Number.parseFloat(raw);
            onChange({
              discountValue: Number.isFinite(n) ? n : null,
            });
          }}
          placeholder={
            draft.discountType === "PERCENTAGE" ? "e.g. 10" : "e.g. 5000"
          }
        />
      </div>

      {draft.discountType != null && totals.discountAmount > 0 ? (
        <p className="text-sm text-muted-foreground sm:col-span-2">
          Discount {formatQuoteRupees(totals.discountAmount)} · Total after
          discount {formatQuoteRupees(totals.totalAfterDiscount)}
        </p>
      ) : null}
    </div>
  );
}
