import { Eye, EyeOff, Plus } from 'lucide-react'
import type { ModelObject } from '../../types/domain'

type ObjectPanelProps = {
  objects: ModelObject[]
  selectedId: string
  visibleCount: number
  onSelect: (id: string) => void
}

export function ObjectPanel({ objects, selectedId, visibleCount, onSelect }: ObjectPanelProps) {
  return (
    <aside className="object-panel">
      <div className="panel-header">
        <div>
          <span>Objects</span>
          <strong>{visibleCount} visible</strong>
        </div>
        <button type="button" title="New group">
          <Plus size={16} />
        </button>
      </div>
      <div className="object-list">
        {objects.map((object) => (
          <button
            className={`object-row ${object.id === selectedId ? 'is-selected' : ''}`}
            key={object.id}
            onClick={() => onSelect(object.id)}
          >
            <span className="object-swatch" style={{ background: object.color }} />
            <div>
              <strong>{object.name}</strong>
              <small>
                {object.category} - {object.level}
              </small>
            </div>
            {object.visible ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
        ))}
      </div>
    </aside>
  )
}
