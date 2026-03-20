import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

const APP_URL = 'https://battleofthebooks.netlify.app'

export function QRModal({ onClose }) {
  const [dataUrl, setDataUrl] = useState(null)

  useEffect(() => {
    QRCode.toDataURL(APP_URL, { width: 240, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
      .then(setDataUrl)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="card p-6 flex flex-col items-center gap-4 max-w-xs w-full"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-bold text-base" style={{ color: 'var(--color-text)' }}>Join on Another Device</h3>
        {dataUrl
          ? <img src={dataUrl} alt="QR code for app" className="rounded-lg" style={{ width: 200, height: 200 }} />
          : <div className="w-[200px] h-[200px] bg-subtle rounded-lg animate-pulse" />
        }
        <p className="text-xs text-center text-muted">
          Scan to open the app, then sign in with the same Google account.
        </p>
        <button className="btn btn-ghost text-sm w-full" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
