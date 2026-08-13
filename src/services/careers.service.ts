import { apiFormRequest, apiRequest } from "@/lib/api";
import { buildQueryString } from "@/lib/build-query";
import type { PaginatedResponse } from "@/types/api";
import type {
  CareerApplication,
  CareerApplicationStatus,
  ListCareerApplicationsParams,
} from "@/types/career";

export function submitCareerApplication(formData: FormData) {
  return apiFormRequest<CareerApplication>("/careers", formData, false);
}

export function listCareerApplications(
  params: ListCareerApplicationsParams = {},
) {
  return apiRequest<PaginatedResponse<CareerApplication>>(
    `/admin/careers${buildQueryString(params)}`,
  );
}

export function getCareerApplication(id: number) {
  return apiRequest<CareerApplication>(`/admin/careers/${id}`);
}

export function updateCareerApplicationStatus(
  id: number,
  status: CareerApplicationStatus,
) {
  return apiRequest<CareerApplication>(`/admin/careers/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function isValidCareerResume(file: File) {
  const name = file.name.toLowerCase();
  const mimeOk =
    !file.type ||
    file.type === "application/pdf" ||
    file.type === "application/x-pdf";
  return name.endsWith(".pdf") && mimeOk;
}
