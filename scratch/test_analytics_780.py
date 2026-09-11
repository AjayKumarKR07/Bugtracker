import asyncio
import selectors
from app.database.session import AsyncSessionLocal
from app.services import sprint_service

async def test():
    async with AsyncSessionLocal() as db:
        for sid in [780, 779]:
            print(f"\n================ Sprint {sid} ================")
            a = await sprint_service.get_sprint_analytics(db, sid)
            print(f"Total: {a.total_issues}, Completed: {a.completed_issues}, Remaining: {a.remaining_issues}")
            print(f"Rate: {a.completion_rate}%, Health: {a.sprint_health}")
            print(f"Burndown points count: {len(a.burndown_points)}")
            if a.burndown_points:
                print(f"  First: {a.burndown_points[0]}")
                print(f"  Last: {a.burndown_points[-1]}")
            print(f"Workload count: {len(a.workload)}")
            for w in a.workload:
                print(f"  {w['developer_name']} ({w['role']}): assigned={w['assigned_issues']}, effort={w['estimated_effort']}, completed={w['completed_issues']}, remaining={w['remaining_issues']}, pct={w['workload_percentage']}%")

loop = asyncio.SelectorEventLoop(selectors.SelectSelector())
loop.run_until_complete(test())
loop.close()
