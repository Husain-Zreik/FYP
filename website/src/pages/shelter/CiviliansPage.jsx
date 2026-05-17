import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import ShelterLayout from '../../components/layouts/ShelterLayout'
import UserPanel     from '../../components/users/UserPanel'
import { Button, Table, Badge, SearchInput, ConfirmDialog } from '../../components/ui'
import { getUsers, createUser, updateUser, deleteUser } from '../../api/users'

export default function ShelterCiviliansPage() {
  const [all,       setAll]       = useState([])
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [search,    setSearch]    = useState('')
  const [panel,     setPanel]     = useState(null)
  const [delTarget, setDelTarget] = useState(null)

  useEffect(() => {
    getUsers()
      .then(res => setAll(res.data ?? []))
      .catch(err => setLoadError(err.message ?? 'Failed to load civilians.'))
      .finally(() => setLoading(false))
  }, [])

  // Backend scopes to this shelter; filter to civilians only
  const civilians = all.filter(u => u.role === 'civilian')
  const filtered  = civilians.filter(u => {
    const q = search.toLowerCase()
    return !search || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  async function handleSave(formData) {
    if (panel?.user) {
      const res = await updateUser(panel.user.id, formData)
      setAll(prev => prev.map(u => u.id === panel.user.id ? res.data : u))
    } else {
      const res = await createUser(formData)
      setAll(prev => [...prev, res.data])
    }
    setPanel(null)
  }

  async function handleDelete(user) {
    await deleteUser(user.id)
    setAll(prev => prev.filter(u => u.id !== user.id))
    setDelTarget(null)
  }

  const columns = [
    {
      key: 'name',
      header: 'Civilian',
      render: (_, u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-warning-surface flex items-center justify-center text-xs font-bold text-warning shrink-0">
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
      key: 'phone',
      header: 'Phone',
      className: 'hidden sm:table-cell',
      render: phone => <span className="text-sm text-text-muted">{phone ?? '—'}</span>,
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
    <ShelterLayout title="Civilians">

      {loadError && (
        <div className="text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
          {loadError}
        </div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <SearchInput
          value={search} onChange={setSearch}
          placeholder="Search name or email…"
          className="flex-1 max-w-xs"
        />
        <Button className="ms-auto" onClick={() => setPanel({})}>
          <Plus size={14} /> Add civilian
        </Button>
      </div>

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        emptyText="No civilians admitted to this shelter yet."
      />

      {panel !== null && (
        <UserPanel
          editingUser={panel.user}
          availableRoles={['civilian']}
          showShelter={false}
          onSave={handleSave}
          onClose={() => setPanel(null)}
        />
      )}

      {delTarget && (
        <ConfirmDialog
          title="Delete civilian?"
          message={<><span className="font-semibold text-text">{delTarget.name}</span> will be permanently removed.</>}
          onConfirm={() => handleDelete(delTarget)}
          onCancel={() => setDelTarget(null)}
        />
      )}

    </ShelterLayout>
  )
}
