import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/products/ProductForm";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api";
import {
  formValuesToCreatePayload,
  productToFormValues,
} from "@/lib/product-utils";
import {
  getProductForEdit,
  updateProduct,
} from "@/services/products.service";
import type { ProductFormValues } from "@/types/product";

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
  const canUpdate = hasPermission("update-products");

  useEffect(() => {
    if (!productId || Number.isNaN(productId)) {
      setLoadError("Invalid product ID");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    getProductForEdit(productId)
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
      navigate("/products");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to update product",
      );
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
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Edit product" />
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (loadError || !defaultValues) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Edit product" />
        <p className="text-destructive">{loadError ?? "Product not found"}</p>
        <Button variant="outline" render={<Link to="/products">Back to products</Link>} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Edit product"
        description="Update product details and inventory."
        action={
          <Button
            variant="outline"
            render={
              <Link to="/products">
                <ArrowLeft className="size-4" />
                Back to products
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

      <Button variant="outline" render={<Link to="/products">Cancel</Link>} />
    </div>
  );
}
