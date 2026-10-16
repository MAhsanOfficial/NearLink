import json
import time
from agents import Agent, Runner
from . import gemini_model

ranking_agent = Agent(
    name="RankingAgent",
    instructions="""You are a provider ranking agent for NearLink.
You receive a list of service providers and must rank them based on:
1. Trust Score (Weight: 25%) - Providers with a 'trust_score' of 1.0 are premium. Scores below 0.8 must be heavily penalized and mentioned as 'at risk'.
2. Rating & Reviews (Weight: 35%) - Higher ratings (4.5+) and higher review counts are prioritized.
3. Verification Status (Weight: 15%) - "Verified" providers should be boosted.
4. Distance (Weight: 15%) - Closer proximity is preferred.
5. Financial Reliability (Weight: 10%) - Providers with high 'wallet_balance' are considered more reliable partners.

For each provider, calculate a composite score (0-100) and provide brief reasoning.
In your reasoning, EXPLICITLY mention their Trust Score status (e.g., "Highly trusted partner" or "Low trust warning") and their rating.

Return the providers ranked from best to worst.

RESPOND WITH ONLY A VALID JSON OBJECT, no markdown:
{
  "ranked_providers": [
    {
      "provider_id": "...",
      "rank": 1,
      "score": 85.5,
      "reasoning": "Highest rated partner with 4.8 stars and 45 verified reviews. Very close proximity of 1.2km."
    }
  ],
  "recommendation": "Brief explanation of why the top provider is recommended based on trust and rating"
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


# ---------------------------------------------------------------------------
# Transparent ranking: the numbers are computed deterministically (auditable,
# reproducible, no hallucinated scores); Gemini only writes the human explanation.
# ---------------------------------------------------------------------------
from datetime import datetime
from typing import Optional

WEIGHTS = {"distance": 25, "rating": 25, "availability": 25, "trust": 15, "price": 10}
PRIOR_RATING, PRIOR_WEIGHT = 3.8, 5  # Bayesian smoothing so 1 review at 5.0 doesn't beat 200 at 4.7

explainer_agent = Agent(
    name="RankingExplainer",
    instructions="""You explain provider recommendations for NearLink users in Pakistan.
You get the top providers with their score breakdown and the user's language
("english", "roman_urdu" or "urdu"). For each provider write ONE short, concrete sentence (max 22 words)
in that language, citing the real numbers given (distance, rating, slot time). Never invent facts.
Respond with ONLY valid JSON: {"explanations": {"<provider_id>": "..."}, "recommendation": "<one sentence about the #1 pick>"}""",
    model=gemini_model,
)


def score_provider(p: dict, preferred_utc: Optional[datetime] = None) -> dict:
    """Score one candidate 0-100 with a per-component breakdown. `p` may carry `best_slot` (datetime|None)
    and `slot_known` (bool) from the availability step."""
    pts, notes = {}, {}

    d = p.get("distance_km")
    if d is None:
        pts["distance"], notes["distance"] = WEIGHTS["distance"] * 0.4, "distance unknown"
    else:
        pts["distance"] = WEIGHTS["distance"] * max(0.0, 1 - d / 10.0)
        notes["distance"] = f"{d:.1f} km away"

    rating, n = p.get("rating") or 0.0, p.get("total_reviews") or 0
    smoothed = (rating * n + PRIOR_RATING * PRIOR_WEIGHT) / (n + PRIOR_WEIGHT)
    pts["rating"] = WEIGHTS["rating"] * smoothed / 5.0
    notes["rating"] = f"{rating:.1f}★ from {n} reviews" if n else "no reviews yet"

    trust = p.get("trust_score")
    if trust is None:
        trust = 0.85 if p.get("source") == "registered" and p.get("verified") else 0.6
    pts["trust"] = WEIGHTS["trust"] * min(max(trust, 0), 1)
    notes["trust"] = f"trust {trust:.2f}"

    slot = p.get("best_slot")
    if preferred_utc is None and "best_slot" not in p:
        pts["availability"], notes["availability"] = WEIGHTS["availability"] * 0.5, "no time requested"
    elif slot is None:
        pts["availability"], notes["availability"] = 0.0, "no free slot in the requested window"
    else:
        gap_h = abs((slot - preferred_utc).total_seconds()) / 3600 if preferred_utc else 0
        fit = max(0.4, 1 - 0.15 * gap_h)
        if not p.get("slot_known", True):
            fit *= 0.8  # external business: schedule unverified until they confirm by phone
        pts["availability"] = WEIGHTS["availability"] * fit
        notes["availability"] = "free at requested time" if gap_h < 0.5 else f"free {gap_h:.0f}h from requested time"

    price = str(p.get("price_range") or "").lower()
    price_fit = 0.8 if price in ("low", "$", "budget") else 0.5 if price in ("medium", "$$", "") else 0.3
    pts["price"], notes["price"] = WEIGHTS["price"] * price_fit, f"price band {p.get('price_range') or 'unknown'}"

    pts = {k: round(v, 1) for k, v in pts.items()}
    return {"score": round(sum(pts.values()), 1), "breakdown": pts, "notes": notes}


def _template_explanation(p: dict, sc: dict, language: str) -> str:
    n = sc["notes"]
    slot = p.get("slot_label")
    if language == "urdu":
        return f"{n['distance']}، {n['rating']}" + (f"، {slot} پر دستیاب" if slot else "")
    if language == "roman_urdu":
        return f"{n['distance']}, {n['rating']}" + (f", {slot} par available" if slot else "")
    return f"{n['distance']}, {n['rating']}" + (f", available {slot}" if slot else "")


async def rank_with_breakdown(
    providers: list,
    service_type: str,
    location: str,
    preferred_utc: Optional[datetime] = None,
    language: str = "english",
    explain: bool = True,
) -> dict:
    """Rank providers by a transparent weighted score and attach a justification to each of the top 3."""
    start = time.time()
    if not providers:
        return {"ranked_providers": [], "recommendation": "No providers found.", "duration_ms": 0, "explained_by": "none"}

    scored = []
    for p in providers:
        sc = score_provider(p, preferred_utc)
        scored.append((p, sc))
    scored.sort(key=lambda x: (-x[1]["score"], x[0].get("distance_km") or 999))

    ranked = [
        {
            "provider_id": p["id"], "rank": i + 1, "score": sc["score"],
            "score_breakdown": sc["breakdown"], "score_notes": sc["notes"],
            "reasoning": _template_explanation(p, sc, language),
        }
        for i, (p, sc) in enumerate(scored)
    ]
    recommendation = f"Top pick: {scored[0][0]['name']} ({ranked[0]['reasoning']})"
    explained_by = "template"

    if explain:
        top = scored[:3]
        id_map = {f"prov_{i+1}": p["id"] for i, (p, _) in enumerate(top)}  # short keys: no LLM id typos
        payload = [
            {"id": f"prov_{i+1}", "name": p["name"], "slot": p.get("slot_label"), "score": sc["score"], "facts": sc["notes"]}
            for i, (p, sc) in enumerate(top)
        ]
        try:
            result = await Runner.run(explainer_agent, input=json.dumps({"language": language, "service": service_type, "providers": payload}, ensure_ascii=False))
            text = result.final_output.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            data = json.loads(text)
            by_id = {id_map[k]: v for k, v in (data.get("explanations") or {}).items() if k in id_map and isinstance(v, str)}
            for r in ranked:
                if r["provider_id"] in by_id:
                    r["reasoning"] = by_id[r["provider_id"]]
            recommendation = data.get("recommendation") or recommendation
            explained_by = "gemini"
        except Exception as e:  # LLM down/garbled: numbers are still valid, keep template text
            print(f"⚠️  Ranking explainer fell back to templates: {e}")

    return {
        "ranked_providers": ranked,
        "recommendation": recommendation,
        "duration_ms": int((time.time() - start) * 1000),
        "explained_by": explained_by,
    }
