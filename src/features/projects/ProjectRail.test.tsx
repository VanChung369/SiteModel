import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProjectRail } from './ProjectRail'
import type { Project } from '../../types/domain'

const projects: Project[] = [
  { id: 'p1', name: 'Riverside Tower', site: 'District 7', updated: '12 min ago', files: 18, issues: 7, active: true, role: 'Owner' },
  { id: 'p2', name: 'Long Bien Depot', site: 'Hanoi', updated: '2 hr ago', files: 11, issues: 3, active: false, role: 'Viewer' },
  { id: 'p3', name: 'An Phu Villas', site: 'Thu Duc', updated: 'Yesterday', files: 24, issues: 12, active: false, role: 'Editor' },
]

const permissions = {
  canImport: true,
  canEditModel: true,
  canManageIssues: true,
  canSaveView: true,
  canSync: true,
}

afterEach(cleanup)

describe('ProjectRail', () => {
  it('filters projects by the controlled search query', () => {
    render(
      <ProjectRail
        projects={projects}
        uploads={[]}
        activeProjectId="p1"
        permissions={permissions}
        searchQuery="long"
        onSearchProjects={vi.fn()}
        onProjectSelected={vi.fn()}
        onFilesSelected={vi.fn()}
        onRetryConversion={vi.fn()}
      />,
    )

    expect(screen.getByText('Long Bien Depot')).toBeInTheDocument()
    expect(screen.queryByText('Riverside Tower')).not.toBeInTheDocument()
    expect(screen.queryByText('An Phu Villas')).not.toBeInTheDocument()
  })

  it('emits search and project selection events', () => {
    const onSearchProjects = vi.fn()
    const onProjectSelected = vi.fn()

    render(
      <ProjectRail
        projects={projects}
        uploads={[]}
        activeProjectId="p1"
        permissions={permissions}
        searchQuery=""
        onSearchProjects={onSearchProjects}
        onProjectSelected={onProjectSelected}
        onFilesSelected={vi.fn()}
        onRetryConversion={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByRole('searchbox', { name: /search projects/i }), { target: { value: 'villa' } })
    fireEvent.click(screen.getByRole('button', { name: /Long Bien Depot/i }))

    expect(onSearchProjects).toHaveBeenCalledWith('villa')
    expect(onProjectSelected).toHaveBeenCalledWith('p2')
  })
})
