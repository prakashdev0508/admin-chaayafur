import { useId, useRef, useState, type ReactNode } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileDropzoneProps = {
  accept: string;
  label: string;
  hint: string;
  file: File | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
};

export function FileDropzone({
  accept,
  label,
  hint,
  file,
  onFile,
  disabled = false,
  icon,
  className,
}: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const assignFile = (next: File | null) => {
    onFile(next);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          if (disabled) return;
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (disabled) return;
          const dropped = e.dataTransfer.files[0];
          if (dropped) assignFile(dropped);
        }}
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-10 text-center transition-colors",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/10 hover:border-primary/40 hover:bg-muted/20",
          className,
        )}
      >
        <div className="flex size-12 items-center justify-center rounded-full border bg-background">
          {icon ?? <Upload className="size-5 text-muted-foreground" />}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {file ? file.name : label}
          </p>
          <p className="text-xs text-muted-foreground">
            {file
              ? `${(file.size / 1024).toFixed(1)} KB · click to change`
              : hint}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" tabIndex={-1} disabled={disabled}>
          <Upload className="size-4" />
          Choose file
        </Button>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          assignFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
        disabled={disabled}
      />
    </>
  );
}
