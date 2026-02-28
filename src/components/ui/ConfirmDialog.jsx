export function ConfirmDialog({ message = 'Are you sure?', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative card max-w-sm w-full p-6 space-y-4">
        <p className="text-center font-medium" style={{ color: 'var(--color-text)' }}>{message}</p>
        <div className="flex gap-3 justify-center">
          <button className="btn btn-ghost px-6" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger px-6" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )
}
