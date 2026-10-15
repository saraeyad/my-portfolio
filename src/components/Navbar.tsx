import { motion } from "motion/react";
import { Link } from "react-router-dom";
import config from "../config";

const { name, whatsapp, email } = config;
const mailto = `mailto:${email}`;

const navLinks = [
  { to: "/projects", label: "Projects" },
  { to: "/#details", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/#experience", label: "Experience" },
];

export function Navbar() {
  return (
    <motion.nav
      className="relative z-50 flex h-16 w-full items-center justify-between border-b border-white/5 bg-[#0a0a0f]/90 px-4 backdrop-blur-sm min-[753px]:fixed min-[753px]:left-0 min-[753px]:top-0 min-[753px]:h-screen min-[753px]:w-23 min-[753px]:flex-col min-[753px]:justify-between min-[753px]:border-b-0 min-[753px]:border-r min-[753px]:px-0 min-[753px]:py-6"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo */}
      <Link
        to="/"
        className="flex h-10 w-10 shrink-0 items-center justify-center text-2xl font-bold text-white min-[753px]:text-4xl"
        aria-label="Home"
      >
        {name.charAt(0)}
      </Link>

      <div className="flex max-w-[62vw] items-center gap-3 overflow-x-auto whitespace-nowrap pr-1 min-[753px]:max-w-none min-[753px]:flex-1 min-[753px]:flex-col min-[753px]:justify-center min-[753px]:gap-8 min-[753px]:overflow-visible min-[753px]:whitespace-normal min-[753px]:pr-0">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="nav-link-vertical nav-link-accent-hover block shrink-0 text-xs font-medium text-white transition min-[753px]:text-sm"
            onClick={(e) => {
              if (
                link.to.startsWith("/#") &&
                window.location.pathname === "/"
              ) {
                e.preventDefault();
                document
                  .querySelector(link.to.slice(1))
                  ?.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="hidden items-center gap-4 min-[753px]:flex min-[753px]:flex-col">
        <motion.a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 transition hover:text-green-400"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="WhatsApp"
        >
          <svg
            className="h-5 w-5"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </motion.a>
        <motion.a
          href={mailto}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 transition hover:text-red-400"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Email"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </motion.a>
      </div>
    </motion.nav>
  );
}
