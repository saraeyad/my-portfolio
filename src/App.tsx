import { Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Home } from './pages/Home'
import { ProjectsPage } from './pages/Projects'
import { ContactPage } from './pages/Contact'

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 antialiased" style={{ overflowX: 'hidden' }}>
      <Navbar />
      <div className="pt-0 min-[753px]:pl-16" style={{ overflowX: 'hidden' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </div>
    </div>
  )
}
