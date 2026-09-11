import asyncio
import selectors
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.issue import Issue
from app.models.sprint import Sprint

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Issue).where(Issue.sprint_id == 780))
        for iss in res.scalars().all():
            print(f"780 Issue: ID={iss.id}, key={iss.issue_key}, status={iss.status.value}, assignee={iss.assignee_id}")
        
        res = await db.execute(select(Issue).where(Issue.sprint_id == 779))
        for iss in res.scalars().all():
            print(f"779 Issue: ID={iss.id}, key={iss.issue_key}, status={iss.status.value}, assignee={iss.assignee_id}")

loop = asyncio.SelectorEventLoop(selectors.SelectSelector())
loop.run_until_complete(check())
loop.close()
