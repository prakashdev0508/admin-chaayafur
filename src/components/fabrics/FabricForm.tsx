import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { slugify } from "@/lib/product-utils";
import type {
  CreateFabricPayload,
  Fabric,
  FabricFormValues,
  UpdateFabricPayload,
} from "@/types/fabric";

type FabricFormProps = {
  initial?: Fabric;
  onSubmit: (
    payload: CreateFabricPayload | UpdateFabricPayload,
  ) => Promise<unknown>;
  loading?: boolean;
  mode: "create" | "edit";
};

function getInitialValues(fabric?: Fabric): FabricFormValues {
  if (!fabric) {
    return {
      name: "",
      slug: "",
      color: "#D4C4A8",
      isActive: true,
    };
  }
  return {
    name: fabric.name,
    slug: fabric.slug,
    color: fabric.color,
    isActive: fabric.isActive,
  };
}

export function FabricForm({
  initial,
  onSubmit,
  loading,
  mode,
}: FabricFormProps) {
  const [values, setValues] = useState<FabricFormValues>(() =>
    getInitialValues(initial),
  );
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FabricFormValues>(
    key: K,
    value: FabricFormValues[K],
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
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-lg flex-col gap-5"
    >
      <div className="space-y-2">
        <Label htmlFor="fabric-name">Name</Label>
        <Input
          id="fabric-name"
          value={values.name}
          onChange={(e) => updateField("name", e.target.value)}
          onBlur={() => {
            if (!slugTouched && values.name.trim()) {
              updateField("slug", slugify(values.name));
            }
          }}
          placeholder="Linen Beige"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fabric-slug">Slug</Label>
        <Input
          id="fabric-slug"
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            updateField("slug", e.target.value);
          }}
          placeholder="linen-beige"
          className="font-mono"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fabric-color">Color</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={
              values.color.startsWith("#") && values.color.length === 7
                ? values.color
                : "#D4C4A8"
            }
            onChange={(e) => updateField("color", e.target.value)}
            className="size-9 cursor-pointer rounded border border-input bg-transparent p-0.5"
            aria-label="Pick color"
          />
          <Input
            id="fabric-color"
            value={values.color}
            onChange={(e) => updateField("color", e.target.value)}
            placeholder="#D4C4A8"
            className="font-mono"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <div>
          <Label htmlFor="fabric-active">Active</Label>
          <p className="text-xs text-muted-foreground">
            Inactive fabrics are not selectable on products.
          </p>
        </div>
        <Switch
          id="fabric-active"
          checked={values.isActive}
          onCheckedChange={(checked) => updateField("isActive", checked)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading
          ? "Saving…"
          : mode === "create"
            ? "Create fabric"
            : "Save changes"}
      </Button>
    </form>
  );
}
