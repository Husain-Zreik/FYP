import { useEffect, useState } from 'react'
import { Download, IdCard, Check, X, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Inbox } from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import { Table, Button, Badge, Loader, FilterBar, Modal } from '../components/ui'
import { getRequests, acceptRequest, rejectRequest, cancelInvitation } from '../api/shelterRequests'

const ID_TYPE_LABEL = { national_id: 'National ID', passport: 'Passport', residency: 'Residency Card' }
const STATUS_BADGE  = { pending: 'muted', accepted: 'success', rejected: 'danger' }
const STATUS_LABEL  = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' }
function fmt(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }

function InfoSection({ title, children }) {
  return (
    <div className="bg-surface rounded-xl p-4 space-y-2.5">
      <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider">{title}</p>
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-text-muted shrink-0">{label}</span>
      <span className="text-xs font-medium text-text text-right">{value ?? '—'}</span>
    </div>
  )
}

export default function GovRequestsPage() {
  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [actioning,   setActioning]   = useState(null)
  const [search,      setSearch]      = useState('')
  const [typeFilter,  setTypeFilter]  = useState('')
  const [statusFilter,setStatusFilter]= useState('')
  const [selectedReq, setSelectedReq] = useState(null)

  useEffect(() => {
    getRequests()
      .then(res => setItems(res.data ?? []))
      .catch(err => setError(err.message ?? 'Failed to load requests.'))
      .finally(() => setLoading(false))
  }, [])

  function updateItem(id, changes) {
    setItems(prev => prev.map(r => r.id === id ? { ...r, ...changes } : r))
  }

  async function handleAccept(req) {
    setActioning(`accept-${req.id}`)
    try {
      await acceptRequest(req.id)
      updateItem(req.id, { status: 'accepted' })
    } catch (err) { setError(err.message ?? 'Failed.') }
    finally { setActioning(null) }
  }

  async function handleReject(req) {
    setActioning(`reject-${req.id}`)
    try {
      await rejectRequest(req.id)
      updateItem(req.id, { status: 'rejected' })
    } catch (err) { setError(err.message ?? 'Failed.') }
    finally { setActioning(null) }
  }

  async function handleCancel(req) {
    setActioning(`cancel-${req.id}`)
    try {
      await cancelInvitation(req.id)
      updateItem(req.id, { status: 'rejected' })
    } catch (err) { setError(err.message ?? 'Failed.') }
    finally { setActioning(null) }
  }

  const filtered = items.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.civilian?.name?.toLowerCase().includes(q) ||
      r.shelter?.name?.toLowerCase().includes(q)
    const matchType   = !typeFilter   || r.type === typeFilter
    const matchStatus = !statusFilter || r.status === statusFilter
    return matchSearch && matchType && matchStatus
  })

  const pendingCount  = items.filter(r => r.status === 'pending').length
  const acceptedCount = items.filter(r => r.status === 'accepted').length
  const rejectedCount = items.filter(r => r.status === 'rejected').length

  const columns = [
    {
      key: 'type',
      header: 'Type',
      render: (_, req) => (
        <Badge variant={req.type === 'invitation' ? 'info' : 'warning'}>
          {req.type === 'invitation' ? 'Invitation' : 'Join Request'}
        </Badge>
      ),
    },
    {
      key: 'civilian',
      header: 'Civilian',
      render: (_, req) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-warning-surface text-warning flex items-center justify-center text-xs font-bold shrink-0">
            {req.civilian?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-text text-sm">{req.civilian?.name}</p>
            <p className="text-xs text-text-muted">{req.civilian?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'shelter',
      header: 'Shelter',
      render: (_, req) => (
        <div>
          <p className="text-sm text-text">{req.shelter?.name ?? '—'}</p>
          <p className="text-xs text-text-muted">{req.shelter?.governorate}</p>
        </div>
      ),
    },
    {
      key: 'id_status',
      header: 'ID',
      render: (_, req) => {
        const profile = req.civilian?.profile
        return profile?.has_id_document
          ? <div className="flex items-center gap-1 text-success text-xs"><CheckCircle2 size={13} /> Verified</div>
          : <div className="flex items-center gap-1 text-warning text-xs"><AlertCircle size={13} /> Missing</div>
      },
    },
    {
      key: 'created_at',
      header: 'Date',
      className: 'hidden lg:table-cell',
      render: (_, req) => (
        <span className="text-sm text-text-muted">{fmt(req.created_at)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, req) => (
        <Badge variant={STATUS_BADGE[req.status] ?? 'muted'}>
          {STATUS_LABEL[req.status] ?? req.status}
        </Badge>
      ),
    },
    {
      key: 'id',
      header: '',
      render: (_, req) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="secondary" onClick={() => setSelectedReq(req)}>
            Review
          </Button>
        </div>
      ),
    },
  ]

  const req     = selectedReq
  const c       = req?.civilian
  const profile = c?.profile

  return (
    <DashboardLayout title="Requests" subtitle="All shelter join requests and invitations across the system">

      {error && (
        <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-background border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
            <Inbox size={16} className="text-text-muted" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Total</p>
            <p className="text-xl font-bold text-text">{items.length}</p>
          </div>
        </div>
        <div className="bg-background border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-warning-surface flex items-center justify-center shrink-0">
            <Clock size={16} className="text-warning" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Pending</p>
            <p className="text-xl font-bold text-text">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-background border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-success-surface flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} className="text-success" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Accepted</p>
            <p className="text-xl font-bold text-text">{acceptedCount}</p>
          </div>
        </div>
        <div className="bg-background border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-danger-surface flex items-center justify-center shrink-0">
            <XCircle size={16} className="text-danger" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Rejected</p>
            <p className="text-xl font-bold text-text">{rejectedCount}</p>
          </div>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearch={setSearch}
        filters={[
          {
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { label: 'All types',     value: '' },
              { label: 'Join Request',  value: 'request' },
              { label: 'Invitation',    value: 'invitation' },
            ],
            className: 'w-44',
          },
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All statuses', value: '' },
              { label: 'Pending',      value: 'pending' },
              { label: 'Accepted',     value: 'accepted' },
              { label: 'Rejected',     value: 'rejected' },
            ],
            className: 'w-40',
          },
        ]}
      />

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        emptyText="No requests found."
      />

      {selectedReq && (
        <Modal
          title={c?.name}
          subtitle={`${req.type === 'invitation' ? 'Shelter invitation' : 'Join request'} · ${req.shelter?.name}`}
          onClose={() => setSelectedReq(null)}
          width="max-w-2xl"
          footer={
            req.status === 'pending' && (
              <div className="flex items-center justify-end gap-2">
                {req.type === 'invitation' ? (
                  <Button
                    variant="secondary"
                    loading={actioning === `cancel-${req.id}`}
                    onClick={() => { handleCancel(req); setSelectedReq(null) }}>
                    <X size={14} /> Cancel Invitation
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="danger"
                      loading={actioning === `reject-${req.id}`}
                      disabled={!!actioning}
                      onClick={() => { handleReject(req); setSelectedReq(null) }}>
                      <X size={14} /> Reject
                    </Button>
                    <Button
                      loading={actioning === `accept-${req.id}`}
                      disabled={!!actioning || !profile?.has_id_document}
                      title={!profile?.has_id_document ? 'Civilian must have ID document uploaded' : undefined}
                      onClick={() => { handleAccept(req); setSelectedReq(null) }}>
                      <Check size={14} /> Accept
                    </Button>
                  </>
                )}
              </div>
            )
          }
        >
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Left — ID Document */}
            <div>
              <p className="text-xs font-semibold text-text-subtle uppercase tracking-wider mb-3">Identity Document</p>
              {profile?.id_document_url ? (
                <div className="space-y-2">
                  <a href={profile.id_document_url} target="_blank" rel="noopener noreferrer"
                    className="block rounded-xl overflow-hidden border border-border hover:border-border-2 transition-colors cursor-pointer">
                    <img src={profile.id_document_url} alt="ID Document" className="w-full object-cover" style={{ maxHeight: 200 }} />
                  </a>
                  <a href={profile.id_document_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl border border-border text-sm text-secondary hover:bg-surface transition-colors">
                    <Download size={14} /> View / Download ID
                  </a>
                  {profile.id_type   && <p className="text-xs text-text-muted">Type: {ID_TYPE_LABEL[profile.id_type] ?? profile.id_type}</p>}
                  {profile.id_number && <p className="text-xs text-text-muted">Number: {profile.id_number}</p>}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center bg-warning-surface border border-warning/20 rounded-xl p-6 gap-2">
                  <IdCard size={24} className="text-warning" />
                  <p className="text-sm font-medium text-warning">No ID document uploaded</p>
                  <p className="text-xs text-text-muted text-center">This civilian must upload their ID before they can be accepted.</p>
                </div>
              )}
            </div>

            {/* Right — Profile + Request info */}
            <div className="space-y-4">
              <InfoSection title="Contact">
                <InfoRow label="Email"  value={c?.email} />
                <InfoRow label="Phone"  value={c?.phone} />
                <InfoRow label="Status" value={<Badge variant={c?.is_active ? 'success' : 'danger'}>{c?.is_active ? 'Active' : 'Inactive'}</Badge>} />
              </InfoSection>

              {profile && (
                <InfoSection title="Profile">
                  {profile.date_of_birth    && <InfoRow label="Date of birth" value={profile.date_of_birth} />}
                  {profile.gender           && <InfoRow label="Gender"        value={profile.gender} />}
                  {profile.current_location && <InfoRow label="Location"      value={profile.current_location} />}
                </InfoSection>
              )}

              <InfoSection title="Request Details">
                <InfoRow label="Type"    value={<Badge variant={req.type === 'invitation' ? 'info' : 'warning'}>{req.type === 'invitation' ? 'Invitation' : 'Join Request'}</Badge>} />
                <InfoRow label="Shelter" value={req.shelter?.name} />
                <InfoRow label="Date"    value={fmt(req.created_at)} />
                <InfoRow label="Status"  value={<Badge variant={STATUS_BADGE[req.status] ?? 'muted'}>{STATUS_LABEL[req.status] ?? req.status}</Badge>} />
              </InfoSection>
            </div>
          </div>
        </Modal>
      )}

    </DashboardLayout>
  )
}
