import json
import time
from agents import Agent, Runner
from . import gemini_model

negotiation_agent = Agent(
    name="NegotiationAgent",
    instructions="""You are a Negotiation Verification Agent for NearLink.
Your task is to analyze the chat history between a service provider and a customer.
You must determine if they have reached a final agreement on the price of the service.

Criteria for agreement:
1. One party proposes a price (e.g., "I can do it for Rs. 1500").
2. The other party explicitly accepts (e.g., "Ok", "Done", "Agreed", or clicking an 'Accept' button).
3. If multiple prices were discussed, only the LATEST agreed-upon price matters.

Input: A list of chat messages.
Output: A JSON object.

Example Output (Success):
{
  "verified": true,
  "agreed_amount": 1500.0,
  "reasoning": "The provider offered 1500 and the customer said 'Done'."
}

Example Output (Failure):
{
  "verified": false,
  "agreed_amount": null,
  "reasoning": "The customer hasn't responded to the provider's last offer of 2000."
}

RESPOND WITH ONLY VALID JSON.
""",
    model=gemini_model,
)

async def verify_negotiation(messages: list, claimed_amount: float) -> dict:
    """Verify if the claimed amount matches the chat history using AI."""
    start = time.time()
    
    if not messages:
        return {"verified": False, "reasoning": "No chat history found."}

    # Simplify messages for the prompt
    history = [
        {"sender": m["sender_name"], "text": m["content"], "type": m["message_type"], "offer": m.get("offer_amount")}
        for m in messages
    ]

    prompt = f"""Analyze this chat history and tell me if they agreed on the price: {claimed_amount}.
    
    Chat History:
    {json.dumps(history, indent=2)}
    
    Does the history confirm an agreement for exactly Rs. {claimed_amount}?
    """

    try:
        result = await Runner.run(negotiation_agent, input=prompt)
        duration_ms = int((time.time() - start) * 1000)
        
        output_text = result.final_output.strip()
        if "```json" in output_text:
            output_text = output_text.split("```json")[1].split("```")[0].strip()
        elif "```" in output_text:
            output_text = output_text.split("```")[1].split("```")[0].strip()

        data = json.loads(output_text)
        
        # Cross-check the AI's agreed_amount with the provider's claimed_amount
        if data.get("verified") and data.get("agreed_amount") != claimed_amount:
            data["verified"] = False
            data["reasoning"] = f"AI found an agreed amount of {data.get('agreed_amount')}, which contradicts your claim of {claimed_amount}."
            
        data["duration_ms"] = duration_ms
        return data

    except Exception as e:
        print(f"Error in NegotiationAgent: {e}")
        return {
            "verified": False, 
            "reasoning": "AI verification failed. Please ensure the agreement is clear in the chat.",
            "error": str(e)
        }
