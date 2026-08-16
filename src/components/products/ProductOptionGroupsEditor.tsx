import { useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MAX_PRODUCT_CUSTOMIZATION_OPTIONS } from "@/lib/product-customization";
import { parseMoney } from "@/lib/customization-pricing";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { uploadProductImage } from "@/services/uploads.service";
import type { ProductCustomizationFormEntry } from "@/types/product";

const GROUP_SUGGESTIONS = ["Finish", "Size", "Cushion", "Color"] as const;

type ProductOptionGroupsEditorProps = {
  options: ProductCustomizationFormEntry[];
  onChange: (options: ProductCustomizationFormEntry[]) => void;
  disabled?: boolean;
};

type GroupBlock = {
  name: string;
  key: string;
  rows: Array<{ option: ProductCustomizationFormEntry; index: number }>;
};

function collectGroups(
  options: ProductCustomizationFormEntry[],
  keys: Map<string, string>,
): GroupBlock[] {
  const groups: GroupBlock[] = [];
  const seen = new Map<string, number>();

  options.forEach((option, index) => {
    const lookup = option.groupName.toLowerCase();
    const existing = seen.get(lookup);
    if (existing == null) {
      let key = keys.get(lookup);
      if (!key) {
        key = crypto.randomUUID();
        keys.set(lookup, key);
      }
      seen.set(lookup, groups.length);
      groups.push({
        name: option.groupName,
        key,
        rows: [{ option, index }],
      });
      return;
    }
    groups[existing].rows.push({ option, index });
  });

  return groups;
}

