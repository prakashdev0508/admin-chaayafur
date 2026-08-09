import { parseProductDescription } from "@/lib/product-description";
import { cn } from "@/lib/utils";

type ProductDescriptionProps = {
  description: string;
  className?: string;
};

export function ProductDescription({
  description,
  className,
}: ProductDescriptionProps) {
  const { pairs, plainText } = parseProductDescription(description);

  if (pairs.length > 0) {
    return (
      <dl className={cn(className)}>
        <div className="overflow-hidden rounded-2xl border border-[#E8DFD3]">
          {pairs.map((pair, index) => (
            <div
              key={`${pair.label}-${index}`}
              className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3 border-b border-[#E8DFD3] px-4 py-3 last:border-b-0 sm:grid-cols-[12rem_minmax(0,1fr)]"
            >
              <dt className="text-[11px] font-semibold tracking-[0.08em] text-[#9A8B7A] uppercase">
                {pair.label}
              </dt>
              <dd className="text-[15px] leading-relaxed text-[#1F1610]">
                {pair.value}
              </dd>
            </div>
          ))}
        </div>
      </dl>
    );
  }

  if (!plainText) return null;

  return (
    <p
      className={cn(
        "max-w-prose whitespace-pre-wrap text-[15px] leading-relaxed text-[#6B5C4F]",
        className,
      )}
    >
      {plainText}
    </p>
  );
}
