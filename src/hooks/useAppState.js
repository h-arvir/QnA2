import { useState } from 'react'

export const useAppState = () => {
  // Navigation state
  const [activeSection, setActiveSection] = useState('upload')
  
  // File management state
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadStatus, setUploadStatus] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Processing state
  const [extractedText, setExtractedText] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isOCRProcessing, setIsOCRProcessing] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [extractionStatus, setExtractionStatus] = useState('')
  
  // AI processing state
  const [cleanedQuestions, setCleanedQuestions] = useState('')
  const [isProcessingWithGemini, setIsProcessingWithGemini] = useState(false)
  const [isAutoProcessing, setIsAutoProcessing] = useState(false)
  
  // API key state
  const [geminiApiKey, setGeminiApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '')
  const [showApiKeyInput, setShowApiKeyInput] = useState(!import.meta.env.VITE_GEMINI_API_KEY)
  
  // Multiple file processing state
  const [processingProgress, setProcessingProgress] = useState({})
  const [fileResults, setFileResults] = useState({})
  const [overallProgress, setOverallProgress] = useState(0)
  
  // Question analysis state
  const [groupedQuestions, setGroupedQuestions] = useState([])
  const [isGroupingQuestions, setIsGroupingQuestions] = useState(false)

  // Reset functions
  const resetFileState = () => {
    setSelectedFiles([])
    setUploadStatus('')
    setExtractedText('')
    setIsOCRProcessing(false)
    setOcrProgress(0)
    setErrorMessage('')
    setExtractionStatus('')
    setCleanedQuestions('')
    setIsProcessingWithGemini(false)
    setIsAutoProcessing(false)
    setProcessingProgress({})
    setFileResults({})
    setOverallProgress(0)
    setGroupedQuestions([])
    setIsGroupingQuestions(false)
  }

  const resetProcessingState = () => {
    setExtractedText('')
    setErrorMessage('')
    setExtractionStatus('')
    setCleanedQuestions('')
    setFileResults({})
    setProcessingProgress({})
    setGroupedQuestions([])
  }

  return {
    // Navigation
    activeSection,
    setActiveSection,
    
    // File management
    selectedFiles,
    setSelectedFiles,
    uploadStatus,
    setUploadStatus,
    isDragOver,
    setIsDragOver,
    
    // Processing
    extractedText,
    setExtractedText,
    isExtracting,
    setIsExtracting,
    isOCRProcessing,
    setIsOCRProcessing,
    ocrProgress,
    setOcrProgress,
    errorMessage,
    setErrorMessage,
    extractionStatus,
    setExtractionStatus,
    
    // AI processing
    cleanedQuestions,
    setCleanedQuestions,
    isProcessingWithGemini,
    setIsProcessingWithGemini,
    isAutoProcessing,
    setIsAutoProcessing,
    
    // API key
    geminiApiKey,
    setGeminiApiKey,
    showApiKeyInput,
    setShowApiKeyInput,
    
    // Multiple file processing
    processingProgress,
    setProcessingProgress,
    fileResults,
    setFileResults,
    overallProgress,
    setOverallProgress,
    
    // Question analysis
    groupedQuestions,
    setGroupedQuestions,
    isGroupingQuestions,
    setIsGroupingQuestions,
    
    // Reset functions
    resetFileState,
    resetProcessingState
  }
}