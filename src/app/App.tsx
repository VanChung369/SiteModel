import { useState } from 'react'
import { baseObjects, initialUploads, projects, versions } from '../data/mockData'
import { InspectorPanel } from '../features/inspector/InspectorPanel'
import { ProjectRail } from '../features/projects/ProjectRail'
import { ModelViewer } from '../features/viewer/ModelViewer'
import { ObjectPanel, type ObjectCategoryFilter, type ObjectStatusFilter } from '../features/viewer/ObjectPanel'
import type { ModelIssue, ModelObject, UploadItem } from '../types/domain'
import { formatBytes, getFileExtension, isBrowserLoadableModel } from '../utils/files'
import { Topbar } from './Topbar'
import '../styles/app.css'

type SavedView = {
  id: string
  projectId: string
  selectedId: string
  activeTool: string
  activeVersion: string
  hiddenObjectIds: string[]
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
  const [activeVersion, setActiveVersion] = useState(versions[1])
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [modelName, setModelName] = useState(versions[1])
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [issues, setIssues] = useState<ModelIssue[]>([])
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0]
  const selected = objects.find((object) => object.id === selectedId) ?? objects[0]
  const selectedIssues = issues.filter((issue) => issue.objectId === selected.id && issue.status !== 'Resolved')
  const visibleCount = objects.filter((object) => object.visible).length

  const updateSelected = (updates: Partial<ModelObject>) => {
    setObjects((current) => current.map((object) => (object.id === selected.id ? { ...object, ...updates } : object)))
  }

  const moveObject = (id: string, position: ModelObject['position']) => {
    setObjects((current) => current.map((object) => (object.id === id ? { ...object, position } : object)))
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
    setActionMessage('Object created')
  }

  const addIssue = (id: string) => {
    const issueObject = objects.find((object) => object.id === id)

    setObjects((current) => current.map((object) => (object.id === id ? { ...object, status: 'Issue' } : object)))
    setIssues((current) => [
      {
        id: `issue-${Date.now()}`,
        objectId: id,
        title: `${issueObject?.name ?? 'Model object'} coordination issue`,
        severity: 'High',
        status: 'Open',
        createdAt: 'Today',
      },
      ...current,
    ])
    setActionMessage('Issue logged')
  }

  const resolveIssue = (id: string) => {
    const issue = issues.find((currentIssue) => currentIssue.id === id)

    setIssues((current) =>
      current.map((currentIssue) => (currentIssue.id === id ? { ...currentIssue, status: 'Resolved' } : currentIssue)),
    )

    if (issue) {
      const hasOtherOpenIssues = issues.some(
        (currentIssue) => currentIssue.id !== id && currentIssue.objectId === issue.objectId && currentIssue.status !== 'Resolved',
      )

      if (!hasOtherOpenIssues) {
        setObjects((current) =>
          current.map((object) => (object.id === issue.objectId ? { ...object, status: 'Reviewed' } : object)),
        )
      }
    }

    setActionMessage('Issue resolved')
  }

  const selectVersion = (version: string) => {
    setActiveVersion(version)
    setModelName(version)
  }

  const syncModelState = () => {
    setObjects(baseObjects)
    setIssues([])
    setSelectedId(baseObjects[0].id)
    setActiveTool('Select')
    setActiveVersion(versions[1])
    setModelName(modelUrl ? modelName : versions[1])
    setActionMessage('Synced latest model state')
  }

  const shareView = () => {
    setActionMessage('Share link ready')
  }

  const saveView = () => {
    const hiddenObjectIds = objects.filter((object) => !object.visible).map((object) => object.id)

    setSavedViews((current) => [
      {
        id: `view-${Date.now()}`,
        projectId: activeProjectId,
        selectedId,
        activeTool,
        activeVersion,
        hiddenObjectIds,
      },
      ...current,
    ])
    setActionMessage('View saved')
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
          actionMessage={actionMessage}
          onSync={syncModelState}
          onShare={shareView}
          onSaveView={saveView}
        />

        <div className="editor-grid">
          <ObjectPanel
            objects={objects}
            selectedId={selectedId}
            visibleCount={visibleCount}
            objectSearch={objectSearch}
            categoryFilter={categoryFilter}
            statusFilter={statusFilter}
            onSelect={setSelectedId}
            onToggleVisibility={toggleObjectVisibility}
            onObjectSearch={setObjectSearch}
            onCategoryFilter={setCategoryFilter}
            onStatusFilter={setStatusFilter}
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
            onSelectObject={setSelectedId}
            onSelectTool={setActiveTool}
            onSelectVersion={selectVersion}
            onMoveObject={moveObject}
          />
          <InspectorPanel
            selected={selected}
            issues={selectedIssues}
            onUpdateSelected={updateSelected}
            onIsolateSelected={isolateObject}
            onAddIssue={addIssue}
            onResolveIssue={resolveIssue}
          />
        </div>
      </section>
    </main>
  )
}

export default App
