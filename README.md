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

- Naive Bayes Classifier with TF-IDF (Term Frequency-Inverse Document Frequency) vectorization for text classification
- FastAPI backend service with RESTful API endpoints
- Responsive web interface for manual text analysis
- Chrome extension for real-time headline classification on financial news websites
- Model evaluation and performance metrics
- Support for batch processing and single text analysis

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
- pandas: Data manipulation and analysis
- scikit-learn: Machine learning library (Naive Bayes, TF-IDF)
- fastapi: Modern web framework for building APIs
- uvicorn: ASGI server for running FastAPI
- pydantic: Data validation using Python type annotations

### 4. Train the Model

Before using the system, you need to train the sentiment analysis model:

```bash
python train.py
```

This script will:
- Load the training data from `data/training_data.csv`
- Preprocess the text (lowercase, remove punctuation)
- Split data into training and testing sets (80/20)
- Create TF-IDF features with 5000 max features and bigrams
- Train a Multinomial Naive Bayes classifier
- Evaluate the model and display performance metrics
- Save the trained model and vectorizer to `model/` folder

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

- **train.py**: Main training script that loads training data, preprocesses text, creates TF-IDF features, trains the Naive Bayes model, evaluates performance, and saves the trained model and vectorizer to the model/ directory.

- **test_model.py**: Utility script for quickly testing the trained model with sample text inputs. Useful for verifying model functionality after training.

- **requirements.txt**: Lists all Python package dependencies required for the project. Used by pip to install necessary libraries.

- **README.md**: Comprehensive project documentation including installation, usage, API documentation, and troubleshooting guides.

- **START_HERE.md**: Quick reference guide for getting started with the project, including basic setup and usage instructions.

#### api/ Directory

- **main.py**: FastAPI application that provides REST API endpoints. Handles HTTP requests, loads the trained model, processes text input, and returns sentiment predictions. Includes CORS middleware for frontend access and health check endpoints.

#### data/ Directory

- **training_data.csv**: Primary training dataset containing text samples and their corresponding sentiment labels (Buy, Hold, Sell). This is the main dataset used to train the sentiment analysis model.

- **data_labeled.csv**: Alternative dataset with additional features including Reputation, Financial, Regulatory, Risks, Fundamentals, Conditions, Market, and Volatility scores. May be used for feature engineering or advanced analysis.

