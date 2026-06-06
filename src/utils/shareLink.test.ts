import { describe, expect, it } from 'vitest'
import type { SharedViewState } from '../types/domain'
import { createShareHash, createShareUrl, parseShareHash } from './shareLink'

const sharedView: SharedViewState = {
  projectId: 'p1',
  selectedId: 'facade-east',
  activeTool: 'Fit',
  activeVersion: 'Architecture v12.glb',
  cameraView: {
    position: [8.8, 6.4, 8.6],
    target: [0, 0, 0],
    zoom: 1,
  },
  hiddenObjectIds: ['slab-08'],
}

describe('shareLink', () => {
  it('roundtrips a shared view through the hash', () => {
    const hash = createShareHash(sharedView)

    expect(hash).toMatch(/^#view=/)
    expect(parseShareHash(hash)).toEqual(sharedView)
  })

  it('creates a share url without changing the path or query', () => {
    const url = createShareUrl(sharedView, 'http://127.0.0.1:5173/?debug=true#old')

    expect(url).toContain('http://127.0.0.1:5173/?debug=true#view=')
    expect(parseShareHash(new URL(url).hash)).toEqual(sharedView)
  })

  it('ignores missing or invalid hashes', () => {
    expect(parseShareHash('')).toBeNull()
    expect(parseShareHash('#other=abc')).toBeNull()
    expect(parseShareHash('#view=not-valid')).toBeNull()
  })
})
