/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string;
  /** Public storefront origin, e.g. https://www.example.com */
  readonly VITE_STOREFRONT_URL?: string;
  /**
   * Embedded /shop SPA. Unset = on in DEV, off in production.
   * Set to "true" / "false" to force.
   */
  readonly VITE_ENABLE_SHOP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
