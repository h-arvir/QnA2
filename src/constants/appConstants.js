export const NAVIGATION_ITEMS = [
  { id: 'instructions', label: 'Instructions', iconName: 'FileText', component: 'InstructionsSection' },
  { id: 'apikey', label: 'Set up API Key', iconName: 'Key', component: 'ApiKeySection' },
  { id: 'bookmarks', label: 'Bookmarked Questions', iconName: 'Bookmark', component: 'BookmarksSection' },
  { id: 'cache', label: 'Cache Management', iconName: 'Database', component: 'CacheManagement' }
]

export const SECTION_IDS = {
  UPLOAD: 'upload',
  QUESTIONS: 'questions',
  ANALYSIS: 'analysis',
  INSTRUCTIONS: 'instructions',
  API_KEY: 'apikey',
  BOOKMARKS: 'bookmarks',
  CACHE: 'cache'
}


