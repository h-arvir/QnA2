import React, { useState, useMemo } from 'react'
import { Bot, BarChart3, Copy, Lightbulb, Loader2, Eye, EyeOff, Search, X, Focus, Bookmark, BookmarkCheck, RotateCcw, BookmarkX, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { AIProcessingService } from '../services/aiProcessingService'
import AnsBlur from './AnsBlur'

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
  
  // Convert grouped questions to flat list of individual questions
  const flatQuestions = useMemo(() => {
    if (!groupedQuestions) return []
    
    // Sort marks groups to ensure 5 marks (Section A, B) come before 2 marks (Section C)
    const sortedMarksGroups = [...groupedQuestions].sort((a, b) => {
      // 5 marks should come first, then 2 marks
      if (a.marks === 5 && b.marks === 2) return -1
      if (a.marks === 2 && b.marks === 5) return 1
      return 0
    })
    
    const questions = []
    let questionNumber = 1
    
    sortedMarksGroups.forEach(marksGroup => {
      if (marksGroup.groups) {
        marksGroup.groups.forEach(group => {
          if (group.originalQuestions && group.originalQuestions.length > 0) {
            // Use individual questions if available
            group.originalQuestions.forEach(question => {
              questions.push({
                questionNumber: questionNumber++,
                questionText: question,
                marks: marksGroup.marks,
                sections: marksGroup.sections,
                questionKey: `question-${questionNumber - 1}`
              })
            })
          } else {
            // Use unified question if individual questions not available
            questions.push({
              questionNumber: questionNumber++,
              questionText: group.unifiedQuestion,
              marks: marksGroup.marks,
              sections: marksGroup.sections,
              questionKey: `question-${questionNumber - 1}`
            })
          }
        })
      }
    })
    
    return questions
  }, [groupedQuestions])

  // Filtered questions based on search query
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return flatQuestions
    
    return flatQuestions.filter(question => 
      matchesSearch(question.questionText || '', searchQuery)
    )
  }, [flatQuestions, searchQuery])
  
  // Function to clear search
  const clearSearch = () => {
    setSearchQuery('')
    toast.success('Search cleared', { duration: 1500, icon: <RotateCcw size={16} /> })
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
            questionNumber: questionData.questionNumber,
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
      
      {flatQuestions && flatQuestions.length > 0 && (
        <div className="question-groups-section">
          <h2>
            <Bot size={24} />
            AI Question Analysis by Marks
          </h2>
          <div className="groups-summary">
            <p>Found <strong>{flatQuestions.length}</strong> questions organized by marks (5 Marks and 2 Marks).</p>
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
                  <span>
                    Showing <strong>{filteredQuestions.length}</strong> of <strong>{flatQuestions.length}</strong> questions
                    {filteredQuestions.length === 0 && ' - No matches found'}
                  </span>
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
          {searchQuery && filteredQuestions.length === 0 && (
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
          
          {/* Group questions by marks for display */}
          {(() => {
            const questionsByMarks = {}
            filteredQuestions.forEach(question => {
              const marksKey = question.marks || 'Other'
              if (!questionsByMarks[marksKey]) {
                questionsByMarks[marksKey] = []
              }
              questionsByMarks[marksKey].push(question)
            })
            
            // Sort marks to ensure 5 marks appear before 2 marks
            const sortedMarksEntries = Object.entries(questionsByMarks).sort(([marksA], [marksB]) => {
              if (marksA === '5' && marksB === '2') return -1
              if (marksA === '2' && marksB === '5') return 1
              return 0
            })
            
            return (
              <div className="marks-groups-container">
                {sortedMarksEntries.map(([marks, questions]) => (
                  <div key={marks} className="marks-group">
                    <div className="marks-group-header">
                      <h2 className="marks-title">
                        {marks !== 'Other' ? `${marks} Marks` : 'Questions'}
                      </h2>
                      {questions.length > 0 && questions[0].sections && questions[0].sections.length > 0 && (
                        <div className="sections-info">
                          <span className="sections-label">Sections:</span>
                          <span className="sections-list">{questions[0].sections.join(', ')}</span>
                        </div>
                      )}
                      <span className="marks-group-count">
                        {questions.length} questions
                      </span>
                    </div>
                    
                    <div className="questions-list">
                      {questions.map((question, index) => (
                        <div key={question.questionKey} className="individual-question">
                          <div className="question-header">
                            <h4>Q.{question.questionNumber}</h4>
                            <div className="question-action-buttons">
                              <button 
                                className="answer-btn"
                                onClick={() => {
                                  if (answers[question.questionKey]) {
                                    toggleAnswer(question.questionKey)
                                  } else {
                                    handleGenerateAnswer(question.questionKey, question.questionText)
                                  }
                                }}
                                title="Generate answer for this question"
                                disabled={loadingAnswers[question.questionKey]}
                              >
                                {loadingAnswers[question.questionKey] ? (
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
                              
                              {answers[question.questionKey] && (
                                <button 
                                  className="hide-answer-btn"
                                  onClick={() => toggleAnswerVisibility(question.questionKey)}
                                  title={hiddenAnswers[question.questionKey] ? "Show answer" : "Hide answer"}
                                >
                                  {hiddenAnswers[question.questionKey] ? (
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
                                className={`bookmark-btn ${isBookmarked(question.questionKey) ? 'bookmarked' : ''}`}
                                onClick={(e) => {
                                  toggleBookmark(question.questionKey, {
                                    questionText: question.questionText,
                                    questionNumber: question.questionNumber,
                                    marks: question.marks,
                                    sections: question.sections
                                  }, e.target)
                                }}
                                title={isBookmarked(question.questionKey) ? "Remove bookmark" : "Bookmark this question"}
                              >
                                {isBookmarked(question.questionKey) ? (
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
                          <div 
                            className="question-text"
                            dangerouslySetInnerHTML={{ 
                              __html: highlightSearchTerm(question.questionText, searchQuery) 
                            }}
                          />
                          {answers[question.questionKey] && !hiddenAnswers[question.questionKey] && (
                            <div className="answer-section focused-answer" data-question-key={question.questionKey}>
                              <div className="answer-header">
                                <h5>💡 Answer:</h5>
                                <div className="answer-actions">
                                  <button 
                                    className="copy-answer-btn"
                                    onClick={() => {
                                      navigator.clipboard.writeText(answers[question.questionKey])
                                      toast.success('Answer copied to clipboard!', { icon: <Copy size={16} /> })
                                    }}
                                    title="Copy answer to clipboard"
                                  >
                                    <Copy size={12} />
                                  </button>
                                  <AnsBlur 
                                    questionKey={question.questionKey}
                                    focusedAnswer={focusedAnswer}
                                    setFocusedAnswer={setFocusedAnswer}
                                    size={12}
                                  />
                                </div>
                              </div>
                              <div 
                                className="answer-text"
                                dangerouslySetInnerHTML={{ 
                                  __html: formatAnswerText(answers[question.questionKey]) 
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
          
          <div className="groups-controls">
            <button 
              className="copy-btn"
              onClick={() => {
                let questionsText = ''
                
                // Group questions by marks for copying
                const questionsByMarks = {}
                flatQuestions.forEach(question => {
                  const marksKey = question.marks || 'Other'
                  if (!questionsByMarks[marksKey]) {
                    questionsByMarks[marksKey] = []
                  }
                  questionsByMarks[marksKey].push(question)
                })
                
                // Sort marks to ensure 5 marks appear before 2 marks
                const sortedMarksEntries = Object.entries(questionsByMarks).sort(([marksA], [marksB]) => {
                  if (marksA === '5' && marksB === '2') return -1
                  if (marksA === '2' && marksB === '5') return 1
                  return 0
                })
                
                questionsText = sortedMarksEntries.map(([marks, questions]) => {
                  let marksText = `${marks !== 'Other' ? `${marks} MARKS` : 'QUESTIONS'}\n`
                  if (questions.length > 0 && questions[0].sections && questions[0].sections.length > 0) {
                    marksText += `Sections: ${questions[0].sections.join(', ')}\n`
                  }
                  marksText += '='.repeat(50) + '\n\n'
                  
                  marksText += questions.map((question) => {
                    return `Q.${question.questionNumber}: ${question.questionText}\n`
                  }).join('\n')
                  
                  return marksText
                }).join('\n' + '='.repeat(70) + '\n\n')
                
                navigator.clipboard.writeText(questionsText)
                toast.success('All questions copied to clipboard!')
              }}
              title="Copy all questions to clipboard"
            >
              <Copy size={16} />
              Copy All Questions
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionAnalysis