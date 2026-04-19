# EtherFlow Modernization Plan 2026

## Executive Summary

This document outlines a comprehensive plan to modernize EtherFlow from its current 2023-era technology stack to a 2026-representative architecture. The modernization will improve developer experience, performance, maintainability, type safety, and align with current industry best practices.

### Current State Overview

| Component | Current Version | Target Version |
|-----------|----------------|----------------|
| Build Tool | Create React App (react-scripts 5.0.1) | Vite 6.x |
| React | 18.2.0 | 19.x |
| Language | JavaScript | TypeScript 5.x |
| Styling | Tailwind CSS 3.3.3 | Tailwind CSS 4.x |
| Ethereum SDK | Alchemy SDK 3.5.7 | viem + wagmi 2.x |
| UI Components | @shadcn/ui 0.0.4 | shadcn/ui (latest, unified radix-ui) |
| State Management | React hooks + localStorage | Zustand + TanStack Query |
| Testing | Jest (via CRA) | Vitest + Playwright |
| D3.js | 7.9.0 | 7.x (current, stable) |

---

## Phase 1: Build Tool Migration (CRA to Vite)

### Why Migrate?

Create React App was [officially deprecated in February 2025](https://dev.to/solitrix02/goodbye-cra-hello-vite-a-developers-2026-survival-guide-for-migration-2a9f). Vite offers:

- **100x faster dev server startup** (Native ESM, no bundling during development)
- **Near-instant Hot Module Replacement (HMR)**
- **Smaller production bundles** (Rollup-based production builds)
- **Better plugin ecosystem** for modern tooling

### Migration Steps

#### 1.1 Install Vite and Dependencies

```bash
npm install -D vite @vitejs/plugin-react vite-plugin-svgr vite-tsconfig-paths
```

#### 1.2 Create vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    tsconfigPaths()
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'build',
    sourcemap: true
  },
  define: {
    // Handle CRA's process.env pattern
    'process.env': {}
  }
})
```

#### 1.3 Update Environment Variables

Rename all environment variables from `REACT_APP_*` to `VITE_*`:

| Current | New |
|---------|-----|
| `REACT_APP_ALCHEMY_API_KEY` | `VITE_ALCHEMY_API_KEY` |
| `REACT_APP_DEMO_API_KEY` | `VITE_DEMO_API_KEY` |

**Alternative:** Use `vite-plugin-env-compatible` to avoid mass renaming:

```bash
npm install -D vite-plugin-env-compatible
```

#### 1.4 Move index.html

Move `/public/index.html` to project root and update it:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EtherFlow - Ethereum Transaction Analyzer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>
```

