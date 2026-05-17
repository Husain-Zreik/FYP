import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, UserCheck, Users, BarChart3,
  LogOut, Shield, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { label: 'Dashboard', path: '/shelter',            icon: LayoutDashboard },
  { label: 'Civilians', path: '/shelter/civilians',  icon: UserCheck       },
  { label: 'Staff',     path: '/shelter/staff',      icon: Users           },
  { label: 'Reports',   path: '/shelter/reports',    icon: BarChart3       },
]

export default function ShelterLayout({ children, title }) {
  const user     = useAuthStore((s) => s.user)
  const logout   = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const initial   = user?.name?.charAt(0).toUpperCase() ?? '?'
  const roleLabel = user?.role?.replace(/_/g, ' ') ?? ''
  const shelter   = user?.shelter

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
            <button onClick={handleLogout} title="Sign out"
              className="p-1.5 text-text-subtle hover:text-danger hover:bg-danger-surface rounded-lg transition-colors">
              <LogOut size={14} />
            </button>
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
