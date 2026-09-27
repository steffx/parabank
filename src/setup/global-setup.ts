import { FullConfig, request } from '@playwright/test';
import { env, isPublicDemo } from '../config/env';

/**
 * Runs once before all projects:
 *  1. Fails fast with a clear message if ParaBank is unreachable.
 *  2. Optionally resets the database (own Docker instance only).
 */
export default async function globalSetup(_config: FullConfig): Promise<void> {
  const ctx = await request.newContext({ baseURL: `${env.baseUrl}/` });
  try {
    const home = await ctx.get('index.htm', { timeout: 60_000 }).catch((e: Error) => {
      throw new Error(`ParaBank is not reachable at ${env.baseUrl} (${e.message}). Start Docker or set PARABANK_BASE_URL.`);
    });
    if (!home.ok()) {
      throw new Error(`ParaBank health check failed: GET ${env.baseUrl}/index.htm -> HTTP ${home.status()}`);
    }

    if (env.resetDb) {
      if (isPublicDemo) {
        throw new Error('Refusing PARABANK_RESET_DB=true against the shared public demo. Use a local Docker instance.');
      }
      const res = await ctx.post('services/bank/initializeDB');
      if (!res.ok()) throw new Error(`initializeDB failed: HTTP ${res.status()}`);
      console.log(`[global-setup] ParaBank database initialized at ${env.baseUrl}`);
    }
  } finally {
    await ctx.dispose();
  }
}
