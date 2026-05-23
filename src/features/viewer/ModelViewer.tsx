import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Grid, OrbitControls } from '@react-three/drei'
import { CircleDot, Clock3, Layers3, Maximize2, MousePointer2, Move3D, Ruler } from 'lucide-react'
import { versions } from '../../data/mockData'
import type { ModelObject } from '../../types/domain'
import { SceneModel } from './SceneModel'

type ModelViewerProps = {
  objects: ModelObject[]
  selectedId: string
  modelName: string
  modelUrl: string | null
  activeTool: string
  onSelectObject: (id: string) => void
  onSelectTool: (tool: string) => void
}

const viewerTools = [
  ['Select', MousePointer2],
  ['Move', Move3D],
  ['Measure', Ruler],
  ['Layers', Layers3],
  ['Fit', Maximize2],
] as const

export function ModelViewer({
  objects,
  selectedId,
  modelName,
  modelUrl,
  activeTool,
  onSelectObject,
  onSelectTool,
}: ModelViewerProps) {
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
        <Canvas shadows camera={{ position: [8.8, 6.4, 8.6], fov: 38 }}>
          <color attach="background" args={['#1d2528']} />
          <ambientLight intensity={0.58} />
          <directionalLight castShadow intensity={1.8} position={[4, 7, 5]} />
          <SceneModel objects={objects} selectedId={selectedId} onSelect={onSelectObject} modelUrl={modelUrl} />
          <Grid args={[12, 12]} cellSize={0.6} cellThickness={0.7} sectionSize={3} sectionThickness={1.1} />
          <ContactShadows position={[0, -0.02, 0]} blur={2.6} opacity={0.35} scale={10} />
          <Environment preset="city" />
          <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
        </Canvas>
      </div>

      <div className="version-strip">
        {versions.map((version, index) => (
          <button className={index === 1 ? 'is-current' : ''} key={version}>
            <Clock3 size={14} />
            <span>{version}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
