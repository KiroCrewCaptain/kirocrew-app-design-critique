"""Manifest + packaging-contract tests for the ``design-critique`` app.

These validate the static contract of ``app.json``, the resource paths it
declares and its shipped files, not the runtime UI. They are the backstop for a
manifest edit that would silently break install, discovery or navigation.

Ported from the built-in's ``tests/test_manifest.py``. Its cases that asked Kiro
Crew's own loader (``AppManifest.validate``, ``discover_builtin_apps``) are
host-side and stay with Kiro Crew; its single-segment route rule was the built-in
router's, and an installed app's page lives at ``/apps/<name>`` instead
(``tests/test_manifest_contract.py``). Everything here is resolved relative to
this file, so the suite is machine independent.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

APP_ROOT = Path(__file__).resolve().parents[1]
APP_JSON = APP_ROOT / "app.json"
APP_NAME = "design-critique"
SEMVER = re.compile(r"^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$")

# The six automation scripts the skill ships and the docs it depends on.
# ssrf-guard.mjs is imported by capture-build.mjs and capture-site.mjs, so a
# package without it ships captures that fail at import time.
_SKILL_REQUIRED_FILES = (
    "SKILL.md",
    "frameworks/main-checklist.md",
    "scripts/capture-build.mjs",
    "scripts/capture-site.mjs",
    "scripts/discover-routes.mjs",
    "scripts/ensure-playwright.mjs",
    "scripts/render.mjs",
    "scripts/ssrf-guard.mjs",
)


@pytest.fixture(scope="module")
def manifest() -> dict:
    return json.loads(APP_JSON.read_text(encoding="utf-8"))


def test_manifest_identity(manifest: dict) -> None:
    # Guards against a rename that would break adoption of an existing record.
    assert manifest["name"] == APP_NAME
    assert SEMVER.match(manifest["version"])
    assert manifest["displayName"]


def test_default_enabled_is_false(manifest: dict) -> None:
    # It MUST be the boolean False: a regression here would turn the app on in
    # every new user's sidebar.
    assert manifest["defaultEnabled"] is False


def test_single_ui_page_declared(manifest: dict) -> None:
    assert len(manifest["ui"]["pages"]) == 1


def test_declares_no_agent(manifest: dict) -> None:
    # The critic persona travels in the prompt (ui/src/prompts.ts CRITIC) and runs
    # on the host's default agent, as the built-in's did, so a user's existing
    # record carries no agent for adoption to add.
    assert "agents" not in manifest


def test_declared_skill_paths_exist(manifest: dict) -> None:
    assert manifest["skills"], "manifest declares no skills"
    for rel in manifest["skills"]:
        assert (APP_ROOT / rel).is_dir(), f"declared skill dir missing: {rel}"


def test_skill_required_files_exist(manifest: dict) -> None:
    for rel in manifest["skills"]:
        skill_dir = APP_ROOT / rel
        for required in _SKILL_REQUIRED_FILES:
            assert (skill_dir / required).is_file(), f"skill {rel!r} missing {required}"


def test_the_skill_names_no_kiro_crew_install_path() -> None:
    """The skill resolves its own directory; the built-in's pointed into the wheel."""
    text = (APP_ROOT / "skills" / "design-critique" / "SKILL.md").read_text(encoding="utf-8")
    assert "kiro_crew" not in text
    assert "apps/builtins" not in text


def _iter_app_files() -> list[Path]:
    skip_dirs = {"tests", "__pycache__", "node_modules", ".git"}
    files: list[Path] = []
    for path in APP_ROOT.rglob("*"):
        if not path.is_file():
            continue
        if any(part in skip_dirs for part in path.relative_to(APP_ROOT).parts):
            continue
        files.append(path)
    return files


def test_no_hardcoded_user_paths() -> None:
    offenders: list[str] = []
    for path in _iter_app_files():
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue  # binary or unreadable file — nothing to scan
        if "/Users/" in text:
            offenders.append(path.relative_to(APP_ROOT).as_posix())
    assert not offenders, (
        "hardcoded '/Users/' absolute path found in app files (breaks on "
        f"other machines): {offenders}"
    )
