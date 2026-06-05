import { useState } from 'react'
import { baseObjects, initialUploads, projects, versionedObjects, versions } from '../data/mockData'
import { InspectorPanel } from '../features/inspector/InspectorPanel'
import { ProjectRail } from '../features/projects/ProjectRail'
import { ModelViewer } from '../features/viewer/ModelViewer'
import {
  ObjectPanel,
  type ObjectCategoryFilter,
  type ObjectLevelFilter,
  type ObjectStatusFilter,
} from '../features/viewer/ObjectPanel'
import type { CameraView, ModelIssue, ModelIssueSeverity, ModelIssueStatus, ModelObject, UploadItem } from '../types/domain'
import { formatBytes, getFileExtension, isBrowserLoadableModel } from '../utils/files'
import { Topbar } from './Topbar'
import '../styles/app.css'

const defaultCameraView: CameraView = {
  position: [8.8, 6.4, 8.6],
  target: [0, 0, 0],
  zoom: 1,
}

type SavedView = {
  id: string
  name: string
  projectId: string
  selectedId: string
  activeTool: string
  activeVersion: string
  cameraView: CameraView
  hiddenObjectIds: string[]
  createdAt: string
}

function App() {
  const [objects, setObjects] = useState(baseObjects)
  const [selectedId, setSelectedId] = useState(baseObjects[0].id)
  const [uploads, setUploads] = useState<UploadItem[]>(initialUploads)
  const [activeTool, setActiveTool] = useState('Select')
  const [activeProjectId, setActiveProjectId] = useState(projects[0].id)
  const [projectSearch, setProjectSearch] = useState('')
  const [objectSearch, setObjectSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ObjectCategoryFilter>('All')
  const [statusFilter, setStatusFilter] = useState<ObjectStatusFilter>('All')
  const [levelFilter, setLevelFilter] = useState<ObjectLevelFilter>('All')
  const [visibleOnly, setVisibleOnly] = useState(false)
  const [activeVersion, setActiveVersion] = useState(versions[1])
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [modelName, setModelName] = useState(versions[1])
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [viewName, setViewName] = useState('Coordination view')
  const [currentCameraView, setCurrentCameraView] = useState<CameraView>(defaultCameraView)
  const [cameraViewRequest, setCameraViewRequest] = useState<{ id: string; view: CameraView } | null>(null)
  const [issues, setIssues] = useState<ModelIssue[]>([])
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0]
  const selected = objects.find((object) => object.id === selectedId) ?? objects[0]
  const selectedIssues = issues.filter((issue) => issue.objectId === selected.id)
  const visibleCount = objects.filter((object) => object.visible).length

  const updateSelected = (updates: Partial<ModelObject>) => {
    setObjects((current) => current.map((object) => (object.id === selected.id ? { ...object, ...updates } : object)))
  }

  const moveObject = (id: string, position: ModelObject['position']) => {
    setObjects((current) =>
      current.map((object) =>
        object.id === id && object.position.some((value, index) => value !== position[index]) ? { ...object, position } : object,
      ),
    )
  }

  const selectAndMoveObject = (id: string) => {
    setSelectedId(id)
    setActiveTool('Move')
    setObjects((current) => current.map((object) => (object.id === id ? { ...object, visible: true } : object)))
    setActionMessage('Move tool ready')
  }

  const toggleObjectVisibility = (id: string) => {
    setObjects((current) => current.map((object) => (object.id === id ? { ...object, visible: !object.visible } : object)))
  }

  const isolateObject = (id: string) => {
    setObjects((current) => current.map((object) => ({ ...object, visible: object.id === id })))
  }

  const createObject = () => {
    const nextIndex = objects.length + 1
    const id = `custom-${Date.now()}`
    const nextObject: ModelObject = {
      id,
      name: `New Object ${nextIndex}`,
      category: 'Site',
      level: 'L00',
      status: 'Reviewed',
      color: '#b7c4cf',
      visible: true,
      progress: 0,
      position: [Math.min(3, nextIndex * 0.35), 0.7, -Math.min(2, nextIndex * 0.25)],
      scale: [1, 1, 1],
    }

    setObjects((current) => [...current, nextObject])
    setSelectedId(id)
    setObjectSearch('')
    setCategoryFilter('All')
    setStatusFilter('All')
    setLevelFilter('All')
    setVisibleOnly(false)
    setActionMessage('Object created')
  }

  const resetObjectFilters = () => {
    setObjectSearch('')
    setCategoryFilter('All')
    setStatusFilter('All')
    setLevelFilter('All')
    setVisibleOnly(false)
  }

  const addIssue = (id: string, details: { assignee: string; note: string; severity: ModelIssueSeverity }) => {
    const issueObject = objects.find((object) => object.id === id)
    const title = `${issueObject?.name ?? 'Model object'} coordination issue`

    setObjects((current) => current.map((object) => (object.id === id ? { ...object, status: 'Issue' } : object)))
    setIssues((current) => [
      {
        id: `issue-${Date.now()}`,
        objectId: id,
        title,
        severity: details.severity,
        status: 'Open',
        assignee: details.assignee.trim() || 'Unassigned',
        note: details.note.trim() || 'No note added.',
        viewContext: {
          version: activeVersion,
          tool: activeTool,
          cameraView: currentCameraView,
          objectPosition: issueObject?.position ?? [0, 0, 0],
        },
        createdAt: 'Today',
      },
      ...current,
    ])
    setActionMessage('Issue logged')
  }

  const updateIssueStatus = (id: string, status: ModelIssueStatus) => {
    const issue = issues.find((currentIssue) => currentIssue.id === id)

    setIssues((current) =>
      current.map((currentIssue) =>
        currentIssue.id === id
          ? {
              ...currentIssue,
              status,
              resolvedAt: status === 'Resolved' ? 'Today' : undefined,
            }
          : currentIssue,
      ),
    )

    if (issue) {
      const hasOtherOpenIssues = issues.some(
        (currentIssue) =>
          currentIssue.id !== id &&
          currentIssue.objectId === issue.objectId &&
          (status !== 'Resolved' || currentIssue.status !== 'Resolved'),
      )

      if (status === 'Resolved' && !hasOtherOpenIssues) {
        setObjects((current) =>
          current.map((object) => (object.id === issue.objectId ? { ...object, status: 'Reviewed' } : object)),
        )
      } else if (status !== 'Resolved') {
        setObjects((current) =>
          current.map((object) => (object.id === issue.objectId ? { ...object, status: 'Issue' } : object)),
        )
      }
    }

    setActionMessage(status === 'Resolved' ? 'Issue resolved' : `Issue ${status.toLowerCase()}`)
  }

  const loadVersionObjects = (version: string) => {
    const nextObjects = versionedObjects[version] ?? baseObjects
    const nextObjectIds = new Set(nextObjects.map((object) => object.id))

    setObjects(nextObjects)
    setSelectedId(nextObjects[0]?.id ?? baseObjects[0].id)
    setIssues((current) => current.filter((issue) => nextObjectIds.has(issue.objectId)))
    resetObjectFilters()
  }

  const selectVersion = (version: string) => {
    setActiveVersion(version)
    setModelName(version)
    setModelUrl(null)
    loadVersionObjects(version)
    setActiveTool('Select')
    setActionMessage(`${version} loaded`)
  }

  const syncModelState = () => {
    const syncedVersion = versions[1]
    setObjects(versionedObjects[syncedVersion] ?? baseObjects)
    setIssues([])
    setSelectedId((versionedObjects[syncedVersion] ?? baseObjects)[0].id)
    setActiveTool('Select')
    setActiveVersion(syncedVersion)
    setModelName(syncedVersion)
    setModelUrl(null)
    setCurrentCameraView(defaultCameraView)
    setCameraViewRequest({ id: `sync-${Date.now()}`, view: defaultCameraView })
    resetObjectFilters()
    setActionMessage('Synced latest model state')
  }

  const shareView = () => {
    setActionMessage('Share link ready')
  }

  const saveView = () => {
    const hiddenObjectIds = objects.filter((object) => !object.visible).map((object) => object.id)
    const name = viewName.trim() || `View ${savedViews.length + 1}`

    setSavedViews((current) => [
      {
        id: `view-${Date.now()}`,
        name,
        projectId: activeProjectId,
        selectedId,
        activeTool,
        activeVersion,
        cameraView: currentCameraView,
        hiddenObjectIds,
        createdAt: 'Today',
      },
      ...current,
    ])
    setActionMessage(`${name} saved`)
  }

  const loadSavedView = (view: SavedView) => {
    const versionObjects = versionedObjects[view.activeVersion] ?? baseObjects

    setActiveProjectId(view.projectId)
    setSelectedId(view.selectedId)
    setActiveTool(view.activeTool)
    setActiveVersion(view.activeVersion)
    setModelName(view.activeVersion)
    setModelUrl(null)
    setObjects(
      versionObjects.map((object) => ({
        ...object,
        visible: !view.hiddenObjectIds.includes(object.id),
      })),
    )
    setCameraViewRequest({ id: view.id, view: view.cameraView })
    setActionMessage(`${view.name} loaded`)
  }

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) {
      return
    }

    const nextUploads = Array.from(files).map((file) => {
      const ext = getFileExtension(file.name)
      const state: UploadItem['state'] = isBrowserLoadableModel(ext) ? 'Converted' : 'Queued'

      if (isBrowserLoadableModel(ext)) {
        setModelUrl(URL.createObjectURL(file))
        setModelName(file.name)
      }

      return {
        id: `${file.name}-${file.lastModified}`,
        name: file.name,
        type: ext.replace('.', '').toUpperCase(),
        size: formatBytes(file.size),
        state,
      }
    })

    setUploads((current) => [...nextUploads, ...current])
  }

  return (
    <main className="app-shell">
      <ProjectRail
        projects={projects}
        uploads={uploads}
        activeProjectId={activeProjectId}
        searchQuery={projectSearch}
        onProjectSelected={setActiveProjectId}
        onSearchProjects={setProjectSearch}
        onFilesSelected={handleFiles}
      />

      <section className="workspace">
        <Topbar
          projectName={activeProject.name}
          projectSite={activeProject.site}
          savedViewCount={savedViews.length}
          viewName={viewName}
          actionMessage={actionMessage}
          onViewNameChange={setViewName}
          onSync={syncModelState}
          onShare={shareView}
          onSaveView={saveView}
        />

        {savedViews.length > 0 ? (
          <div className="saved-view-strip" aria-label="Saved views">
            {savedViews.map((view) => (
              <button type="button" key={view.id} onClick={() => loadSavedView(view)}>
                <strong>{view.name}</strong>
                <span>
                  {view.activeVersion} - {view.createdAt}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="editor-grid">
          <ObjectPanel
            objects={objects}
            selectedId={selectedId}
            visibleCount={visibleCount}
            objectSearch={objectSearch}
            categoryFilter={categoryFilter}
            statusFilter={statusFilter}
            levelFilter={levelFilter}
            visibleOnly={visibleOnly}
            onSelect={setSelectedId}
            onToggleVisibility={toggleObjectVisibility}
            onObjectSearch={setObjectSearch}
            onCategoryFilter={setCategoryFilter}
            onStatusFilter={setStatusFilter}
            onLevelFilter={setLevelFilter}
            onVisibleOnly={setVisibleOnly}
            onResetFilters={resetObjectFilters}
            onCreateObject={createObject}
            onSelectAndMove={selectAndMoveObject}
          />
          <ModelViewer
            objects={objects}
            selectedId={selectedId}
            modelName={modelName}
            modelUrl={modelUrl}
            activeTool={activeTool}
            activeVersion={activeVersion}
            cameraViewRequest={cameraViewRequest}
            onSelectObject={setSelectedId}
            onSelectTool={setActiveTool}
            onSelectVersion={selectVersion}
            onMoveObject={moveObject}
            onCameraViewChange={setCurrentCameraView}
          />
          <InspectorPanel
            selected={selected}
            issues={selectedIssues}
            onUpdateSelected={updateSelected}
            onIsolateSelected={isolateObject}
            onAddIssue={addIssue}
            onUpdateIssueStatus={updateIssueStatus}
          />
        </div>
      </section>
    </main>
  )
}

export default App
