import { buildQueryString } from "@/lib/build-query";
import { apiFormRequest, apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  CreateQuotationPayload,
  ListQuotationsParams,
  Quotation,
  QuotationListItem,
  QuotationPdfUploadResult,
  SendQuotationEmailResult,
  UpdateQuotationPayload,
} from "@/types/quotation";

type UploadApiResult = {
  url: string;
  key?: string;
  storageKey?: string;
};

export function listQuotations(params: ListQuotationsParams = {}) {
  return apiRequest<PaginatedResponse<QuotationListItem>>(
    `/admin/quotations${buildQueryString(params)}`,
  );
}

export function getQuotation(id: number) {
  return apiRequest<Quotation>(`/admin/quotations/${id}`);
}

export function createQuotation(payload: CreateQuotationPayload) {
  return apiRequest<Quotation>("/admin/quotations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateQuotation(id: number, payload: UpdateQuotationPayload) {
  return apiRequest<Quotation>(`/admin/quotations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function addQuotationRemark(id: number, remark: string) {
  return apiRequest<Quotation>(`/admin/quotations/${id}/remarks`, {
    method: "POST",
    body: JSON.stringify({ remark }),
  });
}

export function sendQuotationEmail(id: number) {
  return apiRequest<SendQuotationEmailResult>(
    `/admin/quotations/${id}/send-email`,
    { method: "POST" },
  );
}

export function uploadQuotationPdf(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFormRequest<UploadApiResult>(
    "/uploads/quotation-pdfs",
    formData,
  ).then((data): QuotationPdfUploadResult => {
    const key = data.key ?? data.storageKey;
    if (!key) {
      throw new Error("Upload returned no storage key");
    }
    return { url: data.url, key };
  });
}
