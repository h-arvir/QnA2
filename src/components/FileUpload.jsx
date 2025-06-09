import { useState } from 'react'
import { 
  Upload, 
  FileText, 
  X, 
  Trash2, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  Search
} from 'lucide-react'
import toast from 'react-hot-toast'
import ApiKeySetup from './ApiKeySetup'
import ProcessingStatus from './ProcessingStatus'
import StatusMessage from './StatusMessage'
import ExtractedText from './ExtractedText'

const FileUpload = ({ 
  selectedFiles, 
  onFileSelect, 
  onRemoveFile, 
  uploadStatus, 
  onUpload, 
  isDragOver, 
  onDragOver, 
  onDragLeave, 
  onDrop,
  processingProgress,
  // Processing status props
  isExtracting,
  isOCRProcessing,
  isAutoProcessing,
  extractionStatus,
  ocrProgress,
  overallProgress,
  errorMessage,
  // API key props
  geminiApiKey,
  onApiKeyChange,
  showApiKeyInput,
  onToggleApiKeyInput,
  // Extracted text props
  extractedText,
  onProcessWithGemini,
  isProcessingWithGemini,
  cleanedQuestions
}) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const renderFileStatus = (fileName) => {
    const progress = processingProgress[fileName]
    if (!progress) return null

    const statusConfig = {
      waiting: { icon: Loader2, text: 'Waiting...', className: 'animate-spin' },
      processing: { icon: Loader2, text: 'Processing...', className: 'animate-spin' },
      reading: { icon: FileText, text: 'Reading...', className: '' },
      extracting: { icon: Search, text: 'Extracting...', className: '' },
      ocr: { icon: Search, text: 'OCR Processing...', className: '' },
      completed: { icon: CheckCircle, text: 'Completed', className: '' },
      error: { icon: AlertTriangle, text: 'Error', className: '' }
    }

    const config = statusConfig[progress.status] || statusConfig.waiting
    const IconComponent = config.icon

    return (
      <div className="file-progress">
        <span className="progress-status">
          <IconComponent size={12} className={config.className} />
          {config.text}
        </span>
        <div className="progress-bar-small">
          <div 
            className="progress-fill-small" 
            style={{ width: `${progress.progress}%` }}
          ></div>
        </div>
      </div>
    )
  }

  return (
    <div className="section-content">
      {/* <h2 className="section-title">📄 Upload PDFs</h2>
      <p className="section-subtitle">Upload your PDF documents for text extraction</p> */}
      
      <div 
        className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <div className="upload-content">
          <div className="upload-icon">
            <Upload size={64} />
          </div>
          <h3>Drag & Drop your PDFs here</h3>
          <p>or</p>
          <label htmlFor="file-input" className="file-input-label">
            <FileText size={20} />
            Choose Files
          </label>
          <input
            id="file-input"
            type="file"
            accept=".pdf"
            multiple
            onChange={onFileSelect}
            className="file-input"
          />
          <p className="file-info">Select multiple PDF files for batch processing</p>
        </div>
      </div>

      {selectedFiles && selectedFiles.length > 0 && (
        <div className="files-preview">
          <div className="files-header">
            <h3>
              <FileText size={20} />
              Selected Files ({selectedFiles.length})
            </h3>
            <button 
              className="remove-all-btn"
              onClick={() => {
                onRemoveFile()
                toast.success('All files cleared!')
              }}
              title="Remove all files"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          </div>
          <div className="files-list">
            {selectedFiles.map((file, index) => (
              <div key={index} className="file-details">
                <div className="file-icon">
                  <FileText size={32} />
                </div>
                <div className="file-info-details">
                  <h4>{file.name}</h4>
                  <p>{formatFileSize(file.size)}</p>
                  {renderFileStatus(file.name)}
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => {
                    onRemoveFile(file)
                    toast.success(`${file.name} removed!`)
                  }}
                  title="Remove this file"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadStatus && (
        <div className={`status-message ${uploadStatus.includes('success') ? 'success' : uploadStatus.includes('failed') ? 'error' : 'info'}`}>
          <div className="status-icon">
            {uploadStatus.includes('success') ? (
              <CheckCircle size={20} />
            ) : uploadStatus.includes('failed') ? (
              <AlertTriangle size={20} />
            ) : (
              <FileText size={20} />
            )}
          </div>
          {uploadStatus}
        </div>
      )}



      {/* Error Message */}
      <StatusMessage message={errorMessage} type="error" />

      {/* Extraction Status */}
      <StatusMessage message={extractionStatus} type="info" />

      {/* Processing Status Section */}
      <ProcessingStatus
        isExtracting={isExtracting}
        isOCRProcessing={isOCRProcessing}
        isAutoProcessing={isAutoProcessing}
        extractionStatus={extractionStatus}
        ocrProgress={ocrProgress}
        overallProgress={overallProgress}
        selectedFilesCount={selectedFiles.length}
      />

      {/* Fallback: Show raw text if AI processing failed and no cleaned questions */}
      {extractedText && !cleanedQuestions && !isExtracting && !isOCRProcessing && !isAutoProcessing && (
        <ExtractedText
          extractedText={extractedText}
          onProcessWithGemini={onProcessWithGemini}
          isProcessingWithGemini={isProcessingWithGemini}
          geminiApiKey={geminiApiKey}
        />
      )}
    </div>
  )
}

export default FileUpload