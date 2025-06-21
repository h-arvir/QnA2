import React from 'react'
import { Loader2, AlertTriangle, Copy, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const ExtractedText = ({ 
  extractedText, 
  onProcessWithGemini, 
  isProcessingWithGemini, 
  geminiApiKey 
}) => {
  if (!extractedText) return null

  return (
    <div className="text-extraction-section">
      <h2>Raw Extracted Text</h2>
      <div className="api-key-warning">
        <p>⚠️ AI processing was not completed. Please set up your Google Gemini API key above to automatically clean and format the extracted text.</p>
      </div>
      <div className="extracted-text-container">
        <div className="text-controls">
          <button 
            className="copy-btn"
            onClick={() => {
              navigator.clipboard.writeText(extractedText)
              toast.success('Raw text copied to clipboard!')
            }}
            title="Copy raw text to clipboard"
            disabled={!extractedText}
          >
            📋 Copy Raw Text
          </button>
          <button 
            className="process-gemini-btn"
            onClick={() => {
              toast.loading('Cleaning text with AI...', { id: 'clean-ai' })
              onProcessWithGemini(extractedText)
            }}
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
  )
}

export default ExtractedText