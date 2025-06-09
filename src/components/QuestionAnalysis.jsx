import { Bot, BarChart3 } from 'lucide-react'

const QuestionAnalysis = ({ 
  groupedQuestions, 
  isGroupingQuestions,
  onNavigateToQuestions 
}) => {
  if ((!groupedQuestions || groupedQuestions.length === 0) && !isGroupingQuestions) {
    return (
      <div className="section-content">
        <h2 className="section-title">📊 Question Analysis</h2>
        <p className="section-subtitle">AI-powered analysis and grouping of similar questions</p>
        
        <div className="empty-state">
          <div className="empty-icon">
            <BarChart3 size={64} />
          </div>
          <h3>No Analysis Available</h3>
          <p>Extract questions first, then analyze them to see grouped results here.</p>
          <button 
            className="nav-btn"
            onClick={onNavigateToQuestions}
          >
            Go to Questions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="section-content">
      <h2 className="section-title">📊 Question Analysis</h2>
      <p className="section-subtitle">AI-powered analysis and grouping of similar questions</p>
      
      {groupedQuestions && groupedQuestions.length > 0 && (
        <div className="question-groups-section">
          <h2>
            <Bot size={24} />
            AI Question Analysis & Grouping
          </h2>
          <div className="groups-summary">
            <p>Found <strong>{groupedQuestions.length}</strong> unified question groups with repetition counts.</p>
          </div>
          
          {isGroupingQuestions && (
            <div className="grouping-loading">
              <div className="loading-spinner"></div>
              <p>AI is analyzing and grouping questions...</p>
            </div>
          )}
          
          <div className="question-groups-container">
            {groupedQuestions.map((group, groupIndex) => (
              <div key={groupIndex} className="question-group">
                <div className="group-header">
                  <h3>Group {group.groupNumber || groupIndex + 1}</h3>
                  <span className="group-count">
                    {group.count === 1 ? '1 question' : `${group.count} similar questions`}
                  </span>
                </div>
                
                <div className="unified-question">
                  <div className="question-header">
                    <h4>❓ Unified Question:</h4>
                    <span className="repetition-badge">
                      {group.count}x repeated
                    </span>
                  </div>
                  <div className="question-text">
                    {group.unifiedQuestion}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="groups-controls">
            <button 
              className="copy-btn"
              onClick={() => {
                const groupedText = groupedQuestions.map((group, index) => {
                  let text = `Group ${group.groupNumber || index + 1}:\n`
                  text += `Question Count: ${group.count} (repeated ${group.count}x)\n`
                  text += `Unified Question: ${group.unifiedQuestion}\n`
                  return text
                }).join('\n' + '='.repeat(50) + '\n\n')
                navigator.clipboard.writeText(groupedText)
              }}
              title="Copy unified questions to clipboard"
            >
              📋 Copy Questions
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionAnalysis