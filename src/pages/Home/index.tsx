import { useEffect, useRef, useState } from "react";
import { Intro } from "./Intro";
import { ProjectSummary } from "./ProjectSummary";
import { Profile } from "./Profile";
import { Footer } from "../../components/Footer";
import { portfolioData } from "../../data/portfolio";
import { Experience } from "../../components/Experience";

export function Home() {
  const [visibleSections, setVisibleSections] = useState<Element[]>([]);
  const [scrollIndicatorHidden, setScrollIndicatorHidden] = useState(false);
  const intro = useRef<HTMLElement>(null);
  const projectOne = useRef<HTMLElement>(null);
  const details = useRef<HTMLElement>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const sections = [intro, projectOne, details];

    const sectionObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target;
            observer.unobserve(section);
            if (visibleSections.includes(section)) return;
            setVisibleSections((prev) => [...prev, section]);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );

    const indicatorObserver = new IntersectionObserver(
      ([entry]) => setScrollIndicatorHidden(!entry.isIntersecting),
      { rootMargin: "-100% 0px 0px 0px" },
    );

    sections.forEach((s) => s.current && sectionObserver.observe(s.current));
    if (intro.current) indicatorObserver.observe(intro.current);

    return () => {
      sectionObserver.disconnect();
      indicatorObserver.disconnect();
    };
  }, [visibleSections]);

  const featured = portfolioData.projects[0];

  return (
    <main
      className="home min-h-screen bg-[#0a0a0f] text-slate-100"
      style={{ overflowX: "hidden" }}
    >
      <Intro
        id="intro"
        sectionRef={intro}
        scrollIndicatorHidden={scrollIndicatorHidden}
      />

      <ProjectSummary
        id="project-1"
        sectionRef={projectOne}
        visible={
          projectOne.current
            ? visibleSections.includes(projectOne.current)
            : false
        }
        index={1}
        title="Featured Projects"
        description="A collection of modern web applications built with React, clean architecture, and a focus on user experience. From e-commerce to sustainability tools — each project showcases real-world solutions."
        buttonText="View projects"
        buttonLink="/projects"
        screenImage={portfolioData.laptopScreenImage || featured?.images?.[0]}
        screenImagePlaceholder="/textures/spr-lesson-builder-dark-placeholder.jpg"
      />

      <Profile
        sectionRef={details}
        visible={
          details.current ? visibleSections.includes(details.current) : false
        }
        id="details"
      />
      <Experience />

      <Footer />
    </main>
  );
}
