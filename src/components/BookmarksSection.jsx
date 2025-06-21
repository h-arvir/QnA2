import React, { useState, useMemo } from 'react'
import { Bookmark, BookmarkX, Search, X, Copy, Lightbulb, Eye, EyeOff, Focus, Loader2, Bot, RotateCcw, CheckCircle, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { AIProcessingService } from '../services/aiProcessingService'

const BookmarksSection = ({ 
  bookmarkedQuestions,
  setBookmarkedQuestions,
  geminiApiKey,
  extractedText,
  cleanedQuestions,
  answers,
  setAnswers,
  loadingAnswers,
  setLoadingAnswers,
  hiddenAnswers,
  setHiddenAnswers,
  onNavigateToSection
}) => {
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
  
  // Get bookmarked questions as array
  const bookmarkedQuestionsArray = useMemo(() => {
    return Object.entries(bookmarkedQuestions).map(([questionKey, questionData]) => ({
      questionKey,
      ...questionData
    }))
  }, [bookmarkedQuestions])
  
  // Filtered bookmarked questions based on search query
  const filteredBookmarkedQuestions = useMemo(() => {
    if (!searchQuery.trim()) return bookmarkedQuestionsArray
    
    return bookmarkedQuestionsArray.filter(bookmark => 
      matchesSearch(bookmark.questionText || '', searchQuery) ||
      matchesSearch(bookmark.groupTitle || '', searchQuery)
    )
  }, [bookmarkedQuestionsArray, searchQuery])
  
  // Function to clear search
  const clearSearch = () => {
    setSearchQuery('')
    toast.success('Search cleared', { duration: 1500, icon: <RotateCcw size={16} /> })
  }
  
  // Function to remove bookmark
  const removeBookmark = (questionKey) => {
    setBookmarkedQuestions(prev => {
      const updated = { ...prev }
      delete updated[questionKey]
      return updated
    })
    toast.success('Bookmark removed', { duration: 2000, icon: <BookmarkX size={16} /> })
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
  
  // Function to toggle answer visibility
  const toggleAnswerVisibility = (questionKey) => {
    setHiddenAnswers(prev => ({
      ...prev,
      [questionKey]: !prev[questionKey]
    }))
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
        duration: 0 // Don't auto-dismiss
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

  if (bookmarkedQuestionsArray.length === 0) {
    return (
      <div className="section-content">
        <div className="empty-state">
          <div className="empty-icon">
            <Bookmark size={64} />
          </div>
          <h3>No Bookmarked Questions</h3>
          <p>Bookmark questions from the Analysis section to access them here quickly.</p>
          <button 
            className="nav-btn"
            onClick={() => onNavigateToSection('analysis')}
          >
            Go to Analysis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="section-content">
      <div className="bookmarks-section">
        <h2>
          <Bookmark size={24} />
          Bookmarked Questions
        </h2>
        <div className="bookmarks-summary">
          <p>You have <strong>{bookmarkedQuestionsArray.length}</strong> bookmarked questions.</p>
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
                placeholder="Search bookmarked questions..."
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
                  Showing <strong>{filteredBookmarkedQuestions.length}</strong> of <strong>{bookmarkedQuestionsArray.length}</strong> bookmarks
                  {filteredBookmarkedQuestions.length === 0 && ' - No matches found'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* No Results Message */}
        {searchQuery && filteredBookmarkedQuestions.length === 0 && (
          <div className="no-search-results">
            <div className="no-results-icon">
              <Search size={48} />
            </div>
            <h3>No Bookmarks Found</h3>
            <p>No bookmarked questions match your search term "<strong>{searchQuery}</strong>"</p>
            <button 
              onClick={clearSearch}
              className="clear-search-action-btn"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Bookmarked Questions List */}
        <div className="bookmarks-container">
          {filteredBookmarkedQuestions.map((bookmark, index) => (
            <div key={bookmark.questionKey} className="bookmark-item">
              <div className="bookmark-header">
                <div className="bookmark-info">
                  <h4>
                    {bookmark.groupTitle && (
                      <span className="group-title">{bookmark.groupTitle} - </span>
                    )}
                    Question {index + 1}
                  </h4>
                  {bookmark.marks && (
                    <span className="marks-badge">{bookmark.marks} Marks</span>
                  )}
                  {bookmark.sections && bookmark.sections.length > 0 && (
                    <div className="sections-info">
                      <span className="sections-label">Sections:</span>
                      <span className="sections-list">{bookmark.sections.join(', ')}</span>
                    </div>
                  )}
                </div>
                <button
                  className="remove-bookmark-btn"
                  onClick={(e) => {
                    removeBookmark(bookmark.questionKey)
                    // Blur the button to remove focus
                    e.target.blur()
                  }}
                  title="Remove bookmark"
                >
                  <BookmarkX size={16} />
                </button>
              </div>
              
              <div className="bookmark-question">
                <div className="question-header">
                  <h5>❓ Question:</h5>
                  <div className="question-action-buttons">
                    <button 
                      className="answer-btn"
                      onClick={() => {
                        if (answers[bookmark.questionKey]) {
                          // Toggle answer if it exists
                          setAnswers(prev => ({
                            ...prev,
                            [bookmark.questionKey]: prev[bookmark.questionKey] ? null : undefined
                          }))
                        } else {
                          handleGenerateAnswer(bookmark.questionKey, bookmark.questionText)
                        }
                      }}
                      title="Generate answer for this question"
                      disabled={loadingAnswers[bookmark.questionKey]}
                    >
                      {loadingAnswers[bookmark.questionKey] ? (
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
                    
                    {answers[bookmark.questionKey] && (
                      <button 
                        className="hide-answer-btn"
                        onClick={() => toggleAnswerVisibility(bookmark.questionKey)}
                        title={hiddenAnswers[bookmark.questionKey] ? "Show answer" : "Hide answer"}
                      >
                        {hiddenAnswers[bookmark.questionKey] ? (
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
                  </div>
                </div>
                <div 
                  className="question-text"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightSearchTerm(bookmark.questionText, searchQuery) 
                  }}
                />
                
                {answers[bookmark.questionKey] && !hiddenAnswers[bookmark.questionKey] && (
                  <div className={`answer-section ${focusedAnswer === bookmark.questionKey ? 'focused-answer' : ''}`}>
                    <div className="answer-header">
                      <h5>💡 Answer:</h5>
                      <div className="answer-actions">
                        <button 
                          className="copy-answer-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(answers[bookmark.questionKey])
                            toast.success('Answer copied to clipboard!', { icon: <Copy size={16} /> })
                          }}
                          title="Copy answer to clipboard"
                        >
                          <Copy size={12} />
                        </button>
                        <button 
                          className={`focus-answer-btn ${focusedAnswer === bookmark.questionKey ? 'active' : ''}`}
                          onClick={() => toggleFocusMode(bookmark.questionKey)}
                          title={focusedAnswer === bookmark.questionKey ? "Exit focus mode" : "Focus on this answer"}
                        >
                          <Focus size={12} />
                        </button>
                      </div>
                    </div>
                    <div 
                      className="answer-text"
                      dangerouslySetInnerHTML={{ 
                        __html: formatAnswerText(answers[bookmark.questionKey]) 
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BookmarksSection