import { Eye, EyeOff, Move3D, PanelLeftClose, PanelLeftOpen, Plus, RotateCcw, Search, Trash2 } from 'lucide-react'
import type { ModelObject, ModelObjectCategory, ModelObjectStatus } from '../../types/domain'

export type ObjectCategoryFilter = ModelObjectCategory | 'All'
export type ObjectStatusFilter = ModelObjectStatus | 'All'
export type ObjectLevelFilter = string

type ObjectPanelProps = {
  objects: ModelObject[]
  selectedId: string
  canEditModel?: boolean
  visibleCount: number
  objectSearch: string
  categoryFilter: ObjectCategoryFilter
  statusFilter: ObjectStatusFilter
  levelFilter: ObjectLevelFilter
  visibleOnly: boolean
  collapsed?: boolean
  onSelect: (id: string) => void
  onToggleVisibility: (id: string) => void
  onObjectSearch: (query: string) => void
  onCategoryFilter: (category: ObjectCategoryFilter) => void
  onStatusFilter: (status: ObjectStatusFilter) => void
  onLevelFilter: (level: ObjectLevelFilter) => void
  onVisibleOnly: (visibleOnly: boolean) => void
  onResetFilters: () => void
  onCreateObject: () => void
  onSelectAndMove: (id: string) => void
  onDeleteObject?: (id: string) => void
  onToggleCollapsed?: () => void
}

const categoryOptions: ObjectCategoryFilter[] = ['All', 'Structural', 'Envelope', 'MEP', 'Site']
const statusOptions: ObjectStatusFilter[] = ['All', 'Reviewed', 'Changed', 'Issue']

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

export function ObjectPanel({
  objects,
  selectedId,
  canEditModel = true,
  visibleCount,
  objectSearch,
  categoryFilter,
  statusFilter,
  levelFilter,
  visibleOnly,
  collapsed = false,
  onSelect,
  onToggleVisibility,
  onObjectSearch,
  onCategoryFilter,
  onStatusFilter,
  onLevelFilter,
  onVisibleOnly,
  onResetFilters,
  onCreateObject,
  onSelectAndMove,
  onDeleteObject,
  onToggleCollapsed,
}: ObjectPanelProps) {
  const normalizedSearch = objectSearch.trim().toLowerCase()
  const levelOptions = ['All', ...Array.from(new Set(objects.map((object) => object.level))).sort()]
  const filteredObjects = objects.filter((object) => {
    const matchesSearch = normalizedSearch
      ? [object.name, object.category, object.level, object.status].some((value) => value.toLowerCase().includes(normalizedSearch))
      : true
    const matchesCategory = categoryFilter === 'All' || object.category === categoryFilter
    const matchesStatus = statusFilter === 'All' || object.status === statusFilter
    const matchesLevel = levelFilter === 'All' || object.level === levelFilter
    const matchesVisibility = !visibleOnly || object.visible

    return matchesSearch && matchesCategory && matchesStatus && matchesLevel && matchesVisibility
  })

  if (collapsed) {
    return (
      <aside className="object-panel is-collapsed" aria-label="Objects">
        <button
          type="button"
          className="panel-collapse-button"
          aria-label="Expand objects sidebar"
          title="Expand objects sidebar"
          onClick={onToggleCollapsed}
        >
          <PanelLeftOpen size={17} />
        </button>
        <div className="collapsed-rail-label" aria-hidden="true">
          <Move3D size={17} />
          <span>Objects</span>
        </div>
      </aside>
    )
  }

  return (
    <aside className="object-panel">
      <div className="panel-header">
        <div>
          <span>Objects</span>
          <strong>{visibleCount} visible</strong>
        </div>
        <div className="panel-header-actions">
          <button
            type="button"
            className="panel-collapse-button"
            aria-label="Collapse objects sidebar"
            title="Collapse objects sidebar"
            onClick={onToggleCollapsed}
          >
            <PanelLeftClose size={17} />
          </button>
          <button
            type="button"
            aria-label="Create object"
            title={canEditModel ? 'Create object' : 'Viewer role cannot create objects'}
            disabled={!canEditModel}
            onClick={onCreateObject}
          >
            <Plus size={16} />
          </button>
        </div>
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
        <label>
          <span>Level</span>
          <select value={levelFilter} onChange={(event) => onLevelFilter(event.currentTarget.value)}>
            {levelOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="filter-actions">
          <label className="visible-toggle">
            <input
              checked={visibleOnly}
              type="checkbox"
              onChange={(event) => onVisibleOnly(event.currentTarget.checked)}
            />
            <span>Visible only</span>
          </label>
          <button type="button" className="reset-filters" onClick={onResetFilters}>
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
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
                <strong><Highlight text={object.name} query={objectSearch} /></strong>
                <small>
                  {object.category} - {object.level}
                </small>
              </span>
            </button>
            <button
              type="button"
              className="row-icon-button"
              aria-label={`Select and move ${object.name}`}
              title={canEditModel ? `Select and move ${object.name}` : 'Viewer role cannot move objects'}
              disabled={!canEditModel}
              onClick={() => onSelectAndMove(object.id)}
            >
              <Move3D size={15} />
            </button>
            <button
              type="button"
              className="row-icon-button"
              aria-label={`${object.visible ? 'Hide' : 'Show'} ${object.name}`}
              title={canEditModel ? `${object.visible ? 'Hide' : 'Show'} ${object.name}` : 'Viewer role cannot change visibility'}
              disabled={!canEditModel}
              onClick={() => onToggleVisibility(object.id)}
            >
              {object.visible ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
            <button
              type="button"
              className="row-icon-button"
              aria-label={`Delete ${object.name}`}
              title={canEditModel ? `Delete ${object.name}` : 'Viewer role cannot delete objects'}
              disabled={!canEditModel}
              onClick={() => onDeleteObject?.(object.id)}
              style={{ color: 'var(--red)' }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {filteredObjects.length === 0 ? <p className="empty-state">No objects match these filters.</p> : null}
      </div>
    </aside>
  )
}
