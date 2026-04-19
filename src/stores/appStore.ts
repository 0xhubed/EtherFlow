import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { VisualizationMode, SavedSearch, SearchFilters, DemoState } from '@/types'

// Main app state (non-persisted)
interface AppState {
  // Search state
  currentAddress: string | null
  setCurrentAddress: (address: string | null) => void

  // Visualization state
  visualizationMode: VisualizationMode
  setVisualizationMode: (mode: VisualizationMode) => void

  // UI panel state
  showPatternAnalysis: boolean
  showGasAnalysis: boolean
  showProfitLoss: boolean
  showSavedSearches: boolean
  togglePanel: (panel: 'pattern' | 'gas' | 'profitLoss' | 'savedSearches') => void
  closeAllPanels: () => void

  // Filters
  filters: SearchFilters
  setFilters: (filters: SearchFilters) => void
  clearFilters: () => void

  // Loading states
  isSearching: boolean
  setIsSearching: (loading: boolean) => void

  // Error state
  error: string | null
  setError: (error: string | null) => void
  clearError: () => void

  // Selected partner for details view
  selectedPartner: string | null
  setSelectedPartner: (address: string | null) => void
}

export const useAppStore = create<AppState>()((set) => ({
  // Search state
  currentAddress: null,
  setCurrentAddress: (address) => set({ currentAddress: address, error: null }),

  // Visualization state
  visualizationMode: 'network',
  setVisualizationMode: (mode) => set({ visualizationMode: mode }),

  // UI panel state
  showPatternAnalysis: false,
  showGasAnalysis: false,
  showProfitLoss: false,
  showSavedSearches: false,
  togglePanel: (panel) =>
    set((state) => ({
      showPatternAnalysis: panel === 'pattern' ? !state.showPatternAnalysis : state.showPatternAnalysis,
      showGasAnalysis: panel === 'gas' ? !state.showGasAnalysis : state.showGasAnalysis,
      showProfitLoss: panel === 'profitLoss' ? !state.showProfitLoss : state.showProfitLoss,
      showSavedSearches: panel === 'savedSearches' ? !state.showSavedSearches : state.showSavedSearches,
    })),
  closeAllPanels: () =>
    set({
      showPatternAnalysis: false,
      showGasAnalysis: false,
      showProfitLoss: false,
      showSavedSearches: false,
    }),

  // Filters
  filters: {},
  setFilters: (filters) => set({ filters }),
  clearFilters: () => set({ filters: {} }),

  // Loading states
  isSearching: false,
  setIsSearching: (loading) => set({ isSearching: loading }),

  // Error state
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Selected partner
  selectedPartner: null,
  setSelectedPartner: (address) => set({ selectedPartner: address }),
}))

// Persisted state (saved to localStorage)
interface PersistedState {
  savedSearches: SavedSearch[]
  addSearch: (search: SavedSearch) => void
  removeSearch: (id: string) => void
  updateSearch: (id: string, updates: Partial<SavedSearch>) => void
  updateSearchNotes: (id: string, notes: string) => void
  addSearchTag: (id: string, tag: string) => void
  removeSearchTag: (id: string, tag: string) => void
  getAllTags: () => string[]
}

export const usePersistedStore = create<PersistedState>()(
  persist(
    (set, get) => ({
      savedSearches: [],

      addSearch: (search) =>
        set((state) => ({
          savedSearches: [search, ...state.savedSearches],
        })),

      removeSearch: (id) =>
        set((state) => ({
          savedSearches: state.savedSearches.filter((s) => s.id !== id),
        })),

      updateSearch: (id, updates) =>
        set((state) => ({
          savedSearches: state.savedSearches.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),

      updateSearchNotes: (id, notes) =>
        set((state) => ({
          savedSearches: state.savedSearches.map((s) => (s.id === id ? { ...s, notes } : s)),
        })),

      addSearchTag: (id, tag) =>
        set((state) => ({
          savedSearches: state.savedSearches.map((s) =>
            s.id === id && !s.tags.includes(tag) ? { ...s, tags: [...s.tags, tag] } : s
          ),
        })),

      removeSearchTag: (id, tag) =>
        set((state) => ({
          savedSearches: state.savedSearches.map((s) =>
            s.id === id ? { ...s, tags: s.tags.filter((t) => t !== tag) } : s
          ),
        })),

      getAllTags: () => {
        const tags = new Set<string>()
        get().savedSearches.forEach((search) => {
          search.tags.forEach((tag) => tags.add(tag))
        })
        return Array.from(tags).sort()
      },
    }),
    {
      name: 'etherflow-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ savedSearches: state.savedSearches }),
    }
  )
)

// Demo state (session storage)
interface DemoStoreState extends DemoState {
  incrementApiCalls: () => void
  resetApiCalls: () => void
  canMakeApiCall: () => boolean
  setDemoEnabled: (enabled: boolean) => void
}

const DEMO_ADDRESSES = [
  {
    name: 'Vitalik Buterin',
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    description: 'Ethereum co-founder',
  },
  {
    name: 'Binance Hot Wallet',
    address: '0x28C6c06298d514Db089934071355E5743bf21d60',
    description: 'Major exchange wallet',
  },
  {
    name: 'Uniswap V3 Router',
    address: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    description: 'DEX router contract',
  },
]

export const useDemoStore = create<DemoStoreState>()(
  persist(
    (set, get) => ({
      isEnabled: false,
      apiCallsUsed: 0,
      maxApiCalls: 2,
      exampleAddresses: DEMO_ADDRESSES,

      incrementApiCalls: () =>
        set((state) => ({
          apiCallsUsed: state.apiCallsUsed + 1,
        })),

      resetApiCalls: () => set({ apiCallsUsed: 0 }),

      canMakeApiCall: () => {
        const state = get()
        return !state.isEnabled || state.apiCallsUsed < state.maxApiCalls
      },

      setDemoEnabled: (enabled) => set({ isEnabled: enabled }),
    }),
    {
      name: 'etherflow-demo',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
