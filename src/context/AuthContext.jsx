import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";

import { supabase } from "@/config/supabase";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "@/features/auth/services/auth.service";

import {
  getProfile,
} from "@/features/auth/services/profile.service";

import { clearUserWorkspaceStorage } from "@/services/storage/workspaceStorage";

import { WorkspaceProvider, useWorkspaceContext } from "./WorkspaceContext";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // In-flight request deduplication and race-condition safety tracking
  const activeFetchUserIdRef = useRef(null);
  const activeFetchPromiseRef = useRef(null);

  const fetchProfileForUser = useCallback(async (userId, forceRefresh = false) => {
    if (!userId) {
      activeFetchUserIdRef.current = null;
      activeFetchPromiseRef.current = null;
      setProfile(null);
      return null;
    }

    // Reuse in-flight promise if already fetching for the exact same userId (and not forcing refresh)
    if (
      !forceRefresh &&
      activeFetchUserIdRef.current === userId &&
      activeFetchPromiseRef.current
    ) {
      return activeFetchPromiseRef.current;
    }

    activeFetchUserIdRef.current = userId;
    const fetchPromise = (async () => {
      try {
        const profileData = await getProfile(userId);
        // Only set profile state if the active user hasn't changed during the async request
        if (activeFetchUserIdRef.current === userId) {
          setProfile(profileData);
        }
        return profileData;
      } catch (error) {
        console.error("AuthContext getProfile error:", error);
        if (activeFetchUserIdRef.current === userId) {
          setProfile(null);
        }
        return null;
      } finally {
        if (activeFetchUserIdRef.current === userId) {
          activeFetchPromiseRef.current = null;
        }
      }
    })();

    activeFetchPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);

      if (authUser) {
        try {
          await fetchProfileForUser(authUser.id);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        activeFetchUserIdRef.current = null;
        activeFetchPromiseRef.current = null;
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileForUser]);

  async function login(values) {
    const { user: authUser } = await loginUser(values);
    setUser(authUser);
    const profileData = await fetchProfileForUser(authUser.id);
    return { user: authUser, profile: profileData };
  }

  async function refreshProfile() {
    if (!user) return null;
    return await fetchProfileForUser(user.id, true);
  }

  async function register(values) {
    const data = await registerUser(values);
    const currentUser = await getCurrentUser();
    let profileData = null;
    if (currentUser) {
      setUser(currentUser);
      profileData = await fetchProfileForUser(currentUser.id);
    }
    return { ...data, profile: profileData };
  }

  async function logout() {
    const currentUserId = user?.id;
    activeFetchUserIdRef.current = null;
    activeFetchPromiseRef.current = null;
    try {
      await logoutUser();
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      clearUserWorkspaceStorage(currentUserId);
      setUser(null);
      setProfile(null);
    }
  }

  const authValue = {
    user,
    profile,
    role: profile?.role,
    onboardingCompleted: profile?.onboarding_completed ?? false,
    loading,
    login,
    register,
    logout,
    refreshProfile,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={authValue}>
      <WorkspaceProvider user={user}>{children}</WorkspaceProvider>
    </AuthContext.Provider>
  );
}

/**
 * Combined Hook: Merges AuthContext & WorkspaceContext for 100% backward compatibility.
 */
export function useAuthContext() {
  const auth = useContext(AuthContext) || {};
  const workspace = useWorkspaceContext();

  return {
    ...auth,
    ...workspace,
  };
}