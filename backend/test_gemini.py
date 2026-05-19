"""
Test Gemini API directly
"""
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

print("Testing Gemini API...")
print(f"API Key: {GEMINI_API_KEY[:20]}..." if GEMINI_API_KEY else "No API key found")

try:
    # Test 1: Import agents
    print("\n1. Testing imports...")
    from agents import Agent, Runner
    print("   ✅ Agents SDK imported successfully")
    
    # Test 2: Import Gemini model
    print("\n2. Testing Gemini model import...")
    from app_agents import gemini_model
    print(f"   ✅ Gemini model imported: {gemini_model}")
    
    # Test 3: Create a simple agent
    print("\n3. Creating test agent...")
    test_agent = Agent(
        name="TestAgent",
        instructions="You are a test agent. Respond with 'Hello World' only.",
        model=gemini_model
    )
    print("   ✅ Agent created successfully")
    
    # Test 4: Run agent
    print("\n4. Running agent with test input...")
    import asyncio
    
    async def test_run():
        result = await Runner.run(test_agent, input="Say hello")
        return result.final_output
    
    output = asyncio.run(test_run())
    print(f"   ✅ Agent response: {output}")
    
    print("\n✅ All Gemini tests passed!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
