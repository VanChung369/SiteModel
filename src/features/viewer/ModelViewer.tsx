import { useEffect, useMemo, useRef, useState, type MouseEvent, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ContactShadows, Environment, Grid, OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei'
import { CircleDot, Layers3, Maximize2, MousePointer2, Move3D, Ruler, RefreshCw, Scaling, Grid3x3 } from 'lucide-react'
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
  onMoveObject: (
    id: string,
    position: ModelObject['position'],
    rotation?: ModelObject['rotation'],
    scale?: ModelObject['scale']
  ) => void
  onCameraViewChange: (view: CameraView) => void
}

const viewerTools = [
  ['Select', MousePointer2],
  ['Move', Move3D],
  ['Rotate', RefreshCw],
  ['Scale', Scaling],
  ['Measure', Ruler],
  ['Layers', Layers3],
  ['Fit', Maximize2],
] as const

const layerOrder: ModelObjectCategory[] = ['Structural', 'Envelope', 'MEP', 'Site']
type ViewportBackground = 'charcoal' | 'blue' | 'white'
type CanvasPointerEvent = PointerEvent | globalThis.MouseEvent
type TransformControlsHandle = {
  axis: string | null
}

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

function CanvasDragHandler({
  enabled,
  transformMode,
  selectedObject,
  objects,
  onSelectObject,
  onMoveObject,
  onDragStateChange,
  transformRef,
}: {
  enabled: boolean
  transformMode: 'Move' | 'Rotate' | 'Scale' | null
  selectedObject: ModelObject | undefined
  objects: ModelObject[]
  onSelectObject: (id: string) => void
  onMoveObject: (
    id: string,
    position: ModelObject['position'],
    rotation?: ModelObject['rotation'],
    scale?: ModelObject['scale']
  ) => void
  onDragStateChange: (isDragging: boolean) => void
  transformRef: RefObject<TransformControlsHandle | null>
}) {
  const { camera, gl, scene } = useThree()
  const draggingRef = useRef(false)
  const justDraggedRef = useRef(false)
  const plane = useMemo(() => new THREE.Plane(), [])
  const dragOffsetRef = useRef(new THREE.Vector3())
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const startRotationRef = useRef<NonNullable<ModelObject['rotation']>>([0, 0, 0])
  const startScaleRef = useRef<ModelObject['scale']>([1, 1, 1])
  const potentialDragRef = useRef(false)
  const gizmoDraggingRef = useRef(false)
  const draggedObjectIdRef = useRef<string | null>(null)
  const clickedObjectIdRef = useRef<string | null>(null)

  const transformModeRef = useRef(transformMode)
  const selectedObjectRef = useRef(selectedObject)
  const objectsRef = useRef(objects)
  const onSelectObjectRef = useRef(onSelectObject)
  const onMoveObjectRef = useRef(onMoveObject)
  const onDragStateChangeRef = useRef(onDragStateChange)

  useEffect(() => {
    transformModeRef.current = transformMode
    selectedObjectRef.current = selectedObject
    objectsRef.current = objects
    onSelectObjectRef.current = onSelectObject
    onMoveObjectRef.current = onMoveObject
    onDragStateChangeRef.current = onDragStateChange
  }, [objects, onDragStateChange, onMoveObject, onSelectObject, selectedObject, transformMode])

  const pendingFrameRef = useRef<number | null>(null)
  const pendingUpdateRef = useRef<{
    id: string
    position: ModelObject['position']
    rotation?: ModelObject['rotation']
    scale?: ModelObject['scale']
  } | null>(null)

  const scheduleTransformUpdate = (
    id: string,
    position: ModelObject['position'],
    rotation?: ModelObject['rotation'],
    scale?: ModelObject['scale'],
  ) => {
    pendingUpdateRef.current = { id, position, rotation, scale }
    if (pendingFrameRef.current !== null) return

    pendingFrameRef.current = window.requestAnimationFrame(() => {
      pendingFrameRef.current = null
      if (pendingUpdateRef.current) {
        onMoveObjectRef.current(
          pendingUpdateRef.current.id,
          pendingUpdateRef.current.position,
          pendingUpdateRef.current.rotation,
          pendingUpdateRef.current.scale,
        )
        pendingUpdateRef.current = null
      }
    })
  }

  useEffect(() => {
    if (!enabled || !gl || !gl.domElement) {
      return
    }

    const canvas = gl.domElement

    const handlePointerDown = (event: CanvasPointerEvent) => {
      if (event.button !== 0) return // left click only
      if (event.target !== canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // 1. Check if clicking over TransformControls gizmo handles
      let clickedGizmo = false
      if (transformRef.current && transformRef.current.axis !== null) {
        clickedGizmo = true
      }

      if (clickedGizmo) {
        gizmoDraggingRef.current = true
        return // Let the gizmo handle it!
      }

      // 2. Raycast to check if we clicked a model object (to select it)
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
      const intersects = raycaster.intersectObjects(scene.children, true)

      let clickedObjectId: string | null = null
      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object
        while (curr) {
          const currentName = curr.name
          if (currentName && objectsRef.current.some(obj => obj.id === currentName)) {
            clickedObjectId = currentName
            break
          }
          curr = curr.parent
        }
        if (clickedObjectId) break
      }

      clickedObjectIdRef.current = clickedObjectId

      // Determine which object to drag:
      // If there is an active selection, we always drag the active selection.
      // Otherwise, we drag the clicked object.
      const targetObjectId = selectedObjectRef.current?.id || clickedObjectId
      if (!targetObjectId) {
        potentialDragRef.current = false
        draggingRef.current = false
        draggedObjectIdRef.current = null
        return
      }

      draggedObjectIdRef.current = targetObjectId

      // If no object was previously selected, and we clicked on an object, select it immediately
      if (clickedObjectId && !selectedObjectRef.current) {
        onSelectObjectRef.current(clickedObjectId)
      }

      const targetObj = objectsRef.current.find(obj => obj.id === targetObjectId)
      if (!targetObj) return

      startXRef.current = event.clientX
      startYRef.current = event.clientY
      startRotationRef.current = targetObj.rotation ?? [0, 0, 0]
      startScaleRef.current = targetObj.scale
      potentialDragRef.current = true
      draggingRef.current = false
      justDraggedRef.current = false
      gizmoDraggingRef.current = false

      // Create a horizontal plane at the target object's Y height
      plane.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, targetObj.position[1], 0)
      )

      const intersection = new THREE.Vector3()
      if (raycaster.ray.intersectPlane(plane, intersection)) {
        dragOffsetRef.current.copy(intersection).sub(new THREE.Vector3(...targetObj.position))
      } else {
        dragOffsetRef.current.set(0, 0, 0)
      }

      event.stopImmediatePropagation()
      event.preventDefault()
    }

    const handlePointerMove = (event: CanvasPointerEvent) => {
      if (!potentialDragRef.current) return

      if (!draggingRef.current) {
        const dx = event.clientX - startXRef.current
        const dy = event.clientY - startYRef.current
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Only treat as drag if moved more than 5 pixels
        if (dist > 5) {
          draggingRef.current = true
          onDragStateChangeRef.current(true)
          if ('pointerId' in event && typeof canvas.setPointerCapture === 'function') {
            canvas.setPointerCapture(event.pointerId)
          }
        }
      }

      if (draggingRef.current) {
        event.stopImmediatePropagation()
        event.preventDefault()
        updateTransform(event, false)
      }
    }

    const handlePointerUp = (event: CanvasPointerEvent) => {
      if (gizmoDraggingRef.current) {
        justDraggedRef.current = true
        setTimeout(() => {
          gizmoDraggingRef.current = false
        }, 0)
        return
      }

      if (!potentialDragRef.current) return

      if (draggingRef.current) {
        event.stopImmediatePropagation()
        event.preventDefault()

        if (
          'pointerId' in event &&
          typeof canvas.releasePointerCapture === 'function' &&
          canvas.hasPointerCapture(event.pointerId)
        ) {
          canvas.releasePointerCapture(event.pointerId)
        }

        updateTransform(event, true)

        justDraggedRef.current = true
        // Defer resetting so that all up/click events in this tick are intercepted
        setTimeout(() => {
          draggingRef.current = false
          potentialDragRef.current = false
          onDragStateChangeRef.current(false)
          draggedObjectIdRef.current = null
          clickedObjectIdRef.current = null
        }, 0)
      } else {
        // It was a click!
        if (clickedObjectIdRef.current) {
          onSelectObjectRef.current(clickedObjectIdRef.current)
        }
        setTimeout(() => {
          potentialDragRef.current = false
          draggedObjectIdRef.current = null
          clickedObjectIdRef.current = null
        }, 0)
      }
    }

    const handleClick = (event: CanvasPointerEvent) => {
      if (justDraggedRef.current) {
        event.stopImmediatePropagation()
        event.preventDefault()
        justDraggedRef.current = false
      }
    }

    const updateTransform = (event: CanvasPointerEvent, sync = false) => {
      const activeId = draggedObjectIdRef.current
      if (!activeId) return
      const activeObject = objectsRef.current.find(obj => obj.id === activeId)
      if (!activeObject) return

      const mode = transformModeRef.current
      if (mode === 'Rotate') {
        const dx = event.clientX - startXRef.current
        const dy = event.clientY - startYRef.current
        const nextRotation: ModelObject['rotation'] = [
          Number((startRotationRef.current[0] + dy * 0.35).toFixed(1)),
          Number((startRotationRef.current[1] + dx * 0.45).toFixed(1)),
          startRotationRef.current[2],
        ]

        if (sync) {
          onMoveObjectRef.current(activeObject.id, activeObject.position, nextRotation, activeObject.scale)
        } else {
          scheduleTransformUpdate(activeObject.id, activeObject.position, nextRotation, activeObject.scale)
        }
        return
      }

      if (mode === 'Scale') {
        const dx = event.clientX - startXRef.current
        const dy = event.clientY - startYRef.current
        const factor = Math.exp((dx - dy) * 0.006)
        const nextScale = startScaleRef.current.map((value) =>
          Number(Math.min(24, Math.max(0.05, value * factor)).toFixed(3)),
        ) as ModelObject['scale']

        if (sync) {
          onMoveObjectRef.current(activeObject.id, activeObject.position, activeObject.rotation ?? [0, 0, 0], nextScale)
        } else {
          scheduleTransformUpdate(activeObject.id, activeObject.position, activeObject.rotation ?? [0, 0, 0], nextScale)
        }
        return
      }

      const rect = canvas.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)

      const intersection = new THREE.Vector3()
      if (raycaster.ray.intersectPlane(plane, intersection)) {
        const targetPos = intersection.clone().sub(dragOffsetRef.current)
        const nextPos: [number, number, number] = [
          Number(targetPos.x.toFixed(3)),
          activeObject.position[1],
          Number(targetPos.z.toFixed(3)),
        ]

        if (sync) {
          if (pendingFrameRef.current !== null) {
            window.cancelAnimationFrame(pendingFrameRef.current)
            pendingFrameRef.current = null
          }
          onMoveObjectRef.current(activeObject.id, nextPos)
        } else {
          scheduleTransformUpdate(activeObject.id, nextPos)
        }
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove, true)
    window.addEventListener('mousemove', handlePointerMove, true)
    window.addEventListener('pointerup', handlePointerUp, true)
    window.addEventListener('mouseup', handlePointerUp, true)
    window.addEventListener('pointercancel', handlePointerUp, true)
    window.addEventListener('click', handleClick, true)

    return () => {
      if (pendingFrameRef.current !== null) {
        window.cancelAnimationFrame(pendingFrameRef.current)
        pendingFrameRef.current = null
      }
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove, true)
      window.removeEventListener('mousemove', handlePointerMove, true)
      window.removeEventListener('pointerup', handlePointerUp, true)
      window.removeEventListener('mouseup', handlePointerUp, true)
      window.removeEventListener('pointercancel', handlePointerUp, true)
      window.removeEventListener('click', handleClick, true)
      if (draggingRef.current) {
        draggingRef.current = false
        onDragStateChangeRef.current(false)
      }
    }
  }, [enabled, camera, gl, scene, plane, transformRef])

  return null
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
  const lastSignatureRef = useRef('')
  const lastCaptureTimeRef = useRef(0)
  const lastAppliedRequestIdRef = useRef('')

  useEffect(() => {
    lastSignatureRef.current = ''
  }, [cameraViewRequest])

  useFrame((state) => {
    if (cameraViewRequest && cameraViewRequest.id !== lastAppliedRequestIdRef.current) {
      const { view } = cameraViewRequest
      state.camera.position.set(...view.position)
      state.camera.zoom = view.zoom
      state.camera.updateProjectionMatrix()
      controlsRef.current?.target.set(...view.target)
      controlsRef.current?.update()
      lastAppliedRequestIdRef.current = cameraViewRequest.id
      lastSignatureRef.current = ''
    }

    if (state.clock.elapsedTime - lastCaptureTimeRef.current < 0.2) {
      return
    }

    lastCaptureTimeRef.current = state.clock.elapsedTime

    const view: CameraView = {
      position: roundVector([state.camera.position.x, state.camera.position.y, state.camera.position.z]),
      target: controlsRef.current
        ? roundVector([controlsRef.current.target.x, controlsRef.current.target.y, controlsRef.current.target.z])
        : [0, 0, 0],
      zoom: Number(state.camera.zoom.toFixed(3)),
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
  const transformRef = useRef<TransformControlsHandle | null>(null)

  const [measurementPoints, setMeasurementPoints] = useState<MeasurementPoint[]>([])
  const [gridSize, setGridSize] = useState(0.1)
  const [showGrid, setShowGrid] = useState(true)
  const [viewportBg, setViewportBg] = useState<ViewportBackground>('charcoal')
  const [shadowsEnabled, setShadowsEnabled] = useState(true)
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

  return (
    <section className="viewport-card">
      <div className="viewport-toolbar" aria-label="Viewer tools">
        {viewerTools.map(([label, Icon]) => (
          <button
            type="button"
            className={activeTool === label ? 'is-active' : ''}
            key={label}
            aria-label={label}
            aria-pressed={activeTool === label}
            onPointerDown={() => onSelectTool(label)}
            onClick={() => onSelectTool(label)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
        <div className="viewport-display-controls">
          <label className="view-control">
            <span>Grid</span>
            <select
              aria-label="Grid size"
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
            >
              <option value="0.05">0.05m (Very Fine)</option>
              <option value="0.1">0.1m (Fine)</option>
              <option value="0.2">0.2m (Medium)</option>
              <option value="0.5">0.5m (Coarse)</option>
              <option value="1.0">1.0m (Large)</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => setShowGrid(prev => !prev)}
            title="Toggle Grid"
            className={`icon-toggle ${showGrid ? 'is-on' : ''}`}
          >
            <Grid3x3 size={15} />
          </button>

          <label className="view-control">
            <span>BG</span>
            <select
              aria-label="Viewport background"
              value={viewportBg}
              onChange={(e) => setViewportBg(e.target.value as ViewportBackground)}
            >
              <option value="charcoal">Charcoal</option>
              <option value="blue">Slate Blue</option>
              <option value="white">Studio White</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => setShadowsEnabled(prev => !prev)}
            title="Toggle Shadows"
            className={`shadow-toggle ${shadowsEnabled ? 'is-on' : ''}`}
          >
            Shadows
          </button>
        </div>
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
        <Canvas shadows={shadowsEnabled} camera={{ position: [8.8, 6.4, 8.6], fov: 38 }}>
          <color attach="background" args={[viewportBg === 'charcoal' ? '#1d2528' : viewportBg === 'blue' ? '#0f172a' : '#f1f5f9']} />
          <ambientLight intensity={0.58} />
          <directionalLight castShadow={shadowsEnabled} intensity={1.8} position={[4, 7, 5]} />
          <SceneModel
            objects={objects}
            selectedId={selectedId}
            modelUrl={modelUrl}
            modelName={modelName}
            activeTool={activeTool}
            measureEnabled={measureEnabled}
            fitEnabled={fitEnabled}
            measurementPoints={measurementPoints}
            onSelect={onSelectObject}
            onMoveObject={onMoveObject}
            onMeasurePoint={addMeasurementPoint}
            transformRef={transformRef}
          />
           <CanvasDragHandler
            enabled={activeTool === 'Move' || activeTool === 'Rotate' || activeTool === 'Scale'}
            transformMode={activeTool === 'Move' || activeTool === 'Rotate' || activeTool === 'Scale' ? activeTool : null}
            selectedObject={selectedObject}
            objects={objects}
            onSelectObject={onSelectObject}
            onMoveObject={onMoveObject}
            onDragStateChange={() => undefined}
            transformRef={transformRef}
          />
          {showGrid ? (
            <Grid
              args={[40, 40]}
              cellSize={gridSize}
              cellThickness={1.0}
              cellColor={viewportBg === 'white' ? '#d9e1e3' : '#374151'}
              sectionSize={gridSize * 5}
              sectionThickness={1.5}
              sectionColor={viewportBg === 'white' ? '#a9b8bd' : '#4b5563'}
              fadeDistance={30}
              infiniteGrid
            />
          ) : null}
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport labelColor={viewportBg === 'white' ? 'black' : 'white'} axisColors={['#f43f5e', '#10b981', '#3b82f6']} />
          </GizmoHelper>
          <ContactShadows position={[0, -0.02, 0]} blur={2.6} opacity={0.35} scale={10} />
          <Environment preset="city" />
          <OrbitControls
            ref={controlsRef}
            makeDefault
            target={[0, 1.7, 0]}
            enableDamping
            dampingFactor={0.08}
            mouseButtons={{
              LEFT: (activeTool !== 'Move' && activeTool !== 'Rotate' && activeTool !== 'Scale') ? THREE.MOUSE.ROTATE : undefined,
              MIDDLE: THREE.MOUSE.ROTATE,
              RIGHT: THREE.MOUSE.PAN
            }}
          />
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
