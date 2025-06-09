import { 
  Info, 
  CheckCircle, 
  Upload, 
  Eye, 
  Bot, 
  BarChart3, 
  Download, 
  RefreshCw,
  Settings 
} from 'lucide-react'

const InstructionsSection = ({ onNavigateToSection }) => {
  return (
    <div className="section-content">
      <h2 className="section-title">📋 How to Use This App</h2>
      <p className="section-subtitle">Step-by-step guide to extract and analyze PDF content</p>
      
      <div className="instructions-container">
        <div className="instruction-card">
          <div className="instruction-header">
            <div className="instruction-icon">1️⃣</div>
            <h3>Set up API Key</h3>
          </div>
          <div className="instruction-content">
            <p>First, you'll need to configure your Google Gemini API key to enable AI-powered text processing and question generation.</p>
            <ul>
              <li>Go to the "Set up API Key" section in the sidebar</li>
              <li>Enter your Google Gemini API key</li>
              <li>The key will be saved for this session</li>
            </ul>
            <div className="instruction-note">
              <Info size={16} />
              <span>Don't have an API key? Get one free at <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></span>
            </div>
          </div>
        </div>

        <div className="instruction-card">
          <div className="instruction-header">
            <div className="instruction-icon">2️⃣</div>
            <h3>Upload PDF Files</h3>
          </div>
          <div className="instruction-content">
            <p>Upload one or multiple PDF documents that you want to analyze.</p>
            <ul>
              <li>Click the upload area or drag & drop PDF files</li>
              <li>Multiple files are processed simultaneously</li>
              <li>Both text-based and image-based PDFs are supported</li>
              <li>OCR is automatically used for scanned documents</li>
            </ul>
          </div>
        </div>

        <div className="instruction-card">
          <div className="instruction-header">
            <div className="instruction-icon">3️⃣</div>
            <h3>Automatic Processing</h3>
          </div>
          <div className="instruction-content">
            <p>The app automatically processes your PDFs through multiple stages:</p>
            <ul>
              <li><strong>Text Extraction:</strong> Extracts text from PDFs using advanced parsing</li>
              <li><strong>OCR Processing:</strong> Handles scanned documents with optical character recognition</li>
              <li><strong>AI Analysis:</strong> Uses Google Gemini to generate relevant questions and answers</li>
              <li><strong>Question Grouping:</strong> Organizes similar questions into logical categories</li>
            </ul>
          </div>
        </div>

        <div className="instruction-card">
          <div className="instruction-header">
            <div className="instruction-icon">4️⃣</div>
            <h3>Review Results</h3>
          </div>
          <div className="instruction-content">
            <p>Navigate through the timeline to review different stages:</p>
            <ul>
              <li><strong>Extract:</strong> View the extracted text content</li>
              <li><strong>Questions:</strong> See generated Q&A pairs</li>
              <li><strong>Analysis:</strong> Explore grouped questions by topic</li>
            </ul>
            <div className="instruction-tip">
              <CheckCircle size={16} />
              <span>Use the timeline at the top to jump between different sections</span>
            </div>
          </div>
        </div>

        <div className="features-section">
          <h3>✨ Key Features</h3>
          <div className="features-grid">
            <div className="feature-item">
              <Upload size={20} />
              <span>Multi-file upload support</span>
            </div>
            <div className="feature-item">
              <Eye size={20} />
              <span>OCR for scanned documents</span>
            </div>
            <div className="feature-item">
              <Bot size={20} />
              <span>AI-powered question generation</span>
            </div>
            <div className="feature-item">
              <BarChart3 size={20} />
              <span>Intelligent question grouping</span>
            </div>
            <div className="feature-item">
              <Download size={20} />
              <span>Export results</span>
            </div>
            <div className="feature-item">
              <RefreshCw size={20} />
              <span>Real-time progress tracking</span>
            </div>
          </div>
        </div>

        <div className="instructions-actions">
          <button
            onClick={() => onNavigateToSection('apikey')}
            className="nav-btn secondary"
          >
            <Settings size={16} />
            Set up API Key
          </button>
          <button
            onClick={() => onNavigateToSection('upload')}
            className="nav-btn primary"
          >
            <Upload size={16} />
            Start with Upload
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstructionsSection