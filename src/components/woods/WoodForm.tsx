import { useState } from "react";
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
} from "@/types/wood";

type WoodFormProps = {
  initial?: Wood;
  onSubmit: (payload: CreateWoodPayload | UpdateWoodPayload) => Promise<unknown>;
  loading?: boolean;
  mode: "create" | "edit";
};

function getInitialValues(wood?: Wood): WoodFormValues {
  if (!wood) {
    return {
      name: "",
      slug: "",
      color: "#C4A574",
      isActive: true,
    };
  }
  return {
    name: wood.name,
    slug: wood.slug,
    color: wood.color,
    isActive: wood.isActive,
  };
}

export function WoodForm({ initial, onSubmit, loading, mode }: WoodFormProps) {
  const [values, setValues] = useState<WoodFormValues>(() =>
    getInitialValues(initial),
  );
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof WoodFormValues>(
    key: K,
    value: WoodFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
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
    setError(null);
    await onSubmit({
      name: values.name.trim(),
      slug: values.slug.trim(),
      color: values.color.trim(),
      isActive: values.isActive,
    });
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
          placeholder="Sonic"
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
          placeholder="sonic"
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
        <p className="text-xs text-muted-foreground">
          Hex color (e.g. #C4A574) or a short label.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <div>
          <Label htmlFor="wood-active">Active</Label>
          <p className="text-xs text-muted-foreground">
            Inactive woods are hidden from product selection.
          </p>
        </div>
        <Switch
          id="wood-active"
          checked={values.isActive}
          onCheckedChange={(checked) => updateField("isActive", checked)}
        />
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
