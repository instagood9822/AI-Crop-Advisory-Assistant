# CropWise Advisory

CropWise turns farm conditions into explainable crop recommendations and keeps each user's advisory history.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, Clerk-managed auth variables, and `GEMINI_API_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/crop-advisor/src/` — React routes, authenticated shell, advisory form, history, profile, and theme
- `artifacts/api-server/src/routes/cropAdvisories.ts` — protected dashboard, profile, advisory CRUD, and Gemini generation routes
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/advisories.ts` — advisory persistence schema

## Architecture decisions

- Clerk owns browser sessions and account lifecycle; the API enforces ownership from the Clerk user ID.
- Gemini calls run only in the API server; generated output is validated before it is saved or returned.
- Advisory farm inputs and structured AI results are stored together so history remains explainable and reproducible.
- The app uses Replit PostgreSQL with Drizzle rather than adding an external database service.

## Product

Users can create farm advisories, review ranked crops with conditions and risks, revisit saved recommendations, delete their own records, and update their profile.

## User preferences

No project-specific preferences recorded.

## Gotchas

- Run API codegen after changing `lib/api-spec/openapi.yaml`.
- Browser auth is cookie-based; do not add bearer-token handling to the web client.
- Live advisory generation requires `GEMINI_API_KEY`; never expose it in client code.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
