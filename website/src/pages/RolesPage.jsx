import { useEffect, useState, useCallback } from 'react'
import { Plus, X, Trash2, Pencil, ShieldCheck, Lock, AlertCircle } from 'lucide-react'
import DashboardLayout from '../components/layouts/DashboardLayout'
import { useAuthStore } from '../store/authStore'
import { getRoles, createRole, updateRole, deleteRole, getPermissions } from '../api/roles'

// Group flat permission list by resource prefix (e.g. "users" from "users.view")
function groupByCategory(permissions) {
  return permissions.reduce((acc, p) => {
    const cat = p.split('.')[0]
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})
}

// ─── Permission checkbox panel ────────────────────────────────────────────────
function PermissionPanel({ allPermissions, selected, onChange }) {
  const grouped = groupByCategory(allPermissions)

  function togglePerm(perm) {
    const next = new Set(selected)
    next.has(perm) ? next.delete(perm) : next.add(perm)
    onChange(next)
  }

  function toggleCategory(perms) {
    const allOn = perms.every(p => selected.has(p))
    const next  = new Set(selected)
    perms.forEach(p => allOn ? next.delete(p) : next.add(p))
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([cat, perms]) => {
        const allOn  = perms.every(p => selected.has(p))
        const someOn = perms.some(p => selected.has(p))
        return (
          <div key={cat} className="rounded-xl border border-border overflow-hidden">
            <button type="button" onClick={() => toggleCategory(perms)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-surface hover:bg-surface-2 transition-colors">
              <span className="text-xs font-semibold text-text capitalize">{cat}</span>
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                allOn ? 'bg-secondary border-secondary' : someOn ? 'bg-secondary/40 border-secondary' : 'border-border-2 bg-background'
              }`}>
                {(allOn || someOn) && <div className="w-2 h-2 rounded-sm bg-white" />}
              </div>
            </button>
            <div className="divide-y divide-border">
              {perms.map(perm => (
                <label key={perm}
                  className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-surface transition-colors">
                  <span className="text-xs text-text-muted">{perm.split('.')[1]}</span>
                  <input type="checkbox" checked={selected.has(perm)} onChange={() => togglePerm(perm)}
                    className="accent-secondary w-3.5 h-3.5" />
                </label>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Slide-in form panel ──────────────────────────────────────────────────────
function RolePanel({ editingRole, allPermissions, isGlobal, onSave, onClose }) {
  const [name,    setName]    = useState(editingRole?.name ?? '')
  const [selected, setSelected] = useState(new Set(editingRole?.permissions ?? []))
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), permissions: [...selected] })
      // panel close is handled by the parent after successful save
    } catch (err) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-text/20 backdrop-blur-sm" onClick={onClose} />

      <div className="w-full max-w-md bg-background border-s border-border flex flex-col h-full shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold font-heading text-text">
              {editingRole ? 'Edit role' : 'New role'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {isGlobal ? 'Global — all shelters' : 'Custom — your shelter only'}
            </p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-text-subtle hover:text-text hover:bg-surface transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Intake Officer"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder-text-subtle bg-background focus:outline-none focus:border-secondary focus:ring-2 transition-all"
              style={{ '--tw-ring-color': 'rgba(124,58,237,0.15)' }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-text">Permissions</label>
              <span className="text-xs text-text-muted">{selected.size} selected</span>
            </div>
            <PermissionPanel
              allPermissions={allPermissions}
              selected={selected}
              onChange={setSelected}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3 justify-end shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
            {saving ? 'Saving…' : editingRole ? 'Save changes' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Role card ────────────────────────────────────────────────────────────────
const CAT_COLORS = {
  users:     'bg-blue-50 text-blue-600',
  shelters:  'bg-emerald-50 text-emerald-600',
  civilians: 'bg-orange-50 text-orange-600',
  roles:     'bg-violet-50 text-violet-600',
  reports:   'bg-amber-50 text-amber-600',
}

function RoleCard({ role, canEdit, onEdit, onDelete }) {
  const preview = (role.permissions ?? []).slice(0, 6)
  const extra   = (role.permissions_count ?? 0) - preview.length

  return (
    <div className="bg-background border border-border rounded-2xl p-5 flex flex-col gap-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            role.is_system ? 'bg-tertiary' : 'bg-secondary/20'
          }`}>
            {role.is_system
              ? <Lock size={14} className="text-text-muted" />
              : <ShieldCheck size={14} className="text-secondary" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text truncate capitalize">
              {(role.name ?? '').replace(/_/g, ' ')}
            </p>
            <p className="text-[11px] text-text-subtle">
              {role.permissions_count ?? 0} permission{(role.permissions_count ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {role.shelter_id === null && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-text-muted uppercase tracking-wide">
              System
            </span>
          )}
          {role.shelter_id !== null && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success-surface text-success uppercase tracking-wide">
              Custom
            </span>
          )}
          {canEdit && (
            <>
              <button onClick={() => onEdit(role)}
                className="p-1.5 rounded-lg text-text-subtle hover:text-secondary hover:bg-secondary/10 transition-colors">
                <Pencil size={12} />
              </button>
              <button onClick={() => onDelete(role)}
                className="p-1.5 rounded-lg text-text-subtle hover:text-danger hover:bg-danger-surface transition-colors">
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>

      {preview.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {preview.map(perm => (
            <span key={perm}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                CAT_COLORS[perm.split('.')[0]] ?? 'bg-surface-2 text-text-muted'
              }`}>
              {perm.split('.')[1]}
            </span>
          ))}
          {extra > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 text-text-muted">
              +{extra}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const user = useAuthStore(s => s.user)

  const isSuperAdmin   = user?.role === 'super_admin'
  const isShelterAdmin = user?.role === 'shelter_admin'
  const canCreate      = isSuperAdmin || isShelterAdmin

  const [roles,       setRoles]       = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [loadError,   setLoadError]   = useState(null)
  const [panel,       setPanel]       = useState(null)   // null | { editingRole?, isGlobal }
  const [delTarget,   setDelTarget]   = useState(null)

  useEffect(() => {
    Promise.all([getRoles(), getPermissions()])
      .then(([rolesRes, permsRes]) => {
        setRoles(rolesRes.data ?? [])
        setPermissions(permsRes.data ?? [])
      })
      .catch(err => setLoadError(err.message ?? 'Failed to load roles.'))
      .finally(() => setLoading(false))
  }, [])

  // Roles with null shelter_id are global; non-null are custom shelter roles
  const globalRoles = roles.filter(r => r.shelter_id === null)
  const customRoles = roles.filter(r => r.shelter_id !== null)

  // Super admin can edit ANY global role (including system ones).
  // Shelter admin can edit only their shelter's custom roles.
  const canEditRole = useCallback((role) => {
    if (role.shelter_id === null) return isSuperAdmin
    return isShelterAdmin
  }, [isSuperAdmin, isShelterAdmin])

  async function handleSave(formData) {
    if (panel?.editingRole) {
      const res = await updateRole(panel.editingRole.id, formData)
      setRoles(prev => prev.map(r => r.id === panel.editingRole.id ? res.data : r))
    } else {
      const res = await createRole(formData)
      setRoles(prev => [...prev, res.data])
    }
    // Close the panel here so both create and edit paths always close on success
    setPanel(null)
  }

  async function handleDelete(role) {
    await deleteRole(role.id)
    setRoles(prev => prev.filter(r => r.id !== role.id))
    setDelTarget(null)
  }

  return (
    <DashboardLayout title="Roles & Permissions">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <p className="text-sm text-text-muted max-w-lg">
          {isSuperAdmin
            ? 'Manage system roles and create new ones. Shelter admins can create custom roles for their shelter.'
            : 'View system roles (read-only) and manage your shelter\'s custom roles.'}
        </p>
        {canCreate && (
          <button onClick={() => setPanel({ isGlobal: isSuperAdmin })}
            className="shrink-0 flex items-center gap-2 px-4 py-2 ml-4 rounded-xl text-sm font-semibold text-white hover:scale-105 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
            <Plus size={14} /> New role
          </button>
        )}
      </div>

      {/* Load error */}
      {loadError && (
        <div className="flex gap-2.5 text-sm text-danger bg-danger-surface border border-danger/20 rounded-2xl px-5 py-4 mb-6">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-6 h-6 border-2 border-border border-t-secondary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">

          {/* Global Roles */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-semibold font-heading text-text">System Roles</h2>
              {!isSuperAdmin && (
                <span className="text-[10px] bg-surface-2 text-text-subtle px-2 py-0.5 rounded-full">
                  Read-only
                </span>
              )}
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {globalRoles.map(role => (
                <RoleCard key={role.id} role={role}
                  canEdit={canEditRole(role)}
                  onEdit={r => setPanel({ editingRole: r, isGlobal: true })}
                  onDelete={setDelTarget} />
              ))}
            </div>
          </section>

          {/* Custom Roles — shelter admin always sees this; super admin sees only if custom roles exist */}
          {(isShelterAdmin || (isSuperAdmin && customRoles.length > 0)) && (
            <section>
              <h2 className="text-sm font-semibold font-heading text-text mb-4">
                {isShelterAdmin ? "Your Shelter's Custom Roles" : 'Custom Shelter Roles'}
              </h2>
              {customRoles.length === 0 ? (
                <div className="border border-dashed border-border-2 rounded-2xl p-10 text-center">
                  <ShieldCheck size={22} className="text-text-subtle mx-auto mb-3" />
                  <p className="text-sm font-medium text-text mb-1">No custom roles yet</p>
                  <p className="text-xs text-text-muted mb-5">
                    Create roles tailored to your shelter's workflow.
                  </p>
                  <button onClick={() => setPanel({ isGlobal: false })}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
                    <Plus size={12} /> Create first role
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {customRoles.map(role => (
                    <RoleCard key={role.id} role={role}
                      canEdit={canEditRole(role)}
                      onEdit={r => setPanel({ editingRole: r, isGlobal: false })}
                      onDelete={setDelTarget} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Slide-in panel */}
      {panel && (
        <RolePanel
          editingRole={panel.editingRole}
          allPermissions={permissions}
          isGlobal={panel.isGlobal}
          onSave={handleSave}
          onClose={() => setPanel(null)}
        />
      )}

      {/* Delete confirmation */}
      {delTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-text/20 backdrop-blur-sm" onClick={() => setDelTarget(null)} />
          <div className="relative z-10 bg-background border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-text mb-2">Delete role?</h3>
            <p className="text-sm text-text-muted mb-6">
              <span className="font-semibold text-text capitalize">
                {(delTarget.name ?? '').replace(/_/g, ' ')}
              </span>{' '}
              will be removed from all users assigned to it.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDelTarget(null)}
                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(delTarget)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-danger text-white hover:bg-danger/90 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}
