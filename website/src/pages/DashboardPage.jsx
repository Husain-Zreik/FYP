import { useEffect, useState } from 'react'
import { Building2, Users, UserCheck, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
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

  const cards = stats ? [
    {
      label:   'Total Shelters',
      value:   stats.total_shelters,
      sub:     `${stats.active_shelters} active`,
      icon:    Building2,
      color:   'text-secondary',
      bg:      'bg-secondary/10',
    },
    {
      label:   'Civilians',
      value:   stats.total_civilians,
      sub:     `${stats.assigned_civilians} assigned to shelters`,
      icon:    UserCheck,
      color:   'text-success',
      bg:      'bg-success-surface',
    },
    {
      label:   'Staff',
      value:   stats.total_staff,
      sub:     'Across all shelters',
      icon:    Users,
      color:   'text-warning',
      bg:      'bg-warning-surface',
    },
    {
      label:   'Pending Requests',
      value:   stats.pending_requests,
      sub:     'Awaiting response',
      icon:    AlertTriangle,
      color:   stats.pending_requests > 0 ? 'text-danger' : 'text-text-muted',
      bg:      stats.pending_requests > 0 ? 'bg-danger-surface' : 'bg-surface-2',
    },
  ] : []

  return (
    <DashboardLayout title="Dashboard">

      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-xl font-bold font-heading text-text">
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-sm text-text-muted mt-0.5">
          Here's the current system overview.
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
            {cards.map(({ label, value, sub, icon: Icon, color, bg }) => (
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

          {/* Recent civilians */}
          <div className="bg-background rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-5">
              <Clock size={14} className="text-text-subtle" />
              <h3 className="text-sm font-semibold font-heading text-text">Recently Registered Civilians</h3>
            </div>

            {(stats?.recent_civilians ?? []).length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">No civilians registered yet.</p>
            ) : (
              <div className="space-y-3">
                {(stats?.recent_civilians ?? []).map(c => (
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
        </>
      )}
    </DashboardLayout>
  )
}
