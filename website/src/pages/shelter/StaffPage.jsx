import { Users } from 'lucide-react'
import ShelterLayout from '../../components/layouts/ShelterLayout'

export default function ShelterStaffPage() {
  return (
    <ShelterLayout title="Staff">
      <div className="bg-background rounded-2xl border border-border p-12 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mb-4">
          <Users size={24} className="text-text-subtle" />
        </div>
        <h3 className="text-base font-semibold font-heading text-text mb-2">Staff</h3>
        <p className="text-sm text-text-muted max-w-xs">
          Manage your shelter's staff accounts and their role assignments.
        </p>
      </div>
    </ShelterLayout>
  )
}
