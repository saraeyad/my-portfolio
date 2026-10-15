import {
  ACESFilmicToneMapping,
  AmbientLight,
  DirectionalLight,
  EquirectangularReflectionMapping,
  LinearFilter,
  LinearMipMapLinearFilter,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  Raycaster,
  RepeatWrapping,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three-stdlib";
import { useSpring, useReducedMotion } from "framer-motion";
import { useInViewport } from "../../hooks/useInViewport";
import { useWindowSize } from "../../hooks/useWindowSize";
import { throttle } from "../../utils/throttle";
import { cleanScene, cleanRenderer } from "../../utils/three";
import {
  createContext,
  memo,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import "./Earth.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EarthLabel {
  position: [number, number, number];
  text: string;
  hidden?: boolean;
  delay?: number;
  onClick?: () => void;
  color?: string;
}

interface SectionRef {
  camera: [number, number, number];
  animations: string[];
  meshes: string[];
  labels: string[];
  sectionRef: React.RefObject<HTMLDivElement | null>;
}

interface EarthContextValue {
  registerSection: (section: SectionRef) => void;
  unregisterSection: (section: SectionRef) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const nullTarget = { x: 0, y: 0, z: 2 };

const interpolatePosition = (
  value: number,
  nextValue: number,
  percent: number,
) => value + percent * (nextValue - value);

const positionToString = (value: { x: number; y: number; z: number }) =>
  Object.keys(value)
    .map((key) =>
      parseFloat(
        String(Math.round((value as Record<string, number>)[key] * 100) / 100),
      ).toFixed(2),
    )
    .join(", ");

const getPositionValues = (section: SectionRef | undefined) => {
  if (!section || !section.camera) return nullTarget;
  return { x: section.camera[0], y: section.camera[1], z: section.camera[2] };
};

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);
const numToPx = (n: number) => `${n}px`;
const labelVector = new Vector3();

// ─── Spring configs ───────────────────────────────────────────────────────────

const cameraSpringConfig = {
  stiffness: 80,
  damping: 40,
  mass: 2,
  restSpeed: 0.001,
  restDelta: 0.001,
};

// ─── Context ──────────────────────────────────────────────────────────────────

const EarthContext = createContext<EarthContextValue>({
  registerSection: () => {},
  unregisterSection: () => {},
});

// ─── Earth Component ──────────────────────────────────────────────────────────

interface EarthProps {
  position?: [number, number, number];
  scale?: number;
  labels?: EarthLabel[];
  className?: string;
  sectionCount?: number; // number of scroll sections (intro + projects + outro)
  children?: ReactNode;
}

export const Earth = ({
  position = [0, 0, 0],
  scale = 1,
  labels = [],
  className,
  sectionCount = 7,
  children,
}: EarthProps) => {
  const [loaded, setLoaded] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(false);

  const sectionRefs = useRef<SectionRef[]>([]);
  const container = useRef<HTMLDivElement>(null);
  const labelContainer = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<Scene | null>(null);
  const renderer = useRef<WebGLRenderer | null>(null);
  const camera = useRef<PerspectiveCamera | null>(null);

  const mouse = useRef<Vector2 | null>(null);
  const raycaster = useRef<Raycaster | null>(null);
  const earthMesh = useRef<Mesh | null>(null);
  const inViewport = useInViewport(canvas);
  const animationFrame = useRef<number>(0);
  const initCameraPosition = useRef(getPositionValues(sectionRefs.current[0]));
  const labelElements = useRef<
    Array<{
      element: HTMLElement;
      position: [number, number, number];
      sprite: Sprite;
      text: string;
      hidden?: boolean;
      onClick?: () => void;
      color?: string;
    }>
  >([]);
  const controls = useRef<OrbitControls | null>(null);
  const contentAdded = useRef(false);
  const mounted = useRef(false);
  const lastFrame = useRef(0);
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const reduceMotion = useReducedMotion();

  const cameraXSpring = useSpring(0, cameraSpringConfig);
  const cameraYSpring = useSpring(0, cameraSpringConfig);
  const cameraZSpring = useSpring(0, cameraSpringConfig);

  const renderFrame = useCallback((time?: number) => {
    if (!inViewport) {
      cancelAnimationFrame(animationFrame.current);
      return;
    }

    animationFrame.current = requestAnimationFrame(renderFrame);
    if (document.hidden) return;

    const now = time ?? performance.now();
    if (now - lastFrame.current < 32) return;
    const delta = lastFrame.current === 0 ? 16.67 : now - lastFrame.current;
    lastFrame.current = now;

    if (earthMesh.current) {
      earthMesh.current.rotation.y += 0.00003 * delta;
    }

    if (camera.current && !grabbing) {
      camera.current.position.x = cameraXSpring.get();
      camera.current.position.y = cameraYSpring.get();
      camera.current.position.z = cameraZSpring.get();
    }
    if (renderer.current && scene.current && camera.current) {
      renderer.current.render(scene.current, camera.current);
    }

    labelElements.current.forEach((label) => {
      const { element, position, sprite } = label;
      if (element.dataset.hidden === "true") return;
      if (!earthMesh.current || !camera.current) return;

      const meshDistance = camera.current.position.distanceTo(
        earthMesh.current.position,
      );
      const spriteDistance = camera.current.position.distanceTo(
        sprite.position,
      );
      const occluded = String(spriteDistance > meshDistance);
      if (element.dataset.occluded !== occluded) {
        element.dataset.occluded = occluded;
      }

      labelVector.set(position[0], position[1], position[2]);
      labelVector.project(camera.current);
      const x = Math.round((0.5 + labelVector.x / 2) * window.innerWidth);
      const y = Math.round((0.5 - labelVector.y / 2) * window.innerHeight);
      const node = element as HTMLElement & { _lx?: number; _ly?: number };
      if (node._lx === x && node._ly === y) return;
      node._lx = x;
      node._ly = y;
      element.style.setProperty("--posX", numToPx(x));
      element.style.setProperty("--posY", numToPx(y));
    });
  }, [inViewport, grabbing, cameraXSpring, cameraYSpring, cameraZSpring]);

  // Init scene
  useEffect(() => {
    mounted.current = true;
    const { innerWidth, innerHeight } = window;

    renderer.current = new WebGLRenderer({
      canvas: canvas.current!,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.current.setPixelRatio(1);
    renderer.current.outputColorSpace = SRGBColorSpace;
    renderer.current.toneMapping = ACESFilmicToneMapping;

    camera.current = new PerspectiveCamera(
      54,
      innerWidth / innerHeight,
      0.1,
      200,
    );
    camera.current.position.x = initCameraPosition.current.x;
    camera.current.position.y = initCameraPosition.current.y;
    camera.current.position.z = initCameraPosition.current.z;
    camera.current.lookAt(0, 0, 0);

    cameraXSpring.jump(camera.current.position.x);
    cameraYSpring.jump(camera.current.position.y);
    cameraZSpring.jump(camera.current.position.z);

    scene.current = new Scene();
    raycaster.current = new Raycaster();

    // Lighting: brighter so Earth isn't overly dark
    const ambientLight = new AmbientLight(0xffffff, 0.6);
    const mainLight = new DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(4, 3, 2);
    const fillLight = new DirectionalLight(0xffffff, 0.25);
    fillLight.position.set(-2, 0, 1);
    scene.current.add(ambientLight, mainLight, fillLight);

    controls.current = new OrbitControls(camera.current, canvas.current!);
    controls.current.enableZoom = false;
    controls.current.enablePan = false;
    controls.current.enableDamping = false;
    controls.current.rotateSpeed = 0.5;

    return () => {
      mounted.current = false;
      cancelAnimationFrame(animationFrame.current);
      if (scene.current) cleanScene(scene.current);
      cleanRenderer(renderer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Orbit controls events
  useEffect(() => {
    if (!controls.current) return;

    const handleControlStart = () => {
      setGrabbing(true);
      cameraXSpring.stop();
      cameraYSpring.stop();
      cameraZSpring.stop();
    };
    const handleControlEnd = () => {
      if (camera.current) {
        cameraXSpring.set(camera.current.position.x);
        cameraYSpring.set(camera.current.position.y);
        cameraZSpring.set(camera.current.position.z);
      }
      setGrabbing(false);
    };

    controls.current.addEventListener("start", handleControlStart);
    controls.current.addEventListener("end", handleControlEnd);
    return () => {
      controls.current?.removeEventListener("start", handleControlStart);
      controls.current?.removeEventListener("end", handleControlEnd);
    };
  }, [cameraXSpring, cameraYSpring, cameraZSpring]);

  // Disable controls on mobile
  useEffect(() => {
    if (controls.current && windowWidth <= 1040) {
      controls.current.enabled = false;
    }
  }, [windowWidth]);

  // Load Earth assets (sphere + textures)
  useEffect(() => {
    if (loaded) return;

    const loader = new TextureLoader();

    const handleLoad = async () => {
      try {
        const [earthMap, spaceBg] = await Promise.all([
          loader.loadAsync("/textures/earth-map.jpg"),
          loader.loadAsync("/textures/space-nebula.jpg").catch(() => null),
        ]);

        if (!scene.current || !mounted.current) return;

        // ── Texture config: high-quality filtering, no seam artifacts ──────────
        earthMap.wrapS = RepeatWrapping;
        earthMap.wrapT = RepeatWrapping;
        earthMap.colorSpace = SRGBColorSpace;
        earthMap.minFilter = LinearMipMapLinearFilter;
        earthMap.magFilter = LinearFilter;
        earthMap.anisotropy = Math.min(
          4,
          renderer.current?.capabilities.getMaxAnisotropy() ?? 4,
        );
        earthMap.needsUpdate = true;

        // ── Background: real nebula/space texture (like reference) ─────────────
        if (spaceBg) {
          spaceBg.mapping = EquirectangularReflectionMapping;
          spaceBg.colorSpace = SRGBColorSpace;
          scene.current.background = spaceBg;
        } else {
          scene.current.background = null;
        }

        // ── Earth sphere — high segment count avoids visible geometry ribs ─────
        const geo = new SphereGeometry(1, 64, 64);
        const mat = new MeshPhongMaterial({
          map: earthMap,
          specular: 0x333333,
          shininess: 12,
        });

        earthMesh.current = new Mesh(geo, mat);
        earthMesh.current.position.set(...position);
        earthMesh.current.scale.setScalar(scale);
        earthMesh.current.rotation.y = Math.PI * 0.5;

        scene.current.add(earthMesh.current);
        contentAdded.current = true;

        if (mounted.current) setLoaded(true);
      } catch (err) {
        console.error("Earth load error:", err);
      }
    };

    startTransition(() => {
      handleLoad();
      setTimeout(() => {
        setLoaderVisible(true);
      }, 800);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // Start rendering when visible
  useEffect(() => {
    if (loaded && inViewport) {
      setVisible(true);
      renderFrame();
    }
    return () => {
      cancelAnimationFrame(animationFrame.current);
    };
  }, [renderFrame, inViewport, loaded]);

  // Rebuild labels when labels prop or loaded changes
  useEffect(() => {
    if (!loaded || !labelContainer.current) return;

    labelContainer.current.innerHTML = "";
    labelElements.current = labels.map((label) => {
      const element = document.createElement("div");
      element.classList.add("earth__label");
      element.dataset.hidden = "true";
      element.style.setProperty("--delay", `${label.delay ?? 0}ms`);
      if (label.color) element.style.color = label.color;
      element.textContent = label.text;

      if (label.onClick) {
        element.addEventListener("click", label.onClick);
        element.style.cursor = "pointer";
      }

      labelContainer.current!.appendChild(element);

      const sprite = new Sprite(new SpriteMaterial({ opacity: 0 }));
      sprite.position.set(...label.position);

      return { element, ...label, sprite };
    });
  }, [labels, loaded]);

  // Resize handler
  useEffect(() => {
    if (!renderer.current || !camera.current) return;
    renderer.current.setSize(windowWidth, windowHeight);
    camera.current.aspect = windowWidth / windowHeight;
    camera.current.updateProjectionMatrix();
  }, [windowWidth, windowHeight]);

  // Dev: log camera position on click
  useEffect(() => {
    const currentCanvas = canvas.current;
    if (!currentCanvas) return;

    const handleMouseUp = (event: MouseEvent) => {
      if (!camera.current) return;
      console.info(
        "cameraPosition:",
        positionToString(camera.current.position),
      );

      mouse.current = new Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
      );
      if (raycaster.current && scene.current) {
        raycaster.current.setFromCamera(mouse.current, camera.current);
        const intersects = raycaster.current.intersectObjects(
          scene.current.children,
          true,
        );
        if (intersects.length > 0) {
          console.info("clickPosition:", positionToString(intersects[0].point));
        }
      }
    };

    if (import.meta.env.DEV) {
      currentCanvas.addEventListener("click", handleMouseUp);
    }
    return () => currentCanvas.removeEventListener("click", handleMouseUp);
  }, []);

  // Scroll handler (camera + labels per section)
  const handleScroll = useCallback(() => {
    if (!container.current || !earthMesh.current) return;

    const { offsetTop } = container.current;
    const { innerHeight } = window;
    const currentScrollY = window.scrollY - offsetTop;
    let prevTarget: { x: number; y: number; z: number } | undefined;

    const updateLabels = (index: number) => {
      labelElements.current.forEach((label) => {
        if (label.hidden) {
          label.element.dataset.hidden = "true";
          label.element.setAttribute("aria-hidden", "true");
        }
      });
      const sectionLabels = sectionRefs.current[index]?.labels ?? [];
      sectionLabels.forEach((labelText) => {
        const matches = labelElements.current.filter(
          (item) => item.text === labelText,
        );
        matches.forEach((match) => {
          match.element.dataset.hidden = "false";
          match.element.setAttribute("aria-hidden", "false");
        });
      });
    };

    const update = () => {
      const sectionCount = sectionRefs.current.length - 1;
      const absoluteSection = Math.floor(currentScrollY / innerHeight);
      const currentSectionIndex = clamp(absoluteSection, 0, sectionCount);
      const currentSection = sectionRefs.current[currentSectionIndex];
      const nextSection = sectionRefs.current[currentSectionIndex + 1];

      const currentTarget = getPositionValues(currentSection) ?? nullTarget;
      const nextTarget = getPositionValues(nextSection) ?? nullTarget;
      const sectionScrolled =
        (currentScrollY - innerHeight * currentSectionIndex) / innerHeight;
      const scrollPercent = clamp(sectionScrolled, 0, 1);

      const cx = interpolatePosition(
        currentTarget.x,
        nextTarget.x,
        scrollPercent,
      );
      const cy = interpolatePosition(
        currentTarget.y,
        nextTarget.y,
        scrollPercent,
      );
      const cz = interpolatePosition(
        currentTarget.z,
        nextTarget.z,
        scrollPercent,
      );

      if (
        prevTarget !== currentTarget &&
        sectionRefs.current.length &&
        currentSection
      ) {
        updateLabels(currentSectionIndex);
      }
      prevTarget = currentTarget;

      if (grabbing) return;

      if (reduceMotion) {
        camera.current?.position.set(cx, cy, cz);
        return;
      }

      cameraXSpring.set(cx);
      cameraYSpring.set(cy);
      cameraZSpring.set(cz);
    };

    requestAnimationFrame(update);
  }, [cameraXSpring, cameraYSpring, cameraZSpring, grabbing, reduceMotion]);

  useEffect(() => {
    const throttledScroll = throttle(handleScroll, 100);
    if (loaded && inViewport) {
      window.addEventListener("scroll", throttledScroll);
    }
    return () => window.removeEventListener("scroll", throttledScroll);
  }, [handleScroll, inViewport, loaded]);

  const registerSection = useCallback((section: SectionRef) => {
    sectionRefs.current = [...sectionRefs.current, section];
  }, []);

  const unregisterSection = useCallback((section: SectionRef) => {
    sectionRefs.current = sectionRefs.current.filter(
      (item) => item !== section,
    );
  }, []);

  return (
    <EarthContext.Provider value={{ registerSection, unregisterSection }}>
      <div
        className={`earth${className ? ` ${className}` : ""}`}
        ref={container}
        style={{ minHeight: `calc(100vh * ${sectionCount})` }}
      >
        <div className="earth__viewport">
          <canvas
            className="earth__canvas"
            data-visible={loaded && visible}
            data-grabbing={grabbing}
            ref={canvas}
          />
          <div
            className="earth__labels"
            aria-live="polite"
            ref={labelContainer}
          />
          <div className="earth__vignette" />
        </div>
        <div className="earth__sections">{children}</div>
        {!loaded && loaderVisible && (
          <div className="earth__loader" data-visible="true">
            Loading…
          </div>
        )}
      </div>
    </EarthContext.Provider>
  );
};

// ─── EarthSection ─────────────────────────────────────────────────────────────

interface EarthSectionProps {
  children?: ReactNode;
  scrim?: boolean;
  scrimReverse?: boolean;
  className?: string;
  camera?: [number, number, number];
  animations?: string[];
  meshes?: string[];
  labels?: string[];
}

export const EarthSection = memo(
  ({
    children,
    scrim,
    scrimReverse,
    className,
    camera = [0, 0, 0],
    animations = [],
    meshes = [],
    labels = [],
  }: EarthSectionProps) => {
    const { registerSection, unregisterSection } = useContext(EarthContext);
    const sectionRef = useRef<HTMLDivElement>(null);

    const stringifiedDeps =
      JSON.stringify(animations) +
      JSON.stringify(camera) +
      JSON.stringify(labels) +
      JSON.stringify(meshes);

    useEffect(() => {
      const section: SectionRef = {
        camera,
        animations,
        meshes,
        labels,
        sectionRef,
      };
      registerSection(section);
      return () => unregisterSection(section);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stringifiedDeps, registerSection, unregisterSection]);

    return (
      <div
        className={`earth__section${className ? ` ${className}` : ""}`}
        data-scrim={scrim}
        data-scrim-reverse={scrimReverse}
        ref={sectionRef}
      >
        {children}
      </div>
    );
  },
);
