import { create } from 'zustand';

interface UserSessionState {
  username: string;
  session_id: string | null;
  is_logged_in: boolean;
  
  // アクション
  setUsername: (username: string) => void;
  setSessionId: (sessionId: string | null) => void;
  login: (username: string, sessionId: string) => void;
  logout: () => void;
}

export const useUserSessionStore = create<UserSessionState>((set) => ({
  username: '和研 太郎',
  session_id: null,
  is_logged_in: true, //temp!!!
  
  setUsername: (username: string) => set({ username }),
  setSessionId: (sessionId) => set({ session_id: sessionId }),
  
  login: (username, sessionId) => set({
    username,
    session_id: sessionId,
    is_logged_in: true
  }),
  
  logout: () => set({
    username: '',
    session_id: null,
    is_logged_in: false
  })
})); 