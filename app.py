import os
import nltk
from flask import Flask, render_template, request, jsonify

# Pre-computation / Downloads setup
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
except Exception as e:
    print("Warning: NLTK download failed", e)

from services.nlp_engine import analyze_texts

app = Flask(__name__)

# Sample authors text directory
SAMPLE_DATA_DIR = os.path.join(os.path.dirname(__file__), 'data', 'sample_authors')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/sample_data', methods=['GET'])
def get_sample_data():
    author = request.args.get('author', 'casual')
    try:
        file_path = os.path.join(SAMPLE_DATA_DIR, f"{author}.txt")
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return jsonify({'text': f.read()})
        else:
            return jsonify({'text': f'Sample data for {author} not found.'}), 404
    except Exception as e:
        return jsonify({'text': 'Error loading sample data.'}), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    if not data or 'textA' not in data or 'textB' not in data:
        return jsonify({'error': 'Missing textA or textB'}), 400
    
    text_a = data['textA'].strip()
    text_b = data['textB'].strip()

    if not text_a or not text_b:
        return jsonify({'error': 'Both texts must be provided.'}), 400

    try:
        result = analyze_texts(text_a, text_b)
        return jsonify(result), 200
    except Exception as e:
        print(f"Error analyzing texts: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
