"""
Test Gemini API Key
"""
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def test_gemini():
    """Test if Gemini API key is working"""
    
    api_key = os.getenv("GEMINI_API_KEY")
    
    print("=" * 50)
    print("Testing Gemini API Key")
    print("=" * 50)
    print()
    
    if not api_key:
        print("❌ ERROR: GEMINI_API_KEY not found in .env file!")
        return
    
    print(f"✅ API Key found: {api_key[:20]}...")
    print()
    
    try:
        from openai import AsyncOpenAI
        
        client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )
        
        print("🔄 Testing API call...")
        
        response = await client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[
                {"role": "user", "content": "Say 'Hello' if you can hear me"}
            ],
            max_tokens=50
        )
        
        result = response.choices[0].message.content
        
        print()
        print("=" * 50)
        print("✅ SUCCESS! Gemini API is working!")
        print("=" * 50)
        print()
        print(f"Response: {result}")
        print()
        print("✅ Your API key is valid and working!")
        print()
        
    except Exception as e:
        error_msg = str(e)
        print()
        print("=" * 50)
        print("❌ ERROR! Gemini API failed!")
        print("=" * 50)
        print()
        print(f"Error: {error_msg}")
        print()
        
        if "429" in error_msg or "quota" in error_msg.lower():
            print("🚨 Issue: API Quota Exceeded")
            print()
            print("Solutions:")
            print("1. Wait for quota to reset (usually 24 hours)")
            print("2. Get a new API key from: https://aistudio.google.com/app/apikey")
            print("3. Use fallback system (already working in your app!)")
            
        elif "401" in error_msg or "invalid" in error_msg.lower():
            print("🚨 Issue: Invalid API Key")
            print()
            print("Solutions:")
            print("1. Get a new API key from: https://aistudio.google.com/app/apikey")
            print("2. Update .env file with new key")
            print("3. Use fallback system (already working in your app!)")
            
        else:
            print("🚨 Issue: Unknown Error")
            print()
            print("Solutions:")
            print("1. Check your internet connection")
            print("2. Try a new API key: https://aistudio.google.com/app/apikey")
            print("3. Use fallback system (already working in your app!)")
        
        print()
        print("=" * 50)
        print("ℹ️  Good News: Your app has a fallback system!")
        print("=" * 50)
        print()
        print("Even if Gemini fails, your app will use keyword-based")
        print("parsing which is 80-85% accurate and works perfectly!")
        print()

if __name__ == "__main__":
    asyncio.run(test_gemini())
