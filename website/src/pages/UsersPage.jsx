import { useEffect } from 'react'
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import UserPanel       from '../components/users/UserPanel'
import { Button, Table, Badge, SearchInput, Select, ConfirmDialog } from '../components/ui'
import { createUser, updateUser, deleteUser } from '../api/users'
import { useAllUsersStore } from '../store/dataStore'
import { useState } from 'react'

const STAFF_ROLES = ['government_admin', 'government_staff', 'shelter_admin', 'shelter_staff']
const ROLE_BADGE  = { government_admin:'info', government_staff:'purple', shelter_admin:'success', shelter_staff:'muted' }
const ROLE_LABEL  = { government_admin:'Gov Admin', government_staff:'Gov Staff', shelter_admin:'Shelter Admin', shelter_staff:'Shelter Staff' }
const ROLE_OPTS   = [{ value:'', label:'All roles' }, ...STAFF_ROLES.map(r => ({ value:r, label:ROLE_LABEL[r] }))]

export default function UsersPage() {
  const { items, loading, error, load, append, update: storeUpdate, remove } = useAllUsersStore()

  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [panel,      setPanel]      = useState(null)
  const [delTarget,  setDelTarget]  = useState(null)
  const [deleting,   setDeleting]   = useState(false)

  useEffect(() => { load() }, [load])

  const filtered = items.filter(u => {
    const q = search.toLowerCase()
    return (
      u.role !== 'civilian' &&
      (!search || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (!roleFilter || u.role === roleFilter)
    )
  })

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
    { key:'name', header:'User', render:(_,u) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">{u.name.charAt(0).toUpperCase()}</div>
        <div className="min-w-0"><p className="font-medium text-text truncate">{u.name}</p><p className="text-xs text-text-muted truncate">{u.email}</p></div>
      </div>
    )},
    { key:'role', header:'Role', render: r => <Badge variant={ROLE_BADGE[r]??'muted'}>{ROLE_LABEL[r]??r}</Badge> },
    { key:'shelter', header:'Shelter', className:'hidden md:table-cell', render:(_,u) => <span className="text-sm text-text-muted">{u.shelter?.name??'—'}</span> },
    { key:'is_active', header:'Status', render: a => <Badge variant={a?'success':'danger'}>{a?'Active':'Inactive'}</Badge> },
    { key:'id', header:'', render:(_,u) => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="icon-edit"   onClick={() => setPanel({user:u})} title="Edit"><Pencil size={13}/></Button>
        <Button variant="icon-delete" onClick={() => setDelTarget(u)}    title="Delete"><Trash2 size={13}/></Button>
      </div>
    )},
  ]

  return (
    <DashboardLayout title="Staff" subtitle="Manage all platform staff and their roles."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => load(true)} title="Sync"><RefreshCw size={14}/></Button>
          <Button onClick={() => setPanel({})}><Plus size={14}/> Add staff</Button>
        </div>
      }
    >
      {error && <div className="text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">{error}</div>}

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" className="flex-1 min-w-48 max-w-xs"/>
        <Select value={roleFilter} onChange={setRoleFilter} options={ROLE_OPTS} className="w-40"/>
      </div>

      <Table columns={columns} data={filtered} loading={loading} emptyText="No staff members match your search."/>

      {panel !== null && <UserPanel editingUser={panel.user} availableRoles={STAFF_ROLES} showShelter={true} onSave={handleSave} onClose={() => setPanel(null)}/>}

      {delTarget && <ConfirmDialog title="Delete user?" message={<><span className="font-semibold text-text">{delTarget.name}</span> will be permanently removed.</>} loading={deleting} onConfirm={() => handleDelete(delTarget)} onCancel={() => setDelTarget(null)}/>}
    </DashboardLayout>
  )
}
