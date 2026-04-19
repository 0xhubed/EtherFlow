import { describe, it, expect } from 'vitest'
import { isValidAddress } from './utils'

describe('isValidAddress', () => {
  it('accepts a checksummed address', () => {
    expect(isValidAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(true)
  })
  it('accepts an all-lowercase address', () => {
    expect(isValidAddress('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed')).toBe(true)
  })
  it('accepts an all-uppercase address', () => {
    expect(isValidAddress('0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED')).toBe(true)
  })
  it('rejects a string missing the 0x prefix', () => {
    expect(isValidAddress('5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(false)
  })
  it('rejects a too-short address', () => {
    expect(isValidAddress('0x1234')).toBe(false)
  })
  it('rejects a too-long address', () => {
    expect(isValidAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAedFF')).toBe(false)
  })
  it('rejects non-hex characters', () => {
    expect(isValidAddress('0xZZZeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(false)
  })
  it('rejects empty string', () => {
    expect(isValidAddress('')).toBe(false)
  })
})
