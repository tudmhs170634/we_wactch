import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export const useAuth = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const auth = useAuthStore();

  // Đợi cho đến khi Zustand đọc xong localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated
    ? auth
    : {
        user: null,
        token: null,
        isAuthenticated: false,
        login: () => {},
        logout: () => {},
      };
};
