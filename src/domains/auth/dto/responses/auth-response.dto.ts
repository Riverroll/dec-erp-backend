export class AuthUserDto {
  id: number;
  username: string;
  full_name: string;
  email: string;
  roles: string[];
}

export class LoginResponseDto {
  token: string;
  expires_at: string;
  user: AuthUserDto;
}
