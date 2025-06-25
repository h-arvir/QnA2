import { 
  Info, 
  CheckCircle, 
  Upload, 
  Eye, 
  Bot, 
  BarChart3, 
  Download, 
  RefreshCw,
  Settings,
  Lamp,
  Wrench,
  Sparkles,
  CircleIcon,
  Hash
} from 'lucide-react'

const InstructionsSection = ({ onNavigateToSection }) => {
  return (
    <div className="section-content">
      <h2 className="section-title"> How to Use This App</h2>
      <p className="section-subtitle">Complete guide to AI-powered PDF question extraction and analysis</p>
      
      <div className="instructions-container">
        <div className="instruction-card">
          <div className="instruction-header">
            <div className="instruction-icon">
              <CircleIcon size={24} />
              <span className="number-overlay">1</span>
            </div>
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
            <div className="instruction-icon">
              <CircleIcon size={24} />
              <span className="number-overlay">2</span>
            </div>
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
            <div className="instruction-icon">
              <CircleIcon size={24} />
              <span className="number-overlay">3</span>
            </div>
            <h3>Automatic Processing</h3>
          </div>
          <div className="instruction-content">
            <p>The app automatically processes your PDFs through multiple stages with real-time progress tracking:</p>
            <ul>
              <li><strong>Text Extraction:</strong> Extracts text from PDFs using advanced parsing with PDF.js</li>
              <li><strong>OCR Processing:</strong> Handles scanned documents with Tesseract.js optical character recognition</li>
              <li><strong>AI Cleaning:</strong> Uses Google Gemini to clean and structure extracted text</li>
              <li><strong>Question Generation:</strong> Automatically generates relevant questions from content</li>
              <li><strong>Intelligent Grouping:</strong> Organizes similar questions into logical topic categories</li>
            </ul>
            <div className="instruction-note">
              <Info size={16} />
              <span>Watch the progress indicators for detailed status updates during processing</span>
            </div>
          </div>
        </div>

        <div className="instruction-card">
          <div className="instruction-header">
            <div className="instruction-icon">
              <CircleIcon size={24} />
              <span className="number-overlay">4</span>
            </div>
            <h3>Review & Analyze Results</h3>
          </div>
          <div className="instruction-content">
            <p>Navigate through the timeline to review different stages and interact with results:</p>
            <ul>
              <li><strong>Upload:</strong> View extracted text content and processing status</li>
              <li><strong>Questions:</strong> See AI-generated questions with copy and regeneration options</li>
              <li><strong>Analysis:</strong> Explore grouped questions by topic with detailed answers</li>
            </ul>
            <div className="instruction-tip">
              <CheckCircle size={16} />
              <span>Use the timeline at the top or floating navigation to jump between sections</span>
            </div>
          </div>
        </div>

        <div className="instruction-card">
          <div className="instruction-header">
            <div className="instruction-icon">
              <CircleIcon size={24} />
              <span className="number-overlay">5</span>
            </div>
            <h3>Advanced Features</h3>
          </div>
          <div className="instruction-content">
            <p>Explore advanced functionality for deeper analysis:</p>
            <ul>
              <li><strong>Answer Generation:</strong> Generate detailed answers for individual questions using AI</li>
              <li><strong>View Modes:</strong> Switch between unified and individual question views in analysis</li>
              <li><strong>Answer Persistence:</strong> Generated answers are saved and persist across navigation</li>
              <li><strong>Copy & Export:</strong> Copy questions, answers, or export entire analysis results</li>
              <li><strong>Real-time Updates:</strong> Live progress tracking with toast notifications</li>
            </ul>
            <div className="instruction-note">
              <Info size={16} />
              <span>All generated content is processed locally with your API key for privacy</span>
            </div>
          </div>
        </div>

        

        <div className="instruction-card">
          <div className="instruction-header">
            <div className="instruction-icon"><Lamp size={24} /></div>
            <h3>Navigation & Interface Tips</h3>
          </div>
          <div className="instruction-content">
            <p>Make the most of the user interface features:</p>
            <ul>
              <li><strong>Timeline Navigation:</strong> Click on timeline steps to jump between processing stages</li>
              <li><strong>Floating Navigation:</strong> Use the floating dots on the right for quick section switching</li>
              <li><strong>Sidebar Menu:</strong> Access instructions and API key setup from the left sidebar</li>
              <li><strong>Toast Notifications:</strong> Real-time feedback appears in the top-right corner</li>
              <li><strong>Progress Indicators:</strong> Detailed progress bars show processing status for each file</li>
              <li><strong>Responsive Design:</strong> The app works seamlessly on desktop, tablet, and mobile devices</li>
            </ul>
            <div className="instruction-tip">
              <CheckCircle size={16} />
              <span>The interface adapts to your screen size for optimal viewing experience</span>
            </div>
          </div>
        </div>

        <div className="instruction-card">
          <div className="instruction-header">
            <div className="instruction-icon"><Wrench size={24} /></div>
            <h3>Troubleshooting</h3>
          </div>
          <div className="instruction-content">
            <p>Common issues and solutions:</p>
            <ul>
              <li><strong>API Key Issues:</strong> Ensure your Gemini API key is valid and has sufficient quota</li>
              <li><strong>OCR Not Working:</strong> For scanned PDFs, ensure images are clear and text is readable</li>
              <li><strong>Processing Stuck:</strong> Large files may take time; check progress indicators for status</li>
              <li><strong>No Questions Generated:</strong> Verify the PDF contains question-like content</li>
              <li><strong>Mobile Issues:</strong> Use landscape mode for better experience on small screens</li>
            </ul>
            <div className="instruction-note">
              <Info size={16} />
              <span>Check browser console (F12) for detailed error messages if issues persist</span>
            </div>
          </div>
        </div>


        
        <div className="features-section">
          <h3><Sparkles size={20} /> Key Features</h3>
          <div className="features-grid">
            <div className="feature-item">
              <Upload size={20} />
              <span>Multi-file drag & drop upload</span>
            </div>
            <div className="feature-item">
              <Eye size={20} />
              <span>Advanced OCR with Tesseract.js</span>
            </div>
            <div className="feature-item">
              <Bot size={20} />
              <span>Google Gemini AI integration</span>
            </div>
            <div className="feature-item">
              <BarChart3 size={20} />
              <span>Intelligent question grouping</span>
            </div>
            {/* <div className="feature-item">
              <Download size={20} />
              <span>Export & copy functionality</span>
            </div>
            <div className="feature-item">
              <RefreshCw size={20} />
              <span>Real-time progress tracking</span>
            </div> */}
            <div className="feature-item">
              <Settings size={20} />
              <span>Answer generation & persistence</span>
            </div>
            <div className="feature-item">
              <CheckCircle size={20} />
              <span>Responsive design & mobile support</span>
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
            className="nav-btn secondary"
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