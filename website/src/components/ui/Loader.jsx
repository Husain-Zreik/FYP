/*
 * Global page loader — used in Table and any full-page loading state.
 * size: 'sm' | 'md' (default) | 'lg'
 */
const SIZE = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-9 h-9 border-[3px]',
}

export default function Loader({ size = 'md', className = '' }) {
  return (
    <div className={`${SIZE[size] ?? SIZE.md} border-border border-t-secondary rounded-full animate-spin ${className}`} />
  )
}
