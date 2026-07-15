import type { StaffCreator } from "@/types/auth";
import { SUPER_ADMIN_SLUG } from "@/types/auth";

export function formatStaffName(
  staff:
    | Pick<StaffCreator, "firstName" | "lastName" | "email">
    | null
    | undefined,
) {
  if (!staff) return "—";
  const name = [staff.firstName, staff.lastName].filter(Boolean).join(" ");
  return name || staff.email || "—";
}

/** @deprecated Prefer formatRoleLabel — kept for existing call sites */
export const staffRoleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  ORDER_MANAGER: "Order Manager",
  DASHBOARD: "Dashboard",
};

export function formatRoleLabel(
  role:
    | string
    | {
        role?: string;
        roleSlug?: string;
        roleName?: string;
        name?: string;
        slug?: string;
      }
    | null
    | undefined,
) {
  if (!role) return "—";
  if (typeof role === "string") {
    return staffRoleLabels[role] ?? role.replaceAll("_", " ");
  }
  if (role.roleName) return role.roleName;
  if (role.name) return role.name;
  const slug = role.roleSlug ?? role.role ?? role.slug;
  if (!slug) return "—";
  return staffRoleLabels[slug] ?? slug.replaceAll("_", " ");
}

export function isSuperAdminSlug(slug: string | null | undefined) {
  return slug === SUPER_ADMIN_SLUG;
}

/** Build API slug from a display name: "Warehouse Manager" → "WAREHOUSE_MANAGER" */
export function slugifyRoleName(name: string) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
