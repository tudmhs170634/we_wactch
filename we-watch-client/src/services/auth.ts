import api from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { 
  LoginResponse, 
  LoginCredentials, 
  RegisterCredentials, 
  RegisterResponse,
} from '../types/auth';

/**
 * Đăng nhập hệ thống
 * Trả về: { user, token }
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    return data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Login failed';
    console.log(`Data:`, credentials);
            console.log('🚀 ~ handleSubmit ~ res:', error);
    throw new Error(errorMessage);
  }
};

/**
 * Đăng ký tài khoản mới
 * Trả về: Thông tin user sau khi tạo (RegisterResponse)
 */
export const register = async (credentials: RegisterCredentials): Promise<RegisterResponse> => {
  try {
    const { data } = await api.post<RegisterResponse>('/auth/register', credentials);
    return data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Register failed';
    console.log(`Data:`, credentials);
    console.log('🚀 ~ handleSubmit ~ res:', error);
    throw new Error(errorMessage);
  }
};

/**
 * Đăng xuất và dọn dẹp bộ nhớ client
 * Dọn dẹp state ngay lập tức để không gây khựng UI,
 * sau đó fire-and-forget API call lên backend.
 */
export const logout = (): void => {
  useAuthStore.getState().logout();
  localStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];

  window.location.href = '/';

  api.post('/auth/logout').catch(() => {
  });
};

