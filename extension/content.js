const API_URL = 'http://localhost:8000/predict';

// State management
let state = {
    enabled: true,
    highlight: true,
    showConfidence: true,
    filter: 'all',
    stats: {
        total: 0,
        buy: 0,
        hold: 0,
        sell: 0
    },
    analyzedElements: new Map() // Track analyzed elements to avoid duplicates
};

// Load settings from storage
async function loadSettings() {
    const result = await chrome.storage.local.get(['enabled', 'highlight', 'showConfidence', 'filter', 'stats']);
    state.enabled = result.enabled !== false;
    state.highlight = result.highlight !== false;
    state.showConfidence = result.showConfidence !== false;
    state.filter = result.filter || 'all';
    if (result.stats) {
        state.stats = result.stats;
    }
}

// Save stats to storage
async function saveStats() {
    await chrome.storage.local.set({ stats: state.stats });
}

// Function to analyze text and return sentiment
async function analyzeText(text) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error analyzing text:', error);
        return null;
    }
}

// Function to get color based on sentiment
function getSentimentColor(sentiment) {
    const colors = {
        'Buy': '#4caf50',
        'Hold': '#ff9800',
        'Sell': '#f44336'
    };
    return colors[sentiment] || '#666';
}

// Function to get sentiment class
function getSentimentClass(sentiment) {
    return `sentiment-${sentiment.toLowerCase()}`;
}

// Function to check if element should be shown based on filter
function shouldShowElement(sentiment) {
    if (state.filter === 'all') return true;
    return state.filter === sentiment;
}

