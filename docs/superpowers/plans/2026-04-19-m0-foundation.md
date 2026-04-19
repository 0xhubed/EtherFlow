# M0: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adopt the stalled 2026 TS+Vite+Zustand modernization (`origin/claude/etherflow-modernization-plan-1QKwm`) as the new baseline, prune code that conflicts with the compliance-agent direction (3D graph, demo-mode UI, zombie JS duplicates), and establish baseline Vitest smoke coverage. End state: clean working tree, green type-check + lint + tests + build, Vercel-deployable.

**Architecture:** Merge the 2-commit modernization branch into a new feature branch. Delete dead duplicates (files that exist in both `.js` and `.tsx` — the Vite build only uses `.tsx`), remove direction-incompatible components (`TransferGraph3D`, `DemoModePanel`). Leave the remaining JS visualization components in place as dead code; M1 will re-wire or replace them when the agent-driven layout exists. Add a small but real Vitest suite: one utility test, one Zustand store test, one app-render smoke test — plus a combined `check` script that CI can eventually run.

**Tech Stack:** Vite 6, React 19, TypeScript 5.7, Zustand 5, Tailwind 4, Vitest 2, Radix UI, wagmi 2, viem 2, Testing Library + happy-dom.

**Out of scope for M0** (explicitly deferred to later milestones):
- Wiring the JS visualization components (`TransferGraphD3`, `TimelineVisualization`, `TransactionVolumeHeatmap`, `TreeMapVisualization`) — M1.
- Claude Agent SDK, chat panel, tool surface — M1.
- OFAC / Chainabuse / known-entities labels — M2.
- Multi-chain support, bridge detection — M3.
- PDF reports — M4.

---

### Task 1: Create feature branch for M0

**Files:**
- No file changes; git-only.

- [ ] **Step 1: Verify clean working tree**

Run:
```bash
git status
```
Expected: `nothing to commit, working tree clean` on branch `main`.

- [ ] **Step 2: Fetch latest refs from origin**

Run:
```bash
git fetch origin
```
Expected: either `Already up to date` or a short list of fetched refs including `origin/claude/etherflow-modernization-plan-1QKwm`.

- [ ] **Step 3: Create and check out the M0 branch from main**

Run:
```bash
git checkout -b feature/m0-foundation
```
Expected: `Switched to a new branch 'feature/m0-foundation'`.

- [ ] **Step 4: Verify branch tip matches main**

Run:
```bash
git log --oneline -2
```
Expected: first line is the spec commit `Add design spec: EtherFlow compliance investigation agent`.

---

### Task 2: Merge modernization branch

**Files:**
- Merges contents from `origin/claude/etherflow-modernization-plan-1QKwm` (commits `1687e23` and `31c16c4`).
- The merge introduces ~30 new files across `src/`, `src/components/ui/`, `src/config/`, `src/hooks/`, `src/lib/`, `src/services/`, `src/stores/`, `src/test/`, `src/types/` plus `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, and a rewritten `package.json`.

- [ ] **Step 1: Inspect the merge-base**

Run:
```bash
git merge-base HEAD origin/claude/etherflow-modernization-plan-1QKwm
```
Expected: prints commit hash `f3ac7c9854f7a2016298e407041309c1bd51f5b4` (the pre-spec main). This confirms the branches diverged cleanly — the modernization branch has 2 commits, main has 1 (the spec) on top of that same base.

- [ ] **Step 2: Run a merge dry-run to preview conflicts**

Run:
```bash
git merge --no-commit --no-ff origin/claude/etherflow-modernization-plan-1QKwm
```
Expected: `Automatic merge went well; stopped before committing as requested.` — there should be no conflicts because the only file `main` added (the spec at `docs/superpowers/specs/...`) is not touched by the modernization branch.

If this reports conflicts instead:
- Abort: `git merge --abort`
- Escalate: the branch has drifted unexpectedly. Stop the plan and surface the conflict list. Do NOT attempt a manual resolution without operator input; the fallback is a fresh migration (documented in the spec's Risks section) which is a separate plan.

- [ ] **Step 3: Finalize the merge**

Run:
```bash
git commit -m "Merge modernization branch: adopt Vite 6 + TS 5.7 + React 19 + Zustand 5 as baseline for M0 foundation"
```
Expected: commit created with the two modernization commits as merged history.

- [ ] **Step 4: Verify expected files are now present**

Run:
```bash
ls -1 vite.config.ts tsconfig.json package.json src/App.tsx src/main.tsx src/stores/appStore.ts
```
Expected: all six paths listed, no errors.

---

### Task 3: Install dependencies

**Files:**
- Modify: `package-lock.json` (regenerated).

- [ ] **Step 1: Remove stale CRA-era artifacts before install**

The old `package-lock.json` was for `react-scripts 5.0.1`. Delete it so npm regenerates one matching the new `package.json`.

Run:
```bash
rm -f package-lock.json
rm -rf node_modules
```
Expected: no output.

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install
```
Expected: ends with a summary line like `added NNN packages in …`. There may be peer-dep warnings (Tailwind 4 is very new); warnings are OK. Errors are not.

