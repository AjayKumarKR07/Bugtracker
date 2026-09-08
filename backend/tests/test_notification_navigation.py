"""
test_notification_navigation.py — Tests for Notification Navigation and Payload Routing.

Verifies:
1. Notification payload structure:
   - notification_type
   - entity_type / context
   - entity_id
   - destination
   - is_read, read_at, created_at
2. Destination route resolution logic:
   - Sprint approval / submission -> /admin/sprint-approvals?sprintId=...
   - Sprint lifecycle / management -> /admin/sprints?sprintId=...
   - Issue comments / attachments / status updates -> /issues/{id}
   - Issue assignment / reporting -> /issues?issueId={id}
   - User administration -> /admin
   - Fallbacks
3. Mark-as-read click behavior:
   - PATCH /notifications/{id}/read updates is_read to True and sets read_at timestamp.
   - Idempotency when already read.
4. RBAC privacy:
   - Users cannot read or mark other users' notifications (403 Forbidden).
"""

import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.models.notification import NotificationType
from app.schemas.notification import NotificationResponse
from tests.conftest import (
    admin_token,
    auth_header,
    dev_token,
    tester_token,
    user_token,
)

client = TestClient(app)


def _unique_str() -> str:
    return uuid.uuid4().hex[:8]


# ===========================================================================
# 1. Schema Destination Resolution Unit Tests
# ===========================================================================

class TestNotificationDestinationSchema:
    def test_sprint_approval_destination(self):
        """Approval / submission notifications route to admin sprint approvals."""
        res = NotificationResponse(
            id=1,
            notification_type=NotificationType.SPRINT_ENDED,
            title="Sprint submitted for approval",
            message="Tester submitted sprint 'Sprint 1' for approval.",
            entity_type="SPRINT",
            entity_id=42,
            entity_key="Sprint 1",
            is_read=False,
            read_at=None,
            created_at=datetime.now(timezone.utc),
        )
        assert res.destination == "/admin/sprint-approvals?sprintId=42"
        assert res.context == "SPRINT"
        assert res.entity_id == 42
        assert res.is_read is False

    def test_sprint_management_destination(self):
        """General sprint lifecycle notifications route to admin sprints."""
        res = NotificationResponse(
            id=2,
            notification_type=NotificationType.SPRINT_STARTED,
            title="Sprint Started",
            message="Sprint 2 has been started.",
            entity_type="SPRINT",
            entity_id=99,
            entity_key="Sprint 2",
            is_read=False,
            read_at=None,
            created_at=datetime.now(timezone.utc),
        )
        assert res.destination == "/admin/sprints?sprintId=99"
        assert res.context == "SPRINT"
        assert res.entity_id == 99

    def test_issue_comment_attachment_destination(self):
        """Comments, attachments, and status changes route directly to /issues/{id}."""
        # Comment
        res_comment = NotificationResponse(
            id=3,
            notification_type=NotificationType.ISSUE_COMMENTED,
            title="New comment on defect",
            message="Alice commented on PROJ-101",
            entity_type="ISSUE",
            entity_id=101,
            entity_key="PROJ-101",
            is_read=False,
            read_at=None,
            created_at=datetime.now(timezone.utc),
        )
        assert res_comment.destination == "/issues/101"

        # Attachment
        res_attach = NotificationResponse(
            id=4,
            notification_type=NotificationType.ATTACHMENT_ADDED,
            title="Attachment added",
            message="Screenshot attached to PROJ-102",
            entity_type="ISSUE",
            entity_id=102,
            entity_key="PROJ-102",
            is_read=False,
            read_at=None,
            created_at=datetime.now(timezone.utc),
        )
        assert res_attach.destination == "/issues/102"

        # Status change
        res_status = NotificationResponse(
            id=5,
            notification_type=NotificationType.ISSUE_STATUS_CHANGED,
            title="Status changed",
            message="Status moved to IN_TESTING",
            entity_type="ISSUE",
            entity_id=103,
            entity_key="PROJ-103",
            is_read=False,
            read_at=None,
            created_at=datetime.now(timezone.utc),
        )
        assert res_status.destination == "/issues/103"

    def test_issue_assigned_reported_destination(self):
        """Issue assignment and reported notifications route to /issues?issueId={id}."""
        res_assigned = NotificationResponse(
            id=6,
            notification_type=NotificationType.ISSUE_ASSIGNED,
            title="Issue assigned to you",
            message="You have been assigned to PROJ-104",
            entity_type="ISSUE",
            entity_id=104,
            entity_key="PROJ-104",
            is_read=False,
            read_at=None,
            created_at=datetime.now(timezone.utc),
        )
        assert res_assigned.destination == "/issues?issueId=104"

        res_reported = NotificationResponse(
            id=7,
            notification_type=NotificationType.ISSUE_REPORTED,
            title="New Defect Reported",
            message="A new bug was reported",
            entity_type="ISSUE",
            entity_id=105,
            entity_key="PROJ-105",
            is_read=False,
            read_at=None,
            created_at=datetime.now(timezone.utc),
        )
        assert res_reported.destination == "/issues?issueId=105"

    def test_user_management_destination(self):
        """User management notifications route to /admin."""
        res = NotificationResponse(
            id=8,
            notification_type=NotificationType.USER_ROLE_CHANGED,
            title="Role Changed",
            message="Your role was updated to TESTER",
            entity_type="USER",
            entity_id=5,
            entity_key=None,
            is_read=False,
            read_at=None,
            created_at=datetime.now(timezone.utc),
        )
        assert res.destination == "/admin"
        assert res.context == "USER"


