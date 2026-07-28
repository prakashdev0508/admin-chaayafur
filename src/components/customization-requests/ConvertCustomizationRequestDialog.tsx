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
import { CustomizationMaterialFields } from "@/components/customization-requests/CustomizationMaterialFields";
import { fetchAdminCategoriesTree } from "@/services/categories.service";
import { listFabrics } from "@/services/fabrics.service";
import { listWoods } from "@/services/woods.service";
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
  const [woodId, setWoodId] = useState<number | null>(
    request.woodId ?? null,
  );
  const [polishId, setPolishId] = useState<number | null>(
    request.polishId ?? null,
  );
  const [fabricId, setFabricId] = useState<number | null>(
    request.fabricId ?? null,
  );

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.adminTree,
    queryFn: fetchAdminCategoriesTree,
    enabled: open,
  });

  const woodsQuery = useQuery({
    queryKey: queryKeys.woods.list({ limit: 100 }),
    queryFn: () => listWoods({ limit: 100 }),
    enabled: open,
  });

  const fabricsQuery = useQuery({
    queryKey: queryKeys.fabrics.list({ limit: 100 }),
    queryFn: () => listFabrics({ limit: 100 }),
    enabled: open,
  });

  const categoriesTree = categoriesQuery.data ?? [];
  const woods = woodsQuery.data?.items ?? [];
  const fabrics = fabricsQuery.data?.items ?? [];

  const selectedCategory = categoriesTree.find(
    (category) => String(category.id) === categoryId,
  );
  const subCategories = selectedCategory?.subCategories ?? [];

  useEffect(() => {
    if (!open) return;
    setProductName(request.productName);
    setQuantity(String(request.quantity));
    setWoodId(request.woodId ?? null);
    setPolishId(request.polishId ?? null);
    setFabricId(request.fabricId ?? null);
    setPrice("");
    setCategoryId("");
    setSubCategoryId("");
    setUseReferenceImage(false);
    setShippingAmount("0");
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

    const payload: ConvertCustomizationRequestPayload = {
      price: parsedPrice,
      subCategoryId: parsedSubCategoryId,
      useReferenceImageAsProductImage: useReferenceImage,
      shippingAmount: parsedShipping,
    };

    const trimmedName = productName.trim();
    if (trimmedName && trimmedName !== request.productName) {
      payload.productName = trimmedName;
    }
    if (parsedQuantity !== request.quantity) {
      payload.quantity = parsedQuantity;
    }
    if (woodId) payload.woodId = woodId;
    if (polishId) payload.polishId = polishId;
    if (fabricId) payload.fabricId = fabricId;

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

          <CustomizationMaterialFields
            woods={woods}
            fabrics={fabrics}
            woodId={woodId}
            polishId={polishId}
            fabricId={fabricId}
            onWoodChange={setWoodId}
            onPolishChange={setPolishId}
            onFabricChange={setFabricId}
          />

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
