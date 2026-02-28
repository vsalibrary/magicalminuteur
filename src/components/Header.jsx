import { AuthButton } from './AuthButton'

export function Header({ user, signIn, signOut, theme, toggleTheme, onAdmin }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-subtle bg-[#0c0c12]/80 backdrop-blur-md" style={{ borderColor: 'var(--color-border)', backgroundColor: 'color-mix(in srgb, var(--color-bg) 80%, transparent)' }}>
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm md:text-xl font-display tracking-tight leading-tight" style={{ color: 'var(--color-text)' }}>Mr Mac's Magical Minuteur</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="btn btn-ghost text-sm px-3 py-2"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
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
