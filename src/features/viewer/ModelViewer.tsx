import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Grid, OrbitControls } from '@react-three/drei'
import { CircleDot, Layers3, Maximize2, MousePointer2, Move3D, Ruler } from 'lucide-react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { versions } from '../../data/mockData'
import type { CameraView, MeasurementPoint, ModelObject, ModelObjectCategory } from '../../types/domain'
import { SceneModel } from './SceneModel'
import { VersionStrip } from './VersionStrip'

export type CameraViewRequest = {
  id: string
  view: CameraView
}

type ModelViewerProps = {
  objects: ModelObject[]
  selectedId: string
  modelName: string
  modelUrl: string | null
  activeTool: string
  activeVersion: string
  cameraViewRequest: CameraViewRequest | null
  onSelectObject: (id: string) => void
  onSelectTool: (tool: string) => void
  onSelectVersion: (version: string) => void
  onMoveObject: (id: string, position: ModelObject['position']) => void
  onCameraViewChange: (view: CameraView) => void
}

const viewerTools = [
  ['Select', MousePointer2],
  ['Move', Move3D],
  ['Measure', Ruler],
  ['Layers', Layers3],
  ['Fit', Maximize2],
] as const

const layerOrder: ModelObjectCategory[] = ['Structural', 'Envelope', 'MEP', 'Site']

function roundVector(values: [number, number, number]): [number, number, number] {
  return values.map((value) => Number(value.toFixed(3))) as [number, number, number]
}

function formatPoint(point: MeasurementPoint | undefined) {
  return point ? point.map((value) => value.toFixed(2)).join(', ') : '-'
}

