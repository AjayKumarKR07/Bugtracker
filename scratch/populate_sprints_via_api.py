import sys
from fastapi.testclient import TestClient
from app.main import app
from tests.conftest import admin_token, get_token, auth_header, _ci_email

client = TestClient(app)
adm_h = auth_header(admin_token())

# 5 designated team members with login tokens
tags = ["tester", "tester2", "tester3", "tester4", "dev"]
member_info = []

for tag in tags:
    tok = get_token(tag)
    r = client.get("/auth/me", headers=auth_header(tok))
    assert r.status_code == 200, f"Failed /auth/me for {tag}: {r.text}"
    user_data = r.json()
    uid = user_data["id"]
    uname = user_data["full_name"]
    member_info.append({
        "tag": tag,
        "id": uid,
        "name": uname,
        "token": tok,
        "header": auth_header(tok),
    })

print(f"Loaded {len(member_info)} team members with valid auth tokens:")
for m in member_info:
    print(f"  ID {m['id']}: {m['name']} ({m['tag']})")

# 1. Populate Sprint 780 (Project 4810, COMPLETED sprint)
print("\n--- Populating Sprint 780 (Project 4810, COMPLETED) ---")
curr_issues_780 = client.get("/issues?sprint_id=780&page_size=100", headers=adm_h).json().get("items", [])
print(f"Current issues in Sprint 780: {len(curr_issues_780)}")

# For any existing issues in 780:
for idx, iss in enumerate(curr_issues_780):
    m = member_info[idx % len(member_info)]
    if not iss.get("assignee_id"):
        client.patch(f"/issues/{iss['id']}/assign", json={"developer_id": m["id"]}, headers=adm_h)
    if iss.get("status") not in ("RESOLVED", "CLOSED"):
        for st in ["IN_DEVELOPMENT", "IN_REVIEW", "IN_TESTING"]:
            client.patch(f"/issues/{iss['id']}/status", json={"status": st}, headers=m["header"])
        client.patch(f"/issues/{iss['id']}/resolve", json={"resolution_summary": "Defect verified, tested, and resolved."}, headers=m["header"])

needed_780 = 8 - len(curr_issues_780)
issue_titles_780 = [
    ("Fix persistent memory leak in session manager", "CRITICAL", "HIGH", 5),
    ("Resolve deadlock on concurrent transaction commits", "CRITICAL", "HIGH", 8),
    ("Handle null pointer exception on missing payload header", "MAJOR", "HIGH", 5),
    ("Fix unhandled rejection in WebSocket event listener", "MAJOR", "MEDIUM", 3),
    ("Address race condition during cache invalidation", "MAJOR", "MEDIUM", 5),
    ("Resolve schema validation error on sprint creation", "MINOR", "MEDIUM", 3),
    ("Fix timezone offset mismatch in burndown calculation", "MINOR", "LOW", 3),
    ("Correct pagination metadata count on issue list", "LOW", "LOW", 5),
]

for idx in range(needed_780):
    title, sev, prio, eff = issue_titles_780[idx % len(issue_titles_780)]
    iss_payload = {
        "title": title,
        "description": f"Detailed defect description for sprint verification item {idx+1}.",
        "project_id": 4810,
        "issue_type": "BUG",
        "severity": sev,
        "priority": prio,
        "estimated_effort": eff,
    }
    r_iss = client.post("/issues", json=iss_payload, headers=adm_h)
    assert r_iss.status_code in (200, 201), f"Failed to create issue: {r_iss.text}"
    issue_data = r_iss.json()
    issue_id = issue_data["id"]
    issue_key = issue_data["issue_key"]

    r_add = client.post(f"/sprints/780/issues/{issue_id}", headers=adm_h)
    assert r_add.status_code in (200, 201), f"Failed to add issue to sprint: {r_add.text}"

    m = member_info[(len(curr_issues_780) + idx) % len(member_info)]
    r_asgn = client.patch(f"/issues/{issue_id}/assign", json={"developer_id": m["id"]}, headers=adm_h)
    assert r_asgn.status_code in (200, 204), f"Failed to assign issue: {r_asgn.text}"

    for st in ["IN_DEVELOPMENT", "IN_REVIEW", "IN_TESTING"]:
        r_st = client.patch(f"/issues/{issue_id}/status", json={"status": st}, headers=m["header"])
        assert r_st.status_code in (200, 204), f"Failed to update status to {st}: {r_st.text}"
    
    r_res = client.patch(f"/issues/{issue_id}/resolve", json={"resolution_summary": "Defect verified, tested, and resolved."}, headers=m["header"])
    assert r_res.status_code in (200, 204), f"Failed to resolve issue: {r_res.text}"
    print(f"  Created & Resolved {issue_key} (ID {issue_id}) assigned to member {m['name']} ({m['id']})")

