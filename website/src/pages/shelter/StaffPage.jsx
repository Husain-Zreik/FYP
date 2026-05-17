import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'
import ShelterLayout from '../../components/layouts/ShelterLayout'
import UserPanel     from '../../components/users/UserPanel'
import { Button, Table, Badge, SearchInput, ConfirmDialog } from '../../components/ui'
import { createUser, updateUser, deleteUser } from '../../api/users'
import { useAllUsersStore } from '../../store/dataStore'

const SHELTER_ROLES = ['shelter_admin', 'shelter_staff']
const ROLE_BADGE    = { shelter_admin:'success', shelter_staff:'muted' }
const ROLE_LABEL    = { shelter_admin:'Shelter Admin', shelter_staff:'Shelter Staff' }

export default function ShelterStaffPage() {
  const { items, loading, error, load, append, update: storeUpdate, remove } = useAllUsersStore()

  const [search,    setSearch]    = useState('')
  const [panel,     setPanel]     = useState(null)
  const [delTarget, setDelTarget] = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  useEffect(() => { load() }, [load])

  const staff    = items.filter(u => SHELTER_ROLES.includes(u.role))
  const filtered = staff.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSave(formData) {
    if (panel?.user) { const res = await updateUser(panel.user.id, formData); storeUpdate(panel.user.id, res.data) }
    else { const res = await createUser(formData); append(res.data) }
    setPanel(null)
  }

  async function handleDelete(user) {
    setDeleting(true)
    try { await deleteUser(user.id); remove(user.id); setDelTarget(null) }
    finally { setDeleting(false) }
  }

  const columns = [
    { key:'name', header:'Staff member', render:(_,u) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">{u.name.charAt(0).toUpperCase()}</div>
        <div className="min-w-0"><p className="font-medium text-text truncate">{u.name}</p><p className="text-xs text-text-muted truncate">{u.email}</p></div>
      </div>
    )},
    { key:'role', header:'Role', render: r => <Badge variant={ROLE_BADGE[r]??'muted'}>{ROLE_LABEL[r]??r}</Badge> },
    { key:'phone', header:'Phone', className:'hidden sm:table-cell', render: p => <span className="text-sm text-text-muted">{p??'—'}</span> },
    { key:'is_active', header:'Status', render: a => <Badge variant={a?'success':'danger'}>{a?'Active':'Inactive'}</Badge> },
    { key:'id', header:'', render:(_,u) => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="icon-edit"   onClick={() => setPanel({user:u})} title="Edit"><Pencil size={13}/></Button>
        <Button variant="icon-delete" onClick={() => setDelTarget(u)}    title="Remove"><Trash2 size={13}/></Button>
      </div>
    )},
  ]

  return (
    <ShelterLayout title="Staff" subtitle="Manage your shelter's staff members."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => load(true)} title="Sync"><RefreshCw size={14}/></Button>
          <Button onClick={() => setPanel({})}><Plus size={14}/> Add staff</Button>
        </div>
      }
    >
      {error && <div className="text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">{error}</div>}
      <div className="mb-5"><SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" className="max-w-xs"/></div>
      <Table columns={columns} data={filtered} loading={loading} emptyText="No staff members yet."/>

      {panel !== null && <UserPanel editingUser={panel.user} availableRoles={SHELTER_ROLES} showShelter={false} onSave={handleSave} onClose={() => setPanel(null)}/>}
      {delTarget && <ConfirmDialog title="Remove staff member?" message={<><span className="font-semibold text-text">{delTarget.name}</span> will be permanently removed.</>} confirmLabel="Remove" loading={deleting} onConfirm={() => handleDelete(delTarget)} onCancel={() => setDelTarget(null)}/>}
    </ShelterLayout>
  )
}
