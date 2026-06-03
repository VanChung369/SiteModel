import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Grid, OrbitControls } from '@react-three/drei'
import { CircleDot, Layers3, Maximize2, MousePointer2, Move3D, Ruler } from 'lucide-react'
import { versions } from '../../data/mockData'
import type { ModelObject, ModelObjectCategory } from '../../types/domain'
import { SceneModel } from './SceneModel'
import { VersionStrip } from './VersionStrip'

type ModelViewerProps = {
  objects: ModelObject[]
  selectedId: string
  modelName: string
  modelUrl: string | null
  activeTool: string
  activeVersion: string
  onSelectObject: (id: string) => void
  onSelectTool: (tool: string) => void
  onSelectVersion: (version: string) => void
  onMoveObject: (id: string, position: ModelObject['position']) => void
}

const viewerTools = [
  ['Select', MousePointer2],
  ['Move', Move3D],
  ['Measure', Ruler],
  ['Layers', Layers3],
  ['Fit', Maximize2],
] as const

const layerOrder: ModelObjectCategory[] = ['Structural', 'Envelope', 'MEP', 'Site']

export function ModelViewer({
  objects,
  selectedId,
  modelName,
  modelUrl,
  activeTool,
  activeVersion,
  onSelectObject,
  onSelectTool,
  onSelectVersion,
  onMoveObject,
}: ModelViewerProps) {
  const moveEnabled = activeTool === 'Move'
  const fitEnabled = activeTool === 'Fit'
  const selectedObject = objects.find((object) => object.id === selectedId)
  const selectedDistance = selectedObject
    ? Math.sqrt(selectedObject.position[0] ** 2 + selectedObject.position[1] ** 2 + selectedObject.position[2] ** 2).toFixed(2)
    : '0.00'
  const layerSummaries = layerOrder
    .map((category) => {
      const categoryObjects = objects.filter((object) => object.category === category)

      return {
        category,
        total: categoryObjects.length,
        visible: categoryObjects.filter((object) => object.visible).length,
      }
    })
    .filter((summary) => summary.total > 0)

  return (
    <section className="viewport-card">
      <div className="viewport-toolbar" aria-label="Viewer tools">
        {viewerTools.map(([label, Icon]) => (
          <button
            type="button"
            className={activeTool === label ? 'is-active' : ''}
            key={label}
            onClick={() => onSelectTool(label)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="canvas-meta">
        <div>
          <strong>{modelName}</strong>
          <span>Default view - meters - shaded with edges</span>
        </div>
        <div className="status-pill">
          <CircleDot size={14} />
          Live preview
        </div>
      </div>

      <div className="model-canvas">
        {activeTool === 'Layers' ? (
          <aside className="layer-overlay" aria-label="Layer summary">
            <div>
              <Layers3 size={15} />
              <strong>Layers</strong>
            </div>
            {layerSummaries.map((layer) => (
              <div className="layer-row" key={layer.category}>
                <span>{layer.category}</span>
                <strong>
                  {layer.visible} visible
                  <small> / {layer.total}</small>
                </strong>
              </div>
            ))}
          </aside>
        ) : null}
        {activeTool === 'Measure' && selectedObject ? (
          <aside className="measure-overlay" aria-label="Measurement summary">
            <div>
              <Ruler size={15} />
              <strong>Measure</strong>
            </div>
            <div className="measure-row">
              <span>Selected object</span>
              <strong>{selectedObject.name}</strong>
            </div>
            <div className="measure-row">
              <span>Bounding size</span>
              <strong>{selectedObject.scale.join(' x ')} m</strong>
            </div>
            <div className="measure-row">
              <span>Distance from origin</span>
              <strong>{selectedDistance} m</strong>
            </div>
          </aside>
        ) : null}
        {fitEnabled && selectedObject ? (
          <aside className="fit-overlay" aria-label="Fit summary">
            <Maximize2 size={15} />
            <strong>Fit selected</strong>
            <span>{selectedObject.name}</span>
          </aside>
        ) : null}
        <Canvas shadows camera={{ position: [8.8, 6.4, 8.6], fov: 38 }}>
          <color attach="background" args={['#1d2528']} />
          <ambientLight intensity={0.58} />
          <directionalLight castShadow intensity={1.8} position={[4, 7, 5]} />
          <SceneModel
            objects={objects}
            selectedId={selectedId}
            modelUrl={modelUrl}
            moveEnabled={moveEnabled}
            fitEnabled={fitEnabled}
            onSelect={onSelectObject}
            onMoveObject={onMoveObject}
          />
          <Grid args={[12, 12]} cellSize={0.6} cellThickness={0.7} sectionSize={3} sectionThickness={1.1} />
          <ContactShadows position={[0, -0.02, 0]} blur={2.6} opacity={0.35} scale={10} />
          <Environment preset="city" />
          <OrbitControls makeDefault enableDamping dampingFactor={0.08} enabled={!moveEnabled} />
        </Canvas>
      </div>

      <VersionStrip versions={versions} activeVersion={activeVersion} onSelectVersion={onSelectVersion} />
    </section>
  )
}
