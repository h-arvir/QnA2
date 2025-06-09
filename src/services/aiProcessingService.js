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

      const prompt = `You are an assistant that analyzes OCR-extracted exam questions. Your task is to group only those questions that exhibit high conceptual similarity — meaning they focus on the same core idea, topic, or subtopic. Do not group questions that mix definitions with applications, advantages, or examples. Avoid merging core concepts with tools or models, low-level technical components with high-level overviews, or questions from different subjects or domains. Also, do not group questions that target different learning objectives, such as a definition versus a comparison. If a question does not clearly belong with others, assign it to its own group.

Group questions based on tightly bound themes such as definitions and characteristics, technical architectures or components, service models and providers, security or virtualization principles, historical background of a subject, and short factual questions like those found in one-mark sections.
It is critical not to over-merge. It is better to have multiple small and accurate groups than fewer large and imprecise ones.

Output Format:
Group <number>:
Question Count: <number>
Unified Question: <merged version>
Individual Questions:
- <original question 1>
- <original question 2>
...

Here are the extracted questions to analyze:


${cleanedText}`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const analysisResult = response.text()

      // Parse the AI response into structured groups
      const groups = this.parseAIAnalysisResponse(analysisResult)
      
      // Debug logging
      console.log('AI Analysis Result:', analysisResult)
      console.log('Parsed Groups:', groups)
      
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
      let originalQuestions = []
      let inIndividualQuestions = false
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        
        if (trimmedLine.toLowerCase().startsWith('question count:')) {
          const countMatch = trimmedLine.match(/question count:\s*(\d+)/i)
          if (countMatch) {
            questionCount = parseInt(countMatch[1], 10)
          }
        } else if (trimmedLine.toLowerCase().startsWith('unified question:')) {
          unifiedQuestion = trimmedLine.replace(/^unified question:\s*/i, '').trim()
          inIndividualQuestions = false
        } else if (trimmedLine.toLowerCase().includes('individual questions:')) {
          inIndividualQuestions = true
        } else if (inIndividualQuestions) {
          // More flexible parsing for individual questions
          // Handle various formats: bullet points, numbers, indented text, or plain text
          let cleanQuestion = trimmedLine
          
          // Remove common prefixes
          cleanQuestion = cleanQuestion.replace(/^[-•*]\s*/, '') // bullet points
          cleanQuestion = cleanQuestion.replace(/^\d+\.\s*/, '') // numbered lists
          cleanQuestion = cleanQuestion.replace(/^[a-zA-Z]\)\s*/, '') // lettered lists (a), b), etc.)
          cleanQuestion = cleanQuestion.replace(/^\s*-\s*/, '') // dash with spaces
          cleanQuestion = cleanQuestion.trim()
          
          // Only add non-empty questions that don't look like section headers
          if (cleanQuestion.length > 0 && 
              !cleanQuestion.toLowerCase().startsWith('group ') &&
              !cleanQuestion.toLowerCase().includes('unified question') &&
              !cleanQuestion.toLowerCase().includes('question count')) {
            originalQuestions.push(cleanQuestion)
          }
        } else if (unifiedQuestion && trimmedLine.length > 0 && !trimmedLine.toLowerCase().startsWith('group ') && !inIndividualQuestions) {
          // Continue building the unified question if it spans multiple lines
          unifiedQuestion += ' ' + trimmedLine
        }
      }
      
      // If we have a unified question but no individual questions, 
      // try to extract them from the cleaned text based on the count
      if (unifiedQuestion.trim().length > 0 && originalQuestions.length === 0 && questionCount > 1) {
        // This is a fallback - we'll create placeholder individual questions
        // In a real scenario, you might want to store the original questions differently
        for (let i = 0; i < questionCount; i++) {
          originalQuestions.push(`${unifiedQuestion} (variation ${i + 1})`)
        }
      }
      
      if (unifiedQuestion.trim().length > 0) {
        groups.push({
          groupNumber: index + 1,
          unifiedQuestion: unifiedQuestion.trim(),
          count: questionCount,
          originalQuestions: originalQuestions.length > 0 ? originalQuestions : null
        })
      }
    })
    
    return groups
  }

  static async generateAnswer(question, context, apiKey, onStatusUpdate = () => {}) {
    if (!question || question.trim().length === 0) {
      throw new Error('Question is required to generate an answer.')
    }

    if (!apiKey.trim()) {
      throw new Error('Please enter your Google Gemini API key to generate answers.')
    }

    try {
      onStatusUpdate('Generating detailed answer with AI...')

      const genAI = new GoogleGenerativeAI(apiKey.trim())
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const prompt = `You are an expert educational assistant. Your task is to provide a comprehensive, detailed, and well-structured answer to the given question.

Guidelines for your response:
1. Provide a clear, detailed explanation that demonstrates deep understanding
2. Structure your answer with proper headings and bullet points where appropriate
3. Include relevant examples, definitions, and context
4. Make the answer educational and easy to understand
5. If the question requires technical details, provide them in a logical sequence
6. Use proper formatting with line breaks for readability
7. Aim for completeness while maintaining clarity

${context ? `Context from the document: ${context}` : ''}

Question: ${question}

Please provide a comprehensive answer:`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const answer = response.text()

      onStatusUpdate('Answer generated successfully!')
      return answer.trim()
      
    } catch (error) {
      console.error('Error generating answer:', error)
      let errorMsg = 'Failed to generate answer. '
      
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
        errorMsg += 'Invalid API key. Please check your Google Gemini API key.'
      } else if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('429')) {
        errorMsg += 'API quota exceeded. Please check your usage limits.'
      } else if (error.message.includes('SAFETY')) {
        errorMsg += 'Content was blocked by safety filters.'
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        errorMsg += 'Model not available. The API might have been updated.'
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
}