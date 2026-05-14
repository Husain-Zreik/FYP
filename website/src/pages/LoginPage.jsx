import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Shield, CheckCircle, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const highlights = [
  'Secure role-based access control',
  'Real-time shelter management',
  'Government & civilian oversight',
]

export default function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const login           = useAuthStore((s) => s.login)

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const navigate = useNavigate()

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message ?? 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[45%] bg-primary flex-col justify-between p-12">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-foreground/10 rounded-xl flex items-center justify-center">
            <Shield size={16} className="text-primary-foreground" />
          </div>
          <span className="text-lg font-bold font-heading text-primary-foreground tracking-tight">
            Nuzuh
          </span>
        </div>

        {/* Tagline */}
        <div>
          <h2 className="text-4xl font-bold font-heading text-primary-foreground leading-tight mb-4">
            Managing shelters,<br />empowering<br />communities.
          </h2>
          <p className="text-primary-foreground/50 text-sm leading-relaxed mb-10 max-w-xs">
            A unified platform for shelter administrators, government staff, and field workers.
          </p>
          <ul className="space-y-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle size={15} className="text-primary-foreground/40 shrink-0" />
                <span className="text-sm text-primary-foreground/70">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-primary-foreground/30">© 2026 Nuzuh</p>
      </div>

      {/* ── Right form ──────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-surface px-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 justify-center mb-10 lg:hidden">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Shield size={14} className="text-primary-foreground" />
            </div>
            <span className="text-lg font-bold font-heading text-text">Nuzuh</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold font-heading text-text mb-1">Welcome back</h1>
            <p className="text-sm text-text-muted">Sign in to your account to continue.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 bg-danger-surface border border-danger/20 text-danger text-sm rounded-xl px-4 py-3 mb-6">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-all shadow-sm mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight size={14} /></>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
