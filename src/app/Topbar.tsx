import { RotateCcw, Save, Share2, Sun, Moon } from 'lucide-react'
import type { ProjectPermissions, ProjectRole } from '../types/domain'

type TopbarProps = {
  projectName: string
  projectSite: string
  projectRole: ProjectRole
  permissions: ProjectPermissions
  savedViewCount: number
  viewName: string
  actionMessage: string | null
  shareUrl: string | null
  onViewNameChange: (name: string) => void
  onSync: () => void
  onShare: () => void
  onSaveView: () => void
  theme?: 'dark' | 'light'
  onToggleTheme?: () => void
}

function formatSavedViewCount(count: number) {
  return `${count} saved ${count === 1 ? 'view' : 'views'}`
}

export function Topbar({
  projectName,
  projectSite,
  projectRole,
  permissions,
  savedViewCount,
  viewName,
  actionMessage,
  shareUrl,
  onViewNameChange,
  onSync,
  onShare,
  onSaveView,
  theme = 'dark',
  onToggleTheme = () => {},
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-context">
        <span className="crumb">
          Projects / {projectName} / {projectSite}
        </span>
        <h1>Viewer</h1>
        <span className="role-badge">{projectRole}</span>
      </div>
      <div className="topbar-actions">
        <span className="saved-view-count">{formatSavedViewCount(savedViewCount)}</span>
        {actionMessage ? <span className="action-message">{actionMessage}</span> : null}
        <label className="view-name-field">
          <span>View name</span>
          <input
            aria-label="View name"
            placeholder="Coordination view"
            disabled={!permissions.canSaveView}
            value={viewName}
            onChange={(event) => onViewNameChange(event.currentTarget.value)}
          />
        </label>
        <button type="button" disabled={!permissions.canSync} onClick={onSync}>
          <RotateCcw size={16} />
          Sync
        </button>
        <button type="button" onClick={onShare}>
          <Share2 size={16} />
          Share
        </button>
        <button type="button" className="primary-action" disabled={!permissions.canSaveView} onClick={onSaveView}>
          <Save size={16} />
          Save View
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title="Toggle color theme"
          className="theme-toggle-btn"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {shareUrl ? (
          <a className="share-link" href={shareUrl}>
            Shared view link
          </a>
        ) : null}
      </div>
    </header>
  )
}
