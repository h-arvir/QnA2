import { useState } from 'react'
import './App.css'
import * as pdfjsLib from 'pdfjs-dist'
import { createWorker } from 'tesseract.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Set up PDF.js worker - using local worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

function App() {
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
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="app">
      <div className="container">
        <h1>PDF Upload & Text Extraction</h1>
        <p className="subtitle">Upload your PDF documents and extract text with OCR support</p>
        
        <div 
          className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="upload-content">
            <div className="upload-icon">📄</div>
            <h3>Drag & Drop your PDFs here</h3>
            <p>or</p>
            <label htmlFor="file-input" className="file-input-label">
              Choose Files
            </label>
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              className="file-input"
            />
            <p className="file-info">Select multiple PDF files for batch processing</p>
          </div>
        </div>

        {/* Google Gemini API Key Section */}
        <div className="api-key-section">
          <div className="api-key-header">
            <h3>🤖 AI Text Processing</h3>
            <button 
              className="toggle-api-key-btn"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            >
              {showApiKeyInput ? 'Hide' : 'Setup'} API Key
            </button>
          </div>
          
          {showApiKeyInput && (
            <div className="api-key-input-container">
              <label htmlFor="gemini-api-key">Google Gemini API Key:</label>
              <input
                id="gemini-api-key"
                type="password"
                placeholder="Enter your Google Gemini API key"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="api-key-input"
              />
              <p className="api-key-info">
                Get your free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
              </p>
            </div>
          )}
        </div>

        {selectedFiles && selectedFiles.length > 0 && (
          <div className="files-preview">
            <div className="files-header">
              <h3>Selected Files ({selectedFiles.length})</h3>
              <button 
                className="remove-all-btn"
                onClick={() => handleRemoveFile()}
                title="Remove all files"
              >
                Clear All
              </button>
            </div>
            <div className="files-list">
              {selectedFiles.map((file, index) => (
                <div key={index} className="file-details">
                  <div className="file-icon">📄</div>
                  <div className="file-info-details">
                    <h4>{file.name}</h4>
                    <p>{formatFileSize(file.size)}</p>
                    {processingProgress[file.name] && (
                      <div className="file-progress">
                        <span className="progress-status">
                          {processingProgress[file.name].status === 'waiting' && '⏳ Waiting...'}
                          {processingProgress[file.name].status === 'processing' && '🔄 Processing...'}
                          {processingProgress[file.name].status === 'reading' && '📖 Reading...'}
                          {processingProgress[file.name].status === 'extracting' && '📝 Extracting...'}
                          {processingProgress[file.name].status === 'ocr' && '🔍 OCR Processing...'}
                          {processingProgress[file.name].status === 'completed' && '✅ Completed'}
                          {processingProgress[file.name].status === 'error' && '❌ Error'}
                        </span>
                        <div className="progress-bar-small">
                          <div 
                            className="progress-fill-small" 
                            style={{ width: `${processingProgress[file.name].progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveFile(file)}
                    title="Remove this file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadStatus && (
          <div className={`status-message ${uploadStatus.includes('success') ? 'success' : uploadStatus.includes('failed') ? 'error' : 'info'}`}>
            {uploadStatus}
          </div>
        )}

        <button 
          className="upload-btn"
          onClick={handleUpload}
          disabled={!selectedFiles || selectedFiles.length === 0 || uploadStatus === 'Uploading...'}
        >
          {uploadStatus === 'Uploading...' ? 'Uploading...' : `Upload ${selectedFiles.length || 0} PDF${selectedFiles.length !== 1 ? 's' : ''}`}
        </button>

        {/* Error Message */}
        {errorMessage && (
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <h3>Processing Error</h3>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Extraction Status */}
        {extractionStatus && !errorMessage && (
          <div className="status-message info">
            <div className="status-icon">ℹ️</div>
            <p>{extractionStatus}</p>
          </div>
        )}

        {/* Processing Status Section */}
        {(isExtracting || isOCRProcessing || isAutoProcessing) && (
          <div className="text-extraction-section">
            <h2>Processing {selectedFiles.length > 1 ? `${selectedFiles.length} PDFs` : 'PDF'}</h2>
            {isExtracting ? (
              <div className="extraction-loading">
                <div className="loading-spinner"></div>
                <p>{extractionStatus || 'Extracting text from PDFs...'}</p>
                {selectedFiles.length > 1 && (
                  <div className="overall-progress">
                    <p>Overall Progress: {overallProgress}%</p>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${overallProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ) : isOCRProcessing ? (
              <div className="extraction-loading">
                <div className="loading-spinner"></div>
                <p>{extractionStatus || `Running OCR on PDF images... (${ocrProgress}%)`}</p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${ocrProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : isAutoProcessing ? (
              <div className="extraction-loading">
                <div className="loading-spinner"></div>
                <p>{extractionStatus || 'Processing text with AI...'}</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Cleaned Questions Section */}
        {cleanedQuestions && (
          <div className="cleaned-questions-section">
            <h2>📄 Extracted Questions</h2>
            <div className="cleaned-questions-container">
              <div className="text-controls">
                <button 
                  className="copy-btn"
                  onClick={() => navigator.clipboard.writeText(cleanedQuestions)}
                  title="Copy questions to clipboard"
                >
                  📋 Copy Questions
                </button>
                {/* Optional: Add manual re-process button for edge cases */}
                <button 
                  className="process-gemini-btn"
                  onClick={() => processTextWithGemini(extractedText)}
                  title="Re-process with AI if needed"
                  disabled={!extractedText || isProcessingWithGemini || !geminiApiKey.trim()}
                >
                  {isProcessingWithGemini ? '🔄 Re-processing...' : '🔄 Re-process'}
                </button>
              </div>
              <div className="cleaned-questions-text">
                <pre>{cleanedQuestions}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Fallback: Show raw text if AI processing failed and no cleaned questions */}
        {extractedText && !cleanedQuestions && !isExtracting && !isOCRProcessing && !isAutoProcessing && (
          <div className="text-extraction-section">
            <h2>📄 Raw Extracted Text</h2>
            <div className="api-key-warning">
              <p>⚠️ AI processing was not completed. Please set up your Google Gemini API key above to automatically clean and format the extracted text.</p>
            </div>
            <div className="extracted-text-container">
              <div className="text-controls">
                <button 
                  className="copy-btn"
                  onClick={() => navigator.clipboard.writeText(extractedText)}
                  title="Copy raw text to clipboard"
                  disabled={!extractedText}
                >
                  📋 Copy Raw Text
                </button>
                <button 
                  className="process-gemini-btn"
                  onClick={() => processTextWithGemini(extractedText)}
                  title="Process with Google Gemini AI"
                  disabled={!extractedText || isProcessingWithGemini || !geminiApiKey.trim()}
                >
                  {isProcessingWithGemini ? '🔄 Processing...' : '🤖 Clean with AI'}
                </button>
              </div>
              <div className="extracted-text">
                <pre>{extractedText}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