If `npm install` errors out:
- Capture the error. Most likely cause is Node version — Vite 6 + Vitest 2 require Node ≥ 20. Check: `node -v`. If < 20, surface to operator.

- [ ] **Step 3: Stage the new lockfile**

Run:
```bash
git add package-lock.json
git commit -m "Regenerate package-lock.json for Vite/TS stack"
```
Expected: commit created.

---

### Task 4: Verify baseline green (type-check, lint, test, build)

**Files:**
- No source changes; this task validates inherited state before we start modifying it.

- [ ] **Step 1: Type-check**

Run:
```bash
npm run type-check
```
Expected: no output, exit 0.

If errors appear: these are bugs inherited from the modernization branch. Record each error (file:line + message) in the branch commit message and fix them minimally (prefer adding types, not `any`) before proceeding. If an error can't be fixed in <5 minutes, surface to operator.

- [ ] **Step 2: Lint**

Run:
```bash
npm run lint
```
Expected: no output, exit 0. (The lint script uses `--max-warnings 0`.)

If warnings/errors appear: the JS files still in the tree (e.g., `src/App.js`, `src/components/TransferGraphD3.js`) are the likely cause. Many of these will be deleted in Task 5 and Task 6; if the lint errors are in files scheduled for deletion, skip this step and re-run after Task 6. Document that decision in the commit.

- [ ] **Step 3: Run tests (expected: none yet)**

Run:
```bash
npm test -- --run
```
Expected: vitest reports `No test files found` (not an error) OR runs 0 tests. Exit code should be 0 or 1 depending on vitest behavior when no tests exist — if 1, that's acceptable for this step; we add tests in Task 8+.

- [ ] **Step 4: Production build**

Run:
```bash
npm run build
```
Expected: ends with Vite output listing chunks and `✓ built in Xs`. A `build/` directory is created.

If the build fails on the demo/3D components (likely — they reference things not wired into `App.tsx`):
- Do NOT fix the components; they're scheduled for deletion in Task 6–7.
- Skip this step's strict green-gate for now and note: "baseline build deferred until after Task 7 deletion."
- Re-run the build at the end of Task 7.

- [ ] **Step 5: Dev server smoke-check**

Run:
```bash
npm run dev
```
Expected: `VITE vX.X.X ready in Xms` + `Local: http://localhost:3000/`. Open the URL in a browser, confirm "EtherFlow" header renders without console errors, then stop the dev server (`Ctrl+C`).

If errors appear in the browser console: record them in a comment in the plan file and continue — most will resolve after the cleanup tasks.

---

### Task 5: Delete zombie JS duplicates

