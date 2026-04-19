/**
 * Pattern Analysis Service
 * Identifies common transaction patterns and behaviors in blockchain transaction data
 */

import type {
  PatternAnalysisResult,
  PeriodicPattern,
  RoundNumberAnalysis,
  WalletBehavior,
  WalletBehaviorCategory,
  AnomalyDetection,
  AssetTransfer,
} from '@/types'

interface PatternDetectionResult {
  type: string
  isDetected: boolean
  confidence: number
  details: Record<string, unknown>
  description: string
  importance: 'low' | 'medium' | 'high'
}

interface TransactionWithMeta extends AssetTransfer {
  direction?: 'sent' | 'received'
  counterparty?: string
}

/**
 * Analyzes transactions to identify common patterns
 */
export function analyzeTransactionPatterns(
  transactions: { sent: AssetTransfer[]; received: AssetTransfer[] } | AssetTransfer[],
  centralAddress: string
): PatternAnalysisResult {
  // Create a consolidated list of all transactions
  const allTransactions: TransactionWithMeta[] = []

  if ('sent' in transactions && 'received' in transactions) {
    transactions.sent.forEach((tx) =>
      allTransactions.push({
        ...tx,
        direction: 'sent',
        counterparty: tx.to ?? undefined,
      })
    )
    transactions.received.forEach((tx) =>
      allTransactions.push({
        ...tx,
        direction: 'received',
        counterparty: tx.from,
      })
    )
  } else if (Array.isArray(transactions)) {
    allTransactions.push(...transactions)
  }

  if (allTransactions.length === 0) {
    return {
      periodicTransfers: [],
      roundNumberAnalysis: { preference: 0, commonDenominations: [] },
      walletBehavior: {
        category: 'unknown',
        confidence: 0,
        traits: [],
        metrics: {
          avgTransactionSize: '0',
          transactionFrequency: 0,
          uniqueCounterparties: 0,
          sendReceiveRatio: 0,
        },
      },
      riskScore: 0,
      anomalies: [],
      insights: [],
    }
  }

  // Sort transactions by timestamp
  const sortedTransactions = [...allTransactions].sort((a, b) => {
    const dateA = a.metadata?.blockTimestamp ? new Date(a.metadata.blockTimestamp).getTime() : 0
    const dateB = b.metadata?.blockTimestamp ? new Date(b.metadata.blockTimestamp).getTime() : 0
    return dateA - dateB
  })

  // Detect patterns
  const patterns: PatternDetectionResult[] = []

  const periodicPattern = detectPeriodicTransfers(sortedTransactions)
  if (periodicPattern.isDetected) patterns.push(periodicPattern)

  const roundNumberPattern = detectRoundNumberTransfers(sortedTransactions)
  if (roundNumberPattern.isDetected) patterns.push(roundNumberPattern)

  const distribPatterns = detectDistributionPatterns(sortedTransactions, centralAddress)
  patterns.push(...distribPatterns)

  const whalePattern = detectWhaleTransfers(sortedTransactions)
  if (whalePattern.isDetected) patterns.push(whalePattern)

  const burstPattern = detectBurstActivity(sortedTransactions)
  if (burstPattern.isDetected) patterns.push(burstPattern)

  // Convert to result format
  const periodicTransfers: PeriodicPattern[] = patterns
    .filter((p) => p.type === 'periodic_transfers')
    .map((p) => ({
      interval: (p.details.averageInterval as number) * 3600,
      intervalLabel: p.details.period as string,
      confidence: p.confidence / 100,
      transactionCount: p.details.transactionsAnalyzed as number,
      averageValue: '0',
      addresses: [],
    }))

  const roundNumberAnalysis: RoundNumberAnalysis = {
    preference: roundNumberPattern.confidence / 100,
    commonDenominations: ((roundNumberPattern.details.examples as string[]) || []).map((val) => ({
      value: val,
      count: 1,
      percentage: roundNumberPattern.confidence,
    })),
  }

  const walletBehavior = categorizeWalletBehavior(patterns)
  const riskResult = calculateRiskScore(patterns)

  const anomalies: AnomalyDetection[] = patterns
    .filter((p) => p.type === 'whale_transfers' || p.type === 'burst_activity')
    .map((p, i) => ({
      id: `anomaly-${i}`,
      type: p.type === 'whale_transfers' ? ('large_transfer' as const) : ('rapid_succession' as const),
      severity: p.importance === 'high' ? ('high' as const) : ('medium' as const),
      description: p.description,
      transactions: [],
      timestamp: Date.now() / 1000,
    }))

  const insights = patterns.map((p) => p.description)

  return {
    periodicTransfers,
    roundNumberAnalysis,
    walletBehavior,
    riskScore: riskResult.score,
    anomalies,
    insights,
  }
}

