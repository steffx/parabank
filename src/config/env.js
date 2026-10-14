import 'dotenv/config';

const bool = (value, fallback = false) =>
  value === undefined ? fallback : ['1', 'true', 'yes'].includes(value.toLowerCase());

const stripSlash = (url) => url.replace(/\/+$/, '');

/**
 * Single source of truth for runtime configuration.
 * Every value can be overridden with an environment variable or a local .env file.
 */
export const env = {
  /** Application root, without a trailing slash. */
  baseUrl: stripSlash(process.env.PARABANK_BASE_URL ?? 'https://parabank.parasoft.com/parabank'),
  /** Reset the database before the run (own Docker instance only). */
  resetDb: bool(process.env.PARABANK_RESET_DB),
  /** Allow tests tagged @destructive that change global application state. */
  destructive: bool(process.env.PARABANK_DESTRUCTIVE),
  /** True when running in CI (GitHub Actions sets CI=true). */
  ci: bool(process.env.CI),
};

/** True when the suite runs against the shared public demo site. */
export const isPublicDemo = env.baseUrl.includes('parabank.parasoft.com');
