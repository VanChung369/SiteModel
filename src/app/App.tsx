import { useState } from 'react'
import { RotateCcw, Save, Share2 } from 'lucide-react'
import { baseObjects, initialUploads, projects } from '../data/mockData'
import { InspectorPanel } from '../features/inspector/InspectorPanel'
import { ProjectRail } from '../features/projects/ProjectRail'
import { ModelViewer } from '../features/viewer/ModelViewer'
import { ObjectPanel } from '../features/viewer/ObjectPanel'
import type { ModelObject, UploadItem } from '../types/domain'
import { formatBytes, getFileExtension, isBrowserLoadableModel } from '../utils/files'
import '../styles/app.css'

function App() {
  const [objects, setObjects] = useState(baseObjects)
  const [selectedId, setSelectedId] = useState(baseObjects[0].id)
  const [uploads, setUploads] = useState<UploadItem[]>(initialUploads)
  const [activeTool, setActiveTool] = useState('Select')
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [modelName, setModelName] = useState('Sample coordination model')

  const selected = objects.find((object) => object.id === selectedId) ?? objects[0]
  const visibleCount = objects.filter((object) => object.visible).length

  const updateSelected = (updates: Partial<ModelObject>) => {
    setObjects((current) => current.map((object) => (object.id === selected.id ? { ...object, ...updates } : object)))
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
      <ProjectRail projects={projects} uploads={uploads} onFilesSelected={handleFiles} />

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="crumb">Projects / Riverside Tower</span>
            <h1>Viewer</h1>
          </div>
          <div className="topbar-actions">
            <button type="button">
              <RotateCcw size={16} />
              Sync
            </button>
            <button type="button">
              <Share2 size={16} />
              Share
            </button>
            <button type="button" className="primary-action">
              <Save size={16} />
              Save View
            </button>
          </div>
        </header>

        <div className="editor-grid">
          <ObjectPanel objects={objects} selectedId={selectedId} visibleCount={visibleCount} onSelect={setSelectedId} />
          <ModelViewer
            objects={objects}
            selectedId={selectedId}
            modelName={modelName}
            modelUrl={modelUrl}
            activeTool={activeTool}
            onSelectObject={setSelectedId}
            onSelectTool={setActiveTool}
          />
          <InspectorPanel selected={selected} onUpdateSelected={updateSelected} />
        </div>
      </section>
    </main>
  )
}

export default App
