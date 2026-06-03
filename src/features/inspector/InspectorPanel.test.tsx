import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InspectorPanel } from './InspectorPanel'
import type { ModelIssue, ModelObject } from '../../types/domain'

const selected: ModelObject = {
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
}

const issues: ModelIssue[] = [
  {
    id: 'issue-1',
    objectId: 'core-a',
    title: 'Concrete Core A coordination issue',
    severity: 'High',
    status: 'Open',
    createdAt: 'Today',
  },
]

afterEach(cleanup)

describe('InspectorPanel', () => {
  it('requests isolation for the selected object', () => {
    const onIsolateSelected = vi.fn()

    render(
      <InspectorPanel
        selected={selected}
        issues={[]}
        onUpdateSelected={vi.fn()}
        onIsolateSelected={onIsolateSelected}
        onAddIssue={vi.fn()}
        onResolveIssue={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /isolate/i }))

    expect(onIsolateSelected).toHaveBeenCalledWith('core-a')
  })

  it('requests issue creation for the selected object', () => {
    const onAddIssue = vi.fn()

    render(
      <InspectorPanel
        selected={selected}
        issues={[]}
        onUpdateSelected={vi.fn()}
        onIsolateSelected={vi.fn()}
        onAddIssue={onAddIssue}
        onResolveIssue={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /add issue/i }))

    expect(onAddIssue).toHaveBeenCalledWith('core-a')
  })

  it('shows issue count and issue details for the selected object', () => {
    render(
      <InspectorPanel
        selected={{ ...selected, status: 'Issue' }}
        issues={issues}
        onUpdateSelected={vi.fn()}
        onIsolateSelected={vi.fn()}
        onAddIssue={vi.fn()}
        onResolveIssue={vi.fn()}
      />,
    )

    expect(screen.getByText('1 open issue')).toBeInTheDocument()
    expect(screen.getByText('Concrete Core A coordination issue')).toBeInTheDocument()
    expect(screen.getByText('High - Open - Today')).toBeInTheDocument()
  })

  it('shows an empty issue state when the selected object has no issues', () => {
    render(
      <InspectorPanel
        selected={selected}
        issues={[]}
        onUpdateSelected={vi.fn()}
        onIsolateSelected={vi.fn()}
        onAddIssue={vi.fn()}
        onResolveIssue={vi.fn()}
      />,
    )

    expect(screen.getByText('No issues logged for this object.')).toBeInTheDocument()
  })

  it('requests issue resolution from an issue row', () => {
    const onResolveIssue = vi.fn()

    render(
      <InspectorPanel
        selected={{ ...selected, status: 'Issue' }}
        issues={issues}
        onUpdateSelected={vi.fn()}
        onIsolateSelected={vi.fn()}
        onAddIssue={vi.fn()}
        onResolveIssue={onResolveIssue}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /resolve concrete core a coordination issue/i }))

    expect(onResolveIssue).toHaveBeenCalledWith('issue-1')
  })

  it('updates the selected object position one axis at a time', () => {
    const onUpdateSelected = vi.fn()

    render(
      <InspectorPanel
        selected={selected}
        issues={[]}
        onUpdateSelected={onUpdateSelected}
        onIsolateSelected={vi.fn()}
        onAddIssue={vi.fn()}
        onResolveIssue={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText(/position x/i), { target: { value: '1.25' } })
    fireEvent.change(screen.getByLabelText(/position y/i), { target: { value: '3.5' } })
    fireEvent.change(screen.getByLabelText(/position z/i), { target: { value: '-2' } })

    expect(onUpdateSelected).toHaveBeenNthCalledWith(1, { position: [1.25, 2.1, 0] })
    expect(onUpdateSelected).toHaveBeenNthCalledWith(2, { position: [0, 3.5, 0] })
    expect(onUpdateSelected).toHaveBeenNthCalledWith(3, { position: [0, 2.1, -2] })
  })

  it('nudges and resets the selected object position', () => {
    const onUpdateSelected = vi.fn()

    render(
      <InspectorPanel
        selected={selected}
        issues={[]}
        onUpdateSelected={onUpdateSelected}
        onIsolateSelected={vi.fn()}
        onAddIssue={vi.fn()}
        onResolveIssue={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /nudge x positive/i }))
    fireEvent.click(screen.getByRole('button', { name: /nudge y negative/i }))
    fireEvent.click(screen.getByRole('button', { name: /reset position/i }))

    expect(onUpdateSelected).toHaveBeenNthCalledWith(1, { position: [0.25, 2.1, 0] })
    expect(onUpdateSelected).toHaveBeenNthCalledWith(2, { position: [0, 1.85, 0] })
    expect(onUpdateSelected).toHaveBeenNthCalledWith(3, { position: [0, 0, 0] })
  })
})
