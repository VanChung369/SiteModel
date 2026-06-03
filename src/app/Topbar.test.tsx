import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Topbar } from './Topbar'

afterEach(cleanup)

describe('Topbar', () => {
  it('shows project context and saved view count', () => {
    render(
      <Topbar
        projectName="Riverside Tower"
        projectSite="District 7"
        savedViewCount={2}
        actionMessage="View saved"
        onSync={vi.fn()}
        onShare={vi.fn()}
        onSaveView={vi.fn()}
      />,
    )

    expect(screen.getByText('Projects / Riverside Tower / District 7')).toBeInTheDocument()
    expect(screen.getByText('2 saved views')).toBeInTheDocument()
    expect(screen.getByText('View saved')).toBeInTheDocument()
  })

  it('emits topbar actions', () => {
    const onSync = vi.fn()
    const onShare = vi.fn()
    const onSaveView = vi.fn()

    render(
      <Topbar
        projectName="Riverside Tower"
        projectSite="District 7"
        savedViewCount={0}
        actionMessage={null}
        onSync={onSync}
        onShare={onShare}
        onSaveView={onSaveView}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /sync/i }))
    fireEvent.click(screen.getByRole('button', { name: /share/i }))
    fireEvent.click(screen.getByRole('button', { name: /save view/i }))

    expect(onSync).toHaveBeenCalledOnce()
    expect(onShare).toHaveBeenCalledOnce()
    expect(onSaveView).toHaveBeenCalledOnce()
  })
})
