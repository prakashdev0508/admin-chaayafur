import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PurchaseOrderTermsEditorProps = {
  terms: string[];
  onChange: (terms: string[]) => void;
};

export function PurchaseOrderTermsEditor({
  terms,
  onChange,
}: PurchaseOrderTermsEditorProps) {
  function patchTerm(index: number, value: string) {
    onChange(terms.map((term, i) => (i === index ? value : term)));
  }

  function addTerm() {
    onChange([...terms, ""]);
  }

  function removeTerm(index: number) {
    onChange(terms.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {terms.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No terms yet. Add bullets to show at the bottom of the purchase order.
        </p>
      ) : (
        <ul className="space-y-2">
          {terms.map((term, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/70" />
              <div className="min-w-0 flex-1 space-y-1">
                <Label htmlFor={`po-term-${index}`} className="sr-only">
                  Term {index + 1}
                </Label>
                <Input
                  id={`po-term-${index}`}
                  value={term}
                  onChange={(e) => patchTerm(index, e.target.value)}
                  placeholder={`Term ${index + 1}`}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-0.5 shrink-0"
                onClick={() => removeTerm(index)}
                aria-label={`Remove term ${index + 1}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" variant="outline" size="sm" onClick={addTerm}>
        <Plus className="size-4" />
        Add term
      </Button>
    </div>
  );
}
