#!/usr/bin/env python3
"""
Test script to verify Groq API integration
Run this after setting up your .env file with GROQ_API_KEY
"""

from groq import Groq
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key
api_key = os.getenv("GROQ_API_KEY")

if not api_key or api_key == "your_groq_api_key_here":
    print("❌ Error: GROQ_API_KEY not found or not set in .env file")
    print("\nPlease:")
    print("1. Open .env file")
    print("2. Replace 'your_groq_api_key_here' with your actual Groq API key")
    print("3. Get your API key from: https://console.groq.com/keys")
    exit(1)

# Initialize Groq client
print("🔧 Initializing Groq client...")
client = Groq(api_key=api_key)

# Test the API
print("📡 Testing Groq API...")
try:
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": "Explain why 'Stock prices surge' indicates Buy sentiment in 2 sentences."
            }
        ],
        model="llama-3.1-8b-instant",
        max_tokens=100
    )
    
    print("\n✅ Success! Groq API is working!")
    print("\n" + "="*60)
    print("Response:")
    print("="*60)
    print(chat_completion.choices[0].message.content)
    print("="*60)
    print("\n✅ You can now integrate Groq into your API!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nTroubleshooting:")
    print("1. Check that your API key is correct")
    print("2. Verify you have internet connection")
    print("3. Check Groq service status")



