import { Copy, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaymentLinkShareProps = {
  url?: string | null;
  description?: string;
  className?: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
};

export async function copyPaymentLink(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Payment link copied");
    return true;
  } catch {
    toast.error("Could not copy link");
    return false;
  }
}

export function PaymentLinkShare({
  url,
  description,
  className,
  onRegenerate,
  regenerating = false,
}: PaymentLinkShareProps) {
  const hasUrl = Boolean(url);

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Payment link
      </p>
      {hasUrl ? (
        <p className="break-all font-mono text-xs leading-relaxed">{url}</p>
      ) : (
        <p className="text-xs leading-relaxed text-muted-foreground">
          No payment link on file. Generate a new shareable Razorpay link to send
          to the customer.
        </p>
      )}
      {description && hasUrl ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {hasUrl ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void copyPaymentLink(url!)}
            >
              <Copy className="size-4" />
              Copy link
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              render={
                <a href={url!} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  Open
                </a>
              }
            />
          </>
        ) : null}
      </div>
      {onRegenerate ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full justify-center"
          disabled={regenerating}
          onClick={onRegenerate}
        >
          <RefreshCw
            className={cn("size-4", regenerating && "animate-spin")}
          />
          {hasUrl ? "Regenerate payment link" : "Generate payment link"}
        </Button>
      ) : null}
    </div>
  );
}
