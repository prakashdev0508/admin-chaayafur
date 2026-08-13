import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import {
  careerStatusLabels,
  careerStatusVariants,
} from "@/lib/career-status";
import { formatDate, formatPhone } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { CAREER_STATUS_ITEMS } from "@/lib/select-items";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import {
  getCareerApplication,
  updateCareerApplicationStatus,
} from "@/services/careers.service";
import type { CareerApplicationStatus } from "@/types/career";

export function CareerApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const applicationId = Number(id);
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_CAREERS);
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_CAREERS);
  const [status, setStatus] = useState<CareerApplicationStatus>("PENDING");

  const applicationQuery = useQuery({
    queryKey: queryKeys.careers.detail(applicationId),
    queryFn: () => getCareerApplication(applicationId),
    enabled: canView && Number.isFinite(applicationId),
  });

  useEffect(() => {
    if (applicationQuery.data) {
      setStatus(applicationQuery.data.status);
    }
  }, [applicationQuery.data]);

  const statusMutation = useMutation({
    mutationFn: () =>
      updateCareerApplicationStatus(applicationId, status),
    onSuccess: (application) => {
      toast.success(
        `Status updated to ${careerStatusLabels[application.status]}`,
      );
      queryClient.setQueryData(
        queryKeys.careers.detail(applicationId),
        application,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.careers.all,
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to update status",
      );
    },
  });

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Career application"
          description="Website career submission."
        />
        <EmptyState
          icon={Briefcase}
          title="Access restricted"
          description="You do not have permission to view career applications."
        />
      </div>
    );
  }

  if (applicationQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (applicationQuery.isError || !applicationQuery.data) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Career application"
          description="Website career submission."
        />
        <EmptyState
          icon={Briefcase}
          title="Application not found"
          description={
            applicationQuery.error instanceof Error
              ? applicationQuery.error.message
              : "Could not load this application."
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

  const application = applicationQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Application #${application.id}`}
        description={application.designation}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant={careerStatusVariants[application.status]}>
              {careerStatusLabels[application.status]}
            </StatusBadge>
            <Link
              to="/careers"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Back to inbox
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Applicant</CardTitle>
            <CardDescription>
              Received {formatDate(application.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="mt-1 font-medium">{application.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <a
                href={`mailto:${application.email}`}
                className="mt-1 inline-block hover:underline"
              >
                {application.email}
              </a>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <a
                href={`tel:${application.contactNumber}`}
                className="mt-1 inline-block hover:underline"
              >
                {formatPhone(application.contactNumber)}
              </a>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Designation</p>
              <p className="mt-1 font-medium">{application.designation}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Experience</p>
              <p className="mt-1">{application.experience}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Resume</p>
              {application.resumeUrl ? (
                <Button
                  variant="outline"
                  className="mt-2"
                  render={
                    <a
                      href={application.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download className="size-4" />
                      Download PDF
                    </a>
                  }
                />
              ) : (
                <p className="mt-1 text-muted-foreground">Not available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>
              {canUpdate
                ? "Update how this application is progressing."
                : "You can view status but need update-careers to change it."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Application status</Label>
              <Select
                value={status}
                onValueChange={(value) => {
                  if (!value) return;
                  setStatus(value as CareerApplicationStatus);
                }}
                items={CAREER_STATUS_ITEMS}
                disabled={!canUpdate || statusMutation.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAREER_STATUS_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canUpdate ? (
              <Button
                disabled={
                  statusMutation.isPending || status === application.status
                }
                onClick={() => statusMutation.mutate()}
              >
                {statusMutation.isPending ? "Saving…" : "Save status"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