**Context:** The modernization branch added `.tsx`/`.ts` files but did not delete their `.js` predecessors. Since `vite.config.ts` uses `src/main.tsx` as the entry and `main.tsx` imports `App.tsx`, the `.js` versions of these files are dead code. Deleting them removes ambiguity and shrinks surface area.

**Files:**
- Delete: `src/App.js`
- Delete: `src/App.css` (old, was replaced in branch — verify it's not imported by `App.tsx`)
- Delete: `src/index.js`
- Delete: `src/components/ui/button.js`
- Delete: `src/components/ui/card.js`
- Delete: `src/components/ui/input.js`
- Delete: `src/components/ui/registry.js`
- Delete: `src/components/ui/InfoButton.js`
- Delete: `src/components/ui/InfoButton.css`
- Delete: `src/services/patternAnalysisService.js` (superseded by `.ts` version)

- [ ] **Step 1: Confirm `App.tsx` imports its own CSS (not the deleted one)**

Run:
```bash
grep -n "App.css" src/App.tsx
```
Expected: one line like `import './App.css'`. This tells you whether App.css is referenced.

- [ ] **Step 2: Inspect the CSS file that will be referenced**

Run:
```bash
wc -l src/App.css
```
Expected: the file in the modernization branch is ~200 lines (the slim version, not the pre-modernization 753-line version). If it's < 400 lines, this is the modernization-branch version and we keep it. If it's ≥ 700, it's the old pre-modernization file accidentally retained — in that case, revert to the branch version.

- [ ] **Step 3: Confirm `patternAnalysisService.ts` is the one being imported**

Run:
```bash
grep -rn "patternAnalysisService" src --include="*.ts" --include="*.tsx"
```
Expected: imports resolve via `@/services/patternAnalysisService` (no extension). TS resolution prefers `.ts` over `.js`, so this import will use the TS version. The `.js` version is dead.

- [ ] **Step 4: Delete zombie duplicates**

Run:
```bash
rm src/App.js \
   src/index.js \
   src/components/ui/button.js \
   src/components/ui/card.js \
   src/components/ui/input.js \
   src/components/ui/registry.js \
   src/components/ui/InfoButton.js \
   src/components/ui/InfoButton.css \
   src/services/patternAnalysisService.js
```
Expected: no output.

**Note on `src/App.css`:** do NOT delete this in the same step. It's imported by `App.tsx`. The one present in the modernization branch is the new minimal version; keep it.

- [ ] **Step 5: Verify nothing in TS/TSX references deleted files**

Run:
```bash
grep -rn -E "InfoButton|components/ui/registry" src --include="*.ts" --include="*.tsx"
```
Expected: no output. If any TS/TSX file references them, it's a merge artifact — fix the import (usually by deleting the import line since the TS components don't use InfoButton).

- [ ] **Step 6: Type-check still green**

Run:
```bash
npm run type-check
```
Expected: no errors.

- [ ] **Step 7: Commit the deletions**

Run:
```bash
git add -A
git commit -m "Delete zombie JS duplicates left over from modernization

These files were superseded by their .tsx/.ts counterparts. Vite uses
main.tsx as its entry point; the .js versions were dead code."
```
Expected: commit created.

---

### Task 6: Delete `TransferGraph3D` component

**Context:** The 3D graph was a "cool factor" feature. It doesn't serve the compliance-investigation direction and adds maintenance cost. Removing it now avoids accidentally restoring it in M1's wiring work.

**Files:**
- Delete: `src/components/TransferGraph3D.js`
- Delete: `src/components/TransferGraph.css` (shared with `TransferGraphD3.js`? verify first)

- [ ] **Step 1: Check whether `TransferGraph.css` is used by the 2D D3 graph**

