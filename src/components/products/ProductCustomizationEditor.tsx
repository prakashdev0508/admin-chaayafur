import { useMemo, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { parseMoney } from "@/lib/customization-pricing";
import type {
  ProductFabricFormEntry,
  ProductPolishFormEntry,
  ProductWoodFormEntry,
} from "@/types/product";
import type { Fabric } from "@/types/fabric";
import type { Wood, WoodPolish } from "@/types/wood";

type ProductCustomizationEditorProps = {
  catalogWoods: Wood[];
  catalogFabrics: Fabric[];
  woodsLoading?: boolean;
  fabricsLoading?: boolean;
  woods: ProductWoodFormEntry[];
  polishes: ProductPolishFormEntry[];
  fabrics: ProductFabricFormEntry[];
  onWoodsChange: (woods: ProductWoodFormEntry[]) => void;
  onPolishesChange: (polishes: ProductPolishFormEntry[]) => void;
  onFabricsChange: (fabrics: ProductFabricFormEntry[]) => void;
};

function matchesQuery(name: string, query: string) {
  if (!query.trim()) return true;
  return name.toLowerCase().includes(query.trim().toLowerCase());
}

function AdjustmentInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex h-8 items-center overflow-hidden rounded-md border bg-background shadow-xs">
      <span className="border-r bg-muted/50 px-2 text-[11px] font-medium text-muted-foreground">
        +₹
      </span>
      <Input
        id={id}
        type="number"
        min="0"
        step="1"
        className="h-8 w-20 border-0 bg-transparent px-2 text-xs tabular-nums shadow-none focus-visible:ring-0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Price adjustment"
      />
    </div>
  );
}

function CatalogChip({
  name,
  color,
  subtitle,
  disabled,
  onAdd,
}: {
  name: string;
  color: string;
  subtitle?: string;
  disabled?: boolean;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onAdd}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border border-dashed px-2.5 py-1.5 text-left text-sm transition-colors",
        "hover:border-solid hover:border-foreground/20 hover:bg-muted/60",
        "active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      <span
        className="size-3.5 shrink-0 rounded-full border border-black/10 shadow-sm"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="max-w-28 truncate font-medium">{name}</span>
      {subtitle && (
        <span className="hidden text-[11px] text-muted-foreground sm:inline">
          {subtitle}
        </span>
      )}
      <Plus className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
    </button>
  );
}

