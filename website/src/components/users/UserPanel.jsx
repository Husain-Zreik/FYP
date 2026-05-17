import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Input, Select, Toggle, SlidePanel, Button } from '../ui'
import { getShelters } from '../../api/shelters'

const ROLE_LABELS = {
  government_admin: 'Government Admin',
  government_staff: 'Government Staff',
  shelter_admin:    'Shelter Admin',
  shelter_staff:    'Shelter Staff',
  civilian:         'Civilian',
}

// Roles that can be assigned to a shelter
const SHELTER_ROLES = ['shelter_admin', 'shelter_staff', 'civilian']

export default function UserPanel({ editingUser, availableRoles, showShelter, onSave, onClose }) {
  const isEditing = !!editingUser

  const [form, setForm] = useState({
    name:       editingUser?.name       ?? '',
    email:      editingUser?.email      ?? '',
    password:   '',
    phone:      editingUser?.phone      ?? '',
    role:       editingUser?.role       ?? availableRoles[0] ?? '',
    shelter_id: editingUser?.shelter_id ?? '',
    is_active:  editingUser?.is_active  ?? true,
  })

  const [shelters,    setShelters]    = useState([])
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const needsShelter = showShelter && SHELTER_ROLES.includes(form.role)

  useEffect(() => {
    if (showShelter) {
      getShelters().then(res => setShelters(res.data ?? [])).catch(() => {})
    }
  }, [showShelter])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setFieldErrors(prev => ({ ...prev, [field]: null }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setFieldErrors({})
    try {
      const payload = { ...form }
      if (!payload.password)   delete payload.password
      if (!payload.shelter_id) delete payload.shelter_id
      await onSave(payload)
      onClose()
    } catch (err) {
      if (err.errors) setFieldErrors(err.errors)
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const footer = (
    <div className="flex gap-3 justify-end">
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button
        loading={saving}
        disabled={!form.name || !form.email}
        onClick={handleSave}>
        {isEditing ? 'Save changes' : 'Create user'}
      </Button>
    </div>
  )

  return (
    <SlidePanel
      title={isEditing ? 'Edit user' : 'New user'}
      subtitle={isEditing ? `Editing ${editingUser.name}` : 'Fill in the details below'}
      onClose={onClose}
      footer={footer}>

      <div className="space-y-4">
        {error && (
          <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <Input label="Full name" required
          value={form.name} onChange={v => set('name', v)}
          placeholder="e.g. Ahmad Khalil" error={fieldErrors.name} />

        <Input label="Email address" type="email" required
          value={form.email} onChange={v => set('email', v)}
          placeholder="user@example.com" error={fieldErrors.email} />

        <Input label="Password" type="password"
          value={form.password} onChange={v => set('password', v)}
          placeholder={isEditing ? '••••••••' : 'Min. 8 characters'}
          hint={isEditing ? 'Leave blank to keep current password' : undefined}
          error={fieldErrors.password} />

        <Input label="Phone" type="tel"
          value={form.phone} onChange={v => set('phone', v)}
          placeholder="+961 70 000 000" error={fieldErrors.phone} />

        {availableRoles.length > 1 && (
          <Select label="Role" required
            value={form.role} onChange={v => set('role', v)}
            options={availableRoles.map(r => ({ value: r, label: ROLE_LABELS[r] ?? r }))}
            error={fieldErrors.role} />
        )}

        {needsShelter && (
          <Select label="Shelter" required
            value={form.shelter_id} onChange={v => set('shelter_id', v)}
            placeholder="— Select shelter —"
            options={shelters.map(s => ({ value: String(s.id), label: s.name }))}
            error={fieldErrors.shelter_id} />
        )}

        <Toggle label="Active" description="Inactive users cannot sign in"
          value={form.is_active} onChange={v => set('is_active', v)} />
      </div>
    </SlidePanel>
  )
}
