"""What the backend takes from Kiro Crew, pinned.

The gateway's public surface for an app is the ``AppContext`` its hooks get and
the structural route records the registry accepts. A ``kiro_crew`` import pins
the app to one wheel's private module layout, and the first release that moves
that module breaks every installed copy at load time.

This app still needs gateway functions that have no App Kit seam yet (the
sandboxed subprocess spawn, the public-address rule, the credential-path floor,
the data home; PORTING.md, "Remaining gaps"). So the rule here is narrower than
"never": no backend module imports ``kiro_crew``, and the one module that names
it, ``backend/_host.py``, does so only through its ``HOST_FUNCTIONS`` table,
resolved name by name with a refusing stand-in for each. A new reach into the
host therefore changes the table pinned below, in review, with the gap it
creates.
"""

from __future__ import annotations

import ast
import tempfile
import unittest
from pathlib import Path

from backend import _host

BACKEND = Path(__file__).resolve().parents[1] / "backend"

PINNED = {
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
    "document_store": ("kiro_crew.apps.document_store", ("DocumentStore", "DocumentStoreError")),
    "resource_access": ("kiro_crew.apps.resource_access", ("register_provider",)),
}


def _host_imports(path: Path) -> list[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    found: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            found += [a.name for a in node.names if a.name.split(".")[0] == "kiro_crew"]
        elif isinstance(node, ast.ImportFrom) and node.level == 0 and node.module:
            if node.module.split(".")[0] == "kiro_crew":
                found.append(node.module)
        elif isinstance(node, ast.Call):
            # importlib.import_module("kiro_crew...") / __import__("kiro_crew...")
            name = getattr(node.func, "attr", None) or getattr(node.func, "id", None)
            if name in {"import_module", "__import__"} and node.args:
                arg = node.args[0]
                if isinstance(arg, ast.Constant) and isinstance(arg.value, str):
                    if arg.value.split(".")[0] == "kiro_crew":
                        found.append(arg.value)
    return found


def _kiro_crew_literals(path: Path) -> list[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    return [
        node.value
        for node in ast.walk(tree)
        if isinstance(node, ast.Constant)
        and isinstance(node.value, str)
        and node.value.startswith("kiro_crew")
    ]


class TestNoHostImports(unittest.TestCase):
    def test_no_backend_module_imports_kiro_crew(self) -> None:
        files = sorted(BACKEND.rglob("*.py"))
        self.assertTrue(files, "no backend modules found")
        for path in files:
            with self.subTest(module=path.relative_to(BACKEND.parent).as_posix()):
                self.assertEqual(_host_imports(path), [])

    def test_only_the_host_table_names_a_kiro_crew_module(self) -> None:
        for path in sorted(BACKEND.rglob("*.py")):
            with self.subTest(module=path.name):
                literals = _kiro_crew_literals(path)
                if path.name == "_host.py":
                    self.assertEqual(sorted(literals), sorted(m for m, _ in PINNED.values()))
                else:
                    self.assertEqual(literals, [])

    def test_the_host_table_is_pinned(self) -> None:
        self.assertEqual(_host.HOST_FUNCTIONS, PINNED)

    def test_every_host_name_has_a_stand_in(self) -> None:
        for surface, (_module, names) in PINNED.items():
            with self.subTest(surface=surface):
                self.assertEqual(set(_host._STAND_INS[surface]), set(names))

    def test_the_scan_sees_each_import_form(self) -> None:
        """The detector itself: every spelling it must catch is caught."""
        source = (
            "import kiro_crew\n"
            "import kiro_crew.apps as a\n"
            "from kiro_crew.executors import run_in_embed_pool\n"
            "import importlib\n"
            "importlib.import_module('kiro_crew.embeddings')\n"
            "__import__('kiro_crew')\n"
            "from . import kiro_crew_like\n"
            "import kiro_crewish\n"
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "probe.py"
            path.write_text(source, encoding="utf-8")
            self.assertEqual(
                _host_imports(path),
                [
                    "kiro_crew",
                    "kiro_crew.apps",
                    "kiro_crew.executors",
                    "kiro_crew.embeddings",
                    "kiro_crew",
                ],
            )


if __name__ == "__main__":
    unittest.main()
