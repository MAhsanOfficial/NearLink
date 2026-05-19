import json
import time
from agents import Agent, Runner
from . import gemini_model

ranking_agent = Agent(
    name="RankingAgent",
    instructions="""You are a provider ranking agent for NearLink.
You receive a list of service providers and must rank them based on:
1. Rating (higher is better, weight: 40%)
2. Distance (lower km is better, weight: 35%)
3. Availability (available providers preferred, weight: 25%)

For each provider, calculate a composite score (0-100) and provide brief reasoning.
Return the providers ranked from best to worst.

RESPOND WITH ONLY A VALID JSON OBJECT, no markdown:
{
  "ranked_providers": [
    {
      "provider_id": "...",
      "rank": 1,
      "score": 85.5,
      "reasoning": "Highest rated at 4.8 stars with close proximity of 2.1km"
    }
  ],
  "recommendation": "Brief explanation of why the top provider is recommended"
}
""",
    model=gemini_model,
)


async def rank_providers(providers: list, service_type: str, location: str) -> dict:
    """Rank providers using AI reasoning (with fallback)."""
    start = time.time()

    if not providers:
        return {
            "ranked_providers": [],
            "recommendation": "No providers found matching your criteria.",
            "duration_ms": 0
        }

    # Map original complex IDs to simple string keys (prov_1, prov_2, ...) to prevent LLM typos
    id_map = {}
    simplified_providers = []
    
    for i, p in enumerate(providers):
        simple_id = f"prov_{i+1}"
        id_map[simple_id] = p.get("id")
        
        # Create a simplified provider dictionary for the prompt
        p_copy = dict(p)
        p_copy["id"] = simple_id
        # Remove raw_data to keep prompt small
        if "raw_data" in p_copy:
            del p_copy["raw_data"]
        simplified_providers.append(p_copy)

    # Fallback ranking function
    def fallback_ranking():
        sorted_providers = sorted(providers, key=lambda p: (-p.get("rating", 0), p.get("distance_km", 999)))
        return {
            "ranked_providers": [
                {
                    "provider_id": p["id"],
                    "rank": i + 1,
                    "score": round(max(0, 100 - i * 15 - (p.get("distance_km") or 5) * 3 + p.get("rating", 3) * 8), 1),
                    "reasoning": f"Rating: {p.get('rating', 'N/A')}, Distance: {p.get('distance_km', 'N/A')}km"
                }
                for i, p in enumerate(sorted_providers)
            ],
            "recommendation": f"Top pick: {sorted_providers[0]['name']} with {sorted_providers[0].get('rating', 'N/A')} stars" if sorted_providers else "No providers available"
        }

    try:
        prompt = f"""Rank these {service_type} providers near {location}:

{json.dumps(simplified_providers, indent=2)}

Consider distance, rating, and availability. Return ranked JSON."""

        result = await Runner.run(ranking_agent, input=prompt)
        duration_ms = int((time.time() - start) * 1000)

        output_text = result.final_output.strip()
        if output_text.startswith("```"):
            output_text = output_text.split("\n", 1)[1] if "\n" in output_text else output_text[3:]
            if output_text.endswith("```"):
                output_text = output_text[:-3]
            output_text = output_text.strip()

        try:
            ranking_data = json.loads(output_text)
            
            # Map simplified IDs back to their original IDs
            for rp in ranking_data.get("ranked_providers", []):
                pid = rp.get("provider_id")
                if pid in id_map:
                    rp["provider_id"] = id_map[pid]
                    
        except json.JSONDecodeError:
            ranking_data = fallback_ranking()

        ranking_data["duration_ms"] = duration_ms
        return ranking_data
    
    except Exception as e:
        # Use fallback if Gemini fails
        print(f"⚠️  Gemini API failed for ranking, using fallback: {str(e)}")
        duration_ms = int((time.time() - start) * 1000)
        ranking_data = fallback_ranking()
        ranking_data["duration_ms"] = duration_ms
        ranking_data["fallback"] = True
        return ranking_data
