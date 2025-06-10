# CSS Architecture Documentation

This directory contains the modular CSS architecture for the QnA application. The large `App.css` file has been divided into smaller, more manageable files organized by functionality.

## File Structure

```
styles/
├── index.css          # Main entry point - imports all other files
├── base.css           # Core app layout and basic components
├── sidebar.css        # Navigation sidebar styles
├── timeline.css       # Progress timeline component
├── upload.css         # File upload and management
├── forms.css          # Form inputs and API key sections
├── cards.css          # Card components and status messages
├── questions.css      # Question groups, analysis, and answers
├── animations.css     # All keyframes and animations
├── responsive.css     # Media queries and responsive design
├── utilities.css      # Utility classes and helper styles
└── README.md          # This documentation file
```

## File Descriptions

### `index.css`
The main entry point that imports all other CSS files in the correct order. This is the only file that needs to be imported in the main application.

### `base.css`
Contains core application styles including:
- Main app layout (`.app`, `.main-content`)
- Section wrappers and content containers
- Basic typography (section titles, subtitles)
- Empty state styles
- Navigation button styles

### `sidebar.css`
All sidebar navigation related styles:
- Sidebar container and header
- Navigation items and their states
- Sticky background slider animation
- Icon and label styling
- Hover and active states

### `timeline.css`
Progress timeline component styles:
- Timeline container and progress indicators
- Timeline steps, dots, and connectors
- Active and completed states
- Progress animations

### `upload.css`
File upload and management functionality:
- Upload area with drag-and-drop styling
- File input labels and buttons
- Files preview cards
- File details and progress indicators
- Remove buttons and actions

### `forms.css`
Form elements and input styling:
- API key input sections
- Form labels and input fields
- Toggle buttons and actions
- Status indicators (success, warning)
- Form validation states

### `cards.css`
Various card components throughout the app:
- Status message cards
- Error message displays
- Processing/loading cards
- Instruction cards
- Feature grid layouts

### `questions.css`
Question-related components and analysis:
- Question groups and containers
- Individual question displays
- Answer sections and styling
- Control buttons (copy, analyze, etc.)
- View mode toggles
- Answer text formatting

### `animations.css`
All keyframe animations and transitions:
- Fade in/out animations
- Slide animations
- Pulse and bounce effects
- Toast notification animations
- Progress bar animations
- Loading spinners

### `responsive.css`
Media queries and responsive design:
- Tablet breakpoints (768px, 1024px)
- Mobile breakpoints (640px, 480px)
- Sidebar responsive behavior
- Timeline mobile adaptations
- Print styles
- Dark mode adjustments

### `utilities.css`
Utility classes and helper styles:
- Common spacing utilities
- Flex layout utilities
- Text color utilities
- Border radius utilities
- Shadow utilities
- Transition utilities
- Transform utilities

## Benefits of This Architecture

1. **Maintainability**: Each file focuses on a specific component or functionality
2. **Debugging**: Easier to locate and fix styles for specific components
3. **Performance**: Better caching as individual files can be cached separately
4. **Collaboration**: Multiple developers can work on different style files simultaneously
5. **Organization**: Clear separation of concerns makes the codebase more understandable
6. **Scalability**: Easy to add new style files for new components

## Usage

To use this modular CSS structure:

1. Import only `./styles/index.css` in your main application file
2. The index file will automatically import all other CSS files in the correct order
3. Add new component styles to the appropriate existing file or create a new file if needed
4. Update `index.css` to import any new CSS files

## Adding New Styles

When adding new styles:

1. **Identify the component type**: Determine which existing file the styles belong to
2. **Create new file if needed**: If the styles don't fit existing categories, create a new file
3. **Update index.css**: Add the import for any new CSS files
4. **Follow naming conventions**: Use consistent class naming and organization
5. **Consider responsive design**: Add mobile styles to `responsive.css`
6. **Add animations separately**: Put any new animations in `animations.css`

## Migration Notes

The original `App.css` file (2958 lines) has been completely divided into these modular files. All functionality and styling has been preserved while improving organization and maintainability.

If you need to reference the original file for any reason, it can be found as a backup, but the new modular structure should be used going forward.