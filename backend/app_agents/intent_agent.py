import json
import time
from agents import Agent, Runner
from agents import __init__ as _
from . import gemini_model

intent_agent = Agent(
    name="IntentAgent",
    instructions="""You are an intent parsing agent for NearLink, a service booking platform in Pakistan.
Your job is to parse user requests which may be in Urdu, Roman Urdu, or English.

Extract the following fields from the user's request:
- service_type: The type of service needed (e.g., "AC Repair", "Plumber", "Electrician", "Carpenter", "Painter", "Cleaner"). Normalize common terms like "AC technician" to "AC Repair".
- location: The specific area or sector mentioned. Pay VERY close attention to Pakistani sector codes (e.g., "G-13", "G-11", "F-10", "I-8", "DHA", "Gulshan"). If a sector code like "G-13" is in the text, it is the PRIMARY location.
- time: When the service is needed. Normalize to a readable format (e.g., "Tomorrow Morning", "Today Evening", "ASAP").
- urgency: Rate urgency as "low", "medium", or "high" based on time and language cues.
- language_detected: The primary language of the input ("urdu", "roman_urdu", or "english").

Context for Location:
In Pakistan (especially Islamabad), locations are often written as letter-number sectors. 
"G-13", "G13", "F11", "H-9" are all valid locations. Do NOT mark them as Unknown.

RESPOND WITH ONLY A VALID JSON OBJECT:
{"service_type": "...", "location": "...", "time": "...", "urgency": "...", "language_detected": "..."}
""",
    model=gemini_model,
)


async def parse_intent(raw_text: str) -> dict:
    """Parse user intent from raw text using Gemini (with fallback)."""
    start = time.time()
    
    try:
        result = await Runner.run(intent_agent, input=raw_text)
        duration_ms = int((time.time() - start) * 1000)

        output_text = result.final_output.strip()
        # Clean markdown code blocks if present
        if output_text.startswith("```"):
            output_text = output_text.split("\n", 1)[1] if "\n" in output_text else output_text[3:]
            if output_text.endswith("```"):
                output_text = output_text[:-3]
            output_text = output_text.strip()

        try:
            parsed = json.loads(output_text)
        except json.JSONDecodeError:
            parsed = {
                "service_type": "General Service",
                "location": "Unknown",
                "time": "ASAP",
                "urgency": "medium",
                "language_detected": "english"
            }

        return {"parsed": parsed, "duration_ms": duration_ms, "raw_output": output_text}
    
    except Exception as e:
        # Fallback to keyword-based parsing if Gemini fails
        print(f"⚠️  Gemini API failed, using fallback parser: {str(e)}")
        from .intent_agent_fallback import parse_intent_fallback
        return parse_intent_fallback(raw_text)
