# Original conversation and Jeric's device

## Exact Codex session

Session ID:

```text
01a1455f-dff1-7d51-adce-19f0c50ee25e
```

Session directory on Jeric's Mac:

```text
/Users/jeric/.codex/sessions/2026/10/16/
```

Full conversation file:

```text
/Users/jeric/.codex/sessions/2026/10/16/rollout-2026-10-16T23-41-13-01a1455f-dff1-7d51-adce-19f0c50ee25e.jsonl
```

The session metadata was read directly during the 2026-11-04 handoff. Its original working directory
is `/Users/jeric/Documents/GitHub/scripts`, and it starts on 2026-10-16. It continues through the
later finance-platform, reporting, landing and documentation work. The date in its folder/filename
is its start date, not the date of the latest conversation.

The raw file is large and may include credentials, private records, screenshots and tool output.
Do not commit, upload or paste it wholesale. The user explicitly requested a repository summary
and this local path instead of a copied transcript. Read only the relevant ranges/topics and
redact sensitive values from any excerpts.

## Finding relevant messages

The file is JSONL, one event per line. Human-visible messages are `response_item` records whose
`payload.type` is `message`, with `payload.role` equal to `user` or `assistant`. Text is inside
`payload.content` entries of type `input_text` or `output_text`. Other event types include tool
activity, metadata and context; do not dump everything just to find one decision.

Use a streaming JSON reader for a bounded keyword/date search. Useful topics include `T-Chart`,
`CORE`, `HELPER`, `create_journal_entry`, `feature/data-upload`, `Create Entry`, `notes`, `audit link`,
`develop`, `Income Statement`, `General Ledger` and `landing`. Conversation text explains decisions;
current source and a current live read determine implementation/deployment truth.

## Workspace and artifact locations

| Location | Contents |
| --- | --- |
| `/Users/jeric/Documents/GitHub/finance-platform` | Current app, canonical sender copies, Edge writer and knowledge base |
| `/Users/jeric/Documents/GitHub/scripts` | Original Airtable work, migration utilities and operational guides |
| `/Users/jeric/Documents/GitHub/scripts/outputs` | Dated workbook downloads, audits, source readbacks and historical test evidence |
| `/Users/jeric/Documents/GitHub/scripts/airtable-automations` | Older sender working folders; compare with current canonical copies before editing |
| `/Users/jeric/Desktop/Chicago Brass Login Concepts - 2026-11-04` | Landing concept images, prompts, background and visual verification artifacts |
| `/Users/jeric/Desktop/Income Statement Concepts - 2026-11-04` | Earlier report/login concept galleries and scale references |
| `/Users/jeric/Documents/GitHub/scripts/outputs/finance-report-design-implementation-2026-11-04` | Report layout comparison screenshots |

Do not copy environment files from the scripts workspace into this repository. Existing local
credentials are not proof of current scope, expiry or target project. Verify resource access and
the intended project without printing secrets. The app's project is DUAL ENTRY, not another project
that may be connected to a different repo's MCP configuration.

## Browser and local development

Use Google Chrome's Jeric profile, associated with `jericnarte912@gmail.com`. Enumerate browser
profiles/tabs; connection IDs change. BriarBear is the wrong account for this work. Never click
Request access in Airtable; select the correct signed-in profile instead.

Finance has used port 3010. Other apps can occupy 3000/3001 and must not be stopped or reconfigured.
Restore viewport emulation and close completed agent-created tabs while preserving user tabs.
Saved screenshots and dated logs are evidence, not a substitute for checking current code and UI.
