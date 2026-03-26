import { Fragment, useMemo, useRef, useState } from "react";
import { DecoderText } from "../../components/DecoderText";
import { Transition } from "../../components/Transition";
import { useInViewport } from "../../hooks/useInViewport";
import { portfolioData } from "../../data/portfolio";
import config from "../../config";

interface ProfileProps {
  id?: string;
  visible?: boolean;
  sectionRef?: React.RefObject<HTMLElement | null>;
}

function ProfileText({
  visible,
  titleId,
}: {
  visible: boolean;
  titleId: string;
}) {
  const { name } = config;
  const { tagline } = portfolioData;

  return (
    <Fragment>
      <h2
        className="profile-title text-3xl font-bold text-white md:text-4xl"
        id={titleId}
        data-visible={visible}
      >
        <DecoderText text="Hi there" delay={visible ? 500 : 99999} />
      </h2>
      <p
        className="profile-description text-lg leading-relaxed text-slate-400"
        data-visible={visible}
      >
        I'm {name}, a Senior React Developer based in Palestine. My projects
        span UI/UX design, frontend architecture, and interactive web
        experiences. Being comfortable with design tools allows me to bridge the
        gap between design and engineering.
      </p>
      <p
        className="profile-description text-lg leading-relaxed text-slate-400"
        data-visible={visible}
      >
        {tagline}
      </p>
      <a
        href={`mailto:${portfolioData.email}`}
        className="profile-button inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3.5 font-medium text-white transition hover:border-cyan-500/50 hover:bg-white/5"
        data-visible={visible}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 2 11 13M22 2 15 22 11 13 2 9l20-7z" />
        </svg>
        Send me a message
      </a>
    </Fragment>
  );
}

export function Profile({
  id = "details",
  visible: externalVisible,
  sectionRef: externalRef,
}: ProfileProps) {
  const [focused, setFocused] = useState(false);
  const internalRef = useRef<HTMLElement>(null);
  const sectionRef = externalRef ?? internalRef;
  const opts = useMemo(() => ({ threshold: 0.15 }), []);
  const internalVisible = useInViewport(sectionRef, false, opts);
  const visible = externalVisible ?? internalVisible;
  const titleId = `${id}-title`;

  const isVisible = visible || focused;

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={titleId}
      tabIndex={-1}
      className="profile-section"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <Transition in={isVisible} timeout={0}>
        {({ visible: transitionVisible }) => (
          <div className="profile-content">
            <div className="profile-column">
              <ProfileText visible={transitionVisible} titleId={titleId} />
            </div>
            <div className="profile-column">
              <div className="profile-tag" aria-hidden>
                <div
                  style={{
                    height: 2,
                    background: "var(--accent)",
                    transformOrigin: "left",
                    transform: transitionVisible ? "scaleX(1)" : "scaleX(0)",
                    transition: "transform 0.8s cubic-bezier(0.4,0,0.2,1) 1s",
                  }}
                />
                <span
                  className="profile-tag-text"
                  data-visible={transitionVisible}
                >
                  About me
                </span>
              </div>
              <div className="profile-image-wrap">
                <div
                  className="overflow-hidden rounded-xl border border-white/10"
                  style={{
                    width: "70%",
                    height: "100%",
                    aspectRatio: "3 / 4",
                    background: "rgba(255,255,255,0.04)",
                    opacity: transitionVisible ? 1 : 0,
                    transition: "opacity var(--durationXL) ease 0.1s",
                  }}
                >
                  {portfolioData.profileImage ? (
                    <img
                      src={portfolioData.profileImage}
                      alt={`${config.name} profile`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full flex-col items-center justify-center gap-4"
                      style={{
                        background:
                          "linear-gradient(160deg, #0f1923 0%, #0d1f2d 100%)",
                      }}
                    >
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--accent), #a78bfa)",
                          color: "#0a0a0f",
                        }}
                      >
                        {config.name.charAt(0)}
                      </div>
                      <p className="text-sm text-white/30">
                        Add your photo in portfolioData
                      </p>
                    </div>
                  )}
                </div>
                <span
                  className="profile-svg"
                  data-visible={transitionVisible}
                  aria-hidden
                  style={{
                    writingMode: 'vertical-rl',
                    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                    fontWeight: 700,
                    letterSpacing: '0.3em',
                    fontFamily: (portfolioData.decorationStyle ?? 'english') === 'arabic' ? 'inherit' : 'monospace',
                    direction: (portfolioData.decorationStyle ?? 'english') === 'arabic' ? 'rtl' : 'ltr',
                  }}
                >
                  {portfolioData.aboutDecoration ?? 'ABOUT ME'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Transition>
    </section>
  );
}
