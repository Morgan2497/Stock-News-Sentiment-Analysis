const API_URL = 'http://localhost:8000/predict';

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

// Function to add sentiment badge to element
function addSentimentBadge(element, sentiment, confidence) {
    // Remove existing badge if present
    const existingBadge = element.querySelector('.sentiment-badge');
    if (existingBadge) {
        existingBadge.remove();
    }
    
    // Create badge
    const badge = document.createElement('span');
    badge.className = 'sentiment-badge';
    badge.textContent = sentiment;
    badge.style.cssText = `
        background: ${getSentimentColor(sentiment)};
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        margin-left: 10px;
        display: inline-block;
    `;
    
    // Add tooltip with confidence
    badge.title = `Confidence: ${(confidence * 100).toFixed(1)}%`;
    
    element.style.position = 'relative';
    element.appendChild(badge);
}

// Function to analyze headlines on the page
async function analyzeHeadlines() {
    // Common selectors for headlines
    const headlineSelectors = [
        'h1', 'h2', 'h3', 
        '[class*="headline"]', 
        '[class*="title"]',
        '[class*="article-title"]',
        'article h1',
        'article h2'
    ];
    
    const headlines = new Set();
    
    // Collect unique headline elements
    headlineSelectors.forEach(selector => {
        try {
            document.querySelectorAll(selector).forEach(el => {
                const text = el.textContent.trim();
                // Only analyze headlines that are reasonable length
                if (text.length > 20 && text.length < 500 && !headlines.has(el)) {
                    headlines.add(el);
                }
            });
        } catch (e) {
            // Ignore selector errors
        }
    });
    
    // Analyze each headline
    for (const headline of headlines) {
        const text = headline.textContent.trim();
        const result = await analyzeText(text);
        
        if (result && result.sentiment) {
            addSentimentBadge(headline, result.sentiment, result.confidence);
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// Run analysis when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(analyzeHeadlines, 1000); // Wait 1 second for page to fully load
    });
} else {
    setTimeout(analyzeHeadlines, 1000);
}

// Also analyze when new content is added (for dynamic pages)
const observer = new MutationObserver(() => {
    setTimeout(analyzeHeadlines, 500);
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