# 2. Populate Sprint 779 (Project 4745, IN_PROGRESS sprint)
print("\n--- Populating Sprint 779 (Project 4745, IN_PROGRESS) ---")
curr_issues_779 = client.get("/issues?sprint_id=779&page_size=100", headers=adm_h).json().get("items", [])
print(f"Current issues in Sprint 779: {len(curr_issues_779)}")

needed_779 = 8 - len(curr_issues_779)
issue_titles_779 = [
    ("Network timeout retry logic failure in client", "CRITICAL", "HIGH", 8),
    ("Token expiration refresh handler bug", "MAJOR", "HIGH", 5),
    ("CSS layout distortion on tablet viewports", "MINOR", "MEDIUM", 3),
    ("Missing validation on email input field", "MINOR", "LOW", 2),
    ("Optimize database index for audit log queries", "MAJOR", "HIGH", 5),
    ("Export CSV button unresponsive during export", "MINOR", "MEDIUM", 5),
    ("Refactor notification badge state sync", "MINOR", "LOW", 3),
    ("Add localized strings for error dialogs", "LOW", "LOW", 5),
]

for idx in range(needed_779):
    title, sev, prio, eff = issue_titles_779[idx % len(issue_titles_779)]
    iss_payload = {
        "title": title,
        "description": f"Detailed defect description for sprint verification item {idx+1}.",
        "project_id": 4745,
        "issue_type": "BUG",
        "severity": sev,
        "priority": prio,
        "estimated_effort": eff,
    }
    r_iss = client.post("/issues", json=iss_payload, headers=adm_h)
    assert r_iss.status_code in (200, 201), f"Failed to create issue: {r_iss.text}"
    issue_data = r_iss.json()
    issue_id = issue_data["id"]
    issue_key = issue_data["issue_key"]

    r_add = client.post(f"/sprints/779/issues/{issue_id}", headers=adm_h)
    assert r_add.status_code in (200, 201), f"Failed to add issue to sprint: {r_add.text}"

    m = member_info[(len(curr_issues_779) + idx) % len(member_info)]
    r_asgn = client.patch(f"/issues/{issue_id}/assign", json={"developer_id": m["id"]}, headers=adm_h)
    assert r_asgn.status_code in (200, 204), f"Failed to assign issue: {r_asgn.text}"

    # For 779 (IN_PROGRESS), resolve the first 2 issues, leave others in progress / assigned
    if idx < 2:
        for st in ["IN_DEVELOPMENT", "IN_REVIEW", "IN_TESTING"]:
            client.patch(f"/issues/{issue_id}/status", json={"status": st}, headers=m["header"])
        r_res = client.patch(f"/issues/{issue_id}/resolve", json={"resolution_summary": "Resolved during sprint execution."}, headers=m["header"])
        assert r_res.status_code in (200, 204), f"Failed to resolve: {r_res.text}"
        print(f"  Created & Resolved {issue_key} (ID {issue_id}) assigned to member {m['name']} ({m['id']})")
    elif idx < 5:
        client.patch(f"/issues/{issue_id}/status", json={"status": "IN_DEVELOPMENT"}, headers=m["header"])
        print(f"  Created & Set IN_DEVELOPMENT {issue_key} (ID {issue_id}) assigned to member {m['name']} ({m['id']})")
    else:
        print(f"  Created & Assigned {issue_key} (ID {issue_id}) assigned to member {m['name']} ({m['id']})")

print("\nAll sprints successfully populated via real API workflow!")
