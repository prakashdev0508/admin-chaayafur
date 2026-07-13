import { useAuth } from "@/contexts/AuthContext";

export function usePermission() {
  const { user, rolesPermissions } = useAuth();

  const hasPermission = (permission: string) => {
    if (!user || !rolesPermissions) return false;
    const roleEntry = rolesPermissions[user.role];
    if (!roleEntry) return false;
    if (roleEntry.permissions.includes("all")) return true;
    return roleEntry.permissions.includes(permission);
  };

  return { hasPermission };
}
