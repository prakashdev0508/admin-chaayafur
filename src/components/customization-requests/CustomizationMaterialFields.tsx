import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Fabric } from "@/types/fabric";
import type { Wood } from "@/types/wood";

type CustomizationMaterialFieldsProps = {
  woods: Wood[];
  fabrics: Fabric[];
  woodId: number | null;
  polishId: number | null;
  fabricId: number | null;
  onWoodChange: (woodId: number | null) => void;
  onPolishChange: (polishId: number | null) => void;
  onFabricChange: (fabricId: number | null) => void;
  disabled?: boolean;
};

export function CustomizationMaterialFields({
  woods,
  fabrics,
  woodId,
  polishId,
  fabricId,
  onWoodChange,
  onPolishChange,
  onFabricChange,
  disabled,
}: CustomizationMaterialFieldsProps) {
  const selectedWood = woods.find((wood) => wood.id === woodId);
  const polishes = selectedWood?.polishes ?? [];

  const woodItems = useMemo(
    () =>
      woods.map((wood) => ({
        value: String(wood.id),
        label: wood.name,
      })),
    [woods],
  );

  const polishItems = useMemo(
    () =>
      polishes.map((polish) => ({
        value: String(polish.id),
        label: polish.name,
      })),
    [polishes],
  );

  const fabricItems = useMemo(
    () =>
      fabrics.map((fabric) => ({
        value: String(fabric.id),
        label: fabric.name,
      })),
    [fabrics],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Wood (optional)</Label>
        <Select
          value={woodId ? String(woodId) : null}
          onValueChange={(value) => {
            if (!value) {
              onWoodChange(null);
              onPolishChange(null);
              return;
            }
            onWoodChange(Number(value));
            onPolishChange(null);
          }}
          disabled={disabled}
          items={[{ value: "", label: "None" }, ...woodItems]}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="No wood selected" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {woods.map((wood) => (
              <SelectItem key={wood.id} value={String(wood.id)}>
                {wood.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {woodId && polishes.length > 0 && (
        <div className="space-y-2">
          <Label>Polish (optional)</Label>
          <Select
            value={polishId ? String(polishId) : null}
            onValueChange={(value) => {
              if (!value) {
                onPolishChange(null);
                return;
              }
              onPolishChange(Number(value));
            }}
            disabled={disabled}
            items={[{ value: "", label: "None" }, ...polishItems]}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="No polish selected" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {polishes.map((polish) => (
                <SelectItem key={polish.id} value={String(polish.id)}>
                  {polish.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Fabric (optional)</Label>
        <Select
          value={fabricId ? String(fabricId) : null}
          onValueChange={(value) => {
            if (!value) {
              onFabricChange(null);
              return;
            }
            onFabricChange(Number(value));
          }}
          disabled={disabled}
          items={[{ value: "", label: "None" }, ...fabricItems]}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="No fabric selected" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {fabrics.map((fabric) => (
              <SelectItem key={fabric.id} value={String(fabric.id)}>
                {fabric.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
