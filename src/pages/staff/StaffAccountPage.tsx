import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { formatStaffName, formatRoleLabel, isSuperAdminSlug } from "@/lib/staff-utils";
import {
  getStaffMe,
  updateStaffMe,
  updateStaffMePassword,
} from "@/services/auth.service";

export function StaffAccountPage() {
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const profileQuery = useQuery({
    queryKey: queryKeys.staff.me,
    queryFn: getStaffMe,
  });

  const profile = profileQuery.data;

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName ?? "");
    setLastName(profile.lastName ?? "");
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: updateStaffMe,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.staff.me, data);
      updateUser({
        firstName: data.firstName,
        lastName: data.lastName,
      });
      setFirstName(data.firstName ?? "");
      setLastName(data.lastName ?? "");
      toast.success("Profile updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    },
  });

  const updatePassword = useMutation({
    mutationFn: updateStaffMePassword,
    onSuccess: () => {
      toast.success("Password updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update password",
      );
    },
  });

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
        <PageHeader title="Account" description="Your staff profile." />
        <p className="text-sm text-destructive">
          {profileQuery.error instanceof Error
            ? profileQuery.error.message
            : "Failed to load profile"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Account"
        description="Update your name and password. Activity stats are read-only."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Email and role cannot be changed here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                variant={
                  isSuperAdminSlug(profile.roleSlug ?? profile.role)
                    ? "brand"
                    : "neutral"
                }
              >
                {formatRoleLabel(profile)}
              </StatusBadge>
              <StatusBadge
                variant={profile.isActive ? "success" : "danger"}
              >
                {profile.isActive ? "Active" : "Inactive"}
              </StatusBadge>
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{profile.email}</p>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                updateProfile.mutate({
                  firstName: firstName.trim() || null,
                  lastName: lastName.trim() || null,
                });
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Saving..." : "Save profile"}
              </Button>
            </form>

            <div className="grid gap-2 border-t pt-4 text-sm text-muted-foreground">
              <p>
                Created by{" "}
                <span className="text-foreground">
                  {formatStaffName(profile.creator)}
                </span>
              </p>
              <p>Joined {formatDate(profile.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>
              Enter your current password to set a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data = new FormData(form);
                updatePassword.mutate(
                  {
                    currentPassword: String(data.get("currentPassword")),
                    newPassword: String(data.get("newPassword")),
                  },
                  {
                    onSuccess: () => form.reset(),
                  },
                );
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  minLength={6}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={updatePassword.isPending}>
                {updatePassword.isPending ? "Updating..." : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>
            Counts from order status events and refunds you handled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffActivityStatsGrid stats={profile.stats} />
        </CardContent>
      </Card>
    </div>
  );
}
