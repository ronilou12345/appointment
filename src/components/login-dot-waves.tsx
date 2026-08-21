export function LoginDotWaves() {
  const cols = 42
  const rows = 24

  return (
    <div className="login-wave-scene pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className="login-wave-field"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: cols * rows }, (_, index) => {
          const col = index % cols
          const row = Math.floor(index / cols)
          const delay = Math.sin(col * 0.42) * 0.28 + Math.cos(row * 0.38) * 0.22 + col * 0.035 + row * 0.02

          return (
            <span
              key={index}
              className="login-wave-dot"
              style={{ animationDelay: `${delay.toFixed(3)}s` }}
            />
          )
        })}
      </div>
    </div>
  )
}
