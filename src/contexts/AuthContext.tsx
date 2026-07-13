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
import { fetchRolesPermissions, loginStaff } from "@/services/auth.service";
import type {
  AuthSession,
  LoginPayload,
  RolesPermissionsMap,
  StaffUser,
} from "@/types/auth";
import { ApiError } from "@/lib/api";

type AuthContextValue = {
  user: StaffUser | null;
  accessToken: string | null;
  rolesPermissions: RolesPermissionsMap | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [rolesPermissions, setRolesPermissions] =
    useState<RolesPermissionsMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateSession = useCallback(async () => {
    const stored = getStoredSession();
    if (!stored) {
      setSession(null);
      setRolesPermissions(null);
      setIsLoading(false);
      return;
    }

    setSession(stored);

    try {
      const permissions = await fetchRolesPermissions();
      setRolesPermissions(permissions);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        clearStoredSession();
        setSession(null);
        setRolesPermissions(null);
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

    const permissions = await fetchRolesPermissions();
    setRolesPermissions(permissions);
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setSession(null);
    setRolesPermissions(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      rolesPermissions,
      isAuthenticated: Boolean(session?.accessToken),
      isLoading,
      login,
      logout,
    }),
    [session, rolesPermissions, isLoading, login, logout],
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
