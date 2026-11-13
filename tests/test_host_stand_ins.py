"""On a gateway without the host functions, every host-touching path refuses.

``backend/_host.py`` resolves each gateway function by name and falls back to a
stand-in when the gateway lacks it. These run with the bare stand-ins (the
``bare_host`` fixture keeps the test double out) and pin that none of them is
more permissive than the host: no sandbox means no subprocess, no address rule
means no address is public, no path floor means every local path is protected,
no data home means discover and render answer 503 before touching a file, and
the route table still loads, reporting what is missing through ``ctx.health``.
"""

from __future__ import annotations

import asyncio
from pathlib import Path

import pytest

from backend import _host, routes

from .backend_routes_helpers import H, _Req
from .host_double import FakeCtx, LegacyCtx

pytestmark = pytest.mark.usefixtures("bare_host")


def test_nothing_is_provided_without_a_gateway() -> None:
    assert _host.missing() == [
        f"{surface}.{name}"
        for surface, (_module, names) in _host.HOST_FUNCTIONS.items()
        for name in names
    ]
    assert routes._host_missing() == [f"{s}.{n}" for s, n in _host.REQUIRED_FOR_HOST_WORK]


@pytest.mark.parametrize("route", ["discover", "render"])
async def test_discover_and_render_answer_503_and_start_nothing(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, route: str
) -> None:
    started: list[str] = []
    monkeypatch.setattr(routes, "_start_job", lambda work: started.append("job") or "job")
    body = {"kind": "local", "value": str(tmp_path), "picks": [{"ref": "/"}]}
    handler = H._handle_discover if route == "discover" else H._handle_render
    resp = await handler(_Req(body))
    assert resp.status == 503
    assert b'"host_unsupported"' in resp.body
    assert b"sandbox.sandboxed_spawn_argv_async" in resp.body
    assert started == []


async def test_the_owner_gate_still_runs_first() -> None:
    """A non-owner learns nothing about the host: the 403 comes before the 503."""
    req = _Req({"kind": "local", "value": "/x"})
    req["user"] = "someone-else"
    resp = await H._handle_discover(req)
    assert resp.status == 403


async def test_method_still_serves_the_checklist() -> None:
    resp = await H._handle_method(_Req({}))
    assert resp.status == 200


async def test_a_subprocess_is_refused_without_the_sandbox() -> None:
    with pytest.raises(_host.HostUnavailable):
        await routes._run(["node", "--version"], 5)


def test_no_address_is_public_without_the_rule() -> None:
    run = asyncio.run
    assert run(routes._resolve_vetted("http://[2606:2800:220:1:248:1893:25c8:1946]/")) is None
    assert run(routes._resolve_vetted("http://93.184.216.34/")) is None
    # The typed-loopback preview does not depend on the rule.
    assert run(routes._resolve_vetted("http://127.0.0.1:3000/")) == ["127.0.0.1"]


def test_every_local_path_is_protected_without_the_floor(tmp_path: Path) -> None:
    assert routes._is_sensitive_dir(tmp_path)
    assert routes._is_sensitive_dir(Path("/srv/app"))


def test_no_git_without_the_trusted_resolver() -> None:
    assert routes._tool("git") is None


def test_no_data_home_without_the_paths_function() -> None:
    with pytest.raises(_host.HostUnavailable):
        routes._uploads_dir()


def test_the_route_table_loads_and_reports_what_is_missing() -> None:
    ctx = FakeCtx()
    table = routes.register_routes(ctx)
    assert len(table) == 6
    assert ctx.health.status == "degraded"
    assert "sandbox.sandboxed_spawn_argv_async" in ctx.health.issues[0]


def test_a_gateway_below_level_1_is_reported_too() -> None:
    ctx = LegacyCtx()
    assert len(routes.register_routes(ctx)) == 6
    assert "App Kit level 1 is missing" in ctx.health.issues[0]
