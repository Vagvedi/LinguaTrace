# Digital DNA 🧬
**AI-Based Writing Style Fingerprinting System**

Digital DNA is a full-stack AI project that analyzes the stylistic and semantic patterns of two provided texts to determine if they were authored by the same person. It achieves this without relying on massive GPU-heavy models, instead utilizing classic Natural Language Processing techniques such as TF-IDF, Cosine Similarity, and Lexical Feature Engineering (vocab richness, rhythm patterns, syntax).

## Features
- **Semantic Overlap:** TF-IDF vectorization and cosine similarity scoring.
- **Stylometric Breakdown:** Extracts and compares average sentence length and vocabulary bounds.
- **Tone Detection:** Formality scoring via Part-of-Speech interjections and pronouns.
- **Explainability Engine:** Translates raw numerical diffs into human-readable insights.
- **Stunning UI:** Premium dark theme, glassmorphism UI built natively with raw CSS and JS.

## Tech Stack
- **Backend:** Python, Flask
- **NLP / ML:** `scikit-learn`, `nltk`, `numpy`
- **Frontend:** Vanilla JS, CSS3, Google Fonts (Inter), Phosphor Icons

## Local Execution
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the Flask application:
   ```bash
   python app.py
   ```
3. Open `http://127.0.0.1:5000` in your web browser.

## Project Structure
- `/app.py`: Flask application routes and API logic
- `/services/nlp_engine.py`: Stylometric extraction and scoring logic
- `/data/sample_authors/`: Pre-configured dataset showing distinct text styles
- `/templates/index.html`: Web interface HTML
- `/static/css/style.css`: Dark-theme glassmorphism styling
- `/static/js/script.js`: Client-side logic for HTTP fetching and UI reactivity
