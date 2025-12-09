
# Stock News Sentiment Analysis System

An end-to-end sentiment analysis system that classifies stock market news headlines and articles into Buy, Hold, or Sell signals using Naive Bayes machine learning. The system includes a Python-based sentiment model with TF-IDF vectorization, a FastAPI backend service, a responsive web interface for manual text analysis, and a Chrome extension for real-time headline classification.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Contributing](#contributing)
- [Technologies](#technologies)
- [Model Information](#model-information)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

The required packages include:
- pandas: Data processing
- scikit-learn: TF-IDF and Naive Bayes model
- fastapi: API framework
- uvicorn: Server for FastAPI
- pydantic: Data validation

## Prerequisites

Before you begin, ensure you have the following installed:

- Python 3.8 or higher
- pip (Python package installer)
- A modern web browser (Chrome, Firefox, Edge, etc.)
- Git (for cloning the repository)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Stock-News-Sentiment-Analysis
```

### 2. Create a Virtual Environment (Recommended)

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

The required packages include:
- pandas: Data processing
- scikit-learn: TF-IDF and Naive Bayes model
- fastapi: API framework
- uvicorn: Server for FastAPI
- pydantic: Data validation

### 4. Train the Model

Before using the system, you need to train the sentiment analysis model:

```bash
python train.py
```
This script will:
- Load training data from `data/training_data.csv`
- Preprocess text (lowercase, remove punctuation)
- Split data into train/test sets (80/20)
- Create TF-IDF features (max 5000, unigrams + bigrams)
- Train a Multinomial Naive Bayes model
- Evaluate and display performance metrics
- Save the model and vectorizer to the `model/` folder

Expected output files:
- `model/vectorizer.pkl`: TF-IDF vectorizer
- `model/model.pkl`: Trained Naive Bayes model

## Project Structure

```
Stock-News-Sentiment-Analysis/
├── api/                          # FastAPI backend service
│   ├── __pycache__/              # Python cache files (auto-generated)
│   └── main.py                   # FastAPI application with /predict endpoint
│
├── data/                         # Data storage directory
│   ├── collected/                # Raw collected news data from various sources
│   │   ├── marketwatch_*.csv    # MarketWatch news articles
│   │   ├── reuters_*.csv         # Reuters news articles
│   │   └── yahoofinance_*.csv   # Yahoo Finance news articles
│   ├── processed/                # Processed and cleaned news data
│   │   ├── processed_marketwatch_*.csv
│   │   ├── processed_reuters_*.csv
│   │   └── processed_yahoofinance_*.csv
│   ├── tickers/                  # Stock ticker information
│   │   └── tickers.csv           # List of stock ticker symbols
│   ├── data_labeled.csv          # Labeled dataset with features (Reputation, Financial, etc.)
│   └── training_data.csv         # Main training dataset (text, sentiment) for model training
│
├── extension/                    # Chrome extension files
│   ├── manifest.json             # Extension configuration and permissions
│   ├── content.js                # Content script that analyzes headlines on web pages
│   ├── popup.html                # Extension popup interface
│   └── icon.png                  # Extension icon image
│
├── frontend/                     # Web interface files
│   ├── index.html                # Main HTML page with sentiment analysis form
│   ├── style.css                 # CSS styling for the web interface
│   └── script.js                 # JavaScript logic (currently embedded in index.html)
│
├── model/                        # Trained model files (generated after training)
│   ├── vectorizer.pkl            # Saved TF-IDF vectorizer for text preprocessing
│   └── model.pkl                 # Trained Multinomial Naive Bayes classifier
│
├── venv/                         # Python virtual environment (created during setup)
│   └── ...                       # Virtual environment files
│
├── train.py                      # Model training script - loads data, trains model, saves results
├── test_model.py                 # Model testing script - quick test of trained model
├── requirements.txt              # Python package dependencies list
├── README.md                     # This documentation file
└── START_HERE.md                 # Quick start guide for new users
```

### File Descriptions

#### Root Level Files

- **train.py**: Training script that loads data, preprocesses text, builds TF-IDF features, trains the Naive Bayes model, evaluates it, and saves the model and vectorizer.

- **test_model.py**: Quick script for testing the trained model with sample inputs.

- **requirements.txt**: All Python package dependencies for the project.

- **README.md**: Main project documentation covering setup, usage, and API info.

- **START_HERE.md**: Short guide for initial setup and running the project.

#### api/ Directory

- **main.py**: FastAPI app with the `/predict` endpoint, model loading, text processing, CORS, and health checks.

#### data/ Directory

- **training_data.csv**: Main dataset used to train the sentiment model.
- **data_labeled.csv**: Dataset with extra financial features (optional for advanced analysis).
- **collected/**: Raw financial news data.
- **processed/**: Cleaned news data ready for analysis.
- **tickers/**: Stock ticker symbol lists.

#### extension/ Directory

- **manifest.json**: Chrome extension configuration (Manifest V3).
- **content.js**: Script that analyzes headlines on supported websites.
- **popup.html**: Interface shown when opening the extension.
- **icon.png**: Extension toolbar icon.

#### frontend/ Directory

- **index.html**: Web interface for entering text and viewing predictions.
- **style.css**: Styling for the web interface.
- **script.js**: Logic for sending input to the API and displaying results.

#### model/ Directory

- **vectorizer.pkl**: Saved TF-IDF vectorizer.
- **model.pkl**: Saved Naive Bayes model.

## Usage

### Starting the API Server

1. Start the FastAPI server:

```bash
uvicorn api.main:app --reload
```

The `--reload` flag enables auto-reload on code changes during development.

2. The API will be available at `http://localhost:8000`

3. Verify the server is running by visiting `http://localhost:8000/health` in your browser

### Using the Web Interface

1. Make sure the API server is running.
2. Open `frontend/index.html` in your browser.
3. Enter a headline or article.
4. Click **Analyze Sentiment**.
5. The results will show:
   - Buy / Hold / Sell
   - Confidence score
   - Class probabilities

### Using the Chrome Extension

1. Go to `chrome://extensions/` in Chrome.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select the `extension/` folder.
4. Visit a financial news site (MarketWatch, Reuters, Yahoo Finance).
5. Headlines will automatically show sentiment tags.

Note: The API must be running on `localhost:8000` for the extension to work.

### Testing the Model

You can test the trained model directly:

```bash
python test_model.py
```

This will run sample predictions and display the results.

## API Documentation

### Base URL

```
http://localhost:8000
```

### Endpoints

#### POST /predict

Predict sentiment for a given text string.

**Request Body:**
```json
{
  "text": "Stock prices surge as company reports record profits"
}
```

**Response:**
```json
{
  "sentiment": "Buy",
  "confidence": 0.4095,
  "probabilities": {
    "Buy": 0.409,
    "Hold": 0.314,
    "Sell": 0.276
  }
}
```

**Response Fields:**
- `sentiment`: Predicted sentiment class (Buy, Hold, or Sell)
- `confidence`: Confidence score (0-1) of the prediction
- `probabilities`: Probability distribution across all classes

#### GET /

Root endpoint providing API information.

**Response:**
```json
{
  "message": "Stock News Sentiment Analysis API",
  "status": "running",
  "endpoints": {
    "predict": "/predict (POST)"
  }
}
```

#### GET /health

Check API health and model loading status.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### Example API Usage

Using curl:
```bash
curl -X POST "http://localhost:8000/predict" \
     -H "Content-Type: application/json" \
     -d '{"text": "Stock market rallies on positive earnings reports"}'
```

Using Python:
```python
import requests

response = requests.post(
    "http://localhost:8000/predict",
    json={"text": "Stock market rallies on positive earnings reports"}
)
print(response.json())
```

## Development

### Running in Development Mode

The API server supports auto-reload during development:

```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Modifying the Model

To retrain the model with different parameters:

1. Edit `train.py` to modify:
   - TF-IDF parameters (max_features, ngram_range)
   - Train/test split ratio
   - Text preprocessing steps

2. Run the training script:
```bash
python train.py
```

3. The new model will be saved to `model/` folder

### Adding New Features

- **Backend**: Update `api/main.py` for new endpoints or logic.
- **Frontend**: Modify `frontend/index.html`, `style.css`, or `script.js`.
- **Extension**: Update `extension/content.js` or `manifest.json`.
- **Model**: Edit `train.py` to change or retrain the model.

## Contributing

Contributions are welcome. To contribute:

1. Fork the repo  
2. Create a branch: `git checkout -b feature-name`  
3. Make and test your changes  
4. Commit: `git commit -m "Description"`  
5. Push: `git push origin feature-name`  
6. Open a Pull Request  

### What You Can Contribute

- Model improvements  
- New algorithms  
- Frontend/UI updates  
- Extension features  
- Documentation updates  
- Bug fixes + performance improvements  
- More training data  

### Code Style

- Follow PEP 8  
- Use clear names  
- Comment complex logic  
- Keep functions small and focused  

### Testing Before Submitting

- Run the API without errors  
- Check the web interface  
- Test the Chrome extension  
- Verify predictions work as expected  

## Technologies

### Backend
- **Python 3.8+**  
- **scikit-learn** (Naive Bayes, TF-IDF)  
- **FastAPI**  
- **Uvicorn**  
- **Pydantic**  
- **Pandas**

### Frontend
- **HTML5**: Markup language
- **CSS3**: Styling and layout
- **JavaScript (ES6+)**: Frontend logic and API communication

### Extension
- **Chrome Extension API**: Browser extension development
- **Manifest V3**: Extension manifest format

## Model Information

### Algorithm

**Multinomial Naive Bayes** with TF-IDF vectorization

### Features

- **Vectorization**: TF-IDF (Term Frequency-Inverse Document Frequency)
- **Max Features**: 5000
- **N-grams**: Unigrams and bigrams (1, 2)
- **Text Preprocessing**: Lowercase conversion, punctuation removal

### Performance

- **Accuracy**: ~43%
- **Classes**: Buy, Hold, Sell
- **Training Data**: ~4,715 samples
- **Train/Test Split**: 80/20

### Current Limitations

- Moderate model accuracy
- Low confidence on unclear or ambiguous text
- Works best on finance-related news similar to the training data

### Future Improvements

- Better text preprocessing
- Hyperparameter tuning
- More training data
- Handling class imbalance
- Trying new algorithms (SVM, Random Forest, etc.)
- Possible deep learning upgrade

## Troubleshooting

### API Server Issues

**API won’t start**
- Make sure port 8000 is free  
- Reinstall dependencies: `pip install -r requirements.txt`

**Model not loading**
- Run `python train.py`  
- Check that `model/vectorizer.pkl` and `model/model.pkl` exist

### Frontend Issues

**“Error connecting to API”**
- Confirm the API is running  
- Check browser console (F12)  
- Ensure CORS is enabled

**Results not showing**
- Look for JS errors in console  
- Make sure API returns valid JSON  
- Refresh or clear cache

### Extension Issues

**Headlines not analyzing**
- API must be running on `localhost:8000`  
- Check extension permissions  
- Reload the extension  
- Check console for errors

**Console errors**
- Ensure the API is reachable  
- Verify `/predict` works  
- Check `manifest.json` permissions

### Model Training Issues

**Training script fails**
- Check `data/training_data.csv`  
- Ensure columns `text` and `sentiment` exist  
- Make sure there’s enough disk space

**Low accuracy**
- Add more data  
- Improve preprocessing  
- Adjust hyperparameters  
- Handle class imbalance

## License

Educational project. Use responsibly.

## Acknowledgments

Created as part of a student assignment on end-to-end ML system design.

## References

- scikit-learn: https://scikit-learn.org/  
- FastAPI: https://fastapi.tiangolo.com/  
- Chrome Extensions: https://developer.chrome.com/docs/extensions/

