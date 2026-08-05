import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/products/ProductForm";
import { ProductFormSkeleton } from "@/components/products/ProductPageSkeletons";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api";
import {
  formValuesToCreatePayload,
  productToFormValues,
} from "@/lib/product-utils";
import {
  getAdminProduct,
  updateProduct,
} from "@/services/products.service";
import type { ProductFormValues } from "@/types/product";
import { PERMISSIONS } from "@/lib/roles";

function getSubmitErrorMessage(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

export function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const [defaultValues, setDefaultValues] = useState<ProductFormValues | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const productId = Number(id);
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_PRODUCTS);

  useEffect(() => {
    if (!productId || Number.isNaN(productId)) {
      setLoadError("Invalid product ID");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    getAdminProduct(productId)
      .then((product) => setDefaultValues(productToFormValues(product)))
      .catch((err) => {
        setLoadError(
          err instanceof ApiError ? err.message : "Failed to load product",
        );
      })
      .finally(() => setIsLoading(false));
  }, [productId]);

  const handleSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await updateProduct(productId, formValuesToCreatePayload(values));
      navigate(`/products/${productId}`);
    } catch (err) {
      setError(getSubmitErrorMessage(err, "Failed to update product"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canUpdate) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Edit product" />
        <p className="text-muted-foreground">
          You do not have permission to update products.
        </p>
        <Button variant="outline" render={<Link to="/products">Back to products</Link>} />
      </div>
    );
  }

  if (isLoading) {
    return <ProductFormSkeleton />;
  }

  if (loadError || !defaultValues) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <PageHeader title="Edit product" />
        <p className="text-destructive">{loadError ?? "Product not found"}</p>
        <Button variant="outline" render={<Link to="/products">Back to products</Link>} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Edit product"
        description="Update details, inventory, and customization pricing."
        action={
          <Button
            variant="outline"
            render={
              <Link to={`/products/${productId}`}>
                <ArrowLeft className="size-4" />
                Back
              </Link>
            }
          />
        }
      />

      <ProductForm
        mode="edit"
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
        submitLabel="Update product"
      />
    </div>
  );
}