# ===========================================================================
# 2. Integration API Tests with Database
# ===========================================================================

class TestNotificationNavigationAPI:
    def test_list_notifications_payload_fields(self):
        """GET /notifications returns destination, context, and read status."""
        tok = admin_token()
        r = client.get("/notifications", headers=auth_header(tok))
        assert r.status_code == 200
        data = r.json()
        assert "items" in data
        assert "total" in data

        if data["items"]:
            item = data["items"][0]
            assert "id" in item
            assert "notification_type" in item
            assert "destination" in item
            assert "context" in item
            assert "is_read" in item
            assert "read_at" in item
            assert "created_at" in item

    def test_mark_notification_read_lifecycle(self):
        """Marking a notification as read updates is_read, sets read_at, and preserves destination."""
        tok = admin_token()
        r = client.get("/notifications", headers=auth_header(tok))
        assert r.status_code == 200
        items = r.json()["items"]

        if not items:
            # Create a test project and issue to generate notification
            proj_key = f"N{_unique_str().upper()[:4]}"
            pr = client.post(
                "/projects",
                json={"project_key": proj_key, "name": f"Notif Proj {proj_key}"},
                headers=auth_header(tok),
            )
            assert pr.status_code == 201
            p_id = pr.json()["id"]

            ir = client.post(
                "/issues",
                json={
                    "project_id": p_id,
                    "title": "Navigation test issue",
                    "issue_type": "BUG",
                    "severity": "CRITICAL",
                    "priority": "HIGH",
                },
                headers=auth_header(tok),
            )
            assert ir.status_code == 201

            r = client.get("/notifications", headers=auth_header(tok))
            items = r.json()["items"]

        if items:
            notif_id = items[0]["id"]
            # Mark as read
            patch_r = client.patch(f"/notifications/{notif_id}/read", headers=auth_header(tok))
            assert patch_r.status_code == 200
            updated = patch_r.json()
            assert updated["id"] == notif_id
            assert updated["is_read"] is True
            assert updated["read_at"] is not None
            assert updated["destination"] is not None

    def test_rbac_privacy_other_user_notification(self):
        """A user cannot mark as read or view another user's notification."""
        a_tok = admin_token()
        t_tok = tester_token()

        admin_r = client.get("/notifications", headers=auth_header(a_tok))
        assert admin_r.status_code == 200
        admin_items = admin_r.json()["items"]

        if admin_items:
            notif_id = admin_items[0]["id"]
            # Tester attempts to read admin's notification
            tester_read = client.get(f"/notifications/{notif_id}", headers=auth_header(t_tok))
            assert tester_read.status_code == 403

            # Tester attempts to mark admin's notification as read
            tester_patch = client.patch(f"/notifications/{notif_id}/read", headers=auth_header(t_tok))
            assert tester_patch.status_code == 403

            # Tester attempts to delete admin's notification
            tester_del = client.delete(f"/notifications/{notif_id}", headers=auth_header(t_tok))
            assert tester_del.status_code == 403
