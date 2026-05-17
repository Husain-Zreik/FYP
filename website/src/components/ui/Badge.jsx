const VARIANTS = {
  success: 'bg-success-surface text-success',
  danger:  'bg-danger-surface text-danger',
  warning: 'bg-warning-surface text-warning',
  info:    'bg-secondary/10 text-secondary',
  muted:   'bg-surface-2 text-text-muted',
  purple:  'bg-tertiary text-tertiary-foreground',
  primary: 'bg-primary/10 text-primary',
}

export default function Badge({ variant = 'muted', children, className = '' }) {
  return (
    <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full
      ${VARIANTS[variant] ?? VARIANTS.muted} ${className}`}>
      {children}
    </span>
  )
}
