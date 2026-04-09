import string
import numpy as np
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from nltk import pos_tag

def extract_features(text):
    sentences = sent_tokenize(text)
    words = word_tokenize(text)
    
    if not words or not sentences:
        return None
        
    num_sentences = len(sentences)
    num_words = len(words)
    
    # 1. Average sentence length (in words)
    avg_sentence_length = num_words / num_sentences
    
    # 2. Vocabulary richness (Type-Token Ratio)
    clean_words = [w.lower() for w in words if w.isalnum()]
    num_clean_words = len(clean_words)
    unique_words = len(set(clean_words))
    vocab_richness = unique_words / num_clean_words if num_clean_words > 0 else 0
    
    # 3. Punctuation patterns
    exclamations = text.count('!') / num_sentences
    questions = text.count('?') / num_sentences
    commas = text.count(',') / num_sentences
    
    # 4. Part of Speech rough distribution (Informal vs Formal Heuristic)
    # Requires averaged_perceptron_tagger
    pos_tags = pos_tag(words)
    pos_counts = Counter(tag for word, tag in pos_tags)
    
    prp_ratio = pos_counts.get('PRP', 0) / num_words
    uh_ratio = pos_counts.get('UH', 0) / num_words
    
    # Informal tone heuristic
    is_informal = True if (prp_ratio > 0.08 or uh_ratio > 0.01) else False

    return {
        "avg_sentence_length": avg_sentence_length,
        "vocab_richness": vocab_richness,
        "exclamations_per_sentence": exclamations,
        "questions_per_sentence": questions,
        "commas_per_sentence": commas,
        "is_informal": is_informal,
        "clean_words_count": num_clean_words,
        "sentences_count": num_sentences
    }

def compute_style_similarity(text_a, text_b):
    """Compute writing style similarity using word-level and character-level TF-IDF"""
    try:
        stops = stopwords.words('english')
    except:
        stops = 'english'
    
    # Normalize text length to reduce bias
    def normalize_text(text):
        words = text.split()
        if len(words) > 200:
            # Take first 100 words and last 100 words for long texts
            return ' '.join(words[:100] + words[-100:])
        return text
    
    norm_a = normalize_text(text_a)
    norm_b = normalize_text(text_b)
    
    # Word-level TF-IDF (captures word choice patterns)
    word_vectorizer = TfidfVectorizer(
        stop_words=stops,
        ngram_range=(1, 2),
        max_features=5000,
        min_df=1,
        max_df=0.8
    )
    
    try:
        word_tfidf = word_vectorizer.fit_transform([norm_a, norm_b])
        word_similarity = cosine_similarity(word_tfidf[0:1], word_tfidf[1:2])[0][0]
    except ValueError:
        word_similarity = 0.0
    
    # Character-level TF-IDF (captures writing style patterns)
    char_vectorizer = TfidfVectorizer(
        analyzer='char',
        ngram_range=(3, 5),
        max_features=3000,
        min_df=1,
        max_df=0.9
    )
    
    try:
        char_tfidf = char_vectorizer.fit_transform([norm_a, norm_b])
        char_similarity = cosine_similarity(char_tfidf[0:1], char_tfidf[1:2])[0][0]
    except ValueError:
        char_similarity = 0.0
    
    # Weighted combination (80% character-level, 20% word-level)
    combined_similarity = (char_similarity * 0.8) + (word_similarity * 0.2)
    
    return {
        'combined': combined_similarity,
        'character': char_similarity,
        'word': word_similarity
    }
