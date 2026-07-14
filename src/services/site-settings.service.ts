import { apiRequest } from "@/lib/api";
import type {
  AdminSiteSettings,
  PublicSiteSettings,
  UpdateSiteSettingsPayload,
} from "@/types/site-settings";

export function fetchPublicSiteSettings() {
  return apiRequest<PublicSiteSettings>("/site-settings", {}, false);
}

export function getAdminSiteSettings() {
  return apiRequest<AdminSiteSettings>("/admin/site-settings");
}

export function updateAdminSiteSettings(payload: UpdateSiteSettingsPayload) {
  return apiRequest<AdminSiteSettings>("/admin/site-settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
