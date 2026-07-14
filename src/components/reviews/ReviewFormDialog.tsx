import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/reviews/StarRating";

const MAX_COMMENT = 2000;

type ReviewFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  initialRating?: number;
  initialComment?: string | null;
  loading?: boolean;
  confirmLabel?: string;
  onSubmit: (values: {
    rating: number;
    comment?: string;
  }) => void | Promise<unknown>;
};

export function ReviewFormDialog({
  open,
  onOpenChange,
  title,
  description,
  initialRating = 0,
  initialComment = "",
  loading = false,
  confirmLabel = "Submit review",
  onSubmit,
}: ReviewFormDialogProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRating(initialRating);
      setComment(initialComment ?? "");
      setError(null);
    }
  }, [open, initialRating, initialComment]);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setError("Please select a rating from 1 to 5.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const trimmed = comment.trim();
      await onSubmit({
        rating,
        comment: trimmed ? trimmed.slice(0, MAX_COMMENT) : undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save review");
    } finally {
      setSubmitting(false);
    }
  };

  const busy = loading || submitting;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRating
              value={rating}
              interactive
              onChange={setRating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-comment">Comment (optional)</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={MAX_COMMENT}
              disabled={busy}
              placeholder="Share your experience"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.trim().length}/{MAX_COMMENT}
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={busy || rating < 1}>
            {busy ? "Saving..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
