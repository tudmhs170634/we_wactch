export interface UserResponse {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResponse {
  user: UserResponse;
  token: string;
}

export type RegisterResponse = UserResponse;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  avatarUrl: string;
}