- **collected/**: Directory containing raw news data collected from various financial news sources. Files are organized by source and date.

- **processed/**: Directory containing processed and cleaned versions of collected news data, ready for analysis or training.

- **tickers/**: Directory containing stock ticker information and symbol lists used for data collection and processing.

#### extension/ Directory

- **manifest.json**: Chrome extension configuration file that defines permissions, content scripts, and extension metadata. Uses Manifest V3 format.

- **content.js**: Content script that runs on web pages to automatically detect and analyze news headlines. Sends text to the API and displays sentiment badges next to headlines.

- **popup.html**: HTML interface for the extension popup that appears when users click the extension icon.

- **icon.png**: Icon image displayed in the browser toolbar for the extension.

#### frontend/ Directory

- **index.html**: Main web interface HTML file containing the sentiment analysis form, result display area, and embedded JavaScript code for API communication.

- **style.css**: Cascading Style Sheets file defining the visual design, layout, colors, and responsive styling for the web interface.

- **script.js**: JavaScript file containing frontend logic for handling user input, making API requests, and displaying results. Note: Currently the JavaScript is embedded directly in index.html.

#### model/ Directory

- **vectorizer.pkl**: Serialized TF-IDF vectorizer object saved after training. Used by the API to transform new text input into the same feature space as the training data.

- **model.pkl**: Serialized trained Multinomial Naive Bayes classifier. Loaded by the API to make sentiment predictions on new text.

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

1. Ensure the API server is running (see above)

2. Open `frontend/index.html` in your web browser

3. Enter a stock market news headline or article in the text area

4. Click "Analyze Sentiment" to get the prediction

5. The result will display with:
   - Sentiment classification (Buy/Hold/Sell)
   - Confidence score
   - Probability distribution for all classes

### Using the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`

2. Enable "Developer mode" (toggle in top right)

3. Click "Load unpacked"

4. Select the `extension/` folder from this project

5. The extension is now installed and active

6. Visit financial news websites (e.g., MarketWatch, Reuters, Yahoo Finance)

7. Headlines will be automatically analyzed and display sentiment badges

Note: The API server must be running on `localhost:8000` for the extension to work.

### Testing the Model

You can test the trained model directly:

```bash
python test_model.py
```

This will run sample predictions and display the results.

## Testing the Application

### Step 1: Navigate to Project Directory

```bash
cd /home/morgankim/coding_place/Stock-News-Sentiment-Analysis
```

### Step 2: Activate Virtual Environment (if using one)

```bash
source venv/bin/activate
```

### Step 3: Install Dependencies (if not already installed)

```bash
pip install -r requirements.txt
```

### Step 4: Train the Model

```bash
python train.py
```

**What this does:** Trains the sentiment analysis model using your training data

**Expected output:** You'll see training progress, evaluation metrics, and confirmation that model files were saved

**Time:** This may take a few minutes depending on dataset size

**Result:** Creates `model/model.pkl` and `model/vectorizer.pkl`

### Step 5: Verify Model Files Were Created

```bash
ls -la model/
```

**Expected output:** You should see `model.pkl`, `vectorizer.pkl`, and `metrics.json`

### Step 6: Start the API Server

```bash
uvicorn api.main:app --reload
```

**What this does:** Starts the FastAPI backend server

**Keep this terminal open** - the server needs to keep running

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
✅ Model loaded successfully
✅ Groq client initialized successfully (if configured)
✅ Loaded X stock tickers
INFO:     Application startup complete.
```

### Step 7: Open the Web Interface (in a new terminal)

**Option A: Using command line**
```bash
cd /home/morgankim/coding_place/Stock-News-Sentiment-Analysis/frontend
xdg-open index.html
```

**Option B: Manual navigation**
- Open your file manager
- Navigate to `/home/morgankim/coding_place/Stock-News-Sentiment-Analysis/frontend/`
- Double-click `index.html` to open in your browser

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

- **Backend**: Modify `api/main.py` to add new endpoints or functionality
- **Frontend**: Update `frontend/index.html`, `style.css`, or `script.js`
- **Extension**: Modify `extension/content.js` or `manifest.json`
- **Model**: Update `train.py` for model improvements

## Contributing

We welcome contributions to improve this project. Here's how you can contribute:

### Getting Started

1. Fork the repository
2. Create a new branch for your feature: `git checkout -b feature-name`
3. Make your changes
4. Test your changes thoroughly
5. Commit your changes: `git commit -m "Description of changes"`
6. Push to your branch: `git push origin feature-name`
7. Open a Pull Request

### Areas for Contribution

- Model improvements (accuracy, preprocessing, feature engineering)
- Additional algorithms (SVM, Random Forest, Neural Networks)
- Frontend enhancements (UI/UX improvements, additional features)
- Extension features (more website support, batch analysis)
- Documentation improvements
- Bug fixes and performance optimizations
- Additional training data collection

### Code Style

- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and modular

### Testing

Before submitting a pull request:
- Test all functionality manually
- Ensure the API server starts without errors
- Verify the web interface works correctly
- Test the Chrome extension on multiple websites

## Technologies

### Backend
- **Python 3.8+**: Primary programming language
- **scikit-learn**: Machine learning library
  - Multinomial Naive Bayes classifier
  - TF-IDF vectorization
- **FastAPI**: Modern, fast web framework for building APIs
- **Uvicorn**: ASGI server implementation
- **Pydantic**: Data validation and settings management
- **Pandas**: Data manipulation and analysis

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

- Model accuracy is moderate and can be improved
- Confidence scores may be low for ambiguous text
- Performance depends on similarity to training data
- Best results with financial/stock market news

### Future Improvements

- Enhanced text preprocessing (stopword removal, stemming)
- Hyperparameter tuning
- Additional training data
- Class imbalance handling
- Alternative algorithms (SVM, Random Forest)
- Deep learning approaches

## Troubleshooting

### API Server Issues

**Problem**: API server won't start
- **Solution**: Ensure port 8000 is not in use: `lsof -i :8000` (Linux/Mac) or `netstat -ano | findstr :8000` (Windows)
- **Solution**: Check that all dependencies are installed: `pip install -r requirements.txt`

**Problem**: Model not loaded error
- **Solution**: Run `python train.py` to generate model files
- **Solution**: Verify `model/vectorizer.pkl` and `model/model.pkl` exist

### Frontend Issues

**Problem**: Web interface shows "Error connecting to API"
- **Solution**: Ensure the API server is running on `http://localhost:8000`
- **Solution**: Check browser console (F12) for detailed error messages
- **Solution**: Verify CORS is enabled in the API (should be configured by default)

**Problem**: Results not displaying
- **Solution**: Check browser console for JavaScript errors
- **Solution**: Verify the API is returning valid JSON responses
- **Solution**: Clear browser cache and refresh

### Extension Issues

**Problem**: Extension not analyzing headlines
- **Solution**: Ensure API server is running on `localhost:8000`
- **Solution**: Check extension permissions in `chrome://extensions/`
- **Solution**: Reload the extension after making changes
- **Solution**: Check browser console for content script errors

**Problem**: Extension shows errors in console
- **Solution**: Verify `http://localhost:8000` is accessible
- **Solution**: Check that the API `/predict` endpoint is working
- **Solution**: Ensure manifest.json has correct permissions

### Model Training Issues

**Problem**: Training script fails
- **Solution**: Verify `data/training_data.csv` exists and is readable
- **Solution**: Check CSV format (should have 'text' and 'sentiment' columns)
- **Solution**: Ensure sufficient disk space for model files

**Problem**: Low model accuracy
- **Solution**: Collect more training data
- **Solution**: Improve text preprocessing
- **Solution**: Try different hyperparameters
- **Solution**: Address class imbalance in dataset

## License

This is a student project for educational purposes. Please use responsibly and in accordance with your institution's academic integrity policies.

## Acknowledgments

This project was developed as part of a student assignment focusing on end-to-end machine learning system development. The system demonstrates integration of machine learning models with web technologies and browser extensions.

## References

- scikit-learn Documentation: https://scikit-learn.org/
- FastAPI Documentation: https://fastapi.tiangolo.com/
- Chrome Extension Documentation: https://developer.chrome.com/docs/extensions/
