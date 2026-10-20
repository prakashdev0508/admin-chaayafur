import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { JobPostingForm } from "@/components/careers/JobPostingForm";
import { createCareerApplicationColumns } from "@/components/data-table/career-application-columns";
import { DataTable } from "@/components/data-table/data-table";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { HtmlContent } from "@/components/shared/HtmlContent";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { CAREER_STATUS_FILTER_ITEMS } from "@/lib/select-items";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import {
  getJobPosting,
  listCareerApplications,
  updateJobPosting,
} from "@/services/careers.service";
import type {
  CareerApplicationStatus,
  UpdateJobPostingPayload,
} from "@/types/career";

export function JobPostingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const postingId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_CAREERS);
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_CAREERS);
  const [editing, setEditing] = useState(false);
  const [appPage, setAppPage] = useState(0);
  const [appPageSize, setAppPageSize] = useState(10);
  const [status, setStatus] = useState("all");

  const postingQuery = useQuery({
    queryKey: queryKeys.careers.jobs.detail(postingId),
    queryFn: () => getJobPosting(postingId),
    enabled: canView && Number.isFinite(postingId),
  });

  const applicationParams = useMemo(
    () => ({
      page: appPage + 1,
      limit: appPageSize,
      jobPostingId: postingId,
      ...(status !== "all"
        ? { status: status as CareerApplicationStatus }
        : {}),
    }),
    [appPage, appPageSize, postingId, status],
  );

  const applicationsQuery = useQuery({
    queryKey: queryKeys.careers.list(applicationParams),
    queryFn: () => listCareerApplications(applicationParams),
    enabled: canView && Number.isFinite(postingId),
  });

  const applicationColumns = useMemo(
    () => createCareerApplicationColumns(postingId, { compact: true }),
    [postingId],
  );

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateJobPostingPayload) =>
      updateJobPosting(postingId, payload),
    onSuccess: (posting) => {
      toast.success("Job posting updated");
      queryClient.setQueryData(
        queryKeys.careers.jobs.detail(postingId),
        posting,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.careers.jobs.all,
      });
      setEditing(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to update job posting",
      );
    },
  });

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Careers" description="Manage an open role." />
        <EmptyState
          icon={Briefcase}
          title="Access restricted"
          description="You do not have permission to view careers."
        />
      </div>
    );
  }

  if (postingQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (postingQuery.isError || !postingQuery.data) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Careers" description="Manage an open role." />
        <EmptyState
          icon={Briefcase}
          title="Posting not found"
          description={
            postingQuery.error instanceof Error
              ? postingQuery.error.message
              : "Could not load this job posting."
          }
        />
        <Link
          to="/careers"
          className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
        >
          Back to careers
        </Link>
      </div>
    );
  }

  const posting = postingQuery.data;
  const applicationTotal = applicationsQuery.data?.meta.total;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Job posting"
        description={`Created ${formatDate(posting.createdAt)}${
          applicationTotal !== undefined
            ? ` · ${applicationTotal} application${applicationTotal === 1 ? "" : "s"}`
            : ""
        }`}
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
        <aside className="space-y-4 rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <StatusBadge variant={posting.isActive ? "success" : "neutral"}>
                {posting.isActive ? "Active" : "Inactive"}
              </StatusBadge>
              {!editing ? (
                <h2 className="text-xl font-semibold tracking-tight">
                  {posting.title}
                </h2>
              ) : (
                <h2 className="text-sm font-medium text-muted-foreground">
                  Edit job details
                </h2>
              )}
            </div>
            {canUpdate && !editing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
            ) : null}
          </div>

          {editing && canUpdate ? (
            <JobPostingForm
              key={`${posting.id}-${posting.updatedAt}`}
              mode="edit"
              initial={posting}
              loading={updateMutation.isPending}
              onCancel={() => setEditing(false)}
              onSubmit={(payload) =>
                updateMutation.mutateAsync(payload as UpdateJobPostingPayload)
              }
            />
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <HtmlContent className="mt-2" html={posting.description} />
              </div>
              <dl className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Created</dt>
                  <dd className="mt-1">{formatDate(posting.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Updated</dt>
                  <dd className="mt-1">{formatDate(posting.updatedAt)}</dd>
                </div>
              </dl>
              {!canUpdate ? (
                <p className="text-xs text-muted-foreground">
                  You need update-careers permission to edit this posting.
                </p>
              ) : null}
            </div>
          )}
        </aside>

        <section className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium">
              Applications
              {applicationTotal !== undefined ? (
                <span className="ml-1.5 text-muted-foreground">
                  ({applicationTotal})
                </span>
              ) : null}
            </h2>
            <Select
              value={status}
              onValueChange={(value) => {
                if (!value) return;
                setStatus(value);
                setAppPage(0);
              }}
              items={CAREER_STATUS_FILTER_ITEMS}
            >
              <SelectTrigger className="h-9 w-45">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                {CAREER_STATUS_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {applicationsQuery.error ? (
            <p className="text-sm text-destructive">
              {applicationsQuery.error instanceof Error
                ? applicationsQuery.error.message
                : "Failed to load applications"}
            </p>
          ) : null}

          {applicationsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              columns={applicationColumns}
              data={applicationsQuery.data?.items ?? []}
              manualPagination
              pageCount={applicationsQuery.data?.meta.totalPages ?? 0}
              pageIndex={appPage}
              pageSize={appPageSize}
              onPageChange={setAppPage}
              onPageSizeChange={(size) => {
                setAppPageSize(size);
                setAppPage(0);
              }}
              totalRows={applicationsQuery.data?.meta.total ?? 0}
              onRowClick={(row) =>
                navigate(`/careers/${postingId}/applications/${row.id}`)
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}
