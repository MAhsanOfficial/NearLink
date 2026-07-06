"""
Safe, non-destructive migration script to add missing columns in PostgreSQL.
"""
import os
import sys
import asyncio

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, Base
from sqlalchemy import text, inspect
import models  # import models to register them on Base

async def migrate_columns():
    print("Starting column migration...")
    
    # Get database columns dynamically using inspector
    def get_columns(conn):
        inspector = inspect(conn)
        return {
            table_name: [c['name'] for c in inspector.get_columns(table_name)]
            for table_name in inspector.get_table_names()
        }

    async with engine.begin() as conn:
        db_tables = await conn.run_sync(get_columns)
        
        # Go through each model table in declarative base metadata
        for table_name, table_obj in Base.metadata.tables.items():
            if table_name not in db_tables:
                print(f"Table {table_name} does not exist in DB, skipping (re-run DB init)")
                continue
                
            existing_cols = db_tables[table_name]
            for col_name, col_obj in table_obj.columns.items():
                if col_name not in existing_cols:
                    # Map SQLAlchemy types to PostgreSQL types
                    sql_type = str(col_obj.type)
                    if "VARCHAR" in sql_type:
                        pg_type = "VARCHAR"
                    elif "FLOAT" in sql_type or "DOUBLE" in sql_type:
                        pg_type = "DOUBLE PRECISION"
                    elif "INTEGER" in sql_type:
                        pg_type = "INTEGER"
                    elif "BOOLEAN" in sql_type:
                        pg_type = "BOOLEAN"
                    elif "TEXT" in sql_type:
                        pg_type = "TEXT"
                    elif "TIMESTAMP" in sql_type:
                        pg_type = "TIMESTAMP WITHOUT TIME ZONE"
                    elif "JSON" in sql_type:
                        pg_type = "JSON"
                    else:
                        pg_type = sql_type
                        
                    default_clause = ""
                    if col_obj.default is not None:
                        if hasattr(col_obj.default, 'arg') and not callable(col_obj.default.arg):
                            default_val = col_obj.default.arg
                            if isinstance(default_val, bool):
                                default_clause = f" DEFAULT {str(default_val).upper()}"
                            elif isinstance(default_val, (int, float)):
                                default_clause = f" DEFAULT {default_val}"
                            elif isinstance(default_val, str):
                                default_clause = f" DEFAULT '{default_val}'"
                    
                    alter_stmt = f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {col_name} {pg_type}{default_clause};"
                    print(f"Adding column: {table_name}.{col_name} ({pg_type}{default_clause})")
                    try:
                        await conn.execute(text(alter_stmt))
                        print(f"  [SUCCESS] Added")
                    except Exception as err:
                        print(f"  [ERROR] Failed to add {col_name}: {err}")
                        
    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate_columns())
