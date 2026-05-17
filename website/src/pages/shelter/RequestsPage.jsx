import { useEffect, useState } from 'react'
import { Check, X, Clock, AlertCircle, Send, Inbox, Eye, IdCard } from 'lucide-react'
import ShelterLayout from '../../components/layouts/ShelterLayout'
import { Button, Badge, Loader, SlidePanel } from '../../components/ui'
import { getRequests, acceptRequest, rejectRequest, cancelInvitation } from '../../api/shelterRequests'
import { useUiStore } from '../../store/uiStore'

const ID_TYPE_LABEL = { national_id: 'National ID', passport: 'Passport', residency: 'Residency Card' }

// ─── Civilian detail panel ────────────────────────────────────────────────────
export function CivilianPanel({ req, onClose, onAccept, onReject, onCancel, actioning }) {
  const c       = req.civilian
  const profile = c.profile
  const id      = req.id
  const isInvitation = req.type === 'invitation'

  const hasId = profile?.id_number

  return (
    <SlidePanel
      title={c.name}
      subtitle={isInvitation ? 'You invited this civilian' : 'Requested to join your shelter'}
      onClose={onClose}
      footer={
        <div className="flex gap-2 justify-end">
          {isInvitation ? (
            <Button size="sm" variant="secondary"
              loading={actioning === `cancel-${id}`} disabled={!!actioning}
              onClick={() => { onCancel(req); onClose() }}>
              <X size={13} /> Cancel invite
            </Button>
          ) : (
            <>
              <Button size="sm" variant="danger"
                loading={actioning === `reject-${id}`} disabled={!!actioning}
                onClick={() => { onReject(req); onClose() }}>
                <X size={13} /> Reject
              </Button>
              <Button size="sm"
                loading={actioning === `accept-${id}`} disabled={!!actioning || !hasId}
                onClick={() => { onAccept(req); onClose() }}
                title={!hasId ? 'Civilian must have ID on file to be accepted' : undefined}>
                <Check size={13} /> Accept
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-5">

        {/* ID warning */}
        {!hasId && (
          <div className="flex gap-2.5 text-sm text-warning bg-warning-surface border border-warning/20 rounded-xl px-4 py-3">
            <IdCard size={15} className="shrink-0 mt-0.5" />
            <span>This civilian has not uploaded their ID yet. They must complete their profile before being accepted into a shelter.</span>
          </div>
        )}

        {/* Basic */}
        <div className="bg-surface rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider">Contact</p>
          <Row label="Email"  value={c.email} />
          <Row label="Phone"  value={c.phone} />
          <Row label="Status" value={<Badge variant={c.is_active ? 'success' : 'danger'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>} />
        </div>

        {/* Profile */}
        {profile ? (
          <div className="bg-surface rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider">Profile</p>
            <Row label="Date of birth"    value={profile.date_of_birth} />
            <Row label="Gender"           value={profile.gender} />
            <Row label="Current location" value={profile.current_location} />
            {profile.notes && <Row label="Notes" value={profile.notes} />}
          </div>
        ) : null}

        {/* ID */}
        <div className="bg-surface rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider">Identification</p>
          <Row label="ID type"   value={ID_TYPE_LABEL[profile?.id_type] ?? profile?.id_type} />
          <Row label="ID number" value={profile?.id_number} />
          <Row label="Document"  value={
            profile?.has_id_document
              ? <Badge variant="success">Uploaded</Badge>
              : <Badge variant="danger">Not uploaded</Badge>
          } />
        </div>

      </div>
    </SlidePanel>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-text-muted shrink-0">{label}</span>
      <span className="text-xs font-medium text-text text-right">{value ?? '—'}</span>
    </div>
  )
}

// ─── Single item card ─────────────────────────────────────────────────────────
function RequestItem({ req, actioning, onAccept, onReject, onCancel, onView }) {
  const isInvitation = req.type === 'invitation'
  const id           = req.id
  const hasId        = req.civilian.profile?.id_number

  return (
    <div className="flex items-center gap-4 bg-background border border-border rounded-2xl p-4 hover:border-border-2 transition-colors">

      <div className="w-10 h-10 rounded-full bg-warning-surface flex items-center justify-center text-sm font-bold text-warning shrink-0">
        {req.civilian.name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">{req.civilian.name}</p>
        <p className="text-xs text-text-muted truncate">{req.civilian.phone ?? req.civilian.email}</p>
        {!hasId && (
          <p className="text-[11px] text-warning mt-0.5">⚠ No ID on file</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="secondary" onClick={() => onView(req)} title="Review civilian details">
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

// ─── Section block ────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, subtitle, items, actioning, onAccept, onReject, onCancel, onView }) {
  if (items.length === 0) return null
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={15} className="text-text-subtle" />
        <h2 className="text-sm font-semibold font-heading text-text">{title}</h2>
        <span className="text-[10px] font-bold bg-surface-2 text-text-muted px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      {subtitle && <p className="text-xs text-text-muted mb-3 -mt-2">{subtitle}</p>}
      <div className="space-y-3">
        {items.map(req => (
          <RequestItem key={req.id} req={req} actioning={actioning}
            onAccept={onAccept} onReject={onReject} onCancel={onCancel} onView={onView} />
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RequestsPage() {
  const setPendingCount = useUiStore((s) => s.setShelterPendingCount)

  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [actioning, setActioning] = useState(null)
  const [viewReq,   setViewReq]   = useState(null)

  useEffect(() => {
    getRequests()
      .then(res => {
        const data = res.data ?? []
        setItems(data)
        setPendingCount(data.length)   // keep sidebar badge in sync
      })
      .catch(err => setLoadError(err.message ?? 'Failed to load requests.'))
      .finally(() => setLoading(false))
  }, [setPendingCount])

  function remove(id) {
    setItems(prev => {
      const next = prev.filter(r => r.id !== id)
      setPendingCount(next.length)   // update badge immediately on action
      return next
    })
  }

  async function handleAccept(req) {
    setActioning(`accept-${req.id}`)
    try { await acceptRequest(req.id); remove(req.id) }
    catch (err) { setLoadError(err.message ?? 'Failed to accept.') }
    finally { setActioning(null) }
  }

  async function handleReject(req) {
    setActioning(`reject-${req.id}`)
    try { await rejectRequest(req.id); remove(req.id) }
    catch (err) { setLoadError(err.message ?? 'Failed to reject.') }
    finally { setActioning(null) }
  }

  async function handleCancel(req) {
    setActioning(`cancel-${req.id}`)
    try { await cancelInvitation(req.id); remove(req.id) }
    catch (err) { setLoadError(err.message ?? 'Failed to cancel.') }
    finally { setActioning(null) }
  }

  const incoming    = items.filter(r => r.type === 'request')
  const invitations = items.filter(r => r.type === 'invitation')

  return (
    <ShelterLayout title="Requests" subtitle="Manage incoming requests and sent invitations">

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
          <p className="text-sm font-medium text-text mb-1">No pending items</p>
          <p className="text-xs text-text-muted max-w-xs">
            Civilians who request to join will appear here, along with invitations you've sent that are awaiting a response.
          </p>
        </div>
      ) : (
        <>
          <Section icon={Inbox} title="Join Requests"
            subtitle="Civilians requesting to join — click Review to see their ID and details before accepting."
            items={incoming} actioning={actioning}
            onAccept={handleAccept} onReject={handleReject} onCancel={handleCancel} onView={setViewReq} />

          <Section icon={Send} title="Sent Invitations"
            subtitle="Invitations awaiting response — click Review to view civilian details or cancel."
            items={invitations} actioning={actioning}
            onAccept={handleAccept} onReject={handleReject} onCancel={handleCancel} onView={setViewReq} />
        </>
      )}
      {viewReq && (
        <CivilianPanel req={viewReq} onClose={() => setViewReq(null)}
          actioning={actioning}
          onAccept={handleAccept} onReject={handleReject} onCancel={handleCancel} />
      )}

    </ShelterLayout>
  )
}
