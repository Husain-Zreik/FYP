import { useEffect, useState } from 'react'
import { AlertCircle, Save, CheckCircle } from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import { Button, Toggle, Loader } from '../components/ui'
import { getCapabilities, updateCapabilities } from '../api/capabilities'

const ROLE_META = {
  government_staff: {
    label: 'Government Staff',
    description: 'Employees of the government ministry — limited read/operational access.',
  },
  shelter_staff: {
    label: 'Shelter Staff',
    description: 'Field workers at a specific shelter — day-to-day civilian management.',
  },
}

function RoleSection({ roleKey, capabilities, onChange, saving, saved, onSave }) {
  const meta    = ROLE_META[roleKey]
  const groups  = [...new Set(capabilities.map(c => c.group))]

  return (
    <div className="bg-background rounded-2xl border border-border overflow-hidden">
      {/* Role header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-border">
        <div>
          <h2 className="text-base font-semibold font-heading text-text">{meta.label}</h2>
          <p className="text-xs text-text-muted mt-0.5">{meta.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saved && <span className="text-xs text-success font-medium flex items-center gap-1"><CheckCircle size={13} />Saved</span>}
          <Button size="sm" loading={saving} onClick={onSave}>
            <Save size={13} /> Save changes
          </Button>
        </div>
      </div>

      {/* Capability groups */}
      <div className="divide-y divide-border">
        {groups.map(group => {
          const groupCaps = capabilities.filter(c => c.group === group)
          return (
            <div key={group} className="px-6 py-4">
              <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-widest mb-3">
                {group}
              </p>
              <div className="space-y-3">
                {groupCaps.map(cap => (
                  <Toggle
                    key={cap.key}
                    label={cap.label}
                    value={cap.enabled}
                    onChange={v => onChange(cap.key, v)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function RoleCapabilitiesPage() {
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [saving,    setSaving]    = useState({})  // { role: bool }
  const [saved,     setSaved]     = useState({})  // { role: bool }
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    getCapabilities()
      .then(res => setData(res.data))
      .catch(err => setLoadError(err.message ?? 'Failed to load capabilities.'))
      .finally(() => setLoading(false))
  }, [])

  function toggle(role, key, value) {
    setData(prev => ({
      ...prev,
      [role]: prev[role].map(c => c.key === key ? { ...c, enabled: value } : c),
    }))
  }

  async function save(role) {
    setSaving(p => ({ ...p, [role]: true }))
    setSaveError(null)
    try {
      await updateCapabilities(role, data[role].map(c => ({ key: c.key, enabled: c.enabled })))
      setSaved(p => ({ ...p, [role]: true }))
      setTimeout(() => setSaved(p => ({ ...p, [role]: false })), 2500)
    } catch (err) {
      setSaveError(err.message ?? 'Failed to save.')
    } finally {
      setSaving(p => ({ ...p, [role]: false }))
    }
  }

  return (
    <DashboardLayout
      title="Role Permissions"
      subtitle="Configure which actions government staff and shelter staff are allowed to perform."
    >

      {loadError && (
        <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-6">
          <AlertCircle size={15} className="shrink-0 mt-0.5" /> {loadError}
        </div>
      )}

      {saveError && (
        <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3 mb-6">
          <AlertCircle size={15} className="shrink-0 mt-0.5" /> {saveError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center" style={{ minHeight: 'clamp(320px, 55vh, 520px)' }}>
          <Loader size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {data && Object.keys(data).map(role => (
            <RoleSection
              key={role}
              roleKey={role}
              capabilities={data[role]}
              onChange={(key, val) => toggle(role, key, val)}
              saving={saving[role] ?? false}
              saved={saved[role] ?? false}
              onSave={() => save(role)}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
