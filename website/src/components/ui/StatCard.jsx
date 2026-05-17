export default function StatCard({ label, value, sub, icon: Icon, color, bg, iconColor, iconBg }) {
  const boxBg   = bg    ?? iconBg    ?? 'bg-surface-2'
  const iconCls = color ?? iconColor ?? 'text-text-muted'

  return (
    <div className="bg-background rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${boxBg}`}>
          <Icon size={15} className={iconCls} />
        </div>
      </div>
      <p className="text-2xl font-bold font-heading text-text mb-0.5">{value ?? 0}</p>
      {sub && <p className="text-[11px] text-text-subtle mt-0.5">{sub}</p>}
    </div>
  )
}
