import asyncio
from sqlalchemy import text
from app.database.connection import engine

async def check():
    async with engine.connect() as conn:
        res = await conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """))
        tables = [r[0] for r in res.fetchall()]
        print("Tables:", tables)
        for t in tables:
            cols = await conn.execute(text(f"""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '{t}';
            """))
            print(f"--- {t} ---")
            for c in cols.fetchall():
                print(f"  {c[0]} ({c[1]})")

asyncio.run(check())
