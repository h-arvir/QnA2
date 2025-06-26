import React, { useState, useMemo } from 'react'
import { Bot, BarChart3, Copy, List, Layers, Lightbulb, Loader2, Eye, EyeOff, Search, X, Focus, Bookmark, BookmarkCheck, RotateCcw, BookmarkX, CheckCircle, Shuffle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { AIProcessingService } from '../services/aiProcessingService'

const QuestionAnalysis = ({ 
  groupedQuestions, 
  isGroupingQuestions,
  onNavigateToQuestions,
  geminiApiKey,
  extractedText,
  cleanedQuestions,
  answers,
  setAnswers,
  loadingAnswers,
  setLoadingAnswers,
  hiddenAnswers,
  setHiddenAnswers,
  groupViewModes,
  setGroupViewModes,
  bookmarkedQuestions,
  setBookmarkedQuestions
}) => {
  // Note: All state is now managed at the app level and passed as props
  // This ensures answers persist when navigating between sections
  
  // Search functionality state
  const [searchQuery, setSearchQuery] = useState('')
  
  // Focus mode state
  const [focusedAnswer, setFocusedAnswer] = useState(null)
  
  // Function to highlight search terms in text
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm.trim()) return text
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="search-highlight">$1</mark>')
  }
  
  // Function to check if a question matches the search query
  const matchesSearch = (question, searchTerm) => {
    if (!searchTerm.trim()) return true
    return question.toLowerCase().includes(searchTerm.toLowerCase())
  }
  
  // Filtered grouped questions based on search query
  const filteredGroupedQuestions = useMemo(() => {
    if (!searchQuery.trim() || !groupedQuestions) return groupedQuestions
    
    return groupedQuestions.map(marksGroup => ({
      ...marksGroup,
      groups: marksGroup.groups?.filter(group => {
        // Check if unified question matches
        const unifiedMatches = matchesSearch(group.unifiedQuestion || '', searchQuery)
        
        // Check if any individual question matches
        const individualMatches = group.originalQuestions?.some(q => 
          matchesSearch(q.question || q, searchQuery)
        ) || false
        
        return unifiedMatches || individualMatches
      }) || []
    })).filter(marksGroup => marksGroup.groups.length > 0)
  }, [groupedQuestions, searchQuery])
  
  // Function to clear search
  const clearSearch = () => {
    setSearchQuery('')
    toast.success('Search cleared', { duration: 1500, icon: <RotateCcw size={16} /> })
  }
  
  // Function to toggle focus mode for an answer
  const toggleFocusMode = (questionKey) => {
    if (focusedAnswer === questionKey) {
      setFocusedAnswer(null)
      // Remove blur effect from body
      document.body.classList.remove('answer-focus-mode')
      toast.success('Focus mode disabled', { duration: 1500, icon: <EyeOff size={16} /> })
    } else {
      setFocusedAnswer(questionKey)
      // Add blur effect to body
      document.body.classList.add('answer-focus-mode')
      toast.success('Focus mode enabled', { duration: 1500, icon: <Focus size={16} /> })
    }
  }
  
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
  
  // Function to handle answer generation
  const handleGenerateAnswer = async (questionKey, questionText) => {
    if (!geminiApiKey || !geminiApiKey.trim()) {
      toast.error('Please set your Gemini API key first!')
      return
    }

    try {
      // Set loading state
      setLoadingAnswers(prev => ({ ...prev, [questionKey]: true }))
      
      // Show loading toast
      const loadingToast = toast.loading('Generating detailed answer...', { 
        icon: <Bot size={16} />,
        duration: Infinity // Persist until dismissed
      })

      // Prepare context from the document
      const context = cleanedQuestions || extractedText || ''
      
      // Generate answer using AI service with content-based caching
      const answer = await AIProcessingService.generateAnswer(
        questionText, 
        context, 
        geminiApiKey,
        (status) => {
          // Update loading toast with status
          toast.loading(status, { id: loadingToast })
        }
        // Note: questionKey is no longer passed - caching now uses question content
      )
      
      // Set the generated answer
      setAnswers(prev => ({
        ...prev,
        [questionKey]: answer
      }))
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast)
      toast.success('Answer generated successfully!', { icon: <CheckCircle size={16} /> })
      
    } catch (error) {
      console.error('Error generating answer:', error)
      toast.error(error.message || 'Failed to generate answer')
      
      // Remove any partial answer
      setAnswers(prev => ({
        ...prev,
        [questionKey]: null
      }))
    } finally {
      // Clear loading state
      setLoadingAnswers(prev => ({ ...prev, [questionKey]: false }))
    }
  }
  
  // Function to toggle answer visibility (for the old close button)
  const toggleAnswer = (questionKey) => {
    setAnswers(prev => ({
      ...prev,
      [questionKey]: prev[questionKey] ? null : undefined
    }))
  }

  // Function to toggle answer visibility (for the new hide/show button)
  const toggleAnswerVisibility = (questionKey) => {
    setHiddenAnswers(prev => ({
      ...prev,
      [questionKey]: !prev[questionKey]
    }))
  }

  // Function to format answer text for better display
  const formatAnswerText = (text) => {
    if (!text) return text
    
    // Convert markdown-style formatting to HTML-like formatting for display
    let formatted = text
      // Headers (must be processed before other elements)
      .replace(/^### (.*$)/gm, '<h3>$1</h3>') // H3 headers
      .replace(/^## (.*$)/gm, '<h2>$1</h2>') // H2 headers
      .replace(/^# (.*$)/gm, '<h1>$1</h1>') // H1 headers
      
      // Text formatting
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
      
      // Code blocks and inline code
      .replace(/```([^`]*?)```/gs, '<pre><code>$1</code></pre>') // Code blocks
      .replace(/`([^`]*?)`/g, '<code>$1</code>') // Inline code
      
      // Lists
      .replace(/^\s*-\s+(.*$)/gm, '<li>$1</li>') // Unordered list items
      .replace(/^\s*\d+\.\s+(.*$)/gm, '<li>$1</li>') // Ordered list items
      
      // Wrap adjacent list items in ul/ol tags
      .replace(/(<li>.*?<\/li>)\s*(<li>.*?<\/li>)/gs, '<ul>$1$2</ul>')
      
      // Paragraphs (add proper spacing)
      .replace(/\n\n/g, '</p><p>')
      
      // Blockquotes
      .replace(/^\>\s+(.*$)/gm, '<blockquote>$1</blockquote>')
    
    // Wrap the content in a paragraph if it doesn't start with a block element
    if (!formatted.startsWith('<h1>') && 
        !formatted.startsWith('<h2>') && 
        !formatted.startsWith('<h3>') && 
        !formatted.startsWith('<ul>') && 
        !formatted.startsWith('<pre>') && 
        !formatted.startsWith('<blockquote>')) {
      formatted = '<p>' + formatted + '</p>'
    }
    
    return formatted
  }
  
  // Function to toggle bookmark for a question
  const toggleBookmark = (questionKey, questionData, buttonElement) => {
    // Check current bookmark status before updating
    const wasBookmarked = !!bookmarkedQuestions[questionKey]
    
    setBookmarkedQuestions(prev => {
      const isBookmarked = prev[questionKey]
      
      if (isBookmarked) {
        // Remove bookmark
        const updated = { ...prev }
        delete updated[questionKey]
        return updated
      } else {
        // Add bookmark
        return {
          ...prev,
          [questionKey]: {
            questionText: questionData.questionText,
            groupTitle: questionData.groupTitle,
            marks: questionData.marks,
            sections: questionData.sections,
            bookmarkedAt: new Date().toISOString()
          }
        }
      }
    })
    
    // Show toast notification based on the action taken
    if (wasBookmarked) {
      toast.success('Bookmark removed', { duration: 2000, icon: <BookmarkX size={16} /> })
    } else {
      toast.success('Question bookmarked', { duration: 2000, icon: <BookmarkCheck size={16} /> })
    }
    
    // Force blur the button after state update
    if (buttonElement) {
      setTimeout(() => {
        buttonElement.blur()
        // Also remove any focus styles programmatically
        buttonElement.style.outline = 'none'
        buttonElement.style.boxShadow = 'none'
      }, 0)
    }
  }
  
  // Function to check if a question is bookmarked
  const isBookmarked = (questionKey) => {
    return !!bookmarkedQuestions[questionKey]
  }
  
  if ((!groupedQuestions || groupedQuestions.length === 0) && !isGroupingQuestions) {
    return (
      <div className="section-content">
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
            AI Question Analysis & Grouping by Marks
          </h2>
          <div className="groups-summary">
            {/* Calculate total groups across all marks */}
            {(() => {
              const totalGroups = groupedQuestions.reduce((sum, marksGroup) => {
                return sum + (marksGroup.groups ? marksGroup.groups.length : 0)
              }, 0)
              return <p>Found <strong>{totalGroups}</strong> unified question groups organized by marks (5 Marks and 2 Marks).</p>
            })()}
            {(!geminiApiKey || !geminiApiKey.trim()) && (
              <div className="api-key-warning">
                <p>⚠️ Set your Gemini API key to generate detailed answers for questions.</p>
              </div>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="search-section">
            <div className="search-container">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder=" Search questions here ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="clear-search-btn"
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="search-results-info">
                  {(() => {
                    const totalFilteredGroups = filteredGroupedQuestions.reduce((sum, marksGroup) => {
                      return sum + (marksGroup.groups ? marksGroup.groups.length : 0)
                    }, 0)
                    const totalGroups = groupedQuestions.reduce((sum, marksGroup) => {
                      return sum + (marksGroup.groups ? marksGroup.groups.length : 0)
                    }, 0)
                    return (
                      <span>
                        Showing <strong>{totalFilteredGroups}</strong> of <strong>{totalGroups}</strong> groups
                        {totalFilteredGroups === 0 && ' - No matches found'}
                      </span>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
          
          {isGroupingQuestions && (
            <div className="grouping-loading">
              <div className="loading-spinner"></div>
              <p>AI is analyzing and grouping questions by marks...</p>
            </div>
          )}
          
          {/* No Results Message */}
          {searchQuery && filteredGroupedQuestions.length === 0 && (
            <div className="no-search-results">
              <div className="no-results-icon">
                <Search size={48} />
              </div>
              <h3>No Questions Found</h3>
              <p>No questions match your search term "<strong>{searchQuery}</strong>"</p>
              <button 
                onClick={clearSearch}
                className="clear-search-action-btn"
              >
                Clear Search
              </button>
            </div>
          )}
          
          <div className="marks-groups-container">
            {filteredGroupedQuestions.map((marksGroup, marksIndex) => (
              <div key={marksIndex} className="marks-group">
                <div className="marks-group-header">
                  <h2 className="marks-title">
                    {marksGroup.marks ? `${marksGroup.marks} Marks` : 'Questions'}
                  </h2>
                  {marksGroup.sections && marksGroup.sections.length > 0 && (
                    <div className="sections-info">
                      <span className="sections-label">Sections:</span>
                      <span className="sections-list">{marksGroup.sections.join(', ')}</span>
                    </div>
                  )}
                  <span className="marks-group-count">
                    {marksGroup.groups ? marksGroup.groups.length : 0} question groups
                  </span>
                </div>
                
                <div className="question-groups-container">
                  {marksGroup.groups && marksGroup.groups.map((group, groupIndex) => {
                    const globalGroupIndex = `${marksIndex}-${groupIndex}`
                    const currentViewMode = getGroupViewMode(globalGroupIndex)
                    
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
                              toggleGroupViewMode(globalGroupIndex, 'unified')
                              toast.success('Switched to unified question view', { duration: 2000, icon: <Layers size={16} /> })
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
                                toggleGroupViewMode(globalGroupIndex, 'individual')
                                toast.success('Switched to individual questions view', { duration: 2000, icon: <List size={16} /> })
                              } else {
                                toast.error('Individual questions not available for this group', { duration: 3000, icon: <AlertTriangle size={16} /> })
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
                          <div className="question-header-actions">
                            <span className="repetition-badge">
                              {group.count}x repeated
                            </span>
                            <div className="question-action-buttons">
                              <button 
                                className="answer-btn"
                                onClick={() => {
                                  const questionKey = `unified-${globalGroupIndex}`
                                  if (answers[questionKey]) {
                                    toggleAnswer(questionKey)
                                  } else {
                                    handleGenerateAnswer(questionKey, group.unifiedQuestion)
                                  }
                                }}
                                title="Generate answer for this question"
                                disabled={loadingAnswers[`unified-${globalGroupIndex}`]}
                              >
                                {loadingAnswers[`unified-${globalGroupIndex}`] ? (
                                  <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Lightbulb size={14} />
                                    Ans.
                                  </>
                                )}
                              </button>
                              
                              {answers[`unified-${globalGroupIndex}`] && (
                                <button 
                                  className="hide-answer-btn"
                                  onClick={() => toggleAnswerVisibility(`unified-${globalGroupIndex}`)}
                                  title={hiddenAnswers[`unified-${globalGroupIndex}`] ? "Show answer" : "Hide answer"}
                                >
                                  {hiddenAnswers[`unified-${globalGroupIndex}`] ? (
                                    <>
                                      <Eye size={14} />
                                      Show
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff size={14} />
                                      Hide
                                    </>
                                  )}
                                </button>
                              )}
                              
                              <button 
                                className={`bookmark-btn ${isBookmarked(`unified-${globalGroupIndex}`) ? 'bookmarked' : ''}`}
                                onClick={(e) => {
                                  const questionKey = `unified-${globalGroupIndex}`
                                  toggleBookmark(questionKey, {
                                    questionText: group.unifiedQuestion,
                                    groupTitle: `Group ${group.groupNumber || groupIndex + 1}`,
                                    marks: marksGroup.marks,
                                    sections: marksGroup.sections
                                  }, e.target)
                                }}
                                title={isBookmarked(`unified-${globalGroupIndex}`) ? "Remove bookmark" : "Bookmark this question"}
                              >
                                {isBookmarked(`unified-${globalGroupIndex}`) ? (
                                  <>
                                    <BookmarkCheck size={14} />
                                    Saved
                                  </>
                                ) : (
                                  <>
                                    <Bookmark size={14} />
                                    Save
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div 
                          className="question-text"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(group.unifiedQuestion, searchQuery) 
                          }}
                        />
                        {answers[`unified-${globalGroupIndex}`] && !hiddenAnswers[`unified-${globalGroupIndex}`] && (
                          <div className={`answer-section ${focusedAnswer === `unified-${globalGroupIndex}` ? 'focused-answer' : ''}`}>
                            <div className="answer-header">
                              <h5>💡 Answer:</h5>
                              <div className="answer-actions">
                                <button 
                                  className="copy-answer-btn"
                                  onClick={() => {
                                    navigator.clipboard.writeText(answers[`unified-${globalGroupIndex}`])
                                    toast.success('Answer copied to clipboard!', { icon: <Copy size={16} /> })
                                  }}
                                  title="Copy answer to clipboard"
                                >
                                  <Copy size={12} />
                                </button>
                                <button 
                                  className={`focus-answer-btn ${focusedAnswer === `unified-${globalGroupIndex}` ? 'active' : ''}`}
                                  onClick={() => toggleFocusMode(`unified-${globalGroupIndex}`)}
                                  title={focusedAnswer === `unified-${globalGroupIndex}` ? "Exit focus mode" : "Focus on this answer"}
                                >
                                  <Focus size={12} />
                                </button>
                              </div>
                            </div>
                            <div 
                              className="answer-text"
                              dangerouslySetInnerHTML={{ 
                                __html: formatAnswerText(answers[`unified-${globalGroupIndex}`]) 
                              }}
                            />
                          </div>
                        )}
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
                            group.originalQuestions.map((question, qIndex) => {
                              const questionKey = `individual-${globalGroupIndex}-${qIndex}`
                              return (
                                <div key={qIndex} className="individual-question">
                                  <div className="individual-question-content">
                                    <span className="question-number">{qIndex + 1}.</span>
                                    <span 
                                      className="question-text"
                                      dangerouslySetInnerHTML={{ 
                                        __html: highlightSearchTerm(question, searchQuery) 
                                      }}
                                    />
                                    <div className="individual-question-actions">
                                      <button 
                                        className="answer-btn individual-answer-btn"
                                        onClick={() => {
                                          if (answers[questionKey]) {
                                            toggleAnswer(questionKey)
                                          } else {
                                            handleGenerateAnswer(questionKey, question)
                                          }
                                        }}
                                        title="Generate answer for this question"
                                        disabled={loadingAnswers[questionKey]}
                                      >
                                        {loadingAnswers[questionKey] ? (
                                          <>
                                            <Loader2 size={12} className="animate-spin" />
                                            Generating...
                                          </>
                                        ) : (
                                          <>
                                            <Lightbulb size={12} />
                                            Ans.
                                          </>
                                        )}
                                      </button>
                                      
                                      {answers[questionKey] && (
                                        <button 
                                          className="hide-answer-btn individual-hide-btn"
                                          onClick={() => toggleAnswerVisibility(questionKey)}
                                          title={hiddenAnswers[questionKey] ? "Show answer" : "Hide answer"}
                                        >
                                          {hiddenAnswers[questionKey] ? (
                                            <>
                                              <Eye size={12} />
                                              Show
                                            </>
                                          ) : (
                                            <>
                                              <EyeOff size={12} />
                                              Hide
                                            </>
                                          )}
                                        </button>
                                      )}
                                      
                                      <button 
                                        className={`bookmark-btn individual-bookmark-btn ${isBookmarked(questionKey) ? 'bookmarked' : ''}`}
                                        onClick={(e) => {
                                          toggleBookmark(questionKey, {
                                            questionText: question,
                                            groupTitle: `Group ${group.groupNumber || groupIndex + 1}`,
                                            marks: marksGroup.marks,
                                            sections: marksGroup.sections
                                          }, e.target)
                                        }}
                                        title={isBookmarked(questionKey) ? "Remove bookmark" : "Bookmark this question"}
                                      >
                                        {isBookmarked(questionKey) ? (
                                          <>
                                            <BookmarkCheck size={12} />
                                            Saved
                                          </>
                                        ) : (
                                          <>
                                            <Bookmark size={12} />
                                            Save
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  {answers[questionKey] && !hiddenAnswers[questionKey] && (
                                    <div className={`individual-answer-section ${focusedAnswer === questionKey ? 'focused-answer' : ''}`}>
                                      <div className="answer-header">
                                        <h6>💡 Answer:</h6>
                                        <div className="answer-actions">
                                          <button 
                                            className="copy-answer-btn"
                                            onClick={() => {
                                              navigator.clipboard.writeText(answers[questionKey])
                                              toast.success('Answer copied to clipboard!', { icon: <Copy size={16} /> })
                                            }}
                                            title="Copy answer to clipboard"
                                          >
                                            <Copy size={10} />
                                          </button>
                                          <button 
                                            className={`focus-answer-btn ${focusedAnswer === questionKey ? 'active' : ''}`}
                                            onClick={() => toggleFocusMode(questionKey)}
                                            title={focusedAnswer === questionKey ? "Exit focus mode" : "Focus on this answer"}
                                          >
                                            <Focus size={10} />
                                          </button>
                                        </div>
                                      </div>
                                      <div 
                                        className="answer-text"
                                        dangerouslySetInnerHTML={{ 
                                          __html: formatAnswerText(answers[questionKey]) 
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              )
                            })
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
          </div>
        ))}
      </div>
          
          <div className="groups-controls">
            <button 
              className="copy-btn"
              onClick={() => {
                let groupedText = ''
                
                groupedText = groupedQuestions.map((marksGroup, marksIndex) => {
                  let marksText = `${marksGroup.marks ? `${marksGroup.marks} MARKS` : 'QUESTIONS'}\n`
                  if (marksGroup.sections && marksGroup.sections.length > 0) {
                    marksText += `Sections: ${marksGroup.sections.join(', ')}\n`
                  }
                  marksText += '='.repeat(50) + '\n\n'
                  
                  if (marksGroup.groups) {
                    marksText += marksGroup.groups.map((group, groupIndex) => {
                      const globalGroupIndex = `${marksIndex}-${groupIndex}`
                      const currentViewMode = getGroupViewMode(globalGroupIndex)
                      let text = `Group ${group.groupNumber || groupIndex + 1}:\n`
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
                    }).join('\n' + '-'.repeat(30) + '\n\n')
                  }
                  
                  return marksText
                }).join('\n' + '='.repeat(70) + '\n\n')
                
                navigator.clipboard.writeText(groupedText)
                toast.success('All groups copied to clipboard!')
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