/**
 * Detect transactions that occur at regular intervals
 */
function detectPeriodicTransfers(transactions: TransactionWithMeta[]): PatternDetectionResult {
  const txsWithTime = transactions.filter((tx) => tx.metadata?.blockTimestamp)
  if (txsWithTime.length < 5) {
    return { type: 'periodic_transfers', isDetected: false, confidence: 0, details: {}, description: '', importance: 'medium' }
  }

  const intervals: number[] = []
  for (let i = 1; i < txsWithTime.length; i++) {
    const prevDate = new Date(txsWithTime[i - 1].metadata!.blockTimestamp)
    const currDate = new Date(txsWithTime[i].metadata!.blockTimestamp)
    const diffHours = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60)
    intervals.push(diffHours)
  }

  const sum = intervals.reduce((acc, val) => acc + val, 0)
  const mean = sum / intervals.length
  const variance = intervals.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / intervals.length
  const stdDev = Math.sqrt(variance)
  const cv = stdDev / mean

  const isRegular = cv < 0.5 && intervals.length >= 4

  let period = ''
  if (isRegular) {
    if (mean >= 22 && mean <= 26) period = 'daily'
    else if (mean >= 150 && mean <= 190) period = 'weekly'
    else if (mean >= 650 && mean <= 750) period = 'monthly'
    else period = `every ${Math.round(mean)} hours`
  }

  return {
    type: 'periodic_transfers',
    isDetected: isRegular,
    confidence: isRegular ? Math.max(0, Math.min(100, Math.round(100 * (1 - cv)))) : 0,
    details: {
      period,
      averageInterval: Math.round(mean),
      intervalUnit: 'hours',
      regularityScore: Math.round(100 * (1 - cv)),
      transactionsAnalyzed: intervals.length + 1,
    },
    description: isRegular
      ? `Regular transfers occurring approximately ${period}`
      : 'No periodic transfer pattern detected',
    importance: 'medium',
  }
}

/**
 * Detect round number transfers
 */
function detectRoundNumberTransfers(transactions: TransactionWithMeta[]): PatternDetectionResult {
  const txsWithValue = transactions.filter((tx) => tx.value)
  if (txsWithValue.length < 3) {
    return { type: 'round_number_transfers', isDetected: false, confidence: 0, details: {}, description: '', importance: 'low' }
  }

  const values = txsWithValue.map((tx) => tx.value ?? 0)
  const roundNumbers = values.filter((val) => {
    const decimalPlaces = val.toString().split('.')[1]?.length || 0
    return decimalPlaces <= 1 && (val % 0.5 === 0 || val % 0.1 === 0)
  })

  const roundPercentage = (roundNumbers.length / values.length) * 100
  const isRoundPattern = roundPercentage > 60 && roundNumbers.length >= 3

  return {
    type: 'round_number_transfers',
    isDetected: isRoundPattern,
    confidence: Math.round(roundPercentage),
    details: {
      roundNumberCount: roundNumbers.length,
      totalTransactions: values.length,
      percentage: Math.round(roundPercentage),
      examples: roundNumbers.slice(0, 3).map((val) => val.toString()),
    },
    description: isRoundPattern
      ? `${Math.round(roundPercentage)}% of transactions use round numbers`
      : 'No round number pattern detected',
    importance: 'low',
  }
}

/**
 * Detect distribution patterns
 */
