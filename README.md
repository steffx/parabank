# ParaBank – Playwright test suite

End-to-end tests for [Parasoft ParaBank](https://parabank.parasoft.com/parabank) — a deliberately realistic
(and deliberately imperfect) demo bank. Every feature is covered through the browser **and** through the
REST and SOAP services behind it.

## Quick start

```bash
npm ci
npx playwright install --with-deps chromium
cp .env.example .env          # optional, defaults to the public demo
npm test                      # UI + API + SOAP + data-driven + hybrid + a11y (Chromium)
npm run report                # Playwright HTML report
npm run allure:generate && npm run allure:open
```

### Run against your own ParaBank (recommended)

The public demo is shared and occasionally reset or reconfigured by other users.

```bash
docker run -d --name parabank -p 3000:8080 parasoft/parabank:latest
PARABANK_BASE_URL=http://localhost:3000/parabank PARABANK_RESET_DB=true npm test
```

## Scripts

| Script | Runs |
|---|---|
| `npm test` | all functional projects on Chromium |
| `npm run test:smoke` | `@smoke` tagged tests (UI, API, SOAP) |
| `npm run test:ui` / `test:ui:all-browsers` | UI on Chromium / Chromium + Firefox + WebKit |
| `npm run test:api`, `test:soap`, `test:dd`, `test:hybrid`, `test:a11y` | one layer |
| `npm run test:visual:update` then `test:visual` | create baselines, then compare |
| `npm run test:destructive` | admin tests that reset the DB (local instance only) |
| `npm run typecheck` | TypeScript check |

## Layout

```
src/
  config/env.ts            env vars (.env supported)
  api/                     REST client, SOAP client, endpoints, types, JSON schemas, session helpers
  pages/                   Page Objects (one per screen) + ParaBankApp aggregator
  fixtures/test.ts         custom fixtures: bank, bankXml, soap, app, userApp, freshUser, loginAs, workerUser
  data/                    faker builders + JSON tables for data-driven tests + a11y known issues
  utils/                   money/date helpers, axe wrapper
  setup/global-setup.ts    health check + optional DB reset
tests/
  ui/  api/  soap/  hybrid/  data-driven/  a11y/  visual/
```

Full documentation (architecture, every test, findings, how to extend): https://claude.ai/code/artifact/bd616614-e61f-4851-b12d-3ac800e41049
