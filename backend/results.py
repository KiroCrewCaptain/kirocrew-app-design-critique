"""Immutable completed-report receipts, independent of capture/render jobs.

The Owner UI submits an actual finished report. App callers can only read an
exact receipt through the gateway's separately approved workspace/resource grant.
No transcript, image path, URL, capture operation or agent launch is exposed.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import math
import re
from pathlib import Path
from typing import Any

from aiohttp import web

from . import _host

_ID = re.compile(r"[a-f0-9]{64}\Z")
_SLOT = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.:-]{0,199}\Z")
_MAX_BYTES = 256 * 1024
_SEVERITIES = {"catastrophe", "major", "minor", "cosmetic"}


def available() -> bool:
    surface = _host.SURFACES["document_store"]
    return {"DocumentStore", "DocumentStoreError"}.issubset(surface.provided)


def _error(code: str, status: int) -> web.Response:
    return web.json_response({"error": code.replace("_", " "), "code": code}, status=status)


def _text(value: Any, limit: int = 12000) -> str:
    if not isinstance(value, str) or len(value) > limit:
        raise ValueError("invalid_result")
    return value


def _integer(value: Any, limit: int = 20) -> int:
    if not isinstance(value, int) or isinstance(value, bool) or not 0 <= value <= limit:
        raise ValueError("invalid_result")
    return value


def _array(value: Any, limit: int) -> list:
    if not isinstance(value, list) or len(value) > limit:
        raise ValueError("invalid_result")
    return value


def _screens(value: Any) -> list[dict]:
    result = []
    for screen in _array(value, 20):
        if not isinstance(screen, dict):
            raise ValueError("invalid_result")
        result.append(
            {"step": _integer(screen.get("step", 0)), "label": _text(screen.get("label", ""), 512)}
        )
    return result


def _report(value: Any) -> dict:
    if not isinstance(value, dict):
        raise ValueError("invalid_result")
    result = {}
    for field in ("overallRead", "health"):
        if field in value:
            result[field] = _text(value[field])
    for field in ("keep", "couldNotSee"):
        if field in value:
            result[field] = [_text(item) for item in _array(value[field], 100)]
    if "screens" in value:
        result["screens"] = _screens(value["screens"])
    if "tally" in value:
        if not isinstance(value["tally"], dict):
            raise ValueError("invalid_result")
        result["tally"] = {
            key: _integer(count, 200) for key, count in value["tally"].items() if key in _SEVERITIES
        }
    findings = []
    for raw in _array(value.get("findings", []), 200):
        if not isinstance(raw, dict) or raw.get("severity") not in _SEVERITIES:
            raise ValueError("invalid_result")
        finding = {"severity": raw["severity"], "title": _text(raw.get("title", ""), 512)}
        for field in ("category", "location", "evidence", "fix"):
            if field in raw:
                finding[field] = _text(raw[field])
        if "scope" in raw:
            if raw["scope"] not in {"screen", "flow"}:
                raise ValueError("invalid_result")
            finding["scope"] = raw["scope"]
        if "steps" in raw:
            finding["steps"] = [_integer(step) for step in _array(raw["steps"], 20)]
        if "rules" in raw:
            finding["rules"] = [_text(rule, 1024) for rule in _array(raw["rules"], 20)]
        if raw.get("box") is not None:
            if not isinstance(raw["box"], dict):
                raise ValueError("invalid_result")
            box = {}
            for key in ("x", "y", "w", "h"):
                if key in raw["box"]:
                    number = raw["box"][key]
                    if (
                        isinstance(number, bool)
                        or not isinstance(number, (int, float))
                        or not math.isfinite(number)
                        or not 0 <= number <= 1
                    ):
                        raise ValueError("invalid_result")
                    box[key] = number
            finding["box"] = box
        findings.append(finding)
    result["findings"] = findings
    if not result.get("overallRead") and not findings:
        raise ValueError("invalid_result")
    return result


def _receipt(payload: Any) -> tuple[str, str]:
    if not isinstance(payload, dict) or set(payload) != {"slotKey", "report", "read", "screens"}:
        raise ValueError("invalid_result")
    slot = payload["slotKey"]
    if not isinstance(slot, str) or not _SLOT.fullmatch(slot):
        raise ValueError("invalid_result")
    report = _report(payload["report"])
    read = _text(payload["read"])
    if read != report.get("overallRead", ""):
        raise ValueError("invalid_result")
    receipt = {
        "version": 1,
        "status": "complete",
        "report": report,
        "read": read,
        "screens": _screens(payload["screens"]),
    }
    text = json.dumps(
        receipt, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False
    )
    if len(text.encode("utf-8")) > _MAX_BYTES:
        raise ValueError("result_too_large")
    return hashlib.sha256(slot.encode()).hexdigest(), text


async def publish_result(request: web.Request, ctx: Any) -> web.Response:
    # The old discover/render gate admits scoped App tokens. Completed-result
    # publication is instead an Owner-only authority boundary, including when
    # the App happens to own this URL namespace.
    if request.get("app") != "":
        return _error("owner_only", 403)
    denied = await _host.require_owner(ctx, request, "publish_result")
    if denied is not None:
        return denied
    if not available():
        return _error("result_storage_unavailable", 503)
    try:
        raw = await request.read()
        if len(raw) > _MAX_BYTES:
            return _error("result_too_large", 413)
        resource_id, text = _receipt(json.loads(raw))
    except (ValueError, UnicodeError):
        return _error("invalid_result", 400)
    root = Path(ctx.data_dir) / "results"
    if not root.is_absolute():
        return _error("result_storage_unavailable", 503)
    surface = _host.SURFACES["document_store"]

    def create() -> bool:
        root.mkdir(parents=True, exist_ok=True, mode=0o700)
        store = surface.DocumentStore(root)
        try:
            store.write(resource_id + ".json", text, operation="create")
            return True
        except surface.DocumentStoreError as exc:
            if exc.code == "conflict" and store.read(resource_id + ".json").content == text:
                return False
            raise

    try:
        created = await asyncio.to_thread(create)
    except surface.DocumentStoreError as exc:
        return _error(
            "result_conflict" if exc.code == "conflict" else "result_storage_unavailable",
            409 if exc.code == "conflict" else 503,
        )
    except OSError:
        return _error("result_storage_unavailable", 503)
    return web.json_response(
        {"resource_id": resource_id, "status": "complete"}, status=201 if created else 200
    )


def resource_reader(data_dir: Path):
    async def read_resource(
        workspace_root: Path, resource_id: str, document: str, operation: str, body: dict
    ) -> dict:
        # This app has no native workspace field. The gateway's exact Owner
        # grant tuple supplies the association; no paths are inferred from text.
        if operation != "read":
            raise ValueError("unsupported_operation")
        if body != {}:
            raise ValueError("invalid_body")
        if document not in {"state", "result"}:
            raise ValueError("invalid_document")
        if not _ID.fullmatch(resource_id) or not available():
            raise ValueError("resource_not_found")
        surface = _host.SURFACES["document_store"]
        try:
            snapshot = await asyncio.to_thread(
                surface.DocumentStore(Path(data_dir) / "results").read, resource_id + ".json"
            )
        except surface.DocumentStoreError as exc:
            raise ValueError("resource_not_found") from exc
        receipt = json.loads(snapshot.content)
        if (
            not isinstance(receipt, dict)
            or receipt.get("version") != 1
            or receipt.get("status") != "complete"
        ):
            raise ValueError("resource_not_found")
        # Revalidate a stored record before projecting it; never reflect fields
        # added by a by-name external writer into the scoped API.
        report = _report(receipt["report"])
        screens = _screens(receipt["screens"])
        if _text(receipt["read"]) != report.get("overallRead", ""):
            raise ValueError("resource_not_found")
        result = {"resource_id": resource_id, "status": "complete"}
        if document == "result":
            result.update(report=report, read=_text(receipt["read"]), screens=screens)
        else:
            result.update(screen_count=len(screens), finding_count=len(report["findings"]))
        return result

    return read_resource


def register(ctx: Any) -> None:
    host = _host.SURFACES["resource_access"]
    app = getattr(ctx, "http_app", None)
    enabled = getattr(getattr(ctx, "lifecycle", None), "is_enabled", None)
    if (
        app is not None
        and available()
        and "register_provider" in host.provided
        and callable(enabled)
    ):
        host.register_provider(
            app, "design-critique", resource_reader(ctx.data_dir), enabled=enabled
        )
