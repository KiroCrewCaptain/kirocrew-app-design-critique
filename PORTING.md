# Porting notes: built-in → external app

This repository was ported from Kiro Crew's built-in app at
`src/kiro_crew/apps/builtins/design_critique/` (KiroCrew `main` at `390c5315be`),
its dashboard page at `website/src/apps/design-critique/`, its store art and
example screens at `website/public/app-assets/design-critique/`, its catalog
strings (`apps.designCritique.*` in `website/src/i18n/locales/*.json`), and its
tests: the four under the app's own `tests/`, the three
`test/test_design_critique_*.py` files, and the twelve `website` tests
(`src/apps/design-critique/api.coverage.test.ts`,
`src/test/DesignCritique*.test.ts(x)`, `src/test/designCritiqueSendReceipt.test.ts`).

Line numbers below refer to that commit. "Gap" means something the built-in
gets from Kiro Crew that an external app has no public way to get today. Each gap
is a Kiro Crew change, not a change here.

## What carried over unchanged

- `app.json` `name` (`design-critique`), so adoption can map an existing
  built-in record onto this one. The `version` started equal to the built-in's
  (`1.0.0`) and only moves up: adoption matches it against Kiro Crew's pin of one
  commit here, and a later commit's patch bump is what shows an adopted user the
  update (see [Fixes since the port](#fixes-since-the-port)). `permissions`,
  `skills`, `defaultEnabled`, `platform`, `tags`, `highlights`, `description`,
  `useCases` and `configuration` are the built-in's; `tests/test_manifest_contract.py`
  compares them with the built-in's manifest (`tests/fixtures/builtin-app.json`).
  Like the built-in, the app declares no agent: the critic persona travels in the
  prompt (`ui/src/prompts.ts`) and runs on the host's default agent.
- `skills/design-critique/`, byte for byte except one sentence of `SKILL.md`
  (below): the checklist and the six capture scripts.
- Every route's method, path, validation and response shape, the job registry,
  the probe-PNG cache, the SSRF checks and DNS pins, the `git clone` hardening,
  the clone/probe TTL sweep, and the data location: clones and probe dirs under
  `<data home>/uploads/dc-clones` and `dc-probe-*`, renders under
  `<data home>/uploads/dc-render-*`, so a user's saved critiques keep their images.
- The page's markup, inline styles and behaviour (`ui/src/`), and its strings
  in all 12 dashboard locales.

## What changed, and why

| Built-in | Here | Why |
|---|---|---|
| `"backend": {"routes": "backend.routes:register_routes"}` (`app.json:33`) | `"backend": {"hooks": {"routes": "backend.routes:register_routes"}}` | Top-level `backend.routes` is read only by the built-in boot loop (`dashboard/routes/system.py:235`, `BUILTIN_NAMES`). An installed app's routes go through `RouteRegistry` (`apps/route_registry.py`). |
| `register_routes(app: web.Application)` adding five routes to `app.router` (`backend/routes.py:1602-1609`) | `register_routes(ctx) -> list[Route]`, handlers `(request, ctx)` | The `hooks.routes` contract. `Route` is the app's own frozen dataclass (`backend/_host.py`), accepted structurally from App Kit level 1. The paths are relative (`/discover`); the registry serves them under `/api/apps/design-critique/`, the built-in's URLs. |
| `_require_enabled` on every route (`backend/routes.py:631-641`, private `apps.manager.is_app_enabled`) | Removed | The registry takes an app's routes down on disable, so a disabled app answers 404. The `app_disabled` 403 is gone; the page never branched on it. |
| `require_owner_dashboard_request(request, "design_critique.discover")` (`backend/routes.py:47`, `:656`) | `ctx.require_owner(request, "discover")` | The level-1 owner gate. The host prefixes the app's own name, so a denial is now audited as `design-critique.discover` (was `design_critique.discover`). A gateway without the seam refuses every dashboard caller of discover and render, the owner included. App tokens still skip the gate, as before. |
| `_SKILL_DIR` from `Path(kiro_crew.__file__)` (`backend/routes.py:62-64`) | `_host.app_root() / "skills/design-critique"` | The skill ships in this repository. |
| `from kiro_crew.apps.builtins.design_critique...` | `from . import _host` | Hook files load into a synthetic package; relative imports are the documented form. |
| `SKILL.md:66` told the agent to find `<skill-dir>` with `python3 -c "import kiro_crew ..."` and the built-in's install path | `<skill-dir>` is the directory the `SKILL.md` was loaded from | That path does not exist for an installed app. |
| `iconUrl` / `heroImage*` / `heroImageDetail*` as `/app-assets/...` SVGs, `screenshots` as an `/app-assets` PNG (`app.json:66-79`) | `iconPath` / `heroImage*` / `heroImageDetail*` / `screenshots` as repo-relative PNGs under `assets/` | A registry app's art is repo-relative, and the catalog refuses SVG for a non-builtin source. The PNGs were rendered from the built-in SVGs (icon 512×512 on an opaque tile with the theme tokens fixed, heroes 1200×675, detail heroes 1200×288); the SVGs are kept beside them. |
| `ui.pages` `[{"route": "/design-critique", "icon": "PencilRuler"}]`, page compiled into the dashboard (`app.json:36-44`, `website/src/apps/builtinRegistry.ts:64`) | `ui.entry: "dist/index.mjs"` (committed ESM bundle built from `ui/src/`), `ui.pages` `[{"route": "/apps/design-critique"}]` | An installed app ships its page as a bundle AppHost loads. The legacy `/design-critique` route and glyph of an ADOPTED record come from Kiro Crew's adoption pin, never from this manifest. |
| "See an example" images at `/app-assets/design-critique/samples/*.png` (`website/src/apps/design-critique/constants.ts:283`) | `ui/samples/*.png`, resolved against the bundle's own URL (`/apps/design-critique/ui/samples/`) | The gateway serves an app's `ui/` tree beside its bundle. |
| App Store copy keys in the dashboard catalogs (`website/src/components/appstore/appManifest.ts:178-195`) | `l10n` block in `app.json` for the 11 non-English locales | The listing copy travels with the app. It is the `manifest` subtree of `ui/i18n/<locale>.json`, kept equal by a test. |
| `"license": "MIT"` (`app.json:7`) | `"license": "Apache-2.0"` | The built-in's code shipped under Kiro Crew's Apache-2.0 licence, which is this repository's `LICENSE`; the manifest now says the same. Adoption does not compare it. |
| No `minKiroCrewVersion` | `"minKiroCrewVersion": "0.13.0"` | The first release line that can carry App Kit level 1 (PR #27517, still open when this was written). Kiro Crew 0.12.0 has none of it: its `RouteRegistry.register_app_routes` skips any item that is not its own `AppRoute` ("skipping non-AppRoute item"), so every route of this app answers 404 there, the page loses its checklist and folder, repository and site critiques cannot start. The floor makes 0.12.0 refuse the install instead. |

## Gateway functions with no App Kit seam: reached through `backend/_host.py`

Nothing in `backend/` imports `kiro_crew`. The built-in also called gateway
functions that have **no** public App Kit seam yet, and dropping any of them would
weaken the app (the sandbox, the SSRF rule, the credential-path floor) or move
where a user's files live (the data home). So `backend/_host.py` resolves exactly
these names from the running gateway, each on its own (`HOST_FUNCTIONS`, pinned by
`tests/test_no_host_imports.py`), with a stand-in for a gateway that lacks one.
Every security stand-in refuses (`tests/test_host_stand_ins.py`), and discover and
render answer 503 `host_unsupported` before touching a file when the sandbox or the
data home is missing.

| Name | Built-in use | Without it | Seam Kiro Crew needs |
|---|---|---|---|
| `kiro_crew.sandbox.sandboxed_spawn_argv_async`, `sandboxed_spawn_argv`, `sandbox.create_subprocess_limited` | every `git` / `node` child (`backend/routes.py:696-705`; `sandbox_spawn.py:582`, `:812`; `sandbox_rlimit.py:616`) | no subprocess | an app-scoped sandboxed subprocess on the context (for example `ctx.subprocess.spawn(argv, env=…, mode="standard")`) |
| `kiro_crew.link_unfurl.address_is_not_public` | the SSRF vet of every repo / URL target (`backend/routes.py:616`; `link_unfurl.py:269`) | no address is public: only a typed loopback preview passes | a public-address predicate on the context (it adds no reach) |
| `kiro_crew.security.DENIED_ROOT_PARTS`, `is_sensitive_path`, `path_contains_sensitive` | the local-folder guard (`backend/routes.py:48-52`, `:543-551`; `security/paths.py:228`) | every local folder is protected | a sensitive-path predicate on the context |
| `kiro_crew.config.paths.config_dir` | `<data home>/uploads` for clones, probes and renders (`backend/routes.py:444-455`, `:523`; `config/paths.py:813`) | no discover or render | the uploads directory (the one `/api/upload/file` writes and `/api/file-raw` serves) on the context; `ctx.data_dir` is the wrong place, because `/api/file-raw` and saved critiques read these paths |
| `kiro_crew.platform_compat.trusted_git_bin`, `is_link_or_junction`, `rmtree_force`, `kill_and_reap`, `IS_POSIX`, `CREATE_NEW_PROCESS_GROUP` | process groups, tree kills, the git resolver, junction-safe walks (`backend/routes.py:44`) | no `git` (so no clone); the rest have equivalent stand-ins | none needed: the App Kit already names `platform_compat` as the module apps route platform decisions through (`docs/app-kit/manifest-reference.md:1384`); it is listed so the table is complete |

This copy was installed, trusted and enabled on a gateway with App Kit level 1
(PR #27517's tree) under a temporary name: the five routes registered through the
structural records, `/method` served the checklist, `ctx.require_owner` admitted
the owner, the SSRF and protected-path refusals answered as before, a local
discover ran `discover-routes.mjs` through the real sandboxed spawn, and the page
bundle and its sample images loaded from `/apps/<name>/ui/`.

## Remaining gaps

1. **The five gateway functions above.** Each is a private module name that a
   Kiro Crew refactor can move; the stand-ins keep that failure closed and
   reported (`ctx.health`), but the app's repo, folder and URL modes stop working
   until the name is back or a seam replaces it.
2. **Hidden worker slots.** The page opens its critique and follow-up slots with
   `mode: "design-critique"` (`ui/src/api.ts`), which Kiro Crew allows only
   because its built-in copy registers that one mode at import
   (`src/kiro_crew/apps/builtins/design_critique/seams.py`, read by
   `chat_handlers._CREATABLE_MODES` through `apps/seams.worker_slot_modes`). It
   keeps them out of the chat sidebar. That registration is a built-in's seam
   module, which an installed app has no way to provide, so core needs a generic
   app-worker slot mode (keyed on the slot's app, or declared in the manifest),
   with a migration for slots already persisted with this mode, before it can
   stop shipping the built-in's `seams.py`.
3. **Execution trust.** A built-in's in-gateway Python is exempt from the
   third-party execution gate (`src/kiro_crew/apps/execution.py:393`
   `is_builtin_app`, `:719` `app_execution_denied`). This copy's hooks load only
   when the operator trusts it. Adoption must carry a repository-bound grant for
   existing users, as for the other first-party apps.
4. **HEIC photos.** The dashboard's composer converts a HEIC/HEIF photo to JPEG
   before upload (`website/src/utils/composerUpload.ts:14`,
   `website/src/utils/heicImage.ts`). That converter is not in the App Kit; here
   a HEIC file is uploaded as it is (`ui/src/composerUpload.ts`). Oversized
   rasters are still downscaled (`ui/src/resizeImage.ts`, copied).
5. **Chat send transport.** The receipt contract of the dashboard's
   `chat-core/transport/sendTurn.ts` is restated in `ui/src/sendTurn.ts`
   (deadline, refusal, indeterminate). The SDK exports no send helper for an app
   that posts to its own hidden slot.
6. **Dialog focus trap.** `ui/src/focusTrap.ts` restates
   `website/src/hooks/useDialogFocusTrap.ts` without its remote-Crew stand-down
   (`useLocalCrewHidden`, `:9`) and its WebKit IME latch (`useDocumentImeLatch`,
   `:8`); a key the IME is still composing is left alone.
7. **Theme tokens.** The page's inline styles read the dashboard's CSS custom
   properties (`var(--accent)`, `var(--muted)`, …). They are what makes the page
   follow the theme, and nothing in the App Kit documents them as a stable
   surface yet.
8. **Store listing localization.** The catalog's publish step does not carry
   `l10n`, so a store row that is not installed shows English; an installed copy
   is localized from its own manifest.
9. **Sidebar glyph on a fresh install.** The `PencilRuler` glyph and the
   `/design-critique` route are shown only for an adopted record (from Kiro
   Crew's pin). A fresh install lives at `/apps/design-critique` with the
   `iconPath` image.
10. **Author.** `app.json` keeps `"author": "kirocrew"`, the built-in's value; the
    catalog's publish step refuses a manifest-asserted reserved author, so
    attribution goes on the catalog row.
11. **Core still names the app.** `src/kiro_crew/apps/builtins/__init__.py:9`,
    `src/kiro_crew/dashboard/routes/system.py:235`,
    `src/kiro_crew/apps/builtins/design_critique/seams.py` (the worker slot
    mode, gap 2),
    `src/kiro_crew/security/paths.py:225` (comment),
    `website/src/apps/builtinRegistry.ts:64`,
    `website/src/components/appstore/appManifest.ts:178` and the
    `apps.designCritique.*` catalog keys. They stay while the built-in ships;
    removing them is the release after adoption, once gaps 1 and 2 are closed.

## UI

The page is `ui/src/`, ported from `website/src/apps/design-critique/` with the
same markup, inline styles and behaviour. `npm run build` in `ui/` writes the
committed `ui/dist/index.mjs`; CI rebuilds it and fails on a difference.

| Built-in | Here |
|---|---|
| Plain same-origin `fetch` to `/api/chat`, `/api/chat/slots`, `/api/upload/file` and this app's routes (`api.ts`) | The host's scoped client, `useAppApi().raw`, bound once at the page root (`ui/src/appApi.ts`); a path outside `permissions.api` is refused in the browser |
| `api/apiError.toApiError` | `ui/src/appApi.ts` `ApiError`, with the server's own sentence |
| `chat-core/transport/sendTurn` | `ui/src/sendTurn.ts` (gap 5) |
| `utils/composerUpload` | `ui/src/composerUpload.ts` over `ui/src/resizeImage.ts` (gap 4) |
| `utils/fileTokens.mdImageDest` | `ui/src/fileTokens.ts`, copied |
| `components/Clickable`, `components/ErrorNotice` | the same components from `@kirocrew/app-sdk/ui` |
| `hooks/useImeGuard`, `i18n/format.fmtRelative` | the same from `@kirocrew/app-sdk` |
| `hooks/useReducedMotion` | `useReduceMotion` in `ui/src/hooks.ts`, the same live media-query reader |
| `hooks/useDialogFocusTrap` | `ui/src/focusTrap.ts` (gap 6) |
| `hooks/useMenuKeyboard` (the History menu) | `ui/src/menuKeyboard.ts`, restated with the same arrow, Home/End and Tab contract and the same two gaps as the focus trap (gap 6) |
| `i18n/format.fmtNumber` and i18next's plural pick (`count`) | `fmtNumber` and the plural lookup in `ui/src/i18n.ts`: `<key>_zero` for 0 when present, then `<key>_<CLDR category>` for each catalog's own language, then the bare key |
| `framer-motion` (`Motion.tsx`) | the same two keyframe loops through `Element.animate`; reduced motion still swaps in the still forms |
| `i18n/t.i18nT` with `apps.designCritique.*` keys | `t()` in `ui/src/i18n.ts` over `ui/i18n/<locale>.json` (all 12 dashboard locales): the subtree, plus `pages.chatPage.send_failed` and `api.client.unexpected_server_response` as `common.*`. Exact locale, then base language, then English |

## Fixes since the port

Each change that landed on the built-in after the port (Kiro Crew `main` after
`390c5315be`), carried here so a user on this copy has it too. Version `1.0.1`.

| Kiro Crew commit | What a user sees | Here |
|---|---|---|
| `7b6615672f` (#27392) | The rail's `History (n)`, the screen list heading, the preview hint, the step labels, the composer's access, start and remove labels and a finding's fallback title and `Fix` / `Suggestion` read in the user's language. The History button says it opens a menu and whether it is open; the menu is a real `role="menu"` (arrows, Home/End, Tab kept inside), Escape closes it and returns focus to the button, a click outside closes it | `ui/src/DesignCritiquePage.tsx`, `Composer.tsx`, `FindingRow.tsx`, `ui/src/menuKeyboard.ts`, the catalogs |
| `97a2492dcb` (#29536) | "Critique this flow · 1 screen" in the singular, and every language's own plural forms for it | `_one` / `_other` (and `_few` / `_many`) keys, the plural lookup in `ui/src/i18n.ts` |
| `bf07772aad` (#29673) | The Ask layer's question field has an accessible name, not only a placeholder | `aria-label` in `ui/src/AskLayer.tsx` |
| `4e9d75ec16` (#29665) | The composer's title, start button, staged hint, link placeholders and render hint, and the rail's reading lines, are translated; the link field is named; five `utils` hints are translated in the languages that still had English | `ui/src/Composer.tsx`, `DesignCritiquePage.tsx`, the catalogs |
| `9cb676ad18` (#30155) | The empty history list, the "What you'll get" list, a history entry's screen count, a step's finding count, the flow screen count, the screen fallback name and the ask-error lines are translated, counts in plural form. A critique that fails in the background no longer also raises an English "Critique failed:" toast; the rail's failure notice is what shows it | `ui/src/DesignCritiquePage.tsx`, the catalogs |
| `259187cd18` (#30519) | A flow finding's step range reads "steps 1–4" in the user's language; a flow finding with no steps shows its translated "flow" badge and no range line; an empty screen label falls back to a translated "Screen" | `ui/src/FindingRow.tsx`, `DesignCritiquePage.tsx`, `utils.ts` |
| `8a378ff444` (#30299) | The waiting screen's title, placeholder and footer, and the scoping picker's found, picked and flow counts, fallback group and `From links` / `Guess` tags, are translated | `ui/src/WaitingScreen.tsx`, `ScopingPicker.tsx`, the catalogs |

The tests those changes added are in `ui/tests/` (`DesignCritiqueChrome`,
`ComposerLabels`, `PageText`, `ScopeTags`, `StepRange`, `WaitScope` and the
updated `StartLabel` i18n tests, `DesignCritiqueInputNames.a11y.test.ts`), with
the move-only refactor's rows that this copy lacked (`api.typedErrors.test.ts`
and `uploads.test.ts`, less the dashboard-only HEIC and 429-relabel rows). The
backend, the skill and the manifest have not changed on the built-in since the
port.

## Tests

| Built-in test | Here | Change |
|---|---|---|
| `tests/test_backend_routes.py`, `tests/test_backend_routes_probe_cache.py`, `tests/backend_routes_helpers.py` | same names | Handlers are called as `handler(request, ctx)` (`H` in the helpers). The mount test became `test_register_routes_returns_the_builtins_route_table`. The host functions are `tests/host_double.py`, installed for every test by `conftest.py`, which also blocks any installed `kiro_crew`. `kiro_crew.testing.links.make_dir_link` became a local helper. |
| `tests/test_windows_portability.py` | same | Reads the constants off the host surface; also pins the stand-ins' values. |
| `tests/test_manifest.py` | same, plus `tests/test_manifest_host_parser.py` | The built-in router's single-segment rule (`test_ui_route_is_single_path_segment`, `test_route_guard_regex_rejects_nested_paths`) and the `/app-assets` URL check (`test_declared_asset_urls_present`) were about the built-in's own page route and asset URLs, which this copy does not have; `tests/test_manifest_contract.py` checks the `/apps/<name>` page and the repo-relative PNG art instead. The cases that asked Kiro Crew's own parser (`test_manifest_validates_with_no_errors`, `test_discovery_includes_design_critique`, `test_default_enabled_is_false_in_discovery`) moved to `tests/test_manifest_host_parser.py`, which runs `AppManifest.validate` and the parsed fields from a real Kiro Crew checkout named by `KIROCREW_SRC`; CI's `host-parser` job runs it against a pinned Kiro Crew commit, and a plain offline run skips it. |
| `test/test_design_critique_owner_gate.py` | `tests/test_owner_gate.py` | The gate is `FakeCtx.require_owner`; the token middleware's scope rule is restated. Adds: bare operation names, the host's refusal returned unchanged, no seam refuses the owner, an app token never asks. |
| `test/test_design_critique_ssrf_guard_fail_closed.py`, `test/test_design_critique_capture_site_resolver_rule.py` | `tests/test_ssrf_guard_fail_closed.py`, `tests/test_capture_site_resolver_rule.py` | Paths point at this repository's `skills/`. |
| `website` tests (12 files: `api.coverage.test.ts`, ten `DesignCritique*.test.ts(x)`, `designCritiqueSendReceipt.test.ts`) | `ui/tests/`, all twelve with the same cases | Run by vitest with SDK stand-ins (`ui/tests/stubs/`). The i18n tests use `ui/tests/i18nTestKit.ts` over the app's catalogs instead of i18next. `DesignCritiquePromptImages` parses with `micromark` (CommonMark) instead of the dashboard's `MarkdownRenderer`. |
| (none) | `tests/test_no_host_imports.py`, `tests/test_host_stand_ins.py`, `tests/test_manifest_contract.py`, `ui/tests/i18n.test.ts`, `ui/tests/hostBoundary.test.tsx` | The pinned host table and that every stand-in refuses; the bundle's imports, the manifest's parity with the built-in and its `l10n` block, an adoptable tree; catalog coverage; the scoped client, uploads and the animations. |

Kiro Crew tests that use the `design-critique` name as a fixture or slot-mode
literal (`test/test_chat_slot_mode.py`, `test/test_denied_root_parts_shared.py`,
`test/test_owner_gate_file_readers.py`, `test/test_dashboard_chat_api_chat.py`
and the other chat-slot tests) stay in Kiro Crew and follow gap 2 and gap 11.

## What Kiro Crew keeps doing

The release that adds adoption still ships the built-in. A user's built-in record
moves onto this repository at the commit Kiro Crew pins; a record that cannot
move keeps running the built-in copy, unchanged. The KiroCrewApps catalog row
switches from `builtin` to `git` at that same commit in the same release, and the
adoption pin and the catalog row must name the same full 40-hex commit of this
repository (see the personal-shopper port's PORTING.md, "Release handoff", for
the exact steps).
