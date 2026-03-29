import { useEffect, useRef } from 'react'

export function ConfirmDialog({ message = 'Are you sure?', onConfirm, onCancel }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    // Focus Cancel on open
    const buttons = dialogRef.current?.querySelectorAll('button')
    buttons?.[0]?.focus()

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel()
        return
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll('button')
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div ref={dialogRef} className="relative card max-w-sm w-full p-6 space-y-4">
        <p className="text-center font-medium" style={{ color: 'var(--color-text)' }}>{message}</p>
        <div className="flex gap-3 justify-center">
          <button className="btn btn-ghost px-6" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger px-6" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )
}
