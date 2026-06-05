import { RotateCcw, Save, Share2 } from 'lucide-react'

type TopbarProps = {
  projectName: string
  projectSite: string
  savedViewCount: number
  viewName: string
  actionMessage: string | null
  onViewNameChange: (name: string) => void
  onSync: () => void
  onShare: () => void
  onSaveView: () => void
}

function formatSavedViewCount(count: number) {
  return `${count} saved ${count === 1 ? 'view' : 'views'}`
}

export function Topbar({
  projectName,
  projectSite,
  savedViewCount,
  viewName,
  actionMessage,
  onViewNameChange,
  onSync,
  onShare,
  onSaveView,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <span className="crumb">
          Projects / {projectName} / {projectSite}
        </span>
        <h1>Viewer</h1>
      </div>
      <div className="topbar-actions">
        <span className="saved-view-count">{formatSavedViewCount(savedViewCount)}</span>
        {actionMessage ? <span className="action-message">{actionMessage}</span> : null}
        <label className="view-name-field">
          <span>View name</span>
          <input
            aria-label="View name"
            placeholder="Coordination view"
            value={viewName}
            onChange={(event) => onViewNameChange(event.currentTarget.value)}
          />
        </label>
        <button type="button" onClick={onSync}>
          <RotateCcw size={16} />
          Sync
        </button>
        <button type="button" onClick={onShare}>
          <Share2 size={16} />
          Share
        </button>
        <button type="button" className="primary-action" onClick={onSaveView}>
          <Save size={16} />
          Save View
        </button>
      </div>
    </header>
  )
}
