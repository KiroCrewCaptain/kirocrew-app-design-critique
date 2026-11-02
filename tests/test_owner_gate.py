"""Owner gate on Design Critique's host-touching POST routes.

``POST /discover`` and ``POST /render`` start host work: a git clone, a route
scan and a headless Chromium run over a host directory, and PNGs written under
the owner's data home. So a dashboard caller that is not the owner, and a request
that carries no app claim at all, get the shared 403 ``owner_only`` and never
reach the job start. The owner still starts the job.

The gate is the host's (``ctx.require_owner``); ``FakeCtx`` stands in for it,
admitting only the configured owner. What these pin is the app's half: which
routes ask, with which bare operation name, that the host's refusal is returned
unchanged, and that a gateway without the seam refuses every dashboard caller of
those routes, the owner included (fail closed).

An app token is judged by the token middleware's scope check first: its own
namespace, or a manifest ``permissions.api`` grant. The stand-in middleware here
applies that rule (``_app_token_path_allowed``), so a foreign token with no grant
is refused there, and one with a grant reaches the handler and is admitted.

The reads stay open: ``GET /method`` and the ``GET ?job=`` polls answer every
caller as before.

``_start_job`` is replaced by a recorder, so no git / node / Chromium child is
spawned.
"""

from __future__ import annotations

from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

from backend import routes

from .host_double import FakeCtx, LegacyCtx

OWNER = "owner-user"
BASE = "/api/apps/design-critique"
GRANTED = "granted-app"
UNGRANTED = "ungranted-app"


