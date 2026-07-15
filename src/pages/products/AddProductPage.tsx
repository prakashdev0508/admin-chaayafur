import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  ProductForm,
  emptyProductFormValues,
} from "@/components/products/ProductForm";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api";
import { formValuesToCreatePayload } from "@/lib/product-utils";
import { createProduct } from "@/services/products.service";
import type { ProductFormValues } from "@/types/product";
import { PERMISSIONS } from "@/lib/roles";

export function AddProductPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = hasPermission(PERMISSIONS.CREATE_PRODUCTS);

  const handleSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createProduct(formValuesToCreatePayload(values));
      navigate("/products");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to create product",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Add product" />
        <p className="text-muted-foreground">
          You do not have permission to create products.
        </p>
        <Button variant="outline" render={<Link to="/products">Back to products</Link>} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Add product"
        description="Create a new furniture item for your catalog."
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
        mode="create"
        defaultValues={emptyProductFormValues}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
      />

      <Button variant="outline" render={<Link to="/products">Cancel</Link>} />
    </div>
  );
}
