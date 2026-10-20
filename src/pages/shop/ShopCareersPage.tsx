import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Check, FileText, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { formatPhone } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import {
  isValidCareerResume,
  listPublicJobPostings,
  submitCareerApplication,
} from "@/services/careers.service";
import { fetchPublicSiteSettings } from "@/services/site-settings.service";
import {
  CAREER_FIELD_LIMITS,
  CAREER_RESUME_MAX_BYTES,
  type JobPosting,
} from "@/types/career";
import { INDIAN_MOBILE_PATTERN } from "@/types/contact";

type FormState = {
  name: string;
  email: string;
  contactNumber: string;
  experience: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  contactNumber: "",
  experience: "",
};

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

function validate(
  form: FormState,
  jobPostingId: number | null,
  resume: File | null,
): string | null {
  const name = form.name.trim();
  const email = form.email.trim();
  const contactNumber = form.contactNumber.trim();
  const experience = form.experience.trim();

  if (!jobPostingId) return "Select the role you are applying for";
  if (!name) return "Enter your name";
  if (name.length > CAREER_FIELD_LIMITS.name) {
    return `Name must be at most ${CAREER_FIELD_LIMITS.name} characters`;
  }
  if (!email) return "Enter your email";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address";
  }
  if (email.length > CAREER_FIELD_LIMITS.email) {
    return `Email must be at most ${CAREER_FIELD_LIMITS.email} characters`;
  }
  if (!contactNumber) return "Enter your mobile number";
  if (!INDIAN_MOBILE_PATTERN.test(contactNumber)) {
    return "Enter a valid Indian mobile number";
  }
  if (!experience) return "Enter your experience";
  if (experience.length > CAREER_FIELD_LIMITS.experience) {
    return `Experience must be at most ${CAREER_FIELD_LIMITS.experience} characters`;
  }
  if (!resume) return "Upload your resume as a PDF";
  if (!isValidCareerResume(resume)) return "Resume must be a PDF file";
  if (resume.size > CAREER_RESUME_MAX_BYTES) {
    return "Resume must be under 5 MB";
  }
  return null;
}

