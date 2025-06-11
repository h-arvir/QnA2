import './styles/index.css'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'

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
    setGroupViewModes
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
    <div className="app">
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
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            fontFamily: 'var(--font-family)',
            fontSize: 'var(--text-sm)',
            fontWeight: '500',
            padding: '16px 20px',
            maxWidth: '400px',
            backdropFilter: 'blur(10px)',
          },
          success: {
            duration: 3000,
            style: {
              background: 'var(--success-50)',
              color: 'var(--success-700)',
              border: '1px solid var(--success-200)',
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
          )}

          {activeSection === SECTION_IDS.QUESTIONS && (
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
          )}

          {activeSection === SECTION_IDS.ANALYSIS && (
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
            />
          )}

          {activeSection === SECTION_IDS.INSTRUCTIONS && (
            <InstructionsSection
              onNavigateToSection={setActiveSection}
            />
          )}

          {activeSection === SECTION_IDS.API_KEY && (
            <ApiKeySetup
              geminiApiKey={geminiApiKey}
              onApiKeyChange={setGeminiApiKey}
              showApiKeyInput={showApiKeyInput}
              onToggleApiKeyInput={() => setShowApiKeyInput(!showApiKeyInput)}
              isInline={false}
            />
          )}

          {activeSection === SECTION_IDS.CACHE && (
            <CacheManagement />
          )}
        </div>
      </main>
    </div>
  )
}

export default App