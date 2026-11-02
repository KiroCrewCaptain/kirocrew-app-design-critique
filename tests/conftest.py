"""Test session setup: the app root on ``sys.path``, no Kiro Crew, a host double.

The gateway loads hook files into a synthetic package named after the app, so
the backend never needs to be on ``sys.path`` there. A plain pytest run has no
such loader, so the app root is put on the path for the test session only.

``kiro_crew`` is blocked before the backend is imported: ``backend/_host.py``
then resolves every host function to its refusing stand-in, exactly as on a
gateway that lacks them, whether or not a Kiro Crew happens to be installed on
the machine running the tests. The autouse ``host`` fixture installs
``tests/host_double.py`` over those stand-ins for each test; a test that wants
the bare stand-ins asks for ``bare_host`` instead.
"""

import sys
from pathlib import Path

import pytest

APP_ROOT = Path(__file__).resolve().parent.parent
if str(APP_ROOT) not in sys.path:
    sys.path.insert(0, str(APP_ROOT))

# A None entry makes every `import kiro_crew...` raise ImportError.
sys.modules["kiro_crew"] = None  # type: ignore[assignment]


@pytest.fixture
def bare_host(request: pytest.FixtureRequest) -> None:
    """Keep the stand-ins: the backend as it runs on a gateway with no host functions."""


@pytest.fixture(autouse=True)
def host(request: pytest.FixtureRequest, monkeypatch: pytest.MonkeyPatch, tmp_path_factory) -> Path | None:
    if "bare_host" in request.fixturenames:
        return None
    from tests import host_double

    home = tmp_path_factory.mktemp("crew-home")
    host_double.install(monkeypatch, home)
    return home
