import { Suspense, useEffect, useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "motion/react";
import { portfolioData } from "../data/portfolio";

const { experience } = portfolioData;

const GRID_SIZE = 16;
const PARTICLE_COUNT = 220;

// ─── Three.js grid background ───────────────────────────────────────────────
function GridBackground() {
  const lineRef = useRef<THREE.LineSegments>(null);
  const dotsRef = useRef<THREE.Points>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const { gridPoints, dotPositions, particlePositions } = useMemo(() => {
    const pts: number[] = [];
    const half = GRID_SIZE / 2;
    for (let i = -half; i <= half; i++) {
      pts.push(-half, 0, i, half, 0, i);
      pts.push(i, 0, -half, i, 0, half);
    }
    const dotPos: number[] = [];
    for (let x = -half; x <= half; x++) {
      for (let z = -half; z <= half; z++) {
        dotPos.push(x, 0, z);
      }
    }
    const partPos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      partPos[i * 3] = (Math.random() - 0.5) * GRID_SIZE * 1.5;
      partPos[i * 3 + 1] = (Math.random() - 0.3) * 4;
      partPos[i * 3 + 2] = (Math.random() - 0.5) * GRID_SIZE * 1.5;
    }
    return {
      gridPoints: pts,
      dotPositions: dotPos,
      particlePositions: partPos,
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 0.4 + Math.sin(t * 0.8) * 0.15;
    if (lineRef.current) {
      (lineRef.current.material as THREE.LineBasicMaterial).opacity = pulse;
    }
    if (dotsRef.current) {
      const mat = dotsRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.3 + Math.sin(t * 1.2) * 0.15;
    }
    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes.position;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos.array[i * 3 + 1] += 0.008;
        if (pos.array[i * 3 + 1] > 2) pos.array[i * 3 + 1] = -2;
      }
      pos.needsUpdate = true;
    }
  });

  const gridGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(gridPoints, 3));
    return g;
  }, [gridPoints]);

  const dotsGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(dotPositions, 3),
    );
    return g;
  }, [dotPositions]);

  const particlesGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    return g;
  }, [particlePositions]);

  return (
    <>
      <lineSegments ref={lineRef} geometry={gridGeom}>
        <lineBasicMaterial color="#22d3ee" transparent opacity={0.35} />
      </lineSegments>
      <points ref={dotsRef} geometry={dotsGeom}>
        <pointsMaterial
          size={0.08}
          color="#22d3ee"
          transparent
          opacity={0.5}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <points ref={particlesRef} geometry={particlesGeom}>
        <pointsMaterial
          size={0.04}
          color="#94a3b8"
          transparent
          opacity={0.6}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </>
  );
}

// ─── Main Experience ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.3 },
  },
};

const ACCENT_COLORS = [
  {
    badge: "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/30",
    company: "text-cyan-400",
    border: "border-l-cyan-500/50",
    borderR: "border-r-cyan-500/50",
    bullet: "before:text-cyan-400",
  },
  {
    badge: "bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30",
    company: "text-purple-400",
    border: "border-l-purple-500/50",
    borderR: "border-r-purple-500/50",
    bullet: "before:text-purple-400",
  },
  {
    badge: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30",
    company: "text-emerald-400",
    border: "border-l-emerald-500/50",
    borderR: "border-r-emerald-500/50",
    bullet: "before:text-emerald-400",
  },
  {
    badge: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30",
    company: "text-amber-400",
    border: "border-l-amber-500/50",
    borderR: "border-r-amber-500/50",
    bullet: "before:text-amber-400",
  },
];

