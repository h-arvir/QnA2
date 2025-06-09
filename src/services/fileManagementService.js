export class FileManagementService {
  static validateFiles(files) {
    const validFiles = files.filter(file => file.type === 'application/pdf')
    const invalidFiles = files.filter(file => file.type !== 'application/pdf')
    
    return {
      validFiles,
      invalidFiles,
      isValid: validFiles.length > 0
    }
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  static async uploadFiles(files) {
    // Simulate upload process (replace with actual upload logic)
    try {
      // Create FormData for file upload
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append(`pdf_${index}`, file)
      })
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Here you would typically make an API call to your backend
      // const response = await fetch('/api/upload', {
      //   method: 'POST',
      //   body: formData
      // })
      
      return {
        success: true,
        message: `${files.length} PDF files uploaded successfully!`,
        uploadedFiles: files.map(f => f.name)
      }
      
    } catch (error) {
      return {
        success: false,
        message: 'Upload failed. Please try again.',
        error: error.message
      }
    }
  }

  static initializeFileProgress(files) {
    const initialProgress = {}
    files.forEach((file, index) => {
      initialProgress[file.name] = {
        status: 'waiting',
        progress: 0,
        text: '',
        error: null
      }
    })
    return initialProgress
  }

  static combineFileResults(results, files) {
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
    
    return {
      combinedText: combinedText.trim(),
      successCount,
      errorCount,
      hasContent: combinedText.trim().length > 0
    }
  }
}