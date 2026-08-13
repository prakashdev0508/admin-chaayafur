export type CareerApplicationStatus =
  | "PENDING"
  | "SHORTLISTED"
  | "REJECTED"
  | "HIRED";

export type CareerApplication = {
  id: number;
  name: string;
  email: string;
  contactNumber: string;
  designation: string;
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
};

export type UpdateCareerApplicationPayload = {
  status: CareerApplicationStatus;
};

export const CAREER_FIELD_LIMITS = {
  name: 120,
  email: 255,
  contactNumber: 20,
  designation: 120,
  experience: 100,
} as const;

export const CAREER_RESUME_MAX_BYTES = 5 * 1024 * 1024;

export const CAREER_APPLICATION_STATUSES: CareerApplicationStatus[] = [
  "PENDING",
  "SHORTLISTED",
  "REJECTED",
  "HIRED",
];
