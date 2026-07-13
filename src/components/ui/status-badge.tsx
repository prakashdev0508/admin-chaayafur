import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StatusVariant } from "@/lib/status-variants";

const variantStyles: Record<StatusVariant, string> = {
  default: "",
  success: "border-transparent bg-[#edf3ec] text-[#3d6b4a] hover:bg-[#edf3ec]",
  warning: "border-transparent bg-[#fbf3db] text-[#956400] hover:bg-[#fbf3db]",
  danger: "border-transparent bg-[#fdebec] text-[#9f2f2d] hover:bg-[#fdebec]",
  neutral: "border-transparent bg-muted text-muted-foreground hover:bg-muted",
  brand: "border-transparent bg-primary/10 text-primary hover:bg-primary/10",
};

type StatusBadgeProps = {
  children: React.ReactNode;
  variant?: StatusVariant;
  className?: string;
};

export function StatusBadge({
  children,
  variant = "default",
  className,
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(variantStyles[variant], className)}
    >
      {children}
    </Badge>
  );
}
