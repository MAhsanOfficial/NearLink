import asyncio
from sqlalchemy import delete
from database import async_session
from models import ExternalProvider

async def clear_external():
    async with async_session() as db:
        await db.execute(delete(ExternalProvider))
        await db.commit()
        print("✅ Cleared all external providers")
        print("🌍 Now Google Places will fetch fresh REAL data!")

asyncio.run(clear_external())
