import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  max?: number;
  size?: "sm" | "md";
  interactive?: boolean;
  onChange?: (value: number) => void;
  className?: string;
};

export function StarRating({
  value,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const iconClass = size === "sm" ? "size-3.5" : "size-5";

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`${value} of ${max} stars`}
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= Math.round(value);

        if (interactive) {
          return (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={starValue === value}
              aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
              className="rounded-sm p-0.5 text-muted-foreground transition hover:text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onChange?.(starValue)}
            >
              <Star
                className={cn(
                  iconClass,
                  filled && "fill-amber-400 text-amber-400",
                )}
              />
            </button>
          );
        }

        return (
          <Star
            key={starValue}
            className={cn(
              iconClass,
              filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
            )}
          />
        );
      })}
    </div>
  );
}
