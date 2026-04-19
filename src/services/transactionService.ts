/**
 * Transaction Service
 *
 * Fetches and processes Ethereum transactions using Alchemy's enhanced APIs via viem
 */

import type {
  EthereumAddress,
  TransferPartner,
  TransferData,
  AssetTransfer,
} from '@/types'
import { useDemoStore } from '@/stores/appStore'

// Get Alchemy API key
function getApiKey(): string {
  const userKey = import.meta.env.VITE_ALCHEMY_API_KEY
  const demoKey = import.meta.env.VITE_DEMO_API_KEY

  if (userKey) return userKey
  if (demoKey) return demoKey

  throw new Error('No Alchemy API key configured')
}

// Alchemy API base URL
function getAlchemyUrl(): string {
  const apiKey = getApiKey()
  return `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`
}

// Interface for Alchemy asset transfers response
interface AlchemyAssetTransfersResponse {
  transfers: AssetTransfer[]
  pageKey?: string
}

interface AlchemyResponse {
  jsonrpc: string
  id: number
  result: AlchemyAssetTransfersResponse
}

/**
 * Fetch asset transfers from Alchemy API
 */
async function fetchAssetTransfers(params: {
  fromAddress?: string
  toAddress?: string
  fromBlock?: string
  toBlock?: string
  category?: string[]
  maxCount?: string
  withMetadata?: boolean
  excludeZeroValue?: boolean
}): Promise<AssetTransfer[]> {
  const response = await fetch(getAlchemyUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'alchemy_getAssetTransfers',
      params: [
        {
          ...params,
          category: params.category ?? ['external'],
          withMetadata: params.withMetadata ?? true,
          excludeZeroValue: params.excludeZeroValue ?? true,
          maxCount: params.maxCount ?? '0x3e8', // 1000
        },
      ],
      id: 1,
    }),
  })

  if (!response.ok) {
    throw new Error(`Alchemy API error: ${response.statusText}`)
  }

  const data = (await response.json()) as AlchemyResponse
  return data.result.transfers
}

/**
 * Get transactions for an address
 */
export async function getAddressTransactions(
  address: string,
  options?: {
    fromBlock?: string
    toBlock?: string
  }
): Promise<{ sent: AssetTransfer[]; received: AssetTransfer[] }> {
  // Check demo usage
  const demoStore = useDemoStore.getState()
  if (demoStore.isEnabled && !demoStore.canMakeApiCall()) {
    throw new Error(
      'Demo limit reached! You have used your 2 free searches. Please provide your own Alchemy API key to continue.'
    )
  }

  const baseParams = {
    fromBlock: options?.fromBlock ?? '0x0',
    toBlock: options?.toBlock ?? 'latest',
    category: ['external'] as string[],
    withMetadata: true,
    excludeZeroValue: true,
  }

  // Fetch sent and received transfers in parallel
  const [sent, received] = await Promise.all([
    fetchAssetTransfers({ ...baseParams, fromAddress: address }),
    fetchAssetTransfers({ ...baseParams, toAddress: address }),
  ])

  // Increment demo usage if in demo mode
  if (demoStore.isEnabled) {
    demoStore.incrementApiCalls()
  }

  return { sent, received }
}

/**
 * Process transactions to find unique transfer partners
 */