def analyze_texts(text_a, text_b):
    features_a = extract_features(text_a)
    features_b = extract_features(text_b)
    
    if not features_a or not features_b:
        raise ValueError("One or both texts are too short to analyze.")
        
    # Enhanced TF-IDF Style Similarity
    style_sim = compute_style_similarity(text_a, text_b)
    
    # Heuristics comparison
    score = style_sim['combined'] * 0.60  # Style similarity weight
    
    # Compare sentence length similarity (normalize to 1.0 = identical)
    diff_sl = abs(features_a["avg_sentence_length"] - features_b["avg_sentence_length"])
    sl_sim = max(0, 1.0 - (diff_sl / 15.0)) # penalize differences over 15 words
    
    # Compare vocab richness
    diff_vr = abs(features_a["vocab_richness"] - features_b["vocab_richness"])
    vr_sim = max(0, 1.0 - (diff_vr / 0.3)) # penalize diff > 0.3
    
    # Context tone
    tone_match = features_a["is_informal"] == features_b["is_informal"]
    tone_score = 0.15 if tone_match else 0.0
    
    # Weighted final score
    final_score = score + (sl_sim * 0.25) + (vr_sim * 0.20) + tone_score
    final_score = min(max(final_score, 0.0), 1.0)
    
    percentage = round(final_score * 100, 1)
    
    # Prediction logic
    is_same_author = "YES" if percentage >= 50.0 else "NO"
    
    if percentage >= 70.0 or percentage <= 25.0:
        confidence = "High"
    elif percentage >= 50.0 or percentage <= 40.0:
        confidence = "Medium"
    else:
        confidence = "Low"
        
    # Generating Insights
    insights = []
    
    # Style similarity insights
    if style_sim['character'] > 0.7:
        insights.append(f"Strong character-level similarity ({round(style_sim['character'] * 100, 1)}%) indicates consistent writing patterns and rhythm.")
    elif style_sim['character'] < 0.3:
        insights.append("Low character-level similarity suggests different writing styles or patterns.")
    
    if style_sim['word'] > 0.6:
        insights.append(f"Word choice patterns show significant overlap ({round(style_sim['word'] * 100, 1)}%), indicating similar vocabulary usage.")
    
    # sentence length insight
    if diff_sl < 3:
        insights.append(f"Both texts exhibit highly similar sentence lengths ({round(features_a['avg_sentence_length'], 1)} vs {round(features_b['avg_sentence_length'], 1)} words/sentence), pointing to consistent rhythm.")
    elif diff_sl > 8:
        sl_diff_text = "Text A" if features_a["avg_sentence_length"] > features_b["avg_sentence_length"] else "Text B"
        insights.append(f"Significant difference in rhythm: {sl_diff_text} uses much longer sentences on average.")
        
    # Vocab richness
    if diff_vr < 0.05:
        insights.append("Vocabulary richness and lexical diversity are remarkably consistent.")
    elif diff_vr > 0.15:
        insights.append("One text utilizes a considerably broader vocabulary range than the other, suggesting a different prose style.")
        
    # Tone
    if tone_match:
        tone_str = "an informal" if features_a["is_informal"] else "a formal"
        insights.append(f"Both texts share {tone_str} tone based on grammatical structures (pronouns/interjections).")
    else:
        insights.append("Tone mismatch detected: One text leans formal while the other is decidedly informal.")
        
    # TF-IDF style analysis
    if style_sim['combined'] > 0.6:
        insights.append("Overall writing style shows strong consistency across multiple linguistic dimensions.")
    elif style_sim['combined'] < 0.3:
        insights.append("Writing styles differ significantly across character patterns and word choice.")

    return {
        "similarity": percentage,
        "prediction": is_same_author,
        "confidence": confidence,
        "insights": insights,
        "style_analysis": {
            "character_similarity": round(style_sim['character'] * 100, 1),
            "word_similarity": round(style_sim['word'] * 100, 1),
            "combined_similarity": round(style_sim['combined'] * 100, 1)
        },
        "stats": {
            "textA": {
                "avg_sentence_length": round(features_a["avg_sentence_length"], 1),
                "vocab_richness": f'{round(features_a["vocab_richness"] * 100, 1)}%',
                "is_informal": features_a["is_informal"]
            },
            "textB": {
                "avg_sentence_length": round(features_b["avg_sentence_length"], 1),
                "vocab_richness": f'{round(features_b["vocab_richness"] * 100, 1)}%',
                "is_informal": features_b["is_informal"]
            }
        }
    }
