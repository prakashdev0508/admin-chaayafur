import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateCustomerPayload } from "@/types/customer";

type CustomerFormProps = {
  onSubmit: (payload: CreateCustomerPayload) => Promise<unknown>;
  loading?: boolean;
};

export function CustomerForm({ onSubmit, loading }: CustomerFormProps) {
  return (
    <form
      className="mx-auto max-w-md space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        await onSubmit({ phone: String(form.get("phone")).trim() });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          name="phone"
          placeholder="9876543210"
          required
          pattern="[0-9]{10}"
          title="10-digit phone number"
        />
        <p className="text-xs text-muted-foreground">
          Phone is the customer account identifier and cannot be changed later.
        </p>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating..." : "Create customer"}
      </Button>
    </form>
  );
}