Run:
```bash
grep -n "TransferGraph.css" src/components/*.js
```
Expected: shows which files import it. If `TransferGraphD3.js` imports it, KEEP `TransferGraph.css` (we're only removing the 3D variant, the 2D graph will be wired in M1).

- [ ] **Step 2: Check for references to `TransferGraph3D` from anywhere else**

Run:
```bash
grep -rn "TransferGraph3D" src
```
Expected: output contains only the file being deleted (self-reference) and, at most, one import line in a dead `App.js` (already deleted in Task 5). If `App.tsx` references it, stop and report — that shouldn't be the case per the investigation we've done.

- [ ] **Step 3: Delete the 3D graph file**

Run:
```bash
rm src/components/TransferGraph3D.js
```
Expected: no output.

- [ ] **Step 4: Only if `TransferGraph.css` was NOT referenced by `TransferGraphD3.js` in Step 1, also delete it**

Run (conditional — only if Step 1 showed no references from `TransferGraphD3.js`):
```bash
rm src/components/TransferGraph.css
```

- [ ] **Step 5: Type-check + build**

Run:
```bash
npm run type-check && npm run build
```
Expected: both exit 0.

- [ ] **Step 6: Commit**

Run:
```bash
git add -A
git commit -m "Remove TransferGraph3D

3D graph is not relevant to the compliance-investigation direction
documented in the 2026-04-19 design spec."
```

---

### Task 7: Delete `DemoModePanel` UI, keep `demoService`

**Context:** The demo-mode panel was marketing surface — a user-facing UI that advertised limited-API-calls demo usage and sample addresses. For the compliance direction, sample addresses remain valuable (M4 ships a "sample cases" library) but the current `DemoModePanel` UI doesn't fit the new layout. `demoService.js` is still imported by `appStore.ts` (for `useDemoStore`), so keep the service; only remove the component.

**Files:**
- Delete: `src/components/DemoModePanel.js`
- Delete: `src/components/DemoModePanel.css`
- KEEP: `src/services/demoService.js` (referenced by `appStore.ts` until M4)

- [ ] **Step 1: Confirm `demoService` is referenced only by `appStore.ts`**

Run:
```bash
grep -rn "demoService" src --include="*.ts" --include="*.tsx"
```
Expected: shows usage inside `src/stores/appStore.ts` (and nowhere else in TS/TSX). This confirms deleting the DemoModePanel does not orphan the service.

- [ ] **Step 2: Confirm `DemoModePanel` is not imported by any TS/TSX**

Run:
```bash
grep -rn "DemoModePanel" src --include="*.ts" --include="*.tsx"
```
Expected: no output. (The modernization branch's `App.tsx` inlines demo-mode UI directly rather than importing the component, so the component is already dead.)

- [ ] **Step 3: Delete the component and its CSS**

Run:
```bash
rm src/components/DemoModePanel.js src/components/DemoModePanel.css
```
Expected: no output.

- [ ] **Step 4: Type-check + build**

Run:
```bash
npm run type-check && npm run build
```
Expected: both exit 0.

- [ ] **Step 5: Commit**

Run:
```bash
git add -A
git commit -m "Remove DemoModePanel component

The inline demo-mode UI in App.tsx supersedes it. The underlying
demoService remains for sample-case loading in M4."
```

---

### Task 8: Delete `test-alchemy.html`

**Context:** Root-level `test-alchemy.html` is a 1.5KB standalone HTML file used for one-off Alchemy SDK smoke tests during early development. It has no role in the Vite build pipeline and shouldn't ship.

**Files:**
- Delete: `test-alchemy.html`

- [ ] **Step 1: Confirm file is not referenced by any config**

Run:
```bash
grep -rn "test-alchemy" . --include="*.ts" --include="*.tsx" --include="*.json" --include="*.js"
```
Expected: no output.

- [ ] **Step 2: Delete**

Run:
```bash
rm test-alchemy.html
```

- [ ] **Step 3: Commit**

Run:
```bash
git add -A
git commit -m "Remove root-level test-alchemy.html

Leftover from CRA-era ad-hoc smoke testing; replaced by Vitest
in Task 9+."
```

---

### Task 9: Vitest smoke — `isValidAddress` utility

**Files:**
- Create: `src/lib/utils.test.ts`

- [ ] **Step 1: Peek at the function we're testing so the test matches its signature**

Run:
```bash
grep -n "export function isValidAddress\|export const isValidAddress" src/lib/utils.ts
```
Expected: one line showing the export. If it's named differently (e.g., `isEthAddress`), update the test below to match.

- [ ] **Step 2: Write the failing test**

Create `src/lib/utils.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { isValidAddress } from './utils'

describe('isValidAddress', () => {
  it('accepts a checksummed address', () => {
    expect(isValidAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(true)
  })

  it('accepts an all-lowercase address', () => {
    expect(isValidAddress('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed')).toBe(true)
  })

  it('accepts an all-uppercase address', () => {
    expect(isValidAddress('0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED')).toBe(true)
  })

  it('rejects a string missing the 0x prefix', () => {
    expect(isValidAddress('5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(false)
  })

  it('rejects a too-short address', () => {
    expect(isValidAddress('0x1234')).toBe(false)
  })

  it('rejects a too-long address', () => {
    expect(isValidAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAedFF')).toBe(false)
  })

  it('rejects non-hex characters', () => {
    expect(isValidAddress('0xZZZeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidAddress('')).toBe(false)
  })
})
```

- [ ] **Step 3: Run the test — expect PASS** (the utility already exists in the merged branch)

Run:
```bash
npm test -- --run src/lib/utils.test.ts
```
Expected: 8 tests pass.

If any test fails: the utility's implementation differs from the EIP-55 / 0x-prefixed 40-hex-char expectation. Two options:
1. **Fix the test** to match the actual behavior, if the utility is intentionally lenient/strict in a specific way. Document the choice in the test's `describe` block.
2. **Fix the utility** to match the test, if the utility's behavior is wrong. Keep changes minimal and document why in the commit.

Prefer option 1 unless the utility is clearly buggy (e.g., accepts non-hex characters).

- [ ] **Step 4: Commit**

Run:
```bash
git add src/lib/utils.test.ts
git commit -m "Add isValidAddress tests

First Vitest smoke test. Covers checksummed, lowercase, and uppercase
valid addresses plus rejection cases (length, prefix, non-hex, empty)."
```

---

### Task 10: Vitest smoke — Zustand `appStore` toggle behavior

**Files:**
- Create: `src/stores/appStore.test.ts`

- [ ] **Step 1: Peek at the store's action surface**

Run:
```bash
grep -n "togglePanel\|setVisualizationMode\|setError\|clearError" src/stores/appStore.ts
```
Expected: confirms these action names. If the store exports different names, update the test below.

- [ ] **Step 2: Write the failing test**

Create `src/stores/appStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './appStore'

describe('appStore', () => {
  beforeEach(() => {
    // Reset store to initial state between tests.
    // Zustand's `useAppStore.setState` accepts a partial; we reapply
    // the initial keys we care about.
    useAppStore.setState({
      visualizationMode: 'network',
      showPatternAnalysis: false,
      showGasAnalysis: false,
      showProfitLoss: false,
      selectedPartner: null,
      error: null,
    })
  })

  it('togglePanel flips pattern visibility', () => {
    expect(useAppStore.getState().showPatternAnalysis).toBe(false)
    useAppStore.getState().togglePanel('pattern')
    expect(useAppStore.getState().showPatternAnalysis).toBe(true)
    useAppStore.getState().togglePanel('pattern')
    expect(useAppStore.getState().showPatternAnalysis).toBe(false)
  })

  it('togglePanel flips gas visibility independently', () => {
    useAppStore.getState().togglePanel('gas')
    expect(useAppStore.getState().showGasAnalysis).toBe(true)
    expect(useAppStore.getState().showPatternAnalysis).toBe(false)
  })

  it('setVisualizationMode updates mode', () => {
    useAppStore.getState().setVisualizationMode('timeline')
    expect(useAppStore.getState().visualizationMode).toBe('timeline')
  })

  it('setError / clearError work', () => {
    useAppStore.getState().setError('boom')
    expect(useAppStore.getState().error).toBe('boom')
    useAppStore.getState().clearError()
    expect(useAppStore.getState().error).toBeNull()
  })
})
```

- [ ] **Step 3: Run the tests**

Run:
```bash
npm test -- --run src/stores/appStore.test.ts
```
Expected: 4 tests pass.

If a test fails because an action name differs: update the test to match the real action name discovered in Step 1. Do NOT rename the store's actions — the store is used by `App.tsx` and that would cascade.

- [ ] **Step 4: Commit**

Run:
```bash
git add src/stores/appStore.test.ts
git commit -m "Add appStore smoke tests

Covers togglePanel for each panel, setVisualizationMode, and
setError/clearError. Verifies toggles are independent."
```

---

### Task 11: Vitest smoke — `App` renders without crashing

**Files:**
- Create: `src/App.test.tsx`

**Note:** `App.tsx` uses React Query and wagmi hooks that expect providers. `main.tsx` wraps `<App />` in the provider tree. For a render-smoke test we need the same wrapper.

- [ ] **Step 1: Peek at `main.tsx` to see the provider stack**

Run:
```bash
cat src/main.tsx
```
Expected: shows `<QueryClientProvider>` and probably `<WagmiProvider>` wrapping `<App />`. Note the exact provider imports; we'll mirror them.

- [ ] **Step 2: Write the test**

Create `src/App.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/config/wagmi'
import App from './App'

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

describe('App', () => {
  it('renders the EtherFlow header', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: /etherflow/i })).toBeInTheDocument()
  })

  it('renders the search input', () => {
    renderApp()
    expect(screen.getByPlaceholderText(/enter ethereum address/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run the test**

Run:
```bash
npm test -- --run src/App.test.tsx
```
Expected: 2 tests pass.

If a provider import path differs (e.g., `wagmiConfig` exported under a different name): inspect `src/config/wagmi.ts`, adjust the import, re-run.

If the test fails because a hook requires a mocked API call: add minimal mocks to the existing `src/test/setup.ts` or inline in the test. Specifically — `useEthPrice` may try to fetch on mount; mock `global.fetch` to return a stub response.

If the test still fails: reduce scope to just checking that render doesn't throw by using a try/catch-style assertion. A smoke test's job is "nothing is catastrophically broken" — we're not aiming for coverage in M0.

- [ ] **Step 4: Commit**

Run:
```bash
git add src/App.test.tsx
git commit -m "Add App render smoke test

Verifies the app boots under the full provider stack and the
header + search input are present."
```

---

### Task 12: Add combined `check` script

**Files:**
- Modify: `package.json` (add one `scripts` entry)

- [ ] **Step 1: Read current scripts**

Run:
```bash
grep -A 12 '"scripts"' package.json
```
Expected: the scripts block ending with `deploy-check`.

- [ ] **Step 2: Add the `check` script**

Use `Edit` to modify `package.json`. Insert the new key between `"deploy-check"` and the closing `}` of `scripts`:

Old:
```json
    "deploy-check": "node scripts/deploy-check.js"
  },
