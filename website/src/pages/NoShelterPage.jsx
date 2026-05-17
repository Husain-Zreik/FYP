import { Building2, LogOut } from 'lucide-react'
import { Shield } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function NoShelterPage() {
  const user     = useAuthStore((s) => s.user)
  const logout   = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const initial   = user?.name?.charAt(0).toUpperCase() ?? '?'
  const roleLabel = user?.role?.replace(/_/g, ' ') ?? ''

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg,#07061A 0%,#0D0A2E 40%,#140E3E 70%,#1C1152 100%)' }}>

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
        backgroundSize: '55px 55px',
      }} />
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 65%)', filter: 'blur(80px)' }} />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-12">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
            <Shield size={13} className="text-white" />
          </div>
          <span className="text-base font-bold font-heading tracking-tight" style={{ color: '#EEF2FF' }}>
            Nuzuh
          </span>
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <Building2 size={28} className="text-warning" />
        </div>

        <h1 className="text-2xl font-bold font-heading text-white mb-3">
          No shelter assigned
        </h1>

        {/* User chip */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full mb-5"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
            {initial}
          </div>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{user?.name}</span>
          <span className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.3)' }}>
            · {roleLabel}
          </span>
        </div>

        <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Your account has not been linked to a shelter yet. Contact your
          government administrator to get assigned before you can access
          the shelter dashboard.
        </p>

        <Button variant="secondary" onClick={handleLogout}
          className="border-white/10! text-white/60! hover:text-white/90! hover:bg-white/5!">
          <LogOut size={14} /> Sign out
        </Button>
      </div>
    </div>
  )
}
