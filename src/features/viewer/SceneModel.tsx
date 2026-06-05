import { Fragment, Suspense, useRef } from 'react'
import { useLoader, type ThreeEvent } from '@react-three/fiber'
import { Bounds, Html, Line, TransformControls } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DoubleSide, type Group, type Vector3 } from 'three'
import type { MeasurementPoint, ModelObject } from '../../types/domain'

type SceneModelProps = {
  objects: ModelObject[]
  selectedId: string
  modelUrl: string | null
  moveEnabled: boolean
  measureEnabled: boolean
  fitEnabled: boolean
  measurementPoints: MeasurementPoint[]
  onSelect: (id: string) => void
  onMoveObject: (id: string, position: ModelObject['position']) => void
  onMeasurePoint: (point: MeasurementPoint) => void
}

type ModelBlockProps = {
  object: ModelObject
  selected: boolean
  moveEnabled: boolean
  measureEnabled: boolean
  onSelect: (id: string) => void
  onMoveObject: (id: string, position: ModelObject['position']) => void
  onMeasurePoint: (point: MeasurementPoint) => void
}

function toMeasurementPoint(point: Vector3): MeasurementPoint {
  return [Number(point.x.toFixed(3)), Number(point.y.toFixed(3)), Number(point.z.toFixed(3))]
}

function ModelBlock({ object, selected, moveEnabled, measureEnabled, onSelect, onMoveObject, onMeasurePoint }: ModelBlockProps) {
  const groupRef = useRef<Group>(null)
  const pendingFrameRef = useRef<number | null>(null)

  if (!object.visible) {
    return null
  }

  const updateMovedPosition = () => {
    if (!groupRef.current) {
      return
    }

    onMoveObject(object.id, [
      Number(groupRef.current.position.x.toFixed(3)),
      Number(groupRef.current.position.y.toFixed(3)),
      Number(groupRef.current.position.z.toFixed(3)),
    ])
  }

  const scheduleMovedPositionUpdate = () => {
    if (pendingFrameRef.current !== null) {
      return
    }

    pendingFrameRef.current = window.requestAnimationFrame(() => {
      pendingFrameRef.current = null
      updateMovedPosition()
    })
  }

  const mesh = (
    <group ref={groupRef} position={object.position}>
      <mesh
        castShadow
        receiveShadow
        scale={object.scale}
        onClick={(event) => {
          event.stopPropagation()
          if (measureEnabled) {
            onMeasurePoint(toMeasurementPoint(event.point))
            return
          }

          onSelect(object.id)
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={object.color}
          metalness={0.08}
          roughness={0.58}
          transparent
          opacity={selected ? 0.96 : 0.82}
          emissive={selected ? object.color : '#000000'}
          emissiveIntensity={selected ? 0.12 : 0}
        />
        {selected ? (
          <lineSegments>
            <edgesGeometry args={[undefined, 1]} />
            <lineBasicMaterial color="#ffffff" linewidth={2} />
          </lineSegments>
        ) : null}
      </mesh>
    </group>
  )

  if (selected && moveEnabled) {
    return (
      <TransformControls mode="translate" size={1.18} space="world" onMouseUp={updateMovedPosition} onObjectChange={scheduleMovedPositionUpdate}>
        {mesh}
      </TransformControls>
    )
  }

  return mesh
}

function LoadedModel({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url)

  return <primitive object={gltf.scene} scale={1.6} position={[0, 0, 0]} />
}

function MeasurementLayer({
  enabled,
  points,
  onMeasurePoint,
}: {
  enabled: boolean
  points: MeasurementPoint[]
  onMeasurePoint: (point: MeasurementPoint) => void
}) {
  return (
    <>
      {enabled ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.04, 0]}
          onClick={(event) => {
            event.stopPropagation()
            onMeasurePoint(toMeasurementPoint(event.point))
          }}
        >
          <planeGeometry args={[16, 16]} />
          <meshBasicMaterial side={DoubleSide} transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}
      {points.map((point, index) => (
        <mesh key={`${point.join('-')}-${index}`} position={point}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={index === 0 ? '#f6d06f' : '#7ddbd8'} emissive={index === 0 ? '#f6d06f' : '#7ddbd8'} emissiveIntensity={0.35} />
        </mesh>
      ))}
      {points.length === 2 ? <Line points={points} color="#f6d06f" lineWidth={3} /> : null}
    </>
  )
}

function MoveDragLayer({
  enabled,
  selectedObject,
  onMoveObject,
}: {
  enabled: boolean
  selectedObject: ModelObject | undefined
  onMoveObject: (id: string, position: ModelObject['position']) => void
}) {
  const draggingRef = useRef(false)

  if (!enabled || !selectedObject?.visible) {
    return null
  }

  const moveSelectedToPoint = (point: Vector3) => {
    onMoveObject(selectedObject.id, [
      Number(point.x.toFixed(3)),
      selectedObject.position[1],
      Number(point.z.toFixed(3)),
    ])
  }

  const startDrag = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    draggingRef.current = true
    if (event.target instanceof Element) {
      event.target.setPointerCapture(event.pointerId)
    }
    moveSelectedToPoint(event.point)
  }

  const drag = (event: ThreeEvent<PointerEvent>) => {
    if (!draggingRef.current) {
      return
    }

    event.stopPropagation()
    moveSelectedToPoint(event.point)
  }

  const stopDrag = (event: ThreeEvent<PointerEvent>) => {
    if (!draggingRef.current) {
      return
    }

    event.stopPropagation()
    draggingRef.current = false
    if (event.target instanceof Element && event.target.hasPointerCapture(event.pointerId)) {
      event.target.releasePointerCapture(event.pointerId)
    }
    moveSelectedToPoint(event.point)
  }

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, selectedObject.position[1], 0]}
      onPointerDown={startDrag}
      onPointerMove={drag}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
    >
      <planeGeometry args={[18, 18]} />
      <meshBasicMaterial side={DoubleSide} transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

export function SceneModel({
  objects,
  selectedId,
  modelUrl,
  moveEnabled,
  measureEnabled,
  fitEnabled,
  measurementPoints,
  onSelect,
  onMoveObject,
  onMeasurePoint,
}: SceneModelProps) {
  const selectedObject = objects.find((object) => object.id === selectedId)

  if (modelUrl) {
    return (
      <Bounds fit clip observe margin={1.1}>
        <Suspense
          fallback={
            <Html center className="canvas-loader">
              Loading model
            </Html>
          }
        >
          <LoadedModel url={modelUrl} />
          <MeasurementLayer enabled={measureEnabled} points={measurementPoints} onMeasurePoint={onMeasurePoint} />
        </Suspense>
      </Bounds>
    )
  }

  return (
    <>
      {objects.map((object) => {
        const block = (
          <ModelBlock
            object={object}
            selected={object.id === selectedId}
            moveEnabled={moveEnabled}
            measureEnabled={measureEnabled}
            onSelect={onSelect}
            onMoveObject={onMoveObject}
            onMeasurePoint={onMeasurePoint}
          />
        )

        return object.id === selectedId && fitEnabled ? (
          <Bounds key={object.id} fit clip observe margin={1.35}>
            {block}
          </Bounds>
        ) : (
          <Fragment key={object.id}>{block}</Fragment>
        )
      })}
      <MoveDragLayer enabled={moveEnabled && !measureEnabled} selectedObject={selectedObject} onMoveObject={onMoveObject} />
      <MeasurementLayer enabled={measureEnabled} points={measurementPoints} onMeasurePoint={onMeasurePoint} />
    </>
  )
}
