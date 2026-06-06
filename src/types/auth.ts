export type AdminLoginDTO = {
  email: string;
  password: string;
}


export type AdminLoginRes = {
  ok: boolean;
  data?: {accessToken: string; refreshToken: string};
  code?: string;
}

export type RefreshTokenDTO = {
  refreshToken: string;
}

export type RefreshTokenRes = {
  ok: boolean;
  data?: {accessToken: string};
  code?: string;
}