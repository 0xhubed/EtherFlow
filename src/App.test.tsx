import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/config/wagmi'
import App from './App'

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

describe('App', () => {
  beforeEach(() => {
    // Prevent useEthPrice's fetch from throwing unhandled rejections in the
    // test environment — return a valid-shaped but inert response.
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ethereum: { usd: 3000 } }), { status: 200 })
    )
  })

  it('renders the EtherFlow header', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: /etherflow/i })).toBeInTheDocument()
  })
  it('renders the search input', () => {
    renderApp()
    expect(screen.getByPlaceholderText(/enter ethereum address/i)).toBeInTheDocument()
  })
})
