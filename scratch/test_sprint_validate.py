import asyncio
import selectors
import traceback
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database.session import AsyncSessionLocal
from app.models.sprint import Sprint
from app.models.issue import Issue
from app.schemas.sprint import SprintRead

async def test():
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(Sprint)
            .options(
                selectinload(Sprint.assigned_tester),
                selectinload(Sprint.submitted_by),
                selectinload(Sprint.approved_by),
                selectinload(Sprint.project),
                selectinload(Sprint.issues).selectinload(Issue.assignee),
            )
            .where(Sprint.id == 630)
        )
        s = res.scalar_one_or_none()
        print("Sprint 630:", s)
        print("s.issues:", len(s.issues) if s and s.issues else "None")
        if s:
            for iss in s.issues:
                print(f"  Issue: {iss.id}, status={iss.status}, effort={iss.estimated_effort}, assignee={iss.assignee_id}")
        
        sr = SprintRead.model_validate(s)
        print("SprintRead:")
        print("  total_issues:", sr.total_issues)
        print("  completed_issues:", sr.completed_issues)
        print("  progress_percentage:", sr.progress_percentage)
        print("  total_estimated_effort:", sr.total_estimated_effort)
        print("  completed_estimated_effort:", sr.completed_estimated_effort)

loop = asyncio.SelectorEventLoop(selectors.SelectSelector())
loop.run_until_complete(test())
loop.close()
