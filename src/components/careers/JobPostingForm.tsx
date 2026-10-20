import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CAREER_FIELD_LIMITS,
  type CreateJobPostingPayload,
  type JobPosting,
  type JobPostingFormValues,
  type UpdateJobPostingPayload,
} from "@/types/career";

type JobPostingFormProps = {
  initial?: JobPosting;
  onSubmit: (
    payload: CreateJobPostingPayload | UpdateJobPostingPayload,
  ) => Promise<unknown>;
  loading?: boolean;
  mode: "create" | "edit";
  onCancel?: () => void;
  className?: string;
};

function getInitialValues(posting?: JobPosting): JobPostingFormValues {
  if (!posting) {
    return {
      title: "",
      description: "",
      isActive: true,
    };
  }
  return {
    title: posting.title,
    description: posting.description,
    isActive: posting.isActive,
  };
}

export function JobPostingForm({
  initial,
  onSubmit,
  loading,
  mode,
  onCancel,
  className,
}: JobPostingFormProps) {
  const [values, setValues] = useState<JobPostingFormValues>(() =>
    getInitialValues(initial),
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = values.title.trim();
    const description = values.description.trim();

    if (!title) {
      setError("Enter a job title");
      return;
    }
    if (title.length > CAREER_FIELD_LIMITS.title) {
      setError(`Title must be at most ${CAREER_FIELD_LIMITS.title} characters`);
      return;
    }
    if (!description) {
      setError("Enter a job description");
      return;
    }
    if (description.length > CAREER_FIELD_LIMITS.description) {
      setError(
        `Description must be at most ${CAREER_FIELD_LIMITS.description} characters`,
      );
      return;
    }

    setError(null);
    const payload = {
      title,
      description,
      isActive: values.isActive,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-5", className)}>
      <div className="space-y-2">
        <Label htmlFor="job-title">Title *</Label>
        <Input
          id="job-title"
          value={values.title}
          maxLength={CAREER_FIELD_LIMITS.title}
          onChange={(e) =>
            setValues((prev) => ({ ...prev, title: e.target.value }))
          }
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="job-description">Description *</Label>
        <Textarea
          id="job-description"
          value={values.description}
          maxLength={CAREER_FIELD_LIMITS.description}
          onChange={(e) =>
            setValues((prev) => ({ ...prev, description: e.target.value }))
          }
          disabled={loading}
          rows={mode === "edit" ? 14 : 10}
          required
        />
        <p className="text-xs text-muted-foreground">
          {values.description.length} / {CAREER_FIELD_LIMITS.description}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="job-active">Active</Label>
          <p className="text-xs text-muted-foreground">
            Inactive postings are hidden from the public careers page.
          </p>
        </div>
        <Switch
          id="job-active"
          checked={values.isActive}
          onCheckedChange={(checked) =>
            setValues((prev) => ({ ...prev, isActive: checked }))
          }
          disabled={loading}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={loading}>
          {loading
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create posting"
              : "Save changes"}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
