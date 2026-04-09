document.addEventListener('DOMContentLoaded', () => {
    // Tab switching functionality
    const setupTabSwitching = () => {
        const tabBtns = document.querySelectorAll('.tab-btn');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.target;
                const textarea = btn.dataset.textarea;
                
                // Remove active class from all tabs and buttons in same group
                const parent = btn.parentElement;
                parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-active'));
                btn.classList.add('tab-active');
                
                // Hide all input methods in same card
                const card = btn.closest('.bg-white');
                card.querySelectorAll('[id^="text-input-"], [id^="image-upload-"]').forEach(section => {
                    section.classList.add('hidden');
                });
                
                // Show target input method
                document.getElementById(target).classList.remove('hidden');
            });
        });
    };

    // Word count functionality
    const updateCount = (textarea, displayElement) => {
        const text = textarea.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        displayElement.textContent = `${words} words`;
    };

    // Image upload and OCR functionality
    const setupImageUpload = (imageInputId, previewId, loadingId, textareaId, countId, warningId) => {
        const imageInput = document.getElementById(imageInputId);
        const preview = document.getElementById(previewId);
        const loading = document.getElementById(loadingId);
        const textarea = document.getElementById(textareaId);
        const countElement = document.getElementById(countId);
        const warningElement = document.getElementById(warningId);
        const previewImg = preview.querySelector('img');
        const removeBtn = preview.querySelector('button');
        
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
        const uploadArea = imageInput.parentElement;
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('border-blue-500');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('border-blue-500');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('border-blue-500');
            
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

    // Initialize
    setupTabSwitching();
    
    // Setup text areas
    const textA = document.getElementById('textA');
    const textB = document.getElementById('textB');
    const countA = document.getElementById('countA');
    const countB = document.getElementById('countB');
    
    textA.addEventListener('input', () => updateCount(textA, countA));
    textB.addEventListener('input', () => updateCount(textB, countB));
    
    // Setup image uploads
    setupImageUpload('imageA', 'previewA', 'ocr-loading-a', 'textA', 'countA', 'ocr-warning-a');
    setupImageUpload('imageB', 'previewB', 'ocr-loading-b', 'textB', 'countB', 'ocr-warning-b');
    
    // Load Samples
    const loadSample = async (author) => {
        try {
            const res = await fetch(`/sample_data?author=${author}`);
            if(!res.ok) throw new Error('Network error');
            const data = await res.json();
            
            if(author === 'casual') {
                textA.value = data.sample1;
                textB.value = data.sample2;
            } else if(author === 'formal') {
                textA.value = data.sample1;
                textB.value = data.sample2;
            } else if(author === 'social') {
                textA.value = data.sample1;
                textB.value = data.sample2;
            }
            
            updateCount(textA, countA);
            updateCount(textB, countB);
            hideError();
            
        } catch (error) {
            showError('Failed to load sample data.');
        }
    };
    
    // Load sample data
    document.getElementById('loadSamples').addEventListener('click', async () => {
        await loadSample('casual');
    });
    
    // Analyze button
    document.getElementById('analyzeBtn').addEventListener('click', async () => {
        const textA_val = textA.value.trim();
        const textB_val = textB.value.trim();
        
        if (!textA_val || !textB_val) {
            showError('Please provide both text samples.');
            return;
        }
        
        if (textA_val.split(/\s+/).length < 10 || textB_val.split(/\s+/).length < 10) {
            showError('Each text sample should contain at least 10 words for accurate analysis.');
            return;
        }
        
        // Show loading state
        const loadingState = document.getElementById('loadingState');
        const resultsPanel = document.getElementById('results-panel');
        const progressBar = loadingState.querySelector('.progress-fill');
        
        loadingState.classList.remove('hidden');
        resultsPanel.classList.add('hidden');
        
        // Animate progress bar
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressBar.style.width = `${progress}%`;
        }, 300);
        
        try {
            const res = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ textA: textA_val, textB: textB_val })
            });
            
            if (!res.ok) throw new Error('Analysis failed');
            
            const data = await res.json();
            
            // Complete progress bar
            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            
            // Update results with animation
            setTimeout(() => {
                displayResults(data);
                loadingState.classList.add('hidden');
                resultsPanel.classList.remove('hidden');
            }, 500);
            
        } catch (error) {
            clearInterval(progressInterval);
            loadingState.classList.add('hidden');
            showError(error.message || 'Analysis failed. Please try again.');
        }
    });
    
    // Clear button
    document.getElementById('clearBtn').addEventListener('click', () => {
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
            const previewImg = preview.querySelector('img');
            const warning = document.getElementById(id === 'imageA' ? 'ocr-warning-a' : 'ocr-warning-b');
            input.value = '';
            preview.classList.add('hidden');
            previewImg.src = '';
            warning.classList.add('hidden');
        });
        
        // Reset to text tabs
        document.querySelectorAll('.tab-btn[data-target^="text-input"]').forEach(btn => btn.click());
    });
    
    // Display results
    const displayResults = (data) => {
        // Update similarity score with animation
        const similarityPercent = document.getElementById('similarity-percentage');
        const targetScore = data.similarity;
        let currentScore = 0;
        const increment = targetScore / 50;
        
        const scoreInterval = setInterval(() => {
            currentScore += increment;
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                clearInterval(scoreInterval);
            }
            similarityPercent.textContent = `${Math.round(currentScore)}%`;
        }, 30);
        
        // Update prediction
        document.getElementById('prediction-text').textContent = data.prediction;
        
        // Update confidence badge
        const confidenceBadge = document.getElementById('confidence-badge');
        const badgeText = confidenceBadge.querySelector('.badge-text');
        badgeText.textContent = `${data.confidence} Confidence`;
        
        // Update badge color
        confidenceBadge.className = 'px-3 py-1 rounded-full text-xs font-medium';
        if (data.confidence === 'High') {
            confidenceBadge.classList.add('bg-green-100', 'text-green-800');
        } else if (data.confidence === 'Medium') {
            confidenceBadge.classList.add('bg-yellow-100', 'text-yellow-800');
        } else {
            confidenceBadge.classList.add('bg-gray-100', 'text-gray-800');
        }
        
        // Update style analysis
        if (data.style_analysis) {
            document.getElementById('char-similarity').textContent = `${data.style_analysis.character_similarity}%`;
            document.getElementById('word-similarity').textContent = `${data.style_analysis.word_similarity}%`;
            document.getElementById('combined-similarity').textContent = `${data.style_analysis.combined_similarity}%`;
        }
        
        // Update insights
        const insightsList = document.getElementById('insights-list');
        insightsList.innerHTML = '';
        data.insights.forEach(insight => {
            const li = document.createElement('li');
            li.className = 'flex items-start space-x-2 text-sm text-gray-600';
            li.innerHTML = `
                <svg class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <span>${insight}</span>
            `;
            insightsList.appendChild(li);
        });
    };
    
    // Error handling
    const errorToast = document.getElementById('error-msg');
    const showError = (msg) => {
        errorToast.querySelector('span').textContent = msg;
        errorToast.classList.remove('hidden');
        setTimeout(hideError, 5000);
    };
    
    const hideError = () => {
        errorToast.classList.add('hidden');
    };
});
