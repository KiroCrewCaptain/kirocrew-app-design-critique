"""Every place this app reaches into the Kiro Crew gateway, in one module.

An external app's Python runs inside the gateway process. This app's own code
never names a ``kiro_crew`` module; what it takes from the gateway comes through
this file, in two kinds:

1. **App Kit seams** (level 1), read off the hook context with ``getattr``:

   - routes: a local frozen dataclass with ``method`` / ``path`` / ``handler``,
     which a level-1 ``RouteRegistry`` accepts structurally;
   - ``ctx.require_owner(request, operation)``: the host's own owner gate. It
     audits a denial as ``<app>.<operation>``. Without it every dashboard caller
     is refused, the owner included (fail closed).

2. **Host functions with no App Kit seam yet** (:data:`HOST_FUNCTIONS`). The
   built-in called them directly; there is no public, app-agnostic way to get
   them today, and dropping them would weaken the app's security (the sandbox
   every subprocess runs in, the SSRF address rule, the credential-path floor)
   or move where its files live. So they are resolved by name from the running
   gateway, each one on its own, and each has a stand-in for a gateway that does
   not have it. A security stand-in always refuses: no sandbox means no
   subprocess, no address rule means no address is public, no path floor means
   every local path is protected, and no data home means no work that writes
   files. PORTING.md, "Remaining gaps", lists each one as the generic seam Kiro
   Crew needs to grow; ``tests/test_no_host_imports.py`` pins this table, so a
   new reach into the host cannot be added without that test changing.

``missing()`` names what the running gateway did not provide, and
``register_routes`` reports it through ``ctx.health``.
"""

from __future__ import annotations

import asyncio
import importlib
import os
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Awaitable, Callable

from aiohttp import web

#: The App Kit seam level this app is written against.
REQUIRED_SDK_LEVEL = 1

Handler = Callable[[web.Request, Any], Awaitable[web.StreamResponse]]


@dataclass(frozen=True)
class Route:
    """One ``hooks.routes`` record, accepted structurally by the gateway."""

    method: str
    path: str
    handler: Handler


def sdk_level(ctx: Any) -> int:
    """The seam level the gateway reports; 0 for a gateway that predates the field."""
    level = getattr(ctx, "sdk_level", 0)
    return level if isinstance(level, int) and not isinstance(level, bool) else 0


def _owner_denied() -> web.Response:
    return web.json_response(
        {"error": "owner authorization required", "code": "owner_only"}, status=403
    )


async def require_owner(ctx: Any, request: web.Request, operation: str) -> web.StreamResponse | None:
    """``None`` when the caller is the dashboard owner, else the refusal to return.

    *operation* is bare (``"discover"``): the host prefixes the app's own name
    when it audits a denial. A gateway without the seam refuses everyone.
    """
    gate = getattr(ctx, "require_owner", None)
    if not callable(gate):
        return _owner_denied()
    return await gate(request, operation)


class HostUnavailable(RuntimeError):
    """The running gateway does not provide a host function this work needs."""


# ── host functions with no App Kit seam yet ──
#
# surface -> (module the built-in imported it from, the names this app uses).
HOST_FUNCTIONS: dict[str, tuple[str, tuple[str, ...]]] = {
    "platform_compat": (
        "kiro_crew.platform_compat",
        (
            "trusted_git_bin",
            "is_link_or_junction",
            "rmtree_force",
            "kill_and_reap",
            "IS_POSIX",
            "CREATE_NEW_PROCESS_GROUP",
        ),
    ),
    "sandbox": (
        "kiro_crew.sandbox",
        ("sandboxed_spawn_argv_async", "sandboxed_spawn_argv", "create_subprocess_limited"),
    ),
    "link_unfurl": ("kiro_crew.link_unfurl", ("address_is_not_public",)),
    "security": (
        "kiro_crew.security",
        ("DENIED_ROOT_PARTS", "is_sensitive_path", "path_contains_sensitive"),
    ),
    "paths": ("kiro_crew.config.paths", ("config_dir",)),
}

#: The surfaces without which this app starts no subprocess and writes no file.
REQUIRED_FOR_HOST_WORK: tuple[tuple[str, str], ...] = (
    ("sandbox", "sandboxed_spawn_argv_async"),
    ("sandbox", "sandboxed_spawn_argv"),
    ("sandbox", "create_subprocess_limited"),
    ("paths", "config_dir"),
)


