import { Users } from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'

export default function UsersPage() {
  return (
    <DashboardLayout title="Users">
      <div className="bg-background rounded-2xl border border-border p-12 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mb-4">
          <Users size={24} className="text-text-subtle" />
        </div>
        <h3 className="text-base font-semibold font-heading text-text mb-2">Users</h3>
        <p className="text-sm text-text-muted max-w-xs">Manage staff accounts and role assignments.</p>
      </div>
    </DashboardLayout>
  )
}
