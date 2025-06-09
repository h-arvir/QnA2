import { PDFProcessingService } from '../services/pdfProcessingService'
import { AIProcessingService } from '../services/aiProcessingService'
import { FileManagementService } from '../services/fileManagementService'

export const useFileProcessing = (state) => {
  const {
    setIsExtracting,
    setIsOCRProcessing,
    setIsAutoProcessing,
    setOverallProgress,
    setExtractionStatus,
    setProcessingProgress,
    setExtractedText,
    setErrorMessage,
    setCleanedQuestions,
    setActiveSection,
    geminiApiKey
  } = state

  const processMultiplePDFs = async (files) => {
    setIsExtracting(true)
    setIsOCRProcessing(false)
    setIsAutoProcessing(false)
    setOverallProgress(0)
    setExtractionStatus(`Starting to process ${files.length} PDF files...`)
    
    // Initialize progress tracking for each file
    const initialProgress = FileManagementService.initializeFileProgress(files)
    setProcessingProgress(initialProgress)
    
    try {
      // Process all files in parallel
      const processingPromises = files.map((file, index) => 
        PDFProcessingService.extractTextFromSinglePDF(
          file, 
          index, 
          files.length,
          (fileName, progress) => {
            if (fileName === 'overall') {
              setOverallProgress(progress)
            } else {
              setProcessingProgress(prev => ({
                ...prev,
                [fileName]: progress
              }))
            }
          }
        )
      )
      
      const results = await Promise.allSettled(processingPromises)
      
      // Combine all successful results
      const combinedResult = FileManagementService.combineFileResults(results, files)
      
      if (combinedResult.hasContent) {
        setExtractedText(combinedResult.combinedText)
        setExtractionStatus(`Successfully processed ${combinedResult.successCount} of ${files.length} PDF files!`)
        
        // Automatically process combined text with AI
        await autoProcessWithGemini(combinedResult.combinedText)
      } else {
        setErrorMessage(`Failed to extract text from all ${files.length} PDF files.`)
      }
      
      setOverallProgress(100)
      
    } catch (error) {
      console.error('Error processing multiple PDFs:', error)
      setErrorMessage(`Error processing PDF files: ${error.message}`)
    } finally {
      setIsExtracting(false)
      setIsOCRProcessing(false)
    }
  }

  const extractTextFromPDF = async (file) => {
    setIsExtracting(true)
    setExtractedText('')
    setIsOCRProcessing(false)
    setErrorMessage('')
    
    try {
      const extractedText = await PDFProcessingService.extractTextFromPDF(
        file,
        (status) => setExtractionStatus(status)
      )
      
      setExtractedText(extractedText)
      // Automatically process with AI after text extraction
      await autoProcessWithGemini(extractedText)
    } catch (error) {
      setErrorMessage(error.message)
      setExtractedText('')
      setExtractionStatus('')
    } finally {
      setIsExtracting(false)
      setIsOCRProcessing(false)
    }
  }

  const autoProcessWithGemini = async (text) => {
    if (!geminiApiKey.trim()) {
      setErrorMessage('Please enter your Google Gemini API key to automatically process the extracted text.')
      return
    }

    setIsAutoProcessing(true)
    setErrorMessage('')

    try {
      const cleanedText = await AIProcessingService.processTextWithGemini(
        text,
        geminiApiKey,
        (status) => setExtractionStatus(status)
      )

      setCleanedQuestions(cleanedText)
      // Navigate to questions section after successful processing
      setTimeout(() => setActiveSection('questions'), 2000)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsAutoProcessing(false)
    }
  }

  const processTextWithGemini = async (text) => {
    if (!geminiApiKey.trim()) {
      setErrorMessage('Please enter your Google Gemini API key to process the text.')
      return
    }

    setErrorMessage('')

    try {
      const cleanedText = await AIProcessingService.processTextWithGemini(
        text,
        geminiApiKey,
        (status) => setExtractionStatus(status)
      )

      setCleanedQuestions(cleanedText)
      // Navigate to questions section after successful processing
      setTimeout(() => setActiveSection('questions'), 2000)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  return {
    processMultiplePDFs,
    extractTextFromPDF,
    autoProcessWithGemini,
    processTextWithGemini
  }
}