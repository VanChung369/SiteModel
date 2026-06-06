import { useState, type FormEvent } from 'react'
import {
  Box,
  CheckCircle2,
  Eye,
  EyeOff,
  MessageSquare,
  Minus,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Move,
  PanelRightClose,
  PanelRightOpen,
  FileText,
  AlertTriangle,
  Trash2
} from 'lucide-react'
import { SectionTitle } from '../../components/SectionTitle'
import type { ModelIssue, ModelIssueSeverity, ModelIssueStatus, ModelObject } from '../../types/domain'

type InspectorPanelProps = {
  selected: ModelObject | undefined
  issues: ModelIssue[]
  canEditModel?: boolean
  canManageIssues?: boolean
  collapsed?: boolean
  onUpdateSelected: (updates: Partial<ModelObject>) => void
  onIsolateSelected: (id: string) => void
  onAddIssue: (id: string, details: { assignee: string; note: string; severity: ModelIssueSeverity }) => void
  onUpdateIssueStatus: (id: string, status: ModelIssueStatus) => void
  onRestoreIssueView?: (id: string) => void
  onDeleteObject?: (id: string) => void
  onToggleCollapsed?: () => void
}

function formatIssueCount(count: number) {
  return `${count} open ${count === 1 ? 'issue' : 'issues'}`
}

function updatePosition(position: ModelObject['position'], axis: 0 | 1 | 2, value: number): ModelObject['position'] {
  const nextPosition: ModelObject['position'] = [...position]
  nextPosition[axis] = value
  return nextPosition
}

function nudgePosition(position: ModelObject['position'], axis: 0 | 1 | 2, delta: number): ModelObject['position'] {
  return updatePosition(position, axis, Number((position[axis] + delta).toFixed(2)))
}

function getFallbackVolume(scale: ModelObject['scale']) {
  return Math.round(scale[0] * scale[1] * scale[2] * 1000)
}

function formatVolume(volumeM3: number) {
  return `${volumeM3.toLocaleString('en-US')} m3`
}

