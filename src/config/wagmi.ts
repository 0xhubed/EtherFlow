import { createConfig, http } from 'wagmi'
import { mainnet, sepolia, polygon, arbitrum, optimism, base } from 'wagmi/chains'

// Get Alchemy API key from environment
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY || ''

// Configure chains with Alchemy RPC endpoints
export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum, optimism, base],
  transports: {
    [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`),
    [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`),
    [polygon.id]: http(`https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`),
    [arbitrum.id]: http(`https://arb-mainnet.g.alchemy.com/v2/${alchemyApiKey}`),
    [optimism.id]: http(`https://opt-mainnet.g.alchemy.com/v2/${alchemyApiKey}`),
    [base.id]: http(`https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey}`),
  },
})

// Export chain IDs for convenience
export const CHAIN_IDS = {
  MAINNET: mainnet.id,
  SEPOLIA: sepolia.id,
  POLYGON: polygon.id,
  ARBITRUM: arbitrum.id,
  OPTIMISM: optimism.id,
  BASE: base.id,
} as const

// Default chain
export const DEFAULT_CHAIN = mainnet

// Get chain by ID
export function getChainById(chainId: number) {
  return wagmiConfig.chains.find((chain) => chain.id === chainId) ?? mainnet
}
