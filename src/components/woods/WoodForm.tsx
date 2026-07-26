import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { slugify } from "@/lib/product-utils";
import type {
  CreateWoodPayload,
  UpdateWoodPayload,
  Wood,
  WoodFormValues,
  WoodPolishFormEntry,
  WoodPolishInput,
} from "@/types/wood";

type WoodFormProps = {
  initial?: Wood;
  onSubmit: (payload: CreateWoodPayload | UpdateWoodPayload) => Promise<unknown>;
  loading?: boolean;
  mode: "create" | "edit";
};

function emptyPolish(key: string): WoodPolishFormEntry {
  return {
    key,
    name: "",
    slug: "",
    color: "#E8E8E8",
    isActive: true,
    slugTouched: false,
  };
}

function getInitialValues(wood?: Wood): WoodFormValues {
  if (!wood) {
    return {
      name: "",
      slug: "",
      color: "#C4A574",
      isActive: true,
      polishes: [],
    };
  }
  return {
    name: wood.name,
    slug: wood.slug,
    color: wood.color,
    isActive: wood.isActive,
    polishes: (wood.polishes ?? []).map((p) => ({
      key: `id-${p.id}`,
      name: p.name,
      slug: p.slug,
      color: p.color,
      isActive: p.isActive,
      slugTouched: true,
    })),
  };
}

function polishesToPayload(polishes: WoodPolishFormEntry[]): WoodPolishInput[] {
  return polishes
    .filter((p) => p.name.trim() && p.slug.trim() && p.color.trim())
    .map((p) => ({
      name: p.name.trim(),
      slug: p.slug.trim(),
      color: p.color.trim(),
      isActive: p.isActive,
    }));
}

function polishesEqual(
  a: WoodPolishFormEntry[],
  b: { name: string; slug: string; color: string; isActive: boolean }[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((entry, i) => {
    const other = b[i];
    return (
      entry.name === other.name &&
      entry.slug === other.slug &&
      entry.color === other.color &&
      entry.isActive === other.isActive
    );
  });
}

export function WoodForm({ initial, onSubmit, loading, mode }: WoodFormProps) {
  const [values, setValues] = useState<WoodFormValues>(() =>
    getInitialValues(initial),
  );
  const initialPolishesRef = useRef(
    (initial?.polishes ?? []).map((p) => ({
      name: p.name,
      slug: p.slug,
      color: p.color,
      isActive: p.isActive,
    })),
  );
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const polishKeyRef = useRef(0);

  function updateField<K extends keyof WoodFormValues>(
    key: K,
    value: WoodFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function updatePolish(
    key: string,
    patch: Partial<WoodPolishFormEntry>,
  ) {
    setValues((prev) => ({
      ...prev,
      polishes: prev.polishes.map((p) =>
        p.key === key ? { ...p, ...patch } : p,
      ),
    }));
  }

  function addPolish() {
    polishKeyRef.current += 1;
    setValues((prev) => ({
      ...prev,
      polishes: [
        ...prev.polishes,
        emptyPolish(`new-${polishKeyRef.current}`),
      ],
    }));
  }

  function removePolish(key: string) {
    setValues((prev) => ({
      ...prev,
      polishes: prev.polishes.filter((p) => p.key !== key),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!values.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!values.slug.trim()) {
      setError("Slug is required");
      return;
    }
    if (!values.color.trim()) {
      setError("Color is required");
      return;
    }
    for (const polish of values.polishes) {
      if (!polish.name.trim() || !polish.slug.trim() || !polish.color.trim()) {
        setError("Each polish needs a name, slug, and color");
        return;
      }
    }
    setError(null);

    const base = {
      name: values.name.trim(),
      slug: values.slug.trim(),
      color: values.color.trim(),
      isActive: values.isActive,
    };

    if (mode === "create") {
      await onSubmit({
        ...base,
        polishes: polishesToPayload(values.polishes),
      } satisfies CreateWoodPayload);
      return;
    }

    const polishPayload = polishesToPayload(values.polishes);
    const polishesUnchanged = polishesEqual(
      values.polishes,
      initialPolishesRef.current,
    );

    const update: UpdateWoodPayload = { ...base };
    if (!polishesUnchanged) {
      update.polishes = polishPayload;
    }
    await onSubmit(update);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-lg flex-col gap-5">
      <div className="space-y-2">
        <Label htmlFor="wood-name">Name</Label>
        <Input
          id="wood-name"
          value={values.name}
          onChange={(e) => updateField("name", e.target.value)}
          onBlur={() => {
            if (!slugTouched && values.name.trim()) {
              updateField("slug", slugify(values.name));
            }
          }}
          placeholder="CSUM"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="wood-slug">Slug</Label>
        <Input
          id="wood-slug"
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            updateField("slug", e.target.value);
          }}
          placeholder="csum"
          className="font-mono"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="wood-color">Color</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={
              values.color.startsWith("#") && values.color.length === 7
                ? values.color
                : "#C4A574"
            }
            onChange={(e) => updateField("color", e.target.value)}
            className="size-9 cursor-pointer rounded border border-input bg-transparent p-0.5"
            aria-label="Pick color"
          />
          <Input
            id="wood-color"
            value={values.color}
            onChange={(e) => updateField("color", e.target.value)}
            placeholder="#C4A574"
            className="font-mono"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <div>
          <Label htmlFor="wood-active">Active</Label>
          <p className="text-xs text-muted-foreground">
            Inactive woods are not selectable on products.
          </p>
        </div>
        <Switch
          id="wood-active"
          checked={values.isActive}
          onCheckedChange={(checked) => updateField("isActive", checked)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <Label>Polishes</Label>
            <p className="text-xs text-muted-foreground">
              Optional finishes nested under this wood.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addPolish}>
            <Plus className="size-4" />
            Add polish
          </Button>
        </div>

        {values.polishes.length === 0 && (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
            No polishes yet.
          </p>
        )}

        {values.polishes.map((polish, index) => (
          <div
            key={polish.key}
            className="space-y-3 rounded-lg border p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Polish {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removePolish(polish.key)}
                aria-label="Remove polish"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={polish.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    updatePolish(polish.key, {
                      name,
                      ...(!polish.slugTouched
                        ? { slug: slugify(name) }
                        : {}),
                    });
                  }}
                  placeholder="Matte"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={polish.slug}
                  onChange={(e) =>
                    updatePolish(polish.key, {
                      slug: e.target.value,
                      slugTouched: true,
                    })
                  }
                  placeholder="matte"
                  className="font-mono"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[10rem] flex-1 space-y-1.5">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={
                      polish.color.startsWith("#") && polish.color.length === 7
                        ? polish.color
                        : "#E8E8E8"
                    }
                    onChange={(e) =>
                      updatePolish(polish.key, { color: e.target.value })
                    }
                    className="size-9 cursor-pointer rounded border border-input bg-transparent p-0.5"
                    aria-label="Polish color"
                  />
                  <Input
                    value={polish.color}
                    onChange={(e) =>
                      updatePolish(polish.key, { color: e.target.value })
                    }
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pb-1">
                <Switch
                  checked={polish.isActive}
                  onCheckedChange={(checked) =>
                    updatePolish(polish.key, { isActive: checked })
                  }
                />
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading
          ? "Saving…"
          : mode === "create"
            ? "Create wood"
            : "Save changes"}
      </Button>
    </form>
  );
}
