import { useRef } from 'react'

export function RippleButton({ className = '', onClick, disabled, children, type = 'button' }) {
  const btnRef = useRef(null)

  const handleClick = (e) => {
    if (disabled) return
    const btn = btnRef.current
    if (!btn) return

    const rect = btn.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const size = Math.max(rect.width, rect.height) * 2

    const ripple = document.createElement('span')
    ripple.className = 'ripple'
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x - size / 2}px;top:${y - size / 2}px`
    btn.appendChild(ripple)

    ripple.addEventListener('animationend', () => ripple.remove())

    onClick?.(e)
  }

  return (
    <button
      ref={btnRef}
      type={type}
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
