import { Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const QUOTATION_SAVE_STEPS = [
  "Preparing your PDF",
  "Uploading your PDF",
  "Saving the data",
  "It is done",
] as const;

type QuotationSaveProgressDialogProps = {
  open: boolean;
  currentStep: number;
};

export function QuotationSaveProgressDialog({
  open,
  currentStep,
}: QuotationSaveProgressDialogProps) {
  return (
    <Dialog open={open} disablePointerDismissal>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-sm"
      >
        <DialogTitle>Saving quotation</DialogTitle>
        <DialogDescription>
          Stay on this page until every step finishes.
        </DialogDescription>
        <ol className="mt-1 space-y-3">
          {QUOTATION_SAVE_STEPS.map((label, index) => {
            const done = index < currentStep;
            const active = index === currentStep && currentStep < QUOTATION_SAVE_STEPS.length;
            return (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-3 text-sm transition-colors duration-200 ease-out",
                  done && "text-foreground",
                  active && "text-foreground",
                  !done && !active && "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full",
                    done && "bg-primary text-primary-foreground",
                    active && "bg-primary/10 text-primary",
                    !done && !active && "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? (
                    <Check className="size-3.5" strokeWidth={2.5} />
                  ) : active ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <span className="text-[11px] font-medium">{index + 1}</span>
                  )}
                </span>
                <span className={cn(active && "font-medium")}>{label}</span>
              </li>
            );
          })}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
