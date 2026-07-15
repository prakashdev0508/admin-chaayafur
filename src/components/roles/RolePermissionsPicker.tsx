import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  formatPermissionLabel,
  groupPermissions,
} from "@/lib/permission-labels";

type RolePermissionsPickerProps = {
  catalog: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

export function RolePermissionsPicker({
  catalog,
  selected,
  onChange,
  disabled = false,
}: RolePermissionsPickerProps) {
  const selectedSet = new Set(selected);
  const groups = groupPermissions(catalog);

  const toggle = (key: string, checked: boolean) => {
    const next = new Set(selectedSet);
    if (checked) next.add(key);
    else next.delete(key);
    onChange([...next].sort());
  };

  const toggleGroup = (keys: string[], checked: boolean) => {
    const next = new Set(selectedSet);
    for (const key of keys) {
      if (checked) next.add(key);
      else next.delete(key);
    }
    onChange([...next].sort());
  };

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No assignable permissions available.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const allSelected = group.permissions.every((p) => selectedSet.has(p));
        const someSelected =
          !allSelected && group.permissions.some((p) => selectedSet.has(p));

        return (
          <div key={group.title} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                disabled={disabled}
                onCheckedChange={(value) =>
                  toggleGroup(group.permissions, Boolean(value))
                }
                id={`group-${group.title}`}
              />
              <Label
                htmlFor={`group-${group.title}`}
                className="text-sm font-medium"
              >
                {group.title}
                {someSelected && !allSelected ? (
                  <span className="ml-1 font-normal text-muted-foreground">
                    (partial)
                  </span>
                ) : null}
              </Label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.permissions.map((key) => (
                <label
                  key={key}
                  className="flex items-start gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted/40"
                >
                  <Checkbox
                    checked={selectedSet.has(key)}
                    disabled={disabled}
                    onCheckedChange={(value) => toggle(key, Boolean(value))}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block">{formatPermissionLabel(key)}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {key}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
