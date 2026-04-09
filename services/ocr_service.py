import os
import re
import requests
from PIL import Image
import io
import base64
from textblob import TextBlob

try:
    import cv2
    import numpy as np
    _CV2_AVAILABLE = True
except ImportError:
    _CV2_AVAILABLE = False

# OCR.space API configuration
OCR_SPACE_API_KEY = "K85230573888957"  # Free tier API key
OCR_SPACE_ENDPOINT = "https://api.ocr.space/parse/image"

def preprocess_image(image_path):
    """Advanced image preprocessing – falls back gracefully if OpenCV is unavailable."""
    if not _CV2_AVAILABLE:
        return None  # caller will use PIL fallback
    try:
        img = cv2.imread(image_path)
        if img is None:
            return None

        height, width = img.shape[:2]
        if max(height, width) < 1000:
            scale_factor = 1000 / max(height, width)
            img = cv2.resize(img, (int(width * scale_factor), int(height * scale_factor)),
                             interpolation=cv2.INTER_CUBIC)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        bilateral = cv2.bilateralFilter(blurred, 9, 75, 75)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(bilateral)
        thresh = cv2.adaptiveThreshold(enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                       cv2.THRESH_BINARY, 11, 2)
        if np.mean(thresh) > 127:
            thresh = 255 - thresh
        return thresh
    except Exception as e:
        print(f"OpenCV preprocessing failed: {e}")
        return None

def _image_to_base64_for_ocr(image_path):
    """Convert image to base64 PNG for the OCR API, using OpenCV if available else PIL."""
    processed = preprocess_image(image_path)
    if processed is not None and _CV2_AVAILABLE:
        import numpy as np
        import cv2 as _cv2
        _, buffer = _cv2.imencode('.png', processed)
        return base64.b64encode(buffer).decode('utf-8')
    else:
        # PIL fallback: convert to greyscale PNG
        try:
            img = Image.open(image_path).convert('L')  # greyscale
            buf = io.BytesIO()
            img.save(buf, format='PNG')
            return base64.b64encode(buf.getvalue()).decode('utf-8')
        except Exception as e:
            raise ValueError(f"Could not read image: {e}")


def extract_text_from_image(image_path):
    """Extract text using OCR.space API with preprocessing."""
    try:
        if not os.path.exists(image_path):
            raise FileNotFoundError("Image file not found")

        img_base64 = _image_to_base64_for_ocr(image_path)
        extracted_text = call_ocr_space_api(img_base64)

        if not extracted_text or len(extracted_text.strip()) < 3:
            raise ValueError("No text could be extracted from image")

        cleaned_text   = clean_text(extracted_text)
        corrected_text = correct_text(cleaned_text)
        validation_result = validate_text(corrected_text)

        return {
            'text':       corrected_text,
            'validation': validation_result,
            'word_count': len(corrected_text.split()) if corrected_text else 0
        }
    except Exception as e:
        print(f"OCR extraction failed: {e}")
        raise Exception(f"Failed to extract text from image: {str(e)}")

def clean_text(text):
    """Clean and normalize extracted OCR text for handwriting"""
    if not text:
        return ""
    
    # Remove excessive whitespace and newlines
    text = re.sub(r'\s+', ' ', text)
    
    # Remove non-alphabetic characters except basic punctuation and spaces
    text = re.sub(r'[^a-zA-Z\s.,!?;:\'-]', '', text)
    
    # Fix common OCR errors in handwriting
    ocr_corrections = {
        '|': 'l',
        '1': 'l',
        '0': 'o',
        '5': 's',
        '8': 'b',
        '2': 'z',
        '3': 'e',
        '4': 'a',
        '9': 'g',
        '7': 't',
        'ii': 'm',
        'vv': 'w',
        'cl': 'd',
        'rn': 'm'
    }
    
    for wrong, correct in ocr_corrections.items():
        text = text.replace(wrong, correct)
    
    # Remove leading/trailing whitespace
    text = text.strip()
    
    # Ensure proper spacing after punctuation
    text = re.sub(r'([.,!?;:])(?=\S)', r'\1 ', text)
    
    # Remove multiple spaces
    text = re.sub(r' +', ' ', text)
    
    # Convert to lowercase for consistency
    text = text.lower()
    
    return text

def correct_text(text):
    """Apply advanced spell correction using multiple methods"""
    if not text or len(text.strip()) < 3:
        return text
    
    try:
        # Method 1: TextBlob correction
        blob = TextBlob(text)
        textblob_corrected = str(blob.correct())
        
        # Method 2: Custom dictionary-based correction for common OCR errors
        custom_corrections = {
            # Common handwriting OCR mistakes
            'th': 'the',
            'an': 'and',
            'wi': 'with',
            'wh': 'which',
            'hav': 'have',
            'wer': 'were',
            'wil': 'will',
            'coul': 'could',
            'woul': 'would',
            'shoul': 'should',
            'becaus': 'because',
            'som': 'some',
            'peopl': 'people',
            'tim': 'time',
            'way': 'way',
            'doy': 'day',
            'man': 'man',
            'y': 'you',
            'u': 'you',
            'r': 'are',
            'ur': 'your',
            'im': 'i am',
            'dont': "don't",
            'wont': "won't",
            'cant': "can't",
            'didnt': "didn't",
            'doesnt': "doesn't",
            'isnt': "isn't",
            'arent': "aren't",
            'wasnt': "wasn't",
            'werent': "weren't",
            'havent': "haven't",
            'hasnt': "hasn't",
            'couldnt': "couldn't",
            'wouldnt': "wouldn't",
            'shouldnt': "shouldn't",
            'mightnt': "mightn't",
            'mustnt': "mustn't"
        }
        
        # Apply custom corrections
        words = textblob_corrected.split()
        corrected_words = []
        
        for word in words:
            word_lower = word.lower()
            if word_lower in custom_corrections:
                corrected_words.append(custom_corrections[word_lower])
            else:
                # Check if word is too short (likely OCR noise)
                if len(word) == 1 and word not in ['a', 'i']:
                    continue  # Skip single character noise
                corrected_words.append(word)
        
        final_corrected = ' '.join(corrected_words)
        
        # Method 3: Context-aware word boundary fixing
        final_corrected = re.sub(r'\s+([.,!?;:])', r'\1', final_corrected)  # Fix space before punctuation
        final_corrected = re.sub(r'([a-z])([A-Z])', r'\1 \2', final_corrected)  # Add space between words
        
        return final_corrected.strip()
        
    except Exception as e:
        print(f"Spell correction failed: {e}")
        # Return original text if correction fails
        return text

