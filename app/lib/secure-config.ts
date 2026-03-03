/**
 * Central secure configuration for production.
 * - In production (NODE_ENV === 'production'): secrets are MANDATORY; missing env throws.
 * - In development: optional fallbacks so app runs; never use dev fallbacks in production.
 * This file must only be imported by server-side code (API routes, proxy, server libs).
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Returns ADMIN_JWT_SECRET. Throws in production if unset.
 * In development, returns env or a dev-only fallback (never use dev fallback in production).
 */
export function getAdminJWTSecret(): string {
  const value = process.env.ADMIN_JWT_SECRET;
  if (isProduction) {
    if (!value || value.trim() === '') {
      throw new Error(
        '[SecureConfig] ADMIN_JWT_SECRET is required in production. Set ADMIN_JWT_SECRET in your environment.'
      );
    }
    return value.trim();
  }
  return value?.trim() || 'dev-fallback-secret-do-not-use-in-production';
}

/**
 * Returns ADMIN_PASSWORD_SALT. Throws in production if unset.
 */
export function getAdminPasswordSalt(): string {
  const value = process.env.ADMIN_PASSWORD_SALT;
  if (isProduction) {
    if (!value || value.trim() === '') {
      throw new Error(
        '[SecureConfig] ADMIN_PASSWORD_SALT is required in production. Set ADMIN_PASSWORD_SALT in your environment.'
      );
    }
    return value.trim();
  }
  return value?.trim() || 'dev-fallback-salt-do-not-use-in-production';
}
