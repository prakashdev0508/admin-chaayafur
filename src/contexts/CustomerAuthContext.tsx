import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearStoredCustomerSession,
  getStoredCustomerSession,
  setStoredCustomerSession,
} from "@/lib/customer-auth-storage";
import {
  fetchCustomerProfile,
  sendCustomerOtp,
  verifyCustomerOtp,
} from "@/services/customer-auth.service";
import type {
  CustomerProfile,
  CustomerSession,
  SendOtpPayload,
  SendOtpResponse,
  VerifyOtpPayload,
} from "@/types/customer-auth";
import { ApiError } from "@/lib/api";

type CustomerAuthContextValue = {
  user: CustomerProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOtp: (payload: SendOtpPayload) => Promise<SendOtpResponse>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateSession = useCallback(async () => {
    const stored = getStoredCustomerSession();
    if (!stored) {
      setSession(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setSession(stored);

    try {
      const nextProfile = await fetchCustomerProfile();
      setProfile(nextProfile);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        clearStoredCustomerSession();
        setSession(null);
        setProfile(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  const sendOtp = useCallback(async (payload: SendOtpPayload) => {
    return sendCustomerOtp(payload);
  }, []);

  const verifyOtp = useCallback(async (payload: VerifyOtpPayload) => {
    const data = await verifyCustomerOtp(payload);
    const nextSession: CustomerSession = {
      accessToken: data.accessToken,
      user: data.user,
    };

    setStoredCustomerSession(nextSession);
    setSession(nextSession);

    const nextProfile = await fetchCustomerProfile();
    setProfile(nextProfile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.accessToken) return;
    const nextProfile = await fetchCustomerProfile();
    setProfile(nextProfile);
  }, [session?.accessToken]);

  const logout = useCallback(() => {
    clearStoredCustomerSession();
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo<CustomerAuthContextValue>(
    () => ({
      user: profile,
      accessToken: session?.accessToken ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      isLoading,
      sendOtp,
      verifyOtp,
      refreshProfile,
      logout,
    }),
    [profile, session, isLoading, sendOtp, verifyOtp, refreshProfile, logout],
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  }
  return context;
}
