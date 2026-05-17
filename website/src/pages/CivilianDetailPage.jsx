import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Save, AlertCircle } from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import { Button, Input, Select, Toggle, Badge, Loader } from '../components/ui'
import { getUser, updateUser } from '../api/users'

const GENDER_OPTIONS = [
  { value: '',       label: '— Select —' },
  { value: 'male',   label: 'Male'       },
  { value: 'female', label: 'Female'     },
]

export default function CivilianDetailPage() {
  const { id } = useParams()

  const [civilian,  setCivilian]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState(null)
  const [saved,     setSaved]     = useState(false)
  const [fieldErrs, setFieldErrs] = useState({})

  const [basic,   setBasic]   = useState({ name: '', email: '', phone: '', is_active: true })
  const [profile, setProfile] = useState({ date_of_birth: '', gender: '', current_location: '', notes: '' })

  useEffect(() => {
    getUser(id)
      .then(res => {
        const u = res.data
        setCivilian(u)
        setBasic({ name: u.name ?? '', email: u.email ?? '', phone: u.phone ?? '', is_active: u.is_active ?? true })
        setProfile({
          date_of_birth:    u.civilian_profile?.date_of_birth    ?? '',
          gender:           u.civilian_profile?.gender           ?? '',
          current_location: u.civilian_profile?.current_location ?? '',
          notes:            u.civilian_profile?.notes            ?? '',
        })
      })
      .catch(err => setError(err.message ?? 'Failed to load civilian.'))
      .finally(() => setLoading(false))
  }, [id])

  function setB(f, v) { setBasic(p  => ({ ...p, [f]: v })); setFieldErrs(p => ({ ...p, [f]: null })) }
  function setP(f, v) { setProfile(p => ({ ...p, [f]: v })) }

  async function handleSave() {
    setSaving(true); setError(null); setFieldErrs({}); setSaved(false)
    try {
      const res = await updateUser(id, { ...basic, profile })
      setCivilian(res.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      if (err.errors) setFieldErrs(err.errors)
      setError(err.message ?? 'Failed to save.')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <DashboardLayout title="Civilian" back="/civilians">
      <div className="flex items-center justify-center" style={{ minHeight: 'clamp(320px, 55vh, 520px)' }}>
        <Loader size="lg" />
      </div>
    </DashboardLayout>
  )

  if (!civilian) return (
    <DashboardLayout title="Civilian" back="/civilians">
      <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
        <AlertCircle size={15} className="shrink-0 mt-0.5" />{error ?? 'Not found.'}
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout
      title={civilian.name}
      subtitle={`Civilian${civilian.shelter ? ` · ${civilian.shelter.name}` : ' · Unassigned'}`}
      back="/civilians"
      badge={<Badge variant={civilian.is_active ? 'success' : 'danger'}>{civilian.is_active ? 'Active' : 'Inactive'}</Badge>}
      actions={
        <>
          {saved && <span className="text-xs text-success font-medium">Saved</span>}
          <Button loading={saving} onClick={handleSave}><Save size={14} /> Save</Button>
        </>
      }
    >

      {error && (
        <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-background rounded-2xl border border-border p-6">
          <h2 className="text-sm font-semibold font-heading text-text mb-5">Basic information</h2>
          <div className="space-y-4">
            <Input label="Full name" required value={basic.name} onChange={v => setB('name', v)} placeholder="Full name" error={fieldErrs.name} />
            <Input label="Email address" type="email" required value={basic.email} onChange={v => setB('email', v)} placeholder="email@example.com" error={fieldErrs.email} />
            <Input label="Phone" type="tel" value={basic.phone} onChange={v => setB('phone', v)} placeholder="+961 70 000 000" />
            <Toggle label="Account active" description="Inactive civilians cannot use the mobile app" value={basic.is_active} onChange={v => setB('is_active', v)} />
          </div>
        </div>

        <div className="bg-background rounded-2xl border border-border p-6">
          <h2 className="text-sm font-semibold font-heading text-text mb-5">Profile details</h2>
          <div className="space-y-4">
            <Input label="Date of birth" type="date" value={profile.date_of_birth} onChange={v => setP('date_of_birth', v)} />
            <Select label="Gender" value={profile.gender} onChange={v => setP('gender', v)} options={GENDER_OPTIONS} />
            <Input label="Current location" value={profile.current_location} onChange={v => setP('current_location', v)} placeholder="City, district or address" />
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Notes</label>
              <textarea rows={4} value={profile.notes} onChange={e => setP('notes', e.target.value)}
                placeholder="Additional notes…"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-background placeholder-text-subtle focus:outline-none focus:border-secondary hover:border-border-2 transition-all resize-none" />
            </div>
          </div>
        </div>

        <div className="bg-background rounded-2xl border border-border p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold font-heading text-text mb-4">Shelter & account</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider mb-1">Assigned shelter</p>
              <p className="text-sm font-medium text-text">{civilian.shelter?.name ?? 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider mb-1">Account ID</p>
              <p className="text-sm font-mono text-text-muted">#{civilian.id}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
