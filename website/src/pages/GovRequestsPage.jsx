import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, Clock, AlertCircle, Send, Inbox, Eye, Building2 } from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import { Button, Badge, Loader } from '../components/ui'
import { getRequests, acceptRequest, rejectRequest, cancelInvitation } from '../api/shelterRequests'
import { CivilianPanel } from './shelter/RequestsPage'   // reuse the review panel

const TYPE_LABEL = { invitation: 'Shelter invited', request: 'Civilian requested' }
const TYPE_BADGE = { invitation: 'info',            request: 'warning'            }

function RequestRow({ req, actioning, onAccept, onReject, onCancel, onView }) {
  const isInvitation = req.type === 'invitation'
  const id           = req.id
  const hasId        = req.civilian?.profile?.id_number

  return (
    <div className="flex items-center gap-4 bg-background border border-border rounded-2xl p-4 hover:border-border-2 transition-colors">

      {/* Civilian */}
      <div className="w-9 h-9 rounded-full bg-warning-surface flex items-center justify-center text-sm font-bold text-warning shrink-0">
        {req.civilian?.name?.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text">{req.civilian?.name}</p>
        <p className="text-xs text-text-muted truncate">{req.civilian?.phone ?? req.civilian?.email}</p>
        {!hasId && <p className="text-[11px] text-warning mt-0.5">⚠ No ID on file</p>}
      </div>

      {/* Arrow to shelter */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <div className="w-5 h-px bg-border-2" />
        <Building2 size={13} className="text-text-subtle" />
        <span className="text-xs font-medium text-text">{req.shelter?.name ?? '—'}</span>
      </div>

      <Badge variant={TYPE_BADGE[req.type] ?? 'muted'} className="shrink-0 hidden md:inline-flex">
        {TYPE_LABEL[req.type]}
      </Badge>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="secondary" onClick={() => onView(req)} title="Review">
          <Eye size={13} /> Review
        </Button>
        {isInvitation ? (
          <Button size="sm" variant="secondary"
            loading={actioning === `cancel-${id}`} disabled={!!actioning}
            onClick={() => onCancel(req)}>
            <X size={13} /> Cancel
          </Button>
        ) : (
          <>
            <Button size="sm"
              loading={actioning === `accept-${id}`} disabled={!!actioning || !hasId}
              title={!hasId ? 'Civilian must have ID on file' : undefined}
              onClick={() => onAccept(req)}>
              <Check size={13} /> Accept
            </Button>
            <Button size="sm" variant="danger"
              loading={actioning === `reject-${id}`} disabled={!!actioning}
              onClick={() => onReject(req)}>
              <X size={13} /> Reject
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default function GovRequestsPage() {
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [actioning, setActioning] = useState(null)
  const [viewReq,   setViewReq]   = useState(null)

  useEffect(() => {
    getRequests()
      .then(res => setItems(res.data ?? []))
      .catch(err => setLoadError(err.message ?? 'Failed to load requests.'))
      .finally(() => setLoading(false))
  }, [])

  function remove(id) { setItems(prev => prev.filter(r => r.id !== id)) }

  async function handleAccept(req) {
    setActioning(`accept-${req.id}`)
    try { await acceptRequest(req.id); remove(req.id) }
    catch (err) { setLoadError(err.message ?? 'Failed.') }
    finally { setActioning(null) }
  }

  async function handleReject(req) {
    setActioning(`reject-${req.id}`)
    try { await rejectRequest(req.id); remove(req.id) }
    catch (err) { setLoadError(err.message ?? 'Failed.') }
    finally { setActioning(null) }
  }

  async function handleCancel(req) {
    setActioning(`cancel-${req.id}`)
    try { await cancelInvitation(req.id); remove(req.id) }
    catch (err) { setLoadError(err.message ?? 'Failed.') }
    finally { setActioning(null) }
  }

  const incoming    = items.filter(r => r.type === 'request')
  const invitations = items.filter(r => r.type === 'invitation')

  return (
    <DashboardLayout title="Requests" subtitle="All pending shelter join requests across the system">

      {loadError && (
        <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={15} className="shrink-0 mt-0.5" /> {loadError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center" style={{ minHeight: 'clamp(320px, 55vh, 520px)' }}>
          <Loader size="lg" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-background border border-border rounded-2xl"
          style={{ minHeight: 'clamp(320px, 55vh, 520px)' }}>
          <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mb-3">
            <Clock size={20} className="text-text-subtle" />
          </div>
          <p className="text-sm font-medium text-text mb-1">No pending requests</p>
          <p className="text-xs text-text-muted">All requests and invitations have been resolved.</p>
        </div>
      ) : (
        <>
          {incoming.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Inbox size={15} className="text-text-subtle" />
                <h2 className="text-sm font-semibold font-heading text-text">Join Requests</h2>
                <span className="text-[10px] font-bold bg-warning-surface text-warning px-2 py-0.5 rounded-full">{incoming.length}</span>
              </div>
              <div className="space-y-3">
                {incoming.map(req => (
                  <RequestRow key={req.id} req={req} actioning={actioning}
                    onAccept={handleAccept} onReject={handleReject}
                    onCancel={handleCancel} onView={setViewReq} />
                ))}
              </div>
            </div>
          )}

          {invitations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Send size={15} className="text-text-subtle" />
                <h2 className="text-sm font-semibold font-heading text-text">Sent Invitations</h2>
                <span className="text-[10px] font-bold bg-surface-2 text-text-muted px-2 py-0.5 rounded-full">{invitations.length}</span>
              </div>
              <div className="space-y-3">
                {invitations.map(req => (
                  <RequestRow key={req.id} req={req} actioning={actioning}
                    onAccept={handleAccept} onReject={handleReject}
                    onCancel={handleCancel} onView={setViewReq} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {viewReq && (
        <CivilianPanel req={viewReq} onClose={() => setViewReq(null)}
          actioning={actioning}
          onAccept={handleAccept} onReject={handleReject} onCancel={handleCancel} />
      )}

    </DashboardLayout>
  )
}
