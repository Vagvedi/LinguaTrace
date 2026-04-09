document.addEventListener('DOMContentLoaded', () => {
    const textA = document.getElementById('textA');
    const textB = document.getElementById('textB');
    const countA = document.getElementById('countA');
    const countB = document.getElementById('countB');
    
    // Tab switching functionality
    const setupTabSwitching = () => {
        const tabBtns = document.querySelectorAll('.tab-btn');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const textareaId = btn.dataset.textarea;
                const parentCard = btn.closest('.input-card');
                
                // Remove active class from all tabs and methods in this card
                parentCard.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                parentCard.querySelectorAll('.input-method').forEach(m => m.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding method
                btn.classList.add('active');
                document.getElementById(targetId).classList.add('active');
                
                // Update word count for the textarea
                const textarea = document.getElementById(textareaId);
                updateCount(textarea, textareaId === 'textA' ? countA : countB);
            });
        });
    };
    
    // Setup tab switching
    setupTabSwitching();
    
    // Auto-update word counts
    const updateCount = (textarea, displayElement) => {
        const text = textarea.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        displayElement.textContent = words;
    };
    
    // Image upload and OCR functionality
    const setupImageUpload = (imageInputId, previewId, loadingId, textareaId, countId, warningId) => {
        const imageInput = document.getElementById(imageInputId);
        const preview = document.getElementById(previewId);
        const loading = document.getElementById(loadingId);
        const textarea = document.getElementById(textareaId);
        const countElement = document.getElementById(countId);
        const warningElement = document.getElementById(warningId);
        const previewImg = preview.querySelector('.preview-img');
        const removeBtn = preview.querySelector('.remove-image-btn');
        
        // Handle file selection
        imageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showError('Please select an image file.');
                return;
            }
            
            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                showError('File size must be less than 10MB.');
                return;
            }
            
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
            
            // Show loading
            loading.classList.remove('hidden');
            
            try {
                // Upload image for OCR
                const formData = new FormData();
                formData.append('image', file);
                
                const response = await fetch('/extract_text', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'OCR failed');
                }
                
                // Check validation results
                if (!data.validation.valid) {
                    showError(data.validation.warning || 'Text extraction failed validation.');
                    return;
                }
                
                // Insert extracted text into textarea
                textarea.value = data.text;
                updateCount(textarea, countElement);
                
                // Show warning for low confidence OCR
                if (data.validation.confidence === 'low' || data.validation.confidence === 'medium') {
                    warningElement.classList.remove('hidden');
                } else {
                    warningElement.classList.add('hidden');
                }
                
                // Switch to text tab to show results
                const textTabBtn = document.querySelector(`[data-target="text-input-${textareaId === 'textA' ? 'a' : 'b'}"]`);
                textTabBtn.click();
                
                hideError();
                
            } catch (error) {
                showError(error.message || 'Failed to extract text from image.');
            } finally {
                loading.classList.add('hidden');
            }
        });
        
        // Handle remove image
        removeBtn.addEventListener('click', () => {
            imageInput.value = '';
            preview.classList.add('hidden');
            previewImg.src = '';
            warningElement.classList.add('hidden');
        });
        
        // Setup drag and drop
        const uploadLabel = imageInput.nextElementSibling;
        
        uploadLabel.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadLabel.style.borderColor = 'var(--primary)';
        });
        
        uploadLabel.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadLabel.style.borderColor = 'var(--border)';
        });
        
        uploadLabel.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadLabel.style.borderColor = 'var(--border)';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                imageInput.files = files;
                const event = new Event('change', { bubbles: true });
                imageInput.dispatchEvent(event);
            }
        });
        
        // Hide warning when user manually edits text
        textarea.addEventListener('input', () => {
            if (!warningElement.classList.contains('hidden')) {
                warningElement.classList.add('hidden');
            }
        });
    };
    
    // Setup image uploads for both text areas
    setupImageUpload('imageA', 'previewA', 'ocr-loading-a', 'textA', 'countA', 'ocr-warning-a');
    setupImageUpload('imageB', 'previewB', 'ocr-loading-b', 'textB', 'countB', 'ocr-warning-b');
    
    textA.addEventListener('input', () => updateCount(textA, countA));
    textB.addEventListener('input', () => updateCount(textB, countB));
    
    // Load Samples
    const loadSample = async (author) => {
        try {
            const res = await fetch(`/sample_data?author=${author}`);
            if(!res.ok) throw new Error('Network error');
            const data = await res.json();
            
            // Put it in whichever is empty, or overwrite A
            if(!textA.value) {
                textA.value = data.text;
                updateCount(textA, countA);
            } else if (!textB.value) {
                textB.value = data.text;
                updateCount(textB, countB);
            } else {
                // If both full, overwrite A
                textA.value = data.text;
                updateCount(textA, countA);
            }
        } catch(e) {
            showError("Failed to load sample data.");
        }
    };
    
    document.getElementById('btn-sample-casual').addEventListener('click', () => loadSample('casual_chat'));
    document.getElementById('btn-sample-formal').addEventListener('click', () => loadSample('formal_article'));
    document.getElementById('btn-sample-social').addEventListener('click', () => loadSample('social_media'));
    
    // Clear all
    document.getElementById('btn-clear').addEventListener('click', () => {
        textA.value = '';
        textB.value = '';
        updateCount(textA, countA);
        updateCount(textB, countB);
        document.getElementById('results-panel').classList.add('hidden');
        hideError();
        
        // Clear image uploads
        ['imageA', 'imageB'].forEach(id => {
            const input = document.getElementById(id);
            const preview = document.getElementById(id === 'imageA' ? 'previewA' : 'previewB');
            const previewImg = preview.querySelector('.preview-img');
            const warning = document.getElementById(id === 'imageA' ? 'ocr-warning-a' : 'ocr-warning-b');
            input.value = '';
            preview.classList.add('hidden');
            previewImg.src = '';
            warning.classList.add('hidden');
        });
        
        // Reset to text tabs
        document.querySelectorAll('.tab-btn[data-target^="text-input"]').forEach(btn => btn.click());
    });
    
    // Error Handling
    const errorToast = document.getElementById('error-msg');
    const showError = (msg) => {
        errorToast.textContent = msg;
        errorToast.classList.remove('hidden');
        setTimeout(hideError, 5000);
    };
    const hideError = () => {
        errorToast.classList.add('hidden');
    };
    
    // Analyze
    document.getElementById('btn-analyze').addEventListener('click', async () => {
        hideError();
        if(textA.value.trim().split(/\s+/).length < 5 || textB.value.trim().split(/\s+/).length < 5) {
            showError("Please provide more text (at least 5 words per sample).");
            return;
        }
        
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('results-panel').classList.add('hidden');
        
        try {
            const res = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({textA: textA.value, textB: textB.value})
            });
            
            const data = await res.json();
            
            if(!res.ok) {
                showError(data.error || "Analysis failed.");
            } else {
                displayResults(data);
            }
        } catch(e) {
            showError("Failed to connect to the server.");
        } finally {
            document.getElementById('loading').classList.add('hidden');
        }
    });
    
    const displayResults = (data) => {
        document.getElementById('results-panel').classList.remove('hidden');
        
        // Render Circle
        const percentage = data.similarity;
        const circle = document.getElementById('score-circle');
        const text = document.getElementById('score-text');
        
        // Refresh animation by removing and re-adding class
        circle.style.strokeDasharray = `0, 100`;
        
        setTimeout(() => {
            circle.style.strokeDasharray = `${percentage}, 100`;
            text.textContent = `${percentage}%`;
            if(percentage >= 60) circle.style.stroke = "var(--success)";
            else if(percentage >= 40) circle.style.stroke = "#fcd34d";
            else circle.style.stroke = "var(--danger)";
        }, 100);
        
        // Verdict Cards
        const predBadge = document.getElementById('prediction-badge');
        predBadge.textContent = data.prediction;
        predBadge.className = `badge ${data.prediction.toLowerCase()}`;
        
        const confBadge = document.getElementById('confidence-badge');
        confBadge.textContent = data.confidence;
        confBadge.className = `badge ${data.confidence.toLowerCase()}`;
        
        // Insights
        const insightsList = document.getElementById('insights-list');
        insightsList.innerHTML = '';
        data.insights.forEach(insight => {
            const li = document.createElement('li');
            li.textContent = insight;
            insightsList.appendChild(li);
        });
        
        // Stats
        document.getElementById('stat-sl-a').textContent = data.stats.textA.avg_sentence_length;
        document.getElementById('stat-sl-b').textContent = data.stats.textB.avg_sentence_length;
        
        document.getElementById('stat-vr-a').textContent = data.stats.textA.vocab_richness;
        document.getElementById('stat-vr-b').textContent = data.stats.textB.vocab_richness;
        
        const formatTone = (isInformal) => isInformal ? "Informal 📱" : "Formal 👔";
        document.getElementById('stat-tone-a').textContent = formatTone(data.stats.textA.is_informal);
        document.getElementById('stat-tone-b').textContent = formatTone(data.stats.textB.is_informal);
        
        // Scroll to results smoothly
        setTimeout(() => {
            document.getElementById('results-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };
});
