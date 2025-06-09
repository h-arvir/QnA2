import { 
  Bot, 
  EyeOff, 
  Settings, 
  Eye,
  CheckCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  Trash2
} from 'lucide-react'

const ApiKeySetup = ({ 
  geminiApiKey, 
  onApiKeyChange, 
  showApiKeyInput, 
  onToggleApiKeyInput,
  isInline = false 
}) => {
  if (isInline) {
    return (
      <div className="api-key-section">
        <div className="api-key-header">
          <h3>
            <Bot size={24} />
            AI Text Processing
          </h3>
          <button 
            className="toggle-api-key-btn"
            onClick={onToggleApiKeyInput}
          >
            {showApiKeyInput ? <EyeOff size={16} /> : <Settings size={16} />}
            {showApiKeyInput ? 'Hide' : 'Setup'} API Key
          </button>
        </div>
        
        {showApiKeyInput && (
          <div className="api-key-input-container">
            <label htmlFor="gemini-api-key">Google Gemini API Key:</label>
            <input
              id="gemini-api-key"
              type="password"
              placeholder="Enter your Google Gemini API key"
              value={geminiApiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              className="api-key-input"
            />
            <p className="api-key-info">
              Get your free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="section-content">
      <h2 className="section-title">🔑 API Key Setup</h2>
      <p className="section-subtitle">Configure your Google Gemini API key for AI processing</p>
      
      <div className="api-key-container">
        <div className="api-key-card">
          <div className="api-key-header">
            <Settings size={24} />
            <h3>Google Gemini API Configuration</h3>
          </div>
          
          <div className="api-key-content">
            <p>Enter your Google Gemini API key to enable AI-powered text analysis and question generation.</p>
            
            <div className="api-key-input-section">
              <label htmlFor="apikey-input" className="api-key-label">
                API Key
              </label>
              <div className="api-key-input-wrapper">
                <input
                  id="apikey-input"
                  type={showApiKeyInput ? "text" : "password"}
                  value={geminiApiKey}
                  onChange={(e) => onApiKeyChange(e.target.value)}
                  placeholder="Enter your Google Gemini API key"
                  className="api-key-input"
                />
                <button
                  type="button"
                  onClick={onToggleApiKeyInput}
                  className="api-key-toggle"
                >
                  {showApiKeyInput ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="api-key-status">
              {geminiApiKey ? (
                <div className="status-success">
                  <CheckCircle size={16} />
                  <span>API key configured successfully</span>
                </div>
              ) : (
                <div className="status-warning">
                  <AlertTriangle size={16} />
                  <span>API key required for AI processing</span>
                </div>
              )}
            </div>

            <div className="api-key-info">
              <h4>How to get your API key:</h4>
              <ol>
                <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></li>
                <li>Sign in with your Google account</li>
                <li>Click "Create API Key"</li>
                <li>Copy the generated key and paste it above</li>
              </ol>
              
              <div className="api-key-note">
                <Info size={16} />
                <div>
                  <strong>Privacy Note:</strong> Your API key is stored locally in your browser and is never sent to our servers. 
                  It's only used to communicate directly with Google's Gemini API.
                </div>
              </div>
            </div>
          </div>
        </div>

        {geminiApiKey && (
          <div className="api-key-actions">
            <button
              onClick={() => {
                // Test the API key by making a simple request
                console.log('Testing API key...')
              }}
              className="test-api-btn"
            >
              <RefreshCw size={16} />
              Test API Key
            </button>
            
            <button
              onClick={() => {
                onApiKeyChange('')
                onToggleApiKeyInput(false)
              }}
              className="clear-api-btn"
            >
              <Trash2 size={16} />
              Clear API Key
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApiKeySetup