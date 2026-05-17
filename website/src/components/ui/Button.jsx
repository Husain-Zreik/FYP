/*
 * Unified Button component — use everywhere instead of raw <button>.
 *
 * variant:
 *   primary      — gradient indigo/violet, white text (main actions)
 *   secondary    — bordered, muted text (secondary actions)
 *   danger       — red, white text (destructive actions)
 *   ghost        — no background, muted text (tertiary actions)
 *   icon-edit    — icon-only, turns secondary on hover
 *   icon-delete  — icon-only, turns danger on hover
 *   icon-ghost   — icon-only, neutral hover
 *
 * size (ignored for icon variants):
 *   sm | md (default) | lg | xl
 */

const VARIANT_CLASSES = {
  primary:      'text-white font-semibold hover:scale-[1.02] active:scale-[0.98]',
  secondary:    'bg-background border border-border text-text-muted font-medium hover:text-text hover:border-border-2 hover:bg-surface',
  danger:       'bg-danger text-white font-semibold hover:opacity-90',
  ghost:        'text-text-muted font-medium hover:text-text hover:bg-surface',
  'icon-edit':  'text-text-subtle hover:text-secondary hover:bg-secondary/10 rounded-lg',
  'icon-delete':'text-text-subtle hover:text-danger  hover:bg-danger-surface  rounded-lg',
  'icon-ghost': 'text-text-subtle hover:text-text    hover:bg-surface         rounded-lg',
}

const VARIANT_STYLE = {
  primary: {
    background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
    boxShadow:  '0 0 20px rgba(124,58,237,0.25)',
  },
}

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg  gap-1.5',
  md: 'px-4 py-2   text-sm rounded-xl  gap-2',
  lg: 'px-6 py-3   text-sm rounded-xl  gap-2',
  xl: 'px-7 py-3.5 text-sm rounded-xl  gap-2',
}

export default function Button({
  variant   = 'primary',
  size      = 'md',
  type      = 'button',
  loading   = false,
  disabled  = false,
  onClick,
  children,
  className = '',
  title,
}) {
  const isIcon = variant.startsWith('icon-')

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      style={VARIANT_STYLE[variant]}
      className={`
        inline-flex items-center justify-center transition-all duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isIcon ? 'p-1.5' : SIZE_CLASSES[size] ?? SIZE_CLASSES.md}
        ${VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary}
        ${className}
      `}>
      {loading
        ? <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        : children}
    </button>
  )
}
