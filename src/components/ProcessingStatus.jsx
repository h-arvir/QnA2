import { Loader2 } from 'lucide-react'

const ProcessingStatus = ({ 
  isExtracting, 
  isOCRProcessing, 
  isAutoProcessing,
  extractionStatus,
  ocrProgress,
  overallProgress,
  selectedFilesCount 
}) => {
  if (!isExtracting && !isOCRProcessing && !isAutoProcessing) {
    return null
  }

  return (
    <div className="text-extraction-section">
      <h2>
        <Loader2 size={24} className="animate-spin" />
        Processing {selectedFilesCount > 1 ? `${selectedFilesCount} PDFs` : 'PDF'}
      </h2>
      
      {isExtracting && (
        <div className="extraction-loading">
          <div className="loading-spinner"></div>
          <p>{extractionStatus || 'Extracting text from PDFs...'}</p>
          {selectedFilesCount > 1 && (
            <div className="overall-progress">
              <p>OCR Progress: {overallProgress}%</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {isOCRProcessing && (
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
      )}
      
      {/* {isAutoProcessing && (
        <div className="extraction-loading">
          <div className="loading-spinner"></div>
        </div>
      )} */}
    </div>
  )
}

export default ProcessingStatus