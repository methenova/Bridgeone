import {
  createContext,
  useContext,
  useEffect,
  useState,
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

import { WorkspaceProvider, useWorkspaceContext } from "./WorkspaceContext";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);

      if (authUser) {
        try {
          const profileData = await getProfile(authUser.id);
          setProfile(profileData);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function login(values) {
    const { user } = await loginUser(values);
    setUser(user);
    const profileData = await getProfile(user.id);
    setProfile(profileData);
    return { user, profile: profileData };
  }

  async function refreshProfile() {
    if (!user) return null;
    const profileData = await getProfile(user.id);
    setProfile(profileData);
    return profileData;
  }

  async function register(values) {
    const data = await registerUser(values);
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const profileData = await getProfile(currentUser.id);
      setProfile(profileData);
    }
    return data;
  }

  async function logout() {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
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