import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isValidEmail, isValidIndianMobile } from "@/lib/quotation";
import type { QuotationDraft } from "@/types/quotation";

type QuotationCustomerFieldsProps = {
  draft: QuotationDraft;
  onChange: (patch: Partial<QuotationDraft>) => void;
};

export function QuotationCustomerFields({
  draft,
  onChange,
}: QuotationCustomerFieldsProps) {
  const phone = draft.customerPhone.trim();
  const phoneInvalid = phone.length > 0 && !isValidIndianMobile(phone);
  const email = draft.customerEmail.trim();
  const emailInvalid = email.length > 0 && !isValidEmail(email);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="quotation-customer-name">Customer name</Label>
        <Input
          id="quotation-customer-name"
          value={draft.customerName}
          onChange={(e) => onChange({ customerName: e.target.value })}
          placeholder="Full name"
          autoComplete="name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="quotation-customer-phone">Mobile number</Label>
        <Input
          id="quotation-customer-phone"
          value={draft.customerPhone}
          onChange={(e) =>
            onChange({
              customerPhone: e.target.value.replace(/\D/g, "").slice(0, 10),
            })
          }
          placeholder="10-digit mobile"
          inputMode="numeric"
          autoComplete="tel"
          aria-invalid={phoneInvalid}
        />
        {phoneInvalid ? (
          <p className="text-xs text-destructive">Enter a 10-digit Indian mobile.</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="quotation-customer-email">Email</Label>
        <Input
          id="quotation-customer-email"
          type="email"
          value={draft.customerEmail}
          onChange={(e) => onChange({ customerEmail: e.target.value })}
          placeholder="name@example.com"
          autoComplete="email"
          aria-invalid={emailInvalid}
        />
        {emailInvalid ? (
          <p className="text-xs text-destructive">Enter a valid email address.</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="quotation-valid-until">Valid until</Label>
        <Input
          id="quotation-valid-until"
          type="date"
          value={draft.validUntil}
          onChange={(e) => onChange({ validUntil: e.target.value })}
        />
      </div>
      <div className="space-y-2 sm:col-span-1">
        <Label htmlFor="quotation-customer-address">Address</Label>
        <Textarea
          id="quotation-customer-address"
          value={draft.customerAddress}
          onChange={(e) => onChange({ customerAddress: e.target.value })}
          placeholder="Billing or delivery address"
          rows={3}
        />
      </div>
      <div className="space-y-2 sm:col-span-1">
        <Label htmlFor="quotation-notes">
          Notes{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="quotation-notes"
          value={draft.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Terms, delivery notes, or dimensions"
          rows={3}
        />
      </div>
    </div>
  );
}
