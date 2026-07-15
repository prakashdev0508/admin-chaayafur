import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StaffActivityStatsGrid } from "@/components/staff/StaffActivityStatsGrid";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import {
  formatRoleLabel,
  formatStaffName,
  isSuperAdminSlug,
} from "@/lib/staff-utils";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/roles";
import {
  getStaff,
  listRoles,
  resetStaffPassword,
  updateStaff,
} from "@/services/auth.service";

export function StaffDetailPage() {
  const { id } = useParams();
  const staffId = Number(id);
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const queryClient = useQueryClient();
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_STAFF);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  const isSelf = user?.id === staffId;

  const profileQuery = useQuery({
    queryKey: queryKeys.staff.detail(staffId),
    queryFn: () => getStaff(staffId),
    enabled: Number.isFinite(staffId),
  });

  const rolesQuery = useQuery({
    queryKey: queryKeys.roles.list,
    queryFn: listRoles,
    enabled: canUpdate,
  });

  const profile = profileQuery.data;
  const profileSlug = profile?.roleSlug ?? profile?.role;
  const isSuperAdminTarget = isSuperAdminSlug(profileSlug);
  const canEditRole = canUpdate && !isSelf && !isSuperAdminTarget;
  const canToggleActive = canUpdate && !isSelf;
  const canEditProfile = canUpdate;
  const canResetPassword = canUpdate && !isSelf;

  const assignableRoles = (rolesQuery.data ?? []).filter(
    (role) => !isSuperAdminSlug(role.slug),
  );
  const roleItems = assignableRoles.map((role) => ({
    value: String(role.id),
    label: formatRoleLabel(role),
  }));

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName ?? "");
    setLastName(profile.lastName ?? "");
    setIsActive(profile.isActive);
    if (profile.roleId != null) {
      setRoleId(String(profile.roleId));
    } else if (rolesQuery.data) {
      const match = rolesQuery.data.find(
        (role) => role.slug === (profile.roleSlug ?? profile.role),
      );
      if (match) setRoleId(String(match.id));
    }
  }, [profile, rolesQuery.data]);

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.staff.detail(staffId),
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      updateStaff(staffId, {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        ...(canEditRole && roleId ? { roleId: Number(roleId) } : {}),
        ...(canToggleActive ? { isActive } : {}),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.staff.detail(staffId), data);
      invalidate();
      toast.success("Staff updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update staff",
      );
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (newPassword: string) =>
      resetStaffPassword(staffId, { newPassword }),
    onSuccess: () => {
      toast.success("Password reset");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to reset password",
      );
    },
  });

  if (!Number.isFinite(staffId)) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Staff" description="Invalid staff id." />
        <Button
          variant="outline"
          render={
            <Link to="/staff">
              <ArrowLeft className="size-4" />
              Back to staff
            </Link>
          }
        />
      </div>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (profileQuery.error || !profile) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Staff" description="Staff details." />
        <p className="text-sm text-destructive">
          {profileQuery.error instanceof Error
            ? profileQuery.error.message
            : "Failed to load staff"}
        </p>
        <Button
          variant="outline"
          render={
            <Link to="/staff">
              <ArrowLeft className="size-4" />
              Back to staff
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={formatStaffName(profile)}
        description={profile.email}
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>
              {isSelf
                ? "You cannot change your own role or deactivate yourself here. Use Account for your name and password."
                : isSuperAdminTarget
                  ? "Super Admin role cannot be changed."
                  : "Update name, role, and active status."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                variant={isSuperAdminTarget ? "brand" : "neutral"}
              >
                {formatRoleLabel(profile)}
              </StatusBadge>
              <StatusBadge
                variant={profile.isActive ? "success" : "danger"}
              >
                {profile.isActive ? "Active" : "Inactive"}
              </StatusBadge>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!canEditProfile) return;
                saveMutation.mutate();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="staffFirstName">First name</Label>
                  <Input
                    id="staffFirstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={!canEditProfile}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staffLastName">Last name</Label>
                  <Input
                    id="staffLastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={!canEditProfile}
                  />
                </div>
              </div>

              {canEditRole && (
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
                </div>
              )}

              {canToggleActive && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Active</p>
                    <p className="text-xs text-muted-foreground">
                      Inactive staff cannot sign in.
                    </p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              )}

              {canEditProfile && (
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save changes"}
                </Button>
              )}
            </form>

            <div className="grid gap-2 border-t pt-4 text-sm text-muted-foreground">
              <p>
                Created by{" "}
                <span className="text-foreground">
                  {formatStaffName(profile.creator)}
                </span>
              </p>
              <p>Joined {formatDate(profile.createdAt)}</p>
              <p>Updated {formatDate(profile.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reset password</CardTitle>
            <CardDescription>
              {isSelf
                ? "Reset your own password from Account instead."
                : "Sets a temporary password. No current password required."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSelf ? (
              <Button
                variant="outline"
                render={<Link to="/account">Open Account</Link>}
              />
            ) : !canResetPassword ? (
              <p className="text-sm text-muted-foreground">
                You do not have permission to reset staff passwords.
              </p>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const data = new FormData(form);
                  passwordMutation.mutate(String(data.get("newPassword")), {
                    onSuccess: () => form.reset(),
                  });
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="adminNewPassword">New password</Label>
                  <Input
                    id="adminNewPassword"
                    name="newPassword"
                    type="password"
                    minLength={6}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" disabled={passwordMutation.isPending}>
                  {passwordMutation.isPending
                    ? "Resetting..."
                    : "Reset password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>
            Counts from order status events and refunds this staff handled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffActivityStatsGrid stats={profile.stats} />
        </CardContent>
      </Card>
    </div>
  );
}
