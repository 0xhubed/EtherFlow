import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'build',
      'node_modules',
      'coverage',
      '*.config.js',
      '*.config.cjs',
      '*.config.ts',
      // Dead JS visualization components pending M1 rewiring.
      // They contain JSX but have a .js extension (not .jsx/.tsx), so ESLint
      // cannot parse them without a Babel/JSX transform. Ignored until M1 converts them.
      'src/components/GasUsageAnalysis.js',
      'src/components/PatternAnalysis.js',
      'src/components/ProfitLossAnalysis.js',
      'src/components/SavedSearches.js',
      'src/components/TimelineVisualization.js',
      'src/components/TransactionVolumeHeatmap.js',
      'src/components/TransferDetails.js',
      'src/components/TransferGraphD3.js',
      'src/components/TreeMapVisualization.js',
      // Dead JS service files pending M1 rewiring.
      'src/services/alchemyService.js',
      'src/services/demoService.js',
      'src/services/gasAnalysisService.js',
      'src/services/profitLossService.js',
      'src/services/treeMapService.js',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.es2022 },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Soften no-explicit-any to warn rather than error. The TS migration
      // from the 2026 modernization branch is partial — some services still
      // use 'any' in places that will be cleaned up in M1+. Erroring on
      // every instance would block progress without signal.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['src/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2022 },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
    },
  },
)
