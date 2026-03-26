import { Suspense, lazy, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { deviceModels } from '../../components/device-models'
import { Transition } from '../../components/Transition'
import { useWindowSize } from '../../hooks/useWindowSize'
import { media } from '../../utils/style'
import { portfolioData } from '../../data/portfolio'

const Model = lazy(() =>
  import('../../components/Model').then(m => ({ default: m.Model }))
)

interface ProjectSummaryProps {
  id: string
  index: number
  title: string
  description: string
  buttonText: string
  buttonLink: string
  screenImage?: string
  screenImageLarge?: string
  screenImagePlaceholder: string
  alternate?: boolean
  sectionRef?: React.RefObject<HTMLElement | null>
  visible?: boolean
}

export function ProjectSummary({
  id,
  index,
  title,
  description,
  buttonText,
  buttonLink,
  screenImage,
  screenImageLarge,
  screenImagePlaceholder,
  alternate = false,
  sectionRef: externalRef,
  visible: sectionVisible = true,
}: ProjectSummaryProps) {
  const [focused, setFocused] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const internalRef = useRef<HTMLElement>(null)
  const sectionRef = externalRef ?? internalRef
  const { width } = useWindowSize()
  const isMobile = width <= media.tablet
  const titleId = `${id}-title`
  const indexText = index < 10 ? `0${index}` : `${index}`
  const laptopSizes = `(max-width: ${media.tablet}px) 80vw, 40vw`

  const laptopModel = useMemo(
    () => ({
      ...deviceModels.laptop,
      texture: {
        srcSet: screenImage
          ? `${screenImage} 1280w${screenImageLarge ? `, ${screenImageLarge} 2560w` : ''}`
          : `/textures/spr-lesson-builder-dark.jpg 1280w, /textures/spr-lesson-builder-dark-large.jpg 2560w`,
        placeholder: screenImagePlaceholder || '/textures/spr-lesson-builder-dark-placeholder.jpg',
        sizes: laptopSizes,
      },
    }),
    [screenImage, screenImageLarge, screenImagePlaceholder, laptopSizes]
  )

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={titleId}
      tabIndex={-1}
      className="summary-section"
      data-alternate={alternate}
      data-first={index === 1}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <div className="summary-content">
        <Transition in={sectionVisible || focused} timeout={0}>
          {({ visible }) => (
            <>
              {!alternate && !isMobile && (
                <>
                  <div className="summary-details">
                    <div aria-hidden className="summary-index">
                      <div
                        style={{
                          height: 2,
                          background: 'var(--accent)',
                          transformOrigin: 'left',
                          transform: visible ? 'scaleX(1)' : 'scaleX(0)',
                          transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1) 1s',
                        }}
                      />
                      <span className="summary-index-number" data-visible={visible}>
                        {indexText}
                      </span>
                    </div>
                    <h2 className="summary-title font-display text-2xl font-bold text-white md:text-3xl" id={titleId} data-visible={visible}>
                      {title}
                    </h2>
                    <p className="summary-description text-slate-400" data-visible={visible}>
                      {description}
                    </p>
                    <div className="summary-button-wrap" data-visible={visible}>
                      <Link
                        to={buttonLink}
                        className="inline-flex items-center gap-2 rounded-lg px-6 py-3.5 font-medium transition-opacity hover:opacity-90"
                        style={{ background: 'var(--accent)', color: '#0a0a0f' }}
                      >
                        {buttonText} →
                      </Link>
                    </div>
                  </div>
                  <div className="summary-preview">
                    <span
                      className="summary-katakana"
                      data-visible={visible && modelLoaded}
                      aria-hidden
                      style={{
                        fontFamily: (portfolioData.decorationStyle ?? 'english') === 'arabic' ? 'inherit' : 'monospace',
                        fontSize: 'clamp(2rem, 6vw, 4rem)',
                        fontWeight: 700,
                        letterSpacing: '0.2em',
                        direction: (portfolioData.decorationStyle ?? 'english') === 'arabic' ? 'rtl' : 'ltr',
                      }}
                    >
                      {portfolioData.projectDecoration ?? 'PROJECTS'}
                    </span>
                    <div className="summary-model">
                      {sectionVisible && (
                        <Suspense fallback={null}>
                          <Model
                            alt="Project screenshot on MacBook Pro"
                            cameraPosition={{ x: 0, y: 0, z: 8 }}
                            showDelay={700}
                            onLoad={() => setModelLoaded(true)}
                            show={visible}
                            models={[laptopModel]}
                            style={{ position: 'absolute', inset: 0 }}
                          />
                        </Suspense>
                      )}
                    </div>
                  </div>
                </>
              )}
              {(alternate || isMobile) && (
                <>
                  <div className="summary-preview">
                    <span
                      className="summary-katakana"
                      data-visible={visible && modelLoaded}
                      aria-hidden
                      style={{
                        fontFamily: (portfolioData.decorationStyle ?? 'english') === 'arabic' ? 'inherit' : 'monospace',
                        fontSize: 'clamp(2rem, 6vw, 4rem)',
                        fontWeight: 700,
                        letterSpacing: '0.2em',
                        direction: (portfolioData.decorationStyle ?? 'english') === 'arabic' ? 'rtl' : 'ltr',
                      }}
                    >
                      {portfolioData.projectDecoration ?? 'PROJECTS'}
                    </span>
                    <div className="summary-model">
                      {sectionVisible && (
                        <Suspense fallback={null}>
                          <Model
                            alt="Project screenshot on MacBook Pro"
                            cameraPosition={{ x: 0, y: 0, z: 8 }}
                            showDelay={700}
                            onLoad={() => setModelLoaded(true)}
                            show={visible}
                            models={[laptopModel]}
                            style={{ position: 'absolute', inset: 0 }}
                          />
                        </Suspense>
                      )}
                    </div>
                  </div>
                  <div className="summary-details">
                    <div aria-hidden className="summary-index">
                      <div
                        style={{
                          height: 2,
                          background: 'var(--accent)',
                          transformOrigin: 'left',
                          transform: visible ? 'scaleX(1)' : 'scaleX(0)',
                          transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1) 1s',
                        }}
                      />
                      <span className="summary-index-number" data-visible={visible}>
                        {indexText}
                      </span>
                    </div>
                    <h2 className="summary-title font-display text-2xl font-bold text-white md:text-3xl" id={titleId} data-visible={visible}>
                      {title}
                    </h2>
                    <p className="summary-description text-slate-400" data-visible={visible}>
                      {description}
                    </p>
                    <div className="summary-button-wrap" data-visible={visible}>
                      <Link
                        to={buttonLink}
                        className="inline-flex items-center gap-2 rounded-lg px-6 py-3.5 font-medium transition-opacity hover:opacity-90"
                        style={{ background: 'var(--accent)', color: '#0a0a0f' }}
                      >
                        {buttonText} →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </Transition>
      </div>
    </section>
  )
}
