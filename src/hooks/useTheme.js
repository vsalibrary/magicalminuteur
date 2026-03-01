import { useState, useEffect } from 'react'

const CYCLE = { dark: 'light', light: 'arcade', arcade: 'dark' }

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'arcade')
    if (theme === 'dark')   root.classList.add('dark')
    if (theme === 'arcade') root.classList.add('arcade')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => CYCLE[t] || 'dark')

  return { theme, toggleTheme }
}