export function ShopCareersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const settingsQuery = useQuery({
    queryKey: queryKeys.shop.siteSettings,
    queryFn: fetchPublicSiteSettings,
    staleTime: 60_000,
  });
  const settings = settingsQuery.data;

  const jobsQuery = useQuery({
    queryKey: queryKeys.careers.jobs.publicList({ page: 1, limit: 100 }),
    queryFn: () => listPublicJobPostings({ page: 1, limit: 100 }),
    staleTime: 60_000,
  });
  const jobs = jobsQuery.data?.items ?? [];
  const hasJobs = jobs.length > 0;
  const selectedJob =
    jobs.find((job) => job.id === selectedJobId) ?? null;

  useEffect(() => {
    if (!jobsQuery.isSuccess || jobs.length === 0) return;

    const fromQuery = Number(
      searchParams.get("jobPostingId") ?? searchParams.get("job") ?? "",
    );
    if (Number.isFinite(fromQuery) && jobs.some((job) => job.id === fromQuery)) {
      setSelectedJobId(fromQuery);
      return;
    }

    setSelectedJobId((current) => {
      if (current && jobs.some((job) => job.id === current)) return current;
      return jobs.length === 1 ? jobs[0].id : null;
    });
  }, [jobs, jobsQuery.isSuccess, searchParams]);

  const submitMutation = useMutation({
    mutationFn: submitCareerApplication,
    onSuccess: () => {
      setSubmitted(true);
      setForm(emptyForm);
      setResume(null);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
      toast.success("Application received — we’ll be in touch");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not submit your application",
      );
    },
  });

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function selectJob(job: JobPosting) {
    setSelectedJobId(job.id);
    setSubmitted(false);
    const next = new URLSearchParams(searchParams);
    next.set("jobPostingId", String(job.id));
    setSearchParams(next, { replace: true });
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleResumeChange(file: File | undefined) {
    if (!file) {
      setResume(null);
      return;
    }
    if (!isValidCareerResume(file)) {
      toast.error("Resume must be a PDF file");
      if (resumeInputRef.current) resumeInputRef.current.value = "";
      setResume(null);
      return;
    }
    if (file.size > CAREER_RESUME_MAX_BYTES) {
      toast.error("Resume must be under 5 MB");
      if (resumeInputRef.current) resumeInputRef.current.value = "";
      setResume(null);
      return;
    }
    setResume(file);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const error = validate(form, selectedJobId, resume);
    if (error) {
      toast.error(error);
      return;
    }
    if (!resume || !selectedJobId) return;

    const formData = new FormData();
    formData.append("jobPostingId", String(selectedJobId));
    formData.append("name", form.name.trim());
    formData.append("email", form.email.trim().toLowerCase());
    formData.append("contactNumber", form.contactNumber.trim());
    formData.append("experience", form.experience.trim());
    formData.append("resume", resume);
    submitMutation.mutate(formData);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <p className="text-sm font-medium tracking-wide text-[#8B5E3C]">
          Careers
        </p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight text-[#3D2B1F]">
          Join the Chaaya team
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Browse open roles, pick the one you want, and send your application
          with a PDF resume.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr]">
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg font-medium text-[#3D2B1F]">Open roles</h2>

            {jobsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : jobsQuery.isError ? (
              <div className="rounded-2xl border border-[#E8DFD3] bg-white p-6">
                <p className="text-sm text-destructive">
                  {jobsQuery.error instanceof Error
                    ? jobsQuery.error.message
                    : "Could not load open roles"}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 border-[#D9CBB8]"
                  onClick={() => void jobsQuery.refetch()}
                >
                  Try again
                </Button>
              </div>
            ) : !hasJobs ? (
              <div className="rounded-2xl border border-[#E8DFD3] bg-white p-6">
                <h3 className="text-lg font-medium text-[#3D2B1F]">
                  No open roles right now
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Check back later, or reach out through our contact page if
                  you’d like to introduce yourself.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 border-[#D9CBB8]"
                  render={<Link to="/shop/contact">Contact us</Link>}
                />
              </div>
            ) : (
              <ul className="space-y-3">
                {jobs.map((job) => {
                  const selected = job.id === selectedJobId;
                  return (
                    <li key={job.id}>
                      <button
                        type="button"
                        onClick={() => selectJob(job)}
                        className={cn(
                          "w-full rounded-2xl border bg-white p-4 text-left transition",
                          selected
                            ? "border-[#8B5E3C] ring-1 ring-[#8B5E3C]/30"
                            : "border-[#E8DFD3] hover:border-[#8B5E3C]/50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-[#3D2B1F]">
                              {job.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground whitespace-pre-wrap">
                              {job.description}
                            </p>
                          </div>
                          {selected ? (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F8F1E8] px-2 py-1 text-xs font-medium text-[#8B5E3C]">
                              <Check className="size-3.5" />
                              Selected
                            </span>
                          ) : (
                            <span className="shrink-0 text-xs font-medium text-[#8B5E3C]">
                              Apply
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {hasJobs ? (
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="space-y-4 scroll-mt-6"
            >
              {submitted ? (
                <div className="rounded-2xl border border-[#E8DFD3] bg-white p-6">
                  <h2 className="text-lg font-medium text-[#3D2B1F]">
                    Thank you
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your application
                    {selectedJob ? ` for ${selectedJob.title}` : ""} was
                    received. We’ll contact you on the email or mobile number
                    you shared if there’s a fit.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 border-[#D9CBB8]"
                    onClick={() => setSubmitted(false)}
                  >
                    Apply again
                  </Button>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-[#E8DFD3] bg-[#FBF7F1] p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#8B5E3C]">
                      Applying for
                    </p>
                    <p className="mt-1 font-medium text-[#3D2B1F]">
                      {selectedJob?.title ?? "Select a role above"}
                    </p>
                    {selectedJob ? (
                      <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                        {selectedJob.description}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Choose an open role to continue with your application.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="career-name">Full name *</Label>
                      <Input
                        id="career-name"
                        value={form.name}
                        maxLength={CAREER_FIELD_LIMITS.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        disabled={submitMutation.isPending || !selectedJob}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="career-email">Email *</Label>
                      <Input
                        id="career-email"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        maxLength={CAREER_FIELD_LIMITS.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        disabled={submitMutation.isPending || !selectedJob}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="career-phone">Mobile number *</Label>
                      <Input
                        id="career-phone"
                        inputMode="tel"
                        placeholder="9876543210"
                        value={form.contactNumber}
                        maxLength={CAREER_FIELD_LIMITS.contactNumber}
                        onChange={(e) =>
                          updateField("contactNumber", e.target.value)
                        }
                        disabled={submitMutation.isPending || !selectedJob}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="career-experience">Experience *</Label>
                      <Input
                        id="career-experience"
                        placeholder="Fresher or 3 years"
                        value={form.experience}
                        maxLength={CAREER_FIELD_LIMITS.experience}
                        onChange={(e) =>
                          updateField("experience", e.target.value)
                        }
                        disabled={submitMutation.isPending || !selectedJob}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="career-resume">
                      Resume (PDF, max 5 MB) *
                    </Label>
                    <input
                      ref={resumeInputRef}
                      id="career-resume"
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      disabled={submitMutation.isPending || !selectedJob}
                      onChange={(event) =>
                        handleResumeChange(event.target.files?.[0])
                      }
                    />
                    <button
                      type="button"
                      disabled={submitMutation.isPending || !selectedJob}
                      onClick={() => resumeInputRef.current?.click()}
                      className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[#D9CBB8] bg-white px-4 py-3 text-left text-sm transition hover:border-[#8B5E3C]/50 hover:bg-[#F8F1E8] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resume ? (
                        <FileText className="size-5 shrink-0 text-[#8B5E3C]" />
                      ) : (
                        <Upload className="size-5 shrink-0 text-[#8B5E3C]" />
                      )}
                      <span className="min-w-0">
                        {resume ? (
                          <>
                            <span className="block truncate font-medium text-[#3D2B1F]">
                              {resume.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {(resume.size / (1024 * 1024)).toFixed(1)} MB
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="block font-medium text-[#3D2B1F]">
                              Upload PDF resume
                            </span>
                            <span className="text-xs text-muted-foreground">
                              PDF only, up to 5 MB
                            </span>
                          </>
                        )}
                      </span>
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="bg-[#8B5E3C] hover:bg-[#744C31]"
                    disabled={submitMutation.isPending || !selectedJob}
                  >
                    {submitMutation.isPending
                      ? "Submitting…"
                      : selectedJob
                        ? `Apply for ${selectedJob.title}`
                        : "Select a role to apply"}
                  </Button>
                </>
              )}
            </form>
          ) : null}
        </div>

        <aside className="space-y-4 text-sm text-muted-foreground">
          {settings?.showroomAddress && (
            <div>
              <p className="font-medium text-[#3D2B1F]">Showroom</p>
              <p className="mt-1 whitespace-pre-line">
                {settings.showroomAddress}
              </p>
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
            Have a product question instead?{" "}
            <Link
              to="/shop/contact"
              className="font-medium text-[#8B5E3C] hover:underline"
            >
              Contact us
            </Link>
          </p>
        </aside>
      </div>
    </div>
  );
}
