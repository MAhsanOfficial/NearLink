"""
Fallback intent parser when Gemini API is not available
Uses simple keyword matching
"""
import json
import time
import re

def parse_intent_fallback(raw_text: str) -> dict:
    """Parse intent using keyword matching (fallback when Gemini unavailable)"""
    start = time.time()
    
    text_lower = raw_text.lower()
    
    # Detect language
    urdu_words = ['مجھے', 'چاہیے', 'کل', 'آج', 'صبح', 'شام']
    roman_urdu_words = ['mujhe', 'chahiye', 'kal', 'aaj', 'subah', 'shaam', 'abhi', 'fori']
    
    has_urdu = any(word in raw_text for word in urdu_words)
    has_roman_urdu = any(word in text_lower for word in roman_urdu_words)
    
    if has_urdu:
        language = "urdu"
    elif has_roman_urdu:
        language = "roman_urdu"
    else:
        language = "english"
    
    # Detect service type
    service_keywords = {
        "AC Repair": ["ac", "air conditioning", "cooling", "ac repair", "ac service"],
        "Electrician": ["electrician", "bijli", "electric", "wiring", "light", "electricity"],
        "Plumber": ["plumber", "plumbing", "pani", "water", "pipe", "drain", "leak"],
        "Carpenter": ["carpenter", "wood", "furniture", "carpentry"],
        "Painter": ["painter", "paint", "painting", "color"],
        "Cleaner": ["cleaner", "cleaning", "safai", "clean"]
    }
    
    service_type = "General Service"
    for service, keywords in service_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            service_type = service
            break
    
    # Detect location
    location_patterns = [
        r'in\s+([A-Z][-\d]+)',  # G-13, F-10, etc.
        r'in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',  # DHA, Gulshan, etc.
        r'mein\s+([A-Z][-\d]+)',
        r'mein\s+([A-Z][a-z]+)',
    ]
    
    location = "Unknown"
    for pattern in location_patterns:
        match = re.search(pattern, raw_text)
        if match:
            location = match.group(1)
            break
    
    # Detect time/urgency
    urgent_words = ['urgent', 'fori', 'abhi', 'now', 'asap', 'emergency']
    today_words = ['today', 'aaj']
    tomorrow_words = ['tomorrow', 'kal']
    
    if any(word in text_lower for word in urgent_words):
        time_str = "ASAP"
        urgency = "high"
    elif any(word in text_lower for word in today_words):
        time_str = "Today"
        urgency = "medium"
    elif any(word in text_lower for word in tomorrow_words):
        time_str = "Tomorrow"
        urgency = "low"
    else:
        time_str = "ASAP"
        urgency = "medium"
    
    duration_ms = int((time.time() - start) * 1000)
    
    parsed = {
        "service_type": service_type,
        "location": location,
        "time": time_str,
        "urgency": urgency,
        "language_detected": language
    }
    
    return {
        "parsed": parsed,
        "duration_ms": duration_ms,
        "raw_output": json.dumps(parsed),
        "fallback": True
    }


# Test
if __name__ == "__main__":
    test_cases = [
        "I need an electrician in G-13",
        "Mujhe plumber chahiye DHA mein",
        "AC repair urgent in Gulshan",
        "Carpenter needed tomorrow in F-10"
    ]
    
    for test in test_cases:
        result = parse_intent_fallback(test)
        print(f"\nInput: {test}")
        print(f"Output: {result['parsed']}")
