import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UpdateSupportTicketPayload } from "@/types/support-ticket";

type ResolveTicketFormProps = {
  loading?: boolean;
  disabled?: boolean;
  onSubmit: (payload: UpdateSupportTicketPayload) => Promise<unknown>;
};

export function ResolveTicketForm({
  loading,
  disabled,
  onSubmit,
}: ResolveTicketFormProps) {
  const [status, setStatus] = useState<"RESOLVED" | "CLOSED">("RESOLVED");
  const [resolutionNote, setResolutionNote] = useState("");

  async function handleSubmit() {
    try {
      await onSubmit({
        status,
        ...(resolutionNote.trim() ? { resolutionNote: resolutionNote.trim() } : {}),
      });
      setResolutionNote("");
      toast.success(`Ticket ${status.toLowerCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update ticket");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resolve ticket</CardTitle>
        <CardDescription>
          Mark the ticket resolved or closed. Closed tickets cannot be updated.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(value) =>
              value && setStatus(value as "RESOLVED" | "CLOSED")
            }
            items={[
              { value: "RESOLVED", label: "Resolved" },
              { value: "CLOSED", label: "Closed" },
            ]}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="resolution-note">Resolution note</Label>
          <Textarea
            id="resolution-note"
            value={resolutionNote}
            onChange={(event) => setResolutionNote(event.target.value)}
            placeholder="Replacement part shipped. Ticket resolved."
            rows={3}
            disabled={disabled}
          />
        </div>
        <Button
          className="w-full"
          variant="outline"
          disabled={disabled || loading}
          onClick={() => void handleSubmit()}
        >
          {loading ? "Saving..." : "Update status"}
        </Button>
      </CardContent>
    </Card>
  );
}
