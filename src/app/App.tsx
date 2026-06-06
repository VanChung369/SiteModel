import { useCallback, useEffect, useRef, useState } from 'react'
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
import type {
  CameraView,
  ModelIssue,
  ModelIssueSeverity,
  ModelIssueStatus,
  ModelObject,
  SavedView,
  UploadItem,
} from '../types/domain'
import { advanceConversionQueue, createUploadItem, retryConversionJob } from '../utils/conversionQueue'
import { getFileExtension, isBrowserLoadableModel } from '../utils/files'
import { getProjectPermissions } from '../utils/permissions'
import { createShareUrl, parseShareHash } from '../utils/shareLink'
import { clearWorkspaceSnapshot, loadWorkspaceSnapshot, saveWorkspaceSnapshot } from '../utils/workspaceStorage'
import { Topbar } from './Topbar'
import '../styles/app.css'

const defaultCameraView: CameraView = {
  position: [8.8, 6.4, 8.6],
  target: [0, 0, 0],
  zoom: 1,
}

const viewerToolNames = new Set(['Select', 'Move', 'Rotate', 'Scale', 'Measure', 'Layers', 'Fit'])

function App() {
  const viewRequestIndexRef = useRef(0)
  const [initialSharedView] = useState(() => parseShareHash())
  const [initialSnapshot] = useState(() => loadWorkspaceSnapshot())
  const requestedInitialVersion = initialSharedView?.activeVersion ?? initialSnapshot?.activeVersion
  const initialVersion = requestedInitialVersion && versions.includes(requestedInitialVersion) ? requestedInitialVersion : versions[1]
  const initialVersionObjects = versionedObjects[initialVersion] ?? baseObjects
  const initialObjects = initialSharedView
    ? initialVersionObjects.map((object) => ({
        ...object,
        visible: !initialSharedView.hiddenObjectIds.includes(object.id),
      }))
    : initialSnapshot?.objects.length
      ? initialSnapshot.objects
      : baseObjects
  const initialProjectId = initialSharedView && projects.some((project) => project.id === initialSharedView.projectId)
    ? initialSharedView.projectId
    : initialSnapshot && projects.some((project) => project.id === initialSnapshot.activeProjectId)
      ? initialSnapshot.activeProjectId
      : projects[0].id
  const requestedInitialSelectedId = initialSharedView?.selectedId ?? initialSnapshot?.selectedId
  const initialSelectedId = requestedInitialSelectedId && initialObjects.some((object) => object.id === requestedInitialSelectedId)
    ? requestedInitialSelectedId
    : initialObjects[0].id
  const requestedInitialTool = initialSharedView?.activeTool ?? initialSnapshot?.activeTool
  const initialActiveTool = requestedInitialTool && viewerToolNames.has(requestedInitialTool) ? requestedInitialTool : 'Select'
  const initialModelName = initialSharedView ? initialVersion : initialSnapshot?.modelName ?? initialVersion
  const initialCameraView = initialSharedView?.cameraView ?? initialSnapshot?.currentCameraView ?? defaultCameraView
  const initialShareUrl = initialSharedView && typeof window !== 'undefined' ? window.location.href : null
  const initialActionMessage = initialSharedView ? 'Shared view loaded' : null

  const [objects, setObjects] = useState(initialObjects)
  const [selectedId, setSelectedId] = useState(initialSelectedId)
  const [uploads, setUploads] = useState<UploadItem[]>(initialSnapshot?.uploads ?? initialUploads)
  const [activeTool, setActiveTool] = useState(initialActiveTool)
  const [activeProjectId, setActiveProjectId] = useState(initialProjectId)
  const [projectSearch, setProjectSearch] = useState('')
  const [objectSearch, setObjectSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ObjectCategoryFilter>('All')
  const [statusFilter, setStatusFilter] = useState<ObjectStatusFilter>('All')
  const [levelFilter, setLevelFilter] = useState<ObjectLevelFilter>('All')
  const [visibleOnly, setVisibleOnly] = useState(false)
  const [activeVersion, setActiveVersion] = useState(initialVersion)
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [modelName, setModelName] = useState(initialModelName)
  const [savedViews, setSavedViews] = useState<SavedView[]>(initialSnapshot?.savedViews ?? [])
  const [viewName, setViewName] = useState(initialSnapshot?.viewName ?? 'Coordination view')
  const [currentCameraView, setCurrentCameraView] = useState<CameraView>(initialCameraView)
  const [cameraViewRequest, setCameraViewRequest] = useState<{ id: string; view: CameraView } | null>(
    initialSharedView ? { id: 'shared-initial', view: initialSharedView.cameraView } : null,
  )
  const [issues, setIssues] = useState<ModelIssue[]>(initialSnapshot?.issues ?? [])
  const [actionMessage, setActionMessage] = useState<string | null>(initialActionMessage)
  const [shareUrl, setShareUrl] = useState<string | null>(initialShareUrl)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('sitemodel.theme')
    return (saved === 'light' || saved === 'dark') ? saved : 'dark'
  })
  const [projectRailCollapsed, setProjectRailCollapsed] = useState(false)
  const [objectPanelCollapsed, setObjectPanelCollapsed] = useState(false)
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('theme-dark')
      root.classList.remove('theme-light')
    } else {
      root.classList.add('theme-light')
      root.classList.remove('theme-dark')
    }
    localStorage.setItem('sitemodel.theme', theme)
  }, [theme])

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0]
  const permissions = getProjectPermissions(activeProject.role)
  const selected = objects.find((object) => object.id === selectedId) ?? objects[0]
  const selectedIssues = issues.filter((issue) => issue.objectId === selected.id)
  const visibleCount = objects.filter((object) => object.visible).length
  const openIssueTotal = issues.filter((issue) => issue.status !== 'Resolved').length

  useEffect(() => {
    const saveTimer = window.setTimeout(() => {
      saveWorkspaceSnapshot({
        objects,
        selectedId,
        uploads,
        activeTool,
        activeProjectId,
        activeVersion,
        modelName,
        savedViews,
        viewName,
        currentCameraView,
        issues,
      })
    }, 250)

    return () => window.clearTimeout(saveTimer)
  }, [
    activeProjectId,
    activeTool,
    activeVersion,
    currentCameraView,
    issues,
    modelName,
    objects,
    savedViews,
    selectedId,
    uploads,
    viewName,
  ])

  useEffect(() => {
    const hasActiveConversion = uploads.some((upload) => upload.state === 'Queued' || upload.state === 'Converting')

    if (!hasActiveConversion) {
      return
    }

    const conversionTimer = window.setInterval(() => {
      setUploads((current) => advanceConversionQueue(current))
    }, 700)

    return () => window.clearInterval(conversionTimer)
  }, [uploads])

  const updateSelected = (updates: Partial<ModelObject>) => {
    if (!permissions.canEditModel) {
      setActionMessage('Viewer role is read-only')
      return
    }

    setObjects((current) => current.map((object) => (object.id === selected.id ? { ...object, ...updates } : object)))
  }

  const moveObject = (
    id: string,
    position: ModelObject['position'],
    rotation?: ModelObject['rotation'],
    scale?: ModelObject['scale']
  ) => {
    if (!permissions.canEditModel) {
      return
    }

    setObjects((current) =>
      current.map((object) => {
        if (object.id !== id) return object

        const hasPositionChange = object.position.some((val, idx) => val !== position[idx])
        const hasRotationChange = rotation && (!object.rotation || object.rotation.some((val, idx) => val !== rotation[idx]))
        const hasScaleChange = scale && object.scale.some((val, idx) => val !== scale[idx])

        if (hasPositionChange || hasRotationChange || hasScaleChange) {
          const updated = { ...object, position }
          if (rotation) updated.rotation = rotation
          if (scale) updated.scale = scale
          return updated
        }
        return object
      })
    )
  }

  const selectAndMoveObject = (id: string) => {
    if (!permissions.canEditModel) {
      setSelectedId(id)
      setActionMessage('Viewer role cannot move objects')
      return
    }

    setSelectedId(id)
    setActiveTool('Move')
    setObjects((current) => current.map((object) => (object.id === id ? { ...object, visible: true } : object)))
    setActionMessage('Move tool ready')
  }

  const toggleObjectVisibility = (id: string) => {
    if (!permissions.canEditModel) {
      setActionMessage('Viewer role cannot change visibility')
      return
    }

    setObjects((current) => current.map((object) => (object.id === id ? { ...object, visible: !object.visible } : object)))
  }

  const isolateObject = (id: string) => {
    if (!permissions.canEditModel) {
      setActionMessage('Viewer role cannot isolate objects')
      return
    }

    setObjects((current) => current.map((object) => ({ ...object, visible: object.id === id })))
  }

  const deleteObject = useCallback((id: string) => {
    if (!permissions.canEditModel) {
      setActionMessage('Viewer role is read-only')
      return
    }

    setObjects((current) => {
      const remaining = current.filter((object) => object.id !== id)
      if (selectedId === id) {
        setSelectedId(remaining[0]?.id ?? '')
      }
      return remaining
    })

    setIssues((current) => current.filter((issue) => issue.objectId !== id))
    setActionMessage('Object deleted')
  }, [permissions.canEditModel, selectedId])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete') {
        const target = e.target as HTMLElement
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }
        if (selectedId && permissions.canEditModel) {
          deleteObject(selectedId)
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [deleteObject, selectedId, permissions.canEditModel])

  const createObject = () => {
    if (!permissions.canEditModel) {
      setActionMessage('Viewer role cannot create objects')
      return
    }

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
      metadata: {
        ifcGuid: `local-${id}`,
        phase: 'Draft',
        owner: 'Coordination',
        volumeM3: 1000,
        clashes: 0,
      },
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
    if (!permissions.canManageIssues) {
      setActionMessage('Viewer role cannot add issues')
      return
    }

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
    if (!permissions.canManageIssues) {
      setActionMessage('Viewer role cannot update issues')
      return
    }

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

  const restoreIssueView = (id: string) => {
    const issue = issues.find((currentIssue) => currentIssue.id === id)

    if (!issue) {
      setActionMessage('Issue view unavailable')
      return
    }

    applyViewState({
      projectId: activeProjectId,
      selectedId: issue.objectId,
      activeTool: issue.viewContext.tool,
      activeVersion: issue.viewContext.version,
      cameraView: issue.viewContext.cameraView,
      hiddenObjectIds: [],
    })
    setActionMessage('Issue view restored')
  }

  const loadVersionObjects = (version: string) => {
    const nextObjects = versionedObjects[version] ?? baseObjects
    const nextObjectIds = new Set(nextObjects.map((object) => object.id))

    setObjects(nextObjects)
    setSelectedId(nextObjects[0]?.id ?? baseObjects[0].id)
    setIssues((current) => current.filter((issue) => nextObjectIds.has(issue.objectId)))
    resetObjectFilters()
  }

  const applyViewState = (view: {
    projectId: string
    selectedId: string
    activeTool: string
    activeVersion: string
    cameraView: CameraView
    hiddenObjectIds: string[]
  }) => {
    const versionObjects = versionedObjects[view.activeVersion] ?? baseObjects
    const selectedObject = versionObjects.find((object) => object.id === view.selectedId) ?? versionObjects[0] ?? baseObjects[0]

    setActiveProjectId(projects.some((project) => project.id === view.projectId) ? view.projectId : projects[0].id)
    setSelectedId(selectedObject.id)
    setActiveTool(viewerToolNames.has(view.activeTool) ? view.activeTool : 'Select')
    setActiveVersion(versions.includes(view.activeVersion) ? view.activeVersion : versions[1])
    setModelName(versions.includes(view.activeVersion) ? view.activeVersion : versions[1])
    setModelUrl(null)
    setObjects(
      versionObjects.map((object) => ({
        ...object,
        visible: !view.hiddenObjectIds.includes(object.id),
      })),
    )
    setCurrentCameraView(view.cameraView)
    viewRequestIndexRef.current += 1
    setCameraViewRequest({ id: `view-${viewRequestIndexRef.current}`, view: view.cameraView })
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
    if (!permissions.canSync) {
      setActionMessage('Viewer role cannot sync model state')
      return
    }

    const syncedVersion = versions[1]
    clearWorkspaceSnapshot()
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
    const nextShareUrl = createShareUrl({
      projectId: activeProjectId,
      selectedId,
      activeTool,
      activeVersion,
      cameraView: currentCameraView,
      hiddenObjectIds: objects.filter((object) => !object.visible).map((object) => object.id),
    })

    window.history.replaceState(null, '', nextShareUrl)
    setShareUrl(nextShareUrl)
    setActionMessage('Share link ready')

    void navigator.clipboard?.writeText(nextShareUrl).catch(() => undefined)
  }

  const saveView = () => {
    if (!permissions.canSaveView) {
      setActionMessage('Viewer role cannot save views')
      return
    }

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
    applyViewState(view)
    setActionMessage(`${view.name} loaded`)
  }

  const handleFiles = (files: FileList | null) => {
    if (!permissions.canImport) {
      setActionMessage('Viewer role cannot import files')
      return
    }

    if (!files?.length) {
      return
    }

    const nextUploads = Array.from(files).map((file) => {
      const ext = getFileExtension(file.name)

      if (isBrowserLoadableModel(ext)) {
        setModelUrl(URL.createObjectURL(file))
        setModelName(file.name)
      }

      return createUploadItem(file)
    })

    setUploads((current) => [...nextUploads, ...current])
  }

  const retryUploadConversion = (id: string) => {
    if (!permissions.canImport) {
      setActionMessage('Viewer role cannot retry imports')
      return
    }

    setUploads((current) => retryConversionJob(current, id))
  }

  return (
    <main className={`app-shell ${projectRailCollapsed ? 'is-project-rail-collapsed' : ''}`}>
      <ProjectRail
        projects={projects}
        uploads={uploads}
        activeProjectId={activeProjectId}
        permissions={permissions}
        searchQuery={projectSearch}
        collapsed={projectRailCollapsed}
        onProjectSelected={setActiveProjectId}
        onSearchProjects={setProjectSearch}
        onFilesSelected={handleFiles}
        onRetryConversion={retryUploadConversion}
        onToggleCollapsed={() => setProjectRailCollapsed((current) => !current)}
      />

      <section className="workspace">
        <Topbar
          projectName={activeProject.name}
          projectSite={activeProject.site}
          projectRole={activeProject.role}
          permissions={permissions}
          savedViewCount={savedViews.length}
          viewName={viewName}
          actionMessage={actionMessage}
          shareUrl={shareUrl}
          onViewNameChange={setViewName}
          onSync={syncModelState}
          onShare={shareView}
          onSaveView={saveView}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
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

        {issues.length > 0 ? (
          <section className="issue-register-strip" aria-label="Issue register">
            <div>
              <span>Issue register</span>
              <strong>{openIssueTotal} open</strong>
            </div>
            {issues.map((issue) => {
              const issueObject = objects.find((object) => object.id === issue.objectId)

              return (
                <button type="button" key={issue.id} onClick={() => restoreIssueView(issue.id)}>
                  <strong>{issueObject?.name ?? issue.title}</strong>
                  <span>
                    {issue.severity} - {issue.status} - {issue.viewContext.version}
                  </span>
                </button>
              )
            })}
          </section>
        ) : null}

        <div
          className={`editor-grid ${objectPanelCollapsed ? 'is-object-panel-collapsed' : ''} ${
            inspectorCollapsed ? 'is-inspector-collapsed' : ''
          }`}
        >
          <ObjectPanel
            objects={objects}
            selectedId={selectedId}
            canEditModel={permissions.canEditModel}
            visibleCount={visibleCount}
            objectSearch={objectSearch}
            categoryFilter={categoryFilter}
            statusFilter={statusFilter}
            levelFilter={levelFilter}
            visibleOnly={visibleOnly}
            collapsed={objectPanelCollapsed}
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
            onDeleteObject={deleteObject}
            onToggleCollapsed={() => setObjectPanelCollapsed((current) => !current)}
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
            canEditModel={permissions.canEditModel}
            canManageIssues={permissions.canManageIssues}
            collapsed={inspectorCollapsed}
            onUpdateSelected={updateSelected}
            onIsolateSelected={isolateObject}
            onAddIssue={addIssue}
            onUpdateIssueStatus={updateIssueStatus}
            onRestoreIssueView={restoreIssueView}
            onDeleteObject={deleteObject}
            onToggleCollapsed={() => setInspectorCollapsed((current) => !current)}
          />
        </div>
      </section>
    </main>
  )
}

export default App
