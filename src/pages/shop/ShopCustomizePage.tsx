import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AddressPicker } from "@/components/shop/AddressPicker";
import { CustomizationImageUploader } from "@/components/shop/CustomizationImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { createCustomizationRequest } from "@/services/shop-customization-requests.service";
import {
  CUSTOMIZATION_FIELD_LIMITS,
  type CreateCustomizationRequestPayload,
  type ReferenceImage,
} from "@/types/customization-request";

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
            type="SHIPPING"
            selectedId={shippingAddressId}
            onSelect={setShippingAddressId}
          />
        </div>

        <CustomizationImageUploader
          image={referenceImage}
          onChange={setReferenceImage}
        />

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
