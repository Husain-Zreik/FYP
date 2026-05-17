import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Users, UserCheck, Inbox, Package, Truck,
  CalendarClock, Archive, Clock, ArrowRight, AlertCircle,
} from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import { Badge, Loader } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import client from '../api/client'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const URGENCY_BADGE = { critical: 'danger', high: 'warning', medium: 'info', low: 'muted' }
const URGENCY_LABEL = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }

function StatCard({ label, value, sub, icon: Icon, color, bg }) {
  return (
    <div className="bg-background rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
        <Icon size={18} className={color} />
      </div>
      <p className="text-2xl font-bold font-heading text-text mb-0.5">{value ?? 0}</p>
      <p className="text-xs text-text-muted">{label}</p>
      {sub && <p className="text-[11px] text-text-subtle mt-0.5">{sub}</p>}
    </div>
  )
}

function SectionHeader({ title, subtitle, linkTo, linkLabel }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold font-heading text-text">{title}</h3>
        {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {linkTo && (
        <Link to={linkTo} className="flex items-center gap-1 text-xs text-secondary hover:underline shrink-0">
          {linkLabel} <ArrowRight size={11} />
        </Link>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const user    = useAuthStore((s) => s.user)
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    client.get('/stats/government')
      .then(res => setStats(res.data))
      .catch(err => setError(err.message ?? 'Failed to load stats.'))
      .finally(() => setLoading(false))
  }, [])

  const s = stats ?? {}

  const operationsCards = [
    {
      label: 'Total Shelters',
      value: s.total_shelters,
      sub:   `${s.active_shelters ?? 0} active`,
      icon:  Building2,
      color: 'text-secondary',
      bg:    'bg-secondary/10',
    },
    {
      label: 'Civilians',
      value: s.total_civilians,
      sub:   `${s.assigned_civilians ?? 0} in shelters · ${s.private_civilians ?? 0} private`,
      icon:  UserCheck,
      color: 'text-success',
      bg:    'bg-success-surface',
    },
    {
      label: 'Staff',
      value: s.total_staff,
      sub:   'Admins & staff across all shelters',
      icon:  Users,
      color: 'text-warning',
      bg:    'bg-warning-surface',
    },
    {
      label: 'Join Requests',
      value: s.pending_requests,
      sub:   'Awaiting response',
      icon:  Inbox,
      color: (s.pending_requests ?? 0) > 0 ? 'text-danger' : 'text-text-muted',
      bg:    (s.pending_requests ?? 0) > 0 ? 'bg-danger-surface' : 'bg-surface-2',
    },
  ]

  const aidCards = [
    {
      label: 'Pending Aid Requests',
      value: s.pending_aid_requests,
      sub:   'From shelters awaiting review',
      icon:  Package,
      color: (s.pending_aid_requests ?? 0) > 0 ? 'text-warning' : 'text-text-muted',
      bg:    (s.pending_aid_requests ?? 0) > 0 ? 'bg-warning-surface' : 'bg-surface-2',
    },
    {
      label: 'Pending Dispatches',
      value: s.pending_dispatches,
      sub:   'Awaiting shelter acceptance',
      icon:  Truck,
      color: (s.pending_dispatches ?? 0) > 0 ? 'text-warning' : 'text-text-muted',
      bg:    (s.pending_dispatches ?? 0) > 0 ? 'bg-warning-surface' : 'bg-surface-2',
    },
    {
      label: 'Active Schedules',
      value: s.active_schedules,
      sub:   'Recurring aid deliveries',
      icon:  CalendarClock,
      color: 'text-secondary',
      bg:    'bg-secondary/10',
    },
    {
      label: 'Stocked Categories',
      value: s.stocked_categories,
      sub:   'Aid types with available inventory',
      icon:  Archive,
      color: 'text-text-muted',
      bg:    'bg-surface-2',
    },
  ]

  return (
    <DashboardLayout title="Dashboard">

      <div className="mb-7">
        <h2 className="text-xl font-bold font-heading text-text">
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-sm text-text-muted mt-0.5">Here's the current system overview.</p>
      </div>

      {error && (
        <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader size="lg" /></div>
      ) : (
        <div className="space-y-7">

          <div>
            <SectionHeader
              title="People & Shelters"
              subtitle="Nationwide civilian and shelter overview"
              linkTo="/shelters"
              linkLabel="View shelters"
            />
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {operationsCards.map(c => <StatCard key={c.label} {...c} />)}
            </div>
          </div>

          <div>
            <SectionHeader
              title="Aid Management"
              subtitle="Current status of aid distribution across all shelters"
              linkTo="/aid/inventory"
              linkLabel="View inventory"
            />
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {aidCards.map(c => <StatCard key={c.label} {...c} />)}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">

            <div className="bg-background rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-text-subtle" />
                  <h3 className="text-sm font-semibold font-heading text-text">Recently Registered</h3>
                </div>
                <Link to="/civilians" className="text-xs text-secondary hover:underline flex items-center gap-1">
                  All civilians <ArrowRight size={11} />
                </Link>
              </div>
              {(s.recent_civilians ?? []).length === 0 ? (
                <p className="text-sm text-text-muted py-6 text-center">No civilians registered yet.</p>
              ) : (
                <div className="space-y-3">
                  {s.recent_civilians.map(c => (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-warning-surface flex items-center justify-center text-xs font-bold text-warning shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{c.name}</p>
                        <p className="text-xs text-text-muted truncate">{c.email}</p>
                      </div>
                      {c.shelter
                        ? <Badge variant="info" className="shrink-0">{c.shelter.name}</Badge>
                        : <Badge variant="muted" className="shrink-0">Unassigned</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-background rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-text-subtle" />
                  <h3 className="text-sm font-semibold font-heading text-text">Pending Aid Requests</h3>
                </div>
                <Link to="/aid/requests" className="text-xs text-secondary hover:underline flex items-center gap-1">
                  Review all <ArrowRight size={11} />
                </Link>
              </div>
              {(s.recent_aid_requests ?? []).length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-text-muted">No pending aid requests.</p>
                  <p className="text-xs text-text-subtle mt-1">All shelter requests have been reviewed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {s.recent_aid_requests.map(r => (
                    <div key={r.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
                        <Package size={14} className="text-text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{r.shelter}</p>
                        <p className="text-xs text-text-muted">{r.quantity} {r.unit} · {r.category}</p>
                      </div>
                      <Badge variant={URGENCY_BADGE[r.urgency] ?? 'muted'} className="shrink-0">
                        {URGENCY_LABEL[r.urgency] ?? r.urgency}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
