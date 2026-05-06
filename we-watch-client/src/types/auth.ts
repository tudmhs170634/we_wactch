export interface UserResponse {
  email: string;
  username: string;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isHost?: boolean;
  role?: string;
}

export interface LoginResponse {
  user: UserResponse;
  accessToken: string;
}

export type RegisterResponse = {
  user: UserResponse;
  accessToken: string;
};

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  avatarUrl?: string;
  avatarPublicId?: string;
}
