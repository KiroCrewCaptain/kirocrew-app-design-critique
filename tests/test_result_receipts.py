"""Completed reports are immutable Owner receipts, never render-job results."""

import hashlib
import json
from pathlib import Path
from types import SimpleNamespace

import pytest
from aiohttp.test_utils import make_mocked_request

from backend import _host
from tests.host_double import FakeCtx


class StoreError(Exception):
    def __init__(self, code):
        self.code = code
        super().__init__(code)


class FixtureStore:
    def __init__(self, root):
        self.root = Path(root)

    def read(self, leaf):
        try:
            content = (self.root / leaf).read_text()
        except FileNotFoundError as exc:
            raise StoreError("not_found") from exc
        return SimpleNamespace(
            content=content, revision=hashlib.sha256(content.encode()).hexdigest()
        )

    def write(self, leaf, content, *, operation):
        assert operation == "create"
        try:
            with (self.root / leaf).open("x") as target:
                target.write(content)
        except FileExistsError as exc:
            raise StoreError("conflict") from exc
        return self.read(leaf)


@pytest.fixture
def receipt_host(tmp_path, monkeypatch):
    from backend import results

    monkeypatch.setattr(_host.SURFACES["document_store"], "DocumentStore", FixtureStore)
    monkeypatch.setattr(_host.SURFACES["document_store"], "DocumentStoreError", StoreError)
    monkeypatch.setattr(
        _host.SURFACES["document_store"],
        "provided",
        frozenset({"DocumentStore", "DocumentStoreError"}),
    )
    ctx = FakeCtx(data_dir=tmp_path / "app-data")
    return results, ctx


def request(body, *, app="", user="owner-user"):
    req = make_mocked_request(
        "POST",
        "/api/apps/design-critique/results",
        app={"state": SimpleNamespace(owner_id="owner-user")},
    )
    req["app"], req["user"] = app, user
    req._read_bytes = json.dumps(body).encode()
    return req


def report():
    return {
        "slotKey": "dc-test-one",
        "read": "A clear flow",
        "report": {
            "overallRead": "A clear flow",
            "findings": [{"severity": "minor", "title": "Label", "evidence": "An unclear label"}],
            "screens": [{"step": 1, "label": "Start", "path": "/private/not-returned.png"}],
        },
        "screens": [{"step": 1, "label": "Start"}],
    }


@pytest.mark.asyncio
async def test_owner_persists_actual_report_create_once_and_scoped_read(receipt_host):
    results, ctx = receipt_host
    response = await results.publish_result(request(report()), ctx)
    assert response.status == 201
    saved = json.loads(response.text)
    assert saved["resource_id"] == hashlib.sha256(b"dc-test-one").hexdigest()
    reader = results.resource_reader(ctx.data_dir)
    result = await reader(
        Path("/explicitly-configured-workspace"), saved["resource_id"], "result", "read", {}
    )
    assert result["report"]["findings"][0]["title"] == "Label"
    assert "/private/" not in json.dumps(result)
    same = await results.publish_result(request(report()), ctx)
    assert same.status == 200
    changed = report()
    changed["report"]["findings"][0]["title"] = "Different result"
    assert (await results.publish_result(request(changed), ctx)).status == 409


@pytest.mark.asyncio
async def test_app_even_in_own_namespace_cannot_publish_result(receipt_host):
    results, ctx = receipt_host
    response = await results.publish_result(request(report(), app="design-critique"), ctx)
    assert response.status == 403
    assert not ctx.data_dir.exists()
    assert (await results.publish_result(request(report(), user="other"), ctx)).status == 403


@pytest.mark.asyncio
async def test_receipts_reject_bad_shape_and_launch_operations(receipt_host):
    results, ctx = receipt_host
    invalid = report()
    invalid["report"]["findings"] = "not an array"
    assert (await results.publish_result(request(invalid), ctx)).status == 400
    assert not ctx.data_dir.exists()
    reader = results.resource_reader(ctx.data_dir)
    with pytest.raises(ValueError, match="unsupported_operation"):
        await reader(Path("/workspace"), "a" * 64, "result", "start", {})
    with pytest.raises(ValueError, match="invalid_body"):
        await reader(Path("/workspace"), "a" * 64, "state", "read", {"url": "http://example.com"})


@pytest.mark.asyncio
async def test_old_host_keeps_feature_closed_without_creating_data(tmp_path):
    from backend import results

    ctx = FakeCtx(data_dir=tmp_path / "unused")
    assert (await results.publish_result(request(report()), ctx)).status == 503
    assert not ctx.data_dir.exists()