function detectDistributionPatterns(
  transactions: TransactionWithMeta[],
  centralAddress: string
): PatternDetectionResult[] {
  const patterns: PatternDetectionResult[] = []

  // One-to-many pattern
  const receivingAddresses = new Set<string>()
  const sentTransactions = transactions.filter(
    (tx) => (tx.from === centralAddress || tx.direction === 'sent') && tx.to !== centralAddress
  )
  sentTransactions.forEach((tx) => {
    const recipient = tx.to || tx.counterparty
    if (recipient) receivingAddresses.add(recipient)
  })

  if (sentTransactions.length >= 5 && receivingAddresses.size >= 5) {
    patterns.push({
      type: 'distributor_pattern',
      isDetected: true,
      confidence: Math.min(90, Math.round((receivingAddresses.size / sentTransactions.length) * 100)),
      details: {
        uniqueRecipients: receivingAddresses.size,
        totalSentTransactions: sentTransactions.length,
      },
      description: `Distributed funds to ${receivingAddresses.size} different addresses`,
      importance: receivingAddresses.size > 20 ? 'high' : 'medium',
    })
  }

  // Many-to-one pattern
  const sendingAddresses = new Set<string>()
  const receivedTransactions = transactions.filter(
    (tx) => (tx.to === centralAddress || tx.direction === 'received') && tx.from !== centralAddress
  )
  receivedTransactions.forEach((tx) => {
    const sender = tx.from || tx.counterparty
    if (sender) sendingAddresses.add(sender)
  })

  if (receivedTransactions.length >= 5 && sendingAddresses.size >= 5) {
    patterns.push({
      type: 'collector_pattern',
      isDetected: true,
      confidence: Math.min(90, Math.round((sendingAddresses.size / receivedTransactions.length) * 100)),
      details: {
        uniqueSenders: sendingAddresses.size,
        totalReceivedTransactions: receivedTransactions.length,
      },
      description: `Received funds from ${sendingAddresses.size} different addresses`,
      importance: sendingAddresses.size > 20 ? 'high' : 'medium',
    })
  }

  return patterns
}

/**
 * Detect whale transfers
 */
function detectWhaleTransfers(transactions: TransactionWithMeta[]): PatternDetectionResult {
  const txsWithValue = transactions.filter((tx) => tx.value)
  if (txsWithValue.length < 5) {
    return { type: 'whale_transfers', isDetected: false, confidence: 0, details: {}, description: '', importance: 'high' }
  }

  const values = txsWithValue.map((tx) => tx.value ?? 0)
  const sum = values.reduce((acc, val) => acc + val, 0)
  const mean = sum / values.length
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  const threshold = mean + 3 * stdDev
  const whaleTransactions = txsWithValue.filter((tx) => (tx.value ?? 0) > threshold)

  return {
    type: 'whale_transfers',
    isDetected: whaleTransactions.length > 0,
    confidence: whaleTransactions.length > 0 ? 85 : 0,
    details: {
      whaleTransactionCount: whaleTransactions.length,
      totalTransactions: txsWithValue.length,
      typicalTransactionValue: mean.toFixed(4),
      whaleThreshold: threshold.toFixed(4),
    },
    description:
      whaleTransactions.length > 0
        ? `Found ${whaleTransactions.length} abnormally large transactions`
        : 'No abnormally large transactions detected',
    importance: 'high',
  }
}

/**
 * Detect burst activity
 */
