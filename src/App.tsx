import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Home } from './pages/Home'

const ProjectsPage = lazy(() =>
  import('./pages/Projects').then((m) => ({ default: m.ProjectsPage })),
)
const ContactPage = lazy(() =>
  import('./pages/Contact').then((m) => ({ default: m.ContactPage })),
)

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 antialiased" style={{ overflowX: 'hidden' }}>
      <Navbar />
      <div className="pt-0 min-[753px]:pl-16" style={{ overflowX: 'hidden' }}>
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  )
}
