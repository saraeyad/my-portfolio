import { Suspense, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

function ScreenWithImage({ src }: { src: string }) {
  const texture = useTexture(src) as THREE.Texture
  texture.flipY = false
  texture.colorSpace = THREE.SRGBColorSpace
  return (
    <mesh position={[0, 0.45, 0.022]}>
      <planeGeometry args={[1.48, 0.84]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

function ScreenPlain() {
  return (
    <mesh position={[0, 0.45, 0.022]}>
      <planeGeometry args={[1.48, 0.84]} />
      <meshBasicMaterial color="#1e3a5f" />
    </mesh>
  )
}

interface LaptopMeshInSceneProps {
  screenImage?: string
  position: [number, number, number]
  scale?: number
  mouseX: { get: () => number }
  mouseY: { get: () => number }
  lidRotation: React.MutableRefObject<number>
}

export function LaptopMeshInScene({
  screenImage,
  position,
  scale = 3,
  mouseX,
  mouseY,
  lidRotation,
}: LaptopMeshInSceneProps) {
  const groupRef = useRef<THREE.Group>(null)
  const lidRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = mouseY.get()
      groupRef.current.rotation.y = mouseX.get()
    }
    if (lidRef.current) {
      lidRef.current.rotation.x = lidRotation.current
    }
  })

  return (
    <group ref={groupRef} position={position} rotation={[0.12, 0, 0]} scale={scale}>
      <mesh position={[0, -0.25, -0.05]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.2, 1.4]} />
        <shadowMaterial opacity={0.25} />
      </mesh>

      <group ref={lidRef} position={[0, -0.08, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <RoundedBox
          position={[0, 0.45, 0]}
          args={[1.62, 0.92, 0.02]}
          radius={0.012}
          smoothness={4}
          castShadow
        >
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.4}
            roughness={0.5}
            emissive="#080808"
          />
        </RoundedBox>
        {screenImage ? (
          <Suspense fallback={<ScreenPlain />}>
            <ScreenWithImage src={screenImage} />
          </Suspense>
        ) : (
          <ScreenPlain />
        )}
      </group>

      <RoundedBox
        position={[0, 0, -0.14]}
        args={[1.62, 0.06, 0.92]}
        radius={0.008}
        smoothness={4}
        castShadow
      >
        <meshStandardMaterial color="#151515" metalness={0.3} roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.005, -0.12]}>
        <planeGeometry args={[1.2, 0.4]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.1} roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.01, -0.18]}>
        <planeGeometry args={[0.55, 0.28]} />
        <meshStandardMaterial color="#0d0d0d" metalness={0.15} roughness={0.85} />
      </mesh>
    </group>
  )
}
