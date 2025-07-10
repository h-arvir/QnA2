// Vercel Serverless Function for Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, text, action, question, context } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let result;
    let prompt;

    switch (action) {
      case 'processText':
        if (!text) {
          return res.status(400).json({ error: 'Text is required for processing' });
        }

        prompt = `You are given OCR-scanned text from a question paper. The text is unstructured and may contain grammar errors, layout issues, and irrelevant content like instructions or metadata.

Your task is to:
1. Extract only the actual exam questions, and remove all other non-question content (instructions, titles, page numbers, etc).
2. Remove instructional phrases like "Explain the following terms:", "Answer the following:", "Define the following:", etc. - these are NOT questions themselves.
3. Ensure each question starts on a new line, and is numbered correctly.
4. Fix grammar, spelling, and punctuation issues only for the questions.
5. Maintain the original section headers (e.g., Section A, Section B) if they exist.
6. Do not add or invent any content.
7. Only include complete, standalone questions that can be answered independently.

Here is the OCR text to process:

${text}`;

        result = await model.generateContent(prompt);
        return res.status(200).json({ 
          cleanedText: result.response.text(),
          success: true 
        });

      case 'analyzeQuestions':
        if (!text) {
          return res.status(400).json({ error: 'Text is required for analysis' });
        }

        prompt = `You are an assistant that analyzes OCR-extracted exam questions. Your task is to:

1. First, identify and parse section headers (Section A, Section B, Section C, etc.) from the text
2. Categorize questions by marks based on sections:
   - Section A and Section B questions = 5 Marks
   - Section C questions = 2 Marks
3. Within each marks category, group only those questions that ask for the same concept and expect the same type of response (e.g., advantages, disadvantages, or explanation), differing only in phrasing or examples.
4. When unifying repeated questions, merge unique subparts from each into a single comprehensive question. For example, if one asks for a definition and characteristics, and another asks for a definition and architecture, the unified question should be: "Define [concept], its characteristics and architecture.
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

${text}`;

        result = await model.generateContent(prompt);
        return res.status(200).json({ 
          analysisResult: result.response.text(),
          success: true 
        });

      case 'generateAnswer':
        if (!question) {
          return res.status(400).json({ error: 'Question is required for answer generation' });
        }

        prompt = `You are an expert educational assistant. Your task is to provide a comprehensive, detailed, and well-structured answer to the given question.

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

Please provide a comprehensive answer:`;

        result = await model.generateContent(prompt);
        return res.status(200).json({ 
          answer: result.response.text(),
          success: true 
        });

      default:
        return res.status(400).json({ error: 'Invalid action specified' });
    }
  } catch (error) {
    console.error('API Error:', error);
    
    let errorMsg = 'Failed to process request. ';
    
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
      errorMsg += 'Invalid API key. Please check your Google Gemini API key.';
    } else if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('429')) {
      errorMsg += 'API quota exceeded. Please check your usage limits.';
    } else if (error.message.includes('SAFETY')) {
      errorMsg += 'Content was blocked by safety filters.';
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      errorMsg += 'Model not available. The API might have been updated.';
    } else if (error.message.includes('403')) {
      errorMsg += 'Access forbidden. Please check your API key permissions.';
    } else if (error.message.includes('500')) {
      errorMsg += 'Server error. Please try again in a few moments.';
    } else {
      errorMsg += `Error: ${error.message || 'Unknown error occurred.'}`;
    }
    
    return res.status(500).json({ error: errorMsg });
  }
}