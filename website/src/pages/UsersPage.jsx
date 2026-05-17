import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import UserPanel       from '../components/users/UserPanel'
import { Button, Table, Badge, SearchInput, Select, ConfirmDialog } from '../components/ui'
import { getUsers, createUser, updateUser, deleteUser } from '../api/users'

// Civilians have their own dedicated page — staff page excludes them
const STAFF_ROLES = ['government_admin', 'government_staff', 'shelter_admin', 'shelter_staff']

const ROLE_BADGE_VARIANT = {
  government_admin: 'info',
  government_staff: 'purple',
  shelter_admin:    'success',
  shelter_staff:    'muted',
  civilian:         'warning',
}

const ROLE_LABEL = {
  government_admin: 'Gov Admin',
  government_staff: 'Gov Staff',
  shelter_admin:    'Shelter Admin',
  shelter_staff:    'Shelter Staff',
  civilian:         'Civilian',
}

const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'All roles' },
  ...STAFF_ROLES.map(r => ({ value: r, label: ROLE_LABEL[r] })),
]

export default function UsersPage() {
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [loadError,  setLoadError]  = useState(null)
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [panel,      setPanel]      = useState(null)
  const [delTarget,  setDelTarget]  = useState(null)

  useEffect(() => {
    getUsers()
      .then(res => setUsers(res.data ?? []))
      .catch(err => setLoadError(err.message ?? 'Failed to load users.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (
      u.role !== 'civilian' &&                                                    // civilians are on their own page
      (!search || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (!roleFilter || u.role === roleFilter)
    )
  })

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
    await deleteUser(user.id)
    setUsers(prev => prev.filter(u => u.id !== user.id))
    setDelTarget(null)
  }

  const columns = [
    {
      key: 'name',
      header: 'User',
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
      key: 'role',
      header: 'Role',
      render: role => (
        <Badge variant={ROLE_BADGE_VARIANT[role] ?? 'muted'}>
          {ROLE_LABEL[role] ?? role}
        </Badge>
      ),
    },
    {
      key: 'shelter',
      header: 'Shelter',
      className: 'hidden md:table-cell',
      render: (_, u) => <span className="text-sm text-text-muted">{u.shelter?.name ?? '—'}</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: active => (
        <Badge variant={active ? 'success' : 'danger'}>
          {active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'id',
      header: '',
      render: (_, u) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="icon-edit"   onClick={() => setPanel({ user: u })} title="Edit"><Pencil size={13} /></Button>
          <Button variant="icon-delete" onClick={() => setDelTarget(u)}       title="Delete"><Trash2 size={13} /></Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout title="Staff">

      {loadError && (
        <div className="text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
          {loadError}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <SearchInput
          value={search} onChange={setSearch}
          placeholder="Search name or email…"
          className="flex-1 min-w-48 max-w-xs"
        />
        <Select
          value={roleFilter} onChange={setRoleFilter}
          options={ROLE_FILTER_OPTIONS}
          className="w-40"
        />
        <Button className="ms-auto" onClick={() => setPanel({})}>
          <Plus size={14} /> Add staff
        </Button>
      </div>

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        emptyText="No staff members match your search."
      />

      {panel !== null && (
        <UserPanel
          editingUser={panel.user}
          availableRoles={STAFF_ROLES}
          showShelter={true}
          onSave={handleSave}
          onClose={() => setPanel(null)}
        />
      )}

      {delTarget && (
        <ConfirmDialog
          title="Delete user?"
          message={<><span className="font-semibold text-text">{delTarget.name}</span> will be permanently removed.</>}
          onConfirm={() => handleDelete(delTarget)}
          onCancel={() => setDelTarget(null)}
        />
      )}

    </DashboardLayout>
  )
}
