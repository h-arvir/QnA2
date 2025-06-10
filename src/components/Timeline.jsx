import React, { useState, useEffect } from 'react'

const Timeline = ({ 
  activeSection, 
  onSectionChange, 
  selectedFiles, 
  cleanedQuestions, 
  groupedQuestions 
}) => {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  const timelineSteps = [
    {
      id: 'upload',
      number: 1,
      title: 'Upload',
      subtitle: 'Select & Process PDFs',
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

  return (
    <div 
      className="timeline-container" 
      style={{ 
        opacity,
        transform: `scale(${scale})`,
        filter: scrollY > 50 ? 'blur(0.5px)' : 'none'
      }}
    >
      <div className="timeline-progress">
        {timelineSteps.map((step, index) => (
          <div key={step.id}>
            <div className="timeline-step" onClick={() => onSectionChange(step.id)}>
              <div className={`timeline-dot ${step.completed ? 'completed' : ''} ${activeSection === step.id ? 'active' : ''}`}>
                <span className="timeline-number">{step.number}</span>
              </div>
              <div className="timeline-label">
                <span className="timeline-title">{step.title}</span>
                <span className="timeline-subtitle">{step.subtitle}</span>
              </div>
            </div>
            {index < timelineSteps.length - 1 && <div className="timeline-connector"></div>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Timeline