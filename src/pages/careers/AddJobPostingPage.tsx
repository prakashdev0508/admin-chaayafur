import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { JobPostingForm } from "@/components/careers/JobPostingForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query-keys";
import { createJobPosting } from "@/services/careers.service";
import type { CreateJobPostingPayload } from "@/types/career";

export function AddJobPostingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CreateJobPostingPayload) => createJobPosting(payload),
    onSuccess: (posting) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.careers.jobs.all,
      });
      toast.success("Job posting created");
      navigate(`/careers/${posting.id}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create posting",
      );
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="New job posting"
        description="Add a role that applicants can apply for on the careers page."
        action={
          <Button
            variant="outline"
            render={
              <Link to="/careers">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            }
          />
        }
      />
      <JobPostingForm
        mode="create"
        className="mx-auto max-w-2xl"
        loading={mutation.isPending}
        onSubmit={(payload) =>
          mutation.mutateAsync(payload as CreateJobPostingPayload)
        }
      />
    </div>
  );
}