```

New:
```json
    "deploy-check": "node scripts/deploy-check.js",
    "check": "npm run lint && npm run type-check && npm test -- --run && npm run build"
  },
```

- [ ] **Step 3: Run the combined check**

Run:
```bash
npm run check
```
Expected: all four steps pass in order. Total runtime ≤ 90s on a warm cache.

If the combined run fails where individual steps passed: it's almost certainly a state leak between test files (e.g., Zustand store persisting across files). Add store reset logic to `src/test/setup.ts`'s `afterEach` and re-run.

- [ ] **Step 4: Commit**

Run:
```bash
git add package.json
git commit -m "Add 'npm run check' script

Runs lint + type-check + tests + build in one command. Intended
as the single gate for CI and pre-commit."
```

---

### Task 13: Update `README.md` for the new stack

**Files:**
- Modify: `README.md` (the "Getting Started", "Technology Stack", and "Development Status" sections)

**Rationale:** The README still says React + CRA + `npm start` + `REACT_APP_` env vars. After M0 merges, this will actively misdirect any new contributor.

- [ ] **Step 1: Read the current README's "Getting Started" section**

Run:
```bash
grep -n -A 20 "Getting Started" README.md | head -40
```
Expected: the block showing `npm start` and `REACT_APP_ALCHEMY_API_KEY`.

- [ ] **Step 2: Apply targeted edits**

Use `Edit` to change these three specific sections:

**Edit 1 — Technology Stack section:**

Old:
```
- **Frontend**: React.js with modern hooks and state management
```

New:
```
- **Frontend**: React 19 + TypeScript 5, built with Vite 6
- **State**: Zustand 5 (global) + TanStack Query 5 (server cache)
```

**Edit 2 — Getting Started step 3:**

Old:
```
3. Create a `.env` file in the root directory and add your Alchemy API key:
   ```bash
   REACT_APP_ALCHEMY_API_KEY=your-api-key-here
   ```
