import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  UserCheck, Users, Building2, Inbox, Package,
  HeartHandshake, ArrowDownToLine, Clock, ArrowRight, AlertCircle,
} from 'lucide-react'
import ShelterLayout from '../../components/layouts/ShelterLayout'
import { Badge, Loader } from '../../components/ui'
import { useAuthStore } from '../../store/authStore'
import client from '../../api/client'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const STATUS_BADGE  = { active: 'success', inactive: 'muted', full: 'warning', under_maintenance: 'danger' }
const STATUS_LABEL  = { active: 'Active',  inactive: 'Inactive', full: 'Full', under_maintenance: 'Maintenance' }
const DISPATCH_BADGE = { pending: 'warning', accepted: 'success', rejected: 'danger' }
const DISPATCH_LABEL = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' }

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

export default function ShelterDashboardPage() {
  const user    = useAuthStore((s) => s.user)
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    client.get('/stats/shelter')
      .then(res => setStats(res.data))
      .catch(err => setError(err.message ?? 'Failed to load stats.'))
      .finally(() => setLoading(false))
  }, [])

  const s = stats ?? {}

  const occupancyColor = (s.occupancy_pct ?? 0) >= 90 ? 'bg-danger'
    : (s.occupancy_pct ?? 0) >= 70 ? 'bg-warning'
    : 'bg-success'

  const operationsCards = [
    {
      label: 'Civilians',
      value: s.civilians_count,
      sub:   `of ${s.capacity ?? 0} capacity`,
      icon:  UserCheck,
      color: 'text-success',
      bg:    'bg-success-surface',
    },
    {
      label: 'Staff',
      value: s.staff_count,
      sub:   'Admins & staff members',
      icon:  Users,
      color: 'text-secondary',
      bg:    'bg-secondary/10',
    },
    {
      label: 'Occupancy',
      value: `${s.occupancy_pct ?? 0}%`,
      sub:   `${s.civilians_count ?? 0} / ${s.capacity ?? 0} people`,
      icon:  Building2,
      color: occupancyColor.replace('bg-', 'text-'),
      bg:    occupancyColor === 'bg-danger' ? 'bg-danger-surface' : occupancyColor === 'bg-warning' ? 'bg-warning-surface' : 'bg-success-surface',
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
      label: 'Incoming Aid',
      value: s.pending_incoming_aid,
      sub:   'Awaiting your acceptance',
      icon:  ArrowDownToLine,
      color: (s.pending_incoming_aid ?? 0) > 0 ? 'text-warning' : 'text-text-muted',
      bg:    (s.pending_incoming_aid ?? 0) > 0 ? 'bg-warning-surface' : 'bg-surface-2',
    },
    {
      label: 'Aid Requests',
      value: s.pending_aid_requests,
      sub:   'Pending government response',
      icon:  Package,
      color: (s.pending_aid_requests ?? 0) > 0 ? 'text-secondary' : 'text-text-muted',
      bg:    (s.pending_aid_requests ?? 0) > 0 ? 'bg-secondary/10' : 'bg-surface-2',
    },
    {
      label: 'Civilian Needs',
      value: s.pending_civilian_needs,
      sub:   'Pending your review',
      icon:  HeartHandshake,
      color: (s.pending_civilian_needs ?? 0) > 0 ? 'text-danger' : 'text-text-muted',
      bg:    (s.pending_civilian_needs ?? 0) > 0 ? 'bg-danger-surface' : 'bg-surface-2',
    },
  ]

  return (
    <ShelterLayout title="Dashboard">

      <div className="mb-7">
        <h2 className="text-xl font-bold font-heading text-text">
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-sm text-text-muted mt-0.5">
          {s.shelter_name ? `Managing ${s.shelter_name}` : 'Shelter overview for today.'}
        </p>
      </div>

      {error && (
        <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader size="lg" /></div>
      ) : (
        <div className="space-y-6">

          {/* Operations */}
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold font-heading text-text">Operations</h3>
              <p className="text-xs text-text-muted mt-0.5">Shelter occupancy and staff overview</p>
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {operationsCards.map(c => <StatCard key={c.label} {...c} />)}
            </div>
          </div>

          {/* Aid */}
          <div>
            <div className="flex items-end justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold font-heading text-text">Aid Status</h3>
                <p className="text-xs text-text-muted mt-0.5">Items requiring your attention</p>
              </div>
              <Link to="/shelter/incoming-aid" className="text-xs text-secondary hover:underline flex items-center gap-1">
                Incoming aid <ArrowRight size={11} />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {aidCards.map(c => <StatCard key={c.label} {...c} />)}
            </div>
          </div>

          {/* Occupancy bar */}
          <div className="bg-background rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold font-heading text-text">Shelter Capacity</h3>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_BADGE[s.shelter_status] ?? 'muted'}>
                  {STATUS_LABEL[s.shelter_status] ?? s.shelter_status}
                </Badge>
                <span className="text-xs text-text-muted">
                  {s.civilians_count ?? 0} / {s.capacity ?? 0} people
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-2 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${occupancyColor}`}
                style={{ width: `${s.occupancy_pct ?? 0}%` }}
              />
            </div>
            {s.active_schedules > 0 && (
              <p className="text-xs text-text-subtle mt-3">
                {s.active_schedules} active recurring aid {s.active_schedules === 1 ? 'schedule' : 'schedules'} from government
              </p>
            )}
          </div>

          {/* Recent activity */}
          <div className="grid lg:grid-cols-2 gap-5">

            {/* Recently admitted */}
            <div className="bg-background rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-text-subtle" />
                  <h3 className="text-sm font-semibold font-heading text-text">Recently Admitted</h3>
                </div>
                <Link to="/shelter/civilians" className="text-xs text-secondary hover:underline flex items-center gap-1">
                  All civilians <ArrowRight size={11} />
                </Link>
              </div>
              {(s.recent_civilians ?? []).length === 0 ? (
                <p className="text-sm text-text-muted py-6 text-center">No civilians admitted yet.</p>
              ) : (
                <div className="space-y-3">
                  {s.recent_civilians.map(c => (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-warning-surface flex items-center justify-center text-xs font-bold text-warning shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{c.name}</p>
                        <p className="text-xs text-text-muted truncate">{c.phone ?? c.email}</p>
                      </div>
                      <Badge variant={c.is_active ? 'success' : 'danger'} className="shrink-0">
                        {c.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent dispatches */}
            <div className="bg-background rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ArrowDownToLine size={14} className="text-text-subtle" />
                  <h3 className="text-sm font-semibold font-heading text-text">Recent Aid Deliveries</h3>
                </div>
                <Link to="/shelter/incoming-aid" className="text-xs text-secondary hover:underline flex items-center gap-1">
                  View all <ArrowRight size={11} />
                </Link>
              </div>
              {(s.recent_dispatches ?? []).length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-text-muted">No aid dispatches yet.</p>
                  <p className="text-xs text-text-subtle mt-1">Aid sent to your shelter will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {s.recent_dispatches.map(d => (
                    <div key={d.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
                        <Package size={14} className="text-text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{d.category}</p>
                        <p className="text-xs text-text-muted">{d.quantity} {d.unit}</p>
                      </div>
                      <Badge variant={DISPATCH_BADGE[d.status] ?? 'muted'} className="shrink-0">
                        {DISPATCH_LABEL[d.status] ?? d.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </ShelterLayout>
  )
}