@pytest.fixture
def started(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> list[str]:
    """Enable the app, isolate the data home, grant one foreign app, record job starts."""
    monkeypatch.setattr(routes, "config_dir", lambda: tmp_path / "home")
    monkeypatch.setattr(routes, "_node", lambda: "/usr/bin/node-not-run")
    calls: list[str] = []

    def _record(work: Callable[[], Any]) -> str:
        coro = work()
        coro.close()  # never run the host work
        calls.append("job")
        return "job-id"

    monkeypatch.setattr(routes, "_start_job", _record)
    return calls


@pytest.fixture
def project(tmp_path: Path) -> Path:
    proj = tmp_path / "owner-project"
    proj.mkdir()
    (proj / "package.json").write_text("{}", encoding="utf-8")
    return proj


_GRANTS = {GRANTED: (f"{BASE}/*",)}


def _app_token_path_allowed(app_name: str, path: str) -> bool:
    """The token middleware's rule: the app's own namespace, or a declared grant."""
    own = f"/api/apps/{app_name}"
    if path == own or path.startswith(own + "/"):
        return True
    for grant in _GRANTS.get(app_name, ()):
        if grant.endswith("/*") and path.startswith(grant[:-1]):
            return True
        if path == grant:
            return True
    return False


@asynccontextmanager
async def _client(ctx: Any = None) -> AsyncIterator[TestClient]:
    ctx = ctx if ctx is not None else FakeCtx()

    @web.middleware
    async def _identity(request: web.Request, handler: Any) -> web.StreamResponse:
        # Stand-in for token_auth: stamp the claims, then apply the
        # app-token scope decision the middleware makes before any handler.
        request["user"] = request.headers.get("X-Test-User", OWNER)
        if request.headers.get("X-Test-No-App") != "1":
            app_name = request.headers.get("X-Test-App", "")
            request["app"] = app_name
            if app_name and not _app_token_path_allowed(app_name, request.path):
                return web.json_response({"error": "out of scope", "code": "app_scope"}, status=403)
        return await handler(request)

    app = web.Application(middlewares=[_identity])
    app["state"] = SimpleNamespace(owner_id=OWNER)
    for route in routes.register_routes(ctx):

        async def _dispatch(request: web.Request, _route: Any = route) -> web.StreamResponse:
            return await _route.handler(request, ctx)

        app.router.add_route(route.method, BASE + route.path, _dispatch)
    c = TestClient(TestServer(app))
    await c.start_server()
    try:
        yield c
    finally:
        await c.close()


def _bodies(project: Path) -> dict[str, dict[str, Any]]:
    return {
        "discover": {"kind": "local", "value": str(project)},
        "render": {"kind": "local", "value": str(project), "picks": [{"ref": "/"}]},
    }


REFUSED = [
    pytest.param({"X-Test-User": "someone-else"}, "owner_only", id="non-owner-dashboard-subject"),
    pytest.param({"X-Test-No-App": "1"}, "owner_only", id="missing-app-claim"),
    pytest.param({"X-Test-App": UNGRANTED}, "app_scope", id="foreign-app-token-no-grant"),
]

ADMITTED = [
    pytest.param({}, id="owner"),
    pytest.param({"X-Test-App": "design-critique"}, id="own-app-token"),
    pytest.param({"X-Test-App": GRANTED}, id="foreign-app-token-with-grant"),
]

READERS = [
    pytest.param({}, id="owner"),
    pytest.param({"X-Test-User": "someone-else"}, id="non-owner-dashboard-subject"),
    pytest.param({"X-Test-No-App": "1"}, id="missing-app-claim"),
    pytest.param({"X-Test-App": "design-critique"}, id="own-app-token"),
]


@pytest.mark.asyncio
@pytest.mark.parametrize("route", ["discover", "render"])
@pytest.mark.parametrize(("headers", "code"), REFUSED)
async def test_refused_caller_gets_403_and_no_job(
    started: list[str],
    project: Path,
    route: str,
    headers: dict[str, str],
    code: str,
) -> None:
    async with _client() as client:
        r = await client.post(f"{BASE}/{route}", json=_bodies(project)[route], headers=headers)
        status, payload = r.status, await r.json()
    assert status == 403
    assert payload.get("code") == code
    assert started == []


@pytest.mark.asyncio
@pytest.mark.parametrize("route", ["discover", "render"])
@pytest.mark.parametrize("headers", ADMITTED)
async def test_admitted_caller_starts_the_job(
    started: list[str],
    project: Path,
    route: str,
    headers: dict[str, str],
) -> None:
    async with _client() as client:
        r = await client.post(f"{BASE}/{route}", json=_bodies(project)[route], headers=headers)
        status, payload = r.status, await r.json()
    assert status == 200
    assert payload.get("job") == "job-id"
    assert started == ["job"]


@pytest.mark.asyncio
@pytest.mark.parametrize("route", ["discover", "render"])
@pytest.mark.parametrize("headers", READERS)
async def test_job_poll_still_answers_every_caller(
    started: list[str],
    monkeypatch: pytest.MonkeyPatch,
    route: str,
    headers: dict[str, str],
) -> None:
    monkeypatch.setitem(
        routes._JOBS,
        "job-1",
        {"status": "done", "result": {"ok": True}, "error": None, "created_at": 0.0},
    )
    monkeypatch.setattr(routes, "_sweep_jobs", lambda: None)
    async with _client() as client:
        r = await client.get(f"{BASE}/{route}", params={"job": "job-1"}, headers=headers)
        status, payload = r.status, await r.json()
    assert status == 200
    assert payload == {"status": "done", "result": {"ok": True}}


@pytest.mark.asyncio
@pytest.mark.parametrize("headers", READERS)
async def test_method_still_answers_every_caller(
    started: list[str], headers: dict[str, str]
) -> None:
    async with _client() as client:
        r = await client.get(f"{BASE}/method", headers=headers)
        status, payload = r.status, await r.json()
    assert status == 200
    assert "checklist" in payload


@pytest.mark.parametrize("route", ["discover", "render"])
async def test_each_write_names_its_bare_operation(
    started: list[str], project: Path, route: str
) -> None:
    """The host prefixes the app's own name; the app passes the bare operation."""
    ctx = FakeCtx()
    async with _client(ctx) as client:
        r = await client.post(f"{BASE}/{route}", json=_bodies(project)[route])
        assert r.status == 200
    assert ctx.owner_checks == [route]


@pytest.mark.parametrize("route", ["discover", "render"])
async def test_the_hosts_refusal_is_returned_unchanged(
    started: list[str], project: Path, route: str
) -> None:
    """A stale pre-owner session is the host's 401; the app must not rewrite it."""
    ctx = FakeCtx(
        refusal=lambda: web.json_response({"error": "stale", "code": "session_stale"}, status=401)
    )
    async with _client(ctx) as client:
        r = await client.post(
            f"{BASE}/{route}", json=_bodies(project)[route], headers={"X-Test-User": "x"}
        )
        status, payload = r.status, await r.json()
    assert (status, payload["code"]) == (401, "session_stale")
    assert started == []


@pytest.mark.parametrize("route", ["discover", "render"])
async def test_without_the_seam_even_the_owner_is_refused(
    started: list[str], project: Path, route: str
) -> None:
    """A gateway below App Kit level 1 has no ``require_owner``: fail closed."""
    async with _client(LegacyCtx()) as client:
        r = await client.post(f"{BASE}/{route}", json=_bodies(project)[route])
        status, payload = r.status, await r.json()
    assert (status, payload["code"]) == (403, "owner_only")
    assert started == []


async def test_an_app_token_never_asks_the_gate(started: list[str], project: Path) -> None:
    ctx = FakeCtx()
    async with _client(ctx) as client:
        r = await client.post(
            f"{BASE}/discover", json=_bodies(project)["discover"], headers={"X-Test-App": GRANTED}
        )
        assert r.status == 200
    assert ctx.owner_checks == []
