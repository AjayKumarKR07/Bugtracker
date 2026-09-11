import asyncio
import selectors
from app.database.session import AsyncSessionLocal
from app.services import sprint_service

async def test():
    async with AsyncSessionLocal() as db:
        sprints = await sprint_service.get_all_sprints(db)
        for s in sprints:
            print(f"\n================ Sprint {s.id}: '{s.name}' [{s.status.value}] ================")
            print(f"Project: {s.project_name} ({s.project_id}), Key: {s.project_key}")
            print(f"SprintRead: total={s.total_issues}, completed={s.completed_issues}, remaining={s.remaining_issues}, pct={s.progress_percentage}%")
            
            a = await sprint_service.get_sprint_analytics(db, s.id)
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
