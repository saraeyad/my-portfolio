import type * as THREE from 'three'
import { animate, useReducedMotion, useSpring } from 'framer-motion'
import { useInViewport } from '../hooks/useInViewport'
import {
  createRef,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three'
import { HorizontalBlurShader, VerticalBlurShader } from 'three-stdlib'
import { resolveSrcFromSrcSet } from '../utils/image'
import { numToMs } from '../utils/style'
import {
  cleanRenderer,
  cleanScene,
  modelLoader,
  removeLights,
  textureLoader,
} from '../utils/three'
import { ModelAnimationType } from './device-models'
import { throttle } from '../utils/throttle'

const MeshType = {
  Frame: 'Frame',
  Logo: 'Logo',
  Screen: 'Screen',
} as const

const rotationSpringConfig = {
  stiffness: 40,
  damping: 20,
  mass: 1.4,
  restSpeed: 0.001,
}

export interface ModelTexture {
  src?: string
  srcSet?: string
  sizes?: string
  placeholder: string
}

export interface DeviceModel {
  url: string
  width: number
  height: number
  position: { x: number; y: number; z: number }
  animation: string
  texture?: ModelTexture
}

interface ModelProps {
  models: DeviceModel[]
  show?: boolean
  showDelay?: number
  cameraPosition?: { x: number; y: number; z: number }
  style?: CSSProperties
  className?: string
  onLoad?: () => void
  alt?: string
}

export function Model({
  models,
  show = true,
  showDelay = 0,
  cameraPosition = { x: 0, y: 0, z: 8 },
  style,
  className,
  onLoad,
  alt,
}: ModelProps) {
  const [loaded, setLoaded] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const camera = useRef<PerspectiveCamera>(null)
  const modelGroup = useRef<Group>(null)
  const scene = useRef<Scene>(null)
  const renderer = useRef<WebGLRenderer>(null)
  const shadowGroup = useRef<Group>(null)
  const renderTarget = useRef<WebGLRenderTarget>(null)
  const renderTargetBlur = useRef<WebGLRenderTarget>(null)
  const shadowCamera = useRef<OrthographicCamera>(null)
  const depthMaterial = useRef<MeshDepthMaterial>(null)
  const horizontalBlurMaterial = useRef<ShaderMaterial>(null)
  const verticalBlurMaterial = useRef<ShaderMaterial>(null)
  const plane = useRef<Mesh>(null)
  const lights = useRef<(AmbientLight | DirectionalLight)[]>(null)
  const blurPlane = useRef<Mesh>(null)
  const fillPlane = useRef<Mesh>(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const viewportOpts = useMemo(() => ({ threshold: 0.2 }), [])
  const isInViewport = useInViewport(container, false, viewportOpts)
  const reduceMotion = useReducedMotion()
  const rotationX = useSpring(0, rotationSpringConfig)
  const rotationY = useSpring(0, rotationSpringConfig)

  useEffect(() => {
    const { clientWidth, clientHeight } = container.current!

    renderer.current = new WebGLRenderer({
      canvas: canvas.current!,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
    })

    renderer.current.setPixelRatio(2)
    renderer.current.setSize(clientWidth, clientHeight)
    renderer.current.outputColorSpace = SRGBColorSpace

    camera.current = new PerspectiveCamera(36, clientWidth / clientHeight, 0.1, 100)
    camera.current.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)
    scene.current = new Scene()

    modelGroup.current = new Group()
    scene.current.add(modelGroup.current)

    const ambientLight = new AmbientLight(0xffffff, 1.2)
    const keyLight = new DirectionalLight(0xffffff, 1.1)
    const fillLight = new DirectionalLight(0xffffff, 0.8)

    fillLight.position.set(-6, 2, 2)
    keyLight.position.set(0.5, 0, 0.866)
    lights.current = [ambientLight, keyLight, fillLight]
    lights.current.forEach(light => scene.current!.add(light))

    shadowGroup.current = new Group()
    scene.current.add(shadowGroup.current)
    shadowGroup.current.position.set(0, 0, -0.8)
    shadowGroup.current.rotateX(Math.PI / 2)

    const renderTargetSize = 512
    const planeWidth = 8
    const planeHeight = 8
    const cameraHeight = 1.5
    const shadowOpacity = 0.8
    const shadowDarkness = 3

    renderTarget.current = new WebGLRenderTarget(renderTargetSize, renderTargetSize)
    renderTarget.current.texture.generateMipmaps = false

    renderTargetBlur.current = new WebGLRenderTarget(renderTargetSize, renderTargetSize)
    renderTargetBlur.current.texture.generateMipmaps = false

    const planeGeometry = new PlaneGeometry(planeWidth, planeHeight).rotateX(Math.PI / 2)

    const planeMaterial = new MeshBasicMaterial({
      map: renderTarget.current.texture,
      opacity: shadowOpacity,
      transparent: true,
    })

    plane.current = new Mesh(planeGeometry, planeMaterial)
    plane.current.scale.y = -1
    shadowGroup.current.add(plane.current)

    blurPlane.current = new Mesh(planeGeometry)
    blurPlane.current.visible = false
    shadowGroup.current.add(blurPlane.current)

    const fillMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0,
      transparent: true,
    })

    fillPlane.current = new Mesh(planeGeometry, fillMaterial)
    fillPlane.current.rotateX(Math.PI)
    fillPlane.current.position.y -= 0.00001
    shadowGroup.current.add(fillPlane.current)

    shadowCamera.current = new OrthographicCamera(
      -planeWidth / 2,
      planeWidth / 2,
      planeHeight / 2,
      -planeHeight / 2,
      0,
      cameraHeight
    )
    shadowCamera.current.rotation.x = Math.PI / 2
    shadowGroup.current.add(shadowCamera.current)

    depthMaterial.current = new MeshDepthMaterial()
    depthMaterial.current.userData.darkness = { value: shadowDarkness }
    depthMaterial.current.onBeforeCompile = shader => {
      shader.uniforms.darkness = depthMaterial.current!.userData.darkness
      shader.fragmentShader = `
        uniform float darkness;
        ${shader.fragmentShader.replace(
          'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
          'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );'
        )}
      `
    }
    depthMaterial.current.depthTest = false
    depthMaterial.current.depthWrite = false

    horizontalBlurMaterial.current = new ShaderMaterial(HorizontalBlurShader)
    horizontalBlurMaterial.current.depthTest = false

    verticalBlurMaterial.current = new ShaderMaterial(VerticalBlurShader)
    verticalBlurMaterial.current.depthTest = false

    const unsubscribeX = rotationX.on('change', renderFrame)
    const unsubscribeY = rotationY.on('change', renderFrame)

    return () => {
      renderTarget.current?.dispose()
      renderTargetBlur.current?.dispose()
      if (lights.current) removeLights(lights.current, scene.current)
      cleanScene(scene.current)
      cleanRenderer(renderer.current)
      unsubscribeX()
      unsubscribeY()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const blurShadow = useCallback((amount: number) => {
    blurPlane.current!.visible = true

    ;(blurPlane.current as Mesh).material = horizontalBlurMaterial.current!
    horizontalBlurMaterial.current!.uniforms.tDiffuse.value = renderTarget.current!.texture
    horizontalBlurMaterial.current!.uniforms.h.value = amount * (1 / 256)

    renderer.current!.setRenderTarget(renderTargetBlur.current)
    renderer.current!.render(blurPlane.current!, shadowCamera.current!)

    ;(blurPlane.current as Mesh).material = verticalBlurMaterial.current!
    verticalBlurMaterial.current!.uniforms.tDiffuse.value = renderTargetBlur.current!.texture
    verticalBlurMaterial.current!.uniforms.v.value = amount * (1 / 256)

    renderer.current!.setRenderTarget(renderTarget.current)
    renderer.current!.render(blurPlane.current!, shadowCamera.current!)

    blurPlane.current!.visible = false
  }, [])

  const renderFrame = useCallback(() => {
    const blurAmount = 5

    const initialBackground = scene.current!.background
    scene.current!.background = null
    scene.current!.overrideMaterial = depthMaterial.current

    renderer.current!.setRenderTarget(renderTarget.current)
    renderer.current!.render(scene.current!, shadowCamera.current!)

    scene.current!.overrideMaterial = null

    blurShadow(blurAmount)
    blurShadow(blurAmount * 0.4)

    renderer.current!.setRenderTarget(null)
    scene.current!.background = initialBackground

    modelGroup.current!.rotation.x = rotationX.get()
    modelGroup.current!.rotation.y = rotationY.get()

    renderer.current!.render(scene.current!, camera.current!)
  }, [blurShadow, rotationX, rotationY])

  useEffect(() => {
    const onMouseMove = throttle((event: MouseEvent) => {
      const { innerWidth, innerHeight } = window
      const position = {
        x: (event.clientX - innerWidth / 2) / innerWidth,
        y: (event.clientY - innerHeight / 2) / innerHeight,
      }
      rotationY.set(position.x / 2)
      rotationX.set(position.y / 2)
    }, 100)

    if (isInViewport && !reduceMotion) {
      window.addEventListener('mousemove', onMouseMove)
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [isInViewport, reduceMotion, rotationX, rotationY])

  useEffect(() => {
    const handleResize = () => {
      if (!container.current) return
      const { clientWidth, clientHeight } = container.current
      renderer.current!.setSize(clientWidth, clientHeight)
      camera.current!.aspect = clientWidth / clientHeight
      camera.current!.updateProjectionMatrix()
      renderFrame()
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [renderFrame])

  return (
    <div
      className={`relative ${className ?? ''}`}
      data-loaded={loaded}
      style={{
        opacity: loaded ? undefined : 0,
        animation: loaded ? `fade-in 1s ease forwards ${numToMs(showDelay)}` : undefined,
        ...style,
      } as CSSProperties}
      ref={container}
      role="img"
      aria-label={alt}
    >
      <canvas style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} ref={canvas} />
      {models.map((model, index) => (
        <Device
          key={JSON.stringify(model.position)}
          renderer={renderer}
          modelGroup={modelGroup}
          show={show}
          showDelay={showDelay}
          renderFrame={renderFrame}
          index={index}
          setLoaded={setLoaded}
          onLoad={onLoad}
          model={model}
        />
      ))}
    </div>
  )
}

interface DeviceProps {
  renderer: React.RefObject<WebGLRenderer | null>
  model: DeviceModel
  modelGroup: React.RefObject<Group | null>
  renderFrame: () => void
  index: number
  showDelay: number
  setLoaded: (v: boolean) => void
  onLoad?: () => void
  show: boolean
}

function Device({
  renderer,
  model,
  modelGroup,
  renderFrame,
  index,
  showDelay,
  setLoaded,
  onLoad,
  show,
}: DeviceProps) {
  const [loadDevice, setLoadDevice] = useState<{ start: () => Promise<unknown> } | null>(null)
  const reduceMotion = useReducedMotion()
  const placeholderScreen = createRef<Mesh>()

  useEffect(() => {
    const applyScreenTexture = async (texture: THREE.Texture, node: Mesh) => {
      texture.colorSpace = SRGBColorSpace
      texture.flipY = false
      texture.anisotropy = renderer.current!.capabilities.getMaxAnisotropy()
      texture.generateMipmaps = false
      await renderer.current!.initTexture(texture)
      node.material = node.material as THREE.MeshStandardMaterial
      ;(node.material as THREE.MeshStandardMaterial).color = new Color(0xffffff)
      ;(node.material as THREE.MeshStandardMaterial).transparent = true
      ;(node.material as THREE.MeshStandardMaterial).map = texture
    }

    const load = async () => {
      const { texture, position, url } = model
      let loadFullResTexture: (() => Promise<void>) | undefined
      let playAnimation: (() => { stop: () => void } | undefined) | undefined

      const [placeholder, gltf] = await Promise.all([
        textureLoader.loadAsync(texture!.placeholder),
        modelLoader.loadAsync(url),
      ])

      modelGroup.current!.add(gltf.scene)

      gltf.scene.traverse(async (node) => {
        const meshNode = node as Mesh
        if (meshNode.material) {
          ;(meshNode.material as THREE.MeshStandardMaterial).color = new Color(0x1f2025)
        }

        if (node.name === MeshType.Screen) {
          const screenMesh = node as Mesh
          const cloned = screenMesh.clone() as Mesh
          cloned.material = (screenMesh.material as THREE.Material).clone() as THREE.Material
          screenMesh.parent!.add(cloned)
          ;(cloned.material as THREE.MeshStandardMaterial).opacity = 1
          cloned.position.z += 0.001
          ;(placeholderScreen as React.MutableRefObject<Mesh | null>).current = cloned

          applyScreenTexture(placeholder, cloned)

          loadFullResTexture = async () => {
            const image = await resolveSrcFromSrcSet({
              srcSet: texture!.srcSet!,
              sizes: texture!.sizes,
            })
            const fullSize = await textureLoader.loadAsync(image)
            await applyScreenTexture(fullSize, screenMesh)

            animate(1, 0, {
              onUpdate: value => {
                ;(cloned.material as THREE.MeshStandardMaterial).opacity = value
                renderFrame()
              },
            })
          }
        }
      })

      const targetPosition = new Vector3(position.x, position.y, position.z)

      if (reduceMotion) {
        gltf.scene.position.set(...targetPosition.toArray())
      }

      if (model.animation === ModelAnimationType.SpringUp) {
        playAnimation = () => {
          const startPosition = new Vector3(
            targetPosition.x,
            targetPosition.y - 1,
            targetPosition.z
          )
          gltf.scene.position.set(...startPosition.toArray())

          return animate(startPosition.y, targetPosition.y, {
            type: 'spring',
            delay: (300 * index + showDelay) / 1000,
            stiffness: 60,
            damping: 20,
            mass: 1,
            restSpeed: 0.0001,
            restDelta: 0.0001,
            onUpdate: value => {
              gltf.scene.position.y = value
              renderFrame()
            },
          })
        }
      }

      if (model.animation === ModelAnimationType.LaptopOpen) {
        playAnimation = () => {
          const frameNode = gltf.scene.children.find(n => n.name === MeshType.Frame)
          const startRotation = new Vector3(MathUtils.degToRad(90), 0, 0)
          const endRotation = new Vector3(0, 0, 0)

          gltf.scene.position.set(...targetPosition.toArray())
          frameNode!.rotation.set(...startRotation.toArray())

          return animate(startRotation.x, endRotation.x, {
            type: 'spring',
            delay: (300 * index + showDelay + 300) / 1000,
            stiffness: 80,
            damping: 20,
            restSpeed: 0.0001,
            restDelta: 0.0001,
            onUpdate: value => {
              frameNode!.rotation.x = value
              renderFrame()
            },
          })
        }
      }

      return { loadFullResTexture, playAnimation }
    }

    setLoadDevice({ start: load })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!loadDevice || !show) return
    let animation: { stop: () => void } | undefined

    const onModelLoad = async () => {
      const { loadFullResTexture, playAnimation } = (await loadDevice.start()) as {
        loadFullResTexture?: () => Promise<void>
        playAnimation?: () => { stop: () => void } | undefined
      }

      setLoaded(true)
      onLoad?.()

      if (!reduceMotion) {
        animation = playAnimation?.()
      }

      await loadFullResTexture?.()

      if (reduceMotion) {
        renderFrame()
      }
    }

    startTransition(() => {
      onModelLoad()
    })

    return () => {
      animation?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDevice, show])

  return null
}
