const API_URL = 'http://localhost:8000/predict';

async function analyze() {
    const text = document.getElementById('textInput').value.trim();
    const resultDiv = document.getElementById('result');
    const button = document.querySelector('button');
    
    if (!text) {
        alert('Please enter some text to analyze!');
        return;
    }
    
    // Disable button and show loading
    button.disabled = true;
    button.textContent = 'Analyzing...';
    resultDiv.style.display = 'none';
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            resultDiv.className = 'result error show';
            resultDiv.innerHTML = `<div>${data.error}</div>`;
        } else {
            resultDiv.className = `result ${data.sentiment.toLowerCase()} show`;
            
            let html = `<div>Sentiment: ${data.sentiment}</div>`;
            html += `<div class="confidence">Confidence: ${(data.confidence * 100).toFixed(2)}%</div>`;
            
            if (data.probabilities) {
                html += '<div class="probabilities">';
                html += '<strong>Probabilities:</strong><br>';
                for (const [label, prob] of Object.entries(data.probabilities)) {
                    html += `<div>${label}: ${(prob * 100).toFixed(2)}%</div>`;
                }
                html += '</div>';
            }
            
            resultDiv.innerHTML = html;
        }
        
    } catch (error) {
        resultDiv.className = 'result error show';
        resultDiv.innerHTML = `
            <div>Error connecting to API</div>
            <div style="font-size: 14px; margin-top: 10px;">
                Make sure the FastAPI server is running:<br>
                <code>uvicorn api.main:app --reload</code>
            </div>
        `;
        console.error('Error:', error);
    } finally {
        button.disabled = false;
        button.textContent = 'Analyze Sentiment';
    }
}

// Allow Enter key to trigger analysis (Ctrl+Enter or Cmd+Enter)
document.getElementById('textInput').addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        analyze();
    }
});

