import { useState, useEffect, useRef } from 'react'

const Timeline = ({ 
  activeSection, 
  onSectionChange, 
  selectedFiles, 
  cleanedQuestions, 
  groupedQuestions 
}) => {
  const [scrollY, setScrollY] = useState(0)
  const [prevSection, setPrevSection] = useState(activeSection)
  const [isMainFocusMode, setIsMainFocusMode] = useState(false)
  const timelineRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Note: Answer focus mode is now handled purely by CSS blur effects
  // Timeline should remain visible but blurred when answer focus is active

  // Check for main focus mode
  useEffect(() => {
    const checkMainFocusMode = () => {
      const mainFocusMode = document.documentElement.getAttribute('data-focus') === 'true'
      setIsMainFocusMode(mainFocusMode)
    }
    
    // Initial check
    checkMainFocusMode()
    
    // Set up observer for attribute changes on documentElement
    const observer = new MutationObserver(checkMainFocusMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-focus'] })
    
    return () => observer.disconnect()
  }, [])

  // Add animation effect when section changes
  useEffect(() => {
    if (prevSection !== activeSection && timelineRef.current) {
      // Add pulse animation to timeline container
      timelineRef.current.classList.add('timeline-section-change')
      
      // Remove the animation class after animation completes
      const timer = setTimeout(() => {
        if (timelineRef.current) {
          timelineRef.current.classList.remove('timeline-section-change')
        }
      }, 600)
      
      setPrevSection(activeSection)
      return () => clearTimeout(timer)
    }
  }, [activeSection, prevSection])

  const timelineSteps = [
    {
      id: 'upload',
      number: 1,
      title: 'Upload',
      subtitle: 'Select  PDFs',
      completed: selectedFiles.length > 0
    },
    {
      id: 'questions',
      number: 2,
      title: 'Questions',
      subtitle: 'Generate Q&A',
      completed: !!cleanedQuestions
    },
    {
      id: 'analysis',
      number: 3,
      title: 'Analysis',
      subtitle: 'Review results',
      completed: groupedQuestions.length > 0
    }
  ]

  // Calculate opacity based on scroll position
  const opacity = Math.max(0.3, 1 - (scrollY / 200))
  const scale = Math.max(0.95, 1 - (scrollY / 1000))

  // Handle section change with animation
  const handleSectionChange = (sectionId) => {
    if (sectionId !== activeSection) {
      // Add animation class to the timeline item being clicked
      const timelineItem = document.querySelector(`.timeline-item[data-id="${sectionId}"]`)
      if (timelineItem) {
        timelineItem.classList.add('timeline-item-clicked')
        setTimeout(() => {
          timelineItem.classList.remove('timeline-item-clicked')
        }, 500)
      }
      
      onSectionChange(sectionId)
    }
  }

  // Only hide timeline for main focus mode, not answer focus mode
  // Answer focus mode will be handled by CSS blur effects
  const shouldHideTimeline = isMainFocusMode
  
  return (
    <div 
      ref={timelineRef}
      className={`timeline-container ${shouldHideTimeline ? 'focus-mode-hidden' : ''}`}
      style={{ 
        opacity: shouldHideTimeline ? 0 : opacity,
        transform: shouldHideTimeline ? 'translateY(-100%)' : `scale(${scale})`,
        filter: scrollY > 50 ? 'blur(0.5px)' : 'none',
        position: shouldHideTimeline ? 'absolute' : 'sticky',
        height: shouldHideTimeline ? 0 : 'auto',
        overflow: shouldHideTimeline ? 'hidden' : 'visible',
        pointerEvents: shouldHideTimeline ? 'none' : 'auto'
      }}
    >
      <div className="timeline-progress">
        {timelineSteps.map((step, index) => (
          <div key={step.id} className="timeline-item" data-id={step.id}>
            <div 
              className={`timeline-step ${activeSection === step.id ? 'active-step' : ''}`} 
              onClick={() => handleSectionChange(step.id)}
            >
              <div 
                className={`timeline-dot ${step.completed ? 'completed' : ''} ${activeSection === step.id ? 'active' : ''}`}
              >
                <span className="timeline-number">{step.number}</span>
              </div>
              <div className="timeline-label">
                <span className="timeline-title">{step.title}</span>
                <span className="timeline-subtitle">{step.subtitle}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="timeline-connectors">
        {timelineSteps.map((step, index) => (
          <div key={`connector-${index}`} className="timeline-connector-container">
            <div 
              className={`timeline-connector ${step.completed ? 'completed' : ''} ${activeSection === step.id ? 'active-connector' : ''}`}
            ></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Timeline