function getDistance(points: MeasurementPoint[]) {
  if (points.length < 2) {
    return null
  }

  const [start, end] = points
  return Math.sqrt((end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2 + (end[2] - start[2]) ** 2)
}

function roundCoordinate(value: number) {
  return Number(value.toFixed(3))
}

function CameraViewSync({
  cameraViewRequest,
  controlsRef,
  onCameraViewChange,
}: {
  cameraViewRequest: CameraViewRequest | null
  controlsRef: RefObject<OrbitControlsImpl | null>
  onCameraViewChange: (view: CameraView) => void
}) {
  const { camera } = useThree()
  const lastSignatureRef = useRef('')
  const lastCaptureTimeRef = useRef(0)

  useEffect(() => {
    if (!cameraViewRequest) {
      return
    }

    const { view } = cameraViewRequest
    camera.position.set(...view.position)
    camera.zoom = view.zoom
    camera.updateProjectionMatrix()
    controlsRef.current?.target.set(...view.target)
    controlsRef.current?.update()
    lastSignatureRef.current = ''
  }, [camera, cameraViewRequest, controlsRef])

  useFrame((state) => {
    if (state.clock.elapsedTime - lastCaptureTimeRef.current < 0.2) {
      return
    }

    lastCaptureTimeRef.current = state.clock.elapsedTime

    const view: CameraView = {
      position: roundVector([camera.position.x, camera.position.y, camera.position.z]),
      target: controlsRef.current
        ? roundVector([controlsRef.current.target.x, controlsRef.current.target.y, controlsRef.current.target.z])
        : [0, 0, 0],
      zoom: Number(camera.zoom.toFixed(3)),
    }
    const signature = JSON.stringify(view)

    if (signature !== lastSignatureRef.current) {
      lastSignatureRef.current = signature
      onCameraViewChange(view)
    }
  })

  return null
}

export function ModelViewer({
  objects,
  selectedId,
  modelName,
  modelUrl,
  activeTool,
  activeVersion,
  cameraViewRequest,
  onSelectObject,
  onSelectTool,
  onSelectVersion,
  onMoveObject,
  onCameraViewChange,
}: ModelViewerProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const directMoveDraggingRef = useRef(false)
  const [measurementPoints, setMeasurementPoints] = useState<MeasurementPoint[]>([])
  const moveEnabled = activeTool === 'Move'
  const measureEnabled = activeTool === 'Measure'
  const fitEnabled = activeTool === 'Fit'
  const selectedObject = objects.find((object) => object.id === selectedId)
  const measuredDistance = useMemo(() => getDistance(measurementPoints), [measurementPoints])
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

  const addMeasurementPoint = (point: MeasurementPoint) => {
    setMeasurementPoints((current) => (current.length >= 2 ? [point] : [...current, point]))
  }

  const addMeasurementPointFromCanvas = (event: MouseEvent<HTMLDivElement>) => {
    if (!measureEnabled || !(event.target instanceof HTMLCanvasElement)) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const xRatio = (event.clientX - rect.left) / rect.width
    const yRatio = (event.clientY - rect.top) / rect.height

    addMeasurementPoint([roundCoordinate((xRatio - 0.5) * 8), 0, roundCoordinate((0.5 - yRatio) * 8)])
  }

  const moveSelectedFromCanvas = (event: PointerEvent<HTMLDivElement>) => {
    if (!selectedObject || !(event.target instanceof HTMLCanvasElement)) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const xRatio = (event.clientX - rect.left) / rect.width
    const yRatio = (event.clientY - rect.top) / rect.height

    onMoveObject(selectedObject.id, [
      roundCoordinate((xRatio - 0.5) * 8),
      selectedObject.position[1],
      roundCoordinate((0.5 - yRatio) * 8),
    ])
  }

  const startDirectMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!moveEnabled || !selectedObject || !(event.target instanceof HTMLCanvasElement)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    directMoveDraggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    moveSelectedFromCanvas(event)
  }

  const dragDirectMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!directMoveDraggingRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    moveSelectedFromCanvas(event)
  }

  const stopDirectMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!directMoveDraggingRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    directMoveDraggingRef.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    moveSelectedFromCanvas(event)
  }

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

      <div
        className="model-canvas"
        onClick={addMeasurementPointFromCanvas}
        onPointerDownCapture={startDirectMove}
        onPointerMoveCapture={dragDirectMove}
        onPointerUpCapture={stopDirectMove}
        onPointerCancelCapture={stopDirectMove}
      >
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
        {measureEnabled && selectedObject ? (
          <aside className="measure-overlay" aria-label="Measurement summary" onClick={(event) => event.stopPropagation()}>
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
            <div className="measure-row">
              <span>Point A</span>
              <strong>{formatPoint(measurementPoints[0])}</strong>
            </div>
            <div className="measure-row">
              <span>Point B</span>
              <strong>{formatPoint(measurementPoints[1])}</strong>
            </div>
            <div className="measure-row">
              <span>Picked distance</span>
              <strong>{measuredDistance === null ? '-' : `${measuredDistance.toFixed(2)} m`}</strong>
            </div>
            <button type="button" className="measure-reset" onClick={() => setMeasurementPoints([])}>
              Reset measure
            </button>
          </aside>
        ) : null}
        {fitEnabled && selectedObject ? (
          <aside className="fit-overlay" aria-label="Fit summary">
            <Maximize2 size={15} />
            <strong>Fit selected</strong>
            <span>{selectedObject.name}</span>
          </aside>
        ) : null}
        {moveEnabled && selectedObject ? (
          <aside className="move-overlay" aria-label="Move summary">
            <div>
              <Move3D size={15} />
              <strong>Move selected</strong>
            </div>
            <span>{selectedObject.name}</span>
            <div className="move-coordinate-grid">
              <strong>X {selectedObject.position[0]}</strong>
              <strong>Y {selectedObject.position[1]}</strong>
              <strong>Z {selectedObject.position[2]}</strong>
            </div>
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
            measureEnabled={measureEnabled}
            fitEnabled={fitEnabled}
            measurementPoints={measurementPoints}
            onSelect={onSelectObject}
            onMoveObject={onMoveObject}
            onMeasurePoint={addMeasurementPoint}
          />
          <Grid args={[12, 12]} cellSize={0.6} cellThickness={0.7} sectionSize={3} sectionThickness={1.1} />
          <ContactShadows position={[0, -0.02, 0]} blur={2.6} opacity={0.35} scale={10} />
          <Environment preset="city" />
          <OrbitControls ref={controlsRef} makeDefault target={[0, 1.7, 0]} enableDamping dampingFactor={0.08} enabled={!moveEnabled} />
          <CameraViewSync
            cameraViewRequest={cameraViewRequest}
            controlsRef={controlsRef}
            onCameraViewChange={onCameraViewChange}
          />
        </Canvas>
      </div>

      <VersionStrip versions={versions} activeVersion={activeVersion} onSelectVersion={onSelectVersion} />
    </section>
  )
}
