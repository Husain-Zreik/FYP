import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, UserCheck, Users, Inbox,
  LogOut, Shield, ArrowLeft, Building2, Package, HeartHandshake,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUiStore }   from '../../store/uiStore'
import Button from '../ui/Button'

function NavItem({ label, path, icon: Icon, end, badge }) {
  return (
    <NavLink
      to={path}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
          isActive
            ? 'bg-primary text-primary-foreground font-semibold'
            : 'font-medium text-text-muted hover:bg-surface hover:text-text'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} className="shrink-0 opacity-80" />
          <span className="flex-1 truncate">{label}</span>
          {badge > 0 && !isActive && (
            <span className="text-[10px] font-bold bg-danger text-white px-1.5 py-0.5 rounded-full leading-none shrink-0">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

export default function ShelterLayout({ children, title, subtitle, back, badge, actions }) {
  const user         = useAuthStore((s) => s.user)
  const logout       = useAuthStore((s) => s.logout)
  const navigate     = useNavigate()
  const pendingCount      = useUiStore((s) => s.shelterPendingCount)
  const pendingNeedsCount = useUiStore((s) => s.shelterPendingNeedsCount)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const initial     = user?.name?.charAt(0).toUpperCase() ?? '?'
  const roleLabel   = user?.role?.replace(/_/g, ' ') ?? ''
  const shelterName = user?.shelter?.name

  const NAV_GROUPS = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard',    path: '/shelter',      icon: LayoutDashboard, end: true },
        { label: 'Shelter Info', path: '/shelter/info', icon: Building2 },
      ],
    },
    {
      label: 'Operations',
      items: [
        { label: 'Civilians', path: '/shelter/civilians', icon: UserCheck },
        { label: 'Staff',     path: '/shelter/staff',     icon: Users     },
      ],
    },
    {
      label: 'Requests',
      items: [
        { label: 'Requests', path: '/shelter/requests', icon: Inbox, badge: pendingCount },
      ],
    },
    {
      label: 'Aid',
      items: [
        { label: 'Aid Requests',   path: '/shelter/aid-requests',   icon: Package },
        { label: 'Civilian Needs', path: '/shelter/civilian-needs', icon: HeartHandshake, badge: pendingNeedsCount },
      ],
    },
  ]

  return (
    <div className="flex h-screen bg-surface overflow-hidden">

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 bg-background border-e border-border flex flex-col">

        {/* Logo + shelter context */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
              <Shield size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold font-heading text-text tracking-tight leading-none">Nuzuh</p>
              <p className="text-[10px] text-text-subtle mt-0.5">Shelter Dashboard</p>
            </div>
          </div>

          {/* Shelter name chip */}
          {shelterName && (
            <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 mt-1">
              <Building2 size={13} className="text-secondary shrink-0" />
              <p className="text-xs font-medium text-text truncate">{shelterName}</p>
            </div>
          )}
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? 'mt-5' : ''}>
              <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-widest px-3 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavItem key={item.path} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text truncate leading-snug">{user?.name}</p>
              <p className="text-[11px] text-text-subtle capitalize truncate">{roleLabel}</p>
            </div>
            <Button variant="icon-delete" onClick={handleLogout} title="Sign out">
              <LogOut size={14} />
            </Button>
          </div>
        </div>

      </aside>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="shrink-0 bg-background border-b border-border px-6" style={{ minHeight: '4rem' }}>
          <div className="flex items-center gap-3 py-3" style={{ minHeight: '4rem' }}>
            {back !== undefined && (
              <button
                onClick={() => typeof back === 'number' ? navigate(back) : navigate(back)}
                className="p-1.5 rounded-lg text-text-subtle hover:text-text hover:bg-surface transition-colors cursor-pointer shrink-0 -ms-1">
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-semibold font-heading text-text leading-tight">{title}</h1>
                {badge && <span className="flex items-center">{badge}</span>}
              </div>
              {subtitle && <p className="text-xs text-text-muted mt-0.5 leading-tight">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
