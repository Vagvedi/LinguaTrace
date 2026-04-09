import os
import nltk
import tempfile
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ── NLTK Downloads ──────────────────────────────────────────
try:
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
    nltk.download('averaged_perceptron_tagger_eng', quiet=True)
except Exception as e:
    print("Warning: NLTK download failed:", e)

from services.nlp_engine import analyze_texts
from services.ocr_service import extract_text_from_image, validate_image_file

app = Flask(__name__)
app.config['APP_NAME'] = os.getenv('FLASK_APP', 'LinguaTrace')
app.config['APP_DESCRIPTION'] = os.getenv('FLASK_APP_DESCRIPTION', 'AI-powered writing style analysis and authorship comparison')
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', str(16 * 1024 * 1024)))  # 16 MB
app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

# ── In-memory session history ───────────────────────────────
_analysis_history = []

SAMPLE_DATA_DIR = os.path.join(os.path.dirname(__file__), 'data', 'sample_authors')

# ───────────────────────────────────────────────────────────
# Routes
# ───────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/sample_data', methods=['GET'])
def get_sample_data():
    author = request.args.get('author', 'casual')
    # Strip trailing slashes / path separators for safety
    author = os.path.basename(author)
    try:
        file_path = os.path.join(SAMPLE_DATA_DIR, f"{author}.txt")
        if not os.path.exists(file_path):
            return jsonify({'error': f'Sample data for "{author}" not found.'}), 404

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        samples = content.split('\n---\n')
        if len(samples) >= 2:
            return jsonify({'sample1': samples[0].strip(), 'sample2': samples[1].strip()})

        # Fallback: split roughly in half by words
        words = content.split()
        mid = len(words) // 2
        return jsonify({
            'sample1': ' '.join(words[:mid]),
            'sample2': ' '.join(words[mid:])
        })

    except Exception as e:
        print(f"Error loading sample data: {e}")
        return jsonify({'error': 'Error loading sample data.'}), 500


@app.route('/extract_text', methods=['POST'])
def extract_text():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        file = request.files['image']
        if not file or file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        validate_image_file(file)

        filename = secure_filename(file.filename)
        ext = os.path.splitext(filename)[1] or '.png'
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            file.save(tmp.name)
            temp_path = tmp.name

        try:
            result = extract_text_from_image(temp_path)
            if not result.get('text', '').strip():
                return jsonify({'error': 'No text could be extracted from the image'}), 400
            return jsonify({
                'text':       result['text'],
                'word_count': result['word_count'],
                'validation': result['validation']
            }), 200
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Error in extract_text: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json(silent=True)
    if not data or 'textA' not in data or 'textB' not in data:
        return jsonify({'error': 'Missing textA or textB'}), 400

    text_a = data['textA'].strip()
    text_b = data['textB'].strip()

    if not text_a or not text_b:
        return jsonify({'error': 'Both texts must be non-empty.'}), 400

    try:
        result = analyze_texts(text_a, text_b)

        # Persist to session history
        _analysis_history.append({
            'id':         len(_analysis_history) + 1,
            'date':       datetime.now().strftime('%Y-%m-%d %H:%M'),
            'similarity': result['similarity'],
            'prediction': 'Same Author' if result['prediction'] == 'YES' else 'Different Author',
            'confidence': result['confidence']
        })

        return jsonify(result), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Error analyzing texts: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/history', methods=['GET'])
def get_history():
    # Return most recent 50, newest first
    return jsonify({'analyses': list(reversed(_analysis_history[-50:]))})


@app.route('/insights', methods=['GET'])
def get_insights():
    total = len(_analysis_history)
    if total == 0:
        return jsonify({
            'total_analyses':              0,
            'avg_similarity':              0.0,
            'same_author_predictions':     0,
            'different_author_predictions':0
        })

    avg_sim   = round(sum(a['similarity'] for a in _analysis_history) / total, 1)
    same      = sum(1 for a in _analysis_history if a['prediction'] == 'Same Author')
    different = total - same

    return jsonify({
        'total_analyses':              total,
        'avg_similarity':              avg_sim,
        'same_author_predictions':     same,
        'different_author_predictions':different
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
