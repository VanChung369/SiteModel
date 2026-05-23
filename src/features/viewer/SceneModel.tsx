import { Suspense, useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { Bounds, Html, TransformControls } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Group } from 'three'
import type { ModelObject } from '../../types/domain'

type SceneModelProps = {
  objects: ModelObject[]
  selectedId: string
  modelUrl: string | null
  onSelect: (id: string) => void
}

type ModelBlockProps = {
  object: ModelObject
  selected: boolean
  onSelect: (id: string) => void
}

function ModelBlock({ object, selected, onSelect }: ModelBlockProps) {
  if (!object.visible) {
    return null
  }

  return (
    <mesh
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
}

function LoadedModel({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url)

  return <primitive object={gltf.scene} scale={1.6} position={[0, 0, 0]} />
}

export function SceneModel({ objects, selectedId, modelUrl, onSelect }: SceneModelProps) {
  const activeObject = objects.find((object) => object.id === selectedId)
  const transformTarget = useMemo(() => ({ current: null as Group | null }), [])

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
      <group ref={transformTarget}>
        {objects.map((object) => (
          <ModelBlock key={object.id} object={object} selected={object.id === selectedId} onSelect={onSelect} />
        ))}
      </group>
      {activeObject ? (
        <TransformControls mode="translate" object={transformTarget.current ?? undefined} showX showY showZ />
      ) : null}
    </>
  )
}
