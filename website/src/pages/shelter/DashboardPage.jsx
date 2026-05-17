import { useEffect, useState } from 'react'
import { UserCheck, Users, Building2, AlertTriangle, Clock } from 'lucide-react'
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

const STATUS_BADGE = {
  active:           'success',
  inactive:         'muted',
  full:             'warning',
  under_maintenance:'danger',
}
const STATUS_LABEL = {
  active:           'Active',
  inactive:         'Inactive',
  full:             'Full',
  under_maintenance:'Maintenance',
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

  const occupancyColor = stats
    ? stats.occupancy_pct >= 90 ? 'bg-danger'
    : stats.occupancy_pct >= 70 ? 'bg-warning'
    : 'bg-success'
    : 'bg-success'

  return (
    <ShelterLayout title="Dashboard">

      <div className="mb-6">
        <h2 className="text-xl font-bold font-heading text-text">
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-sm text-text-muted mt-0.5">
          {stats ? `Managing ${stats.shelter_name}` : 'Shelter overview for today.'}
        </p>
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader size="lg" /></div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: 'Civilians',
                value: stats?.civilians_count ?? 0,
                sub:   `of ${stats?.capacity ?? 0} capacity`,
                icon:  UserCheck,
                color: 'text-success',
                bg:    'bg-success-surface',
              },
              {
                label: 'Staff',
                value: stats?.staff_count ?? 0,
                sub:   'Admins & staff',
                icon:  Users,
                color: 'text-secondary',
                bg:    'bg-secondary/10',
              },
              {
                label: 'Occupancy',
                value: `${stats?.occupancy_pct ?? 0}%`,
                sub:   `${stats?.civilians_count ?? 0} / ${stats?.capacity ?? 0} people`,
                icon:  Building2,
                color: occupancyColor.replace('bg-', 'text-'),
                bg:    occupancyColor === 'bg-danger' ? 'bg-danger-surface'
                      : occupancyColor === 'bg-warning' ? 'bg-warning-surface'
                      : 'bg-success-surface',
              },
              {
                label: 'Pending',
                value: stats?.pending_requests ?? 0,
                sub:   'Join requests',
                icon:  AlertTriangle,
                color: (stats?.pending_requests ?? 0) > 0 ? 'text-danger' : 'text-text-muted',
                bg:    (stats?.pending_requests ?? 0) > 0 ? 'bg-danger-surface' : 'bg-surface-2',
              },
            ].map(({ label, value, sub, icon: Icon, color, bg }) => (
              <div key={label} className="bg-background rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={18} className={color} />
                </div>
                <p className="text-2xl font-bold font-heading text-text mb-0.5">{value}</p>
                <p className="text-xs text-text-muted">{label}</p>
                {sub && <p className="text-[11px] text-text-subtle mt-0.5">{sub}</p>}
              </div>
            ))}
          </div>

          {/* Occupancy bar */}
          <div className="bg-background rounded-2xl border border-border p-6 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold font-heading text-text">Shelter Capacity</h3>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_BADGE[stats?.shelter_status] ?? 'muted'}>
                  {STATUS_LABEL[stats?.shelter_status] ?? stats?.shelter_status}
                </Badge>
                <span className="text-xs text-text-muted">
                  {stats?.civilians_count} / {stats?.capacity} people
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-2 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${occupancyColor}`}
                style={{ width: `${stats?.occupancy_pct ?? 0}%` }}
              />
            </div>
          </div>

          {/* Recent civilians */}
          <div className="bg-background rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-5">
              <Clock size={14} className="text-text-subtle" />
              <h3 className="text-sm font-semibold font-heading text-text">Recently Admitted</h3>
            </div>

            {(stats?.recent_civilians ?? []).length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">No civilians admitted yet.</p>
            ) : (
              <div className="space-y-3">
                {(stats?.recent_civilians ?? []).map(c => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-warning-surface flex items-center justify-center text-xs font-bold text-warning shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{c.name}</p>
                      <p className="text-xs text-text-muted truncate">{c.phone ?? c.email}</p>
                    </div>
                    <Badge variant={c.is_active ? 'success' : 'danger'}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </ShelterLayout>
  )
}
