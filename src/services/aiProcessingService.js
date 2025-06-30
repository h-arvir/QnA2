import { GoogleGenerativeAI } from '@google/generative-ai'
import { CacheService } from './cacheService'

export class AIProcessingService {
  static async processTextWithGemini(text, apiKey, onStatusUpdate = () => {}, fileHash = null) {
    if (!apiKey.trim()) {
      throw new Error('Please enter your Google Gemini API key to process the text.')
    }

    // Check cache first if fileHash is provided
    if (fileHash) {
      onStatusUpdate('Checking cache for processed text...')
      const cachedResult = await CacheService.getCacheData(fileHash, CacheService.STAGES.CLEANED_QUESTIONS)
      if (cachedResult) {
        onStatusUpdate('✅ Found cached processed text! Skipping API call to save credits.')
        return cachedResult.cleanedText
      }
    }

    onStatusUpdate('Processing text with Google Gemini AI...')

    try {
      const genAI = new GoogleGenerativeAI(apiKey.trim())
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const prompt = `You are given OCR-scanned text from a question paper. The text is unstructured and may contain grammar errors, layout issues, and irrelevant content like instructions or metadata.

Your task is to:
1. Extract only the actual exam questions, and remove all other non-question content (instructions, titles, page numbers, etc).
2. Remove instructional phrases like "Explain the following terms:", "Answer the following:", "Define the following:", etc. - these are NOT questions themselves.
3. Ensure each question starts on a new line, and is numbered correctly.
4. Fix grammar, spelling, and punctuation issues only for the questions.
5. Maintain the original section headers (e.g., Section A, Section B) if they exist.
6. Do not add or invent any content.
7. Only include complete, standalone questions that can be answered independently.

Here is the OCR text to process:

${text}`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const cleanedText = response.text()

      // Cache the result if fileHash is provided
      if (fileHash) {
        await CacheService.setCacheData(fileHash, CacheService.STAGES.CLEANED_QUESTIONS, {
          cleanedText,
          originalText: text,
          processedAt: new Date().toISOString()
        }, {
          apiModel: 'gemini-1.5-flash',
          stage: 'text_cleaning'
        })
        onStatusUpdate('Text successfully processed and cached! Future uploads of this file will skip API calls.')
      } else {
        onStatusUpdate('Text successfully processed with Google Gemini AI!')
      }
      
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

  static async analyzeQuestions(cleanedText, apiKey, onStatusUpdate = () => {}, fileHash = null) {
    if (!cleanedText || cleanedText.trim().length === 0) {
      return []
    }

    if (!apiKey.trim()) {
      throw new Error('Please enter your Google Gemini API key to analyze questions.')
    }

    // Check cache first if fileHash is provided
    if (fileHash) {
      onStatusUpdate('Checking cache for question analysis...')
      const cachedResult = await CacheService.getCacheData(fileHash, CacheService.STAGES.GROUPED_QUESTIONS)
      if (cachedResult) {
        onStatusUpdate('✅ Found cached question analysis! Skipping API call to save credits.')
        return cachedResult.groupsByMarks
      }
    }

    try {
      onStatusUpdate('Analyzing questions with AI...')

      const genAI = new GoogleGenerativeAI(apiKey.trim())
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const prompt = `You are an assistant that analyzes OCR-extracted exam questions. Your task is to:

1. First, identify and parse section headers (Section A, Section B, Section C, etc.) from the text
2. Categorize questions by marks based on sections:
   - Section A and Section B questions = 5 Marks
   - Section C questions = 2 Marks
3. Within each marks category, group only those questions that ask for the same concept and expect the same type of response (e.g., advantages, disadvantages, or explanation), differing only in phrasing or examples.
4. When unifying repeated questions, merge unique subparts from each into a single comprehensive question. For example, if one asks for a definition and characteristics, and another asks for a definition and architecture, the unified question should be: “Define [concept], its characteristics and architecture.
5.Do not group questions that combine a concept definition with its architecture, advantages, applications, or examples.
5. Avoid merging core concepts with tools or models, or questions from different learning objectives
6. It is better to have multiple small and accurate groups than fewer large and imprecise ones

Output Format:
MARKS_GROUP: 5 Marks
SECTIONS: Section A, Section B

Group <number>:
Question Count: <number>
Unified Question: <merged version>
Individual Questions:
- <original question 1>
- <original question 2>
...

MARKS_GROUP: 2 Marks
SECTIONS: Section C

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

      // Parse the AI response into structured groups by marks
      const groupsByMarks = this.parseAIAnalysisResponseByMarks(analysisResult)
      

      
      // Cache the result if fileHash is provided
      if (fileHash) {
        await CacheService.setCacheData(fileHash, CacheService.STAGES.GROUPED_QUESTIONS, {
          groupsByMarks,
          analysisResult,
          cleanedText,
          processedAt: new Date().toISOString()
        }, {
          apiModel: 'gemini-1.5-flash',
          stage: 'question_analysis'
        })
      }
      
      const totalGroups = groupsByMarks.reduce((sum, marksGroup) => sum + marksGroup.groups.length, 0)
      const cacheMessage = fileHash ? ' Results cached for future use!' : ''
      onStatusUpdate(`AI analysis complete! Found ${totalGroups} question groups organized by marks (5 Marks and 2 Marks).${cacheMessage}`)
      return groupsByMarks
      
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

  // Function to parse AI analysis response into structured groups by marks
  static parseAIAnalysisResponseByMarks(analysisText) {
    const markGroups = []
    
    // Split by "MARKS_GROUP:" pattern
    const marksSections = analysisText.split(/MARKS_GROUP:\s*/i).filter(section => section.trim().length > 0)
    
    marksSections.forEach((marksSection) => {
      const lines = marksSection.trim().split('\n')
      if (lines.length === 0) return
      
      // Extract marks value from first line
      const marksLine = lines[0].trim()
      const marksMatch = marksLine.match(/(\d+)\s*marks?/i)
      if (!marksMatch) return
      
      const marks = parseInt(marksMatch[1], 10)
      
      // Extract sections from second line if it exists
      let sections = []
      if (lines.length > 1 && lines[1].toLowerCase().includes('sections:')) {
        const sectionsLine = lines[1].replace(/sections:\s*/i, '').trim()
        sections = sectionsLine.split(',').map(s => s.trim()).filter(s => s.length > 0)
      }
      
      // Parse groups within this marks section
      const groupsText = lines.slice(2).join('\n')
      const groups = this.parseGroupsFromText(groupsText)
      
      if (groups.length > 0) {
        markGroups.push({
          marks: marks,
          sections: sections,
          groups: groups
        })
      }
    })
    
    // If no marks groups were found, fall back to old format
    if (markGroups.length === 0) {
      const groups = this.parseGroupsFromText(analysisText)
      if (groups.length > 0) {
        markGroups.push({
          marks: null,
          sections: [],
          groups: groups
        })
      }
    }
    
    return markGroups
  }

  // Helper function to parse groups from text
  static parseGroupsFromText(text) {
    const groups = []
    
    // Split by "Group X:" pattern
    const groupSections = text.split(/Group \d+:/i).filter(section => section.trim().length > 0)
    
    groupSections.forEach((section, index) => {
      const lines = section.trim().split('\n').filter(line => line.trim().length > 0)
      
      let questionCount = 1
      let unifiedQuestion = ''
      let originalQuestions = []
      let inIndividualQuestions = false
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        
        // Skip marks group headers
        if (trimmedLine.toLowerCase().includes('marks_group:') || 
            trimmedLine.toLowerCase().includes('sections:')) {
          continue
        }
        
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
              !cleanQuestion.toLowerCase().includes('question count') &&
              !cleanQuestion.toLowerCase().includes('marks_group:') &&
              !cleanQuestion.toLowerCase().includes('sections:')) {
            originalQuestions.push(cleanQuestion)
          }
        } else if (unifiedQuestion && trimmedLine.length > 0 && 
                   !trimmedLine.toLowerCase().startsWith('group ') && 
                   !inIndividualQuestions &&
                   !trimmedLine.toLowerCase().includes('marks_group:') &&
                   !trimmedLine.toLowerCase().includes('sections:')) {
          // Continue building the unified question if it spans multiple lines
          unifiedQuestion += ' ' + trimmedLine
        }
      }
      
      // If we have a unified question but no individual questions, 
      // try to extract them from the cleaned text based on the count
      if (unifiedQuestion.trim().length > 0 && originalQuestions.length === 0 && questionCount > 1) {
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

    // Generate a content-based cache key for the question
    const contextHash = context ? await CacheService.generateQuestionHash(context.substring(0, 1000)) : ''
    const contentBasedCacheKey = await CacheService.getQuestionCacheKey(question, contextHash)

    // Check cache first using content-based key
    onStatusUpdate('Checking cache for answer...')
    const cachedResult = await CacheService.getCacheData(contentBasedCacheKey, CacheService.STAGES.GENERATED_ANSWERS)
    if (cachedResult) {
      onStatusUpdate('✅ Found cached answer! Skipping API call to save credits.')
      return cachedResult.answer
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

      // Cache the result using content-based key
      await CacheService.setCacheData(contentBasedCacheKey, CacheService.STAGES.GENERATED_ANSWERS, {
        answer: answer.trim(),
        question,
        context: context ? context.substring(0, 2000) : '', // Store limited context to save space
        processedAt: new Date().toISOString()
      }, {
        apiModel: 'gemini-1.5-flash',
        stage: 'answer_generation',
        questionHash: await CacheService.generateQuestionHash(question)
      })
      onStatusUpdate('Answer generated and cached successfully!')
      
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