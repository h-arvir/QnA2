import React, { useState, useEffect } from 'react'
import { Database, Trash2, RefreshCw, Info, HardDrive, Clock, BarChart3, Sparkles, Brush, Coins } from 'lucide-react'
import { CacheService } from '../services/cacheService'
import toast from 'react-hot-toast'

const CacheManagement = () => {
  const [cacheStats, setCacheStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClearing, setIsClearing] = useState(false)

  // Load cache statistics
  const loadCacheStats = async () => {
    try {
      setIsLoading(true)
      const stats = CacheService.getCacheStats()
      setCacheStats(stats)
    } catch (error) {
      console.error('Error loading cache stats:', error)
      toast.error('Failed to load cache statistics')
    } finally {
      setIsLoading(false)
    }
  }

  // Clear all cache
  const handleClearCache = async () => {
    if (!window.confirm('Are you sure you want to clear all cached data? This will remove all saved processing results and you\'ll need to reprocess files.')) {
      return
    }

    try {
      setIsClearing(true)
      const result = CacheService.clearAllCache()
      
      toast.success(`Cache cleared! Removed ${result.removedCount} entries, freed ${(result.removedSize / 1024 / 1024).toFixed(2)} MB`, {
        duration: 4000,
        icon: <Trash2 size={16} />
      })
      
      // Reload stats
      await loadCacheStats()
    } catch (error) {
      console.error('Error clearing cache:', error)
      toast.error('Failed to clear cache')
    } finally {
      setIsClearing(false)
    }
  }

  // Run cleanup
  const handleCleanup = async () => {
    try {
      const result = CacheService.cleanupExpiredEntries()
      
      if (result.cleanedCount > 0) {
        toast.success(`Cleanup complete! Removed ${result.cleanedCount} expired entries, freed ${(result.cleanedSize / 1024 / 1024).toFixed(2)} MB`, {
          duration: 4000,
          icon: <Brush size={16} />
        })
      } else {
        toast.success('No expired entries found. Cache is clean!', {
          icon: <Sparkles size={16} />
        })
      }
      
      // Reload stats
      await loadCacheStats()
    } catch (error) {
      console.error('Error during cleanup:', error)
      toast.error('Failed to cleanup cache')
    }
  }

  useEffect(() => {
    loadCacheStats()
  }, [])

  if (isLoading) {
    return (
      <div className="section-content">
        <div className="loading-container">
          <RefreshCw className="animate-spin" size={24} />
          <span>Loading cache statistics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="section-content">
      <h2 className="section-title">Cache Management</h2>
      <p className="section-subtitle">Manage cached processing results to save API credits</p>
      
      <div className="cache-management-container">
        {/* Cache Statistics */}
        <div className="cache-stats-card">
          <div className="cache-stats-header">
            <Database size={24} />
            <h3>Cache Statistics</h3>
            <button 
              onClick={loadCacheStats}
              className="refresh-button"
              title="Refresh Statistics"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          
          <div className="cache-stats-grid">
            <div className="stat-item">
              <div className="stat-icon">
                <BarChart3 size={20} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{cacheStats?.totalEntries || 0}</div>
                <div className="stat-label">Cached Files</div>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">
                <HardDrive size={20} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{cacheStats?.totalSizeMB || 0} MB</div>
                <div className="stat-label">Storage Used</div>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">
                <div className="usage-indicator">
                  <div 
                    className="usage-bar" 
                    style={{ width: `${Math.min(cacheStats?.usagePercent || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="stat-content">
                <div className="stat-value">{cacheStats?.usagePercent || 0}%</div>
                <div className="stat-label">Cache Usage</div>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">
                <Clock size={20} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{cacheStats?.lastCleanup || 'Never'}</div>
                <div className="stat-label">Last Cleanup</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cache Breakdown */}
        {cacheStats?.stageStats && Object.keys(cacheStats.stageStats).length > 0 && (
          <div className="cache-breakdown-card">
            <h4>Cache Breakdown by Stage</h4>
            <div className="breakdown-list">
              {Object.entries(cacheStats.stageStats).map(([stage, count]) => (
                <div key={stage} className="breakdown-item">
                  <span className="breakdown-stage">{stage.replace(/_/g, ' ').toUpperCase()}</span>
                  <span className="breakdown-count">{count} entries</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cache Actions */}
        <div className="cache-actions-card">
          <h4>Cache Actions</h4>
          <div className="cache-actions">
            <button 
              onClick={handleCleanup}
              className="cache-action-button cleanup-button"
            >
              <RefreshCw size={16} />
              Clean Expired Entries
            </button>
            
            <button 
              onClick={handleClearCache}
              className="cache-action-button clear-button"
              disabled={isClearing}
            >
              <Trash2 size={16} />
              {isClearing ? 'Clearing...' : 'Clear All Cache'}
            </button>
          </div>
        </div>

        {/* Cache Benefits Info */}
        <div className="cache-info-card">
          <div className="cache-info-header">
            <Info size={20} />
            <h4>How Cache Saves API Credits</h4>
          </div>
          <div className="cache-benefits">
            <div className="benefit-item">
              <span className="benefit-icon"><Coins size={20} /></span>
              <span>Reprocessing the same PDF costs 0 API credits</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon"><RefreshCw size={20} /></span>
              <span>Cached results load instantly</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon"><Database size={20} /></span>
              <span>Answers are cached per question for quick retrieval</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon"><Brush size={20} /></span>
              <span>Automatic cleanup removes old entries after 30 days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CacheManagement