def call_ocr_space_api(image_base64):
    """Send image to OCR.space API and return extracted text"""
    try:
        payload = {
            'isOverlayRequired': False,
            'apikey': OCR_SPACE_API_KEY,
            'language': 'eng',
            'detectOrientation': True,
            'scale': True,
            'OCREngine': 2,  # Use OCR Engine 2 for better accuracy
            'isCreateSearchablePdf': False,
            'isSearchablePdfHideTextLayer': True,
            'filetype': 'png',
            'base64Image': f"data:image/png;base64,{image_base64}"
        }
        
        response = requests.post(
            OCR_SPACE_ENDPOINT,
            data=payload,
            timeout=45
        )
        
        if response.status_code != 200:
            raise Exception(f"OCR.space API returned status code: {response.status_code}")
        
        result = response.json()
        
        if result.get('IsErroredOnProcessing', False):
            error_message = result.get('ErrorMessage', 'Unknown OCR API error')
            raise Exception(f"OCR.space API error: {error_message}")
        
        if not result.get('ParsedResults') or len(result['ParsedResults']) == 0:
            raise Exception("No parsed results from OCR.space API")
        
        # Extract text from first parsed result
        parsed_text = result['ParsedResults'][0].get('ParsedText', '')
        
        if not parsed_text.strip():
            raise Exception("Empty text extracted from OCR.space API")
        
        return parsed_text.strip()
        
    except requests.exceptions.Timeout:
        raise Exception("OCR.space API request timed out")
    except requests.exceptions.ConnectionError:
        raise Exception("Failed to connect to OCR.space API")
    except requests.exceptions.RequestException as e:
        raise Exception(f"OCR.space API request failed: {str(e)}")
    except Exception as e:
        raise Exception(f"OCR.space API error: {str(e)}")

def validate_text(text):
    """Validate extracted text quality for handwriting OCR"""
    if not text or len(text.strip()) < 10:
        return {
            'valid': False,
            'warning': 'Extracted text is too short for analysis (minimum 10 characters required)',
            'confidence': 'low'
        }
    
    # Count alphabetic characters vs total characters
    alpha_chars = len(re.sub(r'[^a-zA-Z]', '', text))
    total_chars = len(re.sub(r'\s', '', text))
    
    if total_chars == 0:
        return {
            'valid': False,
            'warning': 'No readable text could be extracted from the image',
            'confidence': 'none'
        }
    
    alpha_ratio = alpha_chars / total_chars
    
    # Check if text contains enough alphabetic characters
    if alpha_ratio < 0.7:  # Higher threshold for handwriting
        return {
            'valid': False,
            'warning': f'Text quality is poor (only {alpha_ratio:.1%} alphabetic characters). Handwriting may be unclear.',
            'confidence': 'low'
        }
    
    # Check word count and average word length
    words = text.split()
    word_count = len(words)
    
    if word_count < 3:
        return {
            'valid': False,
            'warning': 'Not enough words extracted for meaningful analysis (minimum 3 words required)',
            'confidence': 'low'
        }
    
    # Check for very short words (indicates noise)
    short_words = [w for w in words if len(w) < 2]
    short_word_ratio = len(short_words) / word_count
    
    if short_word_ratio > 0.4:
        return {
            'valid': False,
            'warning': 'Too many single-character words detected. Image quality may be poor.',
            'confidence': 'low'
        }
    
    # Determine confidence based on text quality
    if alpha_ratio >= 0.95 and word_count >= 10 and short_word_ratio < 0.1:
        confidence = 'high'
    elif alpha_ratio >= 0.85 and word_count >= 5 and short_word_ratio < 0.2:
        confidence = 'medium'
    else:
        confidence = 'low'
    
    return {
        'valid': True,
        'warning': None,
        'confidence': confidence,
        'word_count': word_count,
        'alpha_ratio': alpha_ratio,
        'short_word_ratio': short_word_ratio
    }

def validate_image_file(file):
    """Validate uploaded image file"""
    if not file:
        raise ValueError("No file provided")
    
    # Check file extension
    allowed_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise ValueError(f"Unsupported file type: {file_ext}. Allowed types: {', '.join(allowed_extensions)}")
    
    # Check file size (max 10MB)
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Reset file pointer
    
    if file_size > 10 * 1024 * 1024:  # 10MB
        raise ValueError("File size too large. Maximum allowed size is 10MB")
    
    return True
