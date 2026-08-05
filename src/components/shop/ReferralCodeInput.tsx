import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearStoredReferralCode,
  getStoredReferralCode,
  setStoredReferralCode,
} from "@/lib/referral-storage";

type ReferralCodeInputProps = {
  value: string | null;
  onChange: (code: string | null) => void;
};

export function ReferralCodeInput({ value, onChange }: ReferralCodeInputProps) {
  const [code, setCode] = useState(value ?? "");
  const [applied, setApplied] = useState<string | null>(value);

  useEffect(() => {
    const stored = getStoredReferralCode();
    if (stored && !value) {
      setCode(stored);
      setApplied(stored);
      onChange(stored);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- hydrate once from storage

  useEffect(() => {
    setCode(value ?? "");
    setApplied(value);
  }, [value]);

  function handleApply() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setCode(trimmed);
    setApplied(trimmed);
    setStoredReferralCode(trimmed);
    onChange(trimmed);
  }

  function handleClear() {
    setCode("");
    setApplied(null);
    clearStoredReferralCode();
    onChange(null);
  }

  return (
    <div className="space-y-3 rounded-xl border border-[#E8DFD3] bg-white p-4">
      <Label htmlFor="referral-code">Referral code (optional)</Label>
      <p className="text-xs text-muted-foreground">
        Tracking only — this does not change your order total.
      </p>
      <div className="flex gap-2">
        <Input
          id="referral-code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="CHAYAAB12CD"
          disabled={Boolean(applied)}
        />
        {applied ? (
          <Button variant="outline" onClick={handleClear}>
            Remove
          </Button>
        ) : (
          <Button
            variant="outline"
            disabled={!code.trim()}
            onClick={handleApply}
          >
            Apply
          </Button>
        )}
      </div>
      {applied && (
        <p className="text-sm text-muted-foreground">
          Referral <span className="font-mono font-medium">{applied}</span> will
          be attached to this order.
        </p>
      )}
    </div>
  );
}
