import pandas as pd
import re
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_score, recall_score, f1_score
import pickle
import os
import json
import numpy as np

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

# Calculate additional metrics
precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)

# Per-class metrics
precision_per_class = precision_score(y_test, y_pred, average=None, zero_division=0)
recall_per_class = recall_score(y_test, y_pred, average=None, zero_division=0)
f1_per_class = f1_score(y_test, y_pred, average=None, zero_division=0)

# Confusion matrix
cm = confusion_matrix(y_test, y_pred)

# Print detailed metrics
print(f"\n{'='*60}")
print("PERFORMANCE METRICS")
print(f"{'='*60}")
print(f"\nOverall Metrics:")
print(f"  Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
print(f"  Precision: {precision:.4f} ({precision*100:.2f}%)")
print(f"  Recall:    {recall:.4f} ({recall*100:.2f}%)")
print(f"  F1-Score:  {f1:.4f} ({f1*100:.2f}%)")

print(f"\nPer-Class Metrics:")
for i, label in enumerate(model.classes_):
    print(f"\n  {label}:")
    print(f"    Precision: {precision_per_class[i]:.4f} ({precision_per_class[i]*100:.2f}%)")
    print(f"    Recall:    {recall_per_class[i]:.4f} ({recall_per_class[i]*100:.2f}%)")
    print(f"    F1-Score:  {f1_per_class[i]:.4f} ({f1_per_class[i]*100:.2f}%)")

# Confusion Matrix with labels
print(f"\n{'='*60}")
print("Confusion Matrix:")
print(f"{'='*60}")
print(f"{'':>12}", end='')
for label in model.classes_:
    print(f"{label:>12}", end='')
print()
for i, label in enumerate(model.classes_):
    print(f"{label:>12}", end='')
    for j in range(len(model.classes_)):
        print(f"{cm[i][j]:>12}", end='')
    print()

print(f"\n{'='*60}")
print("Classification Report:")
print(f"{'='*60}")
print(classification_report(y_test, y_pred))

# Save model and vectorizer
print("\nSaving model...")
os.makedirs('model', exist_ok=True)
with open('model/vectorizer.pkl', 'wb') as f:
    pickle.dump(vectorizer, f)
with open('model/model.pkl', 'wb') as f:
    pickle.dump(model, f)

# Save metrics to JSON file
metrics = {
    "overall": {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1)
    },
    "per_class": {
        label: {
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1_val)
        }
        for label, prec, rec, f1_val in zip(model.classes_, precision_per_class, recall_per_class, f1_per_class)
    },
    "confusion_matrix": {
        "labels": model.classes_.tolist(),
        "matrix": cm.tolist()
    },
    "dataset_info": {
        "total_samples": int(len(df)),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "classes": model.classes_.tolist(),
        "class_distribution": {
            label: int(count) for label, count in zip(*np.unique(y_train, return_counts=True))
        }
    }
}

with open('model/metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)

print("\n✅ Done! Model and metrics saved to model/ folder")
print(f"   - model/vectorizer.pkl")
print(f"   - model/model.pkl")
print(f"   - model/metrics.json")

