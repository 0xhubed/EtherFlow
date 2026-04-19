/**
 * Custom hooks for transaction data fetching with TanStack Query
 */

import { useQuery } from '@tanstack/react-query'
import {
  getAddressTransactions,
  processTransferPartners,
  getTransferData,
} from '@/services/transactionService'
import { analyzeTransactionPatterns } from '@/services/patternAnalysisService'
import type { TransferPartner, TransferData, PatternAnalysisResult } from '@/types'
import { isValidAddress } from '@/lib/utils'

interface UseTransactionsOptions {
  fromBlock?: string
  toBlock?: string
  enabled?: boolean
}

/**
 * Hook to fetch raw transactions for an address
 */
export function useTransactions(address: string | null, options: UseTransactionsOptions = {}) {
  const { fromBlock, toBlock, enabled = true } = options

  return useQuery({
    queryKey: ['transactions', address, fromBlock, toBlock],
    queryFn: async () => {
      if (!address) throw new Error('Address is required')
      return getAddressTransactions(address, { fromBlock, toBlock })
    },
    enabled: enabled && !!address && isValidAddress(address),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook to fetch and process transfer partners for an address
 */
export function useTransferPartners(
  address: string | null,
  options: UseTransactionsOptions = {}
): {
  data: TransferPartner[] | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
} {
  const { fromBlock, toBlock, enabled = true } = options

  const query = useQuery({
    queryKey: ['transferPartners', address, fromBlock, toBlock],
    queryFn: async () => {
      if (!address) throw new Error('Address is required')
      const transactions = await getAddressTransactions(address, { fromBlock, toBlock })
      return processTransferPartners(transactions)
    },
    enabled: enabled && !!address && isValidAddress(address),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch complete transfer data for an address
 */
export function useTransferData(
  address: string | null,
  options: UseTransactionsOptions = {}
): {
  data: TransferData | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
} {
  const { fromBlock, toBlock, enabled = true } = options

  const query = useQuery({
    queryKey: ['transferData', address, fromBlock, toBlock],
    queryFn: async () => {
      if (!address) throw new Error('Address is required')
      return getTransferData(address, { fromBlock, toBlock })
    },
    enabled: enabled && !!address && isValidAddress(address),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

/**
 * Hook to analyze transaction patterns
 */
export function usePatternAnalysis(
  address: string | null,
  options: UseTransactionsOptions = {}
): {
  data: PatternAnalysisResult | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
} {
  const { fromBlock, toBlock, enabled = true } = options

  const query = useQuery({
    queryKey: ['patternAnalysis', address, fromBlock, toBlock],
    queryFn: async () => {
      if (!address) throw new Error('Address is required')
      const transactions = await getAddressTransactions(address, { fromBlock, toBlock })
      return analyzeTransactionPatterns(transactions, address)
    },
    enabled: enabled && !!address && isValidAddress(address),
    staleTime: 10 * 60 * 1000, // 10 minutes (analysis is expensive)
    gcTime: 60 * 60 * 1000, // 1 hour
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}

/**
 * Hook to get current ETH price
 */
export function useEthPrice() {
  return useQuery({
    queryKey: ['ethPrice'],
    queryFn: async () => {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      )
      if (!response.ok) throw new Error('Failed to fetch ETH price')
      const data = await response.json()
      return data.ethereum.usd as number
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}
