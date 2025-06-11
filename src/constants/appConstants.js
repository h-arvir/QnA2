export const NAVIGATION_ITEMS = [
  { id: 'instructions', label: 'Instructions', icon: '📋', component: 'InstructionsSection' },
  { id: 'apikey', label: 'Set up API Key', icon: '🔑', component: 'ApiKeySection' },
  { id: 'cache', label: 'Cache Management', icon: '💾', component: 'CacheManagement' }
]

export const SECTION_IDS = {
  UPLOAD: 'upload',
  QUESTIONS: 'questions',
  ANALYSIS: 'analysis',
  INSTRUCTIONS: 'instructions',
  API_KEY: 'apikey',
  CACHE: 'cache'
}

export const FILE_TYPES = {
  PDF: 'application/pdf'
}

export const PROCESSING_STATUS = {
  WAITING: 'waiting',
  PROCESSING: 'processing',
  READING: 'reading',
  EXTRACTING: 'extracting',
  OCR: 'ocr',
  COMPLETED: 'completed',
  ERROR: 'error'
}

export const AI_MODEL = {
  GEMINI_FLASH: 'gemini-1.5-flash'
}

export const ERROR_MESSAGES = {
  NO_API_KEY: 'Please enter your Google Gemini API key',
  INVALID_FILES: 'Please select valid PDF files',
  NO_FILES_SELECTED: 'Please select PDF files first',
  UPLOAD_FAILED: 'Upload failed. Please try again.',
  PROCESSING_FAILED: 'Failed to process PDF files'
}