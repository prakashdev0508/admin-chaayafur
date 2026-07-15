import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RolePermissionsPicker } from "@/components/roles/RolePermissionsPicker";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { queryKeys } from "@/lib/query-keys";
import { formatRoleLabel, isSuperAdminSlug } from "@/lib/staff-utils";
import {
  deleteRole,
  getRole,
  listAssignablePermissions,
  updateRole,
} from "@/services/auth.service";

export function RoleDetailPage() {
  const { id } = useParams();
  const roleId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const roleQuery = useQuery({
    queryKey: queryKeys.roles.detail(roleId),
    queryFn: () => getRole(roleId),
    enabled: Number.isFinite(roleId),
  });

  const catalogQuery = useQuery({
    queryKey: queryKeys.roles.permissions,
    queryFn: listAssignablePermissions,
  });

  const role = roleQuery.data;
  const isLockedPermissions = isSuperAdminSlug(role?.slug);
  const canDelete =
    Boolean(role) &&
    !role!.isSystem &&
    (role!.staffCount ?? 0) === 0;

  useEffect(() => {
    if (!role) return;
    setName(role.name);
    setDescription(role.description ?? "");
    setPermissions(role.permissions ?? []);
  }, [role]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateRole(roleId, {
        name: name.trim(),
        description: description.trim() || null,
        ...(isLockedPermissions ? {} : { permissions }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.roles.detail(roleId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      toast.success("Role updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update role",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      toast.success("Role deleted");
      navigate("/roles");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete role",
      );
    },
  });

  if (!Number.isFinite(roleId)) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Role" description="Invalid role id." />
        <Button
          variant="outline"
          render={
            <Link to="/roles">
              <ArrowLeft className="size-4" />
              Back to roles
            </Link>
          }
        />
      </div>
    );
  }

  if (roleQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (roleQuery.error || !role) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Role" description="Role details." />
        <p className="text-sm text-destructive">
          {roleQuery.error instanceof Error
            ? roleQuery.error.message
            : "Failed to load role"}
        </p>
        <Button
          variant="outline"
          render={
            <Link to="/roles">
              <ArrowLeft className="size-4" />
              Back to roles
            </Link>
          }
        />
      </div>
    );
  }

  const catalog = Array.isArray(catalogQuery.data) ? catalogQuery.data : [];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={formatRoleLabel(role)}
        description={role.slug}
        action={
          <div className="flex gap-2">
            {canDelete && (
              <Button
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              render={
                <Link to="/roles">
                  <ArrowLeft className="size-4" />
                  Back to roles
                </Link>
              }
            />
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <StatusBadge variant={role.isSystem ? "neutral" : "default"}>
          {role.isSystem ? "System role" : "Custom role"}
        </StatusBadge>
        <StatusBadge variant="neutral">
          {role.staffCount ?? 0} staff
        </StatusBadge>
        {isLockedPermissions && (
          <StatusBadge variant="brand">Permissions locked</StatusBadge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            {isLockedPermissions
              ? "Super Admin permissions cannot be changed."
              : role.isSystem
                ? "System roles cannot be deleted, but permissions can be edited."
                : "Update name, description, and permissions. Delete only when no staff are assigned."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editRoleName">Name</Label>
                <Input
                  id="editRoleName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={role.slug} disabled className="font-mono" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editRoleDescription">Description</Label>
              <Textarea
                id="editRoleDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                  catalog={
                    isLockedPermissions
                      ? [...new Set([...catalog, ...(role.permissions ?? [])])]
                      : catalog
                  }
                  selected={permissions}
                  onChange={setPermissions}
                  disabled={isLockedPermissions}
                />
              )}
            </div>

            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete role?"
        description={`Delete “${role.name}”? This cannot be undone.`}
        confirmLabel="Delete role"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutateAsync()}
      />
    </div>
  );
}
