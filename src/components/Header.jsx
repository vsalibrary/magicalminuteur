import { AuthButton } from './AuthButton'

export function Header({ user, signIn, signOut, theme, toggleTheme, onAdmin }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 pb-3 border-b border-subtle bg-[#0c0c12]/80 backdrop-blur-md" style={{ borderColor: 'var(--color-border)', backgroundColor: 'color-mix(in srgb, var(--color-bg) 80%, transparent)', paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-bold text-sm md:text-xl font-display tracking-tight leading-tight" style={{ color: 'var(--color-text)' }}>
          <span className="sm:hidden">Minuteur</span>
          <span className="hidden sm:inline">Mr Mac's Magical Minuteur</span>
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleTheme}
          className="btn btn-ghost text-sm px-3 py-2"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        {user && (
          <a
            href="/display"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost text-sm px-3 py-2"
            title="Open projector view"
            aria-label="Projector view"
          >
            ⛶
          </a>
        )}
        {user && (
          <button
            onClick={onAdmin}
            className="btn btn-ghost text-sm px-3 py-2"
            title="Admin"
            aria-label="Admin"
          >
            ⚙
          </button>
        )}
        <AuthButton user={user} signIn={signIn} signOut={signOut} />
      </div>
    </header>
  )
}
