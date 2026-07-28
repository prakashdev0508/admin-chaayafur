export type ContactInquiryStaffSummary = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

export type ContactInquiry = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  subject: string | null;
  message: string;
  replyMessage?: string | null;
  repliedAt?: string | null;
  repliedByStaffId?: number | null;
  repliedBy?: ContactInquiryStaffSummary | null;
  createdAt: string;
  updatedAt?: string;
};

export type CreateContactInquiryPayload = {
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  subject?: string;
  message: string;
};

export type ReplyContactInquiryPayload = {
  reply: string;
};

export type ListContactInquiriesParams = {
  page?: number;
  limit?: number;
};

export const CONTACT_FIELD_LIMITS = {
  fullName: 120,
  email: 255,
  phone: 20,
  companyName: 120,
  subject: 200,
  message: 2000,
  reply: 2000,
} as const;

/** Matches backend PHONE_PATTERN (optional +91, then 10-digit Indian mobile). */
export const INDIAN_MOBILE_PATTERN = /^(\+91[\-\s]?)?[6-9]\d{9}$/;
