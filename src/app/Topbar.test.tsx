import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Topbar } from './Topbar'

afterEach(cleanup)

const permissions = {
  canImport: true,
  canEditModel: true,
  canManageIssues: true,
  canSaveView: true,
  canSync: true,
}

describe('Topbar', () => {
  it('shows project context and saved view count', () => {
    render(
      <Topbar
        projectName="Riverside Tower"
        projectSite="District 7"
        projectRole="Owner"
        permissions={permissions}
        savedViewCount={2}
        viewName="Facade review"
        actionMessage="View saved"
        shareUrl="http://127.0.0.1:5173/#view=abc"
        onViewNameChange={vi.fn()}
        onSync={vi.fn()}
        onShare={vi.fn()}
        onSaveView={vi.fn()}
      />,
    )

    expect(screen.getByText('Projects / Riverside Tower / District 7')).toBeInTheDocument()
    expect(screen.getByText('2 saved views')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /view name/i })).toHaveValue('Facade review')
    expect(screen.getByText('View saved')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /shared view link/i })).toHaveAttribute('href', 'http://127.0.0.1:5173/#view=abc')
  })

  it('emits topbar actions', () => {
    const onViewNameChange = vi.fn()
    const onSync = vi.fn()
    const onShare = vi.fn()
    const onSaveView = vi.fn()

    render(
      <Topbar
        projectName="Riverside Tower"
        projectSite="District 7"
        projectRole="Owner"
        permissions={permissions}
        savedViewCount={0}
        viewName=""
        actionMessage={null}
        shareUrl={null}
        onViewNameChange={onViewNameChange}
        onSync={onSync}
        onShare={onShare}
        onSaveView={onSaveView}
      />,
    )

    fireEvent.change(screen.getByRole('textbox', { name: /view name/i }), { target: { value: 'Morning review' } })
    fireEvent.click(screen.getByRole('button', { name: /sync/i }))
    fireEvent.click(screen.getByRole('button', { name: /share/i }))
    fireEvent.click(screen.getByRole('button', { name: /save view/i }))

    expect(onViewNameChange).toHaveBeenCalledWith('Morning review')
    expect(onSync).toHaveBeenCalledOnce()
    expect(onShare).toHaveBeenCalledOnce()
    expect(onSaveView).toHaveBeenCalledOnce()
  })

  it('disables write actions for read-only permissions', () => {
    render(
      <Topbar
        projectName="Long Bien Depot"
        projectSite="Hanoi"
        projectRole="Viewer"
        permissions={{
          canImport: false,
          canEditModel: false,
          canManageIssues: false,
          canSaveView: false,
          canSync: false,
        }}
        savedViewCount={0}
        viewName=""
        actionMessage={null}
        shareUrl={null}
        onViewNameChange={vi.fn()}
        onSync={vi.fn()}
        onShare={vi.fn()}
        onSaveView={vi.fn()}
      />,
    )

    expect(screen.getAllByText('Viewer')).toHaveLength(2)
    expect(screen.getByRole('textbox', { name: /view name/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /sync/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /save view/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /share/i })).toBeEnabled()
  })
})
