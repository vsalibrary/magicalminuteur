const BASE_TABS = [
  {
    id: 'timer',
    label: 'Timer',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="9" strokeWidth="2"/>
        <path strokeLinecap="round" strokeWidth="2" d="M12 7v5l3 3"/>
      </svg>
    ),
  },
  {
    id: 'scoresheet',
    label: 'Scores',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
    ),
  },
]

const SOUNDS_TAB = {
  id: 'soundboard',
  label: 'Sounds',
  icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
    </svg>
  ),
}

export function MobileNav({ activeTab, setActiveTab, user }) {
  const tabs = user ? [...BASE_TABS, SOUNDS_TAB] : BASE_TABS
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-white/10 bg-[#0c0c12]/95 backdrop-blur-md md:hidden">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
            activeTab === tab.id ? 'text-accent' : 'text-white/40 hover:text-white/70'
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
