import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  ContactInquiry,
  CreateContactInquiryPayload,
  ListContactInquiriesParams,
  ReplyContactInquiryPayload,
} from "@/types/contact";

export function submitContactInquiry(payload: CreateContactInquiryPayload) {
  return apiRequest<ContactInquiry>(
    "/contact",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    false,
  );
}

export function listContactInquiries(params: ListContactInquiriesParams = {}) {
  return apiRequest<PaginatedResponse<ContactInquiry>>(
    `/admin/contact${buildQueryString(params)}`,
  );
}

export function getContactInquiry(id: number) {
  return apiRequest<ContactInquiry>(`/admin/contact/${id}`);
}

export function replyToContactInquiry(
  id: number,
  payload: ReplyContactInquiryPayload,
) {
  return apiRequest<ContactInquiry>(`/admin/contact/${id}/reply`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
