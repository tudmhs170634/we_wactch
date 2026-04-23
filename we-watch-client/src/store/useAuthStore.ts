import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { UserResponse } from '../types/auth';

interface AuthState {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: UserResponse, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        Cookies.set('token', token, { expires: 7, path: '/' });
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        Cookies.remove('token', { path: '/' });
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'token',
    }
  )
);
