import { useState } from 'react'
import { Bot, BarChart3, Copy, List, Layers } from 'lucide-react'
import toast from 'react-hot-toast'

const QuestionAnalysis = ({ 
  groupedQuestions, 
  isGroupingQuestions,
  onNavigateToQuestions 
}) => {
  // State to track view mode for each group independently
  const [groupViewModes, setGroupViewModes] = useState({})
  
  // Function to toggle view mode for a specific group
  const toggleGroupViewMode = (groupIndex, mode) => {
    setGroupViewModes(prev => ({
      ...prev,
      [groupIndex]: mode
    }))
  }
  
  // Function to get view mode for a specific group (default to 'unified')
  const getGroupViewMode = (groupIndex) => {
    return groupViewModes[groupIndex] || 'unified'
  }
  if ((!groupedQuestions || groupedQuestions.length === 0) && !isGroupingQuestions) {
    return (
      <div className="section-content">
        {/* <h2 className="section-title">📊 Question Analysis</h2>
        <p className="section-subtitle">AI-powered analysis and grouping of similar questions</p> */}
        
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
      {/* <h2 className="section-title">📊 Question Analysis</h2>
      <p className="section-subtitle">AI-powered analysis and grouping of similar questions</p> */}
      
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
            {groupedQuestions.map((group, groupIndex) => {
              const currentViewMode = getGroupViewMode(groupIndex)
              
              return (
                <div key={groupIndex} className="question-group">
                  <div className="group-header">
                    <h3>Group {group.groupNumber || groupIndex + 1}</h3>
                    <span className="group-count">
                      {group.count === 1 ? '1 question' : `${group.count} similar questions`}
                    </span>
                  </div>
                  
                  {/* View Mode Toggle Buttons for this group */}
                  <div className="group-view-mode-controls">
                    <button 
                      className={`view-mode-btn ${currentViewMode === 'unified' ? 'active' : ''}`}
                      onClick={() => {
                        toggleGroupViewMode(groupIndex, 'unified')
                        toast.success('Switched to unified question view', { duration: 2000, icon: '📋' })
                      }}
                      title="Show unified question for this group"
                    >
                      <Layers size={14} />
                      Unified
                    </button>
                    <button 
                      className={`view-mode-btn ${currentViewMode === 'individual' ? 'active' : ''}`}
                      onClick={() => {
                        if (group.originalQuestions && group.originalQuestions.length > 0) {
                          toggleGroupViewMode(groupIndex, 'individual')
                          toast.success('Switched to individual questions view', { duration: 2000, icon: '📝' })
                        } else {
                          toast.error('Individual questions not available for this group', { duration: 3000, icon: '⚠️' })
                        }
                      }}
                      title={
                        group.originalQuestions && group.originalQuestions.length > 0 
                          ? "Show individual questions for this group" 
                          : "Individual questions not available for this group"
                      }
                      disabled={!group.originalQuestions || group.originalQuestions.length === 0}
                    >
                      <List size={14} />
                      Individual {(!group.originalQuestions || group.originalQuestions.length === 0) && '(N/A)'}
                    </button>
                  </div>
                  
                  {/* Question Content */}
                  <div className="group-content">
                    {currentViewMode === 'unified' ? (
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
                    ) : (
                      <div className="individual-questions">
                        <div className="question-header">
                          <h4>📝 Individual Questions:</h4>
                          <span className="questions-count">
                            {group.originalQuestions ? group.originalQuestions.length : group.count} questions
                          </span>
                        </div>
                        <div className="questions-list">
                          {group.originalQuestions ? (
                            group.originalQuestions.map((question, qIndex) => (
                              <div key={qIndex} className="individual-question">
                                <span className="question-number">{qIndex + 1}.</span>
                                <span className="question-text">{question}</span>
                              </div>
                            ))
                          ) : (
                            <div className="no-individual-questions">
                              <p>Individual questions not available for this group.</p>
                              <p className="note">This might happen when:</p>
                              <ul className="note-list">
                                <li>The AI couldn't parse the original questions properly</li>
                                <li>Only one unique question was found in this group</li>
                                <li>The original text format wasn't recognized</li>
                              </ul>
                              <p className="note">The unified question above represents the content of this group.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="groups-controls">
            <button 
              className="copy-btn"
              onClick={() => {
                let groupedText = ''
                
                groupedText = groupedQuestions.map((group, index) => {
                  const currentViewMode = getGroupViewMode(index)
                  let text = `Group ${group.groupNumber || index + 1}:\n`
                  text += `Question Count: ${group.count}\n`
                  
                  if (currentViewMode === 'unified') {
                    text += `Unified Question: ${group.unifiedQuestion}\n`
                  } else {
                    if (group.originalQuestions) {
                      text += `Individual Questions:\n`
                      group.originalQuestions.forEach((question, qIndex) => {
                        text += `${qIndex + 1}. ${question}\n`
                      })
                    } else {
                      text += `Unified Question: ${group.unifiedQuestion}\n`
                    }
                  }
                  return text
                }).join('\n' + '='.repeat(50) + '\n\n')
                
                navigator.clipboard.writeText(groupedText)
                toast.success('All groups copied to clipboard with their current view modes!')
              }}
              title="Copy all groups with their current view modes to clipboard"
            >
              <Copy size={16} />
              Copy All Groups
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionAnalysis