import os
from typing import List, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import AsyncOpenAI
from app_agents import gemini_client

router = APIRouter(prefix="/api/guide", tags=["guide"])

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class GuideChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

GUIDE_SYSTEM_INSTRUCTIONS = """You are the NearLink Guide, a specialized AI assistant designed ONLY to answer questions about the NearLink platform and guide users on how to use it.

About NearLink:
- Purpose: NearLink is an AI-powered local services marketplace orchestrating informal service providers (plumbers, electricians, mechanics, painters, etc.) in Pakistan.
- Core Feature: It supports Urdu, Roman Urdu, and English code-switching.
- Core Ecosystem (4 Agents):
  1. IntentAgent: Parses multilingual natural language and extracts service types (plumber, electrician) and locations (like DHA, G-13 Islamabad).
  2. DiscoveryAgent: Resolves locations via Nominatim and merges local Postgres database providers with real-time Google Places API results (getting active business contact phone numbers).
  3. RankingAgent: Evaluates candidates using proximity, ratings, and availability, and ranks them. It uses an ID Simplifier layer (mapping complex Google Place IDs to short keys like prov_1, prov_2) to eliminate LLM hallucinations, and provides a clear Urdu/English ranking justification.
  4. BookingAgent: Finalizes slot reservation, handles proxy registration of external businesses to satisfy database foreign keys dynamically, and generates instant confirmations.
- Other Features:
  - Real-time voice note recordings for service requests.
  - Interactive maps and live route tracking for arriving providers.
  - Instant price negotiation with AI validation.

Strict Guidelines:
1. ONLY answer queries about NearLink, its features, its agents, how to use it, how to book services, or how to sign up as a provider.
2. If the user asks ANY question unrelated to NearLink (e.g., general knowledge, coding assistance, cooking, weather, math, general chatting, jokes, writing content, other websites/apps), politely decline to answer. Respond that you are only programmed to help with NearLink-related queries and guide them back to NearLink features.
3. Match the user's language: If they ask in Roman Urdu (e.g. "bhai ye app kya karti hai?"), respond in Roman Urdu. If they ask in Urdu, respond in Urdu. If they ask in English, respond in English.
4. Keep the tone friendly, helpful, professional, and clear.
"""

@router.post("/chat")
async def chat_with_guide(req: GuideChatRequest):
    """Interact with the NearLink personalized Guide Chatbot"""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        # Build messages list for Gemini API
        messages = [{"role": "system", "content": GUIDE_SYSTEM_INSTRUCTIONS}]
        
        # Add history
        if req.history:
            for msg in req.history:
                # Map roles appropriately (openai uses 'user' and 'assistant')
                role = "assistant" if msg.role == "assistant" else "user"
                messages.append({"role": role, "content": msg.content})
        
        # Add current message
        messages.append({"role": "user", "content": req.message})

        # Call Gemini via OpenAI compatible client
        response = await gemini_client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=messages,
            temperature=0.3,  # lower temp for factual guidance
            max_tokens=800
        )
        
        reply = response.choices[0].message.content
        return {"status": "success", "reply": reply}

    except Exception as e:
        print(f"❌ Error in Guide Chatbot: {str(e)}")
        # Simple local keyword fallback if Gemini fails
        msg_lower = req.message.lower()
        if "hello" in msg_lower or "hi" in msg_lower or "salam" in msg_lower or "helo" in msg_lower:
            reply = "Assalam-o-Alaikum! I am your NearLink Guide. I can help you understand how to request services like plumbers or electricians, how our AI matches you, or how to use the app. What would you like to know?"
        elif "plumber" in msg_lower or "electrician" in msg_lower or "ac" in msg_lower or "service" in msg_lower:
            reply = "NearLink allows you to find nearby service providers instantly. Just type what you need (in English, Urdu, or Roman Urdu) and our AI Intent Agent will find verified providers or Google Places businesses near you. You can then review rankings and book them immediately!"
        elif "vapi" in msg_lower or "voice" in msg_lower:
            reply = "You can speak to our Voice Agent on the landing page! Click the Voice Agent option to talk to our simulated AI assistant about how NearLink works. For live Vapi production integration, we need your Vapi Public Key and Assistant ID."
        else:
            reply = "I am the NearLink Guide, here to answer queries about our AI service orchestrator, how to book services, or how our agents function. Could you please ask something specific to NearLink?"
        
        return {"status": "success", "reply": reply, "fallback": True}

@router.get("/config")
async def get_guide_config():
    """Retrieve Vapi configuration details safely from backend environment variables"""
    return {
        "vapi_public_key": os.getenv("VAPI_PUBLIC_KEY", ""),
        "vapi_assistant_id": os.getenv("VAPI_ASSISTANT_ID", "")
    }
