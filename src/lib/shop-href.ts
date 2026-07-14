/**
 * Maps CMS redirect URLs to storefront routes.
 * Absolute URLs are unchanged; `/products…` maps to `/shop/products…`.
 */
export function resolveShopHref(redirectUrl: string): string {
  const trimmed = redirectUrl.trim();
  if (!trimmed) return "/shop";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/shop")) {
    return trimmed;
  }

  if (trimmed === "/products" || trimmed.startsWith("/products?")) {
    return `/shop${trimmed}`;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `/${trimmed}`;
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
