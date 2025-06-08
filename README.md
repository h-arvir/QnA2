# PDF Question Paper Text Extraction & AI Processing

A React application that extracts text from PDF documents using OCR and processes it with Google Gemini AI to clean and format question papers.

## Features

- **PDF Upload**: Drag & drop or select PDF files
- **Text Extraction**: Automatic text extraction from PDFs
- **OCR Support**: Optical Character Recognition for image-based PDFs
- **AI Processing**: Google Gemini AI integration for text cleaning and formatting
- **Question Formatting**: Converts messy OCR text into well-formatted exam questions

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

**Note**: Replace `your_actual_api_key_here` with your actual Google Gemini API key.

### 4. Run the Application

```bash
npm run dev
```

## How to Use

### Step 1: Upload PDF
- Drag and drop a PDF file or click "Choose File"
- Only PDF files are accepted

### Step 2: Text Extraction
- The app automatically extracts text from the PDF
- If no text is found, OCR processing begins automatically
- Progress is shown during OCR processing

### Step 3: AI Processing (Optional)
- If you haven't set up the API key in `.env`, click "Setup API Key"
- Enter your Google Gemini API key
- Click "🤖 Clean with AI" to process the extracted text
- The AI will clean up grammar, spelling, and format the questions

### Step 4: Copy Results
- Use "📋 Copy Text" to copy the original extracted text
- Use "📋 Copy Cleaned Questions" to copy the AI-processed questions

## Google Gemini AI Processing

The application uses a specific prompt to instruct Gemini AI:

```
You are given OCR-scanned text from a question paper. The text is unstructured and contains grammar errors, typos, and layout issues.
Your task is to:
1. Correct grammar, fix punctuation, and clean up any misspellings.
2. Convert the text into a well-formatted list of exam questions.
3. Ensure each question is complete, coherent, and starts on a new line.
4. Maintain the original sections (Section A, Section B, Section C).
5. Keep original question numbering where possible.
6. Do not invent or add content. Only rephrase for clarity.
```

## Dependencies

- **React**: Frontend framework
- **pdfjs-dist**: PDF text extraction
- **tesseract.js**: OCR processing
- **@google/generative-ai**: Google Gemini AI integration (uses gemini-1.5-flash model)

## File Structure

```
src/
├── App.jsx          # Main application component
├── App.css          # Styling
├── main.jsx         # React entry point
└── index.css        # Global styles

public/
└── pdf.worker.min.mjs  # PDF.js worker file
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key | Optional* |

*If not provided, users can enter the API key manually in the UI.

## Error Handling

The application handles various error scenarios:

- **Invalid PDF files**: Shows appropriate error messages
- **OCR failures**: Graceful fallback with error reporting
- **API errors**: Specific error messages for different Gemini API issues
- **Network issues**: Timeout and connectivity error handling

## Security Notes

- API keys are stored securely in environment variables
- The `.env` file is excluded from version control
- API keys entered in the UI are stored only in component state

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Requires JavaScript enabled

## Troubleshooting

### Common Issues

1. **"PDF worker failed to initialize"**
   - Ensure `pdf.worker.min.mjs` is in the `public` folder
   - Try refreshing the page

2. **"Invalid API key"**
   - Verify your Google Gemini API key is correct
   - Check if the API key has proper permissions

3. **OCR processing fails**
   - Check internet connection (OCR models are downloaded)
   - Try with a smaller PDF file

4. **No text extracted**
   - The PDF might be image-based (OCR will run automatically)
   - The PDF might be corrupted or password-protected

5. **"Model not available" or 404 errors**
   - The Gemini API models may have been updated
   - Ensure you're using a valid API key
   - Try refreshing the page and attempting again

6. **"Access forbidden" (403 errors)**
   - Check if your API key has the necessary permissions
   - Verify the API key is correctly entered
   - Ensure the Generative Language API is enabled in your Google Cloud project

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features

The application is modular and can be extended with:
- Additional AI providers
- More text processing options
- Export functionality
- Batch processing

## License

This project is open source and available under the MIT License.
