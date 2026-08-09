export type ProductDescriptionPair = {
  label: string;
  value: string;
};

/** Decode HTML entities / strip tags via the browser HTML parser. */
export function htmlToPlainText(input: string): string {
  if (typeof DOMParser === "undefined") {
    return input
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");
  }

  const doc = new DOMParser().parseFromString(input, "text/html");
  return doc.body.textContent ?? "";
}

/**
 * Normalize product descriptions that store specs as:
 * `Material\n:\nSheesham Wood\nStorage Type\n:\nWithout Storage`
 * into label/value pairs for display.
 */
export function parseProductDescription(
  description: string,
): { pairs: ProductDescriptionPair[]; plainText: string } {
  const plainText = htmlToPlainText(
    description.replace(/\\n/g, "\n").replace(/<br\s*\/?>/gi, "\n"),
  )
    .replace(/\r\n/g, "\n")
    .trim();

  if (!plainText) {
    return { pairs: [], plainText: "" };
  }

  // Collapse "Label \n : \n Value" (and "Label : Value") into single lines.
  const collapsed = plainText
    .replace(/[ \t]*\n[ \t]*:[ \t]*\n[ \t]*/g, ": ")
    .replace(/[ \t]*\n[ \t]*:[ \t]*/g, ": ")
    .replace(/[ \t]*:[ \t]*\n[ \t]*/g, ": ")
    .replace(/[ \t]+:[ \t]+/g, ": ");

  const pairs: ProductDescriptionPair[] = [];
  for (const line of collapsed.split(/\n+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const sep = trimmed.indexOf(":");
    if (sep <= 0) continue;
    const label = trimmed.slice(0, sep).trim();
    const value = trimmed.slice(sep + 1).trim();
    if (!label || !value) continue;
    pairs.push({ label, value });
  }

  // Prefer structured specs when we clearly got key/value rows.
  if (pairs.length >= 2) {
    return { pairs, plainText };
  }

  return { pairs: [], plainText };
}
