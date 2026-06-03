import { FolderKanban, Search } from 'lucide-react'
import { Brand } from '../../components/Brand'
import { SectionTitle } from '../../components/SectionTitle'
import type { Project, UploadItem } from '../../types/domain'
import { ImportPanel } from '../importer/ImportPanel'

type ProjectRailProps = {
  projects: Project[]
  uploads: UploadItem[]
  activeProjectId: string
  searchQuery: string
  onProjectSelected: (id: string) => void
  onSearchProjects: (query: string) => void
  onFilesSelected: (files: FileList | null) => void
}

export function ProjectRail({
  projects,
  uploads,
  activeProjectId,
  searchQuery,
  onProjectSelected,
  onSearchProjects,
  onFilesSelected,
}: ProjectRailProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const visibleProjects = normalizedQuery
    ? projects.filter((project) =>
        [project.name, project.site, project.updated].some((value) => value.toLowerCase().includes(normalizedQuery)),
      )
    : projects

  return (
    <aside className="project-rail" aria-label="Project navigation">
      <Brand />

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

      <section className="rail-section">
        <SectionTitle icon={FolderKanban}>Projects</SectionTitle>
        <div className="project-list">
          {visibleProjects.map((project) => (
            <button
              className={`project-item ${project.id === activeProjectId ? 'is-active' : ''}`}
              key={project.id}
              type="button"
              onClick={() => onProjectSelected(project.id)}
            >
              <span className="project-name">{project.name}</span>
              <span>{project.site}</span>
              <small>
                {project.files} files - {project.issues} issues - {project.updated}
              </small>
            </button>
          ))}
          {visibleProjects.length === 0 ? <p className="empty-state">No projects match this search.</p> : null}
        </div>
      </section>

      <ImportPanel uploads={uploads} onFilesSelected={onFilesSelected} />
    </aside>
  )
}
