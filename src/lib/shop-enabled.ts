/**
 * Embedded /shop storefront toggle.
 *
 * - VITE_ENABLE_SHOP=true  → always on
 * - VITE_ENABLE_SHOP=false → always off
 * - unset → on in DEV, off in production builds
 */
export function isShopEnabled(): boolean {
  const flag = import.meta.env.VITE_ENABLE_SHOP?.trim().toLowerCase();
  if (flag === "true") return true;
  if (flag === "false") return false;
  return import.meta.env.DEV;
}
