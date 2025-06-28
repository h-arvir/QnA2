/**
 * Cache Service for storing processed PDF results to save Gemini API credits
 * Uses localStorage with compression and intelligent cache management
 */

export class CacheService {
  static CACHE_PREFIX = 'qna2_cache_'
  static CACHE_METADATA_KEY = 'qna2_cache_metadata'
  static CACHE_VERSION = '1.0'
  static MAX_CACHE_SIZE_MB = 50 // Maximum cache size in MB
  static MAX_CACHE_ENTRIES = 100 // Maximum number of cached entries
  static CACHE_EXPIRY_DAYS = 30 // Cache expiry in days

  /**
   * Generate a hash for file content to use as cache key
   */
  static async generateFileHash(file) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      
      // Include stable file metadata for additional uniqueness (excluding lastModified)
      const metadata = {
        name: file.name,
        size: file.size,
        type: file.type
      }
      
      return `${hashHex}_${btoa(JSON.stringify(metadata)).replace(/[/+=]/g, '')}`
    } catch (error) {
      console.error('Error generating file hash:', error)
      // Fallback to simple hash based on stable file properties (excluding lastModified)
      return `fallback_${file.name}_${file.size}_${file.type}`.replace(/[^a-zA-Z0-9_]/g, '')
    }
  }

  /**
   * Generate cache key for different processing stages
   */
  static getCacheKey(fileHash, stage) {
    return `${this.CACHE_PREFIX}${stage}_${fileHash}`
  }

  /**
   * Generate a hash for question content to create unique cache keys
   */
  static async generateQuestionHash(questionText) {
    try {
      // Normalize the question text (trim, lowercase, remove extra spaces)
      const normalizedQuestion = questionText.trim().toLowerCase().replace(/\s+/g, ' ')
      
      // Create a hash of the question content
      const encoder = new TextEncoder()
      const data = encoder.encode(normalizedQuestion)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      
      // Return first 16 characters for shorter keys
      return hashHex.substring(0, 16)
    } catch (error) {
      console.error('Error generating question hash:', error)
      // Fallback to simple hash based on question length and first/last chars
      const normalized = questionText.trim().toLowerCase()
      return `fallback_${normalized.length}_${normalized.charCodeAt(0)}_${normalized.charCodeAt(normalized.length - 1)}`
    }
  }

  /**
   * Generate cache key for question-answer pairs
   */
  static async getQuestionCacheKey(questionText, contextHash = '') {
    const questionHash = await this.generateQuestionHash(questionText)
    // Include context hash if provided to differentiate same questions from different documents
    const contextPart = contextHash ? `_${contextHash.substring(0, 8)}` : ''
    return `${this.CACHE_PREFIX}question_${questionHash}${contextPart}`
  }

  /**
   * Get cache metadata
   */
  static getCacheMetadata() {
    try {
      const metadata = localStorage.getItem(this.CACHE_METADATA_KEY)
      return metadata ? JSON.parse(metadata) : this.getDefaultMetadata()
    } catch (error) {
      console.error('Error reading cache metadata:', error)
      return this.getDefaultMetadata()
    }
  }

  /**
   * Update cache metadata
   */
  static updateCacheMetadata(metadata) {
    try {
      localStorage.setItem(this.CACHE_METADATA_KEY, JSON.stringify(metadata))
    } catch (error) {
      console.error('Error updating cache metadata:', error)
    }
  }

  /**
   * Compress data before storing
   */
  static compressData(data) {
    return JSON.stringify(data)
  }

  /**
   * Decompress data after retrieving
   */
  static decompressData(compressedData) {
    try {
      return JSON.parse(compressedData)
    } catch (error) {
      console.error('Error decompressing data:', error)
      return null
    }
  }

  /**
   * Check if cache entry is expired
   */
  static isCacheExpired(timestamp) {
    const expiryTime = this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    return (Date.now() - timestamp) > expiryTime
  }

  /**
   * Remove cache entry from both storage and metadata
   */
  static removeCacheEntry(cacheKey, entry, metadata) {
    localStorage.removeItem(cacheKey)
    delete metadata.entries[cacheKey]
    metadata.totalSize -= entry.size
    this.updateCacheMetadata(metadata)
  }

  /**
   * Check if cache is over size or entry limits
   */
  static isOverCacheLimits(metadata, removedSize, removedCount, maxSizeBytes) {
    return (metadata.totalSize - removedSize > maxSizeBytes || 
            Object.keys(metadata.entries).length - removedCount > this.MAX_CACHE_ENTRIES)
  }

  /**
   * Get default cache metadata structure
   */
  static getDefaultMetadata() {
    return {
      version: this.CACHE_VERSION,
      entries: {},
      totalSize: 0,
      lastCleanup: Date.now()
    }
  }

  /**
   * Clean up expired cache entries
   */
  static cleanupExpiredEntries() {
    try {
      const metadata = this.getCacheMetadata()
      let cleanedSize = 0
      let cleanedCount = 0

      Object.keys(metadata.entries).forEach(key => {
        const entry = metadata.entries[key]
        if (this.isCacheExpired(entry.timestamp)) {
          // Remove from localStorage
          localStorage.removeItem(key)
          cleanedSize += entry.size
          cleanedCount++
          delete metadata.entries[key]
        }
      })

      metadata.totalSize -= cleanedSize
      metadata.lastCleanup = Date.now()
      this.updateCacheMetadata(metadata)

      return { cleanedCount, cleanedSize }
    } catch (error) {
      console.error('Error during cache cleanup:', error)
      return { cleanedCount: 0, cleanedSize: 0 }
    }
  }

  /**
   * Manage cache size by removing oldest entries
   */
  static manageCacheSize() {
    try {
      const metadata = this.getCacheMetadata()
      const maxSizeBytes = this.MAX_CACHE_SIZE_MB * 1024 * 1024

      if (metadata.totalSize <= maxSizeBytes && Object.keys(metadata.entries).length <= this.MAX_CACHE_ENTRIES) {
        return
      }

      // Sort entries by timestamp (oldest first)
      const sortedEntries = Object.entries(metadata.entries)
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)

      let removedSize = 0
      let removedCount = 0

      // Remove oldest entries until we're under limits
      while (this.isOverCacheLimits(metadata, removedSize, removedCount, maxSizeBytes) &&
             sortedEntries.length > removedCount) {
        
        const [key, entry] = sortedEntries[removedCount]
        localStorage.removeItem(key)
        removedSize += entry.size
        removedCount++
        delete metadata.entries[key]
      }

      metadata.totalSize -= removedSize
      this.updateCacheMetadata(metadata)
    } catch (error) {
      console.error('Error managing cache size:', error)
    }
  }

  /**
   * Store processed data in cache
   */
  static async setCacheData(fileHash, stage, data, additionalInfo = {}) {
    try {
      const cacheKey = this.getCacheKey(fileHash, stage)
      const compressedData = this.compressData(data)
      const dataSize = new Blob([compressedData]).size

      // Store the actual data
      localStorage.setItem(cacheKey, compressedData)

      // Update metadata
      const metadata = this.getCacheMetadata()
      metadata.entries[cacheKey] = {
        fileHash,
        stage,
        timestamp: Date.now(),
        size: dataSize,
        ...additionalInfo
      }
      metadata.totalSize += dataSize

      this.updateCacheMetadata(metadata)

      // Manage cache size
      this.manageCacheSize()

      return true
    } catch (error) {
      console.error('Error storing cache data:', error)
      return false
    }
  }

  /**
   * Retrieve processed data from cache
   */
  static async getCacheData(fileHash, stage) {
    try {
      const cacheKey = this.getCacheKey(fileHash, stage)
      const metadata = this.getCacheMetadata()
      
      // Check if entry exists and is not expired
      const entry = metadata.entries[cacheKey]
      if (!entry || this.isCacheExpired(entry.timestamp)) {
        if (entry) {
          // Remove expired entry
          this.removeCacheEntry(cacheKey, entry, metadata)
        }
        return null
      }

      const compressedData = localStorage.getItem(cacheKey)
      if (!compressedData) {
        // Entry exists in metadata but not in storage, clean up
        this.removeCacheEntry(cacheKey, entry, metadata)
        return null
      }

      const data = this.decompressData(compressedData)
      if (data) {
        // Update timestamp to mark as recently used
        entry.timestamp = Date.now()
        this.updateCacheMetadata(metadata)
      }

      return data
    } catch (error) {
      console.error('Error retrieving cache data:', error)
      return null
    }
  }

  /**
   * Clear all cache data
   */
  static clearAllCache() {
    try {
      const metadata = this.getCacheMetadata()
      let removedCount = 0
      let removedSize = 0

      Object.keys(metadata.entries).forEach(key => {
        const entry = metadata.entries[key]
        localStorage.removeItem(key)
        removedSize += entry.size
        removedCount++
      })

      // Reset metadata
      const newMetadata = this.getDefaultMetadata()
      this.updateCacheMetadata(newMetadata)

      return { removedCount, removedSize }
    } catch (error) {
      console.error('Error clearing cache:', error)
      return { removedCount: 0, removedSize: 0 }
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    try {
      const metadata = this.getCacheMetadata()
      const totalEntries = Object.keys(metadata.entries).length
      const totalSizeMB = (metadata.totalSize / 1024 / 1024).toFixed(2)
      const maxSizeMB = this.MAX_CACHE_SIZE_MB
      const usagePercent = ((metadata.totalSize / (maxSizeMB * 1024 * 1024)) * 100).toFixed(1)

      // Count entries by stage
      const stageStats = {}
      Object.values(metadata.entries).forEach(entry => {
        stageStats[entry.stage] = (stageStats[entry.stage] || 0) + 1
      })

      return {
        totalEntries,
        totalSizeMB: parseFloat(totalSizeMB),
        maxSizeMB,
        usagePercent: parseFloat(usagePercent),
        stageStats,
        lastCleanup: new Date(metadata.lastCleanup).toLocaleString(),
        version: metadata.version
      }
    } catch (error) {
      console.error('Error getting cache stats:', error)
      return {
        totalEntries: 0,
        totalSizeMB: 0,
        maxSizeMB: this.MAX_CACHE_SIZE_MB,
        usagePercent: 0,
        stageStats: {},
        lastCleanup: 'Unknown',
        version: this.CACHE_VERSION
      }
    }
  }

  /**
   * Cache stages constants
   */
  static STAGES = {
    EXTRACTED_TEXT: 'extracted_text',
    CLEANED_QUESTIONS: 'cleaned_questions', 
    GROUPED_QUESTIONS: 'grouped_questions',
    GENERATED_ANSWERS: 'generated_answers'
  }
}