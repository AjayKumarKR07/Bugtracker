from fastapi.testclient import TestClient
from app.main import app
from tests.conftest import admin_token, get_token, auth_header

client = TestClient(app)
adm_h = auth_header(admin_token())
tester_h = auth_header(get_token("tester"))
tester2_h = auth_header(get_token("tester2"))
tester3_h = auth_header(get_token("tester3"))

# 1. In Sprint 780:
# Reassign 13690 to tester (873) and resolve
client.patch("/issues/13690/assign", json={"developer_id": 873}, headers=adm_h)
r1 = client.patch("/issues/13690/resolve", json={"resolution_summary": "Resolved after in-depth regression test."}, headers=tester_h)
print("Resolved 13690:", r1.status_code)

# Reassign 13691 to tester2 (874) and resolve
client.patch("/issues/13691/assign", json={"developer_id": 874}, headers=adm_h)
r2 = client.patch("/issues/13691/resolve", json={"resolution_summary": "Resolved after in-depth regression test."}, headers=tester2_h)
print("Resolved 13691:", r2.status_code)

# 2. In Sprint 779:
# Add 1 more issue to reach exactly 8 issues
iss_payload = {
    "title": "Add localized strings for error dialogs",
    "description": "Ensure error messages are localized for international users.",
    "project_id": 4745,
    "issue_type": "BUG",
    "severity": "MINOR",
    "priority": "LOW",
    "estimated_effort": 5,
}
r_iss = client.post("/issues", json=iss_payload, headers=adm_h)
assert r_iss.status_code in (200, 201), r_iss.text
iss_id = r_iss.json()["id"]

client.post(f"/sprints/779/issues/{iss_id}", headers=adm_h)
client.patch(f"/issues/{iss_id}/assign", json={"developer_id": 875}, headers=adm_h)
client.patch(f"/issues/{iss_id}/status", json={"status": "IN_DEVELOPMENT"}, headers=tester3_h)
print("Created and assigned 8th issue for 779:", iss_id)

print("Done!")
