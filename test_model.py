#!/usr/bin/env python3
"""
Quick test script to verify the model works
"""
import pickle
import re

def clean_text(text):
    text = str(text).lower()
    return re.sub(r'[^a-zA-Z0-9\s]', '', text)

# Load model
print("Loading model...")
with open('model/vectorizer.pkl', 'rb') as f:
    vectorizer = pickle.load(f)
with open('model/model.pkl', 'rb') as f:
    model = pickle.load(f)

# Test cases
test_cases = [
    "Stock prices surge as company reports record profits",
    "Company faces regulatory investigation and potential fines",
    "Market remains stable with no significant changes expected"
]

print("\n" + "="*60)
print("Testing Model Predictions")
print("="*60 + "\n")

for text in test_cases:
    cleaned = clean_text(text)
    text_tfidf = vectorizer.transform([cleaned])
    prediction = model.predict(text_tfidf)[0]
    probabilities = model.predict_proba(text_tfidf)[0]
    confidence = max(probabilities)
    
    print(f"Text: {text}")
    print(f"Prediction: {prediction} (Confidence: {confidence*100:.2f}%)")
    print(f"Probabilities: Buy={probabilities[0]*100:.1f}%, Hold={probabilities[1]*100:.1f}%, Sell={probabilities[2]*100:.1f}%")
    print("-" * 60)

print("\n✅ Model test complete!")

