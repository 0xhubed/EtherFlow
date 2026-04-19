// Ethereum Address type - ensures 0x prefix
export type EthereumAddress = `0x${string}`

// Basic transaction interface
export interface Transaction {
  hash: string
  from: EthereumAddress
  to: EthereumAddress | null
  value: string // Wei as string for precision
  blockNumber: number
  timestamp: number
  gasUsed?: string
  gasPrice?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  nonce?: number
  input?: string
}

// Transfer partner - represents a unique address that interacted with target
export interface TransferPartner {
  address: EthereumAddress
  totalValue: string
  transactionCount: number
  direction: 'sent' | 'received' | 'both'
  firstTransaction: number
  lastTransaction: number
  transactions: Transaction[]
}

// Asset transfer from Alchemy API
export interface AssetTransfer {
  blockNum: string
  hash: string
  from: EthereumAddress
  to: EthereumAddress | null
  value: number | null
  asset: string
  category: 'external' | 'internal' | 'erc20' | 'erc721' | 'erc1155'
  rawContract: {
    value: string | null
    address: EthereumAddress | null
    decimal: string | null
  }
  metadata: {
    blockTimestamp: string
  }
}

// Transfer data structure used in visualizations
export interface TransferData {
  partners: TransferPartner[]
  totalSent: string
  totalReceived: string
  uniqueAddresses: number
  transactionCount: number
  firstActivity: number
  lastActivity: number
}

// Block range for filtering
export interface BlockRange {
  fromBlock?: number
  toBlock?: number
}

// Time range for filtering
export interface TimeRange {
  from?: Date
  to?: Date
}

// Network types
export type EthereumNetwork =
  | 'mainnet'
  | 'goerli'
  | 'sepolia'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'base'

// Gas data for analysis
export interface GasData {
  gasUsed: bigint
  gasPrice: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  effectiveGasPrice?: bigint
  transactionType: 'legacy' | 'eip1559'
}

// Utility type for address validation
export function isValidEthereumAddress(address: string): address is EthereumAddress {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Format address for display (truncated)
export function formatAddress(address: EthereumAddress, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

// Convert Wei to Ether
export function weiToEther(wei: string | bigint): number {
  const weiBigInt = typeof wei === 'string' ? BigInt(wei) : wei
  return Number(weiBigInt) / 1e18
}

// Convert Ether to Wei
export function etherToWei(ether: number): bigint {
  return BigInt(Math.floor(ether * 1e18))
}
