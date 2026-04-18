import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
}

interface ChatSession {
  sessionId: string;
  module: string;
}

export interface LocationData {
  lat: number;
  lon: number;
  city: string;
  region: string;
}

interface AppState {
  // Auth
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;

  // Location
  location: LocationData | null;
  setLocation: (location: LocationData) => void;

  // Chat sessions (keyed by module)
  sessions: Record<string, ChatSession>;
  setSession: (module: string, session: ChatSession) => void;
  clearSession: (module: string) => void;

  // Dismissed alerts
  dismissedAlerts: string[];
  dismissAlert: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null, sessions: {} }),

      location: null,
      setLocation: (location) => set({ location }),

      sessions: {},
      setSession: (module, session) =>
        set((s) => ({ sessions: { ...s.sessions, [module]: session } })),
      clearSession: (module) =>
        set((s) => {
          const sessions = { ...s.sessions };
          delete sessions[module];
          return { sessions };
        }),

      dismissedAlerts: [],
      dismissAlert: (id) =>
        set((s) => ({ dismissedAlerts: [...s.dismissedAlerts, id] })),
    }),
    {
      name: "farmsense-auth",
      partialize: (s) => ({ token: s.token, user: s.user, location: s.location, dismissedAlerts: s.dismissedAlerts }),
    }
  )
);
