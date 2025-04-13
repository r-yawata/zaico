import { create } from 'zustand';

interface UserSessionState {
  username: string;
  sessionId: string | null;
  isLoggedIn: boolean;
  
  // アクション
  setUsername: (username: string) => void;
  setSessionId: (sessionId: string | null) => void;
  login: (username: string, sessionId: string) => void;
  logout: () => void;
}

export const useUserSessionStore = create<UserSessionState>((set) => ({
  username: '和研 太郎',
  sessionId: null,
  isLoggedIn: true, //temp!!!
  
  setUsername: (username: string) => set({ username }),
  setSessionId: (sessionId) => set({ sessionId }),
  
  login: (username, sessionId) => set({
    username,
    sessionId,
    isLoggedIn: true
  }),
  
  logout: () => set({
    username: '',
    sessionId: null,
    isLoggedIn: false
  })
})); 