"""A stand-in for the gateway half the backend reaches through ``backend/_host.py``.

The tests run with no Kiro Crew installed (``conftest.py`` blocks the package, so
an installed copy on the machine cannot change a result). Each test then gets this
double installed over the host functions the backend uses, so the app's own logic
is exercised against the host behaviour it was written for:

- ``address_is_not_public`` restates the gateway's address rule (an allowlist on
  ``is_global`` plus every category flag, IPv4-mapped unwrapped, 6to4 checked on
  both readings), because the app's SSRF tests pin decisions that rule makes;
- ``DENIED_ROOT_PARTS`` is the gateway's credential dot-dir set;
- ``is_sensitive_path`` refuses the throwaway data home and anything under it;
- ``config_dir`` is that throwaway data home;
- ``trusted_git_bin`` is whatever ``git`` is on PATH;
- the sandbox entry points refuse, so a test that would spawn a real child fails
  loudly unless it replaced them (the route tests replace ``_run`` itself).

``FakeCtx`` is the ``AppContext`` fields the app reads at App Kit level 1. Its
``require_owner`` is the host predicate minus its implicit local subjects:
``None`` only for a dashboard request (``app`` claim present and ``""``) whose
subject is the configured owner; otherwise the host's 403 ``owner_only``.
"""

from __future__ import annotations

import ipaddress
import os
import shutil
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from aiohttp import web

from backend import _host

DENIED_ROOT_PARTS = frozenset({".ssh", ".aws", ".gnupg", ".kube", ".docker"})
IS_WINDOWS = os.name == "nt"


def _is_not_public(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    return (
        not ip.is_global
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_link_local
        or ip.is_loopback
        or ip.is_unspecified
        or getattr(ip, "is_site_local", False)
    )


def address_is_not_public(address: str) -> bool:
    try:
        ip = ipaddress.ip_address(address.split("%", 1)[0])
    except ValueError:
        return True
    mapped = getattr(ip, "ipv4_mapped", None)
    if mapped is not None:
        ip = mapped
    sixtofour = getattr(ip, "sixtofour", None)
    if sixtofour is not None and _is_not_public(sixtofour):
        return True
    return _is_not_public(ip)


async def _refused_spawn(*_args: Any, **_kwargs: Any) -> Any:
    raise AssertionError("a test reached the real sandboxed spawn; replace _run or the sandbox")


def _refused_prepare(*_args: Any, **_kwargs: Any) -> Any:
    raise AssertionError("a test reached the real sandboxed spawn; replace _run or the sandbox")


async def kill_and_reap(proc: Any) -> None:
    try:
        proc.kill()
    except (ProcessLookupError, OSError, AttributeError):
        pass


def install(monkeypatch: Any, home: Path) -> None:
    """Replace every host function the backend uses with this double."""
    home.mkdir(parents=True, exist_ok=True)

    def is_sensitive_path(path: str) -> bool:
        try:
            p = Path(path).expanduser().resolve()
        except (OSError, ValueError):
            return True
        root = home.resolve()
        return p == root or root in p.parents

    values: dict[str, dict[str, Any]] = {
        "platform_compat": {
            "trusted_git_bin": lambda: shutil.which("git"),
            "is_link_or_junction": _host._is_link_or_junction,
            "rmtree_force": _host._rmtree_force,
            "kill_and_reap": kill_and_reap,
            "IS_POSIX": os.name == "posix",
            "CREATE_NEW_PROCESS_GROUP": (
                getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0) if IS_WINDOWS else 0
            ),
        },
        "sandbox": {
            "sandboxed_spawn_argv_async": _refused_spawn,
            "sandboxed_spawn_argv": _refused_prepare,
            "create_subprocess_limited": _refused_spawn,
        },
        "link_unfurl": {"address_is_not_public": address_is_not_public},
        "security": {
            "DENIED_ROOT_PARTS": DENIED_ROOT_PARTS,
            "is_sensitive_path": is_sensitive_path,
            "path_contains_sensitive": lambda _path: False,
        },
        "paths": {"config_dir": lambda: home},
    }
    for surface_name, names in values.items():
        surface = _host.SURFACES[surface_name]
        for name, value in names.items():
            monkeypatch.setattr(surface, name, value)
        monkeypatch.setattr(surface, "provided", frozenset(names))
    from backend import routes

    # routes binds the shared set at import; follow the double.
    monkeypatch.setattr(routes, "_DENIED_ROOT_PARTS", DENIED_ROOT_PARTS)


def _owner_only_response() -> web.Response:
    return web.json_response(
        {"error": "owner authorization required", "code": "owner_only"}, status=403
    )


class FakeHealth:
    def __init__(self) -> None:
        self.status = "healthy"
        self.issues: list[str] = []

    def mark_degraded(self, issue: str) -> None:
        self.status = "degraded"
        self.issues.append(issue)


@dataclass
class FakeCtx:
    name: str = "design-critique"
    data_dir: Path = Path("unused")
    sdk_level: int = 1
    health: FakeHealth = field(default_factory=FakeHealth)
    owner_checks: list[str] = field(default_factory=list)
    refusal: Callable[[], web.StreamResponse] = _owner_only_response

    async def require_owner(self, request: Any, operation: str) -> Any | None:
        self.owner_checks.append(operation)
        app = getattr(request, "app", None) or {}
        state = app.get("state") if hasattr(app, "get") else None
        owner_id = str(getattr(state, "owner_id", "") or "")
        caller = str(request.get("user") or "")
        dashboard = "app" in request and request["app"] == ""
        if dashboard and owner_id and caller == owner_id:
            return None
        return self.refusal()


class LegacyCtx:
    """A context from a gateway that predates App Kit level 1: no seams at all."""

    def __init__(self) -> None:
        self.name = "design-critique"
        self.data_dir = Path("unused")
        self.health = FakeHealth()
