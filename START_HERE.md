# 🚀 Quick Start Guide

## Step-by-Step Instructions

### 1️⃣ Install Dependencies (Already Done!)
```bash
pip install -r requirements.txt
```

### 2️⃣ Train the Model (Already Done!)
```bash
python train.py
```
✅ Model is already trained and saved in `model/` folder

### 3️⃣ Start the API Server
Open a terminal and run:
```bash
uvicorn api.main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
✅ Model loaded successfully
```

### 4️⃣ Test the Web Interface
1. Open `frontend/index.html` in your web browser
2. Enter a stock news headline
3. Click "Analyze Sentiment"
4. See the Buy/Hold/Sell prediction!

### 5️⃣ Install Chrome Extension (Optional)
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Visit a financial news website
6. Headlines will be analyzed automatically!

## Testing the API

You can test the API directly:
```bash
curl -X POST "http://localhost:8000/predict" \
     -H "Content-Type: application/json" \
     -d '{"text": "Stock prices surge as company reports record profits"}'
```

## Project Status

✅ All components are integrated and ready to use!
✅ Model trained with ~43% accuracy
✅ FastAPI backend ready
✅ Web interface ready
✅ Chrome extension ready

## Troubleshooting

**API not connecting?**
- Make sure `uvicorn api.main:app --reload` is running
- Check that port 8000 is not in use

**Extension not working?**
- Make sure the API is running on localhost:8000
- Check browser console for errors (F12)

**Model predictions seem off?**
- The model is trained on your specific dataset
- Try with actual stock market news for best results

