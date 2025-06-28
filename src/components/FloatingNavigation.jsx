import { useState, useEffect } from 'react'
import { SECTION_IDS } from '../constants/appConstants'

const FloatingNavigation = ({ activeSection, onSectionChange }) => {
  const [isTimelineVisible, setIsTimelineVisible] = useState(true)
  const [scrollY, setScrollY] = useState(0)

  const mainSections = [
    { id: SECTION_IDS.UPLOAD, label: 'Upload', icon: '', number: 1 },
    { id: SECTION_IDS.QUESTIONS, label: 'Questions', icon: '', number: 2 },
    { id: SECTION_IDS.ANALYSIS, label: 'Analysis', icon: '', number: 3 }
  ]

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)
      
      // Timeline becomes less visible after scrolling 100px
      setIsTimelineVisible(currentScrollY < 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div   className={`floating-navigation ${!isTimelineVisible ? 'timeline-hidden' : ''}`}>
      <div className="floating-nav-line">
        {mainSections.map((section, index) => (
          <button
            key={section.id}
            className={`floating-nav-dot ${activeSection === section.id ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onSectionChange(section.id);
            }}
            title={section.label}
            aria-label={`Navigate to ${section.label}`}
          >
            <span className="dot-number">{section.number}</span>
            <span className="dot-icon">{section.icon}</span>
            <span className="dot-label">{section.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default FloatingNavigation