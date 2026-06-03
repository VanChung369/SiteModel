import { Eye, EyeOff, Move3D, Plus, Search } from 'lucide-react'
import type { ModelObject, ModelObjectCategory, ModelObjectStatus } from '../../types/domain'

export type ObjectCategoryFilter = ModelObjectCategory | 'All'
export type ObjectStatusFilter = ModelObjectStatus | 'All'

type ObjectPanelProps = {
  objects: ModelObject[]
  selectedId: string
  visibleCount: number
  objectSearch: string
  categoryFilter: ObjectCategoryFilter
  statusFilter: ObjectStatusFilter
  onSelect: (id: string) => void
  onToggleVisibility: (id: string) => void
  onObjectSearch: (query: string) => void
  onCategoryFilter: (category: ObjectCategoryFilter) => void
  onStatusFilter: (status: ObjectStatusFilter) => void
  onCreateObject: () => void
  onSelectAndMove: (id: string) => void
}

const categoryOptions: ObjectCategoryFilter[] = ['All', 'Structural', 'Envelope', 'MEP', 'Site']
const statusOptions: ObjectStatusFilter[] = ['All', 'Reviewed', 'Changed', 'Issue']

export function ObjectPanel({
  objects,
  selectedId,
  visibleCount,
  objectSearch,
  categoryFilter,
  statusFilter,
  onSelect,
  onToggleVisibility,
  onObjectSearch,
  onCategoryFilter,
  onStatusFilter,
  onCreateObject,
  onSelectAndMove,
}: ObjectPanelProps) {
  const normalizedSearch = objectSearch.trim().toLowerCase()
  const filteredObjects = objects.filter((object) => {
    const matchesSearch = normalizedSearch
      ? [object.name, object.category, object.level, object.status].some((value) => value.toLowerCase().includes(normalizedSearch))
      : true
    const matchesCategory = categoryFilter === 'All' || object.category === categoryFilter
    const matchesStatus = statusFilter === 'All' || object.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <aside className="object-panel">
      <div className="panel-header">
        <div>
          <span>Objects</span>
          <strong>{visibleCount} visible</strong>
        </div>
        <button type="button" aria-label="Create object" title="Create object" onClick={onCreateObject}>
          <Plus size={16} />
        </button>
      </div>

      <div className="object-filters">
        <label className="object-search">
          <Search size={14} />
          <input
            aria-label="Search objects"
            placeholder="Search objects"
            type="search"
            value={objectSearch}
            onChange={(event) => onObjectSearch(event.currentTarget.value)}
          />
        </label>
        <label>
          <span>Category</span>
          <select
            value={categoryFilter}
            onChange={(event) => onCategoryFilter(event.currentTarget.value as ObjectCategoryFilter)}
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => onStatusFilter(event.currentTarget.value as ObjectStatusFilter)}>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="object-list">
        {filteredObjects.map((object) => (
          <div
            className={`object-row ${object.id === selectedId ? 'is-selected' : ''}`}
            key={object.id}
          >
            <button type="button" className="object-select" onClick={() => onSelect(object.id)}>
              <span className="object-swatch" style={{ background: object.color }} />
              <span className="object-copy">
                <strong>{object.name}</strong>
                <small>
                  {object.category} - {object.level}
                </small>
              </span>
            </button>
            <button
              type="button"
              className="row-icon-button"
              aria-label={`Select and move ${object.name}`}
              title={`Select and move ${object.name}`}
              onClick={() => onSelectAndMove(object.id)}
            >
              <Move3D size={15} />
            </button>
            <button
              type="button"
              className="row-icon-button"
              aria-label={`${object.visible ? 'Hide' : 'Show'} ${object.name}`}
              title={`${object.visible ? 'Hide' : 'Show'} ${object.name}`}
              onClick={() => onToggleVisibility(object.id)}
            >
              {object.visible ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          </div>
        ))}
        {filteredObjects.length === 0 ? <p className="empty-state">No objects match these filters.</p> : null}
      </div>
    </aside>
  )
}
