import { MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  addressTypeLabels,
  formatAddressContact,
  formatAddressLines,
} from "@/lib/address-utils";
import type { CustomerAddress } from "@/types/address";

type AddressCardProps = {
  address: CustomerAddress;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function AddressCard({
  address,
  canEdit,
  onEdit,
  onDelete,
}: AddressCardProps) {
  const contact = formatAddressContact(address);

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
      <div className="space-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          <span className="font-medium">{address.name}</span>
          <StatusBadge variant="neutral">
            {addressTypeLabels[address.type]}
          </StatusBadge>
          {address.isDefault && (
            <StatusBadge variant="brand">Default</StatusBadge>
          )}
        </div>
        {contact && (
          <p className="text-muted-foreground">{contact}</p>
        )}
        <div className="text-muted-foreground">
          {formatAddressLines(address).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
      {canEdit && (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDelete}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  );
}
