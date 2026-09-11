import asyncio
import selectors
from sqlalchemy import select, func
from app.database.session import AsyncSessionLocal
from app.models.issue import Issue
from app.models.project import Project

async def check():
    async with AsyncSessionLocal() as db:
        for pid in [4810, 4745, 4308]:
            p = await db.get(Project, pid)
            res = await db.execute(select(func.count(Issue.id)).where(Issue.project_id == pid))
            cnt = res.scalar_one()
            print(f"Project {pid} ({p.name if p else 'None'}): {cnt} issues in DB")

loop = asyncio.SelectorEventLoop(selectors.SelectSelector())
loop.run_until_complete(check())
loop.close()
