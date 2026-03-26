import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DecoderText } from '../../components/DecoderText'
import { Footer } from '../../components/Footer'
import config from '../../config'

const MAX_EMAIL_LENGTH = 512
const MAX_MESSAGE_LENGTH = 4096

export function ContactPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')

    const subject = encodeURIComponent('Portfolio contact')
    const body = encodeURIComponent(`From: ${email}\n\n${message}`)
    const mailto = `mailto:${config.email}?subject=${subject}&body=${body}`

    window.location.href = mailto
    setStatus('sent')
  }

  const isValid = email.trim().length > 0 && message.trim().length > 0

  return (
    <main className="contact-page flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-6 py-16">
      <div className="contact-form mx-auto w-full max-w-md">
        <h1 className="contact-title mb-8 font-display text-3xl font-bold text-white md:text-4xl">
          <DecoderText text="Say hello" delay={300} />
        </h1>

        <div
          className="mb-12 h-0.5 w-16"
          style={{ background: 'var(--accent)' }}
          aria-hidden
        />

        {status !== 'sent' ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-400">
                Your email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                maxLength={MAX_EMAIL_LENGTH}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium text-slate-400">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={MAX_MESSAGE_LENGTH}
                required
                rows={5}
                className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                placeholder="Your message..."
              />
              <p className="mt-1 text-right text-xs text-slate-500">
                {message.length} / {MAX_MESSAGE_LENGTH}
              </p>
            </div>

            <button
              type="submit"
              disabled={!isValid || status === 'sending'}
              className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3.5 font-medium text-[#0a0a0f] transition hover:opacity-90 disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              {status === 'sending' ? 'Opening email...' : 'Send message'}
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center text-center">
            <h2 className="font-display text-2xl font-bold text-white">Message Sent</h2>
            <p className="mt-4 text-slate-400">
              Your email client should open. I'll get back to you within a couple days.
            </p>
            <Link
              to="/"
              className="mt-8 inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3.5 font-medium text-white transition hover:border-cyan-500/50 hover:bg-white/5"
            >
              Back to homepage
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
