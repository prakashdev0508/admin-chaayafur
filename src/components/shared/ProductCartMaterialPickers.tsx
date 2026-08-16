import { useQuery } from "@tanstack/react-query";
import { getProduct } from "@/services/products.service";
import { ProductCustomizationGroupPickers } from "@/components/shared/ProductCustomizationGroupPickers";
import { type CustomizationSelection } from "@/lib/product-customization";

type ProductCartMaterialPickersProps = {
  productId: number | null;
  customizationSelection: CustomizationSelection;
  onCustomizationChange: (selection: CustomizationSelection) => void;
  disabled?: boolean;
};

export function ProductCartMaterialPickers({
  productId,
  customizationSelection,
  onCustomizationChange,
  disabled,
}: ProductCartMaterialPickersProps) {
  const productQuery = useQuery({
    queryKey: ["product-cart-materials", productId],
    queryFn: () => getProduct(productId!),
    enabled: productId != null && productId > 0,
  });

  if (productId == null) return null;

  if (productQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading options…</p>;
  }

  const options = productQuery.data?.customization ?? [];
  if (options.length === 0) return null;

  return (
    <ProductCustomizationGroupPickers
      options={options}
      selection={customizationSelection}
      onChange={onCustomizationChange}
      disabled={disabled}
    />
  );
}