export function ProductOptionGroupsEditor({
  options,
  onChange,
  disabled,
}: ProductOptionGroupsEditorProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);
  const groupKeysRef = useRef(new Map<string, string>());
  const groups = collectGroups(options, groupKeysRef.current);
  const usedNames = new Set(groups.map((group) => group.name.toLowerCase()));
  const unusedSuggestions = GROUP_SUGGESTIONS.filter(
    (name) => !usedNames.has(name.toLowerCase()),
  );
  const resolvedKey =
    groups.find((group) => group.key === activeGroupKey)?.key ??
    groups[0]?.key ??
    "";

  const addGroup = (rawName?: string) => {
    const name = (rawName ?? newGroupName).trim();
    if (!name) return;
    if (usedNames.has(name.toLowerCase())) {
      toast.error("That group already exists");
      return;
    }
    if (options.length >= MAX_PRODUCT_CUSTOMIZATION_OPTIONS) {
      toast.error(`Maximum ${MAX_PRODUCT_CUSTOMIZATION_OPTIONS} options`);
      return;
    }
    const key = crypto.randomUUID();
    groupKeysRef.current.set(name.toLowerCase(), key);
    setActiveGroupKey(key);
    onChange([
      ...options,
      { groupName: name, value: "", price: "0", image: "" },
    ]);
    setNewGroupName("");
  };

  const renameGroup = (current: string, next: string) => {
    const from = current.toLowerCase();
    const to = next.toLowerCase();
    const id = groupKeysRef.current.get(from);
    if (id) {
      groupKeysRef.current.delete(from);
      groupKeysRef.current.set(to, id);
    }
    onChange(
      options.map((option) =>
        option.groupName === current ? { ...option, groupName: next } : option,
      ),
    );
  };

  const removeGroup = (groupName: string) => {
    onChange(options.filter((option) => option.groupName !== groupName));
  };

  const addValue = (groupName: string) => {
    if (options.length >= MAX_PRODUCT_CUSTOMIZATION_OPTIONS) {
      toast.error(`Maximum ${MAX_PRODUCT_CUSTOMIZATION_OPTIONS} options`);
      return;
    }
    onChange([...options, { groupName, value: "", price: "0", image: "" }]);
  };

  const updateOption = (
    index: number,
    patch: Partial<ProductCustomizationFormEntry>,
  ) => {
    onChange(
      options.map((option, i) =>
        i === index ? { ...option, ...patch } : option,
      ),
    );
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-12 text-center">
        <p className="text-sm font-medium">Add your first group</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          A group is one choice on the product, like Finish or Size. Then add
          values with a photo and extra price.
        </p>
        <div className="mx-auto mt-6 flex max-w-md gap-2">
          <Input
            value={newGroupName}
            disabled={disabled}
            placeholder="Group name"
            aria-label="New group name"
            className="h-10"
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addGroup();
              }
            }}
          />
          <Button
            type="button"
            disabled={disabled || !newGroupName.trim()}
            onClick={() => addGroup()}
          >
            <Plus />
            Add
          </Button>
        </div>
        {unusedSuggestions.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {unusedSuggestions.map((name) => (
              <button
                key={name}
                type="button"
                disabled={disabled}
                onClick={() => addGroup(name)}
                className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground active:scale-[0.97]"
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={resolvedKey}
        onValueChange={(value) => {
          if (value) setActiveGroupKey(value);
        }}
        className="gap-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <TabsList
            variant="line"
            className="h-auto min-w-0 flex-1 flex-nowrap justify-start gap-0 overflow-x-auto rounded-none border-b bg-transparent p-0"
          >
            {groups.map((group) => (
              <TabsTrigger
                key={group.key}
                value={group.key}
                className="min-h-10 shrink-0 rounded-none px-3 py-2 after:bottom-0 data-active:after:h-0.5"
              >
                {group.name.trim() || "Untitled"}
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {group.rows.length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {groups.map((group) => (
          <TabsContent key={group.key} value={group.key} className="mt-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={group.name}
                disabled={disabled}
                className="h-9 max-w-64 text-sm font-medium"
                onChange={(e) => renameGroup(group.name, e.target.value)}
                aria-label="Group name"
              />
              <p className="text-xs text-muted-foreground">
                Customers pick one of these values
              </p>
              <div className="ml-auto flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => addValue(group.name)}
                >
                  <Plus />
                  Add value
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeGroup(group.name)}
                >
                  <Trash2 />
                  Remove group
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {group.rows.map(({ option, index }) => (
                <OptionCard
                  key={index}
                  option={option}
                  disabled={disabled}
                  onChange={(patch) => updateOption(index, patch)}
                  onRemove={() => removeOption(index)}
                />
              ))}
              <button
                type="button"
                disabled={disabled}
                onClick={() => addValue(group.name)}
                className="flex min-h-72 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 text-muted-foreground transition-colors hover:border-foreground/25 hover:bg-background hover:text-foreground active:scale-[0.99] disabled:opacity-50"
              >
                <span className="flex size-11 items-center justify-center rounded-full border bg-background">
                  <Plus className="size-4" />
                </span>
                <span className="text-sm font-medium">Add value</span>
                <span className="px-6 text-center text-xs">
                  Photo, name, and extra price
                </span>
              </button>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/15 p-2.5">
        <Input
          value={newGroupName}
          disabled={disabled}
          placeholder="New group name"
          className="h-9 min-w-48 flex-1 bg-background"
          aria-label="New group name"
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addGroup();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || !newGroupName.trim()}
          onClick={() => addGroup()}
        >
          <Plus />
          Add group
        </Button>
        {unusedSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {unusedSuggestions.map((name) => (
              <button
                key={name}
                type="button"
                disabled={disabled}
                onClick={() => addGroup(name)}
                className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OptionCard({
  option,
  disabled,
  onChange,
  onRemove,
}: {
  option: ProductCustomizationFormEntry;
  disabled?: boolean;
  onChange: (patch: Partial<ProductCustomizationFormEntry>) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const adj = parseMoney(option.price);
  const preview = localPreview || option.image;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setUploading(true);
    try {
      const uploaded = await uploadProductImage(file);
      onChange({ image: uploaded.url });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not upload image",
      );
    } finally {
      URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-background shadow-xs">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div
        className={cn(
          "group/image relative aspect-4/3 overflow-hidden bg-muted/40",
          dragging && "ring-2 ring-ring ring-inset",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt={option.value || "Option image"}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
            <ImagePlus className="size-8 opacity-45" />
            <span className="text-xs leading-snug">
              Drop a photo here, or click to upload
            </span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-background/70 backdrop-blur-[1px]">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Uploading…</span>
          </div>
        )}

        {!disabled && !uploading && (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0"
              aria-label={
                preview ? "Change option image" : "Upload option image"
              }
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-linear-to-t from-black/55 to-transparent p-3 opacity-0 transition-opacity duration-150 group-hover/image:opacity-100">
              <span className="rounded-md bg-background/90 px-2 py-0.5 text-[11px] font-medium">
                {preview ? "Change photo" : "Add photo"}
              </span>
            </div>
            {preview ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ image: "" });
                }}
                className="absolute top-2 right-2 z-10 inline-flex size-8 items-center justify-center rounded-md bg-background/90 text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-foreground group-hover/image:opacity-100"
                aria-label="Remove option image"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <Input
          value={option.value}
          disabled={disabled}
          placeholder="Value name, e.g. Walnut"
          className="h-9 text-sm"
          onChange={(e) => onChange({ value: e.target.value })}
        />
        <div className="flex h-9 items-center overflow-hidden rounded-md border bg-background">
          <span className="border-r bg-muted/50 px-2.5 text-xs font-medium text-muted-foreground">
            Extra ₹
          </span>
          <Input
            type="number"
            min="0"
            step="1"
            disabled={disabled}
            className="h-9 min-w-0 flex-1 border-0 bg-transparent px-2.5 text-sm tabular-nums shadow-none focus-visible:ring-0"
            value={option.price}
            onChange={(e) => onChange({ price: e.target.value })}
            aria-label="Extra price"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {adj > 0 ? `Adds ${formatCurrency(adj)} to the price` : "No extra charge"}
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
            aria-label="Remove value"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
