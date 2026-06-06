import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InspectorPanel } from './InspectorPanel'
import type { CameraView, ModelIssue, ModelObject } from '../../types/domain'

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

const cameraView: CameraView = {
  position: [8.8, 6.4, 8.6],
  target: [0, 0, 0],
  zoom: 1,
}

const issues: ModelIssue[] = [
  {
    id: 'issue-1',
    objectId: 'core-a',
    title: 'Concrete Core A coordination issue',
    severity: 'High',
    status: 'Open',
    assignee: 'Coordination',
    note: 'Check slab edge clearance.',
    viewContext: {
      version: 'Architecture v12.glb',
      tool: 'Move',
      cameraView,
      objectPosition: [0, 2.1, 0],
    },
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
        onUpdateIssueStatus={vi.fn()}
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
        onUpdateIssueStatus={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText(/issue assignee/i), { target: { value: 'MEP Lead' } })
    fireEvent.change(screen.getByLabelText(/issue severity/i), { target: { value: 'Medium' } })
    fireEvent.change(screen.getByLabelText(/issue note/i), { target: { value: 'Review riser clearance.' } })
    fireEvent.click(screen.getByRole('button', { name: /add issue/i }))

    expect(onAddIssue).toHaveBeenCalledWith('core-a', {
      assignee: 'MEP Lead',
      note: 'Review riser clearance.',
      severity: 'Medium',
    })
  })

  it('shows issue count and issue details for the selected object', () => {
    render(
      <InspectorPanel
        selected={{ ...selected, status: 'Issue' }}
        issues={issues}
        onUpdateSelected={vi.fn()}
        onIsolateSelected={vi.fn()}
        onAddIssue={vi.fn()}
        onUpdateIssueStatus={vi.fn()}
      />,
    )

    expect(screen.getByText('1 open issue')).toBeInTheDocument()
    expect(screen.getByText('Concrete Core A coordination issue')).toBeInTheDocument()
    expect(screen.getByText('High - Coordination - Today')).toBeInTheDocument()
    expect(screen.getByText('Check slab edge clearance.')).toBeInTheDocument()
    expect(screen.getByText(/View: Architecture v12\.glb \/ Move/i)).toBeInTheDocument()
  })

  it('shows BIM metadata from the selected object', () => {
    render(
      <InspectorPanel
        selected={{
          ...selected,
          metadata: {
            ifcGuid: '2M3kz$CoreA18xB7',
            phase: 'Construction',
            owner: 'Structural',
            volumeM3: 5549,
            clashes: 2,
          },
        }}
        issues={[]}
        onUpdateSelected={vi.fn()}
        onIsolateSelected={vi.fn()}
        onAddIssue={vi.fn()}
        onUpdateIssueStatus={vi.fn()}
      />,
    )

    expect(screen.getByText('5,549 m3')).toBeInTheDocument()
    expect(screen.getByText('IFC GUID: 2M3kz$CoreA18xB7', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Owner: Structural', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Clashes: 2', { exact: false })).toBeInTheDocument()
  })

  it('shows an empty issue state when the selected object has no issues', () => {
    render(
      <InspectorPanel
        selected={selected}
        issues={[]}
        onUpdateSelected={vi.fn()}
        onIsolateSelected={vi.fn()}
        onAddIssue={vi.fn()}
        onUpdateIssueStatus={vi.fn()}
      />,
    )

    expect(screen.getByText('No issues logged for this object.')).toBeInTheDocument()
  })

  it('requests issue status changes from issue workflow actions', () => {
    const onUpdateIssueStatus = vi.fn()

    const { rerender } = render(
      <InspectorPanel
        selected={{ ...selected, status: 'Issue' }}
        issues={issues}
        onUpdateSelected={vi.fn()}
        onIsolateSelected={vi.fn()}
        onAddIssue={vi.fn()}
        onUpdateIssueStatus={onUpdateIssueStatus}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /mark concrete core a coordination issue in review/i }))
    fireEvent.click(screen.getByRole('button', { name: /resolve concrete core a coordination issue/i }))

    rerender(
      <InspectorPanel
        selected={{ ...selected, status: 'Reviewed' }}
        issues={[{ ...issues[0], status: 'Resolved', resolvedAt: 'Today' }]}
        onUpdateSelected={vi.fn()}
        onIsolateSelected={vi.fn()}
        onAddIssue={vi.fn()}
        onUpdateIssueStatus={onUpdateIssueStatus}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /reopen concrete core a coordination issue/i }))

    expect(onUpdateIssueStatus).toHaveBeenNthCalledWith(1, 'issue-1', 'In Review')
    expect(onUpdateIssueStatus).toHaveBeenNthCalledWith(2, 'issue-1', 'Resolved')
    expect(onUpdateIssueStatus).toHaveBeenNthCalledWith(3, 'issue-1', 'Open')
  })

  it('requests issue view context restoration', () => {
    const onRestoreIssueView = vi.fn()

    render(
      <InspectorPanel
        selected={{ ...selected, status: 'Issue' }}
        issues={issues}
        onUpdateSelected={vi.fn()}
        onIsolateSelected={vi.fn()}
        onAddIssue={vi.fn()}
        onUpdateIssueStatus={vi.fn()}
        onRestoreIssueView={onRestoreIssueView}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /restore concrete core a coordination issue view context/i }))

    expect(onRestoreIssueView).toHaveBeenCalledWith('issue-1')
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
        onUpdateIssueStatus={vi.fn()}
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
        onUpdateIssueStatus={vi.fn()}
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
