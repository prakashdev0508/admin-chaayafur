import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CreateSupportTicketMessagePayload } from "@/types/support-ticket";

type StaffReplyFormProps = {
  loading?: boolean;
  disabled?: boolean;
  onSubmit: (payload: CreateSupportTicketMessagePayload) => Promise<unknown>;
};

export function StaffReplyForm({
  loading,
  disabled,
  onSubmit,
}: StaffReplyFormProps) {
  const [message, setMessage] = useState("");
  const [awaitingCustomer, setAwaitingCustomer] = useState(true);

  async function handleSubmit() {
    if (!message.trim()) {
      toast.error("Enter a message");
      return;
    }

    try {
      await onSubmit({
        message: message.trim(),
        awaitingCustomer,
      });
      setMessage("");
      toast.success("Reply sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reply");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff reply</CardTitle>
        <CardDescription>
          Ask the customer a follow-up question or share an update.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="staff-reply-message">Message</Label>
          <Textarea
            id="staff-reply-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Please share a close-up photo of the damaged area."
            rows={4}
            disabled={disabled}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2">
          <div>
            <p className="text-sm font-medium">Awaiting customer reply</p>
            <p className="text-xs text-muted-foreground">
              Off keeps the ticket with staff until you follow up again.
            </p>
          </div>
          <Switch
            checked={awaitingCustomer}
            onCheckedChange={setAwaitingCustomer}
            disabled={disabled}
          />
        </div>
        <Button
          className="w-full"
          disabled={disabled || loading}
          onClick={() => void handleSubmit()}
        >
          {loading ? "Sending..." : "Send reply"}
        </Button>
      </CardContent>
    </Card>
  );
}
