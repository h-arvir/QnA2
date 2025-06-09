const Timeline = ({ 
  activeSection, 
  onSectionChange, 
  selectedFiles, 
  cleanedQuestions, 
  groupedQuestions 
}) => {
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

  return (
    <div className="timeline-container">
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