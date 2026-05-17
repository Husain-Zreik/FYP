import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Save, AlertCircle } from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import CivilianDetailContent from '../components/civilians/CivilianDetailContent'
import { Button, Badge, Loader } from '../components/ui'
import { getUser, updateUser } from '../api/users'

export default function CivilianDetailPage() {
  const { id } = useParams()

  const [civilian,  setCivilian]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState(null)
  const [saved,     setSaved]     = useState(false)
  const [fieldErrs, setFieldErrs] = useState({})

  const [basic,   setBasic]   = useState({ name: '', email: '', phone: '', is_active: true })
  const [profile, setProfile] = useState({ date_of_birth: '', gender: '', current_location: '', notes: '', id_type: '', id_number: '', housing_status: 'seeking' })
  const [housing, setHousing] = useState(null)

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
          id_type:          u.civilian_profile?.id_type          ?? '',
          id_number:        u.civilian_profile?.id_number        ?? '',
          housing_status:   u.civilian_profile?.housing_status   ?? 'seeking',
        })
        setHousing(u.private_housing ?? null)
      })
      .catch(err => setError(err.message ?? 'Failed to load.'))
      .finally(() => setLoading(false))
  }, [id])

  function setB(f, v) { setBasic(p  => ({ ...p, [f]: v })); setFieldErrs(p => ({ ...p, [f]: null })) }
  function setP(f, v) { setProfile(p => ({ ...p, [f]: v })) }

  async function handleSave() {
    setSaving(true); setError(null); setFieldErrs({}); setSaved(false)
    try {
      const payload = { ...basic, profile, private_housing: profile.housing_status === 'private' ? housing : null }
      const res = await updateUser(id, payload)
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
      subtitle={`Civilian${civilian.shelter ? ` · ${civilian.shelter.name}` : ''}`}
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
      <CivilianDetailContent
        civilian={civilian} basic={basic} setB={setB}
        profile={profile} setP={setP}
        housing={housing} setH={setHousing}
        fieldErrs={fieldErrs}
      />
    </DashboardLayout>
  )
}
