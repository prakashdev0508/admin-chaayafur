import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CUSTOMIZATION_FIELD_LIMITS,
  type CustomizationRequest,
  type UpdateCustomizationRequestPayload,
} from "@/types/customization-request";

type CustomizationRequestEditCardProps = {
  request: CustomizationRequest;
  loading?: boolean;
  disabled?: boolean;
  onSubmit: (payload: UpdateCustomizationRequestPayload) => Promise<unknown>;
};

export function CustomizationRequestEditCard({
  request,
  loading,
  disabled,
  onSubmit,
}: CustomizationRequestEditCardProps) {
  const [productName, setProductName] = useState(request.productName);
  const [description, setDescription] = useState(request.description);
  const [quantity, setQuantity] = useState(String(request.quantity));
  const [clearImage, setClearImage] = useState(false);

  useEffect(() => {
    setProductName(request.productName);
    setDescription(request.description);
    setQuantity(String(request.quantity));
    setClearImage(false);
  }, [request]);

  async function handleSave() {
    const trimmedName = productName.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName) {
      toast.error("Product name is required");
      return;
    }
    if (trimmedName.length > CUSTOMIZATION_FIELD_LIMITS.productName) {
      toast.error(
        `Product name must be at most ${CUSTOMIZATION_FIELD_LIMITS.productName} characters`,
      );
      return;
    }
    if (!trimmedDescription) {
      toast.error("Description is required");
      return;
    }
    if (
      trimmedDescription.length > CUSTOMIZATION_FIELD_LIMITS.description
    ) {
      toast.error(
        `Description must be at most ${CUSTOMIZATION_FIELD_LIMITS.description} characters`,
      );
      return;
    }
    const parsedQuantity = parseInt(quantity, 10);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    const payload: UpdateCustomizationRequestPayload = {
      productName: trimmedName,
      description: trimmedDescription,
      quantity: parsedQuantity,
    };

    if (clearImage) {
      payload.referenceImage = null;
    }

    try {
      await onSubmit(payload);
      toast.success("Request updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update request",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit request</CardTitle>
        <CardDescription>
          Update details before approval or conversion. Cannot edit converted
          requests.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-product-name">Product name</Label>
          <Input
            id="edit-product-name"
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
            disabled={disabled}
            maxLength={CUSTOMIZATION_FIELD_LIMITS.productName}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-description">Description</Label>
          <Textarea
            id="edit-description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={disabled}
            maxLength={CUSTOMIZATION_FIELD_LIMITS.description}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-quantity">Quantity</Label>
          <Input
            id="edit-quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            disabled={disabled}
          />
        </div>

        {request.referenceImage?.url && (
          <div className="space-y-2">
            <Label>Reference image</Label>
            <img
              src={request.referenceImage.url}
              alt="Reference"
              className="max-h-40 rounded-lg border object-cover"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={clearImage}
                onChange={(event) => setClearImage(event.target.checked)}
                disabled={disabled}
                className="size-4"
              />
              Remove reference image on save
            </label>
          </div>
        )}

        <Button
          className="w-full"
          disabled={disabled || loading}
          onClick={() => void handleSave()}
        >
          {loading ? "Saving…" : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
