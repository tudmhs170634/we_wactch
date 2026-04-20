export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export function createResponse<T>(
  data: T,
  message = 'Success',
  success = true,
): ApiResponse<T> {
  return { success, message, data };
}
