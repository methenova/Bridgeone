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

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();

        setUser(currentUser);

        if (currentUser) {
          const profileData = await getProfile(currentUser.id);
          setProfile(profileData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

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
        }
      } else {
        setProfile(null);
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

  async function register(values) {
    return await registerUser(values);
  }

  async function logout() {
    await logoutUser();

    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,

        role: profile?.role,

        loading,

        login,
        register,
        logout,

        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}