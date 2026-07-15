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
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from "@/lib/auth-storage";
import { getStaffMePermissions, loginStaff } from "@/services/auth.service";
import type {
  AuthSession,
  LoginPayload,
  StaffMePermissions,
  StaffUser,
} from "@/types/auth";
import { ApiError } from "@/lib/api";

type AuthContextValue = {
  user: StaffUser | null;
  accessToken: string | null;
  /** Effective permissions for the logged-in staff user */
  myPermissions: StaffMePermissions | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<StaffUser>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [myPermissions, setMyPermissions] =
    useState<StaffMePermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateSession = useCallback(async () => {
    const stored = getStoredSession();
    if (!stored) {
      setSession(null);
      setMyPermissions(null);
      setIsLoading(false);
      return;
    }

    setSession(stored);

    try {
      const permissions = await getStaffMePermissions();
      setMyPermissions(permissions);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        clearStoredSession();
        setSession(null);
        setMyPermissions(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await loginStaff(payload);
    const nextSession: AuthSession = {
      accessToken: data.accessToken,
      user: data.user,
    };

    setStoredSession(nextSession);
    setSession(nextSession);

    const permissions = await getStaffMePermissions();
    setMyPermissions(permissions);
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setSession(null);
    setMyPermissions(null);
  }, []);

  const updateUser = useCallback((partial: Partial<StaffUser>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const nextSession: AuthSession = {
        ...prev,
        user: { ...prev.user, ...partial },
      };
      setStoredSession(nextSession);
      return nextSession;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      myPermissions,
      isAuthenticated: Boolean(session?.accessToken),
      isLoading,
      login,
      logout,
      updateUser,
    }),
    [session, myPermissions, isLoading, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
