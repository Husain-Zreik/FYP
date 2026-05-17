import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import DashboardLayout  from '../components/layouts/DashboardLayout'
import ShelterPanel     from '../components/shelters/ShelterPanel'
import { Button, Table, Badge, SearchInput, Select, ConfirmDialog } from '../components/ui'
import { getShelters, createShelter, updateShelter, deleteShelter } from '../api/shelters'

const GOVERNORATES_OPTS = [
  { value: '', label: 'All governorates' },
  ...['Beirut','Mount Lebanon','North Lebanon','South Lebanon','Bekaa','Nabatieh','Akkar','Baalbek-Hermel']
    .map(g => ({ value: g, label: g })),
]

const STATUS_OPTS = [
  { value: '',                    label: 'All statuses'       },
  { value: 'active',              label: 'Active'             },
  { value: 'inactive',            label: 'Inactive'           },
  { value: 'full',                label: 'Full'               },
  { value: 'under_maintenance',   label: 'Under Maintenance'  },
]

const STATUS_BADGE = {
  active:            'success',
  inactive:          'muted',
  full:              'warning',
  under_maintenance: 'danger',
}

const STATUS_LABEL = {
  active:            'Active',
  inactive:          'Inactive',
  full:              'Full',
  under_maintenance: 'Maintenance',
}

export default function SheltersPage() {
  const navigate = useNavigate()

  const [shelters,   setShelters]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [loadError,  setLoadError]  = useState(null)
  const [search,     setSearch]     = useState('')
  const [govFilter,  setGovFilter]  = useState('')
  const [statFilter, setStatFilter] = useState('')
  const [panel,      setPanel]      = useState(null)
  const [delTarget,  setDelTarget]  = useState(null)
  const [delError,   setDelError]   = useState(null)

  useEffect(() => {
    getShelters()
      .then(res => setShelters(res.data ?? []))
      .catch(err => setLoadError(err.message ?? 'Failed to load shelters.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = shelters.filter(s => {
    const q = search.toLowerCase()
    return (
      (!search || s.name.toLowerCase().includes(q) || (s.code ?? '').toLowerCase().includes(q) || s.address.toLowerCase().includes(q)) &&
      (!govFilter  || s.governorate === govFilter) &&
      (!statFilter || s.status      === statFilter)
    )
  })

  async function handleSave(formData) {
    if (panel?.shelter) {
      const res = await updateShelter(panel.shelter.id, formData)
      setShelters(prev => prev.map(s => s.id === panel.shelter.id ? res.data : s))
      return res.data
    } else {
      const res = await createShelter(formData)
      setShelters(prev => [...prev, res.data])
      return res.data
    }
  }

  async function handleDelete(shelter) {
    setDelError(null)
    try {
      await deleteShelter(shelter.id)
      setShelters(prev => prev.filter(s => s.id !== shelter.id))
      setDelTarget(null)
    } catch (err) {
      setDelError(err.message ?? 'Failed to delete shelter.')
    }
  }

  // Occupancy bar
  function OccupancyBar({ shelter }) {
    const pct = shelter.capacity > 0
      ? Math.min(100, Math.round(((shelter.civilians_count ?? 0) / shelter.capacity) * 100))
      : 0
    const color = pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-success'
    return (
      <div className="flex items-center gap-2 min-w-25">
        <div className="flex-1 bg-surface-2 rounded-full h-1.5 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-text-muted shrink-0">{shelter.civilians_count ?? 0}/{shelter.capacity}</span>
      </div>
    )
  }

  const columns = [
    {
      key: 'name',
      header: 'Shelter',
      render: (_, s) => (
        <div>
          <p className="font-medium text-text">{s.name}</p>
          <p className="text-xs text-text-muted">{s.code ? `${s.code} · ` : ''}{s.governorate}</p>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      className: 'hidden lg:table-cell',
      render: addr => <span className="text-sm text-text-muted truncate max-w-xs block">{addr}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: s => <Badge variant={STATUS_BADGE[s] ?? 'muted'}>{STATUS_LABEL[s] ?? s}</Badge>,
    },
    {
      key: 'capacity',
      header: 'Occupancy',
      render: (_, s) => <OccupancyBar shelter={s} />,
    },
    {
      key: 'staff_count',
      header: 'Staff',
      className: 'hidden md:table-cell',
      render: n => <span className="text-sm text-text-muted">{n ?? 0}</span>,
    },
    {
      key: 'id',
      header: '',
      render: (_, s) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="icon-ghost"  onClick={() => navigate(`/shelters/${s.id}`)}      title="View details"><Eye     size={13} /></Button>
          <Button variant="icon-edit"   onClick={() => setPanel({ shelter: s })}            title="Edit"><Pencil size={13} /></Button>
          <Button variant="icon-delete" onClick={() => { setDelTarget(s); setDelError(null) }} title="Delete"><Trash2 size={13} /></Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout title="Shelters">

      {loadError && (
        <div className="text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
          {loadError}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, code or address…" className="flex-1 min-w-48 max-w-xs" />
        <Select value={govFilter}  onChange={setGovFilter}  options={GOVERNORATES_OPTS} className="w-44" />
        <Select value={statFilter} onChange={setStatFilter} options={STATUS_OPTS}        className="w-36" />
        <Button className="ms-auto" onClick={() => setPanel({})}>
          <Plus size={14} /> Add shelter
        </Button>
      </div>

      <Table columns={columns} data={filtered} loading={loading} emptyText="No shelters found." />

      {panel !== null && (
        <ShelterPanel editingShelter={panel.shelter} onSave={handleSave} onClose={() => setPanel(null)} />
      )}

      {delTarget && (
        <ConfirmDialog
          title="Delete shelter?"
          message={
            <>
              <span className="font-semibold text-text">{delTarget.name}</span> and all its records will be removed.
              {delError && <p className="mt-2 text-danger text-xs">{delError}</p>}
            </>
          }
          onConfirm={() => handleDelete(delTarget)}
          onCancel={() => setDelTarget(null)}
        />
      )}

    </DashboardLayout>
  )
}
