import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { VersionStrip } from './VersionStrip'

const versions = ['Existing survey.ifc', 'Architecture v12.glb', 'Structure v08.ifc']

afterEach(cleanup)

describe('VersionStrip', () => {
  it('marks the active version and emits selected version changes', () => {
    const onSelectVersion = vi.fn()

    render(<VersionStrip versions={versions} activeVersion="Architecture v12.glb" onSelectVersion={onSelectVersion} />)

    expect(screen.getByRole('button', { name: /Architecture v12.glb/i })).toHaveClass('is-current')

    fireEvent.click(screen.getByRole('button', { name: /Structure v08.ifc/i }))

    expect(onSelectVersion).toHaveBeenCalledWith('Structure v08.ifc')
  })
})
