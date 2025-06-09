import { GoogleGenerativeAI } from '@google/generative-ai'

export class AIProcessingService {
  static async processTextWithGemini(text, apiKey, onStatusUpdate = () => {}) {
    if (!apiKey.trim()) {
      throw new Error('Please enter your Google Gemini API key to process the text.')
    }

    onStatusUpdate('Processing text with Google Gemini AI...')

    try {
      const genAI = new GoogleGenerativeAI(apiKey.trim())
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

      onStatusUpdate('Text successfully processed with Google Gemini AI!')
      return cleanedText
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
      
      throw new Error(errorMsg)
    }
  }

  static async analyzeQuestions(cleanedText, apiKey, onStatusUpdate = () => {}) {
    if (!cleanedText || cleanedText.trim().length === 0) {
      return []
    }

    if (!apiKey.trim()) {
      throw new Error('Please enter your Google Gemini API key to analyze questions.')
    }

    try {
      onStatusUpdate('Analyzing questions with AI...')

      const genAI = new GoogleGenerativeAI(apiKey.trim())
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const prompt = `You are an intelligent assistant that analyzes a block of OCR-extracted exam questions. Your task is as follows:

1. Group similar or semantically related questions together. Use moderate semantic similarity (not just exact matches), grouping questions that are conceptually the same even if phrased differently.
2. For each group, create a **single, unified question** that represents the main intent of all questions in that group.
3. Also mention all the questions that were grouped together in the unified question in indented bullet points.
4. Count how many questions are in each group (how many times similar questions appear).

Format your output as:
Group 1:
Question Count: <number of similar questions in this group>
Unified Question: <merged version>
  Individual Questions: <list of original questions in this group, indented>

Group 2:
Question Count: <number of similar questions in this group>
Unified Question: <merged version>
  Individual Questions: <list of original questions in this group, indented>
… and so on.

Here are the extracted questions to analyze:

${cleanedText}`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const analysisResult = response.text()

      // Parse the AI response into structured groups
      const groups = this.parseAIAnalysisResponse(analysisResult)
      
      onStatusUpdate(`AI analysis complete! Found ${groups.length} question groups with unified questions and repetition counts.`)
      return groups
      
    } catch (error) {
      console.error('Error analyzing questions with AI:', error)
      let errorMsg = 'Failed to analyze questions with AI. '
      
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
        errorMsg += 'Invalid API key. Please check your Google Gemini API key.'
      } else if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('429')) {
        errorMsg += 'API quota exceeded. Please check your usage limits.'
      } else if (error.message.includes('SAFETY')) {
        errorMsg += 'Content was blocked by safety filters.'
      } else {
        errorMsg += `Error: ${error.message || 'Unknown error occurred.'}`
      }
      
      throw new Error(errorMsg)
    }
  }

  // Function to parse AI analysis response into structured groups
  static parseAIAnalysisResponse(analysisText) {
    const groups = []
    
    // Split by "Group X:" pattern
    const groupSections = analysisText.split(/Group \d+:/i).filter(section => section.trim().length > 0)
    
    groupSections.forEach((section, index) => {
      const lines = section.trim().split('\n').filter(line => line.trim().length > 0)
      
      let questionCount = 1
      let unifiedQuestion = ''
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        
        if (trimmedLine.toLowerCase().startsWith('question count:')) {
          const countMatch = trimmedLine.match(/question count:\s*(\d+)/i)
          if (countMatch) {
            questionCount = parseInt(countMatch[1], 10)
          }
        } else if (trimmedLine.toLowerCase().startsWith('unified question:')) {
          unifiedQuestion = trimmedLine.replace(/^unified question:\s*/i, '').trim()
        } else if (unifiedQuestion && trimmedLine.length > 0 && !trimmedLine.toLowerCase().startsWith('group ')) {
          // Continue building the unified question if it spans multiple lines
          unifiedQuestion += ' ' + trimmedLine
        }
      }
      
      if (unifiedQuestion.trim().length > 0) {
        groups.push({
          groupNumber: index + 1,
          unifiedQuestion: unifiedQuestion.trim(),
          count: questionCount
        })
      }
    })
    
    return groups
  }
}