import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { formatDate, formatPhone } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import {
  getContactInquiry,
  replyToContactInquiry,
} from "@/services/contact.service";
import { CONTACT_FIELD_LIMITS } from "@/types/contact";

function staffLabel(staff: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const name = [staff.firstName, staff.lastName].filter(Boolean).join(" ");
  return name || staff.email;
}

export function ContactInquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const inquiryId = Number(id);
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_SETTINGS);
  const canReply = hasPermission(PERMISSIONS.UPDATE_SETTINGS);
  const [reply, setReply] = useState("");

  const inquiryQuery = useQuery({
    queryKey: queryKeys.contactInquiries.detail(inquiryId),
    queryFn: () => getContactInquiry(inquiryId),
    enabled: canView && Number.isFinite(inquiryId),
  });

  const replyMutation = useMutation({
    mutationFn: () =>
      replyToContactInquiry(inquiryId, { reply: reply.trim() }),
    onSuccess: (inquiry) => {
      toast.success("Reply emailed to the submitter");
      setReply("");
      queryClient.setQueryData(
        queryKeys.contactInquiries.detail(inquiryId),
        inquiry,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.contactInquiries.all,
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to send reply",
      );
    },
  });

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Contact enquiry"
          description="Website Contact Us submission."
        />
        <EmptyState
          icon={Mail}
          title="Access restricted"
          description="You do not have permission to view contact enquiries."
        />
      </div>
    );
  }

  if (inquiryQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (inquiryQuery.isError || !inquiryQuery.data) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Contact enquiry"
          description="Website Contact Us submission."
        />
        <EmptyState
          icon={Mail}
          title="Enquiry not found"
          description={
            inquiryQuery.error instanceof Error
              ? inquiryQuery.error.message
              : "Could not load this enquiry."
          }
        />
        <Link
          to="/contact"
          className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
        >
          Back to enquiries
        </Link>
      </div>
    );
  }

  const inquiry = inquiryQuery.data;
  const hasReply = Boolean(inquiry.repliedAt && inquiry.replyMessage);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Enquiry #${inquiry.id}`}
        description={inquiry.subject || "Website Contact Us submission"}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {hasReply ? (
              <StatusBadge variant="success">Replied</StatusBadge>
            ) : (
              <StatusBadge variant="warning">New</StatusBadge>
            )}
            <Link
              to="/contact"
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
            <CardTitle>Message</CardTitle>
            <CardDescription>
              Received {formatDate(inquiry.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {inquiry.subject && (
              <div>
                <p className="text-xs text-muted-foreground">Subject</p>
                <p className="mt-1 font-medium">{inquiry.subject}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Message</p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                {inquiry.message}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submitter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="mt-1 font-medium">{inquiry.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <a
                href={`mailto:${inquiry.email}`}
                className="mt-1 inline-block hover:underline"
              >
                {inquiry.email}
              </a>
            </div>
            {inquiry.phone && (
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <a
                  href={`tel:${inquiry.phone}`}
                  className="mt-1 inline-block hover:underline"
                >
                  {formatPhone(inquiry.phone)}
                </a>
              </div>
            )}
            {inquiry.companyName && (
              <div>
                <p className="text-xs text-muted-foreground">Company</p>
                <p className="mt-1">{inquiry.companyName}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {hasReply && (
        <Card>
          <CardHeader>
            <CardTitle>Previous reply</CardTitle>
            <CardDescription>
              Sent {formatDate(inquiry.repliedAt!)}
              {inquiry.repliedBy
                ? ` by ${staffLabel(inquiry.repliedBy)}`
                : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {inquiry.replyMessage}
            </p>
          </CardContent>
        </Card>
      )}

      {canReply ? (
        <Card>
          <CardHeader>
            <CardTitle>{hasReply ? "Send another reply" : "Reply"}</CardTitle>
            <CardDescription>
              Emails {inquiry.email}. Re-reply overwrites the stored reply on
              this enquiry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-reply">Reply message</Label>
              <Textarea
                id="contact-reply"
                rows={6}
                value={reply}
                maxLength={CONTACT_FIELD_LIMITS.reply}
                onChange={(event) => setReply(event.target.value)}
                disabled={replyMutation.isPending}
                placeholder="Write your reply…"
              />
              <p className="text-xs text-muted-foreground">
                {reply.length}/{CONTACT_FIELD_LIMITS.reply}
              </p>
            </div>
            <Button
              disabled={
                replyMutation.isPending || reply.trim().length === 0
              }
              onClick={() => replyMutation.mutate()}
            >
              {replyMutation.isPending ? "Sending…" : "Send reply"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            You can view enquiries but need update-settings permission to reply.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
