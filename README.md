# Stock News Sentiment Analysis System

An end-to-end sentiment analysis system that classifies stock market news headlines and articles into **Buy**, **Hold**, or **Sell** signals using Naive Bayes machine learning.

## Features

- 🤖 **Naive Bayes Classifier** with TF-IDF vectorization
- 🚀 **FastAPI Backend** for sentiment prediction
- 🌐 **Web Interface** for manual text analysis
- 🔌 **Chrome Extension** for real-time headline classification

## Project Structure

```
Stock-News-Sentiment-Analysis/
├── data/
│   └── training_data.csv          # Training dataset
├── model/
│   ├── vectorizer.pkl             # Saved TF-IDF vectorizer
│   └── model.pkl                   # Trained Naive Bayes model
├── api/
│   └── main.py                     # FastAPI backend
├── frontend/
│   ├── index.html                  # Web interface
│   ├── style.css                   # Styling
│   └── script.js                   # Frontend logic
├── extension/
│   ├── manifest.json               # Chrome extension config
│   ├── content.js                  # Extension logic
│   └── popup.html                  # Extension popup
├── train.py                        # Model training script
└── requirements.txt                # Python dependencies
```

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Train the Model

```bash
python train.py
```

This will:
- Load and preprocess the training data
- Train a Naive Bayes classifier with TF-IDF
- Evaluate the model performance
- Save the model to `model/` folder

### 3. Start the API Server

```bash
uvicorn api.main:app --reload
```

The API will be available at `http://localhost:8000`

### 4. Use the Web Interface

Open `frontend/index.html` in your web browser and start analyzing text!

### 5. Install Chrome Extension (Optional)

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder
5. The extension will analyze headlines on financial news websites

## API Endpoints

### POST `/predict`
Predict sentiment for a given text.

**Request:**
```json
{
  "text": "Stock prices surge as company reports record profits"
}
```

**Response:**
```json
{
  "sentiment": "Buy",
  "confidence": 0.85,
  "probabilities": {
    "Buy": 0.85,
    "Hold": 0.10,
    "Sell": 0.05
  }
}
```

### GET `/health`
Check API health and model status.

## Technologies Used

- **Python** - Primary language
- **scikit-learn** - Machine learning (Naive Bayes, TF-IDF)
- **FastAPI** - Backend API framework
- **JavaScript** - Frontend and Chrome extension
- **HTML/CSS** - Web interface

## Model Performance

- **Accuracy**: ~43%
- **Algorithm**: Multinomial Naive Bayes
- **Features**: TF-IDF with 5000 max features, bigrams

## Notes

- The model is trained on stock market news data
- For best results, use financial/stock-related text
- The API must be running for the Chrome extension to work

## License

Student Project - Educational Use

