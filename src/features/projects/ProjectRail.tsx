import { FolderKanban, Search } from 'lucide-react'
import { Brand } from '../../components/Brand'
import { SectionTitle } from '../../components/SectionTitle'
import type { Project, UploadItem } from '../../types/domain'
import { ImportPanel } from '../importer/ImportPanel'

type ProjectRailProps = {
  projects: Project[]
  uploads: UploadItem[]
  onFilesSelected: (files: FileList | null) => void
}

export function ProjectRail({ projects, uploads, onFilesSelected }: ProjectRailProps) {
  return (
    <aside className="project-rail" aria-label="Project navigation">
      <Brand />

      <div className="search-box">
        <Search size={15} />
        <input aria-label="Search projects" placeholder="Search projects" />
      </div>

      <section className="rail-section">
        <SectionTitle icon={FolderKanban}>Projects</SectionTitle>
        <div className="project-list">
          {projects.map((project) => (
            <button className={`project-item ${project.active ? 'is-active' : ''}`} key={project.id}>
              <span className="project-name">{project.name}</span>
              <span>{project.site}</span>
              <small>
                {project.files} files - {project.issues} issues - {project.updated}
              </small>
            </button>
          ))}
        </div>
      </section>

      <ImportPanel uploads={uploads} onFilesSelected={onFilesSelected} />
    </aside>
  )
}