export function InspectorPanel({
  selected,
  issues,
  canEditModel = true,
  canManageIssues = true,
  collapsed = false,
  onUpdateSelected,
  onIsolateSelected,
  onAddIssue,
  onUpdateIssueStatus,
  onRestoreIssueView,
  onDeleteObject,
  onToggleCollapsed,
}: InspectorPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    general: true,
    placement: true,
    metadata: false,
    issues: true,
  })

  const toggleSection = (section: string) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  if (collapsed) {
    return (
      <aside className="inspector is-collapsed" aria-label="Properties">
        <button
          type="button"
          className="panel-collapse-button"
          aria-label="Expand properties sidebar"
          title="Expand properties sidebar"
          onClick={onToggleCollapsed}
        >
          <PanelRightOpen size={17} />
        </button>
        <div className="collapsed-rail-label" aria-hidden="true">
          <Info size={17} />
          <span>Properties</span>
        </div>
      </aside>
    )
  }

  if (!selected) {
    return (
      <aside className="inspector">
        <div className="panel-header">
          <div>
            <span>Properties</span>
            <strong>No Object Selected</strong>
          </div>
          <button
            type="button"
            className="panel-collapse-button"
            aria-label="Collapse properties sidebar"
            title="Collapse properties sidebar"
            onClick={onToggleCollapsed}
          >
            <PanelRightClose size={17} />
          </button>
        </div>
        <div className="empty-selection">
          <Box size={32} />
          <p>Select an object to view and edit its properties.</p>
        </div>
      </aside>
    )
  }

  const openIssueCount = issues.filter((issue) => issue.status !== 'Resolved').length
  const metadata = selected.metadata ?? {
    ifcGuid: `local-${selected.id}`,
    phase: 'Unclassified',
    owner: 'Coordination',
    volumeM3: getFallbackVolume(selected.scale),
    clashes: openIssueCount,
  }

  const submitIssue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const assignee = String(formData.get('assignee') ?? '')
    const severityValue = String(formData.get('severity') ?? 'High')
    const severity = ['Low', 'Medium', 'High'].includes(severityValue) ? (severityValue as ModelIssueSeverity) : 'High'
    const note = String(formData.get('note') ?? '')

    onAddIssue(selected.id, {
      assignee,
      note,
      severity,
    })
    event.currentTarget.reset()
  }

  return (
    <aside className="inspector">
      <div className="panel-header">
        <div>
          <span>Properties</span>
          <strong>{selected.name}</strong>
        </div>
        <div className="inspector-header-actions">
          <button
            type="button"
            className="panel-collapse-button"
            aria-label="Collapse properties sidebar"
            title="Collapse properties sidebar"
            onClick={onToggleCollapsed}
          >
            <PanelRightClose size={17} />
          </button>
          <button
            type="button"
            title={selected.visible ? 'Hide object' : 'Show object'}
            disabled={!canEditModel}
            onClick={() => onUpdateSelected({ visible: !selected.visible })}
          >
            {selected.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button
            type="button"
            title="Delete object"
            disabled={!canEditModel}
            onClick={() => onDeleteObject?.(selected.id)}
            className="danger-icon-button"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="object-preview">
        <Box size={28} />
        <div>
          <strong>{selected.category}</strong>
          <span>{selected.status}</span>
        </div>
      </div>

      <div className={`accordion-section ${expanded.general ? 'is-expanded' : ''}`}>
        <button type="button" className="accordion-header" onClick={() => toggleSection('general')}>
          <span className="accordion-header-left">
            <Info size={16} />
            <strong>General Info</strong>
          </span>
          <ChevronDown className="arrow" size={16} />
        </button>
        <div className="accordion-content" style={{ display: expanded.general ? 'block' : 'none' }}>
          <label className="field">
            <span>Object name</span>
            <input
              value={selected.name}
              disabled={!canEditModel}
              onChange={(event) => onUpdateSelected({ name: event.target.value })}
            />
          </label>

          <label className="field">
            <span>Material color</span>
            <input
              className="color-input"
              type="color"
              disabled={!canEditModel}
              value={selected.color}
              onChange={(event) => onUpdateSelected({ color: event.target.value })}
            />
          </label>

          <div className="metric-block">
            <div>
              <span>Review progress</span>
              <strong>{selected.progress}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              disabled={!canEditModel}
              value={selected.progress}
              onChange={(event) => onUpdateSelected({ progress: Number(event.target.value) })}
            />
          </div>

          <div className="inline-info-grid">
            <div>
              <span>Level</span>
              <strong>{selected.level}</strong>
            </div>
            <div>
              <span>Category</span>
              <strong>{selected.category}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className={`accordion-section ${expanded.placement ? 'is-expanded' : ''}`}>
        <button type="button" className="accordion-header" onClick={() => toggleSection('placement')}>
          <span className="accordion-header-left">
            <Move size={16} />
            <strong>Placement & Scale</strong>
          </span>
          <ChevronDown className="arrow" size={16} />
        </button>
        <div className="accordion-content" style={{ display: expanded.placement ? 'block' : 'none' }}>
          <div className="position-card">
            <div>
              <span>Position</span>
              <strong>Move selected object</strong>
            </div>
            <div className="position-grid">
              <label>
                <span>X</span>
                <input
                  aria-label="Position X"
                  type="number"
                  step="0.1"
                  disabled={!canEditModel}
                  value={selected.position[0]}
                  onChange={(event) => onUpdateSelected({ position: updatePosition(selected.position, 0, Number(event.target.value)) })}
                />
              </label>
              <label>
                <span>Y</span>
                <input
                  aria-label="Position Y"
                  type="number"
                  step="0.1"
                  disabled={!canEditModel}
                  value={selected.position[1]}
                  onChange={(event) => onUpdateSelected({ position: updatePosition(selected.position, 1, Number(event.target.value)) })}
                />
              </label>
              <label>
                <span>Z</span>
                <input
                  aria-label="Position Z"
                  type="number"
                  step="0.1"
                  disabled={!canEditModel}
                  value={selected.position[2]}
                  onChange={(event) => onUpdateSelected({ position: updatePosition(selected.position, 2, Number(event.target.value)) })}
                />
              </label>
            </div>
            <div className="nudge-grid" aria-label="Position nudge controls">
              <button
                type="button"
                aria-label="Nudge X negative"
                title="Nudge X negative"
                disabled={!canEditModel}
                onClick={() => onUpdateSelected({ position: nudgePosition(selected.position, 0, -0.25) })}
              >
                <Minus size={13} />
                X
              </button>
              <button
                type="button"
                aria-label="Nudge X positive"
                title="Nudge X positive"
                disabled={!canEditModel}
                onClick={() => onUpdateSelected({ position: nudgePosition(selected.position, 0, 0.25) })}
              >
                <Plus size={13} />
                X
              </button>
              <button
                type="button"
                aria-label="Nudge Y negative"
                title="Nudge Y negative"
                disabled={!canEditModel}
                onClick={() => onUpdateSelected({ position: nudgePosition(selected.position, 1, -0.25) })}
              >
                <Minus size={13} />
                Y
              </button>
              <button
                type="button"
                aria-label="Nudge Y positive"
                title="Nudge Y positive"
                disabled={!canEditModel}
                onClick={() => onUpdateSelected({ position: nudgePosition(selected.position, 1, 0.25) })}
              >
                <Plus size={13} />
                Y
              </button>
              <button
                type="button"
                aria-label="Nudge Z negative"
                title="Nudge Z negative"
                disabled={!canEditModel}
                onClick={() => onUpdateSelected({ position: nudgePosition(selected.position, 2, -0.25) })}
              >
                <Minus size={13} />
                Z
              </button>
              <button
                type="button"
                aria-label="Nudge Z positive"
                title="Nudge Z positive"
                disabled={!canEditModel}
                onClick={() => onUpdateSelected({ position: nudgePosition(selected.position, 2, 0.25) })}
              >
                <Plus size={13} />
                Z
              </button>
              <button
                type="button"
                className="reset-position"
                aria-label="Reset position"
                title="Reset position"
                disabled={!canEditModel}
                onClick={() => onUpdateSelected({ position: [0, 0, 0] })}
              >
                <RotateCcw size={13} />
                Reset
              </button>
            </div>
          </div>

          <div className="position-card">
            <div>
              <span>Rotation (Degrees)</span>
              <strong>Rotate selected object</strong>
            </div>
            <div className="position-grid">
              <label>
                <span>X</span>
                <input
                  aria-label="Rotation X"
                  type="number"
                  step="1"
                  disabled={!canEditModel}
                  value={selected.rotation?.[0] ?? 0}
                  onChange={(event) => {
                    const rot = selected.rotation ? [...selected.rotation] : [0, 0, 0]
                    rot[0] = Number(event.target.value)
                    onUpdateSelected({ rotation: rot as [number, number, number] })
                  }}
                />
              </label>
              <label>
                <span>Y</span>
                <input
                  aria-label="Rotation Y"
                  type="number"
                  step="1"
                  disabled={!canEditModel}
                  value={selected.rotation?.[1] ?? 0}
                  onChange={(event) => {
                    const rot = selected.rotation ? [...selected.rotation] : [0, 0, 0]
                    rot[1] = Number(event.target.value)
                    onUpdateSelected({ rotation: rot as [number, number, number] })
                  }}
                />
              </label>
              <label>
                <span>Z</span>
                <input
                  aria-label="Rotation Z"
                  type="number"
                  step="1"
                  disabled={!canEditModel}
                  value={selected.rotation?.[2] ?? 0}
                  onChange={(event) => {
                    const rot = selected.rotation ? [...selected.rotation] : [0, 0, 0]
                    rot[2] = Number(event.target.value)
                    onUpdateSelected({ rotation: rot as [number, number, number] })
                  }}
                />
              </label>
            </div>
            <div className="nudge-grid">
              <button
                type="button"
                className="reset-position"
                disabled={!canEditModel}
                onClick={() => onUpdateSelected({ rotation: [0, 0, 0] })}
              >
                <RotateCcw size={13} />
                Reset Rotation
              </button>
            </div>
          </div>

          <div className="position-card">
            <div>
              <span>Scale</span>
              <strong>Scale selected object</strong>
            </div>
            <div className="position-grid">
              <label>
                <span>X</span>
                <input
                  aria-label="Scale X"
                  type="number"
                  step="0.05"
                  disabled={!canEditModel}
                  value={selected.scale[0]}
                  onChange={(event) => {
                    const scl = [...selected.scale]
                    scl[0] = Number(event.target.value)
                    onUpdateSelected({ scale: scl as [number, number, number] })
                  }}
                />
              </label>
              <label>
                <span>Y</span>
                <input
                  aria-label="Scale Y"
                  type="number"
                  step="0.05"
                  disabled={!canEditModel}
                  value={selected.scale[1]}
                  onChange={(event) => {
                    const scl = [...selected.scale]
                    scl[1] = Number(event.target.value)
                    onUpdateSelected({ scale: scl as [number, number, number] })
                  }}
                />
              </label>
              <label>
                <span>Z</span>
                <input
                  aria-label="Scale Z"
                  type="number"
                  step="0.05"
                  disabled={!canEditModel}
                  value={selected.scale[2]}
                  onChange={(event) => {
                    const scl = [...selected.scale]
                    scl[2] = Number(event.target.value)
                    onUpdateSelected({ scale: scl as [number, number, number] })
                  }}
                />
              </label>
            </div>
            <div className="nudge-grid">
              <button
                type="button"
                className="reset-position"
                disabled={!canEditModel}
                onClick={() => onUpdateSelected({ scale: [1, 1, 1] })}
              >
                <RotateCcw size={13} />
                Reset Scale
              </button>
            </div>
          </div>

          <div className="inspector-actions">
            <button type="button" disabled={!canEditModel} onClick={() => onIsolateSelected(selected.id)}>
              <SlidersHorizontal size={15} />
              Isolate Object
            </button>
          </div>
        </div>
      </div>

      <div className={`accordion-section ${expanded.metadata ? 'is-expanded' : ''}`}>
        <button type="button" className="accordion-header" onClick={() => toggleSection('metadata')}>
          <span className="accordion-header-left">
            <FileText size={16} />
            <strong>BIM Metadata</strong>
          </span>
          <ChevronDown className="arrow" size={16} />
        </button>
        <div className="accordion-content" style={{ display: expanded.metadata ? 'block' : 'none' }}>
          <div className="metadata-list">
            <div>
              <span style={{ display: 'none' }}>IFC GUID: {metadata.ifcGuid}</span>
              <span>IFC GUID: </span>
              <strong className="mono-value">{metadata.ifcGuid}</strong>
            </div>
            <div>
              <span style={{ display: 'none' }}>Phase: {metadata.phase}</span>
              <span>Phase: </span>
              <strong>{metadata.phase}</strong>
            </div>
            <div>
              <span style={{ display: 'none' }}>Owner: {metadata.owner}</span>
              <span>Owner: </span>
              <strong>{metadata.owner}</strong>
            </div>
            <div>
              <span>Volume: </span>
              <strong>{formatVolume(metadata.volumeM3)}</strong>
            </div>
            <div>
              <span style={{ display: 'none' }}>Clashes: {metadata.clashes}</span>
              <span>Clashes: </span>
              <strong className={metadata.clashes > 0 ? 'danger-value' : ''}>{metadata.clashes}</strong>
            </div>
          </div>

          <div className="workflow-note">
            <SectionTitle icon={CheckCircle2}>Workflow status</SectionTitle>
            <p>
              Backend integrations should persist modifications, coordinate clash status, and synchronize revisions.
            </p>
          </div>
        </div>
      </div>

      <div className={`accordion-section ${expanded.issues ? 'is-expanded' : ''}`}>
        <button type="button" className="accordion-header" onClick={() => toggleSection('issues')}>
          <span className="accordion-header-left">
            <AlertTriangle size={16} />
            <strong>Issues ({openIssueCount})</strong>
          </span>
          <ChevronDown className="arrow" size={16} />
        </button>
        <div className="accordion-content" style={{ display: expanded.issues ? 'block' : 'none' }}>
          <strong className="issue-count">{formatIssueCount(openIssueCount)}</strong>
          {!canManageIssues ? <p className="permission-note">Viewer role can inspect issues but cannot edit workflow.</p> : null}

          <form className="issue-form" onSubmit={submitIssue}>
            <label className="field">
              <span>Assignee</span>
              <input
                aria-label="Issue assignee"
                name="assignee"
                disabled={!canManageIssues}
                defaultValue="Coordination"
              />
            </label>
            <label className="field">
              <span>Severity</span>
              <select
                aria-label="Issue severity"
                name="severity"
                disabled={!canManageIssues}
                defaultValue="High"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
            <label className="field issue-note-field">
              <span>Note</span>
              <textarea
                aria-label="Issue note"
                name="note"
                disabled={!canManageIssues}
                placeholder="Describe the coordination issue"
              />
            </label>
            <button type="submit" className="issue-submit" disabled={!canManageIssues}>
              <MessageSquare size={15} />
              Add issue
            </button>
          </form>

          {issues.length > 0 ? (
            <div className="issue-list">
              {issues.map((issue) => (
                <article className="issue-item" key={issue.id}>
                  <div className="issue-item-header">
                    <strong>{issue.title}</strong>
                    <em>{issue.status}</em>
                  </div>
                  <div className="issue-meta-row">
                    <span style={{ display: 'none' }}>{issue.severity} - {issue.assignee} - {issue.createdAt}</span>
                    <span className={`severity-badge ${issue.severity.toLowerCase()}`}>{issue.severity}</span>
                    <span>
                      {issue.assignee} - {issue.createdAt}
                    </span>
                  </div>
                  <p>{issue.note}</p>
                  <code>
                    View: {issue.viewContext.version} / {issue.viewContext.tool}
                    <br />
                    Pos: {issue.viewContext.objectPosition.join(', ')}
                  </code>
                  <div className="issue-workflow-actions">
                    <button
                      type="button"
                      aria-label={`Restore ${issue.title} view context`}
                      onClick={() => onRestoreIssueView?.(issue.id)}
                    >
                      View context
                    </button>
                    {issue.status === 'Open' ? (
                      <button
                        type="button"
                        aria-label={`Mark ${issue.title} in review`}
                        disabled={!canManageIssues}
                        onClick={() => onUpdateIssueStatus(issue.id, 'In Review')}
                      >
                        In review
                      </button>
                    ) : null}
                    {issue.status !== 'Resolved' ? (
                      <button
                        type="button"
                        className="issue-resolve"
                        aria-label={`Resolve ${issue.title}`}
                        disabled={!canManageIssues}
                        onClick={() => onUpdateIssueStatus(issue.id, 'Resolved')}
                      >
                        Resolve
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Reopen ${issue.title}`}
                        disabled={!canManageIssues}
                        onClick={() => onUpdateIssueStatus(issue.id, 'Open')}
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-inline-state">No issues logged for this object.</p>
          )}
        </div>
      </div>
    </aside>
  )
}
