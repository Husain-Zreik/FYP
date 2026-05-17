import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, UserPlus, Pencil, Trash2, Check, X, Search, UserCheck, Eye, RefreshCw } from 'lucide-react'
import ShelterLayout from '../../components/layouts/ShelterLayout'
import UserPanel     from '../../components/users/UserPanel'
import { Button, Table, Badge, SearchInput, ConfirmDialog } from '../../components/ui'
import { createUser, updateUser, deleteUser } from '../../api/users'
import { useAllUsersStore } from '../../store/dataStore'
import { inviteCivilian, searchAvailable } from '../../api/shelterRequests'

// â”€â”€â”€ Invite Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function InvitePanel({ onClose, onInvited }) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [inviting, setInviting] = useState(null)
  const [invited,  setInvited]  = useState(new Set())
  const [error,    setError]    = useState(null)

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const res = await searchAvailable(q)
      setResults(res.data ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 350)
    return () => clearTimeout(t)
  }, [query, doSearch])

  async function handleInvite(civilian) {
    setInviting(civilian.id)
    setError(null)
    try {
      await inviteCivilian(civilian.id)
      setInvited(prev => new Set([...prev, civilian.id]))
      onInvited?.()
    } catch (err) {
      setError(err.message ?? 'Failed to send invitation.')
    } finally {
      setInviting(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-text/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-background border border-border rounded-2xl w-full max-w-md shadow-xl flex flex-col"
        style={{ maxHeight: '80vh' }}>

        <div className="flex items-start justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold font-heading text-text">Invite civilian</h2>
            <p className="text-xs text-text-muted mt-0.5">Search civilians not yet in any shelter</p>
          </div>
          <Button variant="icon-ghost" onClick={onClose}><X size={16} /></Button>
        </div>

        <div className="px-6 py-4 border-b border-border shrink-0">
          <div className="relative">
            <Search size={14} className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-text-subtle" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, email or phoneâ€¦"
              autoFocus
              className="w-full border border-border rounded-xl ps-9 pe-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all"
            />
          </div>
          {error && <p className="text-xs text-danger mt-2">{error}</p>}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-border border-t-secondary rounded-full animate-spin" />
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <p className="text-sm text-text-muted text-center py-8">No unassigned civilians found.</p>
          )}
          {!loading && !query && (
            <p className="text-sm text-text-muted text-center py-8">Start typing to search.</p>
          )}
          {!loading && results.length > 0 && (
            <div className="space-y-2">
              {results.map(c => {
                const done = invited.has(c.id)
                return (
                  <div key={c.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-surface transition-colors">
                    <div className="w-8 h-8 rounded-full bg-warning-surface flex items-center justify-center text-xs font-bold text-warning shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{c.name}</p>
                      <p className="text-xs text-text-muted truncate">{c.phone ?? c.email}</p>
                    </div>
                    <Button size="sm" variant={done ? 'secondary' : 'primary'}
                      disabled={done || inviting === c.id} loading={inviting === c.id}
                      onClick={() => !done && handleInvite(c)}>
                      {done ? <><Check size={12} /> Sent</> : 'Invite'}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ShelterCiviliansPage() {
  const navigate = useNavigate()
  const { items, loading, error: loadError, load, append, update: storeUpdate, remove } = useAllUsersStore()

  const [search,     setSearch]     = useState('')
  const [panel,      setPanel]      = useState(null)
  const [showInvite, setShowInvite] = useState(false)
  const [delTarget,  setDelTarget]  = useState(null)
  const [deleting,   setDeleting]   = useState(false)

  useEffect(() => { load() }, [load])

  const civilians = items.filter(u => u.role === 'civilian')
  const filtered  = civilians.filter(u => {
    const q = search.toLowerCase()
    return !search || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  async function handleSave(formData) {
    if (panel?.user) { const res = await updateUser(panel.user.id, formData); storeUpdate(panel.user.id, res.data) }
    else { const res = await createUser(formData); append(res.data) }
    setPanel(null)
  }

  async function handleDelete(user) {
    setDeleting(true)
    try {
      await deleteUser(user.id)
      remove(user.id)
      setDelTarget(null)
    } finally { setDeleting(false) }
  }

  const columns = [
    {
      key: 'name', header: 'Civilian',
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
      key: 'phone', header: 'Phone',
      className: 'hidden sm:table-cell',
      render: phone => <span className="text-sm text-text-muted">{phone ?? 'â€”'}</span>,
    },
    {
      key: 'is_active', header: 'Status',
      render: active => <Badge variant={active ? 'success' : 'danger'}>{active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'id', header: '',
      render: (_, u) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="icon-ghost"  onClick={() => navigate(`/shelter/civilians/${u.id}`)} title="View details"><Eye    size={13} /></Button>
          <Button variant="icon-delete" onClick={() => setDelTarget(u)}                        title="Remove"><Trash2 size={13} /></Button>
        </div>
      ),
    },
  ]

  return (
    <ShelterLayout
      title="Civilians"
      subtitle="Civilians registered and admitted to this shelter."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => load(true)} title="Sync"><RefreshCw size={14}/></Button>
          <Button variant="secondary" onClick={() => setShowInvite(true)}><UserPlus size={14}/> Invite existing</Button>
          <Button onClick={() => setPanel({})}><Plus size={14}/> Add new</Button>
        </div>
      }
    >

      {loadError && (
        <div className="text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
          {loadError}
        </div>
      )}

      <div className="mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search civilians…" className="max-w-xs" />
      </div>

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        emptyText="No civilians in this shelter yet."
        emptyNode={
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center">
              <UserCheck size={20} className="text-text-subtle" />
            </div>
            <div>
              <p className="text-sm font-medium text-text mb-1">No civilians yet</p>
              <p className="text-xs text-text-muted">Add a new civilian or invite an existing one.</p>
            </div>
          </div>
        }
      />

      {panel !== null && (
        <UserPanel editingUser={panel.user} availableRoles={['civilian']} showShelter={false}
          onSave={handleSave} onClose={() => setPanel(null)} />
      )}

      {showInvite && (
        <InvitePanel onClose={() => setShowInvite(false)} onInvited={() => {}} />
      )}

      {delTarget && (
        <ConfirmDialog
          title="Remove civilian?"
          message={<><span className="font-semibold text-text">{delTarget.name}</span> will be removed from this shelter.</>}
          confirmLabel="Remove"
          loading={deleting}
          onConfirm={() => handleDelete(delTarget)}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </ShelterLayout>
  )
}


