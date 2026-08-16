import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAdminCategoriesTree } from "@/services/categories.service";
import { queryKeys } from "@/lib/query-keys";
import type {
  ConvertCustomizationRequestPayload,
  CustomizationRequest,
} from "@/types/customization-request";

type ConvertCustomizationRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: CustomizationRequest;
  loading?: boolean;
  onSubmit: (payload: ConvertCustomizationRequestPayload) => Promise<unknown>;
};

export function ConvertCustomizationRequestDialog({
  open,
  onOpenChange,
  request,
  loading,
  onSubmit,
}: ConvertCustomizationRequestDialogProps) {
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [productName, setProductName] = useState(request.productName);
  const [quantity, setQuantity] = useState(String(request.quantity));
  const [useReferenceImage, setUseReferenceImage] = useState(false);
  const [shippingAmount, setShippingAmount] = useState("0");
  const [deliveryFloor, setDeliveryFloor] = useState("0");
  const [liftAccessAvailable, setLiftAccessAvailable] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.adminTree,
    queryFn: fetchAdminCategoriesTree,
    enabled: open,
  });

  const categoriesTree = categoriesQuery.data ?? [];

  const selectedCategory = categoriesTree.find(
    (category) => String(category.id) === categoryId,
  );
  const subCategories = selectedCategory?.subCategories ?? [];

  useEffect(() => {
    if (!open) return;
    setProductName(request.productName);
    setQuantity(String(request.quantity));
    setPrice("");
    setCategoryId("");
    setSubCategoryId("");
    setUseReferenceImage(false);
    setShippingAmount("0");
    setDeliveryFloor("0");
    setLiftAccessAvailable(false);
  }, [open, request]);

  const categoryItems = useMemo(
    () =>
      categoriesTree.map((category) => ({
        label: category.name,
        value: String(category.id),
      })),
    [categoriesTree],
  );

  async function handleSubmit() {
    const parsedPrice = parseFloat(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error("Enter a valid selling price");
      return;
    }
    const parsedSubCategoryId = Number(subCategoryId);
    if (!parsedSubCategoryId) {
      toast.error("Select a sub-category for the custom product");
      return;
    }
    const parsedQuantity = parseInt(quantity, 10);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }
    const parsedShipping = parseFloat(shippingAmount);
    if (!Number.isFinite(parsedShipping) || parsedShipping < 0) {
      toast.error("Enter a valid shipping amount");
      return;
    }
    const parsedFloor = parseInt(deliveryFloor, 10);
    if (!Number.isFinite(parsedFloor) || parsedFloor < 0 || parsedFloor > 100) {
      toast.error("Delivery floor must be between 0 and 100");
      return;
    }

    const payload: ConvertCustomizationRequestPayload = {
      price: parsedPrice,
      subCategoryId: parsedSubCategoryId,
      useReferenceImageAsProductImage: useReferenceImage,
      shippingAmount: parsedShipping,
      deliveryFloor: parsedFloor,
      liftAccessAvailable,
    };

    const trimmedName = productName.trim();
    if (trimmedName && trimmedName !== request.productName) {
      payload.productName = trimmedName;
    }
    if (parsedQuantity !== request.quantity) {
      payload.quantity = parsedQuantity;
    }

    try {
      await onSubmit(payload);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to convert request",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Convert to order</DialogTitle>
          <DialogDescription>
            Creates an inactive product and a pending order with a Razorpay
            payment link to share with the customer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="convert-price">Selling price (INR)</Label>
            <Input
              id="convert-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="45999"
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={categoryId || null}
              onValueChange={(value) => {
                if (!value) return;
                setCategoryId(value);
                setSubCategoryId("");
              }}
              items={categoryItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesTree.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sub-category</Label>
            <Select
              value={subCategoryId || null}
              onValueChange={(value) => {
                if (value) setSubCategoryId(value);
              }}
              disabled={!categoryId}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    categoryId
                      ? "Select sub-category"
                      : "Select a category first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {subCategories.map((sub) => (
                  <SelectItem key={sub.id} value={String(sub.id)}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="convert-product-name">Product name override</Label>
            <Input
              id="convert-product-name"
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="convert-quantity">Quantity</Label>
            <Input
              id="convert-quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="convert-shipping">Shipping amount (INR)</Label>
            <Input
              id="convert-shipping"
              type="number"
              min="0"
              step="0.01"
              value={shippingAmount}
              onChange={(event) => setShippingAmount(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="convert-delivery-floor">Delivery floor</Label>
            <Input
              id="convert-delivery-floor"
              type="number"
              min={0}
              max={100}
              step={1}
              value={deliveryFloor}
              onChange={(event) => setDeliveryFloor(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Ground = 0. Floor delivery labor is calculated from site settings
              (N × per-floor rate) when lift access is not available.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
            <div>
              <Label htmlFor="convert-lift-access">
                Lift accessible for delivery
              </Label>
              <p className="text-xs text-muted-foreground">
                When enabled, floor carry-up charges are waived.
              </p>
            </div>
            <Switch
              id="convert-lift-access"
              checked={liftAccessAvailable}
              onCheckedChange={setLiftAccessAvailable}
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
            <div>
              <Label htmlFor="use-ref-image">Use reference as product image</Label>
              <p className="text-xs text-muted-foreground">
                Copies the customer reference image onto the new product.
              </p>
            </div>
            <Switch
              id="use-ref-image"
              checked={useReferenceImage}
              onCheckedChange={setUseReferenceImage}
              disabled={!request.referenceImage?.url}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={loading} onClick={() => void handleSubmit()}>
            {loading ? "Creating…" : "Create order & payment link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
