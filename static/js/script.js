/* ============================================================
   Digital DNA Analyzer – main.js
   Full backend integration: Analyze, OCR, History, Insights
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Show Dashboard by default
    switchView('dashboard');

    // ──────────────── DOM Refs ────────────────
    const textA        = document.getElementById('textA');
    const combinedSimBar        = document.getElementById('combined-sim-bar');

    const uploadZoneA = document.getElementById('uploadZoneA');
    const uploadZoneB = document.getElementById('uploadZoneB');
    const fileInputA  = document.getElementById('fileInputA');
    const fileInputB  = document.getElementById('fileInputB');

    const newAnalysisBtn    = document.getElementById('newAnalysisBtn');
    const loadSamplesBtn    = document.getElementById('loadSamplesBtn');
    const clearAllBtn       = document.getElementById('clearAllBtn');
    const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
    
    // Analyze button and related elements
    const analyzeBtn        = document.getElementById('analyzeBtn');
    const analyzeIcon       = document.getElementById('analyze-icon');
    const btnText           = document.getElementById('btn-text');
    const btnLoading        = document.getElementById('btn-loading');
    
    // Word count elements
    const countA            = document.getElementById('countA');
    const countB            = document.getElementById('countB');
    
    // Results section
    const resultsSection     = document.getElementById('resultsSection');
    const similarityPercentage = document.getElementById('similarity-percentage');
    const authorPrediction  = document.getElementById('author-prediction');
    const confidenceBadge   = document.getElementById('confidence-badge');
    const confidenceText    = document.getElementById('confidence-text');
    const sentenceLength    = document.getElementById('sentence-length');
    const sentenceProgress  = document.getElementById('sentence-progress');
    const sentenceInsight   = document.getElementById('sentence-insight');
    const vocabRichness    = document.getElementById('vocab-richness');
    const vocabProgress     = document.getElementById('vocab-progress');
    const vocabInsight     = document.getElementById('vocab-insight');
    const toneDetection     = document.getElementById('tone-detection');
    const toneBadges        = document.getElementById('tone-badges');
    const toneInsight       = document.getElementById('tone-insight');
    const insightsList      = document.getElementById('insights-list');
    const progressCircle     = document.getElementById('progress-circle');
    
    // Deep style metrics elements
    const charPatterns       = document.getElementById('char-patterns');
    const writingRhythm     = document.getElementById('writing-rhythm');
    const syntaxStructure    = document.getElementById('syntax-structure');
    const semanticPatterns   = document.getElementById('semantic-patterns');

    // History table
    const historyTbody  = document.getElementById('history-tbody');
    const historyEmpty  = document.getElementById('history-empty');
    const historyLoading= document.getElementById('history-loading');
    const historyTable  = document.getElementById('history-table');

    // Insights
    const insightsStatsGrid = document.getElementById('insights-stats-grid');
    const insightsEmpty     = document.getElementById('insights-empty');
    const insightsLoading   = document.getElementById('insights-loading');

    // ──────────────── Toast System ────────────────
    const toastContainer = document.getElementById('toast-container');

    function showToast(message, type = 'error', duration = 5000) {
        const icons = { error: 'error', success: 'check_circle', info: 'info' };
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="material-symbols-outlined text-lg flex-shrink-0"
                  style="font-variation-settings:'FILL' 1;">${icons[type] || 'info'}</span>
            <span>${message}</span>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(8px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ──────────────── Word Count ────────────────
    function updateWordCount(textarea, countEl) {
        const text = textarea.value.trim();
        const words = text ? text.split(/\s+/).filter(w => w.length > 0).length : 0;
        countEl.textContent = `${words} words`;
    }

    textA.addEventListener('input', () => updateWordCount(textA, countA));
    textB.addEventListener('input', () => updateWordCount(textB, countB));

    // ──────────────── Navigation ────────────────
    function switchView(target) {
        // Validate target
        if (!target || (target !== 'dashboard' && target !== 'history' && target !== 'insights' && target !== 'support')) {
            return;
        }
        
        // Hide all view sections
        document.querySelectorAll('[data-view]').forEach(sec => sec.classList.add('hidden'));
        
        // Show target section with fade-in animation
        const targetSec = document.querySelector(`[data-view="${target}"]`);
        if (targetSec) {
            targetSec.classList.remove('hidden');
            targetSec.classList.remove('fade-in');
            void targetSec.offsetWidth; // reflow to restart animation
            targetSec.classList.add('fade-in');
        } else {
            return;
        }
        
        // Update navigation styling for both top nav and side nav
        updateNavigationStyling(target);
        
        // Load data for the view
        if (target === 'history') loadHistory();
        if (target === 'insights') loadInsights();
    }
    
    // Update navigation styling function
    function updateNavigationStyling(target) {
        // Top nav styling
        const topNavLinks = document.querySelectorAll('#top-nav .nav-link');
        if (topNavLinks.length > 0) {
            topNavLinks.forEach(a => {
                const isActive = a.dataset.nav === target;
                a.classList.toggle('text-[#4a7c59]', isActive);
                a.classList.toggle('border-b-2', isActive);
                a.classList.toggle('border-[#4a7c59]', isActive);
                a.classList.toggle('active-nav', isActive);
                a.classList.toggle('text-stone-500', !isActive);
                a.classList.toggle('hover:text-[#4a7c59]', !isActive);
                a.classList.toggle('hover:bg-stone-100', !isActive);
            });
        }
        
        // Side nav styling (including Support link)
        const sideNavLinks = document.querySelectorAll('.side-nav-link, [data-nav="support"]');
        if (sideNavLinks.length > 0) {
            sideNavLinks.forEach(a => {
                const isActive = a.dataset.nav === target;
                a.classList.toggle('text-[#4a7c59]', isActive);
                a.classList.toggle('font-bold', isActive);
                a.classList.toggle('bg-stone-200/50', isActive);
                a.classList.toggle('text-stone-600', !isActive);
            });
        }
        
        // Mobile nav styling
        const mobileNavLinks = document.querySelectorAll('#mobileMenu .nav-link');
        if (mobileNavLinks.length > 0) {
            mobileNavLinks.forEach(a => {
                const isActive = a.dataset.nav === target;
                a.classList.toggle('active-nav', isActive);
                a.classList.toggle('text-[#4a7c59]', isActive);
                a.classList.toggle('text-stone-500', !isActive);
            });
        }
        
        // Close mobile menu if open
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.classList.remove('active');
        }
    }

    // Set up navigation event listeners
    function setupNavigationListeners() {
        // Handle all navigation links (top nav, side nav, and mobile nav)
        const navLinks = document.querySelectorAll('[data-nav]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.dataset.nav;
                if (target) {
                    switchView(target);
                }
            });
        });
    }
    
    // Set up navigation after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupNavigationListeners);
    } else {
        setupNavigationListeners();
    }
    
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('active');
            }
        });
    }
    
    // Mobile sidebar toggle
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (sidebarToggleBtn && sidebar && sidebarOverlay) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
            sidebarOverlay.classList.toggle('hidden');
        });
        
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
        });
    }

    // ──────────────── Sample Buttons ────────────────
    document.querySelectorAll('.sample-btn').forEach(btn => {
        btn.addEventListener('click', () => loadSampleData(btn.dataset.sample));
    });

    // ──────────────── Load Sample Data ────────────────
    async function loadSampleData(author = 'casual') {
        try {
            const res = await fetch(`/sample_data?author=${encodeURIComponent(author)}`);
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Failed to load samples');
            textA.value = data.sample1 || '';
            textB.value = data.sample2 || '';
            updateWordCount(textA, countA);
            updateWordCount(textB, countB);
            showToast(`Sample loaded: ${author.replace('_', ' ')}`, 'success', 3000);
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    // Load casual samples on page load
    loadSampleData('casual_chat');

    // ──────────────── Analyze Similarity ────────────────
    analyzeBtn.addEventListener('click', analyzeSimilarity);

    async function analyzeSimilarity() {
        const ta = textA.value.trim();
        const tb = textB.value.trim();

        // Validation
        if (!ta || !tb) {
            showToast('Please provide both text samples.', 'error');
            return;
        }
        const wordsA = ta.split(/\s+/).filter(w => w.length > 0).length;
        const wordsB = tb.split(/\s+/).filter(w => w.length > 0).length;
        if (wordsA < 10 || wordsB < 10) {
            showToast('Each text sample must contain at least 10 words for accurate analysis.', 'error');
            return;
        }

        setAnalyzeLoading(true);
        resetResults();

        try {
            const res = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ textA: ta, textB: tb })
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Analysis failed');

            // Small visual delay so spinner feels real
            await sleep(800);

            renderResults(data);
            showToast('Analysis complete!', 'success', 3000);

        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setAnalyzeLoading(false);
        }
    }

    function setAnalyzeLoading(loading) {
        analyzeBtn.disabled = loading;
        btnText.classList.toggle('invisible', loading);
        analyzeIcon.classList.toggle('invisible', loading);
        btnLoading.classList.toggle('hidden', !loading);
    }

    function resetResults() {
        resultsSection.classList.add('hidden');
        progressCircle.style.strokeDashoffset = '552.92';
        similarityPercentage.textContent = '0%';
        authorPrediction.textContent = '—';
        confidenceText.textContent = '—';
    }

    // ──────────────── Render Results ────────────────
    function renderResults(data) {
        resultsSection.classList.remove('hidden');
        resultsSection.classList.remove('fade-in');
        void resultsSection.offsetWidth;
        resultsSection.classList.add('fade-in');

        // 1. Similarity circle animation
        animateNumber(similarityPercentage, 0, data.similarity, 1200, v => `${Math.round(v)}%`);
        const circumference = 2 * Math.PI * 88;
        const offset = circumference - (data.similarity / 100) * circumference;
        setTimeout(() => { progressCircle.style.strokeDashoffset = offset; }, 50);

        // 2. Prediction
        const isSame = data.prediction === 'YES';
        authorPrediction.textContent = isSame ? 'Same Author' : 'Different Author';

        // 3. Confidence badge
        const conf = data.confidence;
        confidenceText.textContent = `${conf} Confidence`;
        confidenceBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold';
        if (conf === 'High') {
            confidenceBadge.classList.add('bg-primary/10', 'text-primary');
        } else if (conf === 'Medium') {
            confidenceBadge.classList.add('bg-yellow-100', 'text-yellow-800');
        } else {
            confidenceBadge.classList.add('bg-stone-100', 'text-stone-600');
        }

        // 4. Style breakdown
        if (data.stats) {
            const sa = data.stats.textA;
            const sb = data.stats.textB;

            // Sentence length: backend gives floats like 14.5
            const avgSL = ((parseFloat(sa.avg_sentence_length) + parseFloat(sb.avg_sentence_length)) / 2).toFixed(1);
            sentenceLength.innerHTML = `${avgSL} <span class="text-xs text-stone-400 font-normal">avg words</span>`;
            const slPct = Math.min((avgSL / 25) * 100, 100);
            setTimeout(() => { sentenceProgress.style.width = `${slPct}%`; }, 100);
            const slDiff = Math.abs(parseFloat(sa.avg_sentence_length) - parseFloat(sb.avg_sentence_length));
            sentenceInsight.textContent = slDiff < 3
                ? 'Consistent sentence rhythm detected'
                : slDiff < 8
                    ? 'Moderate variation in sentence length'
                    : 'Significant difference in sentence length';

            // Vocabulary richness: backend returns "45.2%" string — parse it
            const vrA = parseFloat(sa.vocab_richness);  // already a % string like "45.2%"
            const vrB = parseFloat(sb.vocab_richness);
            const avgVR = ((vrA + vrB) / 2).toFixed(1);
            vocabRichness.innerHTML = `${avgVR}% <span class="text-xs text-stone-400 font-normal">type-token ratio</span>`;
            setTimeout(() => { vocabProgress.style.width = `${Math.min(avgVR, 100)}%`; }, 150);
            vocabInsight.textContent = avgVR > 70
                ? 'Sophisticated vocabulary range'
                : avgVR > 45
                    ? 'Moderate vocabulary diversity'
                    : 'Relatively limited vocabulary range';

            // Tone
            const toneA = sa.is_informal ? 'Informal' : 'Formal';
            const toneB = sb.is_informal ? 'Informal' : 'Formal';
            const toneMatch = sa.is_informal === sb.is_informal;
            toneDetection.textContent = toneMatch ? toneA : `${toneA} / ${toneB}`;
            const badgeCls = 'px-2 py-0.5 bg-stone-100 text-[10px] text-stone-500 rounded font-bold';
            toneBadges.innerHTML = [
                `<span class="${badgeCls}">${toneA.toUpperCase()}</span>`,
                toneB !== toneA ? `<span class="${badgeCls}">${toneB.toUpperCase()}</span>` : ''
            ].join('');
            toneInsight.textContent = toneMatch
                ? `Both texts share ${toneA.toLowerCase()} tone`
                : 'Different tones detected between texts';
        }

        // 5. Deep style metrics update
        if (charPatterns && writingRhythm && syntaxStructure && semanticPatterns) {
            const charComplexity = data.stats?.textA?.avg_sentence_length > 15 ? 'High' : 'Moderate';
            const rhythmPattern = data.stats?.textA?.is_informal ? 'Conversational' : 'Structured';
            const syntaxComplex = data.stats?.textA?.vocab_richness > 0.5 ? 'Complex' : 'Simple';
            const semanticDepth = data.insights?.length > 3 ? 'Rich' : 'Moderate';
            
            charPatterns.textContent = `${charComplexity} character complexity`;
            writingRhythm.textContent = `${rhythmPattern} writing pattern`;
            syntaxStructure.textContent = `${syntaxComplex} syntax structures`;
            semanticPatterns.textContent = `${semanticDepth} semantic depth`;
        }

        // 6. Key insights
        if (data.insights && data.insights.length > 0) {
            insightsList.innerHTML = data.insights.map(insight => `
                <div class="flex items-start gap-2 px-4 py-2 bg-stone-50 border border-stone-100 rounded-lg text-sm text-stone-600 w-full">
                    <span class="material-symbols-outlined text-sm text-primary flex-shrink-0 mt-0.5"
                          style="font-variation-settings:'FILL' 1;">check_circle</span>
                    <span>${insight}</span>
                </div>
            `).join('');
        } else {
            insightsList.innerHTML = '';
        }
    }

    // ──────────────── Clear All ────────────────
    function clearAll() {
        textA.value = '';
        textB.value = '';
        updateWordCount(textA, countA);
        updateWordCount(textB, countB);
        resultsSection.classList.add('hidden');
        resetResults();
        insightsList.innerHTML = '';
        toneBadges.innerHTML = '';
        
        // Reset deep metrics
        if (charPatterns) charPatterns.textContent = 'Analyzing...';
        if (writingRhythm) writingRhythm.textContent = 'Analyzing...';
        if (syntaxStructure) syntaxStructure.textContent = 'Analyzing...';
        if (semanticPatterns) semanticPatterns.textContent = 'Analyzing...';
    }

    // ──────────────── Button Events ────────────────
    newAnalysisBtn.addEventListener('click', () => {
        clearAll();
        switchView('dashboard');
    });

    loadSamplesBtn.addEventListener('click', () => loadSampleData('casual_chat'));

    clearAllBtn.addEventListener('click', clearAll);

    if (refreshHistoryBtn) {
        refreshHistoryBtn.addEventListener('click', loadHistory);
    }

    // ──────────────── Image Upload / OCR ────────────────
    function setupUploadZone(zone, fileInput, targetTextarea, countEl) {
        // Click to open file picker
        zone.addEventListener('click', () => fileInput.click());

        // File selected via picker
        fileInput.addEventListener('change', () => {
            if (fileInput.files[0]) handleOCR(fileInput.files[0], zone, targetTextarea, countEl);
        });

        // Drag & Drop
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragging');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragging');
            const file = e.dataTransfer.files[0];
            if (file) handleOCR(file, zone, targetTextarea, countEl);
        });
    }

    async function handleOCR(file, zone, targetTextarea, countEl) {
        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file (PNG, JPG, etc.).', 'error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showToast('File is too large. Maximum size is 10 MB.', 'error');
            return;
        }

        // Show overlay
        const overlay = document.createElement('div');
        overlay.className = 'ocr-overlay';
        overlay.innerHTML = `
            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8 8 8 0 018 8z"></path>
            </svg>
            Extracting text via OCR…
        `;
        zone.appendChild(overlay);
        zone.style.pointerEvents = 'none';

        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await fetch('/extract_text', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'OCR failed');

            targetTextarea.value = data.text || '';
            updateWordCount(targetTextarea, countEl);

            const conf = data.validation?.confidence;
            if (conf && conf !== 'high') {
                showToast('OCR complete. Please review the extracted text for accuracy.', 'info', 6000);
            } else {
                showToast(`Text extracted successfully (${data.word_count} words)`, 'success', 4000);
            }
        } catch (err) {
            showToast(`OCR Error: ${err.message}`, 'error');
        } finally {
            overlay.remove();
            zone.style.pointerEvents = '';
        }
    }

    setupUploadZone(uploadZoneA, fileInputA, textA, countA);
    setupUploadZone(uploadZoneB, fileInputB, textB, countB);

    // ──────────────── History ────────────────
    async function loadHistory() {
        // Get DOM elements safely
        const historyLoadingEl = document.getElementById('history-loading');
        const historyTableEl = document.getElementById('history-table');
        const historyEmptyEl = document.getElementById('history-empty');
        const historyTbodyEl = document.getElementById('history-tbody');
        
        if (historyLoadingEl) historyLoadingEl.classList.remove('hidden');
        if (historyTableEl) historyTableEl.classList.add('hidden');
        if (historyEmptyEl) historyEmptyEl.classList.add('hidden');

        try {
            const res = await fetch('/history');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load history');

            const analyses = data.analyses || [];
            if (historyLoadingEl) historyLoadingEl.classList.add('hidden');

            if (analyses.length === 0) {
                if (historyEmptyEl) historyEmptyEl.classList.remove('hidden');
                return;
            }

            if (historyTbodyEl) {
                historyTbodyEl.innerHTML = analyses.map((a, i) => {
                    const isSame = a.prediction === 'Same Author' || a.prediction === 'YES';
                    const verdictClass = isSame
                        ? 'bg-primary/10 text-primary'
                        : 'bg-red-50 text-red-700';
                    const confClass = a.confidence === 'High'
                        ? 'bg-primary/10 text-primary'
                        : a.confidence === 'Medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-stone-100 text-stone-600';

                    return `
                        <tr class="history-row transition-colors">
                            <td class="px-6 py-4 text-sm text-stone-400">${i + 1}</td>
                            <td class="px-6 py-4 text-sm text-stone-600">${a.date}</td>
                            <td class="px-6 py-4 text-center">
                                <span class="text-lg font-bold text-primary">${a.similarity}%</span>
                            </td>
                            <td class="px-6 py-4 text-center">
                                <span class="px-3 py-1 rounded-full text-xs font-semibold ${verdictClass}">
                                    ${isSame ? 'Same Author' : 'Different Author'}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-center">
                                <span class="px-3 py-1 rounded-full text-xs font-semibold ${confClass}">
                                    ${a.confidence}
                                </span>
                            </td>
                        </tr>
                    `;
                }).join('');
            }

            if (historyTableEl) historyTableEl.classList.remove('hidden');
        } catch (err) {
            if (historyLoadingEl) historyLoadingEl.classList.add('hidden');
            showToast(err.message, 'error');
        }
    }

    // ──────────────── Insights ────────────────
    async function loadInsights() {
        // Get DOM elements safely
        const insightsLoadingEl = document.getElementById('insights-loading');
        const insightsEmptyEl = document.getElementById('insights-empty');
        const insightsStatsGridEl = document.getElementById('insights-stats-grid');
        
        if (insightsLoadingEl) insightsLoadingEl.classList.remove('hidden');
        if (insightsEmptyEl) insightsEmptyEl.classList.add('hidden');
        if (insightsStatsGridEl) insightsStatsGridEl.innerHTML = '';

        try {
            const res = await fetch('/insights');
            const data = await res.json();
            if (insightsLoadingEl) insightsLoadingEl.classList.add('hidden');

            if (!res.ok) throw new Error(data.error || 'Failed to load insights');

            if (data.total_analyses === 0) {
                if (insightsEmptyEl) insightsEmptyEl.classList.remove('hidden');
                return;
            }

            const cards = [
                {
                    icon: 'analytics',
                    label: 'Total Analyses',
                    value: data.total_analyses,
                    unit: 'analyses run',
                    color: 'text-primary',
                    bg: 'bg-primary/10'
                },
                {
                    icon: 'percent',
                    label: 'Avg Similarity',
                    value: `${data.avg_similarity}%`,
                    unit: 'average match score',
                    color: 'text-tertiary',
                    bg: 'bg-tertiary/10'
                },
                {
                    icon: 'groups',
                    label: 'Same Author',
                    value: data.same_author_predictions,
                    unit: `of ${data.total_analyses} analyses`,
                    color: 'text-green-700',
                    bg: 'bg-green-50'
                },
                {
                    icon: 'person_off',
                    label: 'Different Author',
                    value: data.different_author_predictions,
                    unit: `of ${data.total_analyses} analyses`,
                    color: 'text-red-700',
                    bg: 'bg-red-50'
                }
            ];

            if (insightsStatsGridEl) {
                insightsStatsGridEl.innerHTML = cards.map(c => `
                    <div class="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
                        <div class="w-10 h-10 rounded-full ${c.bg} flex items-center justify-center ${c.color} mb-4">
                            <span class="material-symbols-outlined">${c.icon}</span>
                        </div>
                        <p class="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-1">${c.label}</p>
                        <p class="text-3xl font-bold ${c.color}">${c.value}</p>
                        <p class="text-xs text-stone-400 mt-1">${c.unit}</p>
                    </div>
                `).join('');
            }

        } catch (err) {
            if (insightsLoadingEl) insightsLoadingEl.classList.add('hidden');
            showToast(err.message, 'error');
        }
    }

    // ──────────────── Utility: animated number ────────────────
    function animateNumber(el, from, to, duration, formatter) {
        const start = performance.now();
        function tick(now) {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
            el.textContent = formatter(from + (to - from) * eased);
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    // ──────────────── Init ────────────────
    switchView('dashboard');
});
