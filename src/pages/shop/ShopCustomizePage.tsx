import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AddressPicker } from "@/components/shop/AddressPicker";
import { CustomizationImageUploader } from "@/components/shop/CustomizationImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  listShopFabricCatalog,
  listShopWoodCatalog,
} from "@/services/shop-catalog-materials.service";
import { createCustomizationRequest } from "@/services/shop-customization-requests.service";
import {
  CUSTOMIZATION_FIELD_LIMITS,
  type CreateCustomizationRequestPayload,
  type ReferenceImage,
} from "@/types/customization-request";
import type { Fabric } from "@/types/fabric";
import type { Wood } from "@/types/wood";

export function ShopCustomizePage() {
  const navigate = useNavigate();
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [shippingAddressId, setShippingAddressId] = useState<number | null>(
    null,
  );
  const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(
    null,
  );
  const [selectedWoodId, setSelectedWoodId] = useState<number | null>(null);
  const [selectedPolishId, setSelectedPolishId] = useState<number | null>(
    null,
  );
  const [selectedFabricId, setSelectedFabricId] = useState<number | null>(
    null,
  );

  const woodsQuery = useQuery({
    queryKey: ["shop", "catalog", "woods"],
    queryFn: listShopWoodCatalog,
    retry: false,
  });

  const fabricsQuery = useQuery({
    queryKey: ["shop", "catalog", "fabrics"],
    queryFn: listShopFabricCatalog,
    retry: false,
  });

  const woods = woodsQuery.data?.items ?? [];
  const fabrics = fabricsQuery.data?.items ?? [];
  const catalogAvailable =
    woodsQuery.isSuccess || fabricsQuery.isSuccess;

  const selectedWood = woods.find((wood) => wood.id === selectedWoodId);
  const woodPolishes = selectedWood?.polishes?.filter((p) => p.isActive) ?? [];

  useEffect(() => {
    setSelectedPolishId(null);
  }, [selectedWoodId]);

  const activeWoods = useMemo(
    () => woods.filter((wood) => wood.isActive),
    [woods],
  );
  const activeFabrics = useMemo(
    () => fabrics.filter((fabric) => fabric.isActive),
    [fabrics],
  );

  const submitMutation = useMutation({
    mutationFn: createCustomizationRequest,
    onSuccess: (request) => {
      toast.success("Custom request submitted — we’ll review it soon");
      navigate(`/shop/customize/requests/${request.id}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not submit your request",
      );
    },
  });

  function buildPayload(): CreateCustomizationRequestPayload | null {
    const trimmedName = productName.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName) {
      toast.error("Enter a product name");
      return null;
    }
    if (trimmedName.length > CUSTOMIZATION_FIELD_LIMITS.productName) {
      toast.error(
        `Product name must be at most ${CUSTOMIZATION_FIELD_LIMITS.productName} characters`,
      );
      return null;
    }
    if (!trimmedDescription) {
      toast.error("Describe what you want us to build");
      return null;
    }
    if (
      trimmedDescription.length > CUSTOMIZATION_FIELD_LIMITS.description
    ) {
      toast.error(
        `Description must be at most ${CUSTOMIZATION_FIELD_LIMITS.description} characters`,
      );
      return null;
    }
    if (!shippingAddressId) {
      toast.error("Select a shipping address");
      return null;
    }
    const parsedQuantity = parseInt(quantity, 10);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
      toast.error("Quantity must be at least 1");
      return null;
    }

    const payload: CreateCustomizationRequestPayload = {
      productName: trimmedName,
      description: trimmedDescription,
      shippingAddressId,
      quantity: parsedQuantity,
    };

    if (referenceImage) {
      payload.referenceImage = referenceImage;
    }
    if (selectedWoodId) payload.woodId = selectedWoodId;
    if (selectedPolishId) payload.polishId = selectedPolishId;
    if (selectedFabricId) payload.fabricId = selectedFabricId;

    return payload;
  }

  function handleSubmit() {
    const payload = buildPayload();
    if (!payload) return;
    submitMutation.mutate(payload);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-medium text-[#3D2B1F]">
          Custom furniture request
        </h1>
        <p className="mt-2 text-muted-foreground">
          Tell us what you want built. Our team will review, quote, and share a
          payment link when approved.
        </p>
        <Link
          to="/shop/customize/requests"
          className="mt-3 text-sm font-medium text-[#8B5E3C] hover:underline"
        >
          View your requests
        </Link>
      </div>

      <div className="space-y-6 rounded-2xl border border-[#E8DFD3] bg-white p-6">
        <div className="space-y-2">
          <Label htmlFor="custom-product-name">Product name</Label>
          <Input
            id="custom-product-name"
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
            placeholder="Custom teak dining table"
            maxLength={CUSTOMIZATION_FIELD_LIMITS.productName}
            className="border-[#E8DFD3]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom-description">Description</Label>
          <Textarea
            id="custom-description"
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Dimensions, materials, finish, timeline…"
            maxLength={CUSTOMIZATION_FIELD_LIMITS.description}
            className="border-[#E8DFD3]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom-quantity">Quantity</Label>
          <Input
            id="custom-quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="w-24 border-[#E8DFD3]"
          />
        </div>

        <div className="space-y-3">
          <Label>Shipping address</Label>
          <AddressPicker
            selectedId={shippingAddressId}
            onSelect={setShippingAddressId}
          />
        </div>

        <CustomizationImageUploader
          image={referenceImage}
          onChange={setReferenceImage}
        />

        {catalogAvailable && activeWoods.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#3D2B1F]">
              Wood preference (optional)
            </p>
            <div className="flex flex-wrap gap-2">
              {activeWoods.map((wood: Wood) => {
                const selected = selectedWoodId === wood.id;
                return (
                  <button
                    key={wood.id}
                    type="button"
                    onClick={() =>
                      setSelectedWoodId(selected ? null : wood.id)
                    }
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      selected
                        ? "border-[#8B5E3C] bg-[#F8F1E8] text-[#3D2B1F]"
                        : "border-[#E8DFD3] bg-white text-muted-foreground hover:border-[#D9CBB8]",
                    )}
                    aria-pressed={selected}
                  >
                    <span
                      className="size-3.5 rounded-full border border-[#D9CBB8]"
                      style={{ backgroundColor: wood.color }}
                      aria-hidden
                    />
                    {wood.name}
                  </button>
                );
              })}
            </div>
            {woodPolishes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Polish</p>
                <div className="flex flex-wrap gap-2">
                  {woodPolishes.map((polish) => {
                    const selected = selectedPolishId === polish.id;
                    return (
                      <button
                        key={polish.id}
                        type="button"
                        onClick={() =>
                          setSelectedPolishId(selected ? null : polish.id)
                        }
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                          selected
                            ? "border-[#8B5E3C] bg-[#F8F1E8] text-[#3D2B1F]"
                            : "border-[#E8DFD3] bg-white text-muted-foreground hover:border-[#D9CBB8]",
                        )}
                        aria-pressed={selected}
                      >
                        {polish.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {catalogAvailable && activeFabrics.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#3D2B1F]">
              Fabric preference (optional)
            </p>
            <div className="flex flex-wrap gap-2">
              {activeFabrics.map((fabric: Fabric) => {
                const selected = selectedFabricId === fabric.id;
                return (
                  <button
                    key={fabric.id}
                    type="button"
                    onClick={() =>
                      setSelectedFabricId(selected ? null : fabric.id)
                    }
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      selected
                        ? "border-[#8B5E3C] bg-[#F8F1E8] text-[#3D2B1F]"
                        : "border-[#E8DFD3] bg-white text-muted-foreground hover:border-[#D9CBB8]",
                    )}
                    aria-pressed={selected}
                  >
                    <span
                      className="size-3.5 rounded-full border border-[#D9CBB8]"
                      style={{ backgroundColor: fabric.color }}
                      aria-hidden
                    />
                    {fabric.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!catalogAvailable &&
          woodsQuery.isError &&
          fabricsQuery.isError && (
            <p className="text-sm text-muted-foreground">
              Describe wood, polish, and fabric preferences in the description
              above — our team will confirm options with you.
            </p>
          )}

        <Button
          className="w-full bg-[#8B5E3C] hover:bg-[#744C31]"
          disabled={submitMutation.isPending}
          onClick={handleSubmit}
        >
          {submitMutation.isPending ? "Submitting…" : "Submit request"}
        </Button>
      </div>
    </div>
  );
}
