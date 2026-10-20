import { cn } from "@/lib/utils";

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

/** Strip scripts/styles and event handlers from HTML before rendering. */
function sanitizeHtml(html: string) {
  if (typeof DOMParser === "undefined") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll("script, style, iframe, object, embed, link, meta")
    .forEach((node) => node.remove());

  doc.body.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith("on") || value.startsWith("javascript:")) {
        el.removeAttribute(attr.name);
      }
    }
  });

  return doc.body.innerHTML;
}

type HtmlContentProps = {
  html: string;
  className?: string;
};

/**
 * Renders HTML descriptions. Plain text (no tags) keeps line breaks.
 */
export function HtmlContent({ html, className }: HtmlContentProps) {
  const content = html.trim();
  if (!content) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>—</p>
    );
  }

  if (!HTML_TAG_PATTERN.test(content)) {
    return (
      <p
        className={cn(
          "whitespace-pre-wrap text-sm leading-relaxed",
          className,
        )}
      >
        {content}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "text-sm leading-relaxed",
        "[&_a]:text-primary [&_a]:underline",
        "[&_p]:mb-3 [&_p:last-child]:mb-0",
        "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:mb-1",
        "[&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold",
        "[&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold",
        "[&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold",
        "[&_strong]:font-semibold [&_em]:italic",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    />
  );
}
