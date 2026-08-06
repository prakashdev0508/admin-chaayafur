import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center px-6 py-10 text-center",
        className,
      )}
    >
      <div className="relative mb-5">
        <div
          aria-hidden
          className="absolute inset-0 scale-150 rounded-full bg-muted/60 blur-2xl"
        />
        <div className="relative flex size-16 items-center justify-center rounded-2xl border border-border/70 bg-background shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <Icon className="size-7 text-muted-foreground" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
