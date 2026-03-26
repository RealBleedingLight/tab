# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-03-26T15:55:47.521Z
> Files: 693 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `.DS_Store` (~1640 tok)
- `.gitignore` — Git ignore rules (~8 tok)
- `CLAUDE.md` — OpenWolf (~2397 tok)
- `Dockerfile` — Docker container definition (~108 tok)
- `INDEX.md` — Guitar Tab Workspace (~465 tok)
- `UPGRADE_ROADMAP.md` — Guitar Teacher — Upgrade Roadmap (~477 tok)

## .claude/

- `settings.json` (~507 tok)
- `settings.local.json` (~1676 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## concepts/

- `.context.md` — Concepts — Progress (~31 tok)

## docs/superpowers/plans/

- `2026-03-24-gp2tab-implementation.md` — gp2tab Implementation Plan (~13933 tok)
- `2026-03-24-guitar-teacher.md` — Guitar Teacher Implementation Plan (~17339 tok)
- `2026-03-25-fastapi-backend.md` — FastAPI Backend Implementation Plan (~15320 tok)
- `2026-03-26-nextjs-frontend.md` — Next.js Frontend Implementation Plan (~16212 tok)

## docs/superpowers/specs/

- `2026-03-24-gp2tab-design.md` — gp2tab — Guitar Pro to Tab Converter (~3480 tok)
- `2026-03-24-guitar-teacher-design.md` — Guitar Teacher — Design Spec (~6339 tok)
- `2026-03-25-guitar-teacher-web-platform-design.md` — Guitar Teacher Web Platform — Design Spec (~3480 tok)

## frontend/

- `.gitignore` — Git ignore rules (~128 tok)
- `AGENTS.md` — This is NOT the Next.js you know (~82 tok)
- `CLAUDE.md` (~3 tok)
- `eslint.config.mjs` — ESLint flat configuration (~124 tok)
- `jest.config.ts` — Jest test configuration (~79 tok)
- `jest.setup.ts` (~11 tok)
- `middleware.ts` — API routes: GET (1 endpoints) (~160 tok)
- `next-env.d.ts` — / <reference types="next" /> (~71 tok)
- `next.config.ts` — Next.js configuration (~38 tok)
- `package-lock.json` — npm lock file (~127737 tok)
- `package.json` — Node.js package manifest (~255 tok)
- `postcss.config.mjs` — Declares config (~26 tok)
- `README.md` — Project documentation (~363 tok)
- `tsconfig.json` — TypeScript configuration (~191 tok)
- `vercel.json` (~37 tok)

## frontend/__tests__/components/

- `Fretboard.test.tsx` — positions (~299 tok)
- `ProgressBar.test.tsx` — bar (~203 tok)
- `SaveIndicator.test.tsx` — savedAt (~209 tok)

## frontend/__tests__/lib/

- `api.test.ts` — mockFetch: mockResponse (~868 tok)

## frontend/app/

- `globals.css` — Styles: 2 rules (~106 tok)
- `layout.tsx` — inter (~185 tok)
- `page.tsx` — parseContext — uses useState, useEffect (~884 tok)

## frontend/app/login/

- `page.tsx` — LoginPage — renders form — uses useRouter, useState (~539 tok)

## frontend/app/practice/[artist]/[song]/

- `page.tsx` — parseCurrentLesson — uses useState, useEffect, useCallback (~1613 tok)

## frontend/app/queue/

- `page.tsx` — MODELS (~1875 tok)

## frontend/app/settings/

- `page.tsx` — MODELS — uses useRouter, useState (~531 tok)

## frontend/app/songs/[artist]/[song]/

- `page.tsx` — parseContext — uses useState, useEffect (~784 tok)

## frontend/app/theory/

- `page.tsx` — NOTES — uses useState (~2407 tok)

## frontend/components/

- `BottomNav.tsx` — tabs (~309 tok)
- `Fretboard.tsx` — STRING_COUNT (~841 tok)
- `MarkdownLesson.tsx` — MarkdownLesson (~451 tok)
- `ProgressBar.tsx` — ProgressBar (~179 tok)
- `SaveIndicator.tsx` — minutesAgo (~210 tok)

## frontend/lib/

- `api.ts` — Exports api (~860 tok)
- `types.ts` — Exports Song, FretboardPosition, ScaleResult, ChordResult + 10 more (~535 tok)

## gp2tab/

- `cli.py` — CLI entry point for gp2tab. (~972 tok)
- `pyproject.toml` — Python project configuration (~98 tok)
- `README.md` — Project documentation (~333 tok)
- `requirements.txt` — Python dependencies (~5 tok)
- `USAGE.md` — gp2tab Usage Guide (~863 tok)

## gp2tab/.pytest_cache/

- `.gitignore` — Git ignore rules (~10 tok)
- `CACHEDIR.TAG` (~51 tok)
- `README.md` — Project documentation (~76 tok)

## gp2tab/.pytest_cache/v/cache/

- `lastfailed` (~1 tok)
- `nodeids` (~742 tok)

## gp2tab/gp2tab.egg-info/

- `dependency_links.txt` (~1 tok)
- `PKG-INFO` (~50 tok)
- `requires.txt` (~5 tok)
- `SOURCES.txt` (~142 tok)
- `top_level.txt` (~3 tok)

## gp2tab/gp2tab/

- `__init__.py` (~18 tok)
- `__main__.py` — Allow running as `python -m gp2tab`. (~69 tok)
- `formatter_json.py` — Format Song model as structured JSON. (~390 tok)
- `formatter_llm.py` — Format Song model as LLM-optimized condensed text. (~771 tok)
- `formatter_tab.py` — Format Song model as ASCII tab. (~2105 tok)
- `models.py` — Data models for gp2tab. (~346 tok)
- `parser_gp_xml.py` — Parser for GP6/7/8 files (ZIP containing Content/score.gpif XML). (~3888 tok)
- `parser_gp5.py` — Parser for GP3/4/5 files using pyguitarpro library. (~1256 tok)
- `parser.py` — Format-detecting parser dispatcher. (~251 tok)
- `utils.py` — Shared utilities for gp2tab. (~265 tok)

## gp2tab/tests/

- `__init__.py` (~0 tok)
- `conftest.py` — sample_song, rest_bars_song (~642 tok)
- `test_formatter_json.py` — Tests: json_structure, json_note_fields, json_techniques, json_technique_null_value + 2 more (~494 tok)
- `test_formatter_llm.py` — Tests: llm_header, llm_note_format, llm_techniques, llm_section_header + 3 more (~318 tok)
- `test_formatter_tab.py` — Tests: tab_header, tab_string_names, tab_fret_numbers, tab_techniques + 3 more (~465 tok)
- `test_models.py` — Tests: technique_bend, technique_no_value, note_basic, note_with_techniques + 3 more (~432 tok)
- `test_parser_gp_xml.py` — Tests: parse_metadata, parse_bar_count, parse_time_signature, parse_rest_bars + 8 more (~964 tok)
- `test_parser_gp5.py` — Tests: extract_hammer, extract_vibrato, extract_palm_mute, extract_dead_note + 5 more (~712 tok)
- `test_utils.py` — Tests: midi_standard_tuning, midi_flats, duration_beats, duration_beats_dotted + 1 more (~281 tok)

## guitar-teacher/

- `DOCS.md` — Guitar Teacher — Full Documentation (~5091 tok)
- `pyproject.toml` — Python project configuration (~252 tok)
- `README.md` — Project documentation (~831 tok)

## guitar-teacher/.pytest_cache/

- `.gitignore` — Git ignore rules (~10 tok)
- `CACHEDIR.TAG` (~51 tok)
- `README.md` — Project documentation (~76 tok)

## guitar-teacher/.pytest_cache/v/cache/

- `lastfailed` (~1 tok)
- `nodeids` (~2040 tok)

## guitar-teacher/.venv/

- `.gitignore` — Git ignore rules (~19 tok)
- `pyvenv.cfg` (~84 tok)

## guitar-teacher/.venv/bin/

- `activate` — This file must be used with "source bin/activate" *from bash* (~586 tok)
- `activate.csh` — This file must be used with "source bin/activate.csh" *from csh*. (~249 tok)
- `activate.fish` — This file must be used with "source <venv>/bin/activate.fish" *from fish* (~588 tok)
- `Activate.ps1` — Declares from (~2409 tok)
- `distro` (~54 tok)
- `dotenv` (~54 tok)
- `fastapi` (~53 tok)
- `guitar-teacher` (~55 tok)
- `guitar-teacher-api` (~57 tok)
- `httpx` (~52 tok)
- `openai` (~53 tok)
- `pip` (~56 tok)
- `pip3` (~56 tok)
- `pip3.14` (~56 tok)
- `py.test` (~56 tok)
- `pygmentize` (~55 tok)
- `pytest` (~56 tok)
- `tqdm` (~52 tok)
- `uvicorn` (~54 tok)
- `watchfiles` (~54 tok)
- `websockets` (~54 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/

- `__editable___gp2tab_0_1_0_finder.py` — _EditableFinder: find_spec, find_spec, find_module, install (~979 tok)
- `__editable___guitar_teacher_0_1_0_finder.py` — _EditableFinder: find_spec, find_spec, find_module, install (~976 tok)
- `__editable__.gp2tab-0.1.0.pth` (~23 tok)
- `__editable__.guitar_teacher-0.1.0.pth` (~27 tok)
- `py.py` — shim for pylib going away (~94 tok)
- `typing_extensions.py` — _Sentinel: final, done, done, disjoint_base + 1 more (~45837 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/_pytest/

- `__init__.py` (~112 tok)
- `_argcomplete.py` — Allow bash-completion for argparse with argcomplete if installed. (~1079 tok)
- `_version.py` — file generated by setuptools-scm (~202 tok)
- `cacheprovider.py` — Implementation of the cache provider. (~6614 tok)
- `capture.py` — Per-test stdout/stderr capturing mechanism. (~10523 tok)
- `compat.py` — Python version compatibility code and random general utilities. (~2930 tok)
- `debugging.py` — Interactive debugging with PDB, the Python Debugger. (~3985 tok)
- `deprecated.py` — Deprecation messages and bits of code used elsewhere in the codebase that (~1032 tok)
- `doctest.py` — Discover and run doctests in modules and test files. (~7280 tok)
- `faulthandler.py` — pytest_addoption, pytest_configure, pytest_unconfigure, get_stderr_fileno + 5 more (~1215 tok)
- `fixtures.py` — mypy: allow-untyped-defs (~22481 tok)
- `freeze_support.py` — Provides a function to report all internal modules for using freezing (~372 tok)
- `helpconfig.py` — Version info, help messages, tracing configuration. (~2863 tok)
- `hookspec.py` — Hook specifications for pytest plugins which are invoked by pytest itself (~12292 tok)
- `junitxml.py` — Report test results in JUnit-XML format, for use with Jenkins and build (~7292 tok)
- `legacypath.py` — Add backward compatibility support for the legacy py path type. (~4740 tok)
- `logging.py` — Access and control log capturing. (~10067 tok)
- `main.py` — Core implementation of the testing process: init, session, runtest loop. (~12125 tok)
- `monkeypatch.py` — Monkeypatching and mocking functionality. (~4429 tok)
- `nodes.py` — mypy: allow-untyped-defs (~7583 tok)
- `outcomes.py` — Exception classes and constants handling test outcomes as well as (~2888 tok)
- `pastebin.py` — Submit failure or test session information to a pastebin service. (~1188 tok)
- `pathlib.py` — URL patterns: 1 routes (~10823 tok)
- `py.typed` (~0 tok)
- `pytester_assertions.py` — Helper plugin for pytester; should not be loaded on its own. (~644 tok)
- `pytester.py` — (Disabled by default) support for testing pytest and pytest plugins. (~17826 tok)
- `python_api.py` — mypy: allow-untyped-defs (~9067 tok)
- `python.py` — Python test discovery, setup and run of test functions. (~19644 tok)
- `raises.py` — of: raises, raises, raises, raises + 4 more (~17167 tok)
- `recwarn.py` — Record warnings during test function execution. (~3825 tok)
- `reports.py` — mypy: allow-untyped-defs (~6638 tok)
- `runner.py` — Basic collect and runtest protocol implementations. (~5653 tok)
- `scope.py` — Scope: next_lower, next_higher, from_user (~783 tok)
- `setuponly.py` — pytest_addoption, pytest_fixture_setup, pytest_fixture_post_finalizer, pytest_cmdline_main (~905 tok)
- `setupplan.py` — pytest_addoption, pytest_fixture_setup, pytest_cmdline_main (~339 tok)
- `skipping.py` — Support for skip/xfail functions and markers. (~3089 tok)
- `stash.py` — View: get (~883 tok)
- `stepwise.py` — class: pytest_addoption, pytest_configure, pytest_sessionfinish, last_cache_date + 7 more (~2197 tok)
- `subtests.py` — Builtin plugin that adds subtests support. (~3784 tok)
- `terminal.py` — Terminal reporting of the full testing process. (~18410 tok)
- `terminalprogress.py` — A plugin to register the TerminalProgressPlugin plugin. (~330 tok)
- `threadexception.py` — ThreadExceptionMeta: collect_thread_exception, cleanup, thread_exception_hook, pytest_configure + 3 more (~1416 tok)
- `timing.py` — Indirection for time functions. (~888 tok)
- `tmpdir.py` — Support for providing temporary directories to test functions. (~3254 tok)
- `tracemalloc.py` — tracemalloc_message (~223 tok)
- `unittest.py` — Discover and run std-library "unittest" style tests. (~6902 tok)
- `unraisableexception.py` — UnraisableMeta: gc_collect_harder, collect_unraisable, cleanup, unraisable_hook + 4 more (~1480 tok)
- `warning_types.py` — PytestWarning: simple, format, warn_explicit_for (~1257 tok)
- `warnings.py` — mypy: allow-untyped-defs (~1484 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/_pytest/_code/

- `__init__.py` — Python inspection/code generation API. (~149 tok)
- `code.py` — mypy: allow-untyped-defs (~15954 tok)
- `source.py` — mypy: allow-untyped-defs (~2221 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/_pytest/_io/

- `__init__.py` (~55 tok)
- `pprint.py` — mypy: allow-untyped-defs (~5607 tok)
- `saferepr.py` — SafeRepr: repr, repr_instance, safeformat, saferepr + 1 more (~1167 tok)
- `terminalwriter.py` — Helper functions for writing to terminals and files. (~2570 tok)
- `wcwidth.py` — wcwidth, wcswidth (~369 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/_pytest/_py/

- `__init__.py` (~0 tok)
- `error.py` — create errno-specific classes for IO or os calls. (~993 tok)
- `path.py` — local path implementation. (~14063 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/_pytest/assertion/

- `__init__.py` — Support for presenting detailed information in failing assertions. (~2035 tok)
- `rewrite.py` — .py" for example) we can't bail out based (~13774 tok)
- `truncate.py` — Utilities for truncating assertion output. (~1554 tok)
- `util.py` — Utilities for assertion debugging. (~5875 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/_pytest/config/

- `__init__.py` — Command line options, config-file and conftest.py processing. (~22579 tok)
- `argparsing.py` — mypy: allow-untyped-defs (~5840 tok)
- `compat.py` — URL configuration (~842 tok)
- `exceptions.py` — Declares UsageError (~90 tok)
- `findpaths.py` — URL configuration (~3680 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/_pytest/mark/

- `__init__.py` — Generic mechanism for marking and selecting python functions. (~2820 tok)
- `expression.py` — TokenType: lex, accept, accept, accept + 10 more (~3213 tok)
- `structures.py` — mypy: allow-untyped-defs (~6593 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/_yaml/

- `__init__.py` — This is a stub package designed to roughly emulate the _yaml (~401 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/annotated_doc-0.0.4.dist-info/

- `entry_points.txt` (~9 tok)
- `INSTALLER` (~2 tok)
- `METADATA` — Declares attributes (~1751 tok)
- `RECORD` (~232 tok)
- `WHEEL` (~24 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/annotated_doc-0.0.4.dist-info/licenses/

- `LICENSE` — Project license (~290 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/annotated_doc/

- `__init__.py` (~15 tok)
- `main.py` — Doc: hi (~308 tok)
- `py.typed` (~0 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/annotated_types-0.7.0.dist-info/

- `INSTALLER` (~2 tok)
- `METADATA` — Declares MyClass (~4013 tok)
- `RECORD` (~214 tok)
- `WHEEL` (~24 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/annotated_types-0.7.0.dist-info/licenses/

- `LICENSE` — Project license (~289 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/annotated_types/

- `__init__.py` — Declares from (~3949 tok)
- `py.typed` (~0 tok)
- `test_cases.py` — Test file (~1834 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/

- `__init__.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~905 tok)
- `_base_client.py` — PageInfo: has_next_page, next_page_info, iter_pages, get_next_page + 2 more (~22726 tok)
- `_client.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~6601 tok)
- `_compat.py` — _ModelDumpKwargs: parse_date, parse_datetime, get_args, is_union + 14 more (~2007 tok)
- `_constants.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~253 tok)
- `_exceptions.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~1164 tok)
- `_files.py` — is_base64_file_input, is_file_content, assert_is_file_content, to_httpx_files + 7 more (~1036 tok)
- `_legacy_response.py` — LegacyAPIResponse: request_id, parse, parse, parse + 10 more (~4964 tok)
- `_models.py` — _ConfigProtocol: model_fields_set, to_dict, to_json, construct + 1 more (~9722 tok)
- `_qs.py` — Querystring: parse, stringify, stringify_items (~1380 tok)
- `_resource.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~309 tok)
- `_response.py` — BaseAPIResponse: headers, http_request, status_code, url + 8 more (~8766 tok)
- `_streaming.py` — Note: initially copied from https://github.com/florimondmanca/httpx-sse/blob/master/src/httpx_sse/_decoders.py (~4197 tok)
- `_types.py` — View: create, get (~2199 tok)
- `_version.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~47 tok)
- `pagination.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~1472 tok)
- `py.typed` (~0 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/_decoders/

- `jsonl.py` — JSONLDecoder: close, close (~1003 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/_utils/

- `__init__.py` — Declares as (~659 tok)
- `_compat.py` — get_args, get_origin, is_union, is_typeddict + 3 more (~352 tok)
- `_datetime_parse.py` — parse_datetime, parse_date (~1202 tok)
- `_httpx.py` — is_ipv4_hostname, is_ipv6_hostname, get_environment_proxies (~598 tok)
- `_json.py` — _CustomEncoder: openapi_dumps, default (~275 tok)
- `_logs.py` — setup_logging (~224 tok)
- `_proxy.py` — Declares LazyProxy (~565 tok)
- `_reflection.py` — function_has_argument, assert_signatures_in_sync (~390 tok)
- `_resources_proxy.py` — Declares ResourcesProxy (~173 tok)
- `_streams.py` — consume_sync_iterator, consume_async_iterator (~83 tok)
- `_sync.py` — to_thread, asyncify, blocking_func, wrapper (~454 tok)
- `_transform.py` — PropertyInfo: maybe_transform, transform, async_maybe_transform, async_transform (~4572 tok)
- `_typing.py` — is: is_annotated_type, is_list_type, is_sequence_type, is_iterable_type + 7 more (~1375 tok)
- `_utils.py` — URL configuration (~3501 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/lib/

- `__init__.py` (~29 tok)
- `_files.py` — files_from_dir, async_files_from_dir (~349 tok)
- `_stainless_helpers.py` — Tracking for SDK helper usage via the x-stainless-helper header. (~624 tok)
- `.keep` (~60 tok)
- `foundry.md` — Anthropic Foundry (~687 tok)
- `foundry.py` — MutuallyExclusiveAuthError: batches, batches, messages, batches + 6 more (~5011 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/lib/_extras/

- `__init__.py` (~16 tok)
- `_common.py` — Declares MissingDependencyError (~100 tok)
- `_google_auth.py` — Declares GoogleAuthProxy (~197 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/lib/_parse/

- `_response.py` — parse_text, parse_beta_response, parse_response (~703 tok)
- `_transform.py` — get_transformed_string, transform_schema (~1510 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/lib/bedrock/

- `__init__.py` (~31 tok)
- `_auth.py` — get_auth_headers (~540 tok)
- `_beta_messages.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~914 tok)
- `_beta.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~950 tok)
- `_client.py` — BaseBedrockClient: copy (~4548 tok)
- `_stream_decoder.py` — AWSEventStreamDecoder: get_response_stream_shape, iter_bytes, aiter_bytes (~729 tok)
- `_stream.py` — Declares BedrockStream (~249 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/lib/streaming/

- `__init__.py` (~440 tok)
- `_beta_messages.py` — BetaMessageStream: response, request_id, close, get_final_message + 11 more (~6013 tok)
- `_beta_types.py` — ParsedBetaTextEvent: parsed_snapshot (~832 tok)
- `_messages.py` — MessageStream: response, request_id, close, get_final_message + 11 more (~5406 tok)
- `_types.py` — TextEvent: parsed_snapshot (~953 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/lib/tools/

- `__init__.py` (~241 tok)
- `_beta_builtin_memory_tool.py` — URL configuration (~9516 tok)
- `_beta_compaction_control.py` — Declares CompactionControl (~604 tok)
- `_beta_functions.py` — ToolError: to_dict, call, name, to_dict + 13 more (~4446 tok)
- `_beta_runner.py` — RequestOptions: set_messages_params, append_messages, until_done, generate_tool_call_response (~7265 tok)
- `mcp.py` — Helpers for integrating MCP (Model Context Protocol) SDK types with the Anthropic SDK. (~4486 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/lib/vertex/

- `__init__.py` (~30 tok)
- `_auth.py` — load_auth, refresh_auth (~434 tok)
- `_beta_messages.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~972 tok)
- `_beta.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~950 tok)
- `_client.py` — BaseVertexClient: region, project_id, copy, copy (~4749 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/resources/

- `__init__.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~453 tok)
- `completions.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~10457 tok)
- `models.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~3544 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/resources/beta/

- `__init__.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~532 tok)
- `beta.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~1728 tok)
- `files.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~7732 tok)
- `models.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~3576 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/resources/beta/messages/

- `__init__.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~243 tok)
- `batches.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~10435 tok)
- `messages.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~50248 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/resources/beta/skills/

- `__init__.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~239 tok)
- `skills.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~7154 tok)
- `versions.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~7204 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/resources/messages/

- `__init__.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~257 tok)
- `batches.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~8236 tok)
- `messages.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~38651 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/tools/

- `__init__.py` (~7 tok)
- `memory.py` (~100 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/types/

- `__init__.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~5346 tok)
- `anthropic_beta_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~296 tok)
- `base64_image_source_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~208 tok)
- `base64_pdf_source_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~196 tok)
- `base64_pdf_source.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~90 tok)
- `bash_code_execution_output_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~110 tok)
- `bash_code_execution_output_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~91 tok)
- `bash_code_execution_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~179 tok)
- `bash_code_execution_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~144 tok)
- `bash_code_execution_tool_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~277 tok)
- `bash_code_execution_tool_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~187 tok)
- `bash_code_execution_tool_result_error_code.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~104 tok)
- `bash_code_execution_tool_result_error_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~153 tok)
- `bash_code_execution_tool_result_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~133 tok)
- `beta_api_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~77 tok)
- `beta_authentication_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~86 tok)
- `beta_billing_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~80 tok)
- `beta_error_response.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~108 tok)
- `beta_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~308 tok)
- `beta_gateway_timeout_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~84 tok)
- `beta_invalid_request_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~87 tok)
- `beta_not_found_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~82 tok)
- `beta_overloaded_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~83 tok)
- `beta_permission_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~83 tok)
- `beta_rate_limit_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~82 tok)
- `cache_control_ephemeral_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~152 tok)
- `cache_creation.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~117 tok)
- `capability_support.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~94 tok)
- `citation_char_location_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~154 tok)
- `citation_char_location.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~136 tok)
- `citation_content_block_location_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~162 tok)
- `citation_content_block_location.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~143 tok)
- `citation_page_location_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~155 tok)
- `citation_page_location.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~136 tok)
- `citation_search_result_location_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~168 tok)
- `citation_web_search_result_location_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~148 tok)
- `citations_config_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~78 tok)
- `citations_config.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~59 tok)
- `citations_delta.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~285 tok)
- `citations_search_result_location.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~138 tok)
- `citations_web_search_result_location.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~123 tok)
- `code_execution_output_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~106 tok)
- `code_execution_output_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~87 tok)
- `code_execution_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~172 tok)
- `code_execution_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~137 tok)
- `code_execution_tool_20250522_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~314 tok)
- `code_execution_tool_20250825_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~314 tok)
- `code_execution_tool_20260120_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~344 tok)
- `code_execution_tool_result_block_content.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~167 tok)
- `code_execution_tool_result_block_param_content_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~197 tok)
- `code_execution_tool_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~251 tok)
- `code_execution_tool_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~156 tok)
- `code_execution_tool_result_error_code.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~95 tok)
- `code_execution_tool_result_error_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~145 tok)
- `code_execution_tool_result_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~126 tok)
- `completion_create_params.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~1383 tok)
- `completion.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~329 tok)
- `container_upload_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~218 tok)
- `container_upload_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~102 tok)
- `container.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~132 tok)
- `content_block_delta_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~89 tok)
- `content_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~530 tok)
- `content_block_source_content_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~118 tok)
- `content_block_source_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~146 tok)
- `content_block_start_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~89 tok)
- `content_block_stop_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~87 tok)
- `content_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~415 tok)
- `context_management_capability.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~222 tok)
- `direct_caller_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~102 tok)
- `direct_caller.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~86 tok)
- `document_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~313 tok)
- `document_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~226 tok)
- `effort_capability.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~205 tok)
- `encrypted_code_execution_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~207 tok)
- `encrypted_code_execution_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~172 tok)
- `image_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~220 tok)
- `input_json_delta.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~96 tok)
- `json_output_format_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~121 tok)
- `memory_tool_20250818_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~324 tok)
- `message_count_tokens_params.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~2056 tok)
- `message_count_tokens_tool_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~550 tok)
- `message_create_params.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~3357 tok)
- `message_delta_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~80 tok)
- `message_delta_usage.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~234 tok)
- `message_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~689 tok)
- `message_start_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~80 tok)
- `message_stop_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~78 tok)
- `message_stream_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~82 tok)
- `message_tokens_count.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~94 tok)
- `message.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~1061 tok)
- `metadata_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~170 tok)
- `model_capabilities.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~386 tok)
- `model_info.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~300 tok)
- `model_list_params.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~279 tok)
- `model_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~218 tok)
- `model.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~205 tok)
- `output_config_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~192 tok)
- `parsed_message.py` — ParsedTextBlock: parsed_output (~467 tok)
- `plain_text_source_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~110 tok)
- `plain_text_source.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~88 tok)
- `raw_content_block_delta_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~113 tok)
- `raw_content_block_delta.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~175 tok)
- `raw_content_block_start_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~492 tok)
- `raw_content_block_stop_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~86 tok)
- `raw_message_delta_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~417 tok)
- `raw_message_start_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~92 tok)
- `raw_message_stop_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~77 tok)
- `raw_message_stream_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~261 tok)
- `redacted_thinking_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~103 tok)
- `redacted_thinking_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~84 tok)
- `search_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~228 tok)
- `server_tool_caller_20260120_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~107 tok)
- `server_tool_caller_20260120.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~88 tok)
- `server_tool_caller_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~120 tok)
- `server_tool_caller.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~100 tok)
- `server_tool_usage.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~98 tok)
- `server_tool_use_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~369 tok)
- `server_tool_use_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~295 tok)
- `signature_delta.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~80 tok)
- `stop_reason.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~79 tok)
- `text_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~189 tok)
- `text_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~190 tok)
- `text_citation_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~241 tok)
- `text_citation.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~243 tok)
- `text_delta.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~75 tok)
- `text_editor_code_execution_create_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~123 tok)
- `text_editor_code_execution_create_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~104 tok)
- `text_editor_code_execution_str_replace_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~182 tok)
- `text_editor_code_execution_str_replace_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~164 tok)
- `text_editor_code_execution_tool_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~397 tok)
- `text_editor_code_execution_tool_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~298 tok)
- `text_editor_code_execution_tool_result_error_code.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~106 tok)
- `text_editor_code_execution_tool_result_error_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~181 tok)
- `text_editor_code_execution_tool_result_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~164 tok)
- `text_editor_code_execution_view_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~170 tok)
- `text_editor_code_execution_view_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~154 tok)
- `thinking_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~105 tok)
- `thinking_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~83 tok)
- `thinking_capability.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~124 tok)
- `thinking_config_adaptive_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~196 tok)
- `thinking_config_disabled_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~94 tok)
- `thinking_config_enabled_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~310 tok)
- `thinking_config_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~163 tok)
- `thinking_delta.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~79 tok)
- `thinking_types.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~140 tok)
- `tool_bash_20250124_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~322 tok)
- `tool_choice_any_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~154 tok)
- `tool_choice_auto_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~160 tok)
- `tool_choice_none_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~104 tok)
- `tool_choice_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~161 tok)
- `tool_choice_tool_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~179 tok)
- `tool_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~786 tok)
- `tool_reference_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~187 tok)
- `tool_reference_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~82 tok)
- `tool_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~309 tok)
- `tool_search_tool_bm25_20251119_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~326 tok)
- `tool_search_tool_regex_20251119_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~327 tok)
- `tool_search_tool_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~267 tok)
- `tool_search_tool_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~178 tok)
- `tool_search_tool_result_error_code.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~93 tok)
- `tool_search_tool_result_error_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~140 tok)
- `tool_search_tool_result_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~140 tok)
- `tool_search_tool_search_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~150 tok)
- `tool_search_tool_search_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~124 tok)
- `tool_text_editor_20250124_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~331 tok)
- `tool_text_editor_20250429_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~334 tok)
- `tool_text_editor_20250728_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~383 tok)
- `tool_union_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~543 tok)
- `tool_use_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~289 tok)
- `tool_use_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~228 tok)
- `url_image_source_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~94 tok)
- `url_pdf_source_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~93 tok)
- `usage.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~336 tok)
- `user_location_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~204 tok)
- `web_fetch_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~168 tok)
- `web_fetch_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~144 tok)
- `web_fetch_tool_20250910_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~527 tok)
- `web_fetch_tool_20260209_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~527 tok)
- `web_fetch_tool_20260309_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~620 tok)
- `web_fetch_tool_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~358 tok)
- `web_fetch_tool_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~290 tok)
- `web_fetch_tool_result_error_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~140 tok)
- `web_fetch_tool_result_error_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~120 tok)
- `web_fetch_tool_result_error_code.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~123 tok)
- `web_search_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~136 tok)
- `web_search_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~114 tok)
- `web_search_tool_20250305_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~529 tok)
- `web_search_tool_20260209_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~529 tok)
- `web_search_tool_request_error_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~139 tok)
- `web_search_tool_result_block_content.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~125 tok)
- `web_search_tool_result_block_param_content_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~155 tok)
- `web_search_tool_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~331 tok)
- `web_search_tool_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~263 tok)
- `web_search_tool_result_error_code.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~102 tok)
- `web_search_tool_result_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~119 tok)

## guitar-teacher/.venv/lib/python3.14/site-packages/anthropic/types/beta/

- `__init__.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~6880 tok)
- `beta_all_thinking_turns_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~91 tok)
- `beta_base64_image_source_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~212 tok)
- `beta_base64_pdf_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~74 tok)
- `beta_base64_pdf_source_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~200 tok)
- `beta_base64_pdf_source.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~92 tok)
- `beta_bash_code_execution_output_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~112 tok)
- `beta_bash_code_execution_output_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~94 tok)
- `beta_bash_code_execution_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~185 tok)
- `beta_bash_code_execution_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~150 tok)
- `beta_bash_code_execution_tool_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~290 tok)
- `beta_bash_code_execution_tool_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~197 tok)
- `beta_bash_code_execution_tool_result_error_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~162 tok)
- `beta_bash_code_execution_tool_result_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~136 tok)
- `beta_cache_control_ephemeral_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~154 tok)
- `beta_cache_creation.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~119 tok)
- `beta_capability_support.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~96 tok)
- `beta_citation_char_location_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~156 tok)
- `beta_citation_char_location.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~138 tok)
- `beta_citation_config.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~61 tok)
- `beta_citation_content_block_location_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~164 tok)
- `beta_citation_content_block_location.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~146 tok)
- `beta_citation_page_location_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~157 tok)
- `beta_citation_page_location.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~139 tok)
- `beta_citation_search_result_location_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~171 tok)
- `beta_citation_search_result_location.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~140 tok)
- `beta_citation_web_search_result_location_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~150 tok)
- `beta_citations_config_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~80 tok)
- `beta_citations_delta.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~306 tok)
- `beta_citations_web_search_result_location.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~126 tok)
- `beta_clear_thinking_20251015_edit_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~223 tok)
- `beta_clear_thinking_20251015_edit_response.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~156 tok)
- `beta_clear_tool_uses_20250919_edit_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~425 tok)
- `beta_clear_tool_uses_20250919_edit_response.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~153 tok)
- `beta_code_execution_output_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~109 tok)
- `beta_code_execution_output_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~90 tok)
- `beta_code_execution_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~178 tok)
- `beta_code_execution_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~143 tok)
- `beta_code_execution_tool_20250522_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~320 tok)
- `beta_code_execution_tool_20250825_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~320 tok)
- `beta_code_execution_tool_20260120_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~350 tok)
- `beta_code_execution_tool_result_block_content.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~180 tok)
- `beta_code_execution_tool_result_block_param_content_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~210 tok)
- `beta_code_execution_tool_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~261 tok)
- `beta_code_execution_tool_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~162 tok)
- `beta_code_execution_tool_result_error_code.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~97 tok)
- `beta_code_execution_tool_result_error_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~151 tok)
- `beta_code_execution_tool_result_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~132 tok)
- `beta_compact_20260112_edit_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~250 tok)
- `beta_compaction_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~295 tok)
- `beta_compaction_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~202 tok)
- `beta_compaction_content_block_delta.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~103 tok)
- `beta_compaction_iteration_usage.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~261 tok)
- `beta_container_params.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~154 tok)
- `beta_container_upload_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~224 tok)
- `beta_container_upload_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~104 tok)
- `beta_container.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~179 tok)
- `beta_content_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~710 tok)
- `beta_content_block_source_content_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~128 tok)
- `beta_content_block_source_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~152 tok)
- `beta_content_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~538 tok)
- `beta_context_management_capability.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~230 tok)
- `beta_context_management_config_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~228 tok)
- `beta_context_management_response.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~230 tok)
- `beta_count_tokens_context_management_response.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~98 tok)
- `beta_direct_caller_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~104 tok)
- `beta_direct_caller.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~88 tok)
- `beta_document_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~239 tok)
- `beta_effort_capability.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~215 tok)
- `beta_encrypted_code_execution_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~213 tok)
- `beta_encrypted_code_execution_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~178 tok)
- `beta_file_document_source_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~100 tok)
- `beta_file_image_source_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~99 tok)
- `beta_image_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~260 tok)
- `beta_input_json_delta.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~84 tok)
- `beta_input_tokens_clear_at_least_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~105 tok)
- `beta_input_tokens_trigger_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~102 tok)
- `beta_iterations_usage.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~180 tok)
- `beta_json_output_format_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~123 tok)
- `beta_mcp_tool_config_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~104 tok)
- `beta_mcp_tool_default_config_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~108 tok)
- `beta_mcp_tool_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~126 tok)
- `beta_mcp_tool_use_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~207 tok)
- `beta_mcp_tool_use_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~127 tok)
- `beta_mcp_toolset_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~355 tok)
- `beta_memory_tool_20250818_command.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~337 tok)
- `beta_memory_tool_20250818_create_command.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~130 tok)
- `beta_memory_tool_20250818_delete_command.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~114 tok)
- `beta_memory_tool_20250818_insert_command.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~156 tok)
- `beta_memory_tool_20250818_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~330 tok)
- `beta_memory_tool_20250818_rename_command.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~132 tok)
- `beta_memory_tool_20250818_str_replace_command.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~150 tok)
- `beta_memory_tool_20250818_view_command.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~149 tok)
- `beta_message_delta_usage.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~388 tok)
- `beta_message_iteration_usage.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~257 tok)
- `beta_message_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~137 tok)
- `beta_message_tokens_count.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~178 tok)
- `beta_message.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~1159 tok)
- `beta_metadata_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~172 tok)
- `beta_model_capabilities.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~410 tok)
- `beta_model_info.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~306 tok)
- `beta_output_config_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~198 tok)
- `beta_plain_text_source_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~112 tok)
- `beta_plain_text_source.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~90 tok)
- `beta_raw_content_block_delta_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~119 tok)
- `beta_raw_content_block_delta.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~246 tok)
- `beta_raw_content_block_start_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~615 tok)
- `beta_raw_content_block_stop_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~88 tok)
- `beta_raw_message_delta_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~497 tok)
- `beta_raw_message_start_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~98 tok)
- `beta_raw_message_stop_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~79 tok)
- `beta_raw_message_stream_event.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~286 tok)
- `beta_redacted_thinking_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~105 tok)
- `beta_redacted_thinking_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~86 tok)
- `beta_request_document_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~377 tok)
- `beta_request_mcp_server_tool_configuration_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~126 tok)
- `beta_request_mcp_server_url_definition_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~184 tok)
- `beta_request_mcp_tool_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~218 tok)
- `beta_search_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~241 tok)
- `beta_server_tool_caller_20260120_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~109 tok)
- `beta_server_tool_caller_20260120.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~90 tok)
- `beta_server_tool_caller_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~122 tok)
- `beta_server_tool_caller.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~103 tok)
- `beta_server_tool_usage.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~101 tok)
- `beta_server_tool_use_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~386 tok)
- `beta_server_tool_use_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~309 tok)
- `beta_signature_delta.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~83 tok)
- `beta_skill_params.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~173 tok)
- `beta_skill.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~150 tok)
- `beta_stop_reason.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~105 tok)
- `beta_text_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~198 tok)
- `beta_text_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~196 tok)
- `beta_text_citation_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~262 tok)
- `beta_text_citation.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~264 tok)
- `beta_text_delta.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~77 tok)
- `beta_text_editor_code_execution_create_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~126 tok)
- `beta_text_editor_code_execution_create_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~107 tok)
- `beta_text_editor_code_execution_str_replace_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~184 tok)
- `beta_text_editor_code_execution_str_replace_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~166 tok)
- `beta_text_editor_code_execution_tool_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~420 tok)
- `beta_text_editor_code_execution_tool_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~316 tok)
- `beta_text_editor_code_execution_tool_result_error_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~176 tok)
- `beta_text_editor_code_execution_tool_result_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~160 tok)
- `beta_text_editor_code_execution_view_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~173 tok)
- `beta_text_editor_code_execution_view_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~157 tok)
- `beta_thinking_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~108 tok)
- `beta_thinking_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~86 tok)
- `beta_thinking_capability.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~130 tok)
- `beta_thinking_config_adaptive_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~198 tok)
- `beta_thinking_config_disabled_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~96 tok)
- `beta_thinking_config_enabled_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~312 tok)
- `beta_thinking_config_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~177 tok)
- `beta_thinking_delta.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~82 tok)
- `beta_thinking_turns_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~100 tok)
- `beta_thinking_types.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~148 tok)
- `beta_tool_bash_20241022_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~328 tok)
- `beta_tool_bash_20250124_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~328 tok)
- `beta_tool_choice_any_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~156 tok)
- `beta_tool_choice_auto_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~162 tok)
- `beta_tool_choice_none_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~106 tok)
- `beta_tool_choice_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~180 tok)
- `beta_tool_choice_tool_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~182 tok)
- `beta_tool_computer_use_20241022_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~410 tok)
- `beta_tool_computer_use_20250124_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~410 tok)
- `beta_tool_computer_use_20251124_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~440 tok)
- `beta_tool_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~763 tok)
- `beta_tool_reference_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~193 tok)
- `beta_tool_reference_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~85 tok)
- `beta_tool_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~345 tok)
- `beta_tool_search_tool_bm25_20251119_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~332 tok)
- `beta_tool_search_tool_regex_20251119_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~333 tok)
- `beta_tool_search_tool_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~281 tok)
- `beta_tool_search_tool_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~188 tok)
- `beta_tool_search_tool_result_error_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~138 tok)
- `beta_tool_search_tool_result_error.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~139 tok)
- `beta_tool_search_tool_search_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~156 tok)
- `beta_tool_search_tool_search_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~130 tok)
- `beta_tool_text_editor_20241022_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~337 tok)
- `beta_tool_text_editor_20250124_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~337 tok)
- `beta_tool_text_editor_20250429_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~340 tok)
- `beta_tool_text_editor_20250728_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~389 tok)
- `beta_tool_union_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~795 tok)
- `beta_tool_use_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~306 tok)
- `beta_tool_use_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~242 tok)
- `beta_tool_uses_keep_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~98 tok)
- `beta_tool_uses_trigger_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~100 tok)
- `beta_url_image_source_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~97 tok)
- `beta_url_pdf_source_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~96 tok)
- `beta_usage.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~527 tok)
- `beta_user_location_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~206 tok)
- `beta_web_fetch_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~181 tok)
- `beta_web_fetch_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~150 tok)
- `beta_web_fetch_tool_20250910_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~537 tok)
- `beta_web_fetch_tool_20260209_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~537 tok)
- `beta_web_fetch_tool_20260309_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~630 tok)
- `beta_web_fetch_tool_result_block_param.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~382 tok)
- `beta_web_fetch_tool_result_block.py` — File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details. (~311 tok)

## guitar-teacher/guitar_teacher/api/

- `github_client.py` — GitHub Contents API client for reading/writing repo files. (~1380 tok)

## guitar-teacher/guitar_teacher/api/routers/

- `queue.py` — GP file queue endpoints — upload, list, process. (~1516 tok)

## guitar-teacher/guitar_teacher/lessons/

- `generator.py` — Generate lesson plans from SoloAnalysis. (~7573 tok)

## songs/guthrie-govan/man-of-steel/

- `.context.md` — Man Of Steel — Progress (~358 tok)
