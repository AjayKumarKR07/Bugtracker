import asyncio
import selectors
from app.database.session import AsyncSessionLocal
from app.services import sprint_service

async def test():
    async with AsyncSessionLocal() as db:
        for sid in [780, 779]:
            s = await sprint_service.get_sprint_by_id(db, sid)
            from app.schemas.sprint import SprintRead
            sr = SprintRead.model_validate(s)
            print(f"\n================ Sprint {sr.id}: '{sr.name}' [{sr.status.value}] ================")
            print(f"Project: {sr.project_name} ({sr.project_id}), Key: {sr.project_key}")
            print(f"SprintRead: total={sr.total_issues}, completed={sr.completed_issues}, remaining={sr.remaining_issues}, pct={sr.progress_percentage}%")
            
            a = await sprint_service.get_sprint_analytics(db, sr.id)
            print(f"Analytics:  total={a.total_issues}, completed={a.completed_issues}, remaining={a.remaining_issues}, rate={a.completion_rate}%")
            print(f"Burndown points: {len(a.burndown_points)}")
            if a.burndown_points:
                print(f"  First: {a.burndown_points[0]}")
                print(f"  Last:  {a.burndown_points[-1]}")
            print(f"Workload members ({len(a.workload)}):")
            for w in a.workload:
                print(f"  {w['developer_name']} ({w['role']}): assigned={w['assigned_issues']}, effort={w['estimated_effort']}, completed={w['completed_issues']}, remaining={w['remaining_issues']}, pct={w['workload_percentage']}%")

loop = asyncio.SelectorEventLoop(selectors.SelectSelector())
loop.run_until_complete(test())
loop.close()