```

New:
```
3. Create a `.env` file in the root directory and add your Alchemy API key:
   ```bash
   VITE_ALCHEMY_API_KEY=your-api-key-here
   ```
```

**Edit 3 — Getting Started step 4:**

Old:
```
4. Start the development server
   ```bash
   npm start
   ```
```

New:
```
4. Start the development server
   ```bash
   npm run dev
   ```
```

- [ ] **Step 3: Verify commands in the README still work end-to-end**

Run:
```bash
grep -n "npm start\|REACT_APP_" README.md
```
Expected: no output (all references replaced).

- [ ] **Step 4: Commit**

Run:
```bash
git add README.md
git commit -m "Update README for Vite/TS/Zustand stack

- npm start -> npm run dev
- REACT_APP_ -> VITE_
- Technology stack lists Vite 6, React 19, TS 5, Zustand, TanStack Query"
```

---

### Task 14: Update `DEPLOYMENT.md` for Vite build output

**Files:**
- Modify: `DEPLOYMENT.md`

**Rationale:** CRA's default output is `build/`; Vite's default is `dist/`. The modernization branch's `vite.config.ts` explicitly keeps `outDir: 'build'` so Vercel config still works — but the deployment docs likely reference CRA-specific flags that no longer exist.

- [ ] **Step 1: Find references to CRA-specific tooling in the doc**

Run:
```bash
grep -nE "react-scripts|npm start|REACT_APP_|CRA|create-react-app" DEPLOYMENT.md
```
Expected: a list of lines to update.

- [ ] **Step 2: Apply targeted edits**

Using the output of Step 1 as a checklist, replace:
- `react-scripts build` → `npm run build` (or `vite build`)
- `npm start` → `npm run dev`
- `REACT_APP_ALCHEMY_API_KEY` → `VITE_ALCHEMY_API_KEY`
- Any mention of CRA → "Vite"

Use `Edit` once per replacement to keep the diff reviewable.

- [ ] **Step 3: Verify `vercel.json` still points to the right output**

Run:
```bash
cat vercel.json
```
Expected: the rewrites config shown in the investigation (SPA fallback to `/index.html`). Vite's `outDir: 'build'` + this rewrites config = works on Vercel out of the box. No edit needed.

- [ ] **Step 4: Commit**

Run:
```bash
git add DEPLOYMENT.md
git commit -m "Update DEPLOYMENT.md for Vite build"
```

---

### Task 15: Final green gate + push

**Files:**
- No changes; verification only.

- [ ] **Step 1: Clean re-install to mimic a fresh clone**

Run:
```bash
rm -rf node_modules
npm install
```
Expected: clean install ending with `added NNN packages`.

- [ ] **Step 2: Run the full check**

Run:
```bash
npm run check
```
Expected: all four sub-steps (lint, type-check, test, build) pass. No warnings treated as errors.

- [ ] **Step 3: Manual dev server smoke-test**

Run:
```bash
npm run dev
```
Open `http://localhost:3000/`. Confirm:
- Header "EtherFlow" renders
- Search input is visible and accepts text
- Typing an invalid address, clicking Search, surfaces a visible error ("Please enter a valid Ethereum address (0x...)")
- No red errors in the browser console

