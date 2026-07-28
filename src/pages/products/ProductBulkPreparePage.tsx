import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BulkProductImageUploader } from "@/components/products/BulkProductImageUploader";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api";
import { triggerBrowserDownload } from "@/lib/download";
import { PRODUCT_BULK_COLUMN_HELP } from "@/lib/product-bulk-upload-reference";
import { PERMISSIONS } from "@/lib/roles";
import { fetchCategoriesTree } from "@/services/categories.service";
import { listFabrics } from "@/services/fabrics.service";
import { downloadProductBulkUploadSample } from "@/services/products.service";
import { listWoods } from "@/services/woods.service";
import type { CategoryTreeItem } from "@/types/category";
import type { Fabric } from "@/types/fabric";
import type { Wood } from "@/types/wood";

export function ProductBulkPreparePage() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(PERMISSIONS.CREATE_PRODUCTS);

  const [downloadingSample, setDownloadingSample] = useState(false);
  const [categoriesTree, setCategoriesTree] = useState<CategoryTreeItem[]>([]);
  const [woods, setWoods] = useState<Wood[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [refsLoading, setRefsLoading] = useState(true);

  useEffect(() => {
    if (!canCreate) return;
    setRefsLoading(true);
    Promise.all([
      fetchCategoriesTree(),
      listWoods({ limit: 100 }),
      listFabrics({ limit: 100 }),
    ])
      .then(([tree, woodsPage, fabricsPage]) => {
        setCategoriesTree(tree);
        setWoods(woodsPage.items);
        setFabrics(fabricsPage.items);
      })
      .catch(() => {
        toast.error("Could not load reference IDs");
      })
      .finally(() => setRefsLoading(false));
  }, [canCreate]);

  const handleDownloadSample = async () => {
    setDownloadingSample(true);
    try {
      const { blob, filename } = await downloadProductBulkUploadSample();
      triggerBrowserDownload(
        blob,
        filename || "product-bulk-upload-sample.xlsx",
      );
      toast.success("Sample template downloaded");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to download sample";
      toast.error(message);
    } finally {
      setDownloadingSample(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Prepare bulk import" />
        <p className="text-muted-foreground">
          You do not have permission to prepare product imports.
        </p>
        <Button
          variant="outline"
          render={<Link to="/products">Back to products</Link>}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Prepare bulk import"
        description="Download the Excel template, upload product images for CDN URLs, and use the references below to fill your sheet. When the file is ready, import it from the Products list."
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

      <Card>
        <CardHeader>
          <CardTitle>Workflow</CardTitle>
          <CardDescription>
            One row per product, max 500 rows and 5 MB per file when you import.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Download the sample Excel template and open it on your computer.</li>
            <li>
              Upload images below and copy URLs into each row&apos;s{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">images</code>{" "}
              column (comma-separated, up to 5 URLs).
            </li>
            <li>
              Fill required columns using the ID reference tables on this page.
            </li>
            <li>
              On the Products list, choose{" "}
              <span className="font-medium text-foreground">Bulk upload</span>{" "}
              and submit your completed{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">.xlsx</code>
              .
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Excel template</CardTitle>
          <CardDescription>
            Header names must match the sample (case-insensitive).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleDownloadSample()}
            disabled={downloadingSample}
          >
            {downloadingSample ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Download sample Excel template
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Column reference</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 rounded-lg border bg-muted/20 p-3">
            {PRODUCT_BULK_COLUMN_HELP.map((row) => (
              <li
                key={row.column}
                className="grid gap-2 text-xs sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
              >
                <span className="font-mono">
                  {row.column}
                  {row.required && (
                    <span className="ml-1 text-destructive">*</span>
                  )}
                </span>
                <span className="text-muted-foreground">{row.hint}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sub-category IDs</CardTitle>
          <CardDescription>
            Use these values in the{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              subCategoryId
            </code>{" "}
            column.{" "}
            <Link
              to="/categories"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Manage categories
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {refsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </div>
          ) : categoriesTree.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories found.</p>
          ) : (
            <div className="max-h-64 overflow-y-auto rounded-lg border">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <tr>
                    <th className="px-3 py-2 font-medium">ID</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium">Sub-category</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriesTree.flatMap((category) =>
                    (category.subCategories ?? []).map((sub) => (
                      <tr key={sub.id} className="border-t">
                        <td className="px-3 py-2 font-mono tabular-nums">
                          {sub.id}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {category.name}
                        </td>
                        <td className="px-3 py-2">{sub.name}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Wood IDs</CardTitle>
            <CardDescription>
              Comma-separated in the{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">woods</code>{" "}
              column.{" "}
              <Link
                to="/woods"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Manage woods
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {refsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading…
              </div>
            ) : woods.length === 0 ? (
              <p className="text-sm text-muted-foreground">No woods found.</p>
            ) : (
              <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
                {woods.map((wood) => (
                  <li key={wood.id} className="flex gap-2">
                    <span className="font-mono tabular-nums">{wood.id}</span>
                    <span className="text-muted-foreground">{wood.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fabric IDs</CardTitle>
            <CardDescription>
              Comma-separated in the{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                fabrics
              </code>{" "}
              column.{" "}
              <Link
                to="/fabrics"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Manage fabrics
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {refsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading…
              </div>
            ) : fabrics.length === 0 ? (
              <p className="text-sm text-muted-foreground">No fabrics found.</p>
            ) : (
              <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
                {fabrics.map((fabric) => (
                  <li key={fabric.id} className="flex gap-2">
                    <span className="font-mono tabular-nums">{fabric.id}</span>
                    <span className="text-muted-foreground">{fabric.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product images</CardTitle>
          <CardDescription>
            Upload photos here, then copy URLs into your Excel sheet. Images are
            stored on the CDN before import.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BulkProductImageUploader />
        </CardContent>
      </Card>
    </div>
  );
}
