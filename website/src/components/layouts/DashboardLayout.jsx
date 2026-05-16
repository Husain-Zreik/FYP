import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Users, UserCheck,
  BarChart3, LogOut, Shield, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Shelters',  path: '/shelters',  icon: Building2       },
  { label: 'Users',     path: '/users',     icon: Users           },
  { label: 'Civilians', path: '/civilians', icon: UserCheck       },
  { label: 'Reports',   path: '/reports',   icon: BarChart3       },
]

export default function DashboardLayout({ children, title }) {
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
    <div className="flex h-screen bg-surface overflow-hidden">

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 bg-background border-e border-border flex flex-col">

        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-border">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Shield size={13} className="text-primary-foreground" />
          </div>
          <span className="text-base font-bold font-heading text-text tracking-tight">Nuzuh</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-widest px-3 mb-2">
            Main
          </p>
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
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
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 text-text-subtle hover:text-danger hover:bg-danger-surface rounded-lg transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

      </aside>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-16 shrink-0 bg-background border-b border-border flex items-center justify-between px-6">
          <h1 className="text-base font-semibold font-heading text-text">{title}</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

      </div>
    </div>
  )
}
