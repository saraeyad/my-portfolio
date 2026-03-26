import { Link } from 'react-router-dom'
import config from '../config'

export function Footer() {
  return (
    <footer className="footer-section">
      <p className="text-center text-sm text-slate-400" style={{ lineHeight: 1.1 }}>
        <span className="footer-date">© {new Date().getFullYear()} {config.name}.</span>
        <Link to="/" className="footer-link ml-1 hover:opacity-80">
          Crafted by yours truly
        </Link>
      </p>
    </footer>
  )
}