export function Experience() {
  const sectionRef = useRef<HTMLElement>(null);
  const [canvasOn, setCanvasOn] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCanvasOn(true);
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="experience"
      className="relative overflow-hidden bg-[#0a0a0f] px-6 py-20 md:px-12 lg:px-24"
    >
      {canvasOn && (
      <div className="absolute inset-0 z-0 opacity-60">
        <Canvas
          camera={{ position: [0, 0, 12], fov: 50 }}
          dpr={1}
          gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        >
          <color attach="background" args={["#0a0a0f"]} />
          <ambientLight intensity={0.3} />
          <Suspense fallback={null}>
            <GridBackground />
          </Suspense>
        </Canvas>
      </div>
      )}

      {/* Vignette overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-1"
        style={{
          background:
            "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, rgba(10,10,15,0.6) 100%)",
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 mx-auto max-w-5xl"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={container}
      >
        <motion.p
          className="mb-2 text-sm font-medium uppercase tracking-wider"
          style={{ color: "var(--accent)" }}
          variants={fadeUp}
        >
          Career Journey
        </motion.p>
        <motion.h2
          className="font-display mb-2 text-3xl font-bold text-white md:text-4xl"
          variants={fadeUp}
        >
          Work Experience
        </motion.h2>
        <motion.p className="mb-16 text-lg text-slate-400" variants={fadeUp}>
          My professional journey — from intern to mid-level developer in 2
          years.
        </motion.p>

        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-1/2 top-0 z-0 hidden h-full w-[2px] -translate-x-1/2 bg-linear-to-b from-transparent via-white/10 to-transparent md:block" />

        <div className="space-y-0">
          {experience.map((job, i) => {
            const isEven = i % 2 === 0;
            const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
            const stats =
              "stats" in job &&
              Array.isArray((job as { stats?: string[] }).stats)
                ? (job as { stats: string[] }).stats
                : [];

            return (
              <motion.div
                key={job.id}
                className={`relative flex w-full flex-col items-center justify-between pb-16 last:pb-0 md:pb-16 ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}
                variants={fadeUp}
              >
                {/* 1. Card side (45%) */}
                <div className="w-full md:w-[45%]">
                  <motion.div
                    className={`rounded-2xl border border-white/10 bg-[#0a0a0f]/70 p-6 text-left backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/5 ${
                      isEven
                        ? `md:text-right md:border-r-4 ${accent.borderR}`
                        : `md:text-left md:border-l-4 ${accent.border}`
                    }`}
                    whileHover={{ y: -4 }}
                  >
                    <div
                      className={`mb-4 flex flex-wrap items-center gap-2 justify-start ${isEven ? "md:justify-end" : "md:justify-start"}`}
                    >
                      <span className="text-xl">{job.icon}</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${accent.badge}`}
                      >
                        {job.type}
                      </span>
                      <span className="text-sm text-slate-500">
                        {job.period}
                      </span>
                    </div>
                    <h3 className="font-display mb-1 text-xl font-semibold text-white">
                      {job.title}
                    </h3>
                    <p className={`mb-4 font-medium ${accent.company}`}>
                      @ {job.company}
                    </p>
                    <p className="mb-4 text-slate-400">{job.description}</p>

                    {stats.length > 0 && (
                      <div
                        className={`mb-4 flex flex-wrap gap-2 justify-start ${isEven ? "md:justify-end" : "md:justify-start"}`}
                      >
                        {stats.map((stat, j) => (
                          <span
                            key={j}
                            className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-mono font-medium text-slate-300 ring-1 ring-white/10"
                          >
                            {stat}
                          </span>
                        ))}
                      </div>
                    )}

                    <ul
                      className={`space-y-2 text-left ${isEven ? "md:text-right" : "md:text-left"}`}
                    >
                      {job.bullets.map((bullet, j) => (
                        <li
                          key={j}
                          className={`flex gap-2 text-slate-400 ${isEven ? "md:flex-row-reverse" : ""} before:shrink-0 before:content-['•'] ${accent.bullet}`}
                        >
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>

                {/* 2. Center dot (timeline node) */}
                <div className="absolute left-1/2 z-20 hidden -translate-x-1/2 md:block">
                  <div
                    className="h-4 w-4 rounded-full border-2 border-cyan-400 bg-[#0a0a0f] shadow-[0_0_10px_#22d3ee]"
                  />
                </div>

                {/* 3. Date side (45%) */}
                <div
                  className={`hidden w-[45%] md:block ${isEven ? "text-left" : "text-right"}`}
                >
                  <span className="inline-block rounded-full bg-white/5 px-3 py-1 font-mono text-sm text-slate-500">
                    {job.period}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
        </div>
      </motion.div>
    </section>
  );
}
