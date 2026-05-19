import os
from openai import AsyncOpenAI
from agents import Agent, Runner
from agents.models.openai_chatcompletions import OpenAIChatCompletionsModel
from dotenv import load_dotenv

load_dotenv(override=True)

# Gemini via OpenAI-compatible endpoint
gemini_client = AsyncOpenAI(
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

gemini_model = OpenAIChatCompletionsModel(
    model="gemini-2.5-flash",
    openai_client=gemini_client
)
