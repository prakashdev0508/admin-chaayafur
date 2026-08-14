import { useEffect, useState } from "react";
import { Copy, Download, ExternalLink, QrCode, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { triggerBrowserDownload } from "@/lib/download";
import { getStorefrontProductUrl } from "@/lib/storefront";

type ProductStorefrontQrProps = {
  slug: string;
  productName: string;
};

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function ProductStorefrontQr({
  slug,
  productName,
}: ProductStorefrontQrProps) {
  const productUrl = getStorefrontProductUrl(slug);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    if (!productUrl) {
      setQrDataUrl(null);
      setQrError(null);
      return;
    }

    let cancelled = false;
    setQrError(null);

    QRCode.toDataURL(productUrl, {
      width: 480,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#111111", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl(null);
          setQrError("Could not generate QR code");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productUrl]);

  async function copyLink() {
    if (!productUrl) return;
    try {
      await navigator.clipboard.writeText(productUrl);
      toast.success("Product link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    triggerBrowserDownload(dataUrlToBlob(qrDataUrl), `${slug}-product-qr.png`);
    toast.success("QR downloaded");
  }

  async function shareQr() {
    if (!productUrl) return;

    const payload: ShareData = {
      title: productName,
      text: productName,
      url: productUrl,
    };

    if (qrDataUrl && "canShare" in navigator) {
      const file = new File([dataUrlToBlob(qrDataUrl)], `${slug}-product-qr.png`, {
        type: "image/png",
      });
      const withFile = { ...payload, files: [file] };
      if (navigator.canShare(withFile)) {
        try {
          await navigator.share(withFile);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
        }
      }
    }

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(payload);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    await copyLink();
  }

  if (!productUrl) {
    return (
      <div className="rounded-xl border bg-muted/20 p-4 text-sm">
        <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Storefront QR
        </p>
        <p className="text-muted-foreground">
          Set <code className="font-mono text-foreground">VITE_STOREFRONT_URL</code>{" "}
          in your env (the customer website origin, not the API) to generate a QR
          for <span className="font-mono">/products/{slug}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Storefront QR
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex size-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white p-2">
          {qrError ? (
            <p className="px-2 text-center text-xs text-destructive">{qrError}</p>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code for ${productName}`}
              className="size-full object-contain"
            />
          ) : (
            <QrCode className="size-8 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm text-muted-foreground">
            Scan or share to open this product on the website.
          </p>
          <a
            href={productUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-start gap-1.5 break-all font-mono text-xs text-foreground underline-offset-2 hover:underline"
          >
            <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
            {productUrl}
          </a>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void copyLink()}>
              <Copy />
              Copy link
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!qrDataUrl}
              onClick={downloadQr}
            >
              <Download />
              Download QR
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!qrDataUrl}
              onClick={() => void shareQr()}
            >
              <Share2 />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
