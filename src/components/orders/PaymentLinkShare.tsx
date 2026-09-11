import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaymentLinkShareProps = {
  url: string;
  description?: string;
  className?: string;
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
}: PaymentLinkShareProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Payment link
      </p>
      <p className="break-all font-mono text-xs leading-relaxed">{url}</p>
      {description ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void copyPaymentLink(url)}
        >
          <Copy className="size-4" />
          Copy link
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          render={
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              Open
            </a>
          }
        />
      </div>
    </div>
  );
}