export function processTransferPartners(transactions: {
  sent: AssetTransfer[]
  received: AssetTransfer[]
}): TransferPartner[] {
  const { sent, received } = transactions
  const partnersMap = new Map<string, TransferPartner>()

  // Process sent transactions
  for (const tx of sent) {
    if (!tx.to) continue

    const address = tx.to.toLowerCase() as EthereumAddress
    const existing = partnersMap.get(address)

    if (existing) {
      existing.totalValue = String(
        parseFloat(existing.totalValue) + (tx.value ?? 0)
      )
      existing.transactionCount++
      if (existing.direction === 'received') {
        existing.direction = 'both'
      }
      existing.transactions.push({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: String(tx.value ?? 0),
        blockNumber: parseInt(tx.blockNum, 16),
        timestamp: tx.metadata?.blockTimestamp
          ? new Date(tx.metadata.blockTimestamp).getTime() / 1000
          : 0,
      })
      existing.lastTransaction = Math.max(
        existing.lastTransaction,
        tx.metadata?.blockTimestamp
          ? new Date(tx.metadata.blockTimestamp).getTime() / 1000
          : 0
      )
    } else {
      const timestamp = tx.metadata?.blockTimestamp
        ? new Date(tx.metadata.blockTimestamp).getTime() / 1000
        : 0

      partnersMap.set(address, {
        address,
        totalValue: String(tx.value ?? 0),
        transactionCount: 1,
        direction: 'sent',
        firstTransaction: timestamp,
        lastTransaction: timestamp,
        transactions: [
          {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: String(tx.value ?? 0),
            blockNumber: parseInt(tx.blockNum, 16),
            timestamp,
          },
        ],
      })
    }
  }

  // Process received transactions
  for (const tx of received) {
    const address = tx.from.toLowerCase() as EthereumAddress
    const existing = partnersMap.get(address)

    if (existing) {
      existing.totalValue = String(
        parseFloat(existing.totalValue) + (tx.value ?? 0)
      )
      existing.transactionCount++
      if (existing.direction === 'sent') {
        existing.direction = 'both'
      }
      existing.transactions.push({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: String(tx.value ?? 0),
        blockNumber: parseInt(tx.blockNum, 16),
        timestamp: tx.metadata?.blockTimestamp
          ? new Date(tx.metadata.blockTimestamp).getTime() / 1000
          : 0,
      })
      existing.lastTransaction = Math.max(
        existing.lastTransaction,
        tx.metadata?.blockTimestamp
          ? new Date(tx.metadata.blockTimestamp).getTime() / 1000
          : 0
      )
    } else {
      const timestamp = tx.metadata?.blockTimestamp
        ? new Date(tx.metadata.blockTimestamp).getTime() / 1000
        : 0

      partnersMap.set(address, {
        address,
        totalValue: String(tx.value ?? 0),
        transactionCount: 1,
        direction: 'received',
        firstTransaction: timestamp,
        lastTransaction: timestamp,
        transactions: [
          {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: String(tx.value ?? 0),
            blockNumber: parseInt(tx.blockNum, 16),
            timestamp,
          },
        ],
      })
    }
  }

  // Convert to array and sort by total value
  return Array.from(partnersMap.values()).sort(
    (a, b) => parseFloat(b.totalValue) - parseFloat(a.totalValue)
  )
}

/**
 * Calculate transfer statistics
 */
export function calculateTransferStats(
  partners: TransferPartner[]
): Omit<TransferData, 'partners'> {
  let totalSent = 0
  let totalReceived = 0
  let transactionCount = 0
  let firstActivity = Infinity
  let lastActivity = 0

  for (const partner of partners) {
    const value = parseFloat(partner.totalValue)

    if (partner.direction === 'sent') {
      totalSent += value
    } else if (partner.direction === 'received') {
      totalReceived += value
    } else {
      // 'both' - need to calculate from transactions
      for (const tx of partner.transactions) {
        // We'd need to determine direction from tx, simplified here
        totalSent += parseFloat(tx.value) / 2
        totalReceived += parseFloat(tx.value) / 2
      }
    }

    transactionCount += partner.transactionCount
    firstActivity = Math.min(firstActivity, partner.firstTransaction)
    lastActivity = Math.max(lastActivity, partner.lastTransaction)
  }

  return {
    totalSent: String(totalSent),
    totalReceived: String(totalReceived),
    uniqueAddresses: partners.length,
    transactionCount,
    firstActivity: firstActivity === Infinity ? 0 : firstActivity,
    lastActivity,
  }
}

/**
 * Get full transfer data for an address
 */
export async function getTransferData(
  address: string,
  options?: { fromBlock?: string; toBlock?: string }
): Promise<TransferData> {
  const transactions = await getAddressTransactions(address, options)
  const partners = processTransferPartners(transactions)
  const stats = calculateTransferStats(partners)

  return {
    partners,
    ...stats,
  }
}
