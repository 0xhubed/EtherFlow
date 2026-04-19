// Re-export all types from a single entry point
export * from './ethereum'
export * from './analysis'
export * from './visualization'

// App-level types
export interface SavedSearch {
  id: string
  name: string
  address: string
  timestamp: number
  tags: string[]
  notes: string
  filters?: SearchFilters
  visualizationMode?: import('./visualization').VisualizationMode
}

export interface SearchFilters {
  fromBlock?: number
  toBlock?: number
  fromDate?: string
  toDate?: string
  minValue?: string
  maxValue?: string
  direction?: 'all' | 'sent' | 'received'
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  defaultVisualization: import('./visualization').VisualizationMode
  maxNodes: number
  animationsEnabled: boolean
  autoRefresh: boolean
  refreshInterval: number // in seconds
}

export interface DemoState {
  isEnabled: boolean
  apiCallsUsed: number
  maxApiCalls: number
  exampleAddresses: {
    name: string
    address: string
    description: string
  }[]
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  data: T | null
  status: LoadingState
  error: string | null
}

// Event handlers
export type AddressSelectHandler = (address: string) => void
export type VisualizationModeChangeHandler = (mode: import('./visualization').VisualizationMode) => void
export type FilterChangeHandler = (filters: SearchFilters) => void

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
