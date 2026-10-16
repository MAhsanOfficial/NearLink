"""Localized message templates (english / roman_urdu / urdu) for notifications and chat replies.

Deterministic on purpose: a booking confirmation or reminder must never depend on an LLM being up.
"""

LANGS = ("english", "roman_urdu", "urdu")


def norm_lang(lang) -> str:
    lang = (lang or "english").lower().replace(" ", "_").replace("-", "_")
    if lang in ("urdu", "ur"):
        return "urdu"
    if lang in ("roman_urdu", "romanurdu", "roman", "hinglish"):
        return "roman_urdu"
    return "english"


T = {
    "booking_confirmed": {
        "english": "✅ Booked! {provider} ({service}) will come on {when}.",
        "roman_urdu": "✅ Booking ho gayi! {provider} ({service}) {when} ko aayenge.",
        "urdu": "✅ بکنگ ہو گئی! {provider} ({service}) {when} کو آئیں گے۔",
    },
    "provider_assigned": {
        "english": "🔧 {provider} has been assigned to your request and is preparing for the job.",
        "roman_urdu": "🔧 {provider} ko aap ki request assign ho gayi hai, woh tayyari kar rahe hain.",
        "urdu": "🔧 {provider} کو آپ کی درخواست مل گئی ہے اور وہ تیاری کر رہے ہیں۔",
    },
    "reminder": {
        "english": "⏰ Reminder: {provider} arrives for your {service} at {when} (in about 1 hour).",
        "roman_urdu": "⏰ Yaad dahani: {provider} aap ki {service} ke liye {when} par pohanchenge (taqreeban 1 ghanta baqi).",
        "urdu": "⏰ یاد دہانی: {provider} آپ کی {service} کے لیے {when} پر پہنچیں گے (تقریباً ایک گھنٹہ باقی)۔",
    },
    "completion": {
        "english": "🎉 Was your {service} job with {provider} completed? Please rate your experience!",
        "roman_urdu": "🎉 Kya {provider} ke saath aap ka {service} ka kaam mukammal hua? Meherbani kar ke rating dein!",
        "urdu": "🎉 کیا {provider} کے ساتھ آپ کا {service} کا کام مکمل ہو گیا؟ براہ کرم ریٹنگ دیں!",
    },
    "rebooked": {
        "english": "🔁 {old} had to cancel. We automatically rebooked you with {provider} ({service}) on {when}.",
        "roman_urdu": "🔁 {old} ne cancel kar diya. Hum ne khud aap ko {provider} ({service}) ke saath {when} ke liye rebook kar diya.",
        "urdu": "🔁 {old} نے منسوخ کر دیا۔ ہم نے خود بخود آپ کو {provider} ({service}) کے ساتھ {when} کے لیے دوبارہ بک کر دیا۔",
    },
    "cancelled_no_alternative": {
        "english": "⚠️ {old} had to cancel and we could not find another available {service} nearby. Please send a new request.",
        "roman_urdu": "⚠️ {old} ne cancel kar diya aur qareeb koi aur {service} available nahi mila. Nayi request bhejein.",
        "urdu": "⚠️ {old} نے منسوخ کر دیا اور قریب کوئی دوسرا {service} دستیاب نہیں ملا۔ براہ کرم نئی درخواست بھیجیں۔",
    },
    "reply_booked": {
        "english": "✅ Booked: {provider} ({distance}) for {service}.\n🕒 {when}\n📞 {phone}\n💡 {reason}\n⏰ Reminder will be sent 1 hour before.",
        "roman_urdu": "✅ Booking: {provider} ({distance}) — {service}.\n🕒 {when}\n📞 {phone}\n💡 {reason}\n⏰ 1 ghanta pehle reminder aa jayega.",
        "urdu": "✅ بکنگ: {provider} ({distance}) — {service}۔\n🕒 {when}\n📞 {phone}\n💡 {reason}\n⏰ ایک گھنٹہ پہلے یاد دہانی آ جائے گی۔",
    },
    "reply_login": {
        "english": "Best match: {provider} ({distance}) at {when}. Please sign in to confirm the booking.",
        "roman_urdu": "Behtareen option: {provider} ({distance}), {when}. Booking confirm karne ke liye login karein.",
        "urdu": "بہترین آپشن: {provider} ({distance})، {when}۔ بکنگ کنفرم کرنے کے لیے لاگ ان کریں۔",
    },
    "reply_none": {
        "english": "Sorry, I couldn't find an available {service} near {location} for that time. Try a different time or area.",
        "roman_urdu": "Maaf kijiye, {location} ke qareeb us waqt koi {service} available nahi mila. Doosra waqt ya ilaqa try karein.",
        "urdu": "معذرت، {location} کے قریب اس وقت کوئی {service} دستیاب نہیں ملا۔ کوئی دوسرا وقت یا علاقہ آزمائیں۔",
    },
    "ask_location": {
        "english": "Which area or sector do you need the {service} in? (e.g. G-13, DHA Phase 2)",
        "roman_urdu": "Aap ko {service} kis area ya sector mein chahiye? (jaise G-13, DHA Phase 2)",
        "urdu": "آپ کو {service} کس علاقے یا سیکٹر میں چاہیے؟ (مثلاً G-13، DHA فیز 2)",
    },
    "ask_service": {
        "english": "What kind of service do you need? (plumber, electrician, AC technician, carpenter...)",
        "roman_urdu": "Aap ko kaunsi service chahiye? (plumber, electrician, AC technician, carpenter...)",
        "urdu": "آپ کو کون سی سروس چاہیے؟ (پلمبر، الیکٹریشن، اے سی ٹیکنیشن، کارپینٹر...)",
    },
}


def msg(key: str, lang, **kw) -> str:
    return T[key][norm_lang(lang)].format(**kw)
