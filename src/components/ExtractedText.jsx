import { Loader2 } from 'lucide-react'

const ExtractedText = ({ 
  extractedText, 
  onProcessWithGemini, 
  isProcessingWithGemini, 
  geminiApiKey 
}) => {
  if (!extractedText) return null

  return (
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
            onClick={() => onProcessWithGemini(extractedText)}
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