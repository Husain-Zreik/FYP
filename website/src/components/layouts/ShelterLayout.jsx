import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, UserCheck, Users,
  LogOut, Shield, ChevronRight, Building2,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import Button from '../ui/Button'

const navItems = [
  { label: 'Dashboard', path: '/shelter',            icon: LayoutDashboard },
  { label: 'Civilians', path: '/shelter/civilians',  icon: UserCheck       },
  { label: 'Staff',     path: '/shelter/staff',      icon: Users           },
]

export default function ShelterLayout({ children, title }) {
  const user     = useAuthStore((s) => s.user)
  const logout   = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const initial   = user?.name?.charAt(0).toUpperCase() ?? '?'
  const roleLabel = user?.role?.replace(/_/g, ' ') ?? ''
  const shelter   = user?.shelter

  // ── No shelter assigned ───────────────────────────────────────────────────
  if (!user?.shelter_id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#07061A 0%,#0D0A2E 40%,#140E3E 70%,#1C1152 100%)' }}>

        {/* Grid bg */}
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

          {/* Content */}
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

  return (
    <div className="flex h-screen bg-surface overflow-hidden">

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 bg-background border-e border-border flex flex-col">

        {/* Logo + shelter name */}
        <div className="h-16 flex flex-col justify-center px-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
              <Shield size={10} className="text-white" />
            </div>
            <span className="text-sm font-bold font-heading text-text tracking-tight">Nuzuh</span>
          </div>
          {shelter?.name && (
            <p className="text-[10px] text-text-subtle mt-0.5 truncate">{shelter.name}</p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-widest px-3 mb-2">
            Shelter
          </p>
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/shelter'}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-text-muted hover:bg-surface hover:text-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className="shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={13} className="opacity-60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate leading-tight">{user?.name}</p>
              <p className="text-xs text-text-subtle capitalize truncate">{roleLabel}</p>
            </div>
            <Button variant="icon-delete" onClick={handleLogout} title="Sign out">
              <LogOut size={14} />
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-background border-b border-border flex items-center px-6">
          <h1 className="text-base font-semibold font-heading text-text">{title}</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
