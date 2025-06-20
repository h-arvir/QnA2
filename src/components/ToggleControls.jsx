import { useState, useEffect } from 'react'

const ToggleControls = () => {
  // Theme toggle state
  const [isDark, setIsDark] = useState(false)
  
  // Focus toggle state
  const [isFocused, setIsFocused] = useState(false)

  // Theme toggle effect
  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setIsDark(shouldUseDark)
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', shouldUseDark ? 'dark' : 'light')
  }, [])

  // Focus toggle effect
  useEffect(() => {
    // Check for saved focus preference
    const savedFocus = localStorage.getItem('focus-mode')
    const shouldBeFocused = savedFocus === 'true'
    setIsFocused(shouldBeFocused)
    
    // Apply focus mode to document
    document.documentElement.setAttribute('data-focus', shouldBeFocused ? 'true' : 'false')
    
    // Add keyboard shortcut (Alt+F)
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'f') {
        toggleFocus()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    
    // Create and trigger diagonal transition animation
    const overlay = document.createElement('div')
    overlay.className = 'theme-transition-overlay'
    document.body.appendChild(overlay)
    
    // Trigger animation
    requestAnimationFrame(() => {
      overlay.classList.add('active')
    })
    
    // Change theme after a short delay to sync with animation
    setTimeout(() => {
      setIsDark(newTheme)
      
      // Save preference
      localStorage.setItem('theme', newTheme ? 'dark' : 'light')
      
      // Apply to document
      document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light')
    }, 200)
    
    // Remove overlay after animation completes
    setTimeout(() => {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay)
      }
    }, 800)
  }

  // Define toggleFocus so it can be used by both the keyboard shortcut and button
  const toggleFocus = () => {
    setIsFocused(prevFocused => {
      const newFocus = !prevFocused
      
      // Save preference
      localStorage.setItem('focus-mode', newFocus.toString())
      
      // Apply to document with a small delay to allow for smooth transitions
      // This prevents the "reload" effect when toggling focus mode
      if (newFocus) {
        // Entering focus mode - apply immediately
        document.documentElement.setAttribute('data-focus', 'true')
      } else {
        // Exiting focus mode - add a transition class first
        document.documentElement.classList.add('exiting-focus-mode')
        document.documentElement.setAttribute('data-focus', 'false')
        
        // Remove the transition class after animation completes
        setTimeout(() => {
          document.documentElement.classList.remove('exiting-focus-mode')
        }, 400) // Match the transition duration
      }
      
      return newFocus
    })
  }

  return (
    <div className="toggle-controls">
      {/* Theme Toggle */}
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

      {/* Focus Toggle */}
      <button
        onClick={toggleFocus}
        className={`theme-toggle ${isFocused ? 'dark' : 'light'}`}
        aria-label={`${isFocused ? 'Exit' : 'Enter'} focus mode`}
        title={`${isFocused ? 'Exit' : 'Enter'} focus mode (Alt+F)`}
      >
        <div className="theme-toggle-track">
          <div className="theme-toggle-thumb">
            <span className="theme-icon">
              {isFocused ? '👁️' : '👓'}
            </span>
          </div>
        </div>
        <span className="theme-label">
          {isFocused ? 'Focus' : 'Focus'}
        </span>
      </button>
    </div>
  )
}

export default ToggleControls