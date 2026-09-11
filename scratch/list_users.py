import asyncio
import selectors
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User, UserRole

async def list_users():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.is_active == True).order_by(User.id))
        users = res.scalars().all()
        print(f"Total active users: {len(users)}")
        for u in users:
            print(f"  ID: {u.id}, Name: {u.full_name}, Email: {u.email}, Role: {u.role.value}")

loop = asyncio.SelectorEventLoop(selectors.SelectSelector())
loop.run_until_complete(list_users())
loop.close()
