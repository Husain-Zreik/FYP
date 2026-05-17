import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Shield, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Button, Input } from '../components/ui'

const HIGHLIGHTS = [
  'Secure role-based access control',
  'Real-time shelter coordination',
  'Government & civilian oversight',
]

export default function LoginPage() {
  const initialized     = useAuthStore((s) => s.initialized)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user            = useAuthStore((s) => s.user)
  const login           = useAuthStore((s) => s.login)
  const logout          = useAuthStore((s) => s.logout)
  const navigate        = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  // All hooks are above — safe to early-return below
  if (!initialized) return null
  if (isAuthenticated && user?.access_point !== 'civilian') {
    return <Navigate to={user?.access_point === 'shelter' ? '/shelter' : '/dashboard'} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      const ap = useAuthStore.getState().user?.access_point
      if (ap === 'civilian') {
        await logout()
        setError('This portal is for staff only. Please use the mobile app.')
        return
      }
    } catch (err) {
      setError(err.message ?? 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left — brand panel ──────────────────────────────────── */}
      <div className="hidden lg:flex w-[45%] flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#07061A 0%,#0D0A2E 40%,#140E3E 70%,#1C1152 100%)' }}>

        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 65%)', filter: 'blur(60px)', transform: 'translate(-30%, 30%)' }} />

        <div className="relative flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
            <Shield size={15} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ color: '#EEF2FF' }}>Nuzuh</span>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Managing shelters,<br />
            <span style={{ background: 'linear-gradient(125deg,#A78BFA,#818CF8,#C4B5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              empowering<br />communities.
            </span>
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.38)' }}>
            A unified platform for shelter administrators,<br />government staff, and field workers.
          </p>
          <ul className="space-y-3">
            {HIGHLIGHTS.map(item => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle size={14} style={{ color: 'rgba(167,139,250,0.55)', flexShrink: 0 }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 Nuzuh</p>
      </div>

      {/* ── Right — form panel ──────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 justify-center mb-10 lg:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
              <Shield size={14} className="text-white" />
            </div>
            <span className="text-base font-bold text-text">Nuzuh</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold font-heading text-text mb-1.5">Welcome back</h1>
            <p className="text-sm text-text-muted">Sign in to your account to continue.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-danger-surface border border-danger/20 text-danger text-sm rounded-xl px-4 py-3 mb-6">
              <span className="text-base leading-none mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Email address" type="email" required
              value={email} onChange={setEmail} placeholder="you@example.com" />

            <Input label="Password" type="password" required
              value={password} onChange={setPassword} placeholder="••••••••" />

            <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
