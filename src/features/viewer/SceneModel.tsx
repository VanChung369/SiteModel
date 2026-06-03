import { Fragment, Suspense, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { Bounds, Html, TransformControls } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Mesh } from 'three'
import type { ModelObject } from '../../types/domain'

type SceneModelProps = {
  objects: ModelObject[]
  selectedId: string
  modelUrl: string | null
  moveEnabled: boolean
  fitEnabled: boolean
  onSelect: (id: string) => void
  onMoveObject: (id: string, position: ModelObject['position']) => void
}

type ModelBlockProps = {
  object: ModelObject
  selected: boolean
  moveEnabled: boolean
  onSelect: (id: string) => void
  onMoveObject: (id: string, position: ModelObject['position']) => void
}

function ModelBlock({ object, selected, moveEnabled, onSelect, onMoveObject }: ModelBlockProps) {
  const meshRef = useRef<Mesh>(null)

  if (!object.visible) {
    return null
  }

  const updateMovedPosition = () => {
    if (!meshRef.current) {
      return
    }

    onMoveObject(object.id, [
      Number(meshRef.current.position.x.toFixed(3)),
      Number(meshRef.current.position.y.toFixed(3)),
      Number(meshRef.current.position.z.toFixed(3)),
    ])
  }

  const mesh = (
    <mesh
      ref={meshRef}
      castShadow
      receiveShadow
      position={object.position}
      scale={object.scale}
      onClick={(event) => {
        event.stopPropagation()
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
  )

  if (selected && moveEnabled) {
    return (
      <TransformControls mode="translate" onObjectChange={updateMovedPosition}>
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

export function SceneModel({ objects, selectedId, modelUrl, moveEnabled, fitEnabled, onSelect, onMoveObject }: SceneModelProps) {
  useFrame((state) => {
    state.camera.lookAt(0, 1.7, 0)
  })

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
            onSelect={onSelect}
            onMoveObject={onMoveObject}
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
    </>
  )
}
