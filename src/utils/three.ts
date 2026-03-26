import { Cache, TextureLoader } from 'three'
import { DRACOLoader, GLTFLoader } from 'three-stdlib'
import type { Material, Mesh, Object3D, Scene } from 'three'

// Enable caching for all loaders
Cache.enabled = true

const dracoLoader = new DRACOLoader()
const gltfLoader = new GLTFLoader()
dracoLoader.setDecoderPath('/draco/')
gltfLoader.setDRACOLoader(dracoLoader)

export const modelLoader = gltfLoader
export const textureLoader = new TextureLoader()

export function getChild(name: string, object: Object3D): Object3D | undefined {
  let node: Object3D | undefined
  object.traverse((child) => {
    if (child.name === name) node = child
  })
  return node
}

export function cleanScene(scene: Scene | null) {
  if (!scene) return
  scene.traverse((object) => {
    if (!(object as Mesh).isMesh) return
    const mesh = object as Mesh
    mesh.geometry?.dispose()
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(cleanMaterial)
    } else {
      cleanMaterial(mesh.material)
    }
  })
}

function cleanMaterial(material: Material) {
  material.dispose()
  for (const key of Object.keys(material)) {
    const value = (material as unknown as Record<string, unknown>)[key]
    if (value && typeof value === 'object' && 'minFilter' in (value as object)) {
      ;(value as { dispose?: () => void }).dispose?.()
    }
  }
}

export function cleanRenderer(renderer: { dispose: () => void } | null) {
  renderer?.dispose()
}

export function removeLights(lights: Object3D[], scene: Scene | null) {
  if (!scene) return
  for (const light of lights) {
    scene.remove(light)
  }
}
