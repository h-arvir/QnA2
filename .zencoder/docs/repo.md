# QnA2 Information

## Summary
QnA2 is a React-based web application for processing PDF documents, extracting questions, and analyzing them using Google's Generative AI. The application allows users to upload PDFs, extract text (with OCR support via Tesseract.js), identify questions, group them, and generate answers using the Gemini API.

## Structure
- **src/**: Main source code directory
  - **components/**: React components (FileUpload, QuestionAnalysis, Sidebar, etc.)
  - **services/**: Service modules for AI processing, caching, file management
  - **hooks/**: Custom React hooks for state and business logic
  - **styles/**: Modular CSS architecture divided by functionality
  - **contexts/**: React context providers
  - **utils/**: Utility functions
  - **constants/**: Application constants and configuration
- **public/**: Static assets and PDF worker
- **.vscode/**: VS Code configuration

## Language & Runtime
**Language**: JavaScript (React)
**Version**: React 19.1.0
**Build System**: Vite 6.3.5
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- **@google/generative-ai**: Integration with Google's Generative AI (Gemini)
- **pdfjs-dist**: PDF processing and text extraction
- **tesseract.js**: OCR processing for image-based PDFs
- **react/react-dom**: UI framework
- **framer-motion/motion**: Animation libraries
- **react-hot-toast**: Toast notifications
- **react-icons/lucide-react**: Icon libraries

**Development Dependencies**:
- **@vitejs/plugin-react**: React plugin for Vite
- **eslint**: Code linting
- **vite**: Build tool and development server

## Build & Installation
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Main Files & Resources
**Entry Points**:
- **src/main.jsx**: Application entry point
- **src/App.jsx**: Main application component

**Key Components**:
- **FileUpload.jsx**: PDF upload and processing
- **QuestionAnalysis.jsx**: Question analysis and answer generation
- **Sidebar.jsx**: Navigation sidebar
- **Timeline.jsx**: Processing progress visualization

**Services**:
- **aiProcessingService.js**: Integration with Gemini API
- **pdfProcessingService.js**: PDF text extraction
- **cacheService.js**: Local caching of results
- **fileManagementService.js**: File handling

**State Management**:
- **useAppState.js**: Main application state hook
- **useFileProcessing.js**: File processing logic
- **useQuestionAnalysis.js**: Question analysis logic

## CSS Architecture
The application uses a modular CSS architecture with files organized by functionality:
- **index.css**: Main entry point importing all other CSS files
- **base.css**: Core layout and components
- **questions.css**: Question-related components
- **animations.css**: Keyframe animations and transitions
- **responsive.css**: Media queries and responsive design