# Changelog

## 1.1.0 (2026-03-31)

Squashed release — all fixes and features from 1.0.0 through 1.0.21 consolidated into a clean starting point.

### Features

- **Streaming progress** — MCP logging notifications for each debate phase (classification, round start, model responses, consensus, synthesis)
- **Cost tracking** — debate cost (`cost_usd`) included in output
- **Share URLs** — every debate generates a shareable link
- **Enriched output** — final answer, individual model positions with confidence scores, consensus percentage, and total rounds
- **Flat event handling** — client handles both flat and nested SSE event structures
- **CLI improvements** — `dt` command with cost display, share URLs, and robust event parsing

### Fixes

- npx startup: resolve bin symlink via `realpathSync` before entry-point guard
- Error handling: catch API errors in `run_debate` instead of crashing on null synthesis
- Synthesis parsing: handle array and string fields, flat and nested events
- CLI: fix `event.data` access for flat events
- History: align response parsing with actual API schema (`pagination` object, `models_config`, `question_preview`)
- Plugin config: correct `userConfig` schema, `sensitive: false` for API key

### Breaking changes

- None. Drop-in replacement for 1.0.x.

---

## 1.0.0 – 1.0.21

Initial development releases. Superseded by 1.1.0. These versions contained incremental bug fixes for npx startup, plugin config schema, CLI binary naming, and event parsing. All fixes are included in 1.1.0.
