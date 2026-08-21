import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatQuoteRupees, grandTotal, lineTotal, parseUnitPrice } from "@/lib/quotation";
import { queryKeys } from "@/lib/query-keys";
import { listProducts } from "@/services/products.service";
import { uploadOrderLineImage } from "@/services/uploads.service";
import type { ProductListItem } from "@/types/product";
import type { QuotationLineItem } from "@/types/quotation";
import { toast } from "sonner";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

type QuotationLineItemsEditorProps = {
  items: QuotationLineItem[];
  onChange: (items: QuotationLineItem[]) => void;
};

export function QuotationLineItemsEditor({
  items,
  onChange,
}: QuotationLineItemsEditorProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [customPrice, setCustomPrice] = useState("0");
  const [customImageUploading, setCustomImageUploading] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [customImageStorageKey, setCustomImageStorageKey] = useState<
    string | null
  >(null);

  const [uploadingLineId, setUploadingLineId] = useState<string | null>(null);

  const searchQuery = useQuery({
    queryKey: queryKeys.products.list({
      name: debouncedSearch,
      limit: 10,
      isActive: true,
      scope: "quotation-product-search",
    }),
    queryFn: () =>
      listProducts({
        name: debouncedSearch,
        limit: 10,
        page: 1,
        isActive: true,
      }),
    enabled: debouncedSearch.length >= 2,
  });

  const results = searchQuery.data?.items ?? [];

  function addProduct(product: ProductListItem) {
    const unitPrice = parseUnitPrice(product.price);
    onChange([
      ...items,
      {
        id:
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${product.id}-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        imageUrl: product.primaryImage?.url ?? null,
        imageStorageKey: null,
        quantity: 1,
        unitPrice,
      },
    ]);
    setSearch("");
  }

  function updateItem(id: string, patch: Partial<QuotationLineItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  async function handleCustomImageFileUpload(file: File) {
    setCustomImageUploading(true);
    try {
      const uploaded = await uploadOrderLineImage(file);
      setCustomImageUrl(uploaded.url);
      setCustomImageStorageKey(uploaded.storageKey);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload line image",
      );
    } finally {
      setCustomImageUploading(false);
    }
  }

  async function handleReplaceLineImage(lineId: string, file: File) {
    setUploadingLineId(lineId);
    try {
      const uploaded = await uploadOrderLineImage(file);
      onChange(
        items.map((it) =>
          it.id === lineId
            ? {
                ...it,
                imageUrl: uploaded.url,
                imageStorageKey: uploaded.storageKey,
              }
            : it,
        ),
      );
      toast.success("Image updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload line image",
      );
    } finally {
      setUploadingLineId(null);
    }
  }

  function resetCustomForm() {
    setCustomName("");
    setCustomQty("1");
    setCustomPrice("0");
    setCustomImageUploading(false);
    setCustomImageUrl(null);
    setCustomImageStorageKey(null);
  }

  function addCustomItem() {
    const qty = Math.max(1, Number.parseInt(customQty, 10) || 1);
    const unitPrice = parseUnitPrice(customPrice);
    const name = customName.trim();
    if (!name) {
      toast.error("Enter custom item name");
      return;
    }

    onChange([
      ...items,
      {
        id:
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `custom-${Date.now()}`,
        productId: null,
        productName: name,
        imageUrl: customImageUrl,
        imageStorageKey: customImageStorageKey,
        quantity: qty,
        unitPrice,
      },
    ]);

    setCustomOpen(false);
    resetCustomForm();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCustomOpen((v) => !v)}
        >
          <Plus className="size-4" />
          Add custom item
        </Button>
      </div>

      {customOpen ? (
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="custom-item-name">Item name</Label>
              <Input
                id="custom-item-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Custom teak dining table"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-item-qty">Qty</Label>
              <Input
                id="custom-item-qty"
                type="number"
                min={1}
                step={1}
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-item-price">Unit price</Label>
              <Input
                id="custom-item-price"
                type="number"
                min={0}
                step="0.01"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Image (optional)</Label>
              <Input
                type="file"
                accept="image/*"
                disabled={customImageUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void handleCustomImageFileUpload(file);
                }}
              />
              {customImageUrl ? (
                <img
                  src={customImageUrl}
                  alt="Custom line preview"
                  className="mt-2 size-12 rounded-md object-cover border"
                />
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCustomOpen(false);
                resetCustomForm();
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => addCustomItem()}>
              Add
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="quotation-product-search">Search product</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            id="quotation-product-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a product name to add it…"
            className="pl-8"
            autoComplete="off"
          />
        </div>
        {debouncedSearch.length > 0 && debouncedSearch.length < 2 ? (
          <p className="text-xs text-muted-foreground">Type at least 2 characters.</p>
        ) : null}
        {debouncedSearch.length >= 2 ? (
          <div className="max-h-56 overflow-y-auto rounded-lg border">
            {searchQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Searching…
              </div>
            ) : results.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">No products found.</p>
            ) : (
              <ul className="divide-y">
                {results.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 p-2.5 text-left hover:bg-muted/60"
                      onClick={() => addProduct(product)}
                    >
                      {product.primaryImage ? (
                        <img
                          src={product.primaryImage.url}
                          alt=""
                          className="size-10 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="size-10 shrink-0 rounded-md bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatQuoteRupees(product.price)}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No products yet. Search above to add line items.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="w-24">Qty</TableHead>
              <TableHead className="w-32">Unit price</TableHead>
              <TableHead className="w-28 text-right">Amount</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="max-w-56 whitespace-normal font-medium">
                  <div className="flex items-center gap-2">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="size-10 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="size-10 shrink-0 rounded-md bg-muted" />
                    )}
                    {item.productId == null ? (
                      <Input
                        value={item.productName}
                        onChange={(e) =>
                          updateItem(item.id, { productName: e.target.value })
                        }
                        aria-label="Custom item name"
                      />
                    ) : (
                      <span>{item.productName}</span>
                    )}
                  </div>

                  {item.productId == null ? (
                    <div className="mt-2">
                      <Input
                        type="file"
                        accept="image/*"
                        disabled={uploadingLineId === item.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          void handleReplaceLineImage(item.id, file);
                        }}
                      />
                      {uploadingLineId === item.id ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Uploading…
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, {
                        quantity: Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                      })
                    }
                    aria-label={`Quantity for ${item.productName}`}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(item.id, {
                        unitPrice: parseUnitPrice(e.target.value),
                      })
                    }
                    aria-label={`Unit price for ${item.productName}`}
                  />
                </TableCell>
                <TableCell className="text-right">
                  {formatQuoteRupees(lineTotal(item))}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.productName}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="text-right">
                Total
              </TableCell>
              <TableCell className="text-right">
                {formatQuoteRupees(grandTotal(items))}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      )}
    </div>
  );
}
