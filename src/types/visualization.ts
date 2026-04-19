import type { EthereumAddress, TransferPartner } from './ethereum'

// Visualization mode enum
export type VisualizationMode = 'network' | 'timeline' | 'heatmap' | 'treemap'

// Network Graph Types (D3)
export interface NetworkNode {
  id: string
  address: EthereumAddress
  label: string
  value: number
  transactionCount: number
  isCenter: boolean
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

export interface NetworkLink {
  source: string | NetworkNode
  target: string | NetworkNode
  value: number
  transactionCount: number
  direction: 'sent' | 'received' | 'both'
}

export interface NetworkGraphData {
  nodes: NetworkNode[]
  links: NetworkLink[]
}

// Timeline Types
export interface TimelineEvent {
  id: string
  timestamp: number
  date: Date
  type: 'sent' | 'received'
  value: string
  valueNumber: number
  counterparty: EthereumAddress
  hash: string
}

export interface TimelineBucket {
  startTime: number
  endTime: number
  label: string
  events: TimelineEvent[]
  totalValue: number
  sentValue: number
  receivedValue: number
}

export type TimelinePeriod = 'hour' | 'day' | 'week' | 'month' | 'all'

// Heatmap Types
export interface HeatmapCell {
  x: number // time bucket index
  y: number // value bucket index
  value: number
  count: number
  label: string
  transactions: string[] // transaction hashes
}

export interface HeatmapData {
  cells: HeatmapCell[]
  xLabels: string[]
  yLabels: string[]
  maxValue: number
  minValue: number
}

export type HeatmapMetric = 'volume' | 'frequency' | 'gas' | 'anomalies'
export type HeatmapTimeResolution = 'hour' | 'day' | 'week' | 'month'

// 3D Visualization Types
export interface Node3D {
  id: string
  address: EthereumAddress
  x: number
  y: number
  z: number
  value: number
  color: string
}

export interface Link3D {
  source: string
  target: string
  value: number
}

// Color scales
export interface ColorScale {
  domain: [number, number]
  range: [string, string]
  interpolate?: (t: number) => string
}

// Tooltip data
export interface TooltipData {
  visible: boolean
  x: number
  y: number
  content: {
    title: string
    items: { label: string; value: string }[]
  }
}

// Selection state
export interface SelectionState {
  selectedNode: NetworkNode | null
  selectedPartner: TransferPartner | null
  highlightedNodes: Set<string>
  hoveredNode: string | null
}

// Zoom/Pan state
export interface ViewportState {
  scale: number
  translateX: number
  translateY: number
}

// Animation state
export interface AnimationState {
  isAnimating: boolean
  duration: number
  easing: 'linear' | 'easeInOut' | 'easeOut' | 'easeIn'
}

// Chart dimensions
export interface ChartDimensions {
  width: number
  height: number
  margin: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

// Legend item
export interface LegendItem {
  label: string
  color: string
  value?: number
}
