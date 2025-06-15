import { useState, useEffect } from 'react'

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setIsDark(shouldUseDark)
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', shouldUseDark ? 'dark' : 'light')
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    
    // Save preference
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    
    // Apply to document
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${isDark ? 'dark' : 'light'}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <div className="theme-toggle-track">
        <div className="theme-toggle-thumb">
          <span className="theme-icon">
            {isDark ? '🌙' : '☀️'}
          </span>
        </div>
      </div>
      <span className="theme-label">
        {isDark ? 'Dark' : 'Light'}
      </span>
    </button>
  )
}

export default ThemeToggle