#### 1.5 Update package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src --ext ts,tsx",
    "type-check": "tsc --noEmit"
  }
}
```

#### 1.6 Remove CRA Dependencies

```bash
npm uninstall react-scripts
rm -rf node_modules/.cache
```

---

## Phase 2: TypeScript Migration

### Why TypeScript?

EtherFlow is a data-intensive application with complex blockchain data structures. TypeScript provides:

- **Compile-time error detection** for blockchain data handling
- **Excellent IDE support** with autocomplete and refactoring
- **Self-documenting code** through type definitions
- **Better maintainability** for the 8,900+ lines of code

### Migration Strategy: Incremental Approach

#### 2.1 Initial Setup

```bash
npm install -D typescript @types/react @types/react-dom @types/d3 @types/node
```

#### 2.2 Create tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": "src",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["components/*"],
      "@/services/*": ["services/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

#### 2.3 Migration Order (Leaf-First Approach)

Migrate files in this order to minimize cascading type errors:

**Phase A: Type Definitions (New Files)**
```
src/types/
├── ethereum.ts      # Ethereum address, transaction types
├── analysis.ts      # Pattern analysis, gas analysis types
├── visualization.ts # D3 visualization data types
└── api.ts          # Alchemy API response types
```

**Phase B: Services (Independent)**
1. `src/services/demoService.ts`
2. `src/services/gasAnalysisService.ts`
3. `src/services/profitLossService.ts`
4. `src/services/treeMapService.ts`
5. `src/services/patternAnalysisService.ts`
6. `src/services/alchemyService.ts`

**Phase C: UI Components (Leaf → Root)**
1. `src/components/ui/*.tsx` (Button, Card, Input, InfoButton)
2. Simple visualization components
3. Analysis components (PatternAnalysis, GasUsageAnalysis, etc.)
4. Complex visualization components (TransferGraphD3, TransactionVolumeHeatmap)
5. `src/App.tsx` (last, most complex)

#### 2.4 Key Type Definitions

```typescript
// src/types/ethereum.ts
export type EthereumAddress = `0x${string}`

export interface Transaction {
  hash: string
  from: EthereumAddress
  to: EthereumAddress | null
  value: bigint
  blockNumber: number
  timestamp: number
  gasUsed: bigint
  gasPrice: bigint
}

export interface TransferPartner {
  address: EthereumAddress
  totalValue: bigint
  transactionCount: number
  direction: 'sent' | 'received' | 'both'
  firstTransaction: number
  lastTransaction: number
}

// src/types/analysis.ts
export interface PatternAnalysisResult {
  periodicTransfers: PeriodicPattern[]
  roundNumberPreference: number
  walletBehavior: WalletBehaviorCategory
  riskScore: number
  anomalies: Anomaly[]
}

export type WalletBehaviorCategory =
  | 'trader'
  | 'holder'
  | 'distributor'
  | 'collector'
  | 'whale'
  | 'unknown'
```

#### 2.5 Gradual Strictness

Start with permissive settings, then enable strict mode incrementally:

```json
// Week 1-2: Initial migration
{ "strict": false, "noImplicitAny": false }

// Week 3-4: Add basic strictness
{ "strict": false, "noImplicitAny": true }

// Week 5+: Full strict mode
{ "strict": true }
```

---

## Phase 3: React 19 Upgrade

### New Features to Leverage

React 19 brings [significant improvements](https://react.dev/blog/2024/12/05/react-19) that benefit EtherFlow:

#### 3.1 React Compiler Integration

The React Compiler automatically optimizes re-renders, eliminating the need for manual `useMemo` and `useCallback`:

```bash
npm install -D babel-plugin-react-compiler
```

```typescript
// vite.config.ts
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler']
      }
    })
  ]
})
```

**Impact:** EtherFlow's D3 visualizations with heavy data processing will automatically benefit.

#### 3.2 Actions for Form Handling

Modernize the address search input:

```tsx
// Before (React 18)
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  setLoading(true)
  try {
    const data = await fetchTransactions(address)
    setTransfers(data)
  } catch (error) {
    setError(error)
  } finally {
    setLoading(false)
  }
}

// After (React 19 with Actions)
async function searchAction(formData: FormData) {
  'use server'  // or handle client-side
  const address = formData.get('address') as string
  return await fetchTransactions(address)
}

// In component
<form action={searchAction}>
  <input name="address" />
  <button type="submit">Search</button>
</form>
```

#### 3.3 use() Hook for Async Data

```tsx
// New pattern for async data
function TransferDetails({ transferPromise }: { transferPromise: Promise<Transfer[]> }) {
  const transfers = use(transferPromise)
  return <TransferList transfers={transfers} />
}
```

#### 3.4 Improved Error Boundaries

React 19's error handling integrates better with async operations, crucial for blockchain API calls.

---

## Phase 4: Tailwind CSS 4.x Migration

### Breaking Changes

Tailwind CSS 4.0 ([released January 2025](https://tailwindcss.com/docs/upgrade-guide)) has significant changes:

#### 4.1 CSS-First Configuration

Replace `tailwind.config.js` with CSS-based configuration:

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));

  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));

  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));

  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));

  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));

  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));

  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));

  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

#### 4.2 Use Vite Plugin

```bash
npm install -D @tailwindcss/vite
```

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()]
})
```

#### 4.3 Renamed Utilities

Update class names throughout the codebase:

| v3 | v4 |
|----|-----|
| `shadow` | `shadow-sm` |
| `shadow-sm` | `shadow-xs` |
| `rounded` | `rounded-sm` |
| `rounded-sm` | `rounded-xs` |
| `outline-none` | `outline-hidden` |

#### 4.4 Run Migration Tool

```bash
npx @tailwindcss/upgrade
```

This automated tool handles most of the migration.

#### 4.5 Browser Support Note

Tailwind CSS v4 requires Safari 16.4+, Chrome 111+, Firefox 128+. Update `browserslist` accordingly:

```json
{
  "browserslist": {
    "production": [
      "Chrome >= 111",
      "Firefox >= 128",
      "Safari >= 16.4"
    ]
  }
}
```

---

## Phase 5: Web3 Stack Modernization (Alchemy SDK → viem/wagmi)

### Why Migrate?

[viem](https://viem.sh/docs/introduction) and [wagmi](https://wagmi.sh/react/guides/viem) are the modern standard for Ethereum development:

- **TypeScript-first** with complete type inference
- **Tree-shakable** (35kB vs larger SDK bundles)
- **Better performance** and optimized encoding
- **TanStack Query integration** for caching and state management
- **Multi-chain support** out of the box

### Migration Steps

#### 5.1 Install Dependencies

```bash
npm install viem wagmi @tanstack/react-query
npm uninstall alchemy-sdk
```

#### 5.2 Create Wagmi Configuration

```typescript
// src/config/wagmi.ts
import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { QueryClient } from '@tanstack/react-query'

export const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(
      `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    )
  }
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000 // 5 minutes
    }
  }
})
```

#### 5.3 Setup Providers

```tsx
// src/App.tsx
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { config, queryClient } from './config/wagmi'

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <EtherFlowApp />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

#### 5.4 Migrate alchemyService to viem

```typescript
// src/services/transactionService.ts
import { createPublicClient, http, type Address } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(`https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`)
})

export async function getAddressTransactions(
  address: Address,
  options?: { fromBlock?: bigint; toBlock?: bigint }
) {
  // Use Alchemy's enhanced API via viem
  const logs = await client.getLogs({
    address,
    fromBlock: options?.fromBlock ?? 'earliest',
    toBlock: options?.toBlock ?? 'latest'
  })

  // For comprehensive transfer history, use Alchemy's asset transfers API
  const response = await fetch(
    `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromAddress: address,
          category: ['external', 'internal'],
          withMetadata: true,
          maxCount: '0x3e8' // 1000
        }],
        id: 1
      })
    }
  )

  return response.json()
}
```

#### 5.5 Create Custom Hooks with TanStack Query

```typescript
// src/hooks/useTransactions.ts
import { useQuery } from '@tanstack/react-query'
import { type Address } from 'viem'
import { getAddressTransactions, processTransferPartners } from '@/services/transactionService'

export function useTransactions(address: Address | undefined) {
  return useQuery({
    queryKey: ['transactions', address],
    queryFn: () => getAddressTransactions(address!),
    enabled: !!address,
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  })
}

export function useTransferPartners(address: Address | undefined) {
  const { data: transactions, ...rest } = useTransactions(address)

  return {
    ...rest,
    data: transactions ? processTransferPartners(transactions) : undefined
  }
}
```

---

## Phase 6: State Management Modernization

### Current State

- React useState/useEffect for all state
- localStorage for saved searches
- No centralized state management

### Target Architecture

#### 6.1 Install Zustand

```bash
npm install zustand
```

#### 6.2 Create Application Store

```typescript
// src/stores/appStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Address } from 'viem'
import type { VisualizationMode, SavedSearch } from '@/types'

interface AppState {
  // Search state
  currentAddress: Address | null
  setCurrentAddress: (address: Address | null) => void

  // Visualization state
  visualizationMode: VisualizationMode
  setVisualizationMode: (mode: VisualizationMode) => void

  // UI state
  showPatternAnalysis: boolean
  showGasAnalysis: boolean
  showProfitLoss: boolean
  togglePanel: (panel: 'pattern' | 'gas' | 'profitLoss') => void

  // Time filters
  fromBlock: bigint | null
  toBlock: bigint | null
  setBlockRange: (from: bigint | null, to: bigint | null) => void
}

interface PersistedState {
  savedSearches: SavedSearch[]
  addSearch: (search: SavedSearch) => void
  removeSearch: (id: string) => void
  updateSearchNotes: (id: string, notes: string) => void
}

export const useAppStore = create<AppState>()((set) => ({
  currentAddress: null,
  setCurrentAddress: (address) => set({ currentAddress: address }),

  visualizationMode: 'network',
  setVisualizationMode: (mode) => set({ visualizationMode: mode }),

  showPatternAnalysis: false,
  showGasAnalysis: false,
  showProfitLoss: false,
  togglePanel: (panel) => set((state) => ({
    showPatternAnalysis: panel === 'pattern' ? !state.showPatternAnalysis : state.showPatternAnalysis,
    showGasAnalysis: panel === 'gas' ? !state.showGasAnalysis : state.showGasAnalysis,
    showProfitLoss: panel === 'profitLoss' ? !state.showProfitLoss : state.showProfitLoss
  })),

  fromBlock: null,
  toBlock: null,
  setBlockRange: (from, to) => set({ fromBlock: from, toBlock: to })
}))

export const usePersistedStore = create<PersistedState>()(
  persist(
    (set) => ({
      savedSearches: [],
      addSearch: (search) => set((state) => ({
        savedSearches: [...state.savedSearches, search]
      })),
      removeSearch: (id) => set((state) => ({
        savedSearches: state.savedSearches.filter(s => s.id !== id)
      })),
      updateSearchNotes: (id, notes) => set((state) => ({
        savedSearches: state.savedSearches.map(s =>
          s.id === id ? { ...s, notes } : s
        )
      }))
    }),
    { name: 'etherflow-storage' }
  )
)
```

---

## Phase 7: UI Component Modernization (shadcn/ui)

### Current State

Using an older `@shadcn/ui` package (0.0.4) with custom implementations.

### Upgrade Path

#### 7.1 Initialize Modern shadcn/ui

```bash
npx shadcn@latest init
```

Select options:
- Style: Default (or choose from Vega, Nova, Maia, Lyra, Mira)
- Base color: Slate
- CSS variables: Yes
- Component library: Radix UI (or Base UI for newer projects)

#### 7.2 Add Required Components

```bash
npx shadcn@latest add button card input tooltip tabs select dialog
```

#### 7.3 Migrate to Unified radix-ui Package

```bash
npx shadcn@latest migrate radix
```

This replaces individual `@radix-ui/react-*` packages with the unified `radix-ui` package.

---

## Phase 8: Testing Infrastructure

### Current State

Jest via CRA (not actively used based on codebase analysis).

### Target: Vitest + Playwright

#### 8.1 Unit/Integration Testing with Vitest

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom happy-dom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
})
```

#### 8.2 E2E Testing with Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
})
```

---

## Phase 9: Performance Optimizations

### 9.1 Code Splitting

```typescript
// Lazy load heavy visualization components
const TransferGraphD3 = lazy(() => import('@/components/TransferGraphD3'))
const TransactionVolumeHeatmap = lazy(() => import('@/components/TransactionVolumeHeatmap'))
const TreeMapVisualization = lazy(() => import('@/components/TreeMapVisualization'))

// In component
<Suspense fallback={<VisualizationSkeleton />}>
  {visualizationMode === 'network' && <TransferGraphD3 data={transfers} />}
  {visualizationMode === 'heatmap' && <TransactionVolumeHeatmap data={transfers} />}
</Suspense>
```

### 9.2 Web Workers for Heavy Computation

Move pattern analysis to a Web Worker:

```typescript
// src/workers/patternAnalysis.worker.ts
import { analyzeTransactionPatterns } from '@/services/patternAnalysisService'

self.onmessage = async (event) => {
  const { transactions } = event.data
  const result = analyzeTransactionPatterns(transactions)
  self.postMessage(result)
}
```

```typescript
// Usage
const worker = new Worker(
  new URL('@/workers/patternAnalysis.worker.ts', import.meta.url),
  { type: 'module' }
)
```

### 9.3 Virtual Scrolling for Large Lists

```bash
npm install @tanstack/react-virtual
```

---

## Implementation Timeline

### Recommended Order

| Phase | Duration | Priority | Dependencies |
|-------|----------|----------|--------------|
| Phase 1: Vite Migration | 1-2 days | Critical | None |
| Phase 2: TypeScript (Initial) | 3-5 days | Critical | Phase 1 |
| Phase 4: Tailwind v4 | 1 day | High | Phase 1 |
| Phase 7: shadcn/ui Update | 1-2 days | High | Phase 1, 4 |
| Phase 3: React 19 | 1-2 days | High | Phase 1, 2 |
| Phase 5: viem/wagmi | 3-4 days | High | Phase 2 |
| Phase 6: State Management | 2-3 days | Medium | Phase 2, 5 |
| Phase 2: TypeScript (Strict) | 2-3 days | Medium | Phase 5, 6 |
| Phase 8: Testing | 2-3 days | Medium | All above |
| Phase 9: Performance | 1-2 days | Low | All above |

**Total Estimated Effort:** 17-27 days

---

## Migration Checklist

### Pre-Migration
- [ ] Create feature branch for migration
- [ ] Ensure all current functionality works
- [ ] Document current API endpoints and data flows
- [ ] Back up `.env` configuration

### Phase 1: Vite
- [ ] Install Vite and plugins
- [ ] Create vite.config.ts
- [ ] Move index.html to root
- [ ] Update environment variables (REACT_APP_ → VITE_)
- [ ] Remove react-scripts
- [ ] Verify dev server works
- [ ] Verify production build works
- [ ] Update Vercel configuration

### Phase 2: TypeScript
- [ ] Install TypeScript and type definitions
- [ ] Create tsconfig.json
- [ ] Create type definitions in src/types/
- [ ] Migrate services (6 files)
- [ ] Migrate UI components (6 files)
- [ ] Migrate visualization components (5 files)
- [ ] Migrate App.tsx
- [ ] Enable strict mode

### Phase 3: React 19
- [ ] Update react and react-dom to v19
- [ ] Install React Compiler
- [ ] Update vite.config.ts for compiler
- [ ] Remove manual useMemo/useCallback where appropriate
- [ ] Test all components for regressions

### Phase 4: Tailwind v4
- [ ] Run upgrade tool
- [ ] Migrate tailwind.config.js to CSS @theme
- [ ] Update renamed utility classes
- [ ] Switch to Vite plugin
- [ ] Update browserslist

### Phase 5: viem/wagmi
- [ ] Install viem, wagmi, tanstack-query
- [ ] Create wagmi config
- [ ] Wrap app in providers
- [ ] Migrate alchemyService.js
- [ ] Create custom hooks
- [ ] Remove alchemy-sdk
- [ ] Test all API functionality

### Phase 6: State Management
- [ ] Install Zustand
- [ ] Create appStore
- [ ] Migrate useState to Zustand where appropriate
- [ ] Migrate localStorage to persist middleware
- [ ] Test saved searches functionality

### Phase 7: shadcn/ui
- [ ] Run shadcn init
- [ ] Add required components
- [ ] Migrate custom components
- [ ] Run radix migration

### Phase 8: Testing
- [ ] Install Vitest
- [ ] Create test setup
- [ ] Write unit tests for services
- [ ] Install Playwright
- [ ] Write E2E tests for critical flows

### Phase 9: Performance
- [ ] Add code splitting
- [ ] Implement Web Workers for heavy computation
- [ ] Add virtual scrolling if needed

### Post-Migration
- [ ] Full regression testing
- [ ] Performance benchmarking
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Production deployment

---

## New Project Structure

```
/home/user/EtherFlow/
├── index.html                    # Moved from public/
├── vite.config.ts
├── tsconfig.json
├── tailwind.css                  # Replaces tailwind.config.js
├── vitest.config.ts
├── playwright.config.ts
├── package.json
├── .env
├── .env.example
├── public/
│   └── favicon.ico
├── src/
│   ├── index.tsx                 # Entry point
│   ├── App.tsx                   # Main component
│   ├── index.css                 # Tailwind v4 with @theme
│   ├── config/
│   │   └── wagmi.ts              # Wagmi/viem config
│   ├── types/
│   │   ├── ethereum.ts
│   │   ├── analysis.ts
│   │   ├── visualization.ts
│   │   └── api.ts
│   ├── stores/
│   │   └── appStore.ts           # Zustand stores
│   ├── hooks/
│   │   ├── useTransactions.ts
│   │   ├── useTransferPartners.ts
│   │   └── usePatternAnalysis.ts
│   ├── services/
│   │   ├── transactionService.ts
│   │   ├── patternAnalysisService.ts
│   │   ├── gasAnalysisService.ts
│   │   ├── profitLossService.ts
│   │   └── treeMapService.ts
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── visualizations/
│   │   │   ├── TransferGraphD3.tsx
│   │   │   ├── TimelineVisualization.tsx
│   │   │   ├── TransactionVolumeHeatmap.tsx
│   │   │   └── TreeMapVisualization.tsx
│   │   └── analysis/
│   │       ├── PatternAnalysis.tsx
│   │       ├── GasUsageAnalysis.tsx
│   │       └── ProfitLossAnalysis.tsx
│   ├── workers/
│   │   └── patternAnalysis.worker.ts
│   └── test/
│       └── setup.ts
├── e2e/
│   └── transactions.spec.ts
└── scripts/
    └── deploy-check.js
```

---

## Risk Mitigation

### Breaking Change Risks

| Risk | Mitigation |
|------|------------|
| Tailwind v4 browser support | Update browserslist, test on target browsers |
| viem API differences | Create adapter layer during migration |
| React 19 breaking changes | Run React's codemods, thorough testing |
| TypeScript migration errors | Start with permissive config |

### Rollback Strategy

Each phase should be merged independently:
1. Complete phase
2. Full testing
3. Merge to main
4. Deploy to production
5. Monitor for issues
6. If issues: revert commit

---

## Resources

### Official Documentation
- [Vite Migration Guide](https://cathalmacdonnacha.com/migrating-from-create-react-app-cra-to-vite)
- [React 19 Release Notes](https://react.dev/blog/2024/12/05/react-19)
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [viem Documentation](https://viem.sh/docs/introduction)
- [wagmi Documentation](https://wagmi.sh/react/guides/viem)
- [TypeScript Migration Guide](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)

### Community Resources
- [2026 Vite Migration Guide](https://dev.to/solitrix02/goodbye-cra-hello-vite-a-developers-2026-survival-guide-for-migration-2a9f)
- [React 2026 Patterns](https://www.patterns.dev/react/react-2026/)
- [Migrating React JS to TypeScript](https://medium.com/@abdallah.benyouness/migrating-from-react-js-javascript-to-react-js-typescript-a-complete-guide-for-developers-1ec05bc6917d)

---

*Document created: February 2026*
*Last updated: February 2, 2026*
