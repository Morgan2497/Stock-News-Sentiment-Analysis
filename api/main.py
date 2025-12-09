from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import pickle
import re
import os
import json
import pandas as pd
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Initialize Groq client (optional - only if API key is provided)
groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = None
if groq_api_key and groq_api_key != "your_groq_api_key_here":
    try:
        groq_client = Groq(api_key=groq_api_key)
        print("Groq client initialized successfully")
    except Exception as e:
        print(f"Groq client initialization failed: {e}")
else:
    print("Groq API key not found. Explanations will be disabled.")

# Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and vectorizer
model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'model')
vectorizer_path = os.path.join(model_path, 'vectorizer.pkl')
model_file_path = os.path.join(model_path, 'model.pkl')

try:
    with open(vectorizer_path, 'rb') as f:
        vectorizer = pickle.load(f)
    with open(model_file_path, 'rb') as f:
        model = pickle.load(f)
    print("Model loaded successfully")
except FileNotFoundError:
    print("Model files not found! Please run train.py first.")
    vectorizer = None
    model = None

# Load stock tickers
tickers_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'tickers', 'tickers.csv')
tickers_df = None
try:
    tickers_df = pd.read_csv(tickers_path)
    print(f"Loaded {len(tickers_df)} stock tickers")
except FileNotFoundError:
    print("Tickers file not found. Stock detection will be disabled.")
    tickers_df = pd.DataFrame()

def clean_text(text):
    """Clean input text"""
    text = str(text).lower()
    return re.sub(r'[^a-zA-Z0-9\s]', '', text)

def detect_stocks(text):
    """Detect stock tickers and company names in text"""
    if tickers_df is None or tickers_df.empty:
        return []
    
    detected_stocks = []
    text_upper = text.upper()
    text_lower = text.lower()
    found_tickers = set()
    
    # Pattern 1: Tickers in parentheses: (AAPL), (TSLA)
    parentheses_pattern = r'\(([A-Z]{2,5})\)'
    matches = re.findall(parentheses_pattern, text_upper)
    for ticker in matches:
        if ticker in tickers_df['symbol'].values and ticker not in found_tickers:
            found_tickers.add(ticker)
            stock_info = tickers_df[tickers_df['symbol'] == ticker].iloc[0]
            detected_stocks.append({
                'symbol': ticker,
                'name': stock_info['name'],
                'exchange': stock_info['exchange'],
                'sector': stock_info.get('sector', 'N/A')
            })
    
    # Pattern 2: Standalone tickers (more restrictive - only if near stock-related keywords)
    stock_keywords = ['STOCK', 'SHARES', 'EQUITY', 'TRADING', 'MARKET', 'PRICE', 'SHARE', 'EQUITIES']
    standalone_pattern = r'\b([A-Z]{2,5})\b'
    matches = re.findall(standalone_pattern, text_upper)
    
    for ticker in matches:
        # Skip if already found or too short
        if ticker in found_tickers or len(ticker) < 2:
            continue
        
        # Filter out common words
        common_words = {'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'ITS', 'MAY', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WHO', 'WAY', 'USE', 'MAN', 'YEAR', 'YOUR', 'FROM', 'THAT', 'WITH', 'THIS', 'THEY', 'HAVE', 'WILL', 'WHAT', 'WHEN', 'WHERE', 'WHICH', 'THERE', 'THESE', 'THEIR', 'WOULD', 'COULD', 'SHOULD', 'INTO', 'UPON', 'OVER', 'UNDER', 'ABOUT', 'AFTER', 'BEFORE', 'BETWEEN', 'DURING', 'SINCE', 'UNTIL', 'WHILE', 'THROUGH', 'AGAINST', 'AMONG', 'THROUGHOUT', 'DESPITE', 'TOWARD', 'TOWARDS'}
        
        if ticker in common_words:
            continue
        
        # Check if it's a known ticker AND appears near stock-related context
        if ticker in tickers_df['symbol'].values:
            # Check if ticker appears near stock-related keywords (within 20 characters)
            ticker_pos = text_upper.find(ticker)
            if ticker_pos != -1:
                context_start = max(0, ticker_pos - 20)
                context_end = min(len(text_upper), ticker_pos + len(ticker) + 20)
                context = text_upper[context_start:context_end]
                
                # If near stock keywords, it's likely a ticker reference
                if any(keyword in context for keyword in stock_keywords):
                    stock_info = tickers_df[tickers_df['symbol'] == ticker].iloc[0]
                    detected_stocks.append({
                        'symbol': ticker,
                        'name': stock_info['name'],
                        'exchange': stock_info['exchange'],
                        'sector': stock_info.get('sector', 'N/A')
                    })
                    found_tickers.add(ticker)
    
    # Pattern 3: Detect company names (e.g., "Apple" -> AAPL)
    for _, row in tickers_df.iterrows():
        if row['symbol'] in found_tickers:
            continue  # Already detected via ticker
        
        company_name = row['name']
        company_lower = company_name.lower()
        
        # Check for full company name
        if company_lower in text_lower:
            detected_stocks.append({
                'symbol': row['symbol'],
                'name': company_name,
                'exchange': row['exchange'],
                'sector': row.get('sector', 'N/A')
            })
            found_tickers.add(row['symbol'])
            continue
        
        # Check for base company name (first word, if it's substantial)
        # e.g., "Apple" from "Apple Inc."
        name_parts = company_lower.split()
        if len(name_parts) > 0:
            base_name = name_parts[0]
            # Remove any trailing punctuation
            base_name = base_name.rstrip('.,!?;:')
            
            # Only match if base name is substantial (4+ chars) to avoid false matches
            if len(base_name) >= 4:
                # Use word boundary to match whole words only (avoid matching "Apple" in "Pineapple")
                base_name_pattern = r'\b' + re.escape(base_name) + r'\b'
                if re.search(base_name_pattern, text_lower):
                    base_name_pos = text_lower.find(base_name)
                    if base_name_pos != -1:
                        # Check context around the company name (wider window)
                        context_start = max(0, base_name_pos - 50)
                        context_end = min(len(text_lower), base_name_pos + len(base_name) + 50)
                        context = text_lower[context_start:context_end]
                        
                        # Stock-related keywords in context (expanded list)
                        stock_context_words = [
                            'stock', 'stocks', 'shares', 'equity', 'equities', 'trading', 'market', 
                            'price', 'share', 'company', 'corporation', 'inc', 'corp', 'ltd', 
                            'earnings', 'revenue', 'profit', 'quarter', 'financial', 'investor', 
                            'ceo', 'executive', 'leadership', 'shake-up', 'shakeup', 'departure',
                            'departures', 'exit', 'exits', 'resign', 'resigns', 'resignation',
                            'board', 'director', 'officer', 'management', 'business', 'firm'
                        ]
                        
                        # Check if any stock-related word appears in context
                        if any(word in context for word in stock_context_words):
                            detected_stocks.append({
                                'symbol': row['symbol'],
                                'name': company_name,
                                'exchange': row['exchange'],
                                'sector': row.get('sector', 'N/A')
                            })
                            found_tickers.add(row['symbol'])
    
    return detected_stocks

