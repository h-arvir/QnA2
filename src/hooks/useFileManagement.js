import React from 'react'
import { Folder, AlertTriangle, Sparkles } from 'lucide-react'
import { FileManagementService } from '../services/fileManagementService'
import toast from 'react-hot-toast'

export const useFileManagement = (state, fileProcessing) => {
  const {
    setSelectedFiles,
    setUploadStatus,
    setIsDragOver,
    resetProcessingState
  } = state

  const { processMultiplePDFs } = fileProcessing

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
    const validation = FileManagementService.validateFiles(files)
    
    if (!validation.isValid) {
      setSelectedFiles([])
      setUploadStatus('Please select valid PDF files.')
      resetProcessingState()
      return
    }
    
    if (validation.invalidFiles.length > 0) {
      setUploadStatus(`${validation.invalidFiles.length} non-PDF files were ignored. Processing ${validation.validFiles.length} PDF files.`)
      toast.warning(`${validation.invalidFiles.length} non-PDF files were ignored. Processing ${validation.validFiles.length} PDF files.`, {
        duration: 4000,
        icon:  React.createElement(AlertTriangle, { size: 16, color: '#facc15' }),
      })
    } else {
      setUploadStatus('')
      toast.success(`${validation.validFiles.length} PDF file${validation.validFiles.length > 1 ? 's' : ''} selected and processing started!`, {
        duration: 3000,
        icon: React.createElement(Folder, { size: 16 }),
      })
      
      // Show OCR processing toast after a short delay
      setTimeout(() => {
        toast.loading('Starting OCR processing for text extraction...', {
          id: 'ocr-processing',
          duration: 4000,
          icon: React.createElement(Sparkles, { size: 16 }),
        })
      }, 1000)
    } 
    
    setSelectedFiles(validation.validFiles)
    resetProcessingState()
    
    // Start processing all files
    processMultiplePDFs(validation.validFiles)
  }

  const handleUpload = async (files) => {
    if (!files || files.length === 0) {
      setUploadStatus('Please select PDF files first.')
      return
    }

    setUploadStatus('Uploading...')
    
    try {
      const result = await FileManagementService.uploadFiles(files)
      
      if (result.success) {
        setUploadStatus(result.message)
        console.log('Files uploaded:', result.uploadedFiles)
      } else {
        setUploadStatus(result.message)
        console.error('Upload error:', result.error)
      }
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
      // Remove all files and reset state
      state.resetFileState()
    }
  }

  return {
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleUpload,
    handleRemoveFile,
    formatFileSize: FileManagementService.formatFileSize
  }
}