import Button from './Button'
import ModalOverlay from './ModalOverlay'

export default function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel   = 'Delete',
  confirmVariant = 'danger',
  loading        = false,
}) {
  return (
    <ModalOverlay onClose={onCancel} closeOnBackdrop={!loading}>
      <div className="relative z-10 bg-background border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-base font-semibold font-heading text-text mb-2">{title}</h3>
        <div className="text-sm text-text-muted mb-6">{message}</div>

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant={confirmVariant} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  )
}
