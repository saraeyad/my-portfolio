import { Suspense, lazy, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { portfolioData } from "../../data/portfolio";
import { ProjectDrawer } from "../../components/projects/ProjectDrawer";
import type { ProjectWithDetails } from "../../components/projects/ProjectDrawer";

const Earth = lazy(() =>
  import("../../components/earth/Earth").then((m) => ({ default: m.Earth })),
);
const EarthSection = lazy(() =>
  import("../../components/earth/Earth").then((m) => ({
    default: m.EarthSection,
  })),
);

// ─── Camera positions for each section ───────────────────────────────────────
// Tuned so the globe appears to rotate around the world as you scroll
const CAMERAS: [number, number, number][] = [
  [0, 0, 2.5], // intro
  [0.4, 0.2, 2.3], // project 1
  [1.4, -0.3, 1.8], // project 2
  [1.9, 0.4, 0.8], // project 3
  [0.6, 0.85, 1.9], // project 4
  [-0.6, 0.2, 2.3], // project 5
  [-1.4, -0.25, 1.6], // project 6
  [0, 0, 2.5], // outro
];

// ─── Label positions on the Earth surface (sphere r ≈ 1) ────────────────────
const LABEL_POSITIONS: [number, number, number][] = [
  [0.05, 0.12, 1.1], // project 1
  [0.82, -0.15, 0.75], // project 2
  [0.98, 0.3, 0.2], // project 3
  [0.35, 0.72, 0.8], // project 4
  [-0.5, 0.18, 1.0], // project 5
  [-0.69, -0.12, 0.78], // project 6
];

export function ProjectsPage() {
  const { projects } = portfolioData;
  const [drawerProject, setDrawerProject] = useState<ProjectWithDetails | null>(
    null,
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Build labels from projects
  const earthLabels = useMemo(
    () =>
      projects.map((p, i) => ({
        position:
          LABEL_POSITIONS[i] ?? ([0, 0, 1.1] as [number, number, number]),
        text: p.title,
        hidden: true,
        delay: i * 100,
        color: p.color,
        onClick: () => setDrawerProject(p as ProjectWithDetails),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects],
  );

  return (
    <main
      className="projects-page relative"
      style={{ background: "var(--bg-primary)", minHeight: "100vh" }}
    >
      {/* ── Back link ── */}
      <div className="projects-back-wrap absolute left-3 top-3 z-[100] pointer-events-auto min-[753px]:fixed min-[753px]:left-6 min-[753px]:top-6">
        <Link to="/" className="projects-back-link">
          ← Back
        </Link>
      </div>

      {/* ── Earth (sticky scroll experience) ── */}
      <Suspense
        fallback={<div style={{ height: "100vh", background: "#0a0a0f" }} />}
      >
        <Earth
          scale={0.9}
          position={[0, 0, 0]}
          labels={earthLabels}
          sectionCount={2 + projects.length + 1}
        >
          {/* ── Intro section ── */}
          <EarthSection scrim camera={CAMERAS[0]} meshes={["Atmosphere"]}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="earth__section-inner earth__section-inner--center"
            >
              <div className="projects-intro-label">My Work</div>
              <h1 className="projects-intro-title">
                Featured <span className="gradient-text">Projects</span>
              </h1>
              <p className="projects-intro-desc">
                Scroll to explore — each region of the globe is a project.
                <br />
                Click a label to open details.
              </p>
            </motion.div>
          </EarthSection>

          {/* ── One section per project ── */}
          {projects.map((project, i) => {
            const isEven = i % 2 === 0;
            return (
              <EarthSection
                key={project.id}
                camera={CAMERAS[i + 1] ?? CAMERAS[CAMERAS.length - 1]}
                meshes={["Atmosphere"]}
                labels={[project.title]}
              >
                <div
                  className={`earth__section-inner earth__section-inner--${isEven ? "left" : "right"}`}
                >
                  <ProjectSectionContent
                    project={project as ProjectWithDetails}
                    index={i}
                    onDetails={setDrawerProject}
                  />
                </div>
              </EarthSection>
            );
          })}

          {/* ── Outro ── */}
          <EarthSection scrimReverse camera={CAMERAS[CAMERAS.length - 1]} />
        </Earth>
      </Suspense>

      {/* ── Project Drawer ── */}
      <AnimatePresence>
        {drawerProject && (
          <ProjectDrawer
            project={drawerProject}
            onClose={() => setDrawerProject(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// ─── Project section content card ─────────────────────────────────────────────

interface ProjectSectionContentProps {
  project: ProjectWithDetails;
  index: number;
  onDetails: (p: ProjectWithDetails) => void;
}

function ProjectSectionContent({
  project,
  onDetails,
}: ProjectSectionContentProps) {
  return (
    <motion.div
      className="projects-card"
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="projects-card-index">
        PROJECT / {String(project.id).padStart(2, "0")}
      </div>

      <h2 className="projects-card-title">{project.title}</h2>

      <div className="projects-card-subtitle">{project.subtitle}</div>

      <p className="projects-card-desc">{project.description}</p>

      <div className="projects-card-tags">
        {project.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="projects-card-tag">
            {tag}
          </span>
        ))}
      </div>

      <div className="projects-card-actions">
        <motion.button
          className="projects-btn-primary"
          onClick={() => onDetails(project)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          View Details →
        </motion.button>

        {project.liveUrl && (
          <motion.a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="projects-btn-secondary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ↗ Live
          </motion.a>
        )}
      </div>
    </motion.div>
  );
}
