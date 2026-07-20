import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/*
 * Shared shell for all centered dialogs.
 * Renders into a portal on <body> so the fixed backdrop sits above the
 * scrolling layout (no backdrop-blur shimmer, no scroll bleed-through),
 * locks page scroll, and closes on Escape.
 *
 * Props:
 *   onClose:          () => void
 *   closeOnBackdrop?: boolean  – allow backdrop/Escape to close (default true)
 *   children:         the dialog itself (positioned above the backdrop)
 */
export default function ModalOverlay({ onClose, closeOnBackdrop = true, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape' && closeOnBackdrop) onClose?.()
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose, closeOnBackdrop])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-text/20 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      {children}
    </div>,
    document.body,
  )
}
