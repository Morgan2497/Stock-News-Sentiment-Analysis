const API_URL = 'http://localhost:8000';

// DOM elements
const statusIndicator = document.getElementById('statusIndicator');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const enableToggle = document.getElementById('enableToggle');
const analyzeBtn = document.getElementById('analyzeBtn');
const resetBtn = document.getElementById('resetBtn');
const refreshBtn = document.getElementById('refreshBtn');
const highlightToggle = document.getElementById('highlightToggle');
const showConfidenceToggle = document.getElementById('showConfidenceToggle');
const filterSelect = document.getElementById('filterSelect');
const apiStatus = document.getElementById('apiStatus');

// Stats elements
const totalAnalyzed = document.getElementById('totalAnalyzed');
const buyCount = document.getElementById('buyCount');
const holdCount = document.getElementById('holdCount');
const sellCount = document.getElementById('sellCount');

// Initialize
let stats = {
    total: 0,
    buy: 0,
    hold: 0,
    sell: 0
};

// Load settings and stats from storage
async function loadSettings() {
    const result = await chrome.storage.local.get(['enabled', 'highlight', 'showConfidence', 'filter', 'stats']);
    enableToggle.checked = result.enabled !== false;
    highlightToggle.checked = result.highlight !== false;
    showConfidenceToggle.checked = result.showConfidence !== false;
    filterSelect.value = result.filter || 'all';
    if (result.stats) {
        stats = result.stats;
        updateStats();
    }
}

// Save settings to storage
async function saveSettings() {
    await chrome.storage.local.set({
        enabled: enableToggle.checked,
        highlight: highlightToggle.checked,
        showConfidence: showConfidenceToggle.checked,
        filter: filterSelect.value,
        stats: stats
    });
}

// Update stats display
function updateStats() {
    totalAnalyzed.textContent = stats.total;
    buyCount.textContent = stats.buy;
    holdCount.textContent = stats.hold;
    sellCount.textContent = stats.sell;
}

// Check API connection
async function checkAPI() {
    try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
            const data = await response.json();
            statusDot.className = 'status-dot active';
            statusText.textContent = 'Connected';
            apiStatus.textContent = 'API: Connected ✓';
            apiStatus.className = 'success';
            return data.model_loaded;
        } else {
            throw new Error('API not responding');
        }
    } catch (error) {
        statusDot.className = 'status-dot error';
        statusText.textContent = 'Disconnected';
        apiStatus.textContent = 'API: Not connected ✗';
        apiStatus.className = 'error';
        return false;
    }
}

// Get current tab
async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

// Send message to content script
async function sendMessageToContent(action, data = {}) {
    const tab = await getCurrentTab();
    try {
        const response = await chrome.tabs.sendMessage(tab.id, { action, ...data });
        return response;
    } catch (error) {
        console.error('Error sending message:', error);
        return null;
    }
}

// Update status from content script
async function updateStatusFromContent() {
    const response = await sendMessageToContent('getStatus');
    if (response && response.stats) {
        stats = response.stats;
        updateStats();
        await saveSettings();
    }
}

// Event listeners
enableToggle.addEventListener('change', async () => {
    await saveSettings();
    await sendMessageToContent('setEnabled', { enabled: enableToggle.checked });
    updateStatusFromContent();
});

analyzeBtn.addEventListener('click', async () => {
    analyzeBtn.disabled = true;
    analyzeBtn.classList.add('loading');
    analyzeBtn.innerHTML = '<span class="btn-icon">⏳</span> Analyzing...';
    
    const response = await sendMessageToContent('analyzeNow');
    
    if (response) {
        if (response.stats) {
            stats = response.stats;
            updateStats();
            await saveSettings();
        }
    }
    
    setTimeout(() => {
        analyzeBtn.disabled = false;
        analyzeBtn.classList.remove('loading');
        analyzeBtn.innerHTML = '<span class="btn-icon">🔍</span> Analyze Now';
    }, 1000);
});

resetBtn.addEventListener('click', async () => {
    if (confirm('Reset all statistics?')) {
        stats = { total: 0, buy: 0, hold: 0, sell: 0 };
        updateStats();
        await saveSettings();
        await sendMessageToContent('resetStats');
    }
});

refreshBtn.addEventListener('click', async () => {
    const tab = await getCurrentTab();
    await chrome.tabs.reload(tab.id);
    window.close();
});

highlightToggle.addEventListener('change', async () => {
    await saveSettings();
    await sendMessageToContent('setHighlight', { highlight: highlightToggle.checked });
});

showConfidenceToggle.addEventListener('change', async () => {
    await saveSettings();
    await sendMessageToContent('setShowConfidence', { show: showConfidenceToggle.checked });
});

filterSelect.addEventListener('change', async () => {
    await saveSettings();
    await sendMessageToContent('setFilter', { filter: filterSelect.value });
});

// Initialize
async function init() {
    await loadSettings();
    await checkAPI();
    await updateStatusFromContent();
    
    // Check API status periodically
    setInterval(checkAPI, 10000);
    
    // Update stats periodically
    setInterval(updateStatusFromContent, 2000);
}

init();

