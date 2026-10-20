import { apiFormRequest, apiRequest } from "@/lib/api";
import { buildQueryString } from "@/lib/build-query";
import type { PaginatedResponse } from "@/types/api";
import type {
  CareerApplication,
  CareerApplicationStatus,
  CreateJobPostingPayload,
  JobPosting,
  ListCareerApplicationsParams,
  ListJobPostingsParams,
  UpdateJobPostingPayload,
} from "@/types/career";

export function listPublicJobPostings(params: ListJobPostingsParams = {}) {
  return apiRequest<PaginatedResponse<JobPosting>>(
    `/careers/jobs${buildQueryString(params)}`,
    {},
    false,
  );
}

export function getPublicJobPosting(id: number) {
  return apiRequest<JobPosting>(`/careers/jobs/${id}`, {}, false);
}

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

export function listJobPostings(params: ListJobPostingsParams = {}) {
  return apiRequest<PaginatedResponse<JobPosting>>(
    `/admin/careers/jobs${buildQueryString(params)}`,
  );
}

export function getJobPosting(id: number) {
  return apiRequest<JobPosting>(`/admin/careers/jobs/${id}`);
}

export function createJobPosting(payload: CreateJobPostingPayload) {
  return apiRequest<JobPosting>("/admin/careers/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateJobPosting(id: number, payload: UpdateJobPostingPayload) {
  return apiRequest<JobPosting>(`/admin/careers/jobs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
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
