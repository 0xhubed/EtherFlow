export interface ExampleAddress {
  address: string
  label: string
  description: string
  category: 'eoa' | 'defi' | 'token' | 'exchange' | 'sanctioned' | 'hack'
}

export const EXAMPLE_ADDRESSES: ExampleAddress[] = [
  {
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    label: 'vitalik.eth',
    description: "Vitalik Buterin's public wallet — a high-activity EOA.",
    category: 'eoa',
  },
  {
    address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    label: 'Uniswap V2 Router',
    description: 'The Uniswap V2 router contract — huge tx count, many counterparties.',
    category: 'defi',
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    label: 'USDC',
    description: 'USD Coin (ERC-20) contract. Dense transfer network.',
    category: 'token',
  },
  {
    address: '0x28C6c06298d514Db089934071355E5743bf21d60',
    label: 'Binance hot wallet',
    description: 'A known Binance hot wallet. Illustrates exchange flow patterns.',
    category: 'exchange',
  },
  {
    address: '0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc',
    label: 'Tornado Cash 0.1 ETH',
    description: 'Privacy mixer pool. OFAC-sanctioned since 2022 — useful for compliance walkthroughs.',
    category: 'sanctioned',
  },
  {
    address: '0x098B716B8Aaf21512996dC57EB0615e2383E2f96',
    label: 'Ronin Bridge exploiter',
    description: 'The attacker address from the 2022 Ronin Bridge hack ($625M). A classic tracing exercise.',
    category: 'hack',
  },
]
