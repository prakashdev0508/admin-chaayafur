import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PurchaseOrderDraft } from "@/types/purchase-order";

type PurchaseOrderVendorFieldsProps = {
  draft: PurchaseOrderDraft;
  onChange: (patch: Partial<PurchaseOrderDraft>) => void;
};

export function PurchaseOrderVendorFields({
  draft,
  onChange,
}: PurchaseOrderVendorFieldsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="po-number">PO number</Label>
          <Input
            id="po-number"
            value={draft.poNumber}
            onChange={(e) => onChange({ poNumber: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="po-date">Date</Label>
          <Input
            id="po-date"
            type="date"
            value={draft.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Company letterhead</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="po-pan">PAN No.</Label>
            <Input
              id="po-pan"
              value={draft.companyLegal.pan}
              onChange={(e) =>
                onChange({
                  companyLegal: { ...draft.companyLegal, pan: e.target.value },
                })
              }
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="po-cin">CIN No.</Label>
            <Input
              id="po-cin"
              value={draft.companyLegal.cin}
              onChange={(e) =>
                onChange({
                  companyLegal: { ...draft.companyLegal, cin: e.target.value },
                })
              }
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="po-company-address">Address</Label>
            <Textarea
              id="po-company-address"
              value={draft.companyLegal.address}
              onChange={(e) =>
                onChange({
                  companyLegal: {
                    ...draft.companyLegal,
                    address: e.target.value,
                  },
                })
              }
              rows={2}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Vendor</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="po-vendor-name">Vendor name</Label>
            <Input
              id="po-vendor-name"
              value={draft.vendor.name}
              onChange={(e) =>
                onChange({ vendor: { ...draft.vendor, name: e.target.value } })
              }
              placeholder="Required"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="po-vendor-contact">Contact person</Label>
            <Input
              id="po-vendor-contact"
              value={draft.vendor.contactPerson}
              onChange={(e) =>
                onChange({
                  vendor: { ...draft.vendor, contactPerson: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="po-vendor-gstin">GSTIN</Label>
            <Input
              id="po-vendor-gstin"
              value={draft.vendor.gstin}
              onChange={(e) =>
                onChange({
                  vendor: { ...draft.vendor, gstin: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="po-vendor-phone">Mobile</Label>
            <Input
              id="po-vendor-phone"
              value={draft.vendor.phone}
              onChange={(e) =>
                onChange({
                  vendor: {
                    ...draft.vendor,
                    phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                  },
                })
              }
              inputMode="numeric"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="po-vendor-email">Email</Label>
            <Input
              id="po-vendor-email"
              type="email"
              value={draft.vendor.email}
              onChange={(e) =>
                onChange({
                  vendor: { ...draft.vendor, email: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="po-vendor-address">Address</Label>
            <Textarea
              id="po-vendor-address"
              value={draft.vendor.address}
              onChange={(e) =>
                onChange({
                  vendor: { ...draft.vendor, address: e.target.value },
                })
              }
              rows={2}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PartyFields
          title="Ship To"
          prefix="ship"
          party={draft.shipTo}
          onChange={(shipTo) => onChange({ shipTo })}
        />
        <PartyFields
          title="Bill To"
          prefix="bill"
          party={draft.billTo}
          onChange={(billTo) => onChange({ billTo })}
        />
      </div>
    </div>
  );
}

function PartyFields({
  title,
  prefix,
  party,
  onChange,
}: {
  title: string;
  prefix: string;
  party: PurchaseOrderDraft["shipTo"];
  onChange: (party: PurchaseOrderDraft["shipTo"]) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`po-${prefix}-name`}>Company name</Label>
          <Input
            id={`po-${prefix}-name`}
            value={party.name}
            onChange={(e) => onChange({ ...party, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`po-${prefix}-unit`}>Unit name</Label>
          <Input
            id={`po-${prefix}-unit`}
            value={party.unitName}
            onChange={(e) => onChange({ ...party, unitName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`po-${prefix}-state`}>State</Label>
          <Input
            id={`po-${prefix}-state`}
            value={party.state}
            onChange={(e) => onChange({ ...party, state: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`po-${prefix}-gstin`}>GSTIN</Label>
          <Input
            id={`po-${prefix}-gstin`}
            value={party.gstin}
            onChange={(e) => onChange({ ...party, gstin: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`po-${prefix}-phone`}>Mobile</Label>
          <Input
            id={`po-${prefix}-phone`}
            value={party.phone}
            onChange={(e) =>
              onChange({
                ...party,
                phone: e.target.value.replace(/\D/g, "").slice(0, 10),
              })
            }
            inputMode="numeric"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`po-${prefix}-email`}>Email</Label>
          <Input
            id={`po-${prefix}-email`}
            type="email"
            value={party.email}
            onChange={(e) => onChange({ ...party, email: e.target.value })}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`po-${prefix}-address`}>Address</Label>
          <Textarea
            id={`po-${prefix}-address`}
            value={party.address}
            onChange={(e) => onChange({ ...party, address: e.target.value })}
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
