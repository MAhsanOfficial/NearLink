"""
Add location fields to users table for customers
"""
import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    """Add location columns to users table"""
    
    async with engine.begin() as conn:
        print("Adding location fields to users table...")
        
        # Add area column
        try:
            await conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS area VARCHAR
            """))
            print("✅ Added 'area' column")
        except Exception as e:
            print(f"⚠️  'area' column: {e}")
        
        # Add address column
        try:
            await conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS address TEXT
            """))
            print("✅ Added 'address' column")
        except Exception as e:
            print(f"⚠️  'address' column: {e}")
        
        # Add latitude column
        try:
            await conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS latitude FLOAT
            """))
            print("✅ Added 'latitude' column")
        except Exception as e:
            print(f"⚠️  'latitude' column: {e}")
        
        # Add longitude column
        try:
            await conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS longitude FLOAT
            """))
            print("✅ Added 'longitude' column")
        except Exception as e:
            print(f"⚠️  'longitude' column: {e}")
    
    print("\n✅ Migration completed!")
    print("Customers can now register with their location.")

if __name__ == "__main__":
    asyncio.run(migrate())
