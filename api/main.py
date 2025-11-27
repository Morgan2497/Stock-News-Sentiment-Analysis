from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import re
import os

app = FastAPI()

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
    print("✅ Model loaded successfully")
except FileNotFoundError:
    print("❌ Model files not found! Please run train.py first.")
    vectorizer = None
    model = None

def clean_text(text):
    """Clean input text"""
    text = str(text).lower()
    return re.sub(r'[^a-zA-Z0-9\s]', '', text)

class TextInput(BaseModel):
    text: str

@app.post("/predict")
def predict(input: TextInput):
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
    
    return {
        "sentiment": prediction,
        "confidence": float(confidence),
        "probabilities": {
            label: float(prob) 
            for label, prob in zip(model.classes_, probabilities)
        }
    }

@app.get("/")
def root():
    return {
        "message": "Stock News Sentiment Analysis API",
        "status": "running",
        "endpoints": {
            "predict": "/predict (POST)"
        }
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None and vectorizer is not None
    }

