const MAX_HEIGHT = 40 // px

export function AudioVisualizer({ bars }) {
  const isActive = bars && bars.some((v) => v > 0.01)

  return (
    <div className="flex items-end gap-[2px] h-[40px] px-1">
      {Array.from({ length: 30 }, (_, i) => {
        const val = bars?.[i] || 0
        const height = Math.max(3, val * MAX_HEIGHT)
        return (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all duration-75"
            style={{
              height: `${height}px`,
              background: isActive
                ? `linear-gradient(to top, #5b4fe8, #34d399)`
                : 'rgba(255,255,255,0.15)',
              minWidth: '2px',
            }}
          />
        )
      })}
    </div>
  )
}
