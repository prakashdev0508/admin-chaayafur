import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RolePermissionsPicker } from "@/components/roles/RolePermissionsPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { queryKeys } from "@/lib/query-keys";
import { slugifyRoleName } from "@/lib/staff-utils";
import {
  createRole,
  listAssignablePermissions,
} from "@/services/auth.service";

export function RoleCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

  const catalogQuery = useQuery({
    queryKey: queryKeys.roles.permissions,
    queryFn: listAssignablePermissions,
  });

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugifyRoleName(name));
    }
  }, [name, slugTouched]);

  const mutation = useMutation({
    mutationFn: createRole,
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      toast.success("Role created");
      navigate(`/roles/${role.id}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create role",
      );
    },
  });

  const catalog = Array.isArray(catalogQuery.data) ? catalogQuery.data : [];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Add role"
        description="Create a custom role and choose its permissions."
        action={
          <Button
            variant="outline"
            render={
              <Link to="/roles">
                <ArrowLeft className="size-4" />
                Back to roles
              </Link>
            }
          />
        }
      />

      <form
        className="mx-auto w-full max-w-3xl space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({
            name: name.trim(),
            slug: slug.trim().toUpperCase(),
            description: description.trim() || undefined,
            permissions,
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="roleName">Name</Label>
            <Input
              id="roleName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Warehouse Manager"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roleSlug">Slug</Label>
            <Input
              id="roleSlug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toUpperCase());
              }}
              placeholder="WAREHOUSE_MANAGER"
              required
              className="font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="roleDescription">Description</Label>
          <Textarea
            id="roleDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional short description"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Permissions</Label>
          {catalogQuery.isLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading permission catalog…
            </div>
          ) : (
            <RolePermissionsPicker
              catalog={catalog}
              selected={permissions}
              onChange={setPermissions}
            />
          )}
        </div>

        <Button
          type="submit"
          disabled={mutation.isPending || !name.trim() || !slug.trim()}
        >
          {mutation.isPending ? "Creating..." : "Create role"}
        </Button>
      </form>
    </div>
  );
}
