import type { EthereumAddress, Transaction } from './ethereum'

// Pattern Analysis Types
export interface PeriodicPattern {
  interval: number // in seconds
  intervalLabel: string // human readable (e.g., "daily", "weekly")
  confidence: number // 0-1
  transactionCount: number
  averageValue: string
  addresses: EthereumAddress[]
}

export interface RoundNumberAnalysis {
  preference: number // 0-1, how often round numbers are used
  commonDenominations: {
    value: string
    count: number
    percentage: number
  }[]
}

export interface AnomalyDetection {
  id: string
  type: 'large_transfer' | 'unusual_time' | 'rapid_succession' | 'new_address' | 'pattern_break'
  severity: 'low' | 'medium' | 'high'
  description: string
  transactions: Transaction[]
  timestamp: number
}

export type WalletBehaviorCategory =
  | 'trader' // Frequent in/out transactions
  | 'holder' // Mostly receiving, rarely sending
  | 'distributor' // One-to-many pattern
  | 'collector' // Many-to-one pattern
  | 'whale' // Very large transactions
  | 'bot' // Automated, regular patterns
  | 'mixer' // Complex, obscuring patterns
  | 'unknown'

export interface WalletBehavior {
  category: WalletBehaviorCategory
  confidence: number
  traits: string[]
  metrics: {
    avgTransactionSize: string
    transactionFrequency: number // per day
    uniqueCounterparties: number
    sendReceiveRatio: number
  }
}

export interface PatternAnalysisResult {
  periodicTransfers: PeriodicPattern[]
  roundNumberAnalysis: RoundNumberAnalysis
  walletBehavior: WalletBehavior
  riskScore: number // 0-100
  anomalies: AnomalyDetection[]
  insights: string[]
}

// Gas Analysis Types
export interface GasAnalysisResult {
  totalGasSpent: string
  totalGasCostEth: string
  totalGasCostUsd: number
  averageGasPrice: string
  averageGasUsed: string
  transactions: GasTransactionDetail[]
  trends: GasTrend[]
  recommendations: GasRecommendation[]
  efficiency: GasEfficiency
}

export interface GasTransactionDetail {
  hash: string
  gasUsed: string
  gasPrice: string
  gasCostEth: string
  gasCostUsd: number
  timestamp: number
  transactionType: 'legacy' | 'eip1559'
  wasEfficient: boolean
}

export interface GasTrend {
  period: string
  averageGasPrice: string
  totalTransactions: number
  totalGasSpent: string
}

export interface GasRecommendation {
  type: 'timing' | 'batching' | 'optimization'
  title: string
  description: string
  potentialSavings: string
}

export interface GasEfficiency {
  score: number // 0-100
  comparedToNetwork: 'below' | 'average' | 'above'
  percentile: number
}

// Profit/Loss Analysis Types
export interface ProfitLossResult {
  netFlow: string // positive = profit, negative = loss
  netFlowUsd: number
  totalReceived: string
  totalReceivedUsd: number
  totalSent: string
  totalSentUsd: number
  roi: number // percentage
  bestTransaction: TransactionPnL | null
  worstTransaction: TransactionPnL | null
  timeline: PortfolioTimePoint[]
  summary: ProfitLossSummary
}

export interface TransactionPnL {
  hash: string
  type: 'received' | 'sent'
  value: string
  valueUsd: number
  timestamp: number
  counterparty: EthereumAddress
}

export interface PortfolioTimePoint {
  timestamp: number
  date: string
  cumulativeValue: string
  cumulativeValueUsd: number
  ethPrice: number
}

export interface ProfitLossSummary {
  profitableDays: number
  unprofitableDays: number
  averageDailyFlow: string
  volatility: number
  maxDrawdown: number
}

// TreeMap Types
export interface TreeMapNode {
  name: string
  value: number
  children?: TreeMapNode[]
  address?: EthereumAddress
  transactionCount?: number
  category?: string
}

export interface TreeMapData {
  name: string
  children: TreeMapNode[]
}

export type TreeMapGrouping = 'address' | 'time' | 'value' | 'direction'
