document.addEventListener('DOMContentLoaded', () => {
    const textA = document.getElementById('textA');
    const textB = document.getElementById('textB');
    const countA = document.getElementById('countA');
    const countB = document.getElementById('countB');
    
    // Auto-update word counts
    const updateCount = (textarea, displayElement) => {
        const text = textarea.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        displayElement.textContent = words;
    };
    
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
