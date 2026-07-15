import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import { createStaff, listRoles } from "@/services/auth.service";
import { queryKeys } from "@/lib/query-keys";
import { formatRoleLabel, isSuperAdminSlug } from "@/lib/staff-utils";

export function StaffCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [roleId, setRoleId] = useState<string>("");

  const rolesQuery = useQuery({
    queryKey: queryKeys.roles.list,
    queryFn: listRoles,
  });

  const assignableRoles = (rolesQuery.data ?? []).filter(
    (role) => !isSuperAdminSlug(role.slug),
  );

  const roleItems = assignableRoles.map((role) => ({
    value: String(role.id),
    label: formatRoleLabel(role),
  }));

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
        description="Create a staff account and assign any role except Super Admin."
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
          if (!roleId) {
            toast.error("Select a role");
            return;
          }
          const form = new FormData(e.currentTarget);
          await mutation.mutateAsync({
            email: String(form.get("email")),
            password: String(form.get("password")),
            roleId: Number(roleId),
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
          {rolesQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading roles…
            </div>
          ) : (
            <Select
              value={roleId || undefined}
              onValueChange={(v) => v && setRoleId(v)}
              items={roleItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {formatRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-muted-foreground">
            Super Admin cannot be assigned here. Manage roles under Roles.
          </p>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending || !roleId}
        >
          {mutation.isPending ? "Creating..." : "Create staff user"}
        </Button>
      </form>
    </div>
  );
}