def _refuse(name: str) -> Callable[..., Any]:
    def refused(*_args: Any, **_kwargs: Any) -> Any:
        raise HostUnavailable(f"this Kiro Crew does not provide {name}")

    refused.__name__ = f"refused_{name}"
    return refused


def _refuse_async(name: str) -> Callable[..., Awaitable[Any]]:
    async def refused(*_args: Any, **_kwargs: Any) -> Any:
        raise HostUnavailable(f"this Kiro Crew does not provide {name}")

    refused.__name__ = f"refused_{name}"
    return refused


def _is_link_or_junction(path: str | os.PathLike[str]) -> bool:
    try:
        return os.path.islink(path) or os.path.isjunction(path)
    except OSError:
        return True


def _rmtree_force(path: str | os.PathLike[str]) -> None:
    shutil.rmtree(path, ignore_errors=True)


async def _kill_and_reap(proc: Any) -> None:
    try:
        proc.kill()
    except (ProcessLookupError, OSError):
        pass
    try:
        await asyncio.wait_for(proc.wait(), 10)
    except (asyncio.TimeoutError, OSError):
        pass


def _always_protected(_path: str) -> bool:
    return True


def _never_public(_address: str) -> bool:
    return True


#: What each name is when the gateway lacks it. Security names refuse.
_STAND_INS: dict[str, dict[str, Any]] = {
    "platform_compat": {
        # No trusted resolver: no git binary, so no clone.
        "trusted_git_bin": lambda: None,
        "is_link_or_junction": _is_link_or_junction,
        "rmtree_force": _rmtree_force,
        "kill_and_reap": _kill_and_reap,
        "IS_POSIX": os.name == "posix",
        "CREATE_NEW_PROCESS_GROUP": (
            getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0) if os.name == "nt" else 0
        ),
    },
    "sandbox": {
        "sandboxed_spawn_argv_async": _refuse_async("sandboxed_spawn_argv_async"),
        "sandboxed_spawn_argv": _refuse("sandboxed_spawn_argv"),
        "create_subprocess_limited": _refuse_async("create_subprocess_limited"),
    },
    "link_unfurl": {"address_is_not_public": _never_public},
    "security": {
        "DENIED_ROOT_PARTS": frozenset(),
        "is_sensitive_path": _always_protected,
        "path_contains_sensitive": _always_protected,
    },
    "paths": {"config_dir": _refuse("config_dir")},
}


class Surface:
    """The names of one host module this app uses, each resolved on its own.

    A plain attribute bag, so a test can replace one name with
    ``monkeypatch.setattr``. ``provided`` records which names came from the
    gateway rather than from a stand-in.
    """

    def __init__(self, surface: str, values: dict[str, Any], provided: frozenset[str]) -> None:
        self._surface = surface
        self.provided = provided
        for key, value in values.items():
            setattr(self, key, value)

    def __repr__(self) -> str:
        return f"<host surface {self._surface}: {sorted(self.provided)} provided>"


def _resolve(surface: str) -> Surface:
    module_name, names = HOST_FUNCTIONS[surface]
    try:
        module: Any = importlib.import_module(module_name)
    except ImportError:
        module = None
    values: dict[str, Any] = {}
    provided: set[str] = set()
    for name in names:
        value = getattr(module, name, None) if module is not None else None
        if value is None:
            values[name] = _STAND_INS[surface][name]
        else:
            values[name] = value
            provided.add(name)
    return Surface(surface, values, frozenset(provided))


#: Resolved once, when the gateway loads this hook module.
SURFACES: dict[str, Surface] = {name: _resolve(name) for name in HOST_FUNCTIONS}


def missing() -> list[str]:
    """``surface.name`` for every host function the gateway did not provide."""
    return [
        f"{surface}.{name}"
        for surface, (_module, names) in HOST_FUNCTIONS.items()
        for name in names
        if name not in SURFACES[surface].provided
    ]


def missing_for_host_work() -> list[str]:
    """The required names (``REQUIRED_FOR_HOST_WORK``) the gateway did not provide."""
    return [
        f"{surface}.{name}"
        for surface, name in REQUIRED_FOR_HOST_WORK
        if name not in SURFACES[surface].provided
    ]


def app_root() -> Path:
    """This app's root directory (the parent of ``backend/``)."""
    return Path(__file__).resolve().parents[1]
