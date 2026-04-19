import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './appStore'

describe('appStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      visualizationMode: 'network',
      showPatternAnalysis: false,
      showGasAnalysis: false,
      showProfitLoss: false,
      selectedPartner: null,
      error: null,
    })
  })

  it('togglePanel flips pattern visibility', () => {
    expect(useAppStore.getState().showPatternAnalysis).toBe(false)
    useAppStore.getState().togglePanel('pattern')
    expect(useAppStore.getState().showPatternAnalysis).toBe(true)
    useAppStore.getState().togglePanel('pattern')
    expect(useAppStore.getState().showPatternAnalysis).toBe(false)
  })

  it('togglePanel flips gas visibility independently', () => {
    useAppStore.getState().togglePanel('gas')
    expect(useAppStore.getState().showGasAnalysis).toBe(true)
    expect(useAppStore.getState().showPatternAnalysis).toBe(false)
  })

  it('setVisualizationMode updates mode', () => {
    useAppStore.getState().setVisualizationMode('timeline')
    expect(useAppStore.getState().visualizationMode).toBe('timeline')
  })

  it('setError / clearError work', () => {
    useAppStore.getState().setError('boom')
    expect(useAppStore.getState().error).toBe('boom')
    useAppStore.getState().clearError()
    expect(useAppStore.getState().error).toBeNull()
  })
})
