import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, UserPlus, Pencil, Trash2, Check, X, Search, Clock, UserCheck, Eye } from 'lucide-react'
import ShelterLayout from '../../components/layouts/ShelterLayout'
import UserPanel     from '../../components/users/UserPanel'
import { Button, Table, Badge, SearchInput, Input, ConfirmDialog } from '../../components/ui'
import { getUsers, createUser, updateUser, deleteUser } from '../../api/users'
import { getRequests, inviteCivilian, acceptRequest, rejectRequest, searchAvailable } from '../../api/shelterRequests'

// ─── Invite Panel ─────────────────────────────────────────────────────────────
function InvitePanel({ onClose, onInvited }) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [inviting, setInviting] = useState(null) // id being invited
  const [invited,  setInvited]  = useState(new Set())
  const [error,    setError]    = useState(null)

  const search = useCallback(async (q) => {
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
    const t = setTimeout(() => search(query), 350)
    return () => clearTimeout(t)
  }, [query, search])

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

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold font-heading text-text">Invite civilian</h2>
            <p className="text-xs text-text-muted mt-0.5">Search for civilians not yet in any shelter</p>
          </div>
          <Button variant="icon-ghost" onClick={onClose}><X size={16} /></Button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-border shrink-0">
          <div className="relative">
            <Search size={14} className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-text-subtle" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, email or phone…"
              autoFocus
              className="w-full border border-border rounded-xl ps-9 pe-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all"
            />
          </div>
          {error && <p className="text-xs text-danger mt-2">{error}</p>}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-border border-t-secondary rounded-full animate-spin" />
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <p className="text-sm text-text-muted text-center py-8">
              No unassigned civilians found.
            </p>
          )}

          {!loading && !query && (
            <p className="text-sm text-text-muted text-center py-8">
              Start typing to search available civilians.
            </p>
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
                    <Button
                      size="sm"
                      variant={done ? 'secondary' : 'primary'}
                      disabled={done || inviting === c.id}
                      loading={inviting === c.id}
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

// ─── Request card ─────────────────────────────────────────────────────────────
function RequestCard({ req, onAccept, onReject, loading }) {
  const isInvitation = req.type === 'invitation'

  return (
    <div className="flex items-center gap-4 p-4 bg-background border border-border rounded-xl">
      <div className="w-9 h-9 rounded-full bg-warning-surface flex items-center justify-center text-sm font-bold text-warning shrink-0">
        {req.civilian.name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">{req.civilian.name}</p>
        <p className="text-xs text-text-muted truncate">{req.civilian.phone ?? req.civilian.email}</p>
      </div>

      <Badge variant={isInvitation ? 'info' : 'warning'} className="shrink-0">
        {isInvitation ? 'Invited' : 'Requested'}
      </Badge>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button size="sm" variant="primary" loading={loading === `accept-${req.id}`}
          onClick={() => onAccept(req)}>
          <Check size={12} /> Accept
        </Button>
        <Button size="sm" variant="danger" loading={loading === `reject-${req.id}`}
          onClick={() => onReject(req)}>
          <X size={12} /> Reject
        </Button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ShelterCiviliansPage() {
  const navigate = useNavigate()
  const [all,         setAll]         = useState([])
  const [requests,    setRequests]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [loadError,   setLoadError]   = useState(null)
  const [search,      setSearch]      = useState('')
  const [panel,       setPanel]       = useState(null)
  const [showInvite,  setShowInvite]  = useState(false)
  const [delTarget,   setDelTarget]   = useState(null)
  const [reqLoading,  setReqLoading]  = useState(null) // 'accept-id' | 'reject-id'

  function loadData() {
    return Promise.all([
      getUsers().then(res => setAll(res.data ?? [])),
      getRequests().then(res => setRequests(res.data ?? [])),
    ])
  }

  useEffect(() => {
    loadData()
      .catch(err => setLoadError(err.message ?? 'Failed to load data.'))
      .finally(() => setLoading(false))
  }, [])

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

  async function handleAccept(req) {
    setReqLoading(`accept-${req.id}`)
    try {
      await acceptRequest(req.id)
      setRequests(prev => prev.filter(r => r.id !== req.id))
      await getUsers().then(res => setAll(res.data ?? []))
    } finally {
      setReqLoading(null)
    }
  }

  async function handleReject(req) {
    setReqLoading(`reject-${req.id}`)
    try {
      await rejectRequest(req.id)
      setRequests(prev => prev.filter(r => r.id !== req.id))
    } finally {
      setReqLoading(null)
    }
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
          <Button variant="icon-ghost"  onClick={() => navigate(`/shelter/civilians/${u.id}`)} title="View details"><Eye size={13} /></Button>
          <Button variant="icon-edit"   onClick={() => setPanel({ user: u })} title="Quick edit"><Pencil size={13} /></Button>
          <Button variant="icon-delete" onClick={() => setDelTarget(u)}       title="Remove"><Trash2 size={13} /></Button>
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

      {/* ── Pending requests / invitations ── */}
      {requests.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} className="text-warning" />
            <h2 className="text-sm font-semibold font-heading text-text">Pending</h2>
            <span className="text-[10px] font-bold bg-warning-surface text-warning px-2 py-0.5 rounded-full">
              {requests.length}
            </span>
          </div>
          <div className="space-y-2">
            {requests.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                loading={reqLoading}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Active civilians toolbar ── */}
      <div className="flex items-center gap-3 mb-5">
        <SearchInput
          value={search} onChange={setSearch}
          placeholder="Search civilians…"
          className="flex-1 max-w-xs"
        />
        <Button variant="secondary" onClick={() => setShowInvite(true)}>
          <UserPlus size={14} /> Invite existing
        </Button>
        <Button onClick={() => setPanel({})}>
          <Plus size={14} /> Add new
        </Button>
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

      {/* Panels & modals */}
      {panel !== null && (
        <UserPanel
          editingUser={panel.user}
          availableRoles={['civilian']}
          showShelter={false}
          onSave={handleSave}
          onClose={() => setPanel(null)}
        />
      )}

      {showInvite && (
        <InvitePanel
          onClose={() => setShowInvite(false)}
          onInvited={() => getRequests().then(res => setRequests(res.data ?? []))}
        />
      )}

      {delTarget && (
        <ConfirmDialog
          title="Remove civilian?"
          message={<><span className="font-semibold text-text">{delTarget.name}</span> will be removed from this shelter.</>}
          confirmLabel="Remove"
          onConfirm={() => handleDelete(delTarget)}
          onCancel={() => setDelTarget(null)}
        />
      )}

    </ShelterLayout>
  )
}
