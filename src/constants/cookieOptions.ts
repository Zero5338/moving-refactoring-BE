const isProduction = process.env.NODE_ENV === 'production';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/',
  sameSite: (isProduction ? 'lax' : 'none') as 'lax' | 'none',
  secure: isProduction || true,
  domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
};

export const ACCESS_TOKEN_MAX_AGE = 1 * 60 * 60 * 1000;
export const REFRESH_TOKEN_MAX_AGE = 14 * 24 * 60 * 60 * 1000;
