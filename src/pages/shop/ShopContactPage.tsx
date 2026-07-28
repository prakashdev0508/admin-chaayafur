import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { formatPhone } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { submitContactInquiry } from "@/services/contact.service";
import { fetchPublicSiteSettings } from "@/services/site-settings.service";
import {
  CONTACT_FIELD_LIMITS,
  INDIAN_MOBILE_PATTERN,
  type CreateContactInquiryPayload,
} from "@/types/contact";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  subject: string;
  message: string;
};

const emptyForm: FormState = {
  fullName: "",
  email: "",
  phone: "",
  companyName: "",
  subject: "",
  message: "",
};

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

function validate(form: FormState): string | null {
  const fullName = form.fullName.trim();
  const email = form.email.trim();
  const message = form.message.trim();
  const phone = form.phone.trim();
  const companyName = form.companyName.trim();
  const subject = form.subject.trim();

  if (!fullName) return "Enter your full name";
  if (fullName.length > CONTACT_FIELD_LIMITS.fullName) {
    return `Name must be at most ${CONTACT_FIELD_LIMITS.fullName} characters`;
  }
  if (!email) return "Enter your email";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address";
  }
  if (email.length > CONTACT_FIELD_LIMITS.email) {
    return `Email must be at most ${CONTACT_FIELD_LIMITS.email} characters`;
  }
  if (phone && !INDIAN_MOBILE_PATTERN.test(phone)) {
    return "Phone must be a valid Indian mobile number";
  }
  if (companyName && companyName.length > CONTACT_FIELD_LIMITS.companyName) {
    return `Company name must be at most ${CONTACT_FIELD_LIMITS.companyName} characters`;
  }
  if (subject && subject.length > CONTACT_FIELD_LIMITS.subject) {
    return `Subject must be at most ${CONTACT_FIELD_LIMITS.subject} characters`;
  }
  if (!message) return "Enter your message";
  if (message.length > CONTACT_FIELD_LIMITS.message) {
    return `Message must be at most ${CONTACT_FIELD_LIMITS.message} characters`;
  }
  return null;
}

function toPayload(form: FormState): CreateContactInquiryPayload {
  const payload: CreateContactInquiryPayload = {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    message: form.message.trim(),
  };
  const phone = form.phone.trim();
  const companyName = form.companyName.trim();
  const subject = form.subject.trim();
  if (phone) payload.phone = phone;
  if (companyName) payload.companyName = companyName;
  if (subject) payload.subject = subject;
  return payload;
}

export function ShopContactPage() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitted, setSubmitted] = useState(false);

  const settingsQuery = useQuery({
    queryKey: queryKeys.shop.siteSettings,
    queryFn: fetchPublicSiteSettings,
    staleTime: 60_000,
  });
  const settings = settingsQuery.data;

  const submitMutation = useMutation({
    mutationFn: submitContactInquiry,
    onSuccess: () => {
      setSubmitted(true);
      setForm(emptyForm);
      toast.success("Message sent — we’ll get back to you soon");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not send your message",
      );
    },
  });

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const error = validate(form);
    if (error) {
      toast.error(error);
      return;
    }
    submitMutation.mutate(toPayload(form));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <p className="text-sm font-medium tracking-wide text-[#8B5E3C]">
          Contact
        </p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight text-[#3D2B1F]">
          Get in touch
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Tell us about a custom piece, showroom visit, or anything else. We
          read every enquiry.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr]">
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitted ? (
            <div className="rounded-2xl border border-[#E8DFD3] bg-white p-6">
              <h2 className="text-lg font-medium text-[#3D2B1F]">
                Thank you
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your message was received. If you shared an email, we’ll reply
                there.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 border-[#D9CBB8]"
                onClick={() => setSubmitted(false)}
              >
                Send another message
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-fullName">Full name *</Label>
                  <Input
                    id="contact-fullName"
                    value={form.fullName}
                    maxLength={CONTACT_FIELD_LIMITS.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    disabled={submitMutation.isPending}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email *</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={form.email}
                    maxLength={CONTACT_FIELD_LIMITS.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    disabled={submitMutation.isPending}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Phone</Label>
                  <Input
                    id="contact-phone"
                    inputMode="tel"
                    placeholder="9876543210"
                    value={form.phone}
                    maxLength={CONTACT_FIELD_LIMITS.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    disabled={submitMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-company">Company</Label>
                  <Input
                    id="contact-company"
                    value={form.companyName}
                    maxLength={CONTACT_FIELD_LIMITS.companyName}
                    onChange={(e) =>
                      updateField("companyName", e.target.value)
                    }
                    disabled={submitMutation.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-subject">Subject</Label>
                <Input
                  id="contact-subject"
                  value={form.subject}
                  maxLength={CONTACT_FIELD_LIMITS.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                  disabled={submitMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">Message *</Label>
                <Textarea
                  id="contact-message"
                  rows={6}
                  value={form.message}
                  maxLength={CONTACT_FIELD_LIMITS.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  disabled={submitMutation.isPending}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {form.message.length}/{CONTACT_FIELD_LIMITS.message}
                </p>
              </div>

              <Button
                type="submit"
                className="bg-[#8B5E3C] hover:bg-[#744C31]"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? "Sending…" : "Send message"}
              </Button>
            </>
          )}
        </form>

        <aside className="space-y-4 text-sm text-muted-foreground">
          {settings?.showroomAddress && (
            <div>
              <p className="font-medium text-[#3D2B1F]">Showroom</p>
              <p className="mt-1 whitespace-pre-line">
                {settings.showroomAddress}
              </p>
            </div>
          )}
          {settings?.businessHours && (
            <div>
              <p className="font-medium text-[#3D2B1F]">Hours</p>
              <p className="mt-1 whitespace-pre-line">
                {settings.businessHours}
              </p>
            </div>
          )}
          {settings?.phone && (
            <div>
              <p className="font-medium text-[#3D2B1F]">Phone</p>
              <a
                href={`tel:${settings.phone}`}
                className="mt-1 inline-block hover:text-foreground"
              >
                {formatPhone(settings.phone)}
              </a>
            </div>
          )}
          {settings?.email && (
            <div>
              <p className="font-medium text-[#3D2B1F]">Email</p>
              <a
                href={`mailto:${settings.email}`}
                className="mt-1 inline-block hover:text-foreground"
              >
                {settings.email}
              </a>
            </div>
          )}
          {settings?.whatsapp && (
            <div>
              <p className="font-medium text-[#3D2B1F]">WhatsApp</p>
              <a
                href={whatsappHref(settings.whatsapp)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block hover:text-foreground"
              >
                {formatPhone(settings.whatsapp)}
              </a>
            </div>
          )}
          <p>
            Prefer browsing first?{" "}
            <Link
              to="/shop/products"
              className="font-medium text-[#8B5E3C] hover:underline"
            >
              View products
            </Link>
          </p>
        </aside>
      </div>
    </div>
  );
}
