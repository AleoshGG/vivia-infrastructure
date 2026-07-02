export interface LoginResponseDto {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
  };
  message: string;
  status: string;
}
