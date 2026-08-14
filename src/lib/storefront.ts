/** Public storefront origin (the customer website), not the API. */
export function getStorefrontBaseUrl(): string | null {
  const raw = import.meta.env.VITE_STOREFRONT_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

/** `{VITE_STOREFRONT_URL}/products/{slug}` */
export function getStorefrontProductUrl(slug: string): string | null {
  const base = getStorefrontBaseUrl();
  if (!base || !slug) return null;
  return `${base}/products/${encodeURIComponent(slug)}`;
}