async def generate_explanation(text: str, sentiment: str, confidence: float, detected_stocks: List[dict] = None):
    """Generate explanation using Groq API"""
    if groq_client is None:
        return None
    
    # Build prompt with stock information if available
    if detected_stocks and len(detected_stocks) > 0:
        stock_names = ', '.join([f"{s['name']} ({s['symbol']})" for s in detected_stocks])
        if len(detected_stocks) == 1:
            stock_context = f"This news is about {stock_names}."
            company_name = detected_stocks[0]['name']
        else:
            stock_context = f"This news mentions multiple companies: {stock_names}."
            company_name = "these companies"
        
        prompt = f"""Explain why this stock market news headline was classified as "{sentiment}" sentiment with {confidence*100:.1f}% confidence.

{stock_context}

Headline: "{text}"

Provide a brief, clear explanation (2-3 sentences) focusing on:
1. What specific words or phrases indicate {sentiment} sentiment
2. How this news affects {company_name}
3. Why investors might consider this a {sentiment} signal for {detected_stocks[0]['symbol'] if len(detected_stocks) == 1 else 'the mentioned stocks'}

Be specific and mention the company name(s) in your explanation."""
    else:
        prompt = f"""Explain why this stock market news headline was classified as "{sentiment}" sentiment with {confidence*100:.1f}% confidence.

Headline: "{text}"

Provide a brief, clear explanation (2-3 sentences) focusing on key words or phrases that indicate {sentiment} sentiment. Be specific about what in the headline suggests this sentiment."""
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "user", "content": prompt}
            ],
            model="llama-3.1-8b-instant",
            max_tokens=150,
            temperature=0.7
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating explanation: {e}")
        return None

