import os
from openai import AsyncOpenAI
from agents import Agent, Runner
from agents.models.openai_chatcompletions import OpenAIChatCompletionsModel
from dotenv import load_dotenv

load_dotenv(override=True)

# Gemini via OpenAI-compatible endpoint
gemini_client = AsyncOpenAI(
    api_key=os.getenv("GEMINI_API_KEY") or "missing-key",  # placeholder keeps imports working offline/tests
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

gemini_model = OpenAIChatCompletionsModel(
    model="gemini-2.5-flash",
    openai_client=gemini_client
)

# We talk to Gemini, not OpenAI: don't try to export SDK traces to the OpenAI platform.
# (Our own AgentTrace table + SSE stream is the source of truth for decision traces.)
from agents import set_tracing_disabled
set_tracing_disabled(True)
