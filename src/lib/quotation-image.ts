export const QUOTATION_IMAGE_PROXY_PATH = "/__quotation-image";

export function quotationImageProxyUrl(sourceUrl: string) {
  return `${QUOTATION_IMAGE_PROXY_PATH}?url=${encodeURIComponent(sourceUrl)}`;
}

export function unwrapQuotationImageUrl(src: string) {
  try {
    const parsed = new URL(src, "https://local.invalid");
    if (
      parsed.pathname === QUOTATION_IMAGE_PROXY_PATH ||
      parsed.pathname === "/api/quotation-image"
    ) {
      return parsed.searchParams.get("url") ?? src;
    }
  } catch {
    // Keep the original src.
  }
  return src;
}

export async function inlineImagesAsJpegDataUrls(root: HTMLElement) {
  const images = [...root.querySelectorAll("img")];
  await Promise.all(
    images.map(async (image) => {
      const src = image.currentSrc || image.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      const jpeg = await loadJpegDataUrl(unwrapQuotationImageUrl(src));
      if (!jpeg) return;
      image.removeAttribute("crossorigin");
      image.src = jpeg;
      await new Promise<void>((resolve) => {
        if (image.complete) {
          resolve();
          return;
        }
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
    }),
  );
}

export async function loadJpegDataUrl(url: string): Promise<string | null> {
  if (url.startsWith("data:image/jpeg") || url.startsWith("data:image/jpg")) {
    return url;
  }
  if (url.startsWith("data:image/")) {
    try {
      const blob = await (await fetch(url)).blob();
      return await rasterizeBlob(blob);
    } catch {
      return null;
    }
  }

  const candidates = [quotationImageProxyUrl(url), url];
  for (const candidate of candidates) {
    const jpeg = await fetchAndRasterize(candidate);
    if (jpeg) return jpeg;
  }
  return null;
}

async function fetchAndRasterize(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (blob.size === 0) return null;
    const contentType = blob.type || response.headers.get("content-type") || "";
    if (
      contentType &&
      !contentType.startsWith("image/") &&
      !contentType.includes("octet-stream")
    ) {
      return null;
    }
    return await rasterizeBlob(blob);
  } catch {
    return null;
  }
}

async function rasterizeBlob(blob: Blob): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    const maxEdge = 320;
    const scale = Math.min(
      1,
      maxEdge / Math.max(bitmap.width, bitmap.height, 1),
    );
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return null;
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.86);
  } catch {
    return null;
  }
}
