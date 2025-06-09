import { AIProcessingService } from '../services/aiProcessingService'
import toast from 'react-hot-toast'

export const useQuestionAnalysis = (state) => {
  const {
    setGroupedQuestions,
    setIsGroupingQuestions,
    setErrorMessage,
    setExtractionStatus,
    setActiveSection,
    geminiApiKey
  } = state

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

      const groups = await AIProcessingService.analyzeQuestions(
        cleanedText,
        geminiApiKey,
        (status) => setExtractionStatus(status)
      )
      
      setGroupedQuestions(groups)
      // Show success notification
      toast.dismiss('analyze')
      toast.success('Analysis completed! Questions have been grouped successfully.', {
        duration: 4000,
        icon: '✅',
      })
      // Navigate to analysis section after successful analysis
      setTimeout(() => setActiveSection('analysis'), 2000)
      
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsGroupingQuestions(false)
    }
  }

  return {
    analyzeQuestions
  }
}