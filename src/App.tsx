import { useState, useMemo } from 'react'
import { useAppStore, usePersistedStore, useDemoStore } from '@/stores/appStore'
import { useTransferData, usePatternAnalysis, useEthPrice } from '@/hooks/useTransactions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn, isValidAddress, truncateAddress, formatEth, downloadJson } from '@/lib/utils'
import { EXAMPLE_ADDRESSES } from '@/lib/example-addresses'
import type { VisualizationMode, TransferPartner } from '@/types'
import './App.css'

// Visualization mode options
const VISUALIZATION_MODES: { value: VisualizationMode; label: string }[] = [
  { value: 'network', label: 'Network Graph' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'heatmap', label: 'Heatmap' },
  { value: 'treemap', label: 'Tree Map' },
]

function App() {
  // Local state
  const [addressInput, setAddressInput] = useState('')
  const [searchAddress, setSearchAddress] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [fromBlock, setFromBlock] = useState('')
  const [toBlock, setToBlock] = useState('')

  // Global state from Zustand
  const {
    visualizationMode,
    setVisualizationMode,
    showPatternAnalysis,
    showGasAnalysis,
    showProfitLoss,
    togglePanel,
    selectedPartner,
    setSelectedPartner,
    error,
    setError,
    clearError,
  } = useAppStore()

  const { savedSearches, addSearch } = usePersistedStore()
  const demoStore = useDemoStore()

  // Data fetching with React Query
  const {
    data: transferData,
    isLoading,
    isError,
    error: fetchError,
  } = useTransferData(searchAddress, {
    fromBlock: fromBlock || undefined,
    toBlock: toBlock || undefined,
    enabled: !!searchAddress,
  })

  const { data: patternData, isLoading: patternLoading } = usePatternAnalysis(searchAddress, {
    enabled: !!searchAddress && showPatternAnalysis,
  })

  const { data: ethPrice } = useEthPrice()

  // Handle search
  const handleSearch = () => {
    clearError()

    if (!addressInput.trim()) {
      setError('Please enter an Ethereum address')
      return
    }

    if (!isValidAddress(addressInput)) {
      setError('Please enter a valid Ethereum address (0x...)')
      return
    }

    setSearchAddress(addressInput)

    // Save to history
    addSearch({
      id: Date.now().toString(),
      name: `Search ${new Date().toLocaleDateString()}`,
      address: addressInput,
      timestamp: Date.now(),
      tags: [],
      notes: '',
      visualizationMode,
    })
  }

  const handleDemoAddress = (address: string) => {
    setAddressInput(address)
    setSearchAddress(address)
    clearError()
  }

  // Sort partners by total value
  const sortedPartners = useMemo(() => {
    if (!transferData?.partners) return []
    return [...transferData.partners].sort(
      (a, b) => parseFloat(b.totalValue) - parseFloat(a.totalValue)
    )
  }, [transferData?.partners])

  // Export data
  const handleExport = () => {
    if (transferData?.partners) {
      downloadJson(transferData.partners, `etherflow-${searchAddress?.slice(0, 8)}.json`)
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">EtherFlow</h1>
          <p className="text-muted-foreground mt-2">
            Ethereum Transaction Analysis Made Simple
          </p>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto space-y-6">
          {/* Search Card */}
          <Card>
            <CardHeader>
              <CardTitle>Analyze Address</CardTitle>
              <CardDescription>
                Enter an Ethereum address to analyze its transaction history and
                relationships
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Demo Mode */}
              {demoStore.isEnabled && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Demo Mode: {demoStore.maxApiCalls - demoStore.apiCallsUsed} searches remaining
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {demoStore.exampleAddresses.map((addr) => (
                      <Button
                        key={addr.address}
                        variant="outline"
                        size="sm"
                        onClick={() => handleDemoAddress(addr.address)}
                      >
                        {addr.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {(error || isError) && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                  {error || fetchError?.message || 'An error occurred'}
                </div>
              )}

              {/* Search Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Ethereum address (0x...)"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {/* Example Addresses — try one if you're new */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Try an example:
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_ADDRESSES.map((ex) => (
                    <Tooltip key={ex.address}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDemoAddress(ex.address)}
                          className={cn(
                            ex.category === 'sanctioned' && 'border-red-400 text-red-800',
                            ex.category === 'hack' && 'border-amber-400 text-amber-800'
                          )}
                        >
                          {ex.label}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{ex.description}</p>
                        <p className="font-mono text-xs mt-1 opacity-70">{ex.address}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Filters Toggle */}
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>

                {showFilters && (
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">From Block</label>
                      <Input
                        placeholder="e.g., 15000000"
                        value={fromBlock}
                        onChange={(e) => setFromBlock(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">To Block</label>
                      <Input
                        placeholder="e.g., 18000000"
                        value={toBlock}
                        onChange={(e) => setToBlock(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Searches */}
              {savedSearches.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Recent Searches:</p>
                  <div className="flex flex-wrap gap-2">
                    {savedSearches.slice(0, 5).map((search) => (
                      <Button
                        key={search.id}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAddressInput(search.address)
                          setSearchAddress(search.address)
                        }}
                      >
                        {truncateAddress(search.address)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {searchAddress && transferData && (
            <>
              {/* Stats Overview */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{transferData.uniqueAddresses}</p>
                      <p className="text-sm text-muted-foreground">Unique Partners</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{transferData.transactionCount}</p>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {formatEth(transferData.totalSent, 2)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Sent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {formatEth(transferData.totalReceived, 2)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Received</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Visualization Tabs */}
              <Card>
                <CardHeader>
                  <CardTitle>Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={visualizationMode}
                    onValueChange={(v) => setVisualizationMode(v as VisualizationMode)}
                  >
                    <TabsList className="grid w-full grid-cols-4">
                      {VISUALIZATION_MODES.map((mode) => (
                        <TabsTrigger key={mode.value} value={mode.value}>
                          {mode.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value="network" className="min-h-[400px]">
                      <div className="flex items-center justify-center h-[400px] bg-muted rounded-lg">
                        <p className="text-muted-foreground">
                          Network Graph Visualization
                          <br />
                          <span className="text-sm">
                            (D3.js component - {sortedPartners.length} nodes)
                          </span>
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="timeline" className="min-h-[400px]">
                      <div className="flex items-center justify-center h-[400px] bg-muted rounded-lg">
                        <p className="text-muted-foreground">
                          Timeline Visualization
                          <br />
                          <span className="text-sm">
                            (Chronological transaction view)
                          </span>
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="heatmap" className="min-h-[400px]">
                      <div className="flex items-center justify-center h-[400px] bg-muted rounded-lg">
                        <p className="text-muted-foreground">
                          Transaction Heatmap
                          <br />
                          <span className="text-sm">(Time-based volume analysis)</span>
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="treemap" className="min-h-[400px]">
                      <div className="flex items-center justify-center h-[400px] bg-muted rounded-lg">
                        <p className="text-muted-foreground">
                          Tree Map Visualization
                          <br />
                          <span className="text-sm">(Hierarchical value breakdown)</span>
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Analytics Toggles */}
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={showPatternAnalysis ? 'default' : 'outline'}
                      onClick={() => togglePanel('pattern')}
                    >
                      Pattern Analysis
                    </Button>
                    <Button
                      variant={showGasAnalysis ? 'default' : 'outline'}
                      onClick={() => togglePanel('gas')}
                    >
                      Gas Analysis
                    </Button>
                    <Button
                      variant={showProfitLoss ? 'default' : 'outline'}
                      onClick={() => togglePanel('profitLoss')}
                    >
                      Profit/Loss
                    </Button>
                  </div>

                  {/* Pattern Analysis Panel */}
                  {showPatternAnalysis && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      {patternLoading ? (
                        <p>Analyzing patterns...</p>
                      ) : patternData ? (
                        <div className="space-y-4">
                          <h4 className="font-semibold">Pattern Analysis Results</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Wallet Type</p>
                              <p className="font-medium capitalize">
                                {patternData.walletBehavior.category}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Risk Score</p>
                              <p className="font-medium">{patternData.riskScore}/100</p>
                            </div>
                          </div>
                          {patternData.insights.length > 0 && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Insights</p>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {patternData.insights.map((insight, i) => (
                                  <li key={i}>{insight}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p>No pattern data available</p>
                      )}
                    </div>
                  )}

                  {/* Gas Analysis Panel */}
                  {showGasAnalysis && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Gas Usage Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        Gas analysis feature - Shows gas spending patterns and optimization
                        recommendations
                      </p>
                    </div>
                  )}

                  {/* Profit/Loss Panel */}
                  {showProfitLoss && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Profit/Loss Analysis</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Net Flow</p>
                          <p className="font-medium">
                            {formatEth(
                              String(
                                parseFloat(transferData.totalReceived) -
                                  parseFloat(transferData.totalSent)
                              ),
                              4
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Current ETH Price</p>
                          <p className="font-medium">
                            ${ethPrice?.toLocaleString() ?? 'Loading...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transfer Partners List */}
              <Card>
                <CardHeader>
                  <CardTitle>Transfer Partners ({sortedPartners.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Address</th>
                          <th className="text-right p-2">Transactions</th>
                          <th className="text-right p-2">Total Value</th>
                          <th className="text-right p-2">Direction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPartners.slice(0, 20).map((partner) => (
                          <tr
                            key={partner.address}
                            className="border-b hover:bg-muted/50 cursor-pointer"
                            onClick={() => setSelectedPartner(partner.address)}
                          >
                            <td className="p-2 font-mono text-sm">
                              <Tooltip>
                                <TooltipTrigger>
                                  {truncateAddress(partner.address, 6)}
                                </TooltipTrigger>
                                <TooltipContent>{partner.address}</TooltipContent>
                              </Tooltip>
                            </td>
                            <td className="p-2 text-right">{partner.transactionCount}</td>
                            <td className="p-2 text-right">
                              {formatEth(partner.totalValue, 4)}
                            </td>
                            <td className="p-2 text-right">
                              <span
                                className={cn(
                                  'px-2 py-1 rounded text-xs',
                                  partner.direction === 'sent' && 'bg-red-100 text-red-800',
                                  partner.direction === 'received' &&
                                    'bg-green-100 text-green-800',
                                  partner.direction === 'both' && 'bg-blue-100 text-blue-800'
                                )}
                              >
                                {partner.direction}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {sortedPartners.length > 20 && (
                      <p className="text-sm text-muted-foreground mt-2 text-center">
                        Showing 20 of {sortedPartners.length} partners
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleExport}>
                    Export JSON
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {sortedPartners.length} transfer partners found
                  </p>
                </CardFooter>
              </Card>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 py-4 text-center text-muted-foreground text-sm">
          <p>&copy; 2026 EtherFlow - Built with React 19, Vite, and viem</p>
        </footer>

        {/* Selected Partner Details Modal */}
        {selectedPartner && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedPartner(null)}
          >
            <Card className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle>Partner Details</CardTitle>
                <CardDescription className="font-mono break-all">
                  {selectedPartner}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transferData?.partners.find((p) => p.address === selectedPartner) && (
                  <PartnerDetails
                    partner={
                      transferData.partners.find((p) => p.address === selectedPartner)!
                    }
                  />
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={() => setSelectedPartner(null)}>Close</Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

// Partner Details Component
function PartnerDetails({ partner }: { partner: TransferPartner }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="font-medium">{formatEth(partner.totalValue, 4)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Transactions</p>
          <p className="font-medium">{partner.transactionCount}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Direction</p>
          <p className="font-medium capitalize">{partner.direction}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">First Activity</p>
          <p className="font-medium">
            {partner.firstTransaction
              ? new Date(partner.firstTransaction * 1000).toLocaleDateString()
              : 'N/A'}
          </p>
        </div>
      </div>

      {partner.transactions.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Recent Transactions</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {partner.transactions.slice(0, 5).map((tx, i) => (
              <div key={i} className="text-sm p-2 bg-muted rounded">
                <p className="font-mono text-xs truncate">{tx.hash}</p>
                <p>{formatEth(tx.value, 4)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
