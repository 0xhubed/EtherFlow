# EtherFlow

Ethereum investigation dashboard, reviving toward an AI-assisted compliance tool. See `docs/superpowers/specs/` for the active design direction; `docs/superpowers/plans/` for milestone plans.

## Quick commands
- `npm run dev` — dev server on **port 3000** (pinned in `vite.config.ts`, not Vite's default 5173)
- `npm run check` — single quality gate: `lint && type-check && test && build`. Run before committing.
- `npm test -- --run` — run tests once (non-watch). Vitest; tests co-located as `*.test.ts(x)`.

## Stack
Vite 6 + React 19 + TypeScript 5.7 + Zustand 5 + Tailwind 4 + TanStack Query 5 + wagmi 2 + viem 2. ESLint 9 flat config. Path alias `@/*` → `src/*`.

## Env vars
Uses **`VITE_` prefix** (formerly `REACT_APP_` — this repo migrated off CRA). Copy `.env.example` to `.env`. Keys needed: `VITE_ALCHEMY_API_KEY`, optional `VITE_DEMO_API_KEY`.

## Alchemy gotcha
Alchemy apps have a domain allowlist. A 403 with body "Unspecified origin not on whitelist" means `http://localhost:3000` isn't on it — fix in dashboard.alchemy.com → app → Security, not in code.

## Partial migration state
Several `.js` files under `src/components/` and `src/services/` are intentional dead code, kept until M1 rewires or replaces them. They're listed in `eslint.config.js` ignores. Do NOT silently migrate them to TS or wire them into `App.tsx` without a plan.

## Git
Remote is SSH: `git@github.com:0xhubed/EtherFlow.git`. HTTPS push will fail — `gh auth status` shows `Git operations protocol: ssh`.

## Spec/plan workflow
Non-trivial features go through: design spec in `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` → implementation plan in `docs/superpowers/plans/YYYY-MM-DD-<topic>.md` → execute via superpowers skills (brainstorming → writing-plans → subagent-driven-development or executing-plans).
