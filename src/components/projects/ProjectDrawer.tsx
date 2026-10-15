import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface ProjectWithDetails {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  color: string;
  liveUrl: string | null;
  images: string[];
  labels: string[];
}

const INTERVAL = 3000;

function isVideoSource(src: string) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(src);
}

interface ProjectDrawerProps {
  project: ProjectWithDetails;
  onClose: () => void;
}

export function ProjectDrawer({ project, onClose }: ProjectDrawerProps) {
  const [drawerImgIdx, setDrawerImgIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const hasImages = project.images.length > 0;
  const currentSrc = project.images[drawerImgIdx] ?? "";
  const isVideo = isVideoSource(currentSrc);

  useEffect(() => {
    setDrawerImgIdx(0);
    setPaused(false);
  }, [project.id]);

  useEffect(() => {
    if (!hasImages || paused || isVideo) return;
    const id = setInterval(
      () => setDrawerImgIdx((i) => (i + 1) % project.images.length),
      INTERVAL,
    );
    return () => clearInterval(id);
  }, [paused, project.images.length, hasImages, isVideo]);

  const goTo = (idx: number) => {
    setDrawerImgIdx(idx);
    setPaused(true);
  };
  const goPrev = () =>
    goTo((drawerImgIdx - 1 + project.images.length) % project.images.length);
  const goNext = () => goTo((drawerImgIdx + 1) % project.images.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    if (
      typeof window !== "undefined" &&
      (
        window as unknown as {
          __lenis?: { stop: () => void; start: () => void };
        }
      ).__lenis
    ) {
      (
        window as unknown as {
          __lenis: { stop: () => void; start: () => void };
        }
      ).__lenis.stop();
    }
    document.documentElement.classList.add("drawer-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      if (
        typeof window !== "undefined" &&
        (window as unknown as { __lenis?: { start: () => void } }).__lenis
      ) {
        (
          window as unknown as { __lenis: { start: () => void } }
        ).__lenis.start();
      }
      document.documentElement.classList.remove("drawer-open");
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
        }}
      />

      <motion.div
        key="drawer"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="drawer-panel"
        style={{
          borderLeft: `1px solid ${project.color}40`,
          boxShadow: `-8px 0 60px ${project.color}25`,
        }}
      >
        <div className="drawer-panel__header" style={{ marginBottom: 20 }}>
          <div style={{ height: 4, background: project.color }} />
          <div
            style={{
              padding: "var(--space2XL) var(--space2XL) var(--spaceL)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <h2 className="drawer-panel__title">{project.title}</h2>
              <span
                className="drawer-panel__subtitle"
                style={{ color: project.color }}
              >
                {project.subtitle}
              </span>
            </div>
            <button
              type="button"
              className="drawer-panel__close"
              aria-label="Close"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div
          style={{
            padding: "0 var(--space2XL) var(--space2XL)",
            flexShrink: 0,
          }}
        >
          <div
            className="drawer-panel__carousel-placeholder"
            style={{
              position: "relative",
              borderRadius: 14,
              overflow: "hidden",
              height: 220,
            }}
          >
            {hasImages ? (
              <>
                <AnimatePresence mode="wait">
                  {isVideo ? (
                    <motion.video
                      key={drawerImgIdx}
                      src={currentSrc}
                      autoPlay
                      muted
                      playsInline
                      controls
                      onEnded={() => {
                        if (paused) return;
                        setDrawerImgIdx(
                          (i) => (i + 1) % project.images.length,
                        );
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        background: "#0a0a0f",
                        display: "block",
                      }}
                    />
                  ) : (
                    <motion.img
                      key={drawerImgIdx}
                      src={currentSrc}
                      alt={
                        project.labels[drawerImgIdx] ??
                        `Screen ${drawerImgIdx + 1}`
                      }
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  )}
                </AnimatePresence>
                {!paused && !isVideo && (
                  <motion.div
                    key={`${drawerImgIdx}-bar`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: INTERVAL / 1000, ease: "linear" }}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: project.color,
                      transformOrigin: "left",
                    }}
                  />
                )}
                <div
                  className="drawer-panel__image-badge"
                  style={{
                    position: "absolute",
                    left: 12,
                    ...(isVideo ? { top: 10 } : { bottom: 10 }),
                  }}
                >
                  {project.labels[drawerImgIdx] ?? `Screen ${drawerImgIdx + 1}`}
                </div>
                {project.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goPrev}
                      className="drawer-panel__arrow-btn"
                      style={{
                        position: "absolute",
                        top: "50%",
                        transform: "translateY(-50%)",
                        left: 10,
                      }}
                      aria-label="Previous"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="drawer-panel__arrow-btn"
                      style={{
                        position: "absolute",
                        top: "50%",
                        transform: "translateY(-50%)",
                        right: 10,
                      }}
                      aria-label="Next"
                    >
                      ›
                    </button>
                  </>
                )}
                {!isVideo && (
                  <button
                    type="button"
                    onClick={() => setPaused((p) => !p)}
                    className="drawer-panel__play-btn"
                    style={{ position: "absolute", bottom: 10, right: 12 }}
                    aria-label={paused ? "Play" : "Pause"}
                  >
                    {paused ? "▶️" : "⏸"}
                  </button>
                )}
              </>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 72,
                    fontWeight: 800,
                    opacity: 0.4,
                    color: project.color,
                  }}
                >
                  {project.title.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {hasImages && (
            <div
              style={{
                display: "flex",
                gap: 5,
                justifyContent: "center",
                marginTop: 10,
              }}
            >
              {project.images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  style={{
                    width: i === drawerImgIdx ? 22 : 8,
                    height: 8,
                    borderRadius: 4,
                    border: "none",
                    background:
                      i === drawerImgIdx
                        ? project.color
                        : "rgba(255,255,255,0.25)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    padding: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="drawer-panel__divider" />

        <div style={{ padding: "var(--space2XL)" }}>
          <h4
            className="drawer-panel__label"
            style={{ margin: "0 0 var(--spaceM)" }}
          >
            About the Project
          </h4>
          <p className="drawer-panel__desc" style={{ margin: 0 }}>
            {project.description}
          </p>
        </div>

        <div className="drawer-panel__divider" />

        <div style={{ padding: "var(--space2XL)" }}>
          <h4
            className="drawer-panel__label"
            style={{ margin: "0 0 var(--spaceL)" }}
          >
            Tech Stack
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="drawer-panel__tag"
                style={{
                  background: `${project.color}18`,
                  border: `1px solid ${project.color}40`,
                  color: project.color,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />
        <div
          style={{
            padding: "var(--spaceL) var(--space2XL) var(--space3XL)",
            flexShrink: 0,
          }}
        >
          {project.liveUrl ? (
            <motion.a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="projects-btn-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                justifyContent: "center",
                width: "100%",
                background: project.color,
                color: "#fff",
                boxShadow: `0 8px 28px ${project.color}44`,
                padding: "0.8125rem 1.5rem",
                fontSize: "0.9375rem",
              }}
            >
              ↗️ View Live Site
            </motion.a>
          ) : (
            <div
              className="drawer-panel__private-msg"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              🔒 Private project — no live link (client confidentiality)
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
