import './App.css'

// Import components
import FileUpload from './components/FileUpload'
import ApiKeySetup from './components/ApiKeySetup'
import QuestionsList from './components/QuestionsList'
import QuestionAnalysis from './components/QuestionAnalysis'
import Timeline from './components/Timeline'
import Sidebar from './components/Sidebar'
import InstructionsSection from './components/InstructionsSection'

// Import custom hooks
import { useAppState } from './hooks/useAppState'
import { useFileProcessing } from './hooks/useFileProcessing'
import { useFileManagement } from './hooks/useFileManagement'
import { useQuestionAnalysis } from './hooks/useQuestionAnalysis'

// Import constants
import { NAVIGATION_ITEMS, SECTION_IDS } from './constants/appConstants'

function App() {
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
    isGroupingQuestions
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
      {/* Sidebar Navigation */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        navigationItems={NAVIGATION_ITEMS}
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
        </div>
      </main>
    </div>
  )
}

export default App