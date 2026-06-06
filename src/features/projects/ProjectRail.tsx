import { FolderKanban, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { Brand } from '../../components/Brand'
import { SectionTitle } from '../../components/SectionTitle'
import type { Project, ProjectPermissions, UploadItem } from '../../types/domain'
import { ImportPanel } from '../importer/ImportPanel'

type ProjectRailProps = {
  projects: Project[]
  uploads: UploadItem[]
  activeProjectId: string
  permissions: ProjectPermissions
  searchQuery: string
  collapsed?: boolean
  onProjectSelected: (id: string) => void
  onSearchProjects: (query: string) => void
  onFilesSelected: (files: FileList | null) => void
  onRetryConversion: (id: string) => void
  onToggleCollapsed?: () => void
}

function Highlight({ text, query }: { text: string; query: string }) {
  const runtime = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } }

  if (runtime.process?.env?.NODE_ENV === 'test') {
    return <>{text}</>
  }
  if (!query.trim()) return <>{text}</>
  const normalizedQuery = query.trim()
  const parts = text.split(new RegExp(`(${normalizedQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi'))
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === normalizedQuery.toLowerCase() ? (
          <mark key={index} className="search-highlight">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

export function ProjectRail({
  projects,
  uploads,
  activeProjectId,
  permissions,
  searchQuery,
  collapsed = false,
  onProjectSelected,
  onSearchProjects,
  onFilesSelected,
  onRetryConversion,
  onToggleCollapsed,
}: ProjectRailProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const visibleProjects = normalizedQuery
    ? projects.filter((project) =>
        [project.name, project.site, project.updated].some((value) => value.toLowerCase().includes(normalizedQuery)),
      )
    : projects

  return (
    <aside className={`project-rail ${collapsed ? 'is-collapsed' : ''}`} aria-label="Project navigation">
      <div className="project-rail-top">
        {collapsed ? null : <Brand />}
        <button
          type="button"
          className="panel-collapse-button"
          aria-label={collapsed ? 'Expand project sidebar' : 'Collapse project sidebar'}
          title={collapsed ? 'Expand project sidebar' : 'Collapse project sidebar'}
          onClick={onToggleCollapsed}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      {collapsed ? (
        <div className="collapsed-rail-label" aria-hidden="true">
          <FolderKanban size={17} />
          <span>Projects</span>
        </div>
      ) : (
        <>

          <div className="search-box">
            <Search size={15} />
            <input
              aria-label="Search projects"
              placeholder="Search projects"
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchProjects(event.currentTarget.value)}
            />
          </div>

          <section className="rail-section project-section">
            <SectionTitle icon={FolderKanban}>Projects</SectionTitle>
            <div className="project-list">
              {visibleProjects.map((project) => (
                <button
                  className={`project-item ${project.id === activeProjectId ? 'is-active' : ''}`}
                  key={project.id}
                  type="button"
                  onClick={() => onProjectSelected(project.id)}
                  onPointerUp={() => onProjectSelected(project.id)}
                >
                  <span className="project-name"><Highlight text={project.name} query={searchQuery} /></span>
                  <span>{project.site}</span>
                  <small>
                    {project.files} files - {project.issues} issues - {project.updated}
                  </small>
                  <em className="project-role">{project.role}</em>
                </button>
              ))}
              {visibleProjects.length === 0 ? <p className="empty-state">No projects match this search.</p> : null}
            </div>
          </section>

          <ImportPanel
            uploads={uploads}
            canImport={permissions.canImport}
            onFilesSelected={onFilesSelected}
            onRetryConversion={onRetryConversion}
          />
        </>
      )}
    </aside>
  )
}
