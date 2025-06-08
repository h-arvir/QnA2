import { useState } from 'react'
import './App.css'
import * as pdfjsLib from 'pdfjs-dist'
import { createWorker } from 'tesseract.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Set up PDF.js worker - using local worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isOCRProcessing, setIsOCRProcessing] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [extractionStatus, setExtractionStatus] = useState('')
  const [cleanedQuestions, setCleanedQuestions] = useState('')
  const [isProcessingWithGemini, setIsProcessingWithGemini] = useState(false)
  const [geminiApiKey, setGeminiApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '')
  const [showApiKeyInput, setShowApiKeyInput] = useState(!import.meta.env.VITE_GEMINI_API_KEY)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    validateAndSetFile(file)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)
    const file = event.dataTransfer.files[0]
    validateAndSetFile(file)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const validateAndSetFile = (file) => {
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setUploadStatus('')
      setErrorMessage('')
      setExtractionStatus('')
      extractTextFromPDF(file)
    } else {
      setSelectedFile(null)
      setUploadStatus('Please select a valid PDF file.')
      setExtractedText('')
      setErrorMessage('')
      setExtractionStatus('')
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
        }
      } else {
        setExtractedText(fullText.trim())
        setExtractionStatus(`Successfully extracted text from ${pdf.numPages} pages!`)
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
      const model = genAI.getGenerativeModel({ model: "gemini-pro" })

      const prompt = `You are given OCR-scanned text from a question paper. The text is unstructured and contains grammar errors, typos, and layout issues.
Your task is to:
1. Correct grammar, fix punctuation, and clean up any misspellings.
2. Convert the text into a well-formatted list of exam questions.
3. Ensure each question is complete, coherent, and starts on a new line.
4. Maintain the original sections (Section A, Section B, Section C).
5. Keep original question numbering where possible.
6. Do not invent or add content. Only rephrase for clarity.

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
      
      if (error.message.includes('API_KEY_INVALID')) {
        errorMsg += 'Invalid API key. Please check your Google Gemini API key.'
      } else if (error.message.includes('QUOTA_EXCEEDED')) {
        errorMsg += 'API quota exceeded. Please check your usage limits.'
      } else if (error.message.includes('SAFETY')) {
        errorMsg += 'Content was blocked by safety filters.'
      } else {
        errorMsg += `Error: ${error.message || 'Unknown error occurred.'}`
      }
      
      setErrorMessage(errorMsg)
    } finally {
      setIsProcessingWithGemini(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a PDF file first.')
      return
    }

    setUploadStatus('Uploading...')
    
    // Simulate upload process (replace with actual upload logic)
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('pdf', selectedFile)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Here you would typically make an API call to your backend
      // const response = await fetch('/api/upload', {
      //   method: 'POST',
      //   body: formData
      // })
      
      setUploadStatus('PDF uploaded successfully!')
      console.log('File uploaded:', selectedFile.name)
      
    } catch (error) {
      setUploadStatus('Upload failed. Please try again.')
      console.error('Upload error:', error)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setUploadStatus('')
    setExtractedText('')
    setIsOCRProcessing(false)
    setOcrProgress(0)
    setErrorMessage('')
    setExtractionStatus('')
    setCleanedQuestions('')
    setIsProcessingWithGemini(false)
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
            <h3>Drag & Drop your PDF here</h3>
            <p>or</p>
            <label htmlFor="file-input" className="file-input-label">
              Choose File
            </label>
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="file-input"
            />
            <p className="file-info">Only PDF files are allowed</p>
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

        {selectedFile && (
          <div className="file-preview">
            <div className="file-details">
              <div className="file-icon">📄</div>
              <div className="file-info-details">
                <h4>{selectedFile.name}</h4>
                <p>{formatFileSize(selectedFile.size)}</p>
              </div>
              <button 
                className="remove-btn"
                onClick={handleRemoveFile}
                title="Remove file"
              >
                ✕
              </button>
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
          disabled={!selectedFile || uploadStatus === 'Uploading...'}
        >
          {uploadStatus === 'Uploading...' ? 'Uploading...' : 'Upload PDF'}
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

        {/* Text Extraction Section */}
        {(isExtracting || isOCRProcessing || extractedText) && (
          <div className="text-extraction-section">
            <h2>Extracted Text</h2>
            {isExtracting ? (
              <div className="extraction-loading">
                <div className="loading-spinner"></div>
                <p>{extractionStatus || 'Extracting text from PDF...'}</p>
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
            ) : (
              <div className="extracted-text-container">
                <div className="text-controls">
                  <button 
                    className="copy-btn"
                    onClick={() => navigator.clipboard.writeText(extractedText)}
                    title="Copy text to clipboard"
                    disabled={!extractedText}
                  >
                    📋 Copy Text
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
                  {extractedText ? (
                    <pre>{extractedText}</pre>
                  ) : (
                    <p className="no-text">No text could be extracted from this PDF.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cleaned Questions Section */}
        {cleanedQuestions && (
          <div className="cleaned-questions-section">
            <h2>🤖 AI-Cleaned Questions</h2>
            <div className="cleaned-questions-container">
              <div className="text-controls">
                <button 
                  className="copy-btn"
                  onClick={() => navigator.clipboard.writeText(cleanedQuestions)}
                  title="Copy cleaned questions to clipboard"
                >
                  📋 Copy Cleaned Questions
                </button>
              </div>
              <div className="cleaned-questions-text">
                <pre>{cleanedQuestions}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
