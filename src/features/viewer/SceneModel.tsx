import { Suspense, useEffect, useRef, useState, type RefObject } from 'react'
import { useLoader } from '@react-three/fiber'
import { Bounds, Html, Line, TransformControls, useBounds } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { DoubleSide, Mesh, MeshStandardMaterial, type Group, type Vector3 } from 'three'
import type { MeasurementPoint, ModelObject } from '../../types/domain'

type TransformControlsHandle = {
  axis: string | null
}

type SceneModelProps = {
  objects: ModelObject[]
  selectedId: string
  modelUrl: string | null
  modelName: string
  activeTool: string
  measureEnabled: boolean
  fitEnabled: boolean
  measurementPoints: MeasurementPoint[]
  onSelect: (id: string) => void
  onMoveObject: (
    id: string,
    position: ModelObject['position'],
    rotation?: ModelObject['rotation'],
    scale?: ModelObject['scale']
  ) => void
  onMeasurePoint: (point: MeasurementPoint) => void
  transformRef: RefObject<TransformControlsHandle | null>
}

type ModelBlockProps = {
  object: ModelObject
  selected: boolean
  activeTool: string
  fitEnabled: boolean
  measureEnabled: boolean
  onSelect: (id: string) => void
  onMeasurePoint: (point: MeasurementPoint) => void
  onSelectedGroupChange: (group: Group | null) => void
}

function toMeasurementPoint(point: Vector3): MeasurementPoint {
  return [Number(point.x.toFixed(3)), Number(point.y.toFixed(3)), Number(point.z.toFixed(3))]
}

function ModelBlock({
  object,
  selected,
  activeTool,
  fitEnabled,
  measureEnabled,
  onSelect,
  onMeasurePoint,
  onSelectedGroupChange,
}: ModelBlockProps) {
  const [group, setGroup] = useState<Group | null>(null)
  const bounds = useBounds()

  const transformModeEnabled = activeTool === 'Move' || activeTool === 'Rotate' || activeTool === 'Scale'

  useEffect(() => {
    if (selected && group && (fitEnabled || transformModeEnabled)) {
      bounds.refresh(group).clip().fit()
    }
  }, [selected, fitEnabled, transformModeEnabled, activeTool, group, bounds])

  useEffect(() => {
    if (!selected) {
      return
    }

    onSelectedGroupChange(group)
    return () => onSelectedGroupChange(null)
  }, [selected, group, onSelectedGroupChange])

  if (!object.visible) {
    return null
  }

  const radRotation = (object.rotation ?? [0, 0, 0]).map(d => d * Math.PI / 180) as [number, number, number]

  return (
    <group ref={setGroup} name={object.id} position={object.position} rotation={radRotation} scale={object.scale}>
      <mesh
        castShadow
        receiveShadow
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
}

function LoadedModel({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url)

  return <primitive object={gltf.scene} scale={1.6} position={[0, 0, 0]} />
}

function LoadedObjModel({ url }: { url: string }) {
  const obj = useLoader(OBJLoader, url)

  useEffect(() => {
    obj.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true
        child.receiveShadow = true

        if (!child.material) {
          child.material = new MeshStandardMaterial({
            color: '#b7c4cf',
            roughness: 0.62,
            metalness: 0.04,
          })
        }
      }
    })
  }, [obj])

  return <primitive object={obj} scale={1.6} position={[0, 0, 0]} />
}

function SelectedTransformControls({
  object,
  objectId,
  activeTool,
  onMoveObject,
  transformRef,
}: {
  object: Group | null
  objectId: string
  activeTool: string
  onMoveObject: (
    id: string,
    position: ModelObject['position'],
    rotation?: ModelObject['rotation'],
    scale?: ModelObject['scale']
  ) => void
  transformRef: RefObject<TransformControlsHandle | null>
}) {
  const pendingFrameRef = useRef<number | null>(null)
  const transformMode = activeTool === 'Rotate' ? 'rotate' : activeTool === 'Scale' ? 'scale' : activeTool === 'Move' ? 'translate' : null

  useEffect(() => {
    return () => {
      if (pendingFrameRef.current !== null) {
        window.cancelAnimationFrame(pendingFrameRef.current)
      }
    }
  }, [])

  if (!object || !transformMode) {
    return null
  }

  const commitTransform = () => {
    const position: ModelObject['position'] = [
      Number(object.position.x.toFixed(3)),
      Number(object.position.y.toFixed(3)),
      Number(object.position.z.toFixed(3)),
    ]
    const rotation: ModelObject['rotation'] = [
      Number((object.rotation.x * 180 / Math.PI).toFixed(1)),
      Number((object.rotation.y * 180 / Math.PI).toFixed(1)),
      Number((object.rotation.z * 180 / Math.PI).toFixed(1)),
    ]
    const scale: ModelObject['scale'] = [
      Number(Math.max(0.05, object.scale.x).toFixed(3)),
      Number(Math.max(0.05, object.scale.y).toFixed(3)),
      Number(Math.max(0.05, object.scale.z).toFixed(3)),
    ]

    onMoveObject(objectId, position, rotation, scale)
  }

  const scheduleCommit = () => {
    if (pendingFrameRef.current !== null) {
      return
    }

    pendingFrameRef.current = window.requestAnimationFrame(() => {
      pendingFrameRef.current = null
      commitTransform()
    })
  }

  return (
    <TransformControls
      ref={(node) => {
        transformRef.current = node as TransformControlsHandle | null
      }}
      object={object}
      mode={transformMode}
      size={1.12}
      space="world"
      onObjectChange={scheduleCommit}
      onMouseUp={commitTransform}
    />
  )
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

export function SceneModel({
  objects,
  selectedId,
  modelUrl,
  modelName,
  activeTool,
  measureEnabled,
  fitEnabled,
  measurementPoints,
  onSelect,
  onMoveObject,
  onMeasurePoint,
  transformRef,
}: SceneModelProps) {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const handleSelectedGroupChange = (group: Group | null) => setSelectedGroup(group)

  if (modelUrl) {
    const isObjModel = modelName.toLowerCase().endsWith('.obj')

    return (
      <Bounds fit clip observe margin={1.1}>
        <Suspense
          fallback={
            <Html center className="canvas-loader">
              Loading model
            </Html>
          }
        >
          {isObjModel ? <LoadedObjModel url={modelUrl} /> : <LoadedModel url={modelUrl} />}
          <MeasurementLayer enabled={measureEnabled} points={measurementPoints} onMeasurePoint={onMeasurePoint} />
        </Suspense>
      </Bounds>
    )
  }

  return (
    <>
      <Bounds clip observe margin={1.35}>
        {objects.map((object) => (
          <ModelBlock
            key={object.id}
            object={object}
            selected={object.id === selectedId}
            activeTool={activeTool}
            fitEnabled={fitEnabled}
            measureEnabled={measureEnabled}
            onSelect={onSelect}
            onMeasurePoint={onMeasurePoint}
            onSelectedGroupChange={handleSelectedGroupChange}
          />
        ))}
      </Bounds>
      <SelectedTransformControls
        object={selectedGroup}
        objectId={selectedId}
        activeTool={activeTool}
        onMoveObject={onMoveObject}
        transformRef={transformRef}
      />
      <MeasurementLayer enabled={measureEnabled} points={measurementPoints} onMeasurePoint={onMeasurePoint} />
    </>
  )
}
