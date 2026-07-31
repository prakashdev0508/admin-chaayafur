import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BulkProductImageZipUploader } from "@/components/products/BulkProductImageZipUploader";
import { StagedProductImagesPanel } from "@/components/products/StagedProductImagesPanel";
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
import {
  PRODUCT_BULK_COLUMN_HELP,
  PRODUCT_BULK_PRICING_NOTES,
  PRODUCT_BULK_RESULT_COLUMNS,
} from "@/lib/product-bulk-upload-reference";
import { PERMISSIONS } from "@/lib/roles";
import { fetchCategoriesTree } from "@/services/categories.service";
import { listFabrics } from "@/services/fabrics.service";
import { downloadProductBulkUploadSample } from "@/services/products.service";
import { listWoods } from "@/services/woods.service";
import type { CategoryTreeItem } from "@/types/category";
import type { Fabric } from "@/types/fabric";
import type { Wood, WoodPolish } from "@/types/wood";

type PolishRef = WoodPolish & { woodName: string; woodId: number };

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

  const polishes = useMemo<PolishRef[]>(
    () =>
      woods.flatMap((wood) =>
        (wood.polishes ?? []).map((polish) => ({
          ...polish,
          woodName: wood.name,
          woodId: wood.id,
        })),
      ),
    [woods],
  );

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
        description="Stage product images via ZIP, download the Excel template, fill one row per product, then import from the Products list."
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
            Max 500 rows / 5 MB per Excel sheet · max 50 MB / 200 files per
            image ZIP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Stage images below: name files{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                {"{slug}__{sortOrder}.{ext}"}
              </code>
              , zip them, and upload. Wait for the staging job to finish.
            </li>
            <li>
              Download the sample Excel template (includes a{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                Lookups
              </code>{" "}
              sheet and dropdowns for{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                subCategoryId
              </code>{" "}
              and boolean columns).
            </li>
            <li>
              Fill one product per row. No{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                images
              </code>{" "}
              column is required — staged images are matched by slug. Use the ID
              reference tables for woods, polishes, and fabrics (
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                id
              </code>{" "}
              or{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                id:priceAdjustment
              </code>
              ).
            </li>
            <li>
              On the Products list, choose{" "}
              <span className="font-medium text-foreground">Bulk upload</span>{" "}
              and submit your{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">.xlsx</code>
              . Track progress on{" "}
              <Link
                to="/upload-jobs"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Upload jobs
              </Link>
              .
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>1. Stage images</CardTitle>
          <CardDescription>
            Upload a ZIP of product photos. Files are compressed to WebP and
            stored until Excel import attaches them by slug.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BulkProductImageZipUploader />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staged images</CardTitle>
          <CardDescription>
            Inspect or remove unconsumed staged rows before importing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StagedProductImagesPanel />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Excel template</CardTitle>
          <CardDescription>
            Header names must match the sample (case-insensitive). The workbook
            includes Products + Lookups sheets.
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
          <CardTitle>3. Column reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-medium">Customization pricing</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              {PRODUCT_BULK_PRICING_NOTES.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium">
              Result workbook columns (backend-appended)
            </p>
            <ul className="space-y-1.5 rounded-lg border bg-muted/20 p-3">
              {PRODUCT_BULK_RESULT_COLUMNS.map((row) => (
                <li
                  key={row.column}
                  className="grid gap-2 text-xs sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
                >
                  <span className="font-mono">{row.column}</span>
                  <span className="text-muted-foreground">{row.hint}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sub-category IDs</CardTitle>
          <CardDescription>
            Use the ID or the dropdown label{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {"{id} - Category > Sub-category"}
            </code>
            .{" "}
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Wood IDs</CardTitle>
            <CardDescription>
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                id
              </code>{" "}
              or{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                id:price
              </code>
              .{" "}
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
            <CardTitle>Polish IDs</CardTitle>
            <CardDescription>
              Must belong to an assigned wood. Same{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                id:price
              </code>{" "}
              format.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {refsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading…
              </div>
            ) : polishes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No polishes found on loaded woods.
              </p>
            ) : (
              <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
                {polishes.map((polish) => (
                  <li key={polish.id} className="flex gap-2">
                    <span className="font-mono tabular-nums">{polish.id}</span>
                    <span className="text-muted-foreground">
                      {polish.woodName} / {polish.name}
                    </span>
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
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                id
              </code>{" "}
              or{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                id:price
              </code>
              .{" "}
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
          <CardTitle>4. Import</CardTitle>
          <CardDescription>
            When the sheet is ready, open the Products list and use Bulk upload.
            Jobs appear on the Upload jobs page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button render={<Link to="/products">Go to Products</Link>} />
          <Button
            variant="outline"
            render={<Link to="/upload-jobs">View upload jobs</Link>}
          />
        </CardContent>
      </Card>
    </div>
  );
}
