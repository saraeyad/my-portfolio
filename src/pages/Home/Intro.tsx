import { Suspense, lazy, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DecoderText } from '../../components/DecoderText'
import { Transition } from '../../components/Transition'
import config from '../../config'

const DisplacementSphere = lazy(() =>
  import('../../components/home/DisplacementSphere').then(m => ({ default: m.DisplacementSphere }))
)

interface IntroProps {
  id?: string
  sectionRef?: React.RefObject<HTMLElement | null>
  scrollIndicatorHidden?: boolean
}

export function Intro({ id = 'intro', sectionRef, scrollIndicatorHidden = false }: IntroProps) {
  const [disciplineIndex, setDisciplineIndex] = useState(0)
  const { disciplines, role } = config
  const titleId = `${id}-title`
  const currentDiscipline = disciplines[disciplineIndex]

  useEffect(() => {
    const interval = setInterval(() => {
      setDisciplineIndex(i => (i + 1) % disciplines.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [disciplines.length])

  const handleScrollClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    document.querySelector('#project-1')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={titleId}
      tabIndex={-1}
      className="intro relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0f] pt-20"
    >
      <Suspense fallback={null}>
        <DisplacementSphere />
      </Suspense>

      <Transition in timeout={3000}>
        {({ visible, status }) => (
          <>
            <header className="intro-text relative z-10 mx-auto max-w-4xl px-6 text-center">
              <h1
                className="intro-name mb-8 mt-0 text-center font-medium uppercase tracking-[0.3em] text-slate-200"
                data-visible={visible}
                id={titleId}
              >
                <DecoderText text={config.name} delay={visible ? 500 : 99999} />
              </h1>

              <h2 className="intro-title font-display text-3xl tracking-[-0.03em] text-white md:text-4xl lg:text-5xl">
                <span className="intro-row flex items-center justify-center gap-2">
                  <span
                    className="intro-word"
                    data-status={status}
                    style={{ animationDelay: 'var(--durationXS)' }}
                  >
                    {role}
                  </span>
                  <span className="intro-line" data-status={status} aria-hidden />
                </span>
                <div className="intro-row mt-2 flex items-center justify-center">
                  <span
                    className="intro-word"
                    data-plus="true"
                    data-status={status}
                    style={{ animationDelay: 'var(--durationL)', color: 'var(--accent)' }}
                  >
                    {currentDiscipline}
                  </span>
                </div>
              </h2>
            </header>

            <Link
              to="/#project-1"
              className="scroll-indicator"
              data-status={status}
              data-hidden={scrollIndicatorHidden}
              onClick={handleScrollClick}
              aria-label="Scroll to projects"
            />

            <Link
              to="/#project-1"
              className="mobile-scroll-indicator"
              data-status={status}
              data-hidden={scrollIndicatorHidden}
              onClick={handleScrollClick}
              aria-label="Scroll to projects"
            >
              <svg aria-hidden stroke="currentColor" width="43" height="15" viewBox="0 0 43 15">
                <path d="M1 1l20.5 12L42 1" strokeWidth="2" fill="none" />
              </svg>
            </Link>
          </>
        )}
      </Transition>
    </section>
  )
}
