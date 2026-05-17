import { useRef, useState, useEffect } from 'react'
import { UploadCloud, FileImage, AlertCircle, KeyRound, Clock, Send, Inbox } from 'lucide-react'
import { Button, Input, Select, Toggle, Badge, SlidePanel } from '../ui'
import { uploadIdDocument, updateUser } from '../../api/users'
import client from '../../api/client'

const TYPE_LABEL = { invitation: 'Invited by shelter', request: 'Requested to join' }
const TYPE_BADGE = { invitation: 'info', request: 'warning' }

// ─── Change Password Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ userId, onClose }) {
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState(null)
  const [success,   setSuccess]   = useState(false)

  async function handleSave() {
    if (!password) { setError('Password is required.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setSaving(true); setError(null)
    try {
      await updateUser(userId, { password })
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (err) {
      setError(err.message ?? 'Failed to change password.')
    } finally { setSaving(false) }
  }

  return (
    <SlidePanel
      title="Change password"
      subtitle="Set a new password for this civilian"
      onClose={onClose}
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>Update password</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {success && <div className="text-sm text-success bg-success-surface border border-success/20 rounded-xl px-4 py-3">Password updated successfully.</div>}
        {error   && <div className="text-sm text-danger  bg-danger-surface  border border-danger/20  rounded-xl px-4 py-3">{error}</div>}
        <Input label="New password"     type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" />
        <Input label="Confirm password" type="password" value={confirm}  onChange={setConfirm}  placeholder="Repeat new password" />
      </div>
    </SlidePanel>
  )
}

// ─── Active Requests Section ──────────────────────────────────────────────────
function ActiveRequests({ userId }) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get(`/civilians/${userId}/requests`)
      .then(res => setItems(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return null
  if (items.length === 0) return null

  return (
    <div className="bg-background rounded-2xl border border-border p-6 lg:col-span-2">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={14} className="text-text-subtle" />
        <h2 className="text-sm font-semibold font-heading text-text">Active Requests & Invitations</h2>
        <span className="text-[10px] font-bold bg-warning-surface text-warning px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map(r => (
          <div key={r.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
            {r.type === 'invitation' ? <Send size={14} className="text-secondary shrink-0" /> : <Inbox size={14} className="text-warning shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">{r.shelter.name}</p>
              <p className="text-xs text-text-muted">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
            <Badge variant={TYPE_BADGE[r.type]}>{TYPE_LABEL[r.type]}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

const GENDER_OPTS = [
  { value: '',       label: '— Select —'  },
  { value: 'male',   label: 'Male'        },
  { value: 'female', label: 'Female'      },
]

const ID_TYPE_OPTS = [
  { value: '',            label: '— Select —'      },
  { value: 'national_id', label: 'National ID'     },
  { value: 'passport',    label: 'Passport'        },
  { value: 'residency',   label: 'Residency Card'  },
]

const PROP_TYPE_OPTS = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house',     label: 'House'     },
  { value: 'room',      label: 'Room'      },
  { value: 'other',     label: 'Other'     },
]

const HOUSING_STATUS_OPTS = [
  { value: 'seeking', label: 'Seeking shelter' },
  { value: 'private', label: 'Private accommodation (rented)' },
]

// ─── ID Document Upload ───────────────────────────────────────────────────────
function IdDocumentSection({ userId, currentUrl, onUploaded }) {
  const inputRef    = useRef()
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState(null)
  const [preview,   setPreview]   = useState(currentUrl)

  async function handleFile(file) {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const res = await uploadIdDocument(userId, file)
      setPreview(res.data.url)
      onUploaded?.(res.data.url)
    } catch (err) {
      setError(err.message ?? 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-text mb-2">ID Document</label>

      {error && (
        <div className="flex gap-2 text-xs text-danger bg-danger-surface rounded-lg px-3 py-2 mb-3">
          <AlertCircle size={12} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-border mb-2">
          {preview.endsWith('.pdf') ? (
            <div className="flex items-center gap-2 p-4 bg-surface text-sm text-text-muted">
              <FileImage size={18} className="text-secondary" />
              <a href={preview} target="_blank" rel="noreferrer" className="text-secondary hover:underline">
                View uploaded PDF
              </a>
            </div>
          ) : (
            <img src={preview} alt="ID document"
              className="w-full max-h-48 object-contain bg-surface" />
          )}
        </div>
      ) : (
        <div className="border border-dashed border-border-2 rounded-xl p-6 flex flex-col items-center gap-2 text-center mb-2 bg-surface">
          <UploadCloud size={22} className="text-text-subtle" />
          <p className="text-xs text-text-muted">No document uploaded yet</p>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden"
        onChange={e => handleFile(e.target.files[0])} />

      <Button size="sm" variant="secondary" loading={uploading}
        onClick={() => inputRef.current.click()}>
        <UploadCloud size={13} /> {preview ? 'Replace document' : 'Upload document'}
      </Button>
    </div>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────
export default function CivilianDetailContent({ civilian, basic, setB, profile, setP, housing, setH, fieldErrs }) {
  const [showPwModal, setShowPwModal] = useState(false)
  const housingStatus = profile.housing_status ?? 'seeking'

  return (
    <div className="grid lg:grid-cols-2 gap-5">

      {/* Basic info */}
      <div className="bg-background rounded-2xl border border-border p-6">
        <h2 className="text-sm font-semibold font-heading text-text mb-5">Basic information</h2>
        <div className="space-y-4">
          <Input label="Full name" required value={basic.name} onChange={v => setB('name', v)} error={fieldErrs?.name} />
          <Input label="Email" type="email" required value={basic.email} onChange={v => setB('email', v)} error={fieldErrs?.email} />
          <Input label="Phone" type="tel" value={basic.phone} onChange={v => setB('phone', v)} />
          <Toggle label="Account active" description="Inactive civilians cannot use the mobile app"
            value={basic.is_active} onChange={v => setB('is_active', v)} />
        </div>
      </div>

      {/* Profile */}
      <div className="bg-background rounded-2xl border border-border p-6">
        <h2 className="text-sm font-semibold font-heading text-text mb-5">Profile details</h2>
        <div className="space-y-4">
          <Input label="Date of birth" type="date" value={profile.date_of_birth} onChange={v => setP('date_of_birth', v)} />
          <Select label="Gender" value={profile.gender} onChange={v => setP('gender', v)} options={GENDER_OPTS} />
          <Input label="Current location" value={profile.current_location} onChange={v => setP('current_location', v)} placeholder="City, district or address" />
          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">Notes</label>
            <textarea rows={3} value={profile.notes} onChange={e => setP('notes', e.target.value)}
              placeholder="Additional notes…"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all resize-none" />
          </div>
        </div>
      </div>

      {/* Identification */}
      <div className="bg-background rounded-2xl border border-border p-6">
        <h2 className="text-sm font-semibold font-heading text-text mb-5">Identification</h2>
        <div className="space-y-4">
          <Select label="ID type" value={profile.id_type} onChange={v => setP('id_type', v)} options={ID_TYPE_OPTS} />
          <Input label="ID number" value={profile.id_number} onChange={v => setP('id_number', v)} placeholder="e.g. 12345678" />
          <IdDocumentSection
            userId={civilian.id}
            currentUrl={civilian.civilian_profile?.id_document_url ?? null}
            onUploaded={() => {}}
          />
        </div>
      </div>

      {/* Housing status */}
      <div className="bg-background rounded-2xl border border-border p-6">
        <h2 className="text-sm font-semibold font-heading text-text mb-5">Housing status</h2>
        <div className="space-y-4">
          <Select label="Current situation" value={housingStatus}
            onChange={v => {
              setP('housing_status', v)
              if (v !== 'private') setH(null) // clear private housing if switching away
            }}
            options={HOUSING_STATUS_OPTS} />

          {civilian.shelter && (
            <div className="flex items-center gap-2 bg-surface rounded-xl px-4 py-3">
              <Badge variant="success">{civilian.shelter.name}</Badge>
              <span className="text-xs text-text-muted">Currently assigned to this shelter</span>
            </div>
          )}
        </div>
      </div>

      {/* Private housing details */}
      {housingStatus === 'private' && (
        <div className="bg-background rounded-2xl border border-border p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold font-heading text-text mb-5">
            Private accommodation details
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Property type" value={housing?.property_type ?? 'apartment'}
              onChange={v => setH(prev => ({ ...(prev ?? {}), property_type: v }))}
              options={PROP_TYPE_OPTS} />

            <Input label="Address" value={housing?.address ?? ''} required
              onChange={v => setH(prev => ({ ...(prev ?? {}), address: v }))}
              placeholder="Street, building, floor" />

            <Input label="Governorate" value={housing?.governorate ?? ''}
              onChange={v => setH(prev => ({ ...(prev ?? {}), governorate: v }))}
              placeholder="e.g. Beirut" />

            <Input label="District" value={housing?.district ?? ''}
              onChange={v => setH(prev => ({ ...(prev ?? {}), district: v }))}
              placeholder="e.g. Hamra" />

            <Input label="Landlord name" value={housing?.landlord_name ?? ''} required
              onChange={v => setH(prev => ({ ...(prev ?? {}), landlord_name: v }))}
              placeholder="Full name of landlord" />

            <Input label="Landlord phone" type="tel" value={housing?.landlord_phone ?? ''}
              onChange={v => setH(prev => ({ ...(prev ?? {}), landlord_phone: v }))}
              placeholder="+961 70 000 000" />

            <Input label="Monthly rent (USD)" type="number" value={housing?.monthly_rent ?? ''}
              onChange={v => setH(prev => ({ ...(prev ?? {}), monthly_rent: v }))}
              placeholder="e.g. 400" />

            <Input label="Lease start date" type="date" value={housing?.lease_start_date ?? ''}
              onChange={v => setH(prev => ({ ...(prev ?? {}), lease_start_date: v }))} />

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-text mb-1.5">Notes</label>
              <textarea rows={2} value={housing?.notes ?? ''}
                onChange={e => setH(prev => ({ ...(prev ?? {}), notes: e.target.value }))}
                placeholder="Any additional details about the accommodation…"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all resize-none" />
            </div>
          </div>
        </div>
      )}

      {/* Active requests / invitations */}
      <ActiveRequests userId={civilian.id} />

      {/* Shelter & account meta */}
      <div className="bg-background rounded-2xl border border-border p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold font-heading text-text">Account</h2>
          <Button size="sm" variant="secondary" onClick={() => setShowPwModal(true)}>
            <KeyRound size={13} /> Change password
          </Button>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider mb-1">Assigned shelter</p>
            <p className="text-sm font-medium text-text">{civilian.shelter?.name ?? 'None'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider mb-1">Account ID</p>
            <p className="text-sm font-mono text-text-muted">#{civilian.id}</p>
          </div>
        </div>
      </div>

      {showPwModal && (
        <ChangePasswordModal userId={civilian.id} onClose={() => setShowPwModal(false)} />
      )}
    </div>
  )
}