export function ProductCustomizationEditor({
  catalogWoods,
  catalogFabrics,
  woodsLoading,
  fabricsLoading,
  woods,
  polishes,
  fabrics,
  onWoodsChange,
  onPolishesChange,
  onFabricsChange,
}: ProductCustomizationEditorProps) {
  const [woodQuery, setWoodQuery] = useState("");
  const [fabricQuery, setFabricQuery] = useState("");

  const assignedWoodIds = useMemo(
    () => new Set(woods.map((w) => w.woodId)),
    [woods],
  );
  const assignedPolishIds = useMemo(
    () => new Set(polishes.map((p) => p.woodPolishId)),
    [polishes],
  );
  const assignedFabricIds = useMemo(
    () => new Set(fabrics.map((f) => f.fabricId)),
    [fabrics],
  );

  const assignedWoods = useMemo(
    () =>
      woods
        .map((entry) => {
          const wood = catalogWoods.find((w) => w.id === entry.woodId);
          return wood ? { entry, wood } : null;
        })
        .filter(Boolean) as { entry: ProductWoodFormEntry; wood: Wood }[],
    [woods, catalogWoods],
  );

  const availableWoods = useMemo(
    () =>
      catalogWoods.filter(
        (w) => !assignedWoodIds.has(w.id) && matchesQuery(w.name, woodQuery),
      ),
    [catalogWoods, assignedWoodIds, woodQuery],
  );

  const assignedFabrics = useMemo(
    () =>
      fabrics
        .map((entry) => {
          const fabric = catalogFabrics.find((f) => f.id === entry.fabricId);
          return fabric ? { entry, fabric } : null;
        })
        .filter(Boolean) as {
        entry: ProductFabricFormEntry;
        fabric: Fabric;
      }[],
    [fabrics, catalogFabrics],
  );

  const availableFabrics = useMemo(
    () =>
      catalogFabrics.filter(
        (f) =>
          !assignedFabricIds.has(f.id) && matchesQuery(f.name, fabricQuery),
      ),
    [catalogFabrics, assignedFabricIds, fabricQuery],
  );

  const polishIdsForWood = (woodId: number) => {
    const wood = catalogWoods.find((w) => w.id === woodId);
    return (wood?.polishes ?? []).map((p) => p.id);
  };

  const addWood = (woodId: number) => {
    if (assignedWoodIds.has(woodId)) return;
    onWoodsChange([
      ...woods,
      { woodId, isActive: true, priceAdjustment: "0" },
    ]);
  };

  const removeWood = (woodId: number) => {
    const removePolishIds = new Set(polishIdsForWood(woodId));
    onWoodsChange(woods.filter((w) => w.woodId !== woodId));
    onPolishesChange(
      polishes.filter((p) => !removePolishIds.has(p.woodPolishId)),
    );
  };

  const updateWood = (
    woodId: number,
    patch: Partial<ProductWoodFormEntry>,
  ) => {
    onWoodsChange(
      woods.map((w) => (w.woodId === woodId ? { ...w, ...patch } : w)),
    );
  };

  const addPolish = (woodPolishId: number) => {
    if (assignedPolishIds.has(woodPolishId)) return;
    onPolishesChange([
      ...polishes,
      { woodPolishId, isActive: true, priceAdjustment: "0" },
    ]);
  };

  const removePolish = (woodPolishId: number) => {
    onPolishesChange(polishes.filter((p) => p.woodPolishId !== woodPolishId));
  };

  const updatePolish = (
    woodPolishId: number,
    patch: Partial<ProductPolishFormEntry>,
  ) => {
    onPolishesChange(
      polishes.map((p) =>
        p.woodPolishId === woodPolishId ? { ...p, ...patch } : p,
      ),
    );
  };

  const addFabric = (fabricId: number) => {
    if (assignedFabricIds.has(fabricId)) return;
    onFabricsChange([
      ...fabrics,
      { fabricId, isActive: true, priceAdjustment: "0" },
    ]);
  };

  const removeFabric = (fabricId: number) => {
    onFabricsChange(fabrics.filter((f) => f.fabricId !== fabricId));
  };

  const updateFabric = (
    fabricId: number,
    patch: Partial<ProductFabricFormEntry>,
  ) => {
    onFabricsChange(
      fabrics.map((f) => (f.fabricId === fabricId ? { ...f, ...patch } : f)),
    );
  };

  return (
    <Tabs defaultValue="woods" className="gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList>
          <TabsTrigger value="woods">
            Woods
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
              {woods.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="fabrics">
            Fabrics
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
              {fabrics.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <p className="text-xs text-muted-foreground">
          Price adjustments add to the selling price at checkout
        </p>
      </div>

      <TabsContent value="woods" className="mt-0 space-y-4">
        {woodsLoading ? (
          <p className="text-sm text-muted-foreground">Loading woods…</p>
        ) : catalogWoods.length === 0 ? (
          <EmptyCatalog hint="Create woods under Customization → Woods." />
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">Assigned</h3>
                {polishes.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {polishes.length} polish
                    {polishes.length === 1 ? "" : "es"}
                  </span>
                )}
              </div>
              {assignedWoods.length === 0 ? (
                <div className="rounded-xl border border-dashed px-4 py-8 text-center">
                  <p className="text-sm font-medium">No woods assigned</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add options below — customers can still skip wood on the
                    storefront
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedWoods.map(({ wood, entry }) => (
                    <AssignedWoodCard
                      key={wood.id}
                      wood={wood}
                      entry={entry}
                      polishes={polishes}
                      assignedPolishIds={assignedPolishIds}
                      onRemove={() => removeWood(wood.id)}
                      onUpdate={(patch) => updateWood(wood.id, patch)}
                      onAddPolish={addPolish}
                      onRemovePolish={removePolish}
                      onUpdatePolish={updatePolish}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-medium">Add from catalog</h3>
                <div className="relative w-full sm:max-w-56">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={woodQuery}
                    onChange={(e) => setWoodQuery(e.target.value)}
                    placeholder="Search woods…"
                    className="h-8 pl-8 text-sm"
                  />
                </div>
              </div>
              {availableWoods.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {woodQuery
                    ? "No matching woods left to add."
                    : "All catalog woods are assigned."}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableWoods.map((wood) => (
                    <CatalogChip
                      key={wood.id}
                      name={wood.name}
                      color={wood.color}
                      subtitle={
                        !wood.isActive
                          ? "inactive"
                          : (wood.polishes?.length ?? 0) > 0
                            ? `${wood.polishes!.length} polish`
                            : undefined
                      }
                      onAdd={() => addWood(wood.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </TabsContent>

      <TabsContent value="fabrics" className="mt-0 space-y-4">
        {fabricsLoading ? (
          <p className="text-sm text-muted-foreground">Loading fabrics…</p>
        ) : catalogFabrics.length === 0 ? (
          <EmptyCatalog hint="Create fabrics under Customization → Fabrics." />
        ) : (
          <>
            <section className="space-y-3">
              <h3 className="text-sm font-medium">Assigned</h3>
              {assignedFabrics.length === 0 ? (
                <div className="rounded-xl border border-dashed px-4 py-8 text-center">
                  <p className="text-sm font-medium">No fabrics assigned</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Optional — only assigned fabrics appear on the product page
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedFabrics.map(({ fabric, entry }) => (
                    <AssignedFabricCard
                      key={fabric.id}
                      fabric={fabric}
                      entry={entry}
                      onRemove={() => removeFabric(fabric.id)}
                      onUpdate={(patch) => updateFabric(fabric.id, patch)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-medium">Add from catalog</h3>
                <div className="relative w-full sm:max-w-56">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={fabricQuery}
                    onChange={(e) => setFabricQuery(e.target.value)}
                    placeholder="Search fabrics…"
                    className="h-8 pl-8 text-sm"
                  />
                </div>
              </div>
              {availableFabrics.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {fabricQuery
                    ? "No matching fabrics left to add."
                    : "All catalog fabrics are assigned."}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableFabrics.map((fabric) => (
                    <CatalogChip
                      key={fabric.id}
                      name={fabric.name}
                      color={fabric.color}
                      subtitle={!fabric.isActive ? "inactive" : undefined}
                      onAdd={() => addFabric(fabric.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}

function EmptyCatalog({ hint }: { hint: string }) {
  return (
    <div className="rounded-xl border border-dashed px-4 py-10 text-center">
      <p className="text-sm font-medium">Catalog is empty</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function AssignedWoodCard({
  wood,
  entry,
  polishes,
  assignedPolishIds,
  onRemove,
  onUpdate,
  onAddPolish,
  onRemovePolish,
  onUpdatePolish,
}: {
  wood: Wood;
  entry: ProductWoodFormEntry;
  polishes: ProductPolishFormEntry[];
  assignedPolishIds: Set<number>;
  onRemove: () => void;
  onUpdate: (patch: Partial<ProductWoodFormEntry>) => void;
  onAddPolish: (id: number) => void;
  onRemovePolish: (id: number) => void;
  onUpdatePolish: (
    id: number,
    patch: Partial<ProductPolishFormEntry>,
  ) => void;
}) {
  const catalogPolishes = wood.polishes ?? [];
  const adj = parseMoney(entry.priceAdjustment);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition-colors",
        entry.isActive
          ? "border-border bg-card"
          : "border-border/70 bg-muted/20 opacity-80",
      )}
    >
      <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:px-4">
        <span
          className="size-8 shrink-0 rounded-full border border-black/10 shadow-sm"
          style={{ backgroundColor: wood.color }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{wood.name}</p>
            {!wood.isActive && (
              <Badge variant="outline" className="font-normal">
                Catalog off
              </Badge>
            )}
            {!entry.isActive && (
              <Badge variant="secondary" className="font-normal">
                Hidden on product
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {adj > 0
              ? `Adds ${formatCurrency(adj)} when selected`
              : "No extra charge"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdjustmentInput
            id={`wood-adj-${wood.id}`}
            value={entry.priceAdjustment}
            onChange={(priceAdjustment) => onUpdate({ priceAdjustment })}
          />
          <div className="flex items-center gap-1.5 rounded-md border px-2 py-1">
            <Label
              htmlFor={`wood-on-${wood.id}`}
              className="text-[11px] font-normal text-muted-foreground"
            >
              Active
            </Label>
            <Switch
              id={`wood-on-${wood.id}`}
              checked={entry.isActive}
              onCheckedChange={(isActive) => onUpdate({ isActive })}
            />
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`Remove ${wood.name}`}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {catalogPolishes.length > 0 && (
        <div className="space-y-2 border-t bg-muted/20 px-3 py-3 sm:px-4">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Polishes
          </p>
          <div className="space-y-2">
            {catalogPolishes.map((polish: WoodPolish) => {
              const assigned = assignedPolishIds.has(polish.id);
              const polishEntry = polishes.find(
                (p) => p.woodPolishId === polish.id,
              );
              return (
                <div
                  key={polish.id}
                  className={cn(
                    "flex flex-wrap items-center gap-2 rounded-lg border bg-background px-2.5 py-2",
                    assigned ? "border-border" : "border-dashed",
                  )}
                >
                  <button
                    type="button"
                    onClick={() =>
                      assigned
                        ? onRemovePolish(polish.id)
                        : onAddPolish(polish.id)
                    }
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-1 py-0.5 text-sm transition-colors",
                      assigned
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded border",
                        assigned
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input",
                      )}
                    >
                      {assigned ? (
                        <Check className="size-2.5" />
                      ) : (
                        <Plus className="size-2.5 text-muted-foreground" />
                      )}
                    </span>
                    <span
                      className="size-2.5 rounded-full border border-black/10"
                      style={{ backgroundColor: polish.color }}
                      aria-hidden
                    />
                    <span>{polish.name}</span>
                  </button>
                  {assigned && polishEntry && (
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                      <AdjustmentInput
                        id={`polish-adj-${polish.id}`}
                        value={polishEntry.priceAdjustment}
                        onChange={(priceAdjustment) =>
                          onUpdatePolish(polish.id, { priceAdjustment })
                        }
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">
                          On
                        </span>
                        <Switch
                          checked={polishEntry.isActive}
                          onCheckedChange={(isActive) =>
                            onUpdatePolish(polish.id, { isActive })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AssignedFabricCard({
  fabric,
  entry,
  onRemove,
  onUpdate,
}: {
  fabric: Fabric;
  entry: ProductFabricFormEntry;
  onRemove: () => void;
  onUpdate: (patch: Partial<ProductFabricFormEntry>) => void;
}) {
  const adj = parseMoney(entry.priceAdjustment);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border px-3 py-3",
        entry.isActive
          ? "border-border bg-card"
          : "border-border/70 bg-muted/20 opacity-80",
      )}
    >
      <span
        className="size-8 shrink-0 rounded-full border border-black/10 shadow-sm"
        style={{ backgroundColor: fabric.color }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{fabric.name}</p>
        <p className="text-xs text-muted-foreground">
          {adj > 0
            ? `Adds ${formatCurrency(adj)} when selected`
            : "No extra charge"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <AdjustmentInput
          id={`fabric-adj-${fabric.id}`}
          value={entry.priceAdjustment}
          onChange={(priceAdjustment) => onUpdate({ priceAdjustment })}
        />
        <div className="flex items-center gap-1.5 rounded-md border px-2 py-1">
          <span className="text-[11px] text-muted-foreground">Active</span>
          <Switch
            checked={entry.isActive}
            onCheckedChange={(isActive) => onUpdate({ isActive })}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={`Remove ${fabric.name}`}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
