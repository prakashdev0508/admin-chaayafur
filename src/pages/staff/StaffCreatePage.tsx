import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStaff } from "@/services/auth.service";
import { queryKeys } from "@/lib/query-keys";
import type { AssignableStaffRole } from "@/types/auth";
import { STAFF_ROLE_ITEMS } from "@/lib/select-items";

export function StaffCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [role, setRole] = useState<AssignableStaffRole>("ADMIN");

  const mutation = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      toast.success("Staff user created");
      navigate("/staff");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create staff",
      );
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Add staff user"
        description="Create a new admin or order manager account."
        action={
          <Button
            variant="outline"
            render={
              <Link to="/staff">
                <ArrowLeft className="size-4" />
                Back to staff
              </Link>
            }
          />
        }
      />

      <form
        className="mx-auto w-full max-w-md space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          await mutation.mutateAsync({
            email: String(form.get("email")),
            password: String(form.get("password")),
            role,
            firstName: String(form.get("firstName")) || undefined,
            lastName: String(form.get("lastName")) || undefined,
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" name="firstName" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" name="lastName" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={6}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={role}
            onValueChange={(v) => v && setRole(v as AssignableStaffRole)}
            items={STAFF_ROLE_ITEMS}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="ORDER_MANAGER">Order Manager</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Super Admin accounts cannot be created via this form.
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create staff user"}
        </Button>
      </form>
    </div>
  );
}