Stop the dev server (`Ctrl+C`).

- [ ] **Step 4: Inspect the commit log on this branch**

Run:
```bash
git log main..feature/m0-foundation --oneline
```
Expected: a readable sequence of commits, roughly:
```
Update DEPLOYMENT.md for Vite build
Update README for Vite/TS/Zustand stack
Add 'npm run check' script
Add App render smoke test
Add appStore smoke tests
Add isValidAddress tests
Remove root-level test-alchemy.html
Remove DemoModePanel component
Remove TransferGraph3D
Delete zombie JS duplicates left over from modernization
Regenerate package-lock.json for Vite/TS stack
Merge modernization branch: adopt Vite 6 + TS 5.7 + React 19 + Zustand 5 as baseline for M0 foundation
```

Plus the two inherited merge commits from the modernization branch.

If any commit message is wrong or any step was skipped, fix before pushing.

- [ ] **Step 5: Push the branch**

Run:
```bash
git push -u origin feature/m0-foundation
```
Expected: branch created on origin, tracking set up.

- [ ] **Step 6: Open a PR to main**

Run:
```bash
gh pr create --title "M0: Foundation — adopt TS+Vite+Zustand baseline" --body "$(cat <<'EOF'
## Summary
- Merges the stalled 2026 modernization branch (Vite 6, TS 5.7, React 19, Zustand 5).
- Deletes zombie JS duplicates, `TransferGraph3D`, `DemoModePanel` UI, and `test-alchemy.html`.
- Adds initial Vitest suite: `isValidAddress`, `appStore`, App render smoke.
- Adds `npm run check` (lint + type-check + test + build) as the single green gate.
- Updates README and DEPLOYMENT for the new stack.

Implements the M0 milestone from the design spec at `docs/superpowers/specs/2026-04-19-etherflow-compliance-agent-design.md`.

## Test plan
- [ ] `npm run check` passes on a fresh clone
- [ ] `npm run dev` serves on :3000, header and search input render
- [ ] Invalid address input shows the error message
- [ ] Vercel preview deploy succeeds

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Expected: PR URL printed. Hand off to the operator for review.

---

## Success Criteria for M0

Confirmed before the PR is merged:

- [ ] `npm run check` exits 0 (lint + type-check + test + build all green).
- [ ] `npm run dev` serves the app at `http://localhost:3000/` without console errors.
- [ ] The header "EtherFlow" and search input are visible.
- [ ] Invalid-address input surfaces a visible error message.
- [ ] No `.js` files remain in `src/` for which a `.tsx`/`.ts` replacement exists (zombie duplicates gone).
- [ ] `src/components/TransferGraph3D.js` and `src/components/DemoModePanel.js` are deleted.
- [ ] Vercel preview deploy succeeds.
- [ ] Three test files exist: `src/lib/utils.test.ts`, `src/stores/appStore.test.ts`, `src/App.test.tsx`.

## Explicit non-success criteria (these are M1+ work)

- Visualization components (`TransferGraphD3`, `TimelineVisualization`, `TransactionVolumeHeatmap`, `TreeMapVisualization`) are **intentionally unwired**. The App's visualization tabs show placeholder text. Do not wire them in this milestone.
- No Claude Agent SDK integration.
- No compliance features (OFAC, Chainabuse, etc.).
- No multi-chain.
- No report export.
