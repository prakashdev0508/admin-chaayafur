import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCw, Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/query-keys";
import { formatRoleLabel, isSuperAdminSlug } from "@/lib/staff-utils";
import { listRoles } from "@/services/auth.service";

export function RoleListPage() {
  const { myPermissions } = useAuth();
  const isSuperAdmin = isSuperAdminSlug(
    myPermissions?.roleSlug ?? myPermissions?.role,
  );

  const rolesQuery = useQuery({
    queryKey: queryKeys.roles.list,
    queryFn: listRoles,
    enabled: isSuperAdmin,
  });

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Roles"
          description="Manage staff roles and permissions."
        />
        <EmptyState
          icon={Shield}
          title="Access restricted"
          description="Only Super Admins can manage roles."
        />
      </div>
    );
  }

  const roles = rolesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Roles"
        description="Create custom roles and assign permissions. System roles cannot be deleted."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => rolesQuery.refetch()}
              disabled={rolesQuery.isFetching}
            >
              <RefreshCw
                className={`size-4 ${rolesQuery.isFetching ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              render={
                <Link to="/roles/new">
                  <Plus className="size-4" />
                  Add role
                </Link>
              }
            />
          </div>
        }
      />

      {rolesQuery.error && (
        <p className="text-sm text-destructive">
          {rolesQuery.error instanceof Error
            ? rolesQuery.error.message
            : "Failed to load roles"}
        </p>
      )}

      {rolesQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : roles.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No roles found"
          description="Create a custom role to get started."
          action={<Button render={<Link to="/roles/new">Add role</Link>} />}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Permissions</th>
                <th className="px-4 py-3 font-medium">Staff</th>
                <th className="px-4 py-3 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      to={`/roles/${role.id}`}
                      className="font-medium hover:underline"
                    >
                      {formatRoleLabel(role)}
                    </Link>
                    {role.description ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {role.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{role.slug}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {role.permissions?.length ?? 0}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {role.staffCount ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      variant={
                        isSuperAdminSlug(role.slug)
                          ? "brand"
                          : role.isSystem
                            ? "neutral"
                            : "default"
                      }
                    >
                      {role.isSystem ? "System" : "Custom"}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