function detectBurstActivity(transactions: TransactionWithMeta[]): PatternDetectionResult {
  const txsWithTime = transactions.filter((tx) => tx.metadata?.blockTimestamp)
  if (txsWithTime.length < 5) {
    return { type: 'burst_activity', isDetected: false, confidence: 0, details: {}, description: '', importance: 'medium' }
  }

  const sortedTxs = [...txsWithTime].sort(
    (a, b) =>
      new Date(a.metadata!.blockTimestamp).getTime() - new Date(b.metadata!.blockTimestamp).getTime()
  )

  const totalDuration =
    new Date(sortedTxs[sortedTxs.length - 1].metadata!.blockTimestamp).getTime() -
    new Date(sortedTxs[0].metadata!.blockTimestamp).getTime()
  const avgGapExpected = totalDuration / (sortedTxs.length - 1)

  const burstPeriods: { startTime: Date; endTime: Date; transactions: number }[] = []
  let currentBurst = [sortedTxs[0]]

  for (let i = 1; i < sortedTxs.length; i++) {
    const prevDate = new Date(sortedTxs[i - 1].metadata!.blockTimestamp)
    const currDate = new Date(sortedTxs[i].metadata!.blockTimestamp)
    const gap = currDate.getTime() - prevDate.getTime()

    if (gap < avgGapExpected * 0.3) {
      currentBurst.push(sortedTxs[i])
    } else {
      if (currentBurst.length >= 3) {
        burstPeriods.push({
          startTime: new Date(currentBurst[0].metadata!.blockTimestamp),
          endTime: new Date(currentBurst[currentBurst.length - 1].metadata!.blockTimestamp),
          transactions: currentBurst.length,
        })
      }
      currentBurst = [sortedTxs[i]]
    }
  }

  if (currentBurst.length >= 3) {
    burstPeriods.push({
      startTime: new Date(currentBurst[0].metadata!.blockTimestamp),
      endTime: new Date(currentBurst[currentBurst.length - 1].metadata!.blockTimestamp),
      transactions: currentBurst.length,
    })
  }

  return {
    type: 'burst_activity',
    isDetected: burstPeriods.length > 0,
    confidence: burstPeriods.length > 0 ? 75 : 0,
    details: {
      burstPeriods: burstPeriods.length,
      largestBurst: burstPeriods.length > 0 ? Math.max(...burstPeriods.map((b) => b.transactions)) : 0,
    },
    description:
      burstPeriods.length > 0
        ? `${burstPeriods.length} periods of burst activity detected`
        : 'No burst activity patterns detected',
    importance: 'medium',
  }
}

/**
 * Categorize wallet behavior
 */
function categorizeWalletBehavior(patterns: PatternDetectionResult[]): WalletBehavior {
  const patternTypes = patterns.map((p) => p.type)
  const behaviors: string[] = []
  let category: WalletBehaviorCategory = 'unknown'
  let confidence = 50

  if (patternTypes.includes('burst_activity') || patternTypes.includes('whale_transfers')) {
    behaviors.push('Trader')
    confidence += 15
  }

  if (patternTypes.includes('distributor_pattern')) {
    behaviors.push('Distributor')
    confidence += 15
  }

  if (patternTypes.includes('collector_pattern')) {
    behaviors.push('Collector')
    confidence += 15
  }

  if (patternTypes.includes('periodic_transfers')) {
    behaviors.push('Regular')
    confidence += 10
  }

  // Determine category
  if (behaviors.includes('Trader')) {
    category = 'trader'
  } else if (behaviors.includes('Distributor')) {
    category = 'distributor'
  } else if (behaviors.includes('Collector')) {
    category = 'collector'
  }

  return {
    category,
    confidence: Math.min(95, confidence) / 100,
    traits: behaviors,
    metrics: {
      avgTransactionSize: '0',
      transactionFrequency: 0,
      uniqueCounterparties: 0,
      sendReceiveRatio: 0,
    },
  }
}

/**
 * Calculate risk score
 */
function calculateRiskScore(patterns: PatternDetectionResult[]): { score: number; level: string; factors: string[] } {
  let baseScore = 50
  const factors: string[] = []

  patterns.forEach((pattern) => {
    switch (pattern.type) {
      case 'whale_transfers':
        baseScore += 15
        factors.push('Unusually large transactions detected')
        break
      case 'burst_activity':
        baseScore += 10
        factors.push('Burst transaction pattern detected')
        break
      case 'periodic_transfers':
        baseScore -= 15
        factors.push('Regular periodic transactions suggest legitimate activity')
        break
    }
  })

  const finalScore = Math.max(0, Math.min(100, baseScore))
  let level = 'Low'
  if (finalScore >= 80) level = 'High'
  else if (finalScore >= 60) level = 'Medium'

  return { score: finalScore, level, factors }
}

export { categorizeWalletBehavior, calculateRiskScore }
