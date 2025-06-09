import { useState } from 'react'
import './App.css'
import * as pdfjsLib from 'pdfjs-dist'
import { createWorker } from 'tesseract.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Import components
import FileUpload from './components/FileUpload'
import ApiKeySetup from './components/ApiKeySetup'
import ProcessingStatus from './components/ProcessingStatus'
import StatusMessage from './components/StatusMessage'
import ExtractedText from './components/ExtractedText'
import QuestionsList from './components/QuestionsList'
import QuestionAnalysis from './components/QuestionAnalysis'
import Timeline from './components/Timeline'
import Sidebar from './components/Sidebar'
import InstructionsSection from './components/InstructionsSection'

// Set up PDF.js worker - using local worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

function App() {
  // Navigation state
  const [activeSection, setActiveSection] = useState('upload')
  
  const [selectedFiles, setSelectedFiles] = useState([]) // Changed to array for multiple files
  const [uploadStatus, setUploadStatus] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [extractedText, setExtractedText] = useState('') // Keep for internal processing
  const [isExtracting, setIsExtracting] = useState(false)
  const [isOCRProcessing, setIsOCRProcessing] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [extractionStatus, setExtractionStatus] = useState('')
  const [cleanedQuestions, setCleanedQuestions] = useState('')
  const [isProcessingWithGemini, setIsProcessingWithGemini] = useState(false)
  const [isAutoProcessing, setIsAutoProcessing] = useState(false) // New state for auto-processing
  const [geminiApiKey, setGeminiApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '')
  const [showApiKeyInput, setShowApiKeyInput] = useState(!import.meta.env.VITE_GEMINI_API_KEY)
  
  // New states for multiple file processing
  const [processingProgress, setProcessingProgress] = useState({})
  const [fileResults, setFileResults] = useState({})
  const [overallProgress, setOverallProgress] = useState(0)
  
  // New states for question grouping
  const [groupedQuestions, setGroupedQuestions] = useState([])
  const [isGroupingQuestions, setIsGroupingQuestions] = useState(false)

  // Navigation items
  const navigationItems = [
    { id: 'instructions', label: 'Instructions', icon: '📋', component: 'InstructionsSection' },
    { id: 'apikey', label: 'Set up API Key', icon: '🔑', component: 'ApiKeySection' }
  ]

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    validateAndSetFiles(files)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)
    const files = Array.from(event.dataTransfer.files)
    validateAndSetFiles(files)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const validateAndSetFiles = (files) => {
    const validFiles = files.filter(file => file.type === 'application/pdf')
    const invalidFiles = files.filter(file => file.type !== 'application/pdf')
    
    if (validFiles.length === 0) {
      setSelectedFiles([])
      setUploadStatus('Please select valid PDF files.')
      setExtractedText('')
      setErrorMessage('')
      setExtractionStatus('')
      setCleanedQuestions('')
      setFileResults({})
      setProcessingProgress({})
      setGroupedQuestions([])
      return
    }
    
    if (invalidFiles.length > 0) {
      setUploadStatus(`${invalidFiles.length} non-PDF files were ignored. Processing ${validFiles.length} PDF files.`)
    } else {
      setUploadStatus('')
    }
    
    setSelectedFiles(validFiles)
    setErrorMessage('')
    setExtractionStatus('')
    setCleanedQuestions('') // Clear previous results
    setFileResults({})
    setProcessingProgress({})
    setGroupedQuestions([]) // Clear previous question groups
    
    // Start processing all files
    processMultiplePDFs(validFiles)
  }

  const processMultiplePDFs = async (files) => {
    setIsExtracting(true)
    setIsOCRProcessing(false)
    setIsAutoProcessing(false)
    setOverallProgress(0)
    setExtractionStatus(`Starting to process ${files.length} PDF files...`)
    
    // Initialize progress tracking for each file
    const initialProgress = {}
    files.forEach((file, index) => {
      initialProgress[file.name] = {
        status: 'waiting',
        progress: 0,
        text: '',
        error: null
      }
    })
    setProcessingProgress(initialProgress)
    
    try {
      // Process all files in parallel
      const processingPromises = files.map((file, index) => 
        extractTextFromSinglePDF(file, index, files.length)
      )
      
      const results = await Promise.allSettled(processingPromises)
      
      // Combine all successful results
      let combinedText = ''
      let successCount = 0
      let errorCount = 0
      
      results.forEach((result, index) => {
        const fileName = files[index].name
        if (result.status === 'fulfilled' && result.value) {
          combinedText += `\n\n=== ${fileName} ===\n${result.value}\n`
          successCount++
        } else {
          errorCount++
          console.error(`Failed to process ${fileName}:`, result.reason)
        }
      })
      
      if (combinedText.trim()) {
        setExtractedText(combinedText.trim())
        setExtractionStatus(`Successfully processed ${successCount} of ${files.length} PDF files!`)
        
        // Automatically process combined text with AI
        await autoProcessWithGemini(combinedText.trim())
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

  const initializeWorker = () => {
    // Worker is already set to local file, just log for debugging
    console.log('PDF.js worker initialized with:', pdfjsLib.GlobalWorkerOptions.workerSrc)
    return [pdfjsLib.GlobalWorkerOptions.workerSrc]
  }

  const extractTextFromPDF = async (file) => {
    setIsExtracting(true)
    setExtractedText('')
    setIsOCRProcessing(false)
    setOcrProgress(0)
    setErrorMessage('')
    setExtractionStatus('Loading PDF...')
    
    try {
      // Initialize worker sources
      const workerSources = initializeWorker()
      
      const arrayBuffer = await file.arrayBuffer()
      setExtractionStatus('Reading PDF document...')
      
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
      let fullText = ''
      let hasTextContent = false
      
      setExtractionStatus(`Processing ${pdf.numPages} pages...`)
      
      // First, try to extract text normally
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setExtractionStatus(`Extracting text from page ${pageNum} of ${pdf.numPages}...`)
        
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map(item => item.str).join(' ').trim()
        
        if (pageText.length > 0) {
          hasTextContent = true
          fullText += `Page ${pageNum}:\n${pageText}\n\n`
        }
      }
      
      // If no text was found, try OCR on images
      if (!hasTextContent || fullText.trim().length === 0) {
        console.log('No text content found, attempting OCR...')
        setExtractionStatus('No text found. Preparing OCR...')
        setIsExtracting(false)
        setIsOCRProcessing(true)
        
        const ocrText = await extractTextWithOCR(pdf)
        if (ocrText.includes('Error:')) {
          setErrorMessage(ocrText)
          setExtractedText('')
        } else {
          setExtractedText(ocrText)
          setExtractionStatus('OCR completed successfully!')
          // Automatically process with AI after OCR
          await autoProcessWithGemini(ocrText)
        }
      } else {
        setExtractedText(fullText.trim())
        setExtractionStatus(`Successfully extracted text from ${pdf.numPages} pages!`)
        // Automatically process with AI after text extraction
        await autoProcessWithGemini(fullText.trim())
      }
    } catch (error) {
      console.error('Error extracting text from PDF:', error)
      
      // Show appropriate error message
      let errorMsg = 'Failed to process PDF file. '
      
      if (error.name === 'InvalidPDFException') {
        errorMsg += 'The file appears to be corrupted or not a valid PDF.'
      } else if (error.name === 'MissingPDFException') {
        errorMsg += 'PDF file not found or empty.'
      } else if (error.name === 'UnexpectedResponseException') {
        errorMsg += 'Network error while loading PDF.'
      } else if (error.message && error.message.includes('Setting up fake worker failed')) {
        errorMsg += 'PDF worker failed to initialize. Please try refreshing the page.'
      } else if (error.message && error.message.includes('Failed to fetch dynamically imported module')) {
        errorMsg += 'Unable to load PDF processing components. Please try refreshing the page.'
      } else {
        errorMsg += `Error: ${error.message || 'Unknown error occurred.'}`
      }
      
      setErrorMessage(errorMsg)
      setExtractedText('')
      setExtractionStatus('')
    } finally {
      setIsExtracting(false)
      setIsOCRProcessing(false)
    }
  }

  const extractTextWithOCR = async (pdf) => {
    let worker = null
    let ocrText = ''
    
    try {
      setExtractionStatus('Initializing OCR engine...')
      worker = await createWorker('eng')
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setOcrProgress(Math.round((pageNum - 1) / pdf.numPages * 100))
        setExtractionStatus(`Processing page ${pageNum} of ${pdf.numPages} with OCR...`)
        
        try {
          const page = await pdf.getPage(pageNum)
          const viewport = page.getViewport({ scale: 2.0 })
          
          // Create canvas to render PDF page
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.height = viewport.height
          canvas.width = viewport.width 
          
          // Render PDF page to canvas
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise
          
          // Convert canvas to image data for OCR
          const imageData = canvas.toDataURL('image/png')
          
          // Perform OCR on the image
          const { data: { text } } = await worker.recognize(imageData)
          
          if (text.trim().length > 0) {
            ocrText += `Page ${pageNum} (OCR):\n${text.trim()}\n\n`
          } else {
            ocrText += `Page ${pageNum} (OCR): [No readable text found]\n\n`
          }
        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError)
          ocrText += `Page ${pageNum} (OCR): [Error processing page]\n\n`
        }
      }
      
      setOcrProgress(100)
      setExtractionStatus('OCR processing completed!')
      
      if (ocrText.trim().length === 0) {
        return 'Error: No text could be extracted from this PDF using OCR. The images might not contain readable text or the PDF might be corrupted.'
      }
      
      return ocrText.trim()
    } catch (error) {
      console.error('OCR Error:', error)
      let errorMsg = 'Error: OCR processing failed. '
      
      if (error.message.includes('network')) {
        errorMsg += 'Network error while downloading OCR models. Please check your internet connection.'
      } else if (error.message.includes('memory')) {
        errorMsg += 'Insufficient memory for OCR processing. Try with a smaller PDF.'
      } else {
        errorMsg += `${error.message || 'Unknown OCR error occurred.'}`
      }
      
      return errorMsg
    } finally {
      if (worker) {
        try {
          await worker.terminate()
        } catch (terminateError) {
          console.error('Error terminating OCR worker:', terminateError)
        }
      }
    }
  }

  const extractTextFromSinglePDF = async (file, fileIndex, totalFiles) => {
    const fileName = file.name
    
    // Update progress for this specific file
    const updateFileProgress = (status, progress = 0, error = null) => {
      setProcessingProgress(prev => ({
        ...prev,
        [fileName]: { status, progress, error }
      }))
      
      // Update overall progress
      const completedFiles = fileIndex
      const currentFileProgress = progress / 100
      const overallPercent = ((completedFiles + currentFileProgress) / totalFiles) * 100
      setOverallProgress(Math.round(overallPercent))
    }
    
    try {
      updateFileProgress('processing', 0)
      
      const arrayBuffer = await file.arrayBuffer()
      updateFileProgress('reading', 20)
      
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
      let fullText = ''
      let hasTextContent = false
      
      updateFileProgress('extracting', 40)
      
      // First, try to extract text normally
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map(item => item.str).join(' ').trim()
        
        if (pageText.length > 0) {
          hasTextContent = true
          fullText += `Page ${pageNum}:\n${pageText}\n\n`
        }
        
        // Update progress based on page extraction
        const pageProgress = 40 + (pageNum / pdf.numPages) * 40
        updateFileProgress('extracting', Math.round(pageProgress))
      }
      
      // If no text was found, try OCR on images
      if (!hasTextContent || fullText.trim().length === 0) {
        updateFileProgress('ocr', 80)
        const ocrText = await extractTextWithOCRSingle(pdf, fileName, updateFileProgress)
        
        if (ocrText.includes('Error:')) {
          updateFileProgress('error', 100, ocrText)
          throw new Error(ocrText)
        } else {
          updateFileProgress('completed', 100)
          return ocrText
        }
      } else {
        updateFileProgress('completed', 100)
        return fullText.trim()
      }
    } catch (error) {
      console.error(`Error extracting text from ${fileName}:`, error)
      updateFileProgress('error', 100, error.message)
      throw error
    }
  }

  const extractTextWithOCRSingle = async (pdf, fileName, updateProgress) => {
    let worker = null
    let ocrText = ''
    
    try {
      worker = await createWorker('eng')
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum)
          const viewport = page.getViewport({ scale: 2.0 })
          
          // Create canvas to render PDF page
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.height = viewport.height
          canvas.width = viewport.width
          
          // Render PDF page to canvas
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise
          
          // Convert canvas to image data for OCR
          const imageData = canvas.toDataURL('image/png')
          
          // Perform OCR on the image
          const { data: { text } } = await worker.recognize(imageData)
          
          if (text.trim().length > 0) {
            ocrText += `Page ${pageNum} (OCR):\n${text.trim()}\n\n`
          } else {
            ocrText += `Page ${pageNum} (OCR): [No readable text found]\n\n`
          }
          
          // Update progress
          const ocrProgress = 80 + (pageNum / pdf.numPages) * 20
          updateProgress('ocr', Math.round(ocrProgress))
          
        } catch (pageError) {
          console.error(`Error processing page ${pageNum} of ${fileName}:`, pageError)
          ocrText += `Page ${pageNum} (OCR): [Error processing page]\n\n`
        }
      }
      
      if (ocrText.trim().length === 0) {
        return `Error: No text could be extracted from ${fileName} using OCR. The images might not contain readable text or the PDF might be corrupted.`
      }
      
      return ocrText.trim()
    } catch (error) {
      console.error(`OCR Error for ${fileName}:`, error)
      let errorMsg = `Error: OCR processing failed for ${fileName}. `
      
      if (error.message.includes('network')) {
        errorMsg += 'Network error while downloading OCR models. Please check your internet connection.'
      } else if (error.message.includes('memory')) {
        errorMsg += 'Insufficient memory for OCR processing. Try with a smaller PDF.'
      } else {
        errorMsg += `${error.message || 'Unknown OCR error occurred.'}`
      }
      
      return errorMsg
    } finally {
      if (worker) {
        try {
          await worker.terminate()
        } catch (terminateError) {
          console.error(`Error terminating OCR worker for ${fileName}:`, terminateError)
        }
      }
    }
  }

  const autoProcessWithGemini = async (text) => {
    if (!geminiApiKey.trim()) {
      setErrorMessage('Please enter your Google Gemini API key to automatically process the extracted text.')
      return
    }

    setIsAutoProcessing(true)
    setIsProcessingWithGemini(true)
    setErrorMessage('')
    setExtractionStatus('Automatically processing text with Google Gemini AI...')

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey.trim())
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const prompt = `You are given OCR-scanned text from a question paper. The text is unstructured and may contain grammar errors, layout issues, and irrelevant content like instructions or metadata.

Your task is to:
1.Extract only the exam questions, and remove all other non-question content (instructions, titles, page numbers, etc).
2.Ensure each question starts on a new line, and is numbered correctly.
3.Fix grammar, spelling, and punctuation issues only for the questions.
4.Maintain the original section headers (e.g., Section A, Section B) if they exist.
5.Do not add or invent any content.

Here is the OCR text to process:

${text}`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const cleanedText = response.text()

      setCleanedQuestions(cleanedText)
      setExtractionStatus('Text successfully processed and cleaned with Google Gemini AI!')
      // Navigate to questions section after successful processing
      setTimeout(() => setActiveSection('questions'), 2000)
    } catch (error) {
      console.error('Gemini API Error:', error)
      let errorMsg = 'Failed to automatically process text with Google Gemini AI. '
      
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
        errorMsg += 'Invalid API key. Please check your Google Gemini API key.'
      } else if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('429')) {
        errorMsg += 'API quota exceeded. Please check your usage limits.'
      } else if (error.message.includes('SAFETY')) {
        errorMsg += 'Content was blocked by safety filters.'
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        errorMsg += 'Model not available. The API might have been updated. Please try again or contact support.'
      } else if (error.message.includes('403')) {
        errorMsg += 'Access forbidden. Please check your API key permissions.'
      } else if (error.message.includes('500')) {
        errorMsg += 'Server error. Please try again in a few moments.'
      } else {
        errorMsg += `Error: ${error.message || 'Unknown error occurred.'}`
      }
      
      setErrorMessage(errorMsg)
    } finally {
      setIsAutoProcessing(false)
      setIsProcessingWithGemini(false)
    }
  }

  const processTextWithGemini = async (text) => {
    if (!geminiApiKey.trim()) {
      setErrorMessage('Please enter your Google Gemini API key to process the text.')
      return
    }

    setIsProcessingWithGemini(true)
    setErrorMessage('')
    setExtractionStatus('Processing text with Google Gemini AI...')

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey.trim())
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const prompt = `You are given OCR-scanned text from a question paper. The text is unstructured and may contain grammar errors, layout issues, and irrelevant content like instructions or metadata.

Your task is to:
1.Extract only the exam questions, and remove all other non-question content (instructions, titles, page numbers, etc).
2.Ensure each question starts on a new line, and is numbered correctly.
3.Fix grammar, spelling, and punctuation issues only for the questions.
4.Maintain the original section headers (e.g., Section A, Section B) if they exist.
5.Do not add or invent any content.

Here is the OCR text to process:

${text}`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const cleanedText = response.text()

      setCleanedQuestions(cleanedText)
      setExtractionStatus('Text successfully processed with Google Gemini AI!')
      // Navigate to questions section after successful processing
      setTimeout(() => setActiveSection('questions'), 2000)
    } catch (error) {
      console.error('Gemini API Error:', error)
      let errorMsg = 'Failed to process text with Google Gemini AI. '
      
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
        errorMsg += 'Invalid API key. Please check your Google Gemini API key.'
      } else if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('429')) {
        errorMsg += 'API quota exceeded. Please check your usage limits.'
      } else if (error.message.includes('SAFETY')) {
        errorMsg += 'Content was blocked by safety filters.'
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        errorMsg += 'Model not available. The API might have been updated. Please try again or contact support.'
      } else if (error.message.includes('403')) {
        errorMsg += 'Access forbidden. Please check your API key permissions.'
      } else if (error.message.includes('500')) {
        errorMsg += 'Server error. Please try again in a few moments.'
      } else {
        errorMsg += `Error: ${error.message || 'Unknown error occurred.'}`
      }
      
      setErrorMessage(errorMsg)
    } finally {
      setIsProcessingWithGemini(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setUploadStatus('Please select PDF files first.')
      return
    }

    setUploadStatus('Uploading...')
    
    // Simulate upload process (replace with actual upload logic)
    try {
      // Create FormData for file upload
      const formData = new FormData()
      selectedFiles.forEach((file, index) => {
        formData.append(`pdf_${index}`, file)
      })
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Here you would typically make an API call to your backend
      // const response = await fetch('/api/upload', {
      //   method: 'POST',
      //   body: formData
      // })
      
      setUploadStatus(`${selectedFiles.length} PDF files uploaded successfully!`)
      console.log('Files uploaded:', selectedFiles.map(f => f.name))
      
    } catch (error) {
      setUploadStatus('Upload failed. Please try again.')
      console.error('Upload error:', error)
    }
  }

  const handleRemoveFile = (fileToRemove = null) => {
    if (fileToRemove) {
      // Remove specific file
      setSelectedFiles(prev => prev.filter(file => file !== fileToRemove))
    } else {
      // Remove all files
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
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }



  // Function to analyze and group questions using Gemini AI
  const analyzeQuestions = async (cleanedText) => {
    if (!cleanedText || cleanedText.trim().length === 0) {
      setGroupedQuestions([])
      return
    }

    if (!geminiApiKey.trim()) {
      setErrorMessage('Please enter your Google Gemini API key to analyze questions.')
      return
    }

    try {
      setIsGroupingQuestions(true)
      setErrorMessage('')
      setExtractionStatus('Analyzing questions with AI...')

      const genAI = new GoogleGenerativeAI(geminiApiKey.trim())
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const prompt = `You are an intelligent assistant that analyzes a block of OCR-extracted exam questions. Your task is as follows:

1. Group similar or semantically related questions together. Use moderate semantic similarity (not just exact matches), grouping questions that are conceptually the same even if phrased differently.
2. For each group, create a **single, unified question** that represents the main intent of all questions in that group.
3. Also mention all the questions that were grouped together in the unified question in indented bullet points.
4. Count how many questions are in each group (how many times similar questions appear).

Format your output as:
Group 1:
Question Count: <number of similar questions in this group>
Unified Question: <merged version>
  Individual Questions: <list of original questions in this group, indented>

Group 2:
Question Count: <number of similar questions in this group>
Unified Question: <merged version>
  Individual Questions: <list of original questions in this group, indented>
… and so on.

Here are the extracted questions to analyze:

${cleanedText}`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const analysisResult = response.text()

      // Parse the AI response into structured groups
      const groups = parseAIAnalysisResponse(analysisResult)
      
      setGroupedQuestions(groups)
      setExtractionStatus(`AI analysis complete! Found ${groups.length} question groups with unified questions and repetition counts.`)
      // Navigate to analysis section after successful analysis
      setTimeout(() => setActiveSection('analysis'), 2000)
      
    } catch (error) {
      console.error('Error analyzing questions with AI:', error)
      let errorMsg = 'Failed to analyze questions with AI. '
      
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
        errorMsg += 'Invalid API key. Please check your Google Gemini API key.'
      } else if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('429')) {
        errorMsg += 'API quota exceeded. Please check your usage limits.'
      } else if (error.message.includes('SAFETY')) {
        errorMsg += 'Content was blocked by safety filters.'
      } else {
        errorMsg += `Error: ${error.message || 'Unknown error occurred.'}`
      }
      
      setErrorMessage(errorMsg)
    } finally {
      setIsGroupingQuestions(false)
    }
  }

  // Function to parse AI analysis response into structured groups
  const parseAIAnalysisResponse = (analysisText) => {
    const groups = []
    
    // Split by "Group X:" pattern
    const groupSections = analysisText.split(/Group \d+:/i).filter(section => section.trim().length > 0)
    
    groupSections.forEach((section, index) => {
      const lines = section.trim().split('\n').filter(line => line.trim().length > 0)
      
      let questionCount = 1
      let unifiedQuestion = ''
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        
        if (trimmedLine.toLowerCase().startsWith('question count:')) {
          const countMatch = trimmedLine.match(/question count:\s*(\d+)/i)
          if (countMatch) {
            questionCount = parseInt(countMatch[1], 10)
          }
        } else if (trimmedLine.toLowerCase().startsWith('unified question:')) {
          unifiedQuestion = trimmedLine.replace(/^unified question:\s*/i, '').trim()
        } else if (unifiedQuestion && trimmedLine.length > 0 && !trimmedLine.toLowerCase().startsWith('group ')) {
          // Continue building the unified question if it spans multiple lines
          unifiedQuestion += ' ' + trimmedLine
        }
      }
      
      if (unifiedQuestion.trim().length > 0) {
        groups.push({
          groupNumber: index + 1,
          unifiedQuestion: unifiedQuestion.trim(),
          count: questionCount
        })
      }
    })
    
    return groups
  }

  // Component sections


  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        navigationItems={navigationItems}
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
          {activeSection === 'upload' && (
            <FileUpload
              selectedFiles={selectedFiles}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              uploadStatus={uploadStatus}
              onUpload={handleUpload}
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

          {activeSection === 'questions' && (
            <QuestionsList
              cleanedQuestions={cleanedQuestions}
              extractedText={extractedText}
              onProcessWithGemini={processTextWithGemini}
              onAnalyzeQuestions={analyzeQuestions}
              isProcessingWithGemini={isProcessingWithGemini}
              isGroupingQuestions={isGroupingQuestions}
              geminiApiKey={geminiApiKey}
              onNavigateToUpload={() => setActiveSection('upload')}
              groupedQuestions={groupedQuestions}
            />
          )}
          {activeSection === 'analysis' && (
            <QuestionAnalysis
              groupedQuestions={groupedQuestions}
              isGroupingQuestions={isGroupingQuestions}
              onNavigateToQuestions={() => setActiveSection('questions')}
            />
          )}
          {activeSection === 'instructions' && (
            <InstructionsSection
              onNavigateToSection={setActiveSection}
            />
          )}
          {activeSection === 'apikey' && (
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
