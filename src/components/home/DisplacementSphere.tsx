import { useReducedMotion, useSpring } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import {
  AmbientLight,
  DirectionalLight,
  LinearSRGBColorSpace,
  Mesh,
  MeshPhongMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  UniformsUtils,
  WebGLRenderer,
} from 'three'
import { useInViewport } from '../../hooks/useInViewport'
import { useWindowSize } from '../../hooks/useWindowSize'
import { media } from '../../utils/style'
import { throttle } from '../../utils/throttle'
import { cleanRenderer, cleanScene, removeLights } from '../../utils/three'
import fragmentShader from './displacement-sphere-fragment.glsl?raw'
import vertexShader from './displacement-sphere-vertex.glsl?raw'

const springConfig = { stiffness: 30, damping: 20, mass: 2 }

export function DisplacementSphere() {
  const start = useRef(Date.now())
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderer = useRef<WebGLRenderer | null>(null)
  const camera = useRef<PerspectiveCamera | null>(null)
  const scene = useRef<Scene | null>(null)
  const lights = useRef<Object3D[]>([])
  const uniforms = useRef<{ time: { value: number } } | null>(null)
  const material = useRef<MeshPhongMaterial | null>(null)
  const geometry = useRef<SphereGeometry | null>(null)
  const sphere = useRef<Mesh | null>(null)

  const reduceMotion = useReducedMotion()
  const isInViewport = useInViewport(canvasRef)
  const { width, height } = useWindowSize()
  const rotationX = useSpring(0, springConfig)
  const rotationY = useSpring(0, springConfig)
  const [visible, setVisible] = useState(false)

  // Fade-in transition
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const { innerWidth, innerHeight } = window
    renderer.current = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: true,
    })
    renderer.current.setSize(innerWidth, innerHeight)
    renderer.current.setPixelRatio(1)
    renderer.current.outputColorSpace = LinearSRGBColorSpace

    camera.current = new PerspectiveCamera(54, innerWidth / innerHeight, 0.1, 100)
    camera.current.position.z = 52

    scene.current = new Scene()

    material.current = new MeshPhongMaterial()
    material.current.onBeforeCompile = (shader) => {
      uniforms.current = UniformsUtils.merge([
        shader.uniforms,
        { time: { value: 0 } },
      ]) as { time: { value: number } }
      shader.uniforms = uniforms.current
      shader.vertexShader = vertexShader
      shader.fragmentShader = fragmentShader
    }

    geometry.current = new SphereGeometry(32, 128, 128)
    sphere.current = new Mesh(geometry.current, material.current)
    sphere.current.position.z = 0
    ;(sphere.current as Mesh & { modifier?: number }).modifier = Math.random()
    scene.current.add(sphere.current)

    return () => {
      if (scene.current) cleanScene(scene.current)
      if (renderer.current) cleanRenderer(renderer.current)
    }
  }, [])

  useEffect(() => {
    if (!scene.current) return
    const dirLight = new DirectionalLight(0xffffff, 2.0)
    const ambientLight = new AmbientLight(0xffffff, 0.4)
    dirLight.position.set(100, 100, 200)
    lights.current = [dirLight, ambientLight]
    lights.current.forEach((light) => scene.current!.add(light))
    return () => removeLights(lights.current, scene.current)
  }, [])

  useEffect(() => {
    const r = renderer.current
    const c = camera.current
    const s = sphere.current
    if (!r || !c || !s) return

    const adjustedHeight = height + height * 0.3
    r.setSize(width, adjustedHeight)
    c.aspect = width / adjustedHeight
    c.updateProjectionMatrix()

    if (reduceMotion) r.render(scene.current!, c)

    if (width <= media.mobile) {
      s.position.x = 14
      s.position.y = 10
    } else if (width <= media.tablet) {
      s.position.x = 18
      s.position.y = 14
    } else {
      s.position.x = 22
      s.position.y = 16
    }
  }, [reduceMotion, width, height])

  useEffect(() => {
    const onMouseMove = throttle((event: MouseEvent) => {
      const position = {
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight,
      }
      rotationX.set(position.y / 2)
      rotationY.set(position.x / 2)
    }, 100)

    if (!reduceMotion && isInViewport) {
      window.addEventListener('mousemove', onMouseMove)
    }
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [isInViewport, reduceMotion, rotationX, rotationY])

  useEffect(() => {
    let animation: number

    const animate = () => {
      animation = requestAnimationFrame(animate)
      if (uniforms.current) {
        uniforms.current.time.value = 0.00005 * (Date.now() - start.current)
      }
      if (sphere.current) {
        sphere.current.rotation.z += 0.001
        sphere.current.rotation.x = rotationX.get()
        sphere.current.rotation.y = rotationY.get()
      }
      if (renderer.current && scene.current && camera.current) {
        renderer.current.render(scene.current, camera.current)
      }
    }

    if (!reduceMotion && isInViewport) {
      animate()
    } else if (renderer.current && scene.current && camera.current) {
      renderer.current.render(scene.current, camera.current)
    }

    return () => cancelAnimationFrame(animation)
  }, [isInViewport, reduceMotion, rotationX, rotationY])

  return (
    <canvas
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-[3000ms] ease-[cubic-bezier(0.33,1,0.68,1)]"
      data-visible={visible}
      ref={canvasRef}
      style={{
        opacity: visible ? 1 : 0,
      }}
    />
  )
}
