import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ObjectPanel, type ObjectCategoryFilter, type ObjectLevelFilter, type ObjectStatusFilter } from './ObjectPanel'
import type { ModelObject } from '../../types/domain'

const objects: ModelObject[] = [
  {
    id: 'core-a',
    name: 'Concrete Core A',
    category: 'Structural',
    level: 'L01-L18',
    status: 'Reviewed',
    color: '#6ed3d1',
    visible: true,
    progress: 92,
    position: [0, 2.1, 0],
    scale: [1.15, 4.2, 1.15],
  },
  {
    id: 'facade-east',
    name: 'East Facade Panels',
    category: 'Envelope',
    level: 'L03-L16',
    status: 'Issue',
    color: '#8ba7ff',
    visible: false,
    progress: 48,
    position: [2.55, 2.2, 0],
    scale: [0.16, 3.7, 3.7],
  },
]

afterEach(cleanup)

type RenderObjectPanelOptions = {
  selectedId?: string
  visibleCount?: number
  objectSearch?: string
  categoryFilter?: ObjectCategoryFilter
  statusFilter?: ObjectStatusFilter
  levelFilter?: ObjectLevelFilter
  visibleOnly?: boolean
  onSelect?: (id: string) => void
  onToggleVisibility?: (id: string) => void
  onObjectSearch?: (query: string) => void
  onCategoryFilter?: (category: ObjectCategoryFilter) => void
  onStatusFilter?: (status: ObjectStatusFilter) => void
  onLevelFilter?: (level: ObjectLevelFilter) => void
  onVisibleOnly?: (visibleOnly: boolean) => void
  onResetFilters?: () => void
  onCreateObject?: () => void
  onSelectAndMove?: (id: string) => void
}

function renderObjectPanel(options: RenderObjectPanelOptions = {}) {
  return render(
    <ObjectPanel
      objects={objects}
      selectedId={options.selectedId ?? 'core-a'}
      visibleCount={options.visibleCount ?? 1}
      objectSearch={options.objectSearch ?? ''}
      categoryFilter={options.categoryFilter ?? 'All'}
      statusFilter={options.statusFilter ?? 'All'}
      levelFilter={options.levelFilter ?? 'All'}
      visibleOnly={options.visibleOnly ?? false}
      onSelect={options.onSelect ?? vi.fn()}
      onToggleVisibility={options.onToggleVisibility ?? vi.fn()}
      onObjectSearch={options.onObjectSearch ?? vi.fn()}
      onCategoryFilter={options.onCategoryFilter ?? vi.fn()}
      onStatusFilter={options.onStatusFilter ?? vi.fn()}
      onLevelFilter={options.onLevelFilter ?? vi.fn()}
      onVisibleOnly={options.onVisibleOnly ?? vi.fn()}
      onResetFilters={options.onResetFilters ?? vi.fn()}
      onCreateObject={options.onCreateObject ?? vi.fn()}
      onSelectAndMove={options.onSelectAndMove ?? vi.fn()}
    />,
  )
}

describe('ObjectPanel', () => {
  it('toggles object visibility without changing the selected object', () => {
    const onSelect = vi.fn()
    const onToggleVisibility = vi.fn()

    renderObjectPanel({ onSelect, onToggleVisibility })

    fireEvent.click(screen.getByRole('button', { name: /hide concrete core a/i }))

    expect(onToggleVisibility).toHaveBeenCalledWith('core-a')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('labels hidden object controls for screen readers', () => {
    renderObjectPanel()

    expect(screen.getByRole('button', { name: /show east facade panels/i })).toBeInTheDocument()
  })

  it('filters visible object rows by search, category, and status', () => {
    renderObjectPanel({ objectSearch: 'facade', categoryFilter: 'Envelope', statusFilter: 'Issue' })

    expect(screen.getByText('East Facade Panels')).toBeInTheDocument()
    expect(screen.queryByText('Concrete Core A')).not.toBeInTheDocument()
  })

  it('emits controlled filter changes', () => {
    const onObjectSearch = vi.fn()
    const onCategoryFilter = vi.fn()
    const onStatusFilter = vi.fn()
    const onLevelFilter = vi.fn()
    const onVisibleOnly = vi.fn()
    const onResetFilters = vi.fn()

    renderObjectPanel({ onObjectSearch, onCategoryFilter, onStatusFilter, onLevelFilter, onVisibleOnly, onResetFilters })

    fireEvent.change(screen.getByRole('searchbox', { name: /search objects/i }), { target: { value: 'core' } })
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Structural' } })
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'Reviewed' } })
    fireEvent.change(screen.getByLabelText(/level/i), { target: { value: 'L03-L16' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /visible only/i }))
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))

    expect(onObjectSearch).toHaveBeenCalledWith('core')
    expect(onCategoryFilter).toHaveBeenCalledWith('Structural')
    expect(onStatusFilter).toHaveBeenCalledWith('Reviewed')
    expect(onLevelFilter).toHaveBeenCalledWith('L03-L16')
    expect(onVisibleOnly).toHaveBeenCalledWith(true)
    expect(onResetFilters).toHaveBeenCalledOnce()
  })

  it('filters object rows by level and visibility', () => {
    renderObjectPanel({ levelFilter: 'L03-L16', visibleOnly: true })

    expect(screen.queryByText('East Facade Panels')).not.toBeInTheDocument()
    expect(screen.queryByText('Concrete Core A')).not.toBeInTheDocument()
  })

  it('shows an empty state when filters match no objects', () => {
    renderObjectPanel({ objectSearch: 'basement' })

    expect(screen.getByText('No objects match these filters.')).toBeInTheDocument()
  })

  it('emits create object from the panel action', () => {
    const onCreateObject = vi.fn()

    renderObjectPanel({ onCreateObject })

    fireEvent.click(screen.getByRole('button', { name: /create object/i }))

    expect(onCreateObject).toHaveBeenCalledOnce()
  })

  it('starts move mode for a specific object from its row action', () => {
    const onSelectAndMove = vi.fn()

    renderObjectPanel({ onSelectAndMove })

    fireEvent.click(screen.getByRole('button', { name: /select and move east facade panels/i }))

    expect(onSelectAndMove).toHaveBeenCalledWith('facade-east')
  })
})