// Function to add sentiment badge to element
function addSentimentBadge(element, sentiment, confidence, probabilities) {
    // Safety check: don't add badges to grid/table cells
    let current = element;
    let depth = 0;
    while (current && depth < 5) {
        const tagName = current.tagName?.toLowerCase();
        const classList = (current.className || '').toLowerCase();
        if (tagName === 'td' || tagName === 'th' || tagName === 'tr' ||
            classList.includes('grid') || classList.includes('table') || 
            classList.includes('cell') || classList.includes('data-table')) {
            // Don't add badges to data structures
            return;
        }
        current = current.parentElement;
        depth++;
    }
    
    // Remove existing badge container if present
    const existingBadge = element.querySelector('.sentiment-badge-container');
    if (existingBadge) {
        existingBadge.remove();
    }
    
    // Check filter
    if (!shouldShowElement(sentiment)) {
        element.style.opacity = '0.3';
        // Still remove badge if filtered
        const filteredBadge = element.querySelector('.sentiment-badge-container');
        if (filteredBadge) filteredBadge.remove();
        return;
    } else {
        element.style.opacity = '1';
    }
    
    // Ensure element is a block or inline-block for proper positioning
    const originalDisplay = window.getComputedStyle(element).display;
    if (originalDisplay === 'inline') {
        element.style.display = 'inline-block';
    }
    
    // Create badge container
    const badgeContainer = document.createElement('span');
    badgeContainer.className = 'sentiment-badge-container';
    badgeContainer.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-left: 10px;
        vertical-align: middle;
        position: relative;
        z-index: 1000;
    `;
    
    // Create main badge
    const badge = document.createElement('span');
    badge.className = `sentiment-badge ${getSentimentClass(sentiment)}`;
    badge.textContent = sentiment;
    badge.style.cssText = `
        background: ${getSentimentColor(sentiment)};
        color: white;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: bold;
        display: inline-block;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: transform 0.2s;
        white-space: nowrap;
    `;
    
    badge.addEventListener('mouseenter', () => {
        badge.style.transform = 'scale(1.1)';
    });
    
    badge.addEventListener('mouseleave', () => {
        badge.style.transform = 'scale(1)';
    });
    
    // Add confidence tooltip
    const confidencePercent = (confidence * 100).toFixed(1);
    badge.title = `Confidence: ${confidencePercent}%`;
    
    badgeContainer.appendChild(badge);
    
    // Add confidence score if enabled
    if (state.showConfidence) {
        const confidenceBadge = document.createElement('span');
        confidenceBadge.className = 'confidence-badge';
        confidenceBadge.textContent = `${confidencePercent}%`;
        confidenceBadge.style.cssText = `
            background: rgba(0,0,0,0.1);
            color: #666;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 500;
            white-space: nowrap;
        `;
        badgeContainer.appendChild(confidenceBadge);
    }
    
    // Highlight element if enabled
    if (state.highlight) {
        element.style.transition = 'background-color 0.3s, padding 0.3s';
        const bgColor = getSentimentColor(sentiment);
        const currentPadding = window.getComputedStyle(element).padding;
        if (!element.dataset.originalPadding) {
            element.dataset.originalPadding = currentPadding;
        }
        element.style.backgroundColor = `${bgColor}15`; // 15% opacity
        if (!element.style.padding || element.style.padding === '0px') {
            element.style.padding = '4px 8px';
        }
        element.style.borderRadius = '4px';
        element.style.borderLeft = `3px solid ${bgColor}`;
    }
    
    element.style.position = 'relative';
    // Append to the end of element's content
    element.appendChild(badgeContainer);
}

// Function to update stats
function updateStats(sentiment) {
    state.stats.total++;
    if (sentiment === 'Buy') state.stats.buy++;
    else if (sentiment === 'Hold') state.stats.hold++;
    else if (sentiment === 'Sell') state.stats.sell++;
    saveStats();
}

// Function to check if element is likely a headline
function isLikelyHeadline(element) {
    // Skip if element is hidden
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
    }
    
    const text = element.textContent.trim();
    
    // Skip if element contains only numbers/percentages/symbols (data cells)
    if (/^[\d.%\s\-+$€£¥]+$/.test(text) || text.length < 10) {
        return false;
    }
    
    // For links (common in Yahoo Finance), be more lenient with numbers
    const isLink = element.tagName?.toLowerCase() === 'a';
    const digitCount = (text.match(/\d/g) || []).length;
    // Links can have more numbers (like dates, stock symbols), so allow up to 40%
    const maxDigitRatio = isLink ? 0.4 : 0.3;
    if (digitCount / text.length > maxDigitRatio && text.length < 50) {
        return false;
    }
    
    // Skip if element is inside a grid, table, or data container
    let current = element;
    let depth = 0;
    while (current && depth < 5) {
        const classList = (current.className || '').toLowerCase();
        const tagName = current.tagName?.toLowerCase();
        const id = (current.id || '').toLowerCase();
        
        // Skip if inside grid/table structures
        if (classList.includes('grid') || 
            classList.includes('table') ||
            classList.includes('data-table') ||
            classList.includes('cell') ||
            classList.includes('row') ||
            classList.includes('column') ||
            classList.includes('percentage') ||
            id.includes('grid') ||
            id.includes('table') ||
            tagName === 'td' || 
            tagName === 'th' ||
            tagName === 'tr' ||
            (tagName === 'div' && (classList.includes('cell') || classList.includes('grid-item')))) {
            // Only allow actual heading tags (h1-h6) even in these structures
            const tag = element.tagName?.toLowerCase();
            if (!['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
                return false;
            }
        }
        current = current.parentElement;
        depth++;
    }
    
    // Prefer actual heading elements
    const tag = element.tagName?.toLowerCase();
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        // Heading elements are more likely to be headlines
        return true;
    }
    
    // For other elements, check if they look like headlines
    // Must have substantial text content (not just numbers)
    const wordCount = text.split(/\s+/).filter(w => w.length > 2).length;
    if (wordCount < 3) {
        return false;
    }
    
    // Skip if element has sentiment badge already (to avoid re-analyzing)
    if (element.querySelector('.sentiment-badge-container')) {
        return false;
    }
    
    return true;
}

// Website detection functions
function detectWebsite() {
    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    
    if (hostname.includes('yahoo.com') || hostname.includes('finance.yahoo.com')) {
        return 'yahoo';
    } else if (hostname.includes('marketwatch.com')) {
        return 'marketwatch';
    } else if (hostname.includes('reuters.com')) {
        return 'reuters';
    } else if (hostname.includes('bloomberg.com')) {
        return 'bloomberg';
    } else if (hostname.includes('cnbc.com')) {
        return 'cnbc';
    } else if (hostname.includes('ft.com') || hostname.includes('financialtimes.com')) {
        return 'ft';
    } else if (hostname.includes('wsj.com') || hostname.includes('wallstreetjournal.com')) {
        return 'wsj';
    } else if (hostname.includes('investing.com')) {
        return 'investing';
    } else if (hostname.includes('seekingalpha.com')) {
        return 'seekingalpha';
    } else if (hostname.includes('fool.com') || hostname.includes('fool.co.uk')) {
        return 'fool';
    } else if (hostname.includes('barrons.com')) {
        return 'barrons';
    } else if (hostname.includes('nasdaq.com')) {
        return 'nasdaq';
    } else if (hostname.includes('benzinga.com')) {
        return 'benzinga';
    } else if (hostname.includes('thestreet.com')) {
        return 'thestreet';
    } else if (hostname.includes('zacks.com')) {
        return 'zacks';
    } else if (hostname.includes('morningstar.com')) {
        return 'morningstar';
    } else if (hostname.includes('fidelity.com')) {
        return 'fidelity';
    } else if (hostname.includes('schwab.com')) {
        return 'schwab';
    } else if (hostname.includes('etrade.com')) {
        return 'etrade';
    } else if (hostname.includes('tdameritrade.com') || hostname.includes('td.com')) {
        return 'td';
    } else if (hostname.includes('finance') || hostname.includes('financial') || 
               pathname.includes('/finance/') || pathname.includes('/financial/') ||
               pathname.includes('/markets/') || pathname.includes('/stocks/') ||
               pathname.includes('/news/') || pathname.includes('/article/')) {
        return 'generic-financial';
    }
    return 'generic';
}

// Check if we're on Yahoo Finance (for backward compatibility)
function isYahooFinance() {
    return detectWebsite() === 'yahoo';
}

// Website-specific selector configurations
const websiteSelectors = {
    yahoo: [
        'h3 a', 'h4 a', 'h2 a',
        'a.js-content-viewer',
        'a[href*="/news/"]', 'a[href*="/article/"]', 'a[href*="/story/"]',
        'h3[class*="Fw(b)"]', 'h4[class*="Fw(b)"]', 'h2[class*="Fw(b)"]',
        '[class*="Fw(b)"] a', '[class*="Mb(5px)"] a', '[class*="Mb(10px)"] a', '[class*="Lh(1.5)"] a',
        '[data-test-locator="stream-item"] h3', '[data-test-locator="stream-item"] h4', '[data-test-locator="stream-item"] h2', '[data-test-locator="stream-item"] a',
        '[data-module="StreamItem"] h3', '[data-module="StreamItem"] h4', '[data-module="StreamItem"] a',
        'li[class*="js-stream-content"] h3', 'li[class*="js-stream-content"] h4', 'li[class*="js-stream-content"] h2', 'li[class*="js-stream-content"] a',
        'ul[class*="stream-items"] h3', 'ul[class*="stream-items"] h4', 'ul[class*="stream-items"] a',
        '[id*="stream"] h3', '[id*="stream"] h4', '[id*="stream"] a',
        '[class*="stream"] h3', '[class*="stream"] h4', '[class*="stream"] a',
        'section[class*="news"] h3', 'section[class*="news"] h4', 'section[class*="news"] a',
        'div[class*="news"] h3', 'div[class*="news"] h4', 'div[class*="news"] a',
        'a[href*="finance.yahoo.com/news"]', 'a[href*="finance.yahoo.com/article"]'
    ],
    marketwatch: [
        'article h1', 'article h2', 'article h3',
        '.article__headline', '.article__headline a',
        '.headline', '.headline a',
        '[class*="headline"] a',
        'h1.headline', 'h2.headline', 'h3.headline',
        'a[href*="/story/"]', 'a[href*="/article/"]',
        '.article-item h3', '.article-item h2',
        '.listHeadline', '.listHeadline a',
        '[data-module="ArticleHeadline"]'
    ],
    reuters: [
        'article h1', 'article h2', 'article h3',
        '.article-header__title', '.article-header__title__3Y9Q',
        '.story-collection__story__headline', '.story-collection__story__headline a',
        '.media-story-card__headline', '.media-story-card__headline a',
        'h2[data-testid="Heading"]', 'h3[data-testid="Heading"]',
        'a[href*="/article/"]', 'a[href*="/business/"]',
        '[data-testid="MediaStoryCard"] h2', '[data-testid="MediaStoryCard"] h3'
    ],
    bloomberg: [
        'article h1', 'article h2', 'article h3',
        '.story-list-story__info__headline', '.story-list-story__info__headline a',
        '.headline', '.headline a',
        'h1.headline', 'h2.headline', 'h3.headline',
        'a[href*="/news/articles/"]',
        '[data-module="Story"] h2', '[data-module="Story"] h3',
        '.story-package-module__headline', '.story-package-module__headline a'
    ],
    cnbc: [
        'article h1', 'article h2', 'article h3',
        '.Card-title', '.Card-title a',
        '.headline', '.headline a',
        'h1.headline', 'h2.headline', 'h3.headline',
        'a[href*="/202"]', // CNBC uses date-based URLs
        '[data-module="ArticleCard"] h2', '[data-module="ArticleCard"] h3',
        '.ArticleCard-headline', '.ArticleCard-headline a'
    ],
    ft: [
        'article h1', 'article h2', 'article h3',
        '.article-headline', '.article-headline a',
        '.story-headline', '.story-headline a',
        'h1.headline', 'h2.headline', 'h3.headline',
        'a[href*="/content/"]',
        '[data-module="Article"] h1', '[data-module="Article"] h2'
    ],
    wsj: [
        'article h1', 'article h2', 'article h3',
        '.WSJTheme--headline', '.WSJTheme--headline a',
        '.headline', '.headline a',
        'h1.headline', 'h2.headline', 'h3.headline',
        'a[href*="/articles/"]',
        '[data-module="Article"] h1', '[data-module="Article"] h2'
    ],
    investing: [
        'article h1', 'article h2', 'article h3',
        '.articleItem', '.articleItem a',
        '.articleHeader', '.articleHeader a',
        'h1.articleHeader', 'h2.articleHeader', 'h3.articleHeader',
        'a[href*="/news/"]', 'a[href*="/article/"]'
    ],
    seekingalpha: [
        'article h1', 'article h2', 'article h3',
        '.article-title', '.article-title a',
        '.headline', '.headline a',
        'h1.headline', 'h2.headline', 'h3.headline',
        'a[href*="/article/"]',
        '[data-module="Article"] h1', '[data-module="Article"] h2'
    ],
    fool: [
        'article h1', 'article h2', 'article h3',
        '.article-title', '.article-title a',
        '.headline', '.headline a',
        'h1.headline', 'h2.headline', 'h3.headline',
        'a[href*="/investing/"]', 'a[href*="/news/"]'
    ],
    barrons: [
        'article h1', 'article h2', 'article h3',
        '.article-headline', '.article-headline a',
        '.headline', '.headline a',
        'h1.headline', 'h2.headline', 'h3.headline',
        'a[href*="/articles/"]'
    ],
    nasdaq: [
        'article h1', 'article h2', 'article h3',
        '.article-headline', '.article-headline a',
        '.headline', '.headline a',
        'h1.headline', 'h2.headline', 'h3.headline',
        'a[href*="/article/"]', 'a[href*="/news/"]'
    ],
    benzinga: [
        'article h1', 'article h2', 'article h3',
        '.article-title', '.article-title a',
        '.headline', '.headline a',
        'h1.headline', 'h2.headline', 'h3.headline',
        'a[href*="/news/"]', 'a[href*="/article/"]'
    ],
    thestreet: [
        'article h1', 'article h2', 'article h3',
        '.article-headline', '.article-headline a',
        '.headline', '.headline a',
        'h1.headline', 'h2.headline', 'h3.headline',
        'a[href*="/news/"]', 'a[href*="/article/"]'
    ],
    zacks: [
        'article h1', 'article h2', 'article h3',
        '.article-title', '.article-title a',
        '.headline', '.headline a',
        'h1.headline', 'h2.headline', 'h3.headline',
        'a[href*="/news/"]', 'a[href*="/article/"]'
    ],
    morningstar: [
        'article h1', 'article h2', 'article h3',
        '.article-headline', '.article-headline a',
        '.headline', '.headline a',
        'h1.headline', 'h2.headline', 'h3.headline',
        'a[href*="/news/"]', 'a[href*="/article/"]'
    ],
    fidelity: [
        'article h1', 'article h2', 'article h3',
        '.article-title', '.article-title a',
        '.headline', '.headline a',
        'h1.headline', 'h2.headline', 'h3.headline',
        'a[href*="/news/"]', 'a[href*="/research/"]'
    ],
    schwab: [
        'article h1', 'article h2', 'article h3',
        '.article-title', '.article-title a',
        '.headline', '.headline a',
        'h1.headline', 'h2.headline', 'h3.headline',
        'a[href*="/news/"]', 'a[href*="/research/"]'
    ],
    etrade: [
        'article h1', 'article h2', 'article h3',
        '.article-title', '.article-title a',
        '.headline', '.headline a',
        'h1.headline', 'h2.headline', 'h3.headline',
        'a[href*="/news/"]', 'a[href*="/research/"]'
    ],
    td: [
        'article h1', 'article h2', 'article h3',
        '.article-title', '.article-title a',
        '.headline', '.headline a',
        'h1.headline', 'h2.headline', 'h3.headline',
        'a[href*="/news/"]', 'a[href*="/research/"]'
    ],
    'generic-financial': [
        'article h1', 'article h2', 'article h3',
        'main h1', 'main h2', 'main h3',
        '[role="article"] h1', '[role="article"] h2',
        '[role="main"] h1', '[role="main"] h2',
        'section h1', 'section h2', 'section h3',
        'a[href*="/news/"]', 'a[href*="/article/"]', 'a[href*="/story/"]',
        'a[href*="/finance/"]', 'a[href*="/financial/"]',
        'a[href*="/markets/"]', 'a[href*="/stocks/"]'
    ],
    generic: [
        'article h1', 'article h2', 'article h3',
        'main h1', 'main h2', 'main h3',
        '[role="article"] h1', '[role="article"] h2',
        '[role="main"] h1', '[role="main"] h2'
    ]
};

// Common class-based selectors (used for all sites)
const commonClassSelectors = [
    '[class*="headline"]:not([class*="grid"]):not([class*="list"]):not([class*="cell"]):not([class*="table"])',
    '[class*="article-title"]',
    '[class*="news-title"]',
    '[class*="story-title"]',
    '[class*="post-title"]',
    '[data-testid*="headline"]',
    '[data-testid*="title"]'
];

// Function to analyze headlines on the page
async function analyzeHeadlines(force = false) {
    if (!state.enabled && !force) return;
    
    const website = detectWebsite();
    const isYahoo = website === 'yahoo';
    
    // More specific selectors for headlines - prioritize actual heading elements
    // Focus on semantic HTML and article content
    const headlineSelectors = [
        'article h1',
        'article h2',
        'article h3',
        'main h1',
        'main h2',
        'main h3',
        '[role="article"] h1',
        '[role="article"] h2',
        '[role="main"] h1',
        '[role="main"] h2',
        'section h1',
        'section h2',
        'section h3'
    ];
    
    // Only use generic h1-h3 if they're in article-like contexts
    const genericHeadings = ['h1', 'h2', 'h3'];
    
    // Get website-specific selectors
    const siteSpecificSelectors = websiteSelectors[website] || websiteSelectors.generic;
    
    const headlines = new Set();
    
    // First, collect actual heading elements from article contexts
    headlineSelectors.forEach(selector => {
        try {
            document.querySelectorAll(selector).forEach(el => {
                const text = el.textContent.trim();
                if (text.length > 20 && text.length < 500 && 
                    isLikelyHeadline(el) &&
                    !headlines.has(el) && 
                    !state.analyzedElements.has(el)) {
                    headlines.add(el);
                }
            });
        } catch (e) {
            // Ignore selector errors
        }
    });
    
    // Then collect generic headings, but only if they're not in data structures
    genericHeadings.forEach(tag => {
        try {
            document.querySelectorAll(tag).forEach(el => {
                // Skip if already collected
                if (headlines.has(el) || state.analyzedElements.has(el)) return;
                
                const text = el.textContent.trim();
                if (text.length > 20 && text.length < 500 && isLikelyHeadline(el)) {
                    // Double-check it's not in a grid/table
                    let parent = el.parentElement;
                    let isInDataStructure = false;
                    let depth = 0;
                    while (parent && depth < 4) {
                        const parentClass = (parent.className || '').toLowerCase();
                        const parentTag = parent.tagName?.toLowerCase();
                        if (parentClass.includes('grid') || 
                            parentClass.includes('table') ||
                            parentClass.includes('data-table') ||
                            parentClass.includes('cell') ||
                            parentTag === 'td' ||
                            parentTag === 'th' ||
                            parentTag === 'tr') {
                            isInDataStructure = true;
                            break;
                        }
                        parent = parent.parentElement;
                        depth++;
                    }
                    
                    if (!isInDataStructure) {
                        headlines.add(el);
                    }
                }
            });
        } catch (e) {
            // Ignore selector errors
        }
    });
    
    // Site-specific headlines - prioritize these for each financial website
    // Use more lenient rules for financial news sites (especially Yahoo Finance)
    const isFinancialSite = website !== 'generic';
    const minTextLength = isFinancialSite ? 10 : 20;
    const maxDigitRatio = (isYahoo || isFinancialSite) ? 0.4 : 0.3;
    const maxDepth = isYahoo ? 6 : 5;
    
    siteSpecificSelectors.forEach(selector => {
        try {
            document.querySelectorAll(selector).forEach(el => {
                // Skip if already collected
                if (headlines.has(el) || state.analyzedElements.has(el)) return;
                
                // For links, get the text content
                const text = el.textContent.trim();
                
                // Financial sites often have specific patterns - be more lenient
                if (text.length > minTextLength && text.length < 500) {
                    // Check if it's a link - if so, we want to analyze the link text
                    let targetElement = el;
                    if (el.tagName?.toLowerCase() === 'a') {
                        // For links, prefer the link itself (it contains the headline text)
                        targetElement = el;
                    } else if (el.tagName?.toLowerCase().match(/^h[1-6]$/)) {
                        // For headings, check if they contain a link
                        const link = el.querySelector('a');
                        if (link && link.textContent.trim().length > minTextLength) {
                            targetElement = link;
                        } else {
                            targetElement = el;
                        }
                    }
                    
                    // Get the actual text to analyze
                    const targetText = targetElement.textContent.trim();
                    
                    // Skip if text looks like data (only numbers/percentages)
                    if (/^[\d.%\s\-+$€£¥]+$/.test(targetText)) {
                        return;
                    }
                    
                    // Skip if mostly numbers (more lenient for financial sites)
                    const digitCount = (targetText.match(/\d/g) || []).length;
                    if (digitCount / targetText.length > maxDigitRatio && targetText.length < 50) {
                        return;
                    }
                    
                    // Must have at least 3 words
                    const wordCount = targetText.split(/\s+/).filter(w => w.length > 2).length;
                    if (wordCount < 3) {
                        return;
                    }
                    
                    // Skip if in data structures (more lenient for financial sites)
                    let parent = targetElement.parentElement;
                    let isInDataStructure = false;
                    let depth = 0;
                    while (parent && depth < maxDepth) {
                        const parentClass = (parent.className || '').toLowerCase();
                        const parentTag = parent.tagName?.toLowerCase();
                        const parentId = (parent.id || '').toLowerCase();
                        // Only skip obvious data tables, not news containers
                        if (parentClass.includes('data-table') ||
                            parentClass.includes('financial-data') ||
                            parentClass.includes('quote-summary') ||
                            parentClass.includes('quote-header') ||
                            parentClass.includes('price-data') ||
                            parentClass.includes('grid') ||
                            parentClass.includes('table') ||
                            parentId.includes('quote-summary') ||
                            parentId.includes('grid') ||
                            parentId.includes('table') ||
                            parentTag === 'td' ||
                            parentTag === 'th' ||
                            parentTag === 'tr') {
                            // Only skip actual data tables
                            isInDataStructure = true;
                            break;
                        }
                        parent = parent.parentElement;
                        depth++;
                    }
                    
                    if (!isInDataStructure && isLikelyHeadline(targetElement)) {
                        headlines.add(targetElement);
                    }
                }
            });
        } catch (e) {
            // Ignore selector errors
            if (isYahoo) {
                console.error('Site selector error:', e);
            }
        }
    });
    
    // Finally, collect class-based headlines (most selective)
    commonClassSelectors.forEach(selector => {
        try {
            document.querySelectorAll(selector).forEach(el => {
                // Skip if already collected
                if (headlines.has(el) || state.analyzedElements.has(el)) return;
                
                const text = el.textContent.trim();
                if (text.length > 20 && text.length < 500 && isLikelyHeadline(el)) {
                    // Additional strict check: make sure it's not in a grid/list/table structure
                    let parent = el.parentElement;
                    let isInDataStructure = false;
                    let depth = 0;
                    while (parent && depth < 5) {
                        const parentClass = (parent.className || '').toLowerCase();
                        const parentTag = parent.tagName?.toLowerCase();
                        const parentId = (parent.id || '').toLowerCase();
                        if (parentClass.includes('grid') || 
                            parentClass.includes('list') || 
                            parentClass.includes('table') ||
                            parentClass.includes('data-table') ||
                            parentClass.includes('cell') ||
                            parentClass.includes('row') ||
                            parentClass.includes('column') ||
                            parentId.includes('grid') ||
                            parentId.includes('table') ||
                            parentTag === 'td' ||
                            parentTag === 'th' ||
                            parentTag === 'tr') {
                            isInDataStructure = true;
                            break;
                        }
                        parent = parent.parentElement;
                        depth++;
                    }
                    
                    if (!isInDataStructure) {
                        headlines.add(el);
                    }
                }
            });
        } catch (e) {
            // Ignore selector errors
        }
    });
    
    // Analyze each headline
    for (const headline of headlines) {
        const text = headline.textContent.trim();
        
        // Final check: skip if text looks like data (only numbers/percentages/symbols)
        if (/^[\d.%\s\-+$€£¥]+$/.test(text)) {
            continue;
        }
        
        // Skip if mostly numbers (more lenient for links on financial sites)
        const isLink = headline.tagName?.toLowerCase() === 'a';
        const digitCount = (text.match(/\d/g) || []).length;
        const isFinancialSite = website !== 'generic';
        const maxDigitRatio = (isFinancialSite && isLink) ? 0.4 : 0.3;
        if (digitCount / text.length > maxDigitRatio && text.length < 50) {
            continue;
        }
        
        // Must have meaningful words
        const wordCount = text.split(/\s+/).filter(w => w.length > 2).length;
        if (wordCount < 3) {
            continue;
        }
        
        const result = await analyzeText(text);
        
        if (result && result.sentiment) {
            state.analyzedElements.set(headline, result);
            addSentimentBadge(headline, result.sentiment, result.confidence, result.probabilities);
            updateStats(result.sentiment);
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// Message listener for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        switch (request.action) {
            case 'getStatus':
                sendResponse({ stats: state.stats, enabled: state.enabled });
                break;
                
            case 'setEnabled':
                state.enabled = request.enabled;
                await chrome.storage.local.set({ enabled: state.enabled });
                if (state.enabled) {
                    analyzeHeadlines();
                } else {
                    // Remove all badges when disabled
                    document.querySelectorAll('.sentiment-badge-container').forEach(badge => {
                        badge.remove();
                    });
                    // Reset highlighting
                    state.analyzedElements.forEach((result, element) => {
                        element.style.opacity = '';
                        element.style.backgroundColor = '';
                        element.style.borderLeft = '';
                        if (element.dataset.originalPadding) {
                            element.style.padding = element.dataset.originalPadding;
                        }
                    });
                }
                sendResponse({ success: true });
                break;
                
            case 'analyzeNow':
                await analyzeHeadlines(true);
                sendResponse({ stats: state.stats, success: true });
                break;
                
            case 'resetStats':
                state.stats = { total: 0, buy: 0, hold: 0, sell: 0 };
                await saveStats();
                sendResponse({ success: true });
                break;
                
            case 'setHighlight':
                state.highlight = request.highlight;
                await chrome.storage.local.set({ highlight: state.highlight });
                // Re-apply highlighting
                state.analyzedElements.forEach((result, element) => {
                    addSentimentBadge(element, result.sentiment, result.confidence, result.probabilities);
                });
                sendResponse({ success: true });
                break;
                
            case 'setShowConfidence':
                state.showConfidence = request.show;
                await chrome.storage.local.set({ showConfidence: state.showConfidence });
                // Re-apply badges
                state.analyzedElements.forEach((result, element) => {
                    addSentimentBadge(element, result.sentiment, result.confidence, result.probabilities);
                });
                sendResponse({ success: true });
                break;
                
            case 'setFilter':
                state.filter = request.filter;
                await chrome.storage.local.set({ filter: state.filter });
                // Re-apply filter
                state.analyzedElements.forEach((result, element) => {
                    addSentimentBadge(element, result.sentiment, result.confidence, result.probabilities);
                });
                sendResponse({ success: true });
                break;
                
            default:
                sendResponse({ error: 'Unknown action' });
        }
    })();
    return true; // Keep message channel open for async response
});

// Inject CSS to ensure badges don't break layouts
function injectStyles() {
    if (document.getElementById('sentiment-analyzer-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'sentiment-analyzer-styles';
    style.textContent = `
        .sentiment-badge-container {
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
            margin-left: 10px !important;
            vertical-align: middle !important;
            position: relative !important;
            z-index: 1000 !important;
        }
        .sentiment-badge {
            display: inline-block !important;
            white-space: nowrap !important;
        }
        .confidence-badge {
            white-space: nowrap !important;
        }
        /* Hide badges in grid/table structures */
        td .sentiment-badge-container,
        th .sentiment-badge-container,
        [class*="grid"] .sentiment-badge-container,
        [class*="table"] .sentiment-badge-container,
        [class*="cell"] .sentiment-badge-container {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
}

// Initialize
(async () => {
    await loadSettings();
    injectStyles();
    
    const website = detectWebsite();
    const isFinancialSite = website !== 'generic';
    // Sites that heavily use dynamic content loading
    const dynamicSites = ['yahoo', 'marketwatch', 'reuters', 'bloomberg', 'cnbc', 'investing', 'seekingalpha'];
    const isDynamicSite = dynamicSites.includes(website);
    
    // Function to run analysis with retries (especially for dynamic sites)
    const runAnalysisWithRetries = async (retries = 3, delay = 1000) => {
        for (let i = 0; i < retries; i++) {
            await analyzeHeadlines();
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };
    
    // Run analysis when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Dynamic sites load content dynamically, so run multiple times
            if (isDynamicSite) {
                setTimeout(() => runAnalysisWithRetries(3, 1500), 1000);
            } else if (isFinancialSite) {
                setTimeout(() => runAnalysisWithRetries(2, 1000), 1000);
            } else {
                setTimeout(() => analyzeHeadlines(), 1000);
            }
        });
    } else {
        // Dynamic sites load content dynamically, so run multiple times
        if (isDynamicSite) {
            setTimeout(() => runAnalysisWithRetries(3, 1500), 1000);
        } else if (isFinancialSite) {
            setTimeout(() => runAnalysisWithRetries(2, 1000), 1000);
        } else {
            setTimeout(() => analyzeHeadlines(), 1000);
        }
    }
    
    // Also analyze when new content is added (for dynamic pages)
    let analysisTimeout;
    const observer = new MutationObserver((mutations) => {
        let shouldAnalyze = false;
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                // Check if added nodes contain potential headlines
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        const tagName = node.tagName?.toLowerCase();
                        // Check for headings
                        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName) ||
                            node.querySelector?.('h1, h2, h3, h4, h5, h6')) {
                            shouldAnalyze = true;
                        }
                        // For financial sites, also check for links and article containers
                        if (isFinancialSite) {
                            if (tagName === 'a' || 
                                node.querySelector?.('a[href*="/news/"]') ||
                                node.querySelector?.('a[href*="/article/"]') ||
                                node.querySelector?.('a[href*="/story/"]') ||
                                node.querySelector?.('[class*="headline"]') ||
                                node.querySelector?.('[class*="article"]') ||
                                node.querySelector?.('[data-test-locator="stream-item"]') ||
                                node.querySelector?.('[data-module="StreamItem"]') ||
                                node.querySelector?.('[data-module="Article"]') ||
                                node.querySelector?.('[data-module="Story"]')) {
                                shouldAnalyze = true;
                            }
                        }
                    }
                });
            }
        });
        if (shouldAnalyze) {
            // Debounce analysis to avoid too many calls
            clearTimeout(analysisTimeout);
            analysisTimeout = setTimeout(() => {
                if (isDynamicSite) {
                    // Run analysis twice for dynamic sites to catch all content
                    analyzeHeadlines();
                    setTimeout(() => analyzeHeadlines(), 1000);
                } else if (isFinancialSite) {
                    analyzeHeadlines();
                } else {
                    analyzeHeadlines();
                }
            }, 500);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // For dynamic financial sites, also periodically check for new content
    if (isDynamicSite) {
        setInterval(() => {
            analyzeHeadlines();
        }, 5000); // Check every 5 seconds for new headlines
    } else if (isFinancialSite) {
        setInterval(() => {
            analyzeHeadlines();
        }, 10000); // Check every 10 seconds for other financial sites
    }
})();