class TextInput(BaseModel):
    text: str

class BatchInput(BaseModel):
    texts: List[str]

@app.post("/predict")
async def predict(input: TextInput):
    """Predict sentiment for given text"""
    if model is None or vectorizer is None:
        return {
            "error": "Model not loaded. Please train the model first.",
            "sentiment": None,
            "confidence": 0
        }
    
    cleaned = clean_text(input.text)
    text_tfidf = vectorizer.transform([cleaned])
    prediction = model.predict(text_tfidf)[0]
    probabilities = model.predict_proba(text_tfidf)[0]
    confidence = max(probabilities)
    
    # Detect stocks in the text FIRST (before generating explanation)
    detected_stocks = detect_stocks(input.text)
    
    # Generate explanation using Groq (if available) - now with stock information
    explanation = await generate_explanation(input.text, prediction, confidence, detected_stocks)
    
    response = {
        "sentiment": prediction,
        "confidence": float(confidence),
        "probabilities": {
            label: float(prob) 
            for label, prob in zip(model.classes_, probabilities)
        }
    }
    
    if detected_stocks:
        response["stocks"] = detected_stocks
        
        # Add buy recommendation if sentiment is Buy
        if prediction == "Buy":
            response["buy_recommendation"] = {
                "recommended": True,
                "stocks": detected_stocks,
                "reason": f"Positive sentiment detected for {', '.join([s['symbol'] for s in detected_stocks])}. Consider buying these stocks."
            }
    
    if explanation:
        response["explanation"] = explanation
    
    return response

@app.post("/predict/batch")
async def predict_batch(input: BatchInput):
    """Predict sentiment for multiple texts at once"""
    if model is None or vectorizer is None:
        return {
            "error": "Model not loaded. Please train the model first.",
            "count": 0,
            "results": []
        }
    
    results = []
    
    for text in input.texts:
        if not text or not text.strip():
            continue
            
        cleaned = clean_text(text)
        text_tfidf = vectorizer.transform([cleaned])
        prediction = model.predict(text_tfidf)[0]
        probabilities = model.predict_proba(text_tfidf)[0]
        confidence = max(probabilities)
        
        # Detect stocks in the text FIRST (before generating explanation)
        detected_stocks = detect_stocks(text)
        
        # Generate explanation (optional - can skip for batch to speed up) - now with stock information
        explanation = await generate_explanation(text, prediction, confidence, detected_stocks)
        
        result = {
            "text": text,
            "sentiment": prediction,
            "confidence": float(confidence),
            "probabilities": {
                label: float(prob) 
                for label, prob in zip(model.classes_, probabilities)
            }
        }
        
        if detected_stocks:
            result["stocks"] = detected_stocks
            
            # Add buy recommendation if sentiment is Buy
            if prediction == "Buy":
                result["buy_recommendation"] = {
                    "recommended": True,
                    "stocks": detected_stocks,
                    "reason": f"Positive sentiment detected for {', '.join([s['symbol'] for s in detected_stocks])}"
                }
        
        if explanation:
            result["explanation"] = explanation
        
        results.append(result)
    
    return {
        "count": len(results),
        "results": results
    }

@app.get("/")
def root():
    return {
        "message": "Stock News Sentiment Analysis API",
        "status": "running",
        "endpoints": {
            "predict": "/predict (POST)",
            "predict_batch": "/predict/batch (POST)",
            "metrics": "/metrics (GET)",
            "health": "/health (GET)"
        }
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None and vectorizer is not None
    }

@app.get("/metrics")
def get_metrics():
    """Get model performance metrics from saved metrics file"""
    if model is None or vectorizer is None:
        return {
            "error": "Model not loaded. Please train the model first.",
            "status": "error"
        }
    
    # Try to load metrics from JSON file
    metrics_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'model', 'metrics.json')
    
    try:
        if os.path.exists(metrics_path):
            with open(metrics_path, 'r') as f:
                metrics = json.load(f)
            return {
                "status": "success",
                "source": "saved_file",
                **metrics
            }
        else:
            return {
                "error": "Metrics file not found. Please run train.py to generate metrics.",
                "status": "error",
                "message": "Run 'python train.py' to train the model and generate metrics."
            }
    except Exception as e:
        return {
            "error": f"Error loading metrics: {str(e)}",
            "status": "error"
        }

