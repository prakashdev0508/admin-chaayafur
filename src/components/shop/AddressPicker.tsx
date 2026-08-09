import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopAddressForm } from "@/components/shop/ShopAddressForm";
import {
  createCustomerAddress,
  listCustomerAddresses,
} from "@/services/shop-addresses.service";
import { queryKeys } from "@/lib/query-keys";
import {
  primaryAddressFromCreate,
  type AddressType,
  type CustomerAddress,
} from "@/types/address";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AddressPickerProps = {
  selectedId: number | null;
  onSelect: (addressId: number | null) => void;
  /** Only list/create addresses of this type. Defaults to SHIPPING. */
  type?: AddressType;
  title?: string;
  emptyMessage?: string;
};

export function AddressPicker({
  selectedId,
  onSelect,
  type = "SHIPPING",
  title,
  emptyMessage,
}: AddressPickerProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const addressesQuery = useQuery({
    queryKey: queryKeys.shop.addresses.all,
    queryFn: listCustomerAddresses,
  });

  const createMutation = useMutation({
    mutationFn: createCustomerAddress,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.shop.addresses.all });
      const primary = primaryAddressFromCreate(result, type);
      onSelect(primary.id);
      setShowForm(false);
      toast.success("Address saved");
    },
    onError: () => toast.error("Could not save address"),
  });

  const addresses = useMemo(
    () => (addressesQuery.data ?? []).filter((address) => address.type === type),
    [addressesQuery.data, type],
  );

  const totalCount = addressesQuery.data?.length ?? 0;

  useEffect(() => {
    if (selectedId != null && addresses.some((a) => a.id === selectedId)) {
      return;
    }
    if (addresses.length === 0) {
      if (selectedId != null) onSelect(null);
      return;
    }
    const defaultAddress =
      addresses.find((address) => address.isDefault) ?? addresses[0];
    onSelect(defaultAddress.id);
  }, [addresses, onSelect, selectedId]);

  const heading =
    title ?? (type === "BILLING" ? "Billing address" : "Shipping address");
  const empty =
    emptyMessage ??
    (type === "BILLING"
      ? "Add a billing address to continue."
      : "Add a delivery address to continue checkout.");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-[#3D2B1F]">{heading}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm((value) => !value)}
          disabled={totalCount >= 5 && !showForm}
        >
          <Plus className="size-4" />
          Add address
        </Button>
      </div>

      {addressesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="grid gap-3">
          {addresses.map((address) => (
            <AddressOption
              key={address.id}
              address={address}
              selected={selectedId === address.id}
              onSelect={() => onSelect(address.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ShopAddressForm
          defaultType={type}
          lockType
          loading={createMutation.isPending}
          onCancel={() => setShowForm(false)}
          onSubmit={async (payload) => {
            await createMutation.mutateAsync({
              ...payload,
              type,
            });
          }}
        />
      )}
    </div>
  );
}

function AddressOption({
  address,
  selected,
  onSelect,
}: {
  address: CustomerAddress;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-xl border p-4 text-left transition",
        selected
          ? "border-[#8B5E3C] bg-[#F8F1E8]"
          : "border-[#E8DFD3] bg-white hover:border-[#C9B59A]",
      )}
    >
      <p className="font-medium">{address.name}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state}{" "}
        {address.zipCode}
      </p>
      {(address.phone || address.email) && (
        <p className="mt-1 text-xs text-muted-foreground">
          {[address.phone, address.email].filter(Boolean).join(" · ")}
        </p>
      )}
    </button>
  );
}
