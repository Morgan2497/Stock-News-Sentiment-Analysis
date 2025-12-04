import pandas as pd
import re
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import pickle
import os

# Load data from multiple sources
print("Loading data...")
df1 = pd.read_csv('data/training_data.csv')
df2 = pd.read_csv('data/train1.csv')
df3 = pd.read_csv('data/cleaned_output1.csv')

# Combine all datasets
print(f"  - training_data.csv: {len(df1)} rows")
print(f"  - train1.csv: {len(df2)} rows")
print(f"  - cleaned_output1.csv: {len(df3)} rows")
df = pd.concat([df1, df2, df3], ignore_index=True)

# Remove duplicates if any
initial_len = len(df)
df = df.drop_duplicates(subset=['text'], keep='first')
if len(df) < initial_len:
    print(f"  - Removed {initial_len - len(df)} duplicate rows")

print(f"  - Total combined dataset: {len(df)} rows")

# Clean text (simple: lowercase, remove punctuation)
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    return text

print("Cleaning text...")
df['text'] = df['text'].apply(clean_text)

# Split data
print("Splitting data...")
X_train, X_test, y_train, y_test = train_test_split(
    df['text'], df['sentiment'], 
    test_size=0.2, random_state=42,
    stratify=df['sentiment']
)

# TF-IDF Vectorization
print("Creating TF-IDF features...")
vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

# Train Naive Bayes
print("Training Naive Bayes model...")
model = MultinomialNB()
model.fit(X_train_tfidf, y_train)

# Evaluate
print("\nEvaluating model...")
y_pred = model.predict(X_test_tfidf)
accuracy = accuracy_score(y_test, y_pred)

print(f"\n{'='*50}")
print(f"Accuracy: {accuracy:.4f}")
print(f"{'='*50}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# Save model and vectorizer
print("\nSaving model...")
os.makedirs('model', exist_ok=True)
with open('model/vectorizer.pkl', 'wb') as f:
    pickle.dump(vectorizer, f)
with open('model/model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("✅ Done! Model saved to model/ folder")
print(f"   - model/vectorizer.pkl")
print(f"   - model/model.pkl")

