import { Box, Braces, CheckCircle2, Eye, EyeOff, MessageSquare, Minus, Plus, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { SectionTitle } from '../../components/SectionTitle'
import type { ModelIssue, ModelObject } from '../../types/domain'

type InspectorPanelProps = {
  selected: ModelObject
  issues: ModelIssue[]
  onUpdateSelected: (updates: Partial<ModelObject>) => void
  onIsolateSelected: (id: string) => void
  onAddIssue: (id: string) => void
  onResolveIssue: (id: string) => void
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

export function InspectorPanel({
  selected,
  issues,
  onUpdateSelected,
  onIsolateSelected,
  onAddIssue,
  onResolveIssue,
}: InspectorPanelProps) {
  return (
    <aside className="inspector">
      <div className="panel-header">
        <div>
          <span>Properties</span>
          <strong>{selected.name}</strong>
        </div>
        <button
          type="button"
          title={selected.visible ? 'Hide object' : 'Show object'}
          onClick={() => onUpdateSelected({ visible: !selected.visible })}
        >
          {selected.visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>

      <div className="object-preview">
        <Box size={28} />
        <div>
          <strong>{selected.category}</strong>
          <span>{selected.status}</span>
        </div>
      </div>

      <label className="field">
        <span>Object name</span>
        <input value={selected.name} onChange={(event) => onUpdateSelected({ name: event.target.value })} />
      </label>

      <label className="field">
        <span>Material color</span>
        <input
          className="color-input"
          type="color"
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
          value={selected.progress}
          onChange={(event) => onUpdateSelected({ progress: Number(event.target.value) })}
        />
      </div>

      <section className="position-card">
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
            onClick={() => onUpdateSelected({ position: nudgePosition(selected.position, 0, -0.25) })}
          >
            <Minus size={13} />
            X
          </button>
          <button
            type="button"
            aria-label="Nudge X positive"
            title="Nudge X positive"
            onClick={() => onUpdateSelected({ position: nudgePosition(selected.position, 0, 0.25) })}
          >
            <Plus size={13} />
            X
          </button>
          <button
            type="button"
            aria-label="Nudge Y negative"
            title="Nudge Y negative"
            onClick={() => onUpdateSelected({ position: nudgePosition(selected.position, 1, -0.25) })}
          >
            <Minus size={13} />
            Y
          </button>
          <button
            type="button"
            aria-label="Nudge Y positive"
            title="Nudge Y positive"
            onClick={() => onUpdateSelected({ position: nudgePosition(selected.position, 1, 0.25) })}
          >
            <Plus size={13} />
            Y
          </button>
          <button
            type="button"
            aria-label="Nudge Z negative"
            title="Nudge Z negative"
            onClick={() => onUpdateSelected({ position: nudgePosition(selected.position, 2, -0.25) })}
          >
            <Minus size={13} />
            Z
          </button>
          <button
            type="button"
            aria-label="Nudge Z positive"
            title="Nudge Z positive"
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
            onClick={() => onUpdateSelected({ position: [0, 0, 0] })}
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </section>

      <div className="property-grid">
        <div>
          <span>Level</span>
          <strong>{selected.level}</strong>
        </div>
        <div>
          <span>Category</span>
          <strong>{selected.category}</strong>
        </div>
        <div>
          <span>Volume</span>
          <strong>1,284 m3</strong>
        </div>
        <div>
          <span>Clashes</span>
          <strong>{issues.length}</strong>
        </div>
      </div>

      <div className="inspector-actions">
        <button type="button" onClick={() => onIsolateSelected(selected.id)}>
          <SlidersHorizontal size={15} />
          Isolate
        </button>
        <button type="button" onClick={() => onAddIssue(selected.id)}>
          <MessageSquare size={15} />
          Add issue
        </button>
      </div>

      <section className="data-card issue-card">
        <SectionTitle icon={MessageSquare}>Issues</SectionTitle>
        <strong className="issue-count">{formatIssueCount(issues.length)}</strong>
        {issues.length > 0 ? (
          <div className="issue-list">
            {issues.map((issue) => (
              <article className="issue-item" key={issue.id}>
                <strong>{issue.title}</strong>
                <span>
                  {issue.severity} - {issue.status} - {issue.createdAt}
                </span>
                <button
                  type="button"
                  className="issue-resolve"
                  aria-label={`Resolve ${issue.title}`}
                  onClick={() => onResolveIssue(issue.id)}
                >
                  Resolve
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p>No issues logged for this object.</p>
        )}
      </section>

      <section className="data-card">
        <SectionTitle icon={Braces}>Metadata</SectionTitle>
        <code>
          IFC GUID: 3jK9fA92x
          <br />
          Phase: Construction
          <br />
          Owner: Coordination
        </code>
      </section>

      <section className="data-card">
        <SectionTitle icon={CheckCircle2}>Next Workflow</SectionTitle>
        <p>Backend should persist projects, raw files, converted GLB, extracted BIM metadata, annotations, and view states.</p>
      </section>
    </aside>
  )
}
