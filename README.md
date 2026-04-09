# LinguaTrace 🧬
**AI-Based Writing Style Fingerprinting System with OCR Support**

LinguaTrace is a full-stack AI project that analyzes the stylistic and semantic patterns of two provided texts to determine if they were authored by the same person. It achieves this without relying on massive GPU-heavy models, instead utilizing classic Natural Language Processing techniques such as TF-IDF, Cosine Similarity, and Lexical Feature Engineering (vocab richness, rhythm patterns, syntax).

## ✨ New Features
- **🖼️ Image OCR Support:** Upload images containing text and automatically extract text using advanced OCR
- **Dual Input Methods:** Choose between manual text input or image upload for each sample
- **Smart Text Extraction:** Advanced image preprocessing with OpenCV for optimal OCR accuracy
- **Drag & Drop Interface:** Modern file upload with preview and loading animations
- **Cross-Platform OCR:** Full Windows Tesseract integration with automatic path detection

## Core Features
- **Semantic Overlap:** TF-IDF vectorization and cosine similarity scoring.
- **Stylometric Breakdown:** Extracts and compares average sentence length and vocabulary bounds.
- **Tone Detection:** Formality scoring via Part-of-Speech interjections and pronouns.
- **Explainability Engine:** Translates raw numerical diffs into human-readable insights.
- **Stunning UI:** Premium dark theme, glassmorphism UI built natively with raw CSS and JS.

## Tech Stack
- **Backend:** Python, Flask
- **NLP / ML:** `scikit-learn`, `nltk`, `numpy`
- **OCR Engine:** `pytesseract`, `Pillow`, `opencv-python`
- **Frontend:** Vanilla JS, Tailwind CSS, Google Fonts (Literata, Nunito Sans), Material Symbols
- **Build Tools:** PostCSS, Autoprefixer

## 🚀 Setup Instructions

### Prerequisites
1. **Install Tesseract OCR (Required for Windows):**
   - Download from: https://github.com/UB-Mannheim/tesseract/wiki
   - Install with English language pack
   - Default installation path: `C:\Program Files\Tesseract-OCR\tesseract.exe`

2. **Python Environment:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Node.js Dependencies (for Tailwind CSS):**
   ```bash
   npm install
   ```

4. **Build Tailwind CSS:**
   ```bash
   # For development (with file watching)
   npm run build-css
   
   # OR for production (minified)
   npm run build-css-prod
   
   # OR use the batch file (Windows)
   build-css.bat
   ```

### Local Execution
1. Build the CSS first (if not already built):
   ```bash
   npx tailwindcss -i ./static/css/input.css -o ./static/css/style.css
   ```

2. Start the Flask application:
   ```bash
   python app.py
   ```

3. Open `http://127.0.0.1:5000` in your web browser.

### Using OCR Features
- Click "Upload Image" tab for either Text Sample A or B
- Upload PNG, JPG, GIF, or other image formats (max 10MB)
- System automatically extracts text and switches to text view
- Extracted text integrates seamlessly with existing analysis pipeline

## Tailwind CSS Development

### Development Mode
For development with live CSS reloading:
```bash
npm run build-css
```
This will watch for changes in `input.css` and automatically rebuild `style.css`.

### Production Build
For production deployment:
```bash
npm run build-css-prod
```
This creates a minified CSS file for better performance.

### Custom Configuration
The custom color palette and fonts are defined in `tailwind.config.js`:
- **Primary Colors**: Custom LinguaTrace theme
- **Typography**: Literata (headings) and Nunito Sans (body)
- **Custom Animations**: fadeIn, spin, and hover effects

## Environment Configuration

### `.env` File
Create a `.env` file in the project root with the following configuration:

```bash
# Flask Configuration
FLASK_APP=LinguaTrace
FLASK_ENV=development
FLASK_DEBUG=True

# OCR Configuration
OCR_API_KEY=your_ocr_space_api_key_here
OCR_ENGINE=tesseract

# Security
SECRET_KEY=your_secret_key_here_change_in_production

# File Upload Configuration
MAX_CONTENT_LENGTH=16777216  # 16MB
UPLOAD_FOLDER=uploads
```

### Environment Variables
- `FLASK_APP`: Application name
- `FLASK_ENV`: Environment (development/production)
- `FLASK_DEBUG`: Debug mode (True/False)
- `MAX_CONTENT_LENGTH`: Maximum file upload size
- `OCR_API_KEY`: OCR service API key
- `SECRET_KEY`: Flask secret key

## Project Structure
- `/app.py`: Flask application routes and API logic with OCR endpoints
- `/services/nlp_engine.py`: Stylometric extraction and scoring logic
- `/services/ocr_service.py`: OCR text extraction with image preprocessing
- `/data/sample_authors/`: Pre-configured dataset showing distinct text styles
- `/templates/index.html`: Web interface HTML with modern Tailwind CSS styling
- `/static/css/input.css`: Tailwind CSS input file with custom styles
- `/static/css/style.css`: Compiled Tailwind CSS (auto-generated)
- `/static/js/script.js`: Client-side logic for HTTP fetching, OCR, and UI reactivity
- `/tailwind.config.js`: Tailwind CSS configuration with custom theme
- `/postcss.config.js`: PostCSS configuration for CSS processing
- `/package.json`: Node.js dependencies and build scripts
- `/build-css.bat`: Windows batch file for CSS compilation

## 🔧 OCR Configuration
The system automatically configures Tesseract for Windows. If you installed Tesseract in a different location, update the path in `/services/ocr_service.py`:

```python
pytesseract.pytesseract.tesseract_cmd = r'YOUR_TESSERACT_PATH\tesseract.exe'
```

## 📊 Supported Image Formats
- PNG, JPG, JPEG, GIF, BMP, TIFF, WebP
- Maximum file size: 10MB
- Automatic image preprocessing for optimal text extraction
- Noise reduction and contrast enhancement built-in
