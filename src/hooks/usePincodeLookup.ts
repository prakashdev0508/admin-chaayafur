import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { lookupPincode } from "@/services/shipping.service";
import type { PincodeLookup } from "@/types/shipping";

const PINCODE_RE = /^\d{6}$/;

type UsePincodeLookupOptions = {
  /** Called when lookup succeeds so the form can fill city/state. */
  onResolved?: (result: PincodeLookup) => void;
  debounceMs?: number;
};

export function usePincodeLookup(
  zipCode: string,
  { onResolved, debounceMs = 350 }: UsePincodeLookupOptions = {},
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PincodeLookup | null>(null);
  const onResolvedRef = useRef(onResolved);
  onResolvedRef.current = onResolved;
  const lastResolvedPin = useRef<string | null>(null);

  useEffect(() => {
    const trimmed = zipCode.trim();

    if (!PINCODE_RE.test(trimmed)) {
      setIsLoading(false);
      setError(null);
      setData(null);
      lastResolvedPin.current = null;
      return;
    }

    if (lastResolvedPin.current === trimmed) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);

      void lookupPincode(trimmed)
        .then((result) => {
          if (cancelled) return;
          lastResolvedPin.current = trimmed;
          setData(result);
          setError(null);
          onResolvedRef.current?.(result);
        })
        .catch((err) => {
          if (cancelled) return;
          lastResolvedPin.current = null;
          setData(null);
          if (err instanceof ApiError) {
            setError(
              err.statusCode === 404
                ? "PIN code not found"
                : err.message || "Could not look up PIN code",
            );
          } else {
            setError("Could not look up PIN code");
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [zipCode, debounceMs]);

  return { isLoading, error, data };
}
