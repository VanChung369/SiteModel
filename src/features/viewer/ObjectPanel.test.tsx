import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ObjectPanel } from './ObjectPanel'
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

describe('ObjectPanel', () => {
  it('toggles object visibility without changing the selected object', () => {
    const onSelect = vi.fn()
    const onToggleVisibility = vi.fn()

    render(
      <ObjectPanel
        objects={objects}
        selectedId="core-a"
        visibleCount={1}
        objectSearch=""
        categoryFilter="All"
        statusFilter="All"
        onSelect={onSelect}
        onToggleVisibility={onToggleVisibility}
        onObjectSearch={vi.fn()}
        onCategoryFilter={vi.fn()}
        onStatusFilter={vi.fn()}
        onCreateObject={vi.fn()}
        onSelectAndMove={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /hide concrete core a/i }))

    expect(onToggleVisibility).toHaveBeenCalledWith('core-a')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('labels hidden object controls for screen readers', () => {
    render(
      <ObjectPanel
        objects={objects}
        selectedId="core-a"
        visibleCount={1}
        objectSearch=""
        categoryFilter="All"
        statusFilter="All"
        onSelect={vi.fn()}
        onToggleVisibility={vi.fn()}
        onObjectSearch={vi.fn()}
        onCategoryFilter={vi.fn()}
        onStatusFilter={vi.fn()}
        onCreateObject={vi.fn()}
        onSelectAndMove={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /show east facade panels/i })).toBeInTheDocument()
  })

  it('filters visible object rows by search, category, and status', () => {
    render(
      <ObjectPanel
        objects={objects}
        selectedId="core-a"
        visibleCount={1}
        objectSearch="facade"
        categoryFilter="Envelope"
        statusFilter="Issue"
        onSelect={vi.fn()}
        onToggleVisibility={vi.fn()}
        onObjectSearch={vi.fn()}
        onCategoryFilter={vi.fn()}
        onStatusFilter={vi.fn()}
        onCreateObject={vi.fn()}
        onSelectAndMove={vi.fn()}
      />,
    )

    expect(screen.getByText('East Facade Panels')).toBeInTheDocument()
    expect(screen.queryByText('Concrete Core A')).not.toBeInTheDocument()
  })

  it('emits controlled filter changes', () => {
    const onObjectSearch = vi.fn()
    const onCategoryFilter = vi.fn()
    const onStatusFilter = vi.fn()

    render(
      <ObjectPanel
        objects={objects}
        selectedId="core-a"
        visibleCount={1}
        objectSearch=""
        categoryFilter="All"
        statusFilter="All"
        onSelect={vi.fn()}
        onToggleVisibility={vi.fn()}
        onObjectSearch={onObjectSearch}
        onCategoryFilter={onCategoryFilter}
        onStatusFilter={onStatusFilter}
        onCreateObject={vi.fn()}
        onSelectAndMove={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByRole('searchbox', { name: /search objects/i }), { target: { value: 'core' } })
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Structural' } })
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'Reviewed' } })

    expect(onObjectSearch).toHaveBeenCalledWith('core')
    expect(onCategoryFilter).toHaveBeenCalledWith('Structural')
    expect(onStatusFilter).toHaveBeenCalledWith('Reviewed')
  })

  it('shows an empty state when filters match no objects', () => {
    render(
      <ObjectPanel
        objects={objects}
        selectedId="core-a"
        visibleCount={1}
        objectSearch="basement"
        categoryFilter="All"
        statusFilter="All"
        onSelect={vi.fn()}
        onToggleVisibility={vi.fn()}
        onObjectSearch={vi.fn()}
        onCategoryFilter={vi.fn()}
        onStatusFilter={vi.fn()}
        onCreateObject={vi.fn()}
        onSelectAndMove={vi.fn()}
      />,
    )

    expect(screen.getByText('No objects match these filters.')).toBeInTheDocument()
  })

  it('emits create object from the panel action', () => {
    const onCreateObject = vi.fn()

    render(
      <ObjectPanel
        objects={objects}
        selectedId="core-a"
        visibleCount={1}
        objectSearch=""
        categoryFilter="All"
        statusFilter="All"
        onSelect={vi.fn()}
        onToggleVisibility={vi.fn()}
        onObjectSearch={vi.fn()}
        onCategoryFilter={vi.fn()}
        onStatusFilter={vi.fn()}
        onCreateObject={onCreateObject}
        onSelectAndMove={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /create object/i }))

    expect(onCreateObject).toHaveBeenCalledOnce()
  })

  it('starts move mode for a specific object from its row action', () => {
    const onSelectAndMove = vi.fn()

    render(
      <ObjectPanel
        objects={objects}
        selectedId="core-a"
        visibleCount={1}
        objectSearch=""
        categoryFilter="All"
        statusFilter="All"
        onSelect={vi.fn()}
        onToggleVisibility={vi.fn()}
        onObjectSearch={vi.fn()}
        onCategoryFilter={vi.fn()}
        onStatusFilter={vi.fn()}
        onCreateObject={vi.fn()}
        onSelectAndMove={onSelectAndMove}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /select and move east facade panels/i }))

    expect(onSelectAndMove).toHaveBeenCalledWith('facade-east')
  })
})
