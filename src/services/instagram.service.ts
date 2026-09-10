import { apiRequest } from "@/lib/api";
import type {
  AdminInstagramMedia,
  AdminInstagramMediaListPayload,
  InstagramMedia,
  InstagramMediaListPayload,
  InstagramSelection,
  InstagramSelectionItemInput,
  PutInstagramSelectionsPayload,
} from "@/types/instagram";

export async function fetchInstagramFeed(): Promise<InstagramMedia[]> {
  const payload = await apiRequest<InstagramMediaListPayload>(
    "/instagram",
    {},
    false,
  );
  return payload?.data ?? [];
}

export async function listAdminInstagramMedia(): Promise<AdminInstagramMedia[]> {
  const payload = await apiRequest<AdminInstagramMediaListPayload>(
    "/admin/instagram/media",
  );
  return payload?.data ?? [];
}

export function listInstagramSelections() {
  return apiRequest<InstagramSelection[]>("/admin/instagram/selections");
}

/** Replace featured set — body matches docs/instagram.md `PUT .../selections`. */
export function putInstagramSelections(items: InstagramSelectionItemInput[]) {
  const body: PutInstagramSelectionsPayload = { items };
  return apiRequest<InstagramSelection[]>("/admin/instagram/selections", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
