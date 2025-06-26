import React, { useEffect } from 'react'
import './styles/index.css'
import { Toaster } from 'react-hot-toast'

// Import services
import { CacheService } from './services/cacheService'

// Import components
import FileUpload from './components/FileUpload'
import ApiKeySetup from './components/ApiKeySetup'
import QuestionsList from './components/QuestionsList'
import QuestionAnalysis from './components/QuestionAnalysis'
import Timeline from './components/Timeline'
import Sidebar from './components/Sidebar'
import InstructionsSection from './components/InstructionsSection'
import FloatingNavigation from './components/FloatingNavigation'
import CacheManagement from './components/CacheManagement'
import BookmarksSection from './components/BookmarksSection'
import ToggleControls from './components/ToggleControls'
import ClickSpark from './components/ClickSpark'

// Import custom hooks
import { useAppState } from './hooks/useAppState'
import { useFileProcessing } from './hooks/useFileProcessing'
import { useFileManagement } from './hooks/useFileManagement'
import { useQuestionAnalysis } from './hooks/useQuestionAnalysis'

// Import constants
import { NAVIGATION_ITEMS, SECTION_IDS } from './constants/appConstants'

function App() {
  // Initialize cache service on app startup
  useEffect(() => {
    const initializeCache = async () => {
      try {
        const stats = CacheService.initialize()
        console.log('Cache Service initialized:', stats)
      } catch (error) {
        console.error('Failed to initialize cache service:', error)
      }
    }
    
    initializeCache()
  }, [])

  // Initialize state management
  const state = useAppState()
  
  // Initialize processing hooks
  const fileProcessing = useFileProcessing(state)
  const fileManagement = useFileManagement(state, fileProcessing)
  const questionAnalysis = useQuestionAnalysis(state)

  // Destructure commonly used state
  const {
    activeSection,
    setActiveSection,
    selectedFiles,
    uploadStatus,
    isDragOver,
    processingProgress,
    isExtracting,
    isOCRProcessing,
    isAutoProcessing,
    extractionStatus,
    ocrProgress,
    overallProgress,
    errorMessage,
    geminiApiKey,
    setGeminiApiKey,
    showApiKeyInput,
    setShowApiKeyInput,
    extractedText,
    cleanedQuestions,
    groupedQuestions,
    isProcessingWithGemini,
    isGroupingQuestions,
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
  } = state

  const {
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleUpload,
    handleRemoveFile
  } = fileManagement

  const { processTextWithGemini } = fileProcessing
  const { analyzeQuestions } = questionAnalysis

  return (
    <ClickSpark
      sparkColor='#E3618C'
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      <div className="app">
        {/* Toggle Controls */}
        <div className="floating-theme-toggle">
          <ToggleControls />
        </div>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          gutter={12}
          containerStyle={{
            top: 20,
            right: 20,
          }}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-glass)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--text-sm)',
              fontWeight: '500',
              padding: '16px 20px',
              maxWidth: '400px',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden',
            },
            success: {
              duration: 3000,
              style: {
                background: 'var(--success-50)',
                color: 'var(--success-700)',
                border: '1px solid var(--success-200)',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)',
              },
              iconTheme: {
                primary: 'var(--success-500)',
                secondary: 'var(--success-50)',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: 'var(--error-50)',
                color: 'var(--error-700)',
                border: '1px solid var(--error-200)',
                boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15)',
              },
              iconTheme: {
                primary: 'var(--error-500)',
                secondary: 'var(--error-50)',
              },
            },
            loading: {
              style: {
                background: 'var(--info-50)',
                color: 'var(--info-700)',
                border: '1px solid var(--info-200)',
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)',
              },
              iconTheme: {
                primary: 'var(--info-500)',
                secondary: 'var(--info-50)',
              },
            },
          }}
        />

        {/* Sidebar Navigation */}
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          navigationItems={NAVIGATION_ITEMS}
        />

        {/* Floating Navigation */}
        <FloatingNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Main Content */}
        <main className="main-content">
          {/* PDF Processing Timeline - Always Visible */}
          <Timeline
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            selectedFiles={selectedFiles}
            cleanedQuestions={cleanedQuestions}
            groupedQuestions={groupedQuestions}
          />

          {/* Section Content */}
          <div className="section-wrapper">
            {activeSection === SECTION_IDS.UPLOAD && (
              <div className="section-content section-animate-in">
                <FileUpload
                  selectedFiles={selectedFiles}
                  onFileSelect={handleFileSelect}
                  onRemoveFile={handleRemoveFile}
                  uploadStatus={uploadStatus}
                  onUpload={() => handleUpload(selectedFiles)}
                  isDragOver={isDragOver}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  processingProgress={processingProgress}
                  // Processing status props
                  isExtracting={isExtracting}
                  isOCRProcessing={isOCRProcessing}
                  isAutoProcessing={isAutoProcessing}
                  extractionStatus={extractionStatus}
                  ocrProgress={ocrProgress}
                  overallProgress={overallProgress}
                  errorMessage={errorMessage}
                  // API key props
                  geminiApiKey={geminiApiKey}
                  onApiKeyChange={setGeminiApiKey}
                  showApiKeyInput={showApiKeyInput}
                  onToggleApiKeyInput={() => setShowApiKeyInput(!showApiKeyInput)}
                  // Extracted text props
                  extractedText={extractedText}
                  onProcessWithGemini={processTextWithGemini}
                  isProcessingWithGemini={isProcessingWithGemini}
                  cleanedQuestions={cleanedQuestions}
                />
              </div>
            )}

            {activeSection === SECTION_IDS.QUESTIONS && (
              <div className="section-content section-animate-in">
                <QuestionsList
                  cleanedQuestions={cleanedQuestions}
                  extractedText={extractedText}
                  onProcessWithGemini={processTextWithGemini}
                  onAnalyzeQuestions={analyzeQuestions}
                  isProcessingWithGemini={isProcessingWithGemini}
                  isGroupingQuestions={isGroupingQuestions}
                  geminiApiKey={geminiApiKey}
                  onNavigateToUpload={() => setActiveSection(SECTION_IDS.UPLOAD)}
                  groupedQuestions={groupedQuestions}
                />
              </div>
            )}

            {activeSection === SECTION_IDS.ANALYSIS && (
              <div className="section-content section-animate-in">
                <QuestionAnalysis
                  groupedQuestions={groupedQuestions}
                  isGroupingQuestions={isGroupingQuestions}
                  onNavigateToQuestions={() => setActiveSection(SECTION_IDS.QUESTIONS)}
                  geminiApiKey={geminiApiKey}
                  extractedText={extractedText}
                  cleanedQuestions={cleanedQuestions}
                  answers={answers}
                  setAnswers={setAnswers}
                  loadingAnswers={loadingAnswers}
                  setLoadingAnswers={setLoadingAnswers}
                  hiddenAnswers={hiddenAnswers}
                  setHiddenAnswers={setHiddenAnswers}
                  groupViewModes={groupViewModes}
                  setGroupViewModes={setGroupViewModes}
                  bookmarkedQuestions={bookmarkedQuestions}
                  setBookmarkedQuestions={setBookmarkedQuestions}
                />
              </div>
            )}

            {activeSection === SECTION_IDS.INSTRUCTIONS && (
              <div className="section-content section-animate-in">
                <InstructionsSection
                  onNavigateToSection={setActiveSection}
                />
              </div>
            )}

            {activeSection === SECTION_IDS.API_KEY && (
              <div className="section-content section-animate-in">
                <ApiKeySetup
                  geminiApiKey={geminiApiKey}
                  onApiKeyChange={setGeminiApiKey}
                  showApiKeyInput={showApiKeyInput}
                  onToggleApiKeyInput={() => setShowApiKeyInput(!showApiKeyInput)}
                  isInline={false}
                />
              </div>
            )}

            {activeSection === SECTION_IDS.BOOKMARKS && (
              <div className="section-content section-animate-in">
                <BookmarksSection
                  bookmarkedQuestions={bookmarkedQuestions}
                  setBookmarkedQuestions={setBookmarkedQuestions}
                  geminiApiKey={geminiApiKey}
                  extractedText={extractedText}
                  cleanedQuestions={cleanedQuestions}
                  answers={answers}
                  setAnswers={setAnswers}
                  loadingAnswers={loadingAnswers}
                  setLoadingAnswers={setLoadingAnswers}
                  hiddenAnswers={hiddenAnswers}
                  setHiddenAnswers={setHiddenAnswers}
                  onNavigateToSection={setActiveSection}
                />
              </div>
            )}

            {activeSection === SECTION_IDS.CACHE && (
              <div className="section-content section-animate-in">
                <CacheManagement />
              </div>
            )}
          </div>
        </main>
      </div>
    </ClickSpark>
  )
}

export default App