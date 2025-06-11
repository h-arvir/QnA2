import * as pdfjsLib from 'pdfjs-dist'
import { createWorker } from 'tesseract.js'
import { CacheService } from './cacheService'

// Set up PDF.js worker - using local worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

export class PDFProcessingService {
  static initializeWorker() {
    // Worker is already set to local file, just log for debugging
    console.log('PDF.js worker initialized with:', pdfjsLib.GlobalWorkerOptions.workerSrc)
    return [pdfjsLib.GlobalWorkerOptions.workerSrc]
  }

  static async extractTextFromPDF(file, onStatusUpdate = () => {}) {
    try {
      // Generate file hash for caching
      const fileHash = await CacheService.generateFileHash(file)
      
      // Check cache first
      onStatusUpdate('Checking cache for extracted text...')
      const cachedResult = await CacheService.getCacheData(fileHash, CacheService.STAGES.EXTRACTED_TEXT)
      if (cachedResult) {
        onStatusUpdate('✅ Found cached extracted text! Skipping PDF processing.')
        return {
          text: cachedResult.text,
          fileHash,
          fromCache: true
        }
      }
      
      onStatusUpdate('Loading PDF...')
      
      // Initialize worker sources
      this.initializeWorker()
      
      const arrayBuffer = await file.arrayBuffer()
      onStatusUpdate('Reading PDF document...')
      
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
      let fullText = ''
      let hasTextContent = false
      
      onStatusUpdate(`Processing ${pdf.numPages} pages...`)
      
      // First, try to extract text normally
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        onStatusUpdate(`Extracting text from page ${pageNum} of ${pdf.numPages}...`)
        
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
        onStatusUpdate('No text found. Preparing OCR...')
        
        const ocrText = await this.extractTextWithOCR(pdf, onStatusUpdate)
        if (ocrText.includes('Error:')) {
          throw new Error(ocrText)
        } else {
          // Cache OCR result
          await CacheService.setCacheData(fileHash, CacheService.STAGES.EXTRACTED_TEXT, {
            text: ocrText,
            extractionMethod: 'OCR',
            processedAt: new Date().toISOString()
          }, {
            fileName: file.name,
            fileSize: file.size,
            stage: 'text_extraction'
          })
          
          onStatusUpdate('OCR completed successfully! Result cached for future use.')
          return {
            text: ocrText,
            fileHash,
            fromCache: false
          }
        }
      } else {
        // Cache normal text extraction result
        await CacheService.setCacheData(fileHash, CacheService.STAGES.EXTRACTED_TEXT, {
          text: fullText.trim(),
          extractionMethod: 'PDF.js',
          processedAt: new Date().toISOString()
        }, {
          fileName: file.name,
          fileSize: file.size,
          stage: 'text_extraction'
        })
        
        onStatusUpdate(`Successfully extracted text from ${pdf.numPages} pages! Result cached for future use.`)
        return {
          text: fullText.trim(),
          fileHash,
          fromCache: false
        }
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
      
      throw new Error(errorMsg)
    }
  }

  static async extractTextWithOCR(pdf, onStatusUpdate = () => {}, onProgressUpdate = () => {}) {
    let worker = null
    let ocrText = ''
    
    try {
      onStatusUpdate('Initializing OCR engine...')
      worker = await createWorker('eng')
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        onProgressUpdate(Math.round((pageNum - 1) / pdf.numPages * 100))
        onStatusUpdate(`Processing page ${pageNum} of ${pdf.numPages} with OCR...`)
        
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
      
      onProgressUpdate(100)
      onStatusUpdate('OCR processing completed!')
      
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

  static async extractTextFromSinglePDF(file, fileIndex, totalFiles, onProgressUpdate = () => {}) {
    const fileName = file.name
    
    // Update progress for this specific file
    const updateFileProgress = (status, progress = 0, error = null) => {
      onProgressUpdate(fileName, { status, progress, error })
      
      // Update overall progress
      const completedFiles = fileIndex
      const currentFileProgress = progress / 100
      const overallPercent = ((completedFiles + currentFileProgress) / totalFiles) * 100
      onProgressUpdate('overall', Math.round(overallPercent))
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
        
        // Update progress during text extraction
        const extractProgress = 40 + (pageNum / pdf.numPages) * 40
        updateFileProgress('extracting', Math.round(extractProgress))
      }
      
      // If no text was found, try OCR on images
      if (!hasTextContent || fullText.trim().length === 0) {
        console.log(`No text content found in ${fileName}, attempting OCR...`)
        updateFileProgress('ocr', 80)
        
        const ocrText = await this.extractTextWithOCRSingle(pdf, fileName, updateFileProgress)
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

  static async extractTextWithOCRSingle(pdf, fileName, updateProgress) {
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
}