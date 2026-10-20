export type CareerApplicationStatus =
  | "PENDING"
  | "SHORTLISTED"
  | "REJECTED"
  | "HIRED";

export type JobPosting = {
  id: number;
  title: string;
  description: string;
  isActive: boolean;
  /** Present when the API includes a count; otherwise the list page fetches it. */
  applicationCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type JobPostingSummary = {
  id: number;
  title: string;
};

export type CareerApplication = {
  id: number;
  jobPostingId: number;
  jobPosting: JobPostingSummary;
  name: string;
  email: string;
  contactNumber: string;
  experience: string;
  resumeUrl: string;
  resumeStorageKey: string;
  status: CareerApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type ListCareerApplicationsParams = {
  page?: number;
  limit?: number;
  status?: CareerApplicationStatus;
  jobPostingId?: number;
};

export type UpdateCareerApplicationPayload = {
  status: CareerApplicationStatus;
};

export type ListJobPostingsParams = {
  page?: number;
  limit?: number;
  isActive?: boolean;
};

export type CreateJobPostingPayload = {
  title: string;
  description: string;
  isActive?: boolean;
};

export type UpdateJobPostingPayload = {
  title?: string;
  description?: string;
  isActive?: boolean;
};

export type JobPostingFormValues = {
  title: string;
  description: string;
  isActive: boolean;
};

export const CAREER_FIELD_LIMITS = {
  name: 120,
  email: 255,
  contactNumber: 20,
  experience: 100,
  title: 200,
  description: 10000,
} as const;

export const CAREER_RESUME_MAX_BYTES = 5 * 1024 * 1024;

export const CAREER_APPLICATION_STATUSES: CareerApplicationStatus[] = [
  "PENDING",
  "SHORTLISTED",
  "REJECTED",
  "HIRED",
];
