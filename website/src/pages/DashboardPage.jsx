import { Building2, Users, UserCheck, TrendingUp } from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import { useAuthStore } from '../store/authStore'

const stats = [
  { label: 'Total Shelters',  value: '—', icon: Building2,  color: 'text-secondary', bg: 'bg-secondary/10' },
  { label: 'Active Users',    value: '—', icon: Users,      color: 'text-success',   bg: 'bg-success-surface' },
  { label: 'Civilians',       value: '—', icon: UserCheck,  color: 'text-warning',   bg: 'bg-warning-surface' },
  { label: 'System Activity', value: '—', icon: TrendingUp, color: 'text-text-muted', bg: 'bg-surface-2' },
]

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <DashboardLayout title="Dashboard">

      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-xl font-bold font-heading text-text">
          Good morning, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-sm text-text-muted mt-0.5">
          Here's what's happening across the platform today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-background rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
            </div>
            <p className="text-2xl font-bold font-heading text-text mb-0.5">{value}</p>
            <p className="text-xs text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid xl:grid-cols-3 gap-4">

        {/* Recent activity */}
        <div className="xl:col-span-2 bg-background rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold font-heading text-text">Recent Activity</h3>
            <span className="text-xs text-text-subtle bg-surface px-2 py-1 rounded-lg">Today</span>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mb-3">
              <TrendingUp size={20} className="text-text-subtle" />
            </div>
            <p className="text-sm font-medium text-text mb-1">No activity yet</p>
            <p className="text-xs text-text-subtle">Activity will appear here as actions are taken.</p>
          </div>
        </div>

        {/* Quick info */}
        <div className="bg-background rounded-2xl border border-border p-6">
          <h3 className="text-sm font-semibold font-heading text-text mb-5">Your Account</h3>
          <div className="space-y-4">
            {[
              { label: 'Name',   value: user?.name   },
              { label: 'Email',  value: user?.email  },
              { label: 'Role',   value: user?.role?.replace(/_/g, ' ') },
              { label: 'Status', value: user?.is_active ? 'Active' : 'Inactive' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-sm text-text font-medium capitalize truncate">{value ?? '—'}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
