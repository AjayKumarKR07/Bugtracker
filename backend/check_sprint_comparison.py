import asyncio, json
import httpx
from app.database.session import AsyncSessionLocal
from app.models.sprint import Sprint
from app.models.issue import Issue
from sqlalchemy import select

async def main():
    sprint_id = 883
    project_id = 4752
    
    # 1. PostgreSQL Direct Query
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Sprint).filter(Sprint.id == sprint_id))
        s = res.scalar_one_or_none()
        i_res = await db.execute(select(Issue).filter(Issue.sprint_id == sprint_id))
        issues = i_res.scalars().all()
        
        db_total_issues = len(issues)
        db_completed_issues = len([i for i in issues if i.status in ('RESOLVED', 'CLOSED')])
        db_remaining_issues = db_total_issues - db_completed_issues
        db_progress_pct = round((db_completed_issues / db_total_issues) * 100) if db_total_issues > 0 else 0
        db_velocity = sum([i.estimated_effort or 0 for i in issues if i.status in ('RESOLVED', 'CLOSED')])
        
        print("=== 1. POSTGRESQL ===")
        print(f"Sprint ID: {s.id}, Name: {s.name}, Status: {s.status}")
        print(f"DB total issues: {db_total_issues}")
        print(f"DB completed issues: {db_completed_issues}")
        print(f"DB remaining issues: {db_remaining_issues}")
        print(f"DB progress %: {db_progress_pct}%")
        print(f"DB estimated team members: {s.estimated_team_members}")

    # Login to get token
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        login_res = await client.post("/auth/login", json={"email": "ajaykumarkr07@gmail.com", "password": "Ajay@1234"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. GET /sprints/{id}
        res_sprint = await client.get(f"/sprints/{sprint_id}", headers=headers)
        sprint_data = res_sprint.json()
        print("\n=== 2. GET /sprints/{id} ===")
        print(f"API total issues: {sprint_data.get('total_issues')}")
        print(f"API completed issues: {sprint_data.get('completed_issues')}")
        print(f"API remaining issues: {sprint_data.get('remaining_issues')}")
        print(f"API progress %: {sprint_data.get('progress_percentage')}%")
        print(f"API velocity: {sprint_data.get('velocity')} pts")
        print(f"API burndown points: {len(sprint_data.get('burndown_data') or [])}")
        print(f"API workload members: {len(sprint_data.get('workload_distribution') or [])}")
        print(f"API issues: {len(sprint_data.get('issues') or [])}")

        # 3. GET /projects/{project_id}/sprints
        res_proj_sprints = await client.get(f"/projects/{project_id}/sprints", headers=headers)
        proj_sprints = res_proj_sprints.json()
        matched = next((sp for sp in proj_sprints if sp["id"] == sprint_id), None)
        print("\n=== 3. GET /projects/{project_id}/sprints ===")
        if matched:
            print(f"API (project list) total issues: {matched.get('total_issues')}")
            print(f"API (project list) completed issues: {matched.get('completed_issues')}")
            print(f"API (project list) remaining issues: {matched.get('remaining_issues')}")
            print(f"API (project list) progress %: {matched.get('progress_percentage')}%")
            print(f"API (project list) velocity: {matched.get('velocity')} pts")
            print(f"API (project list) burndown points: {len(matched.get('burndown_data') or [])}")
            print(f"API (project list) workload members: {len(matched.get('workload_distribution') or [])}")
            print(f"API (project list) issues: {len(matched.get('issues') or [])}")
        else:
            print("Not found in project sprints list!")

if __name__ == "__main__":
    asyncio.run(main())
