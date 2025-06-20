import { useState, useEffect } from 'react'

const FocusToggle = () => {
  const [isFocused, setIsFocused] = useState(false)

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

  return (
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
  )
}

export default FocusToggle