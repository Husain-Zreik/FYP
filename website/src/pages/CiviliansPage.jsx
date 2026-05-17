import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Eye, RefreshCw, UserCheck, Building2, Search, Home } from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import UserPanel       from '../components/users/UserPanel'
import { Button, Table, Badge, SearchInput, Select, ConfirmDialog } from '../components/ui'
import { createUser, updateUser, deleteUser } from '../api/users'
import { getShelters } from '../api/shelters'
import client from '../api/client'
import { useAllUsersStore } from '../store/dataStore'

export default function CiviliansPage() {
  const navigate = useNavigate()
  const { items, loading, error, load, append, update: storeUpdate, remove } = useAllUsersStore()

  const [shelters,      setShelters]      = useState([])
  const [stats,         setStats]         = useState(null)
  const [search,        setSearch]        = useState('')
  const [shelterFilter, setShelterFilter] = useState('')
  const [panel,         setPanel]         = useState(null)
  const [delTarget,     setDelTarget]     = useState(null)
  const [deleting,      setDeleting]      = useState(false)

  useEffect(() => {
    load()
    getShelters().then(r => setShelters(r.data ?? []))
    client.get('/stats/government').then(r => setStats(r.data)).catch(() => {})
  }, [load])

  const civilians = items.filter(u => u.role === 'civilian')
  const filtered  = civilians.filter(u => {
    const q = search.toLowerCase()
    const matchSearch  = !search || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchShelter = shelterFilter === '' ? true : shelterFilter === 'unassigned' ? !u.shelter_id : String(u.shelter_id) === shelterFilter
    return matchSearch && matchShelter
  })

  const shelterOpts = [
    { value:'', label:'All shelters' },
    { value:'unassigned', label:'Unassigned' },
    ...shelters.map(s => ({ value:String(s.id), label:s.name })),
  ]

  async function handleSave(formData) {
    if (panel?.user) {
      const res = await updateUser(panel.user.id, formData)
      storeUpdate(panel.user.id, res.data)
    } else {
      const res = await createUser(formData)
      append(res.data)
    }
    setPanel(null)
  }

  async function handleDelete(user) {
    setDeleting(true)
    try { await deleteUser(user.id); remove(user.id); setDelTarget(null) }
    finally { setDeleting(false) }
  }

  const columns = [
    { key:'name', header:'Civilian', render:(_,u) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-warning-surface flex items-center justify-center text-xs font-bold text-warning shrink-0">{u.name.charAt(0).toUpperCase()}</div>
        <div className="min-w-0"><p className="font-medium text-text truncate">{u.name}</p><p className="text-xs text-text-muted truncate">{u.email}</p></div>
      </div>
    )},
    { key:'phone', header:'Phone', className:'hidden sm:table-cell', render: p => <span className="text-sm text-text-muted">{p??'—'}</span> },
    { key:'shelter', header:'Shelter', className:'hidden md:table-cell', render:(_,u) => u.shelter ? <Badge variant="info">{u.shelter.name}</Badge> : <span className="text-xs text-text-subtle">Unassigned</span> },
    { key:'is_active', header:'Status', render: a => <Badge variant={a?'success':'danger'}>{a?'Active':'Inactive'}</Badge> },
    { key:'id', header:'', render:(_,u) => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="icon-ghost"  onClick={() => navigate(`/civilians/${u.id}`)} title="View details"><Eye size={13}/></Button>
        <Button variant="icon-delete" onClick={() => setDelTarget(u)}                title="Delete"><Trash2 size={13}/></Button>
      </div>
    )},
  ]

  return (
    <DashboardLayout title="Civilians" subtitle="All registered civilians across the system."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => { load(true); client.get('/stats/government').then(r => setStats(r.data)).catch(() => {}) }} title="Sync"><RefreshCw size={14}/></Button>
          <Button onClick={() => setPanel({})}><Plus size={14}/> Add civilian</Button>
        </div>
      }
    >
      {error && <div className="text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">{error}</div>}

      {stats && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[
            { label:'Total registered', value:stats.total_civilians,    icon:UserCheck, color:'text-text-muted', bg:'bg-surface-2'       },
            { label:'In shelter',       value:stats.assigned_civilians, icon:Building2, color:'text-success',    bg:'bg-success-surface' },
            { label:'Private housing',  value:stats.private_civilians,  icon:Home,      color:'text-secondary',  bg:'bg-secondary/10'    },
            { label:'Seeking shelter',  value:stats.seeking_civilians,  icon:Search,    color:'text-warning',    bg:'bg-warning-surface' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-background rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0`}><Icon size={16} className={color}/></div>
              <div><p className="text-xl font-bold font-heading text-text leading-none">{value??0}</p><p className="text-xs text-text-muted mt-0.5">{label}</p></div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" className="flex-1 min-w-40 max-w-xs"/>
        <Select value={shelterFilter} onChange={setShelterFilter} options={shelterOpts} className="w-48"/>
      </div>

      <Table columns={columns} data={filtered} loading={loading} emptyText="No civilians match your filters."/>

      {panel !== null && <UserPanel editingUser={panel.user} availableRoles={['civilian']} showShelter={true} onSave={handleSave} onClose={() => setPanel(null)}/>}

      {delTarget && <ConfirmDialog title="Delete civilian?" message={<><span className="font-semibold text-text">{delTarget.name}</span> will be permanently removed.</>} loading={deleting} onConfirm={() => handleDelete(delTarget)} onCancel={() => setDelTarget(null)}/>}
    </DashboardLayout>
  )
}
