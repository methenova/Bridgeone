import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: false,

  setUser: (user) => set({ user }),

  setSession: (session) => set({ session }),

  setLoading: (loading) => set({ loading }),

  logout: () =>
    set({
      user: null,
      session: null,
    }),
}));

export default useAuthStore;