import { Box, Braces, CheckCircle2, Eye, EyeOff, MessageSquare, SlidersHorizontal } from 'lucide-react'
import { SectionTitle } from '../../components/SectionTitle'
import type { ModelObject } from '../../types/domain'

type InspectorPanelProps = {
  selected: ModelObject
  onUpdateSelected: (updates: Partial<ModelObject>) => void
}

export function InspectorPanel({ selected, onUpdateSelected }: InspectorPanelProps) {
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
          <strong>{selected.status === 'Issue' ? 4 : 0}</strong>
        </div>
      </div>

      <div className="inspector-actions">
        <button type="button">
          <SlidersHorizontal size={15} />
          Isolate
        </button>
        <button type="button">
          <MessageSquare size={15} />
          Add issue
        </button>
      </div>

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
