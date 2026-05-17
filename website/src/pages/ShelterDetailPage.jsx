import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, MapPin, Phone, Mail, Users, UserCheck, AlertCircle } from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import ShelterPanel    from '../components/shelters/ShelterPanel'
import { Button, Badge, Loader, Table } from '../components/ui'
import { getShelter, updateShelter } from '../api/shelters'

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
const ROLE_BADGE = {
  shelter_admin: 'success',
  shelter_staff: 'muted',
}
const ROLE_LABEL = {
  shelter_admin: 'Shelter Admin',
  shelter_staff: 'Shelter Staff',
}

export default function ShelterDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [shelter,   setShelter]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [showEdit,  setShowEdit]  = useState(false)

  useEffect(() => {
    getShelter(id)
      .then(res => setShelter(res.data))
      .catch(err => setError(err.message ?? 'Failed to load shelter.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave(formData) {
    const res = await updateShelter(id, formData)
    setShelter(prev => ({ ...prev, ...res.data }))
    return res.data
  }

  // Occupancy percentage
  const occupancy = shelter
    ? Math.min(100, Math.round(((shelter.civilians_count ?? 0) / (shelter.capacity ?? 1)) * 100))
    : 0
  const occupancyColor = occupancy >= 90 ? 'bg-danger' : occupancy >= 70 ? 'bg-warning' : 'bg-success'

  const staffColumns = [
    {
      key: 'name',
      header: 'Staff member',
      render: (_, u) => (
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-text">{u.name}</p>
            <p className="text-xs text-text-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: role => <Badge variant={ROLE_BADGE[role] ?? 'muted'}>{ROLE_LABEL[role] ?? role}</Badge>,
    },
    {
      key: 'phone',
      header: 'Phone',
      className: 'hidden sm:table-cell',
      render: phone => <span className="text-sm text-text-muted">{phone ?? '—'}</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: active => <Badge variant={active ? 'success' : 'danger'}>{active ? 'Active' : 'Inactive'}</Badge>,
    },
  ]

  const civilianColumns = [
    {
      key: 'name',
      header: 'Civilian',
      render: (_, u) => (
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-warning-surface flex items-center justify-center text-xs font-bold text-warning shrink-0">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-text">{u.name}</p>
            <p className="text-xs text-text-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      className: 'hidden sm:table-cell',
      render: phone => <span className="text-sm text-text-muted">{phone ?? '—'}</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: active => <Badge variant={active ? 'success' : 'danger'}>{active ? 'Active' : 'Inactive'}</Badge>,
    },
  ]

  if (loading) return (
    <DashboardLayout title="Shelter" back="/shelters">
      <div className="flex items-center justify-center" style={{ minHeight: 'clamp(320px, 55vh, 520px)' }}>
        <Loader size="lg" />
      </div>
    </DashboardLayout>
  )

  if (error || !shelter) return (
    <DashboardLayout title="Shelter" back="/shelters">
      <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
        <AlertCircle size={15} className="shrink-0 mt-0.5" />{error ?? 'Shelter not found.'}
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout
      title={shelter.name}
      subtitle={`${shelter.governorate}${shelter.district ? ` · ${shelter.district}` : ''}`}
      back="/shelters"
      badge={
        <>
          {shelter.code && <span className="text-xs text-text-subtle bg-surface-2 px-2 py-0.5 rounded-full font-mono">{shelter.code}</span>}
          <Badge variant={STATUS_BADGE[shelter.status] ?? 'muted'}>{STATUS_LABEL[shelter.status] ?? shelter.status}</Badge>
        </>
      }
      actions={
        <Button onClick={() => setShowEdit(true)}>
          <Save size={14} /> Edit
        </Button>
      }
    >

      <div className="grid lg:grid-cols-3 gap-5 mb-6">

        {/* Info card */}
        <div className="lg:col-span-2 bg-background rounded-2xl border border-border p-6 space-y-4">
          <h3 className="text-sm font-semibold font-heading text-text">Details</h3>

          <div className="flex items-start gap-2 text-sm text-text-muted">
            <MapPin size={15} className="shrink-0 mt-0.5 text-secondary" />
            <span>{shelter.address}</span>
          </div>

          {(shelter.latitude && shelter.longitude) && (
            <div className="flex items-start gap-2 text-sm text-text-muted">
              <MapPin size={15} className="shrink-0 mt-0.5 text-text-subtle" />
              <span className="font-mono text-xs">{shelter.latitude}, {shelter.longitude}</span>
            </div>
          )}

          {shelter.phone && (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Phone size={15} className="shrink-0 text-secondary" />
              <span>{shelter.phone}</span>
            </div>
          )}

          {shelter.email && (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Mail size={15} className="shrink-0 text-secondary" />
              <span>{shelter.email}</span>
            </div>
          )}

          {shelter.notes && (
            <p className="text-sm text-text-muted bg-surface rounded-xl px-4 py-3 leading-relaxed">
              {shelter.notes}
            </p>
          )}
        </div>

        {/* Stats card */}
        <div className="bg-background rounded-2xl border border-border p-6 space-y-5">
          <h3 className="text-sm font-semibold font-heading text-text">Capacity</h3>

          {/* Occupancy bar */}
          <div>
            <div className="flex justify-between text-xs text-text-muted mb-2">
              <span>{shelter.civilians_count ?? 0} civilians</span>
              <span>{occupancy}%</span>
            </div>
            <div className="w-full bg-surface-2 rounded-full h-2.5 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${occupancyColor}`} style={{ width: `${occupancy}%` }} />
            </div>
            <p className="text-xs text-text-subtle mt-1">Max capacity: {shelter.capacity}</p>
          </div>

          <div className="divide-y divide-border">
            {[
              { icon: Users,      label: 'Civilians', value: shelter.civilians_count ?? 0, color: 'text-warning'   },
              { icon: UserCheck,  label: 'Staff',     value: shelter.staff_count     ?? 0, color: 'text-secondary' },
              { icon: MapPin,     label: 'Rooms',     value: shelter.rooms ?? '—',          color: 'text-text-muted' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Icon size={14} className={color} /> {label}
                </div>
                <span className="text-sm font-semibold text-text">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Staff table */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold font-heading text-text mb-3">
          Staff <span className="text-text-subtle font-normal">({shelter.staff?.length ?? 0})</span>
        </h3>
        <Table
          columns={staffColumns}
          data={shelter.staff ?? []}
          pageSize={5}
          emptyText="No staff assigned to this shelter."
        />
      </div>

      {/* Civilians table */}
      <div>
        <h3 className="text-sm font-semibold font-heading text-text mb-3">
          Civilians <span className="text-text-subtle font-normal">({shelter.civilians?.length ?? 0})</span>
        </h3>
        <Table
          columns={civilianColumns}
          data={shelter.civilians ?? []}
          pageSize={10}
          emptyText="No civilians admitted to this shelter."
        />
      </div>

      {showEdit && (
        <ShelterPanel
          editingShelter={shelter}
          onSave={handleSave}
          onClose={() => setShowEdit(false)}
        />
      )}

    </DashboardLayout>
  )
}
