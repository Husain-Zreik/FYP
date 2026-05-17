import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import ShelterLayout from '../../components/layouts/ShelterLayout'
import UserPanel     from '../../components/users/UserPanel'
import { Button, Table, Badge, SearchInput, ConfirmDialog } from '../../components/ui'
import { getUsers, createUser, updateUser, deleteUser } from '../../api/users'

const SHELTER_ROLES = ['shelter_admin', 'shelter_staff']

const ROLE_BADGE_VARIANT = { shelter_admin: 'success', shelter_staff: 'muted' }
const ROLE_LABEL          = { shelter_admin: 'Shelter Admin', shelter_staff: 'Shelter Staff' }

export default function ShelterStaffPage() {
  const [users,     setUsers]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [search,    setSearch]    = useState('')
  const [panel,     setPanel]     = useState(null)
  const [delTarget, setDelTarget] = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  useEffect(() => {
    getUsers()
      .then(res => setUsers(res.data ?? []))
      .catch(err => setLoadError(err.message ?? 'Failed to load staff.'))
      .finally(() => setLoading(false))
  }, [])

  // Only shelter staff roles — civilians are on their own page
  const staff    = users.filter(u => SHELTER_ROLES.includes(u.role))
  const filtered = staff.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSave(formData) {
    if (panel?.user) {
      const res = await updateUser(panel.user.id, formData)
      setUsers(prev => prev.map(u => u.id === panel.user.id ? res.data : u))
    } else {
      const res = await createUser(formData)
      setUsers(prev => [...prev, res.data])
    }
    setPanel(null)
  }

  async function handleDelete(user) {
    setDeleting(true)
    try {
      await deleteUser(user.id)
      setUsers(prev => prev.filter(u => u.id !== user.id))
      setDelTarget(null)
    } finally { setDeleting(false) }
  }

  const columns = [
    {
      key: 'name', header: 'Staff member',
      render: (_, u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-text truncate">{u.name}</p>
            <p className="text-xs text-text-muted truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role', header: 'Role',
      render: role => <Badge variant={ROLE_BADGE_VARIANT[role] ?? 'muted'}>{ROLE_LABEL[role] ?? role}</Badge>,
    },
    {
      key: 'phone', header: 'Phone', className: 'hidden sm:table-cell',
      render: phone => <span className="text-sm text-text-muted">{phone ?? '—'}</span>,
    },
    {
      key: 'is_active', header: 'Status',
      render: active => <Badge variant={active ? 'success' : 'danger'}>{active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'id', header: '',
      render: (_, u) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="icon-edit"   onClick={() => setPanel({ user: u })} title="Edit"><Pencil size={13} /></Button>
          <Button variant="icon-delete" onClick={() => setDelTarget(u)}       title="Remove"><Trash2 size={13} /></Button>
        </div>
      ),
    },
  ]

  return (
    <ShelterLayout
      title="Staff"
      subtitle="Manage your shelter's staff members."
      actions={
        <Button onClick={() => setPanel({})}>
          <Plus size={14} /> Add staff
        </Button>
      }
    >

      {loadError && (
        <div className="text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
          {loadError}
        </div>
      )}

      <div className="mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" className="max-w-xs" />
      </div>

      <Table columns={columns} data={filtered} loading={loading} emptyText="No staff members yet." />

      {panel !== null && (
        <UserPanel editingUser={panel.user} availableRoles={SHELTER_ROLES} showShelter={false}
          onSave={handleSave} onClose={() => setPanel(null)} />
      )}

      {delTarget && (
        <ConfirmDialog
          title="Remove staff member?"
          message={<><span className="font-semibold text-text">{delTarget.name}</span> will be permanently removed.</>}
          confirmLabel="Remove"
          loading={deleting}
          onConfirm={() => handleDelete(delTarget)}
          onCancel={() => setDelTarget(null)}
        />
      )}

    </ShelterLayout>
  )
}
