# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, etc.) working in this repo. Humans: see [README.md](README.md) (Thai).

## What this is

Node.js scripts that render the user's **next meeting of the day** as a 240×240 image and upload it to a Smart Clock Pro Ultra / GeekMagic display on the LAN. Events come from a Google Calendar **secret iCal URL** (no Google Cloud project, no OAuth), or from mock data. Reference project: `../mini-display-receiver-photo` (Electron app; the raw-TCP upload logic in `src/device.mjs` is ported from its `src/main/fetcher.ts`).

## Setup checklist

Run these in order. Stop and report on the first failure. Do not skip verification steps.

1. **Node.js ≥ 22.** `node -v`. If missing or older: `nvm install` (reads `.nvmrc`) or `brew install node@22`. On Windows, tell the user to install LTS from https://nodejs.org.
2. **Project files.** User may have copied the project as a ZIP, so there may be no git repo. Do not assume git. Work in the folder containing `package.json`.
3. **Dependencies.** `npm install`.
4. **`.env`.** If `.env` does not exist: `cp .env.example .env`. Then ask the user for (never invent):
   - `DEVICE_URL` — `http://<device-ip>/photo/upload` (ask for the device IP).
   - `UPLOAD_DIR` — `/photo/` unless the user says otherwise.
   - `ICS_URL` — see step 7. Leave empty until the user provides it.
   - `SELF_EMAIL` — the user's Google account email (hides events they declined).
   - `INTERVAL_MINUTES` — default `5`.
5. **Upload mock image** (checks the device is reachable): `npm run upload`. Expect `Device responded 200 — done`.
6. **Upload mock calendar:** `npm run calendar` (writes `calendar.png`, nothing sent), inspect it, then `npm run calendar:upload`. Expect `Using mock events` and `Device responded 200`. Mock data is used whenever `ICS_URL` is empty or `--mock` is passed.
7. **Real calendar.** Ask the user to open Google Calendar > Settings > their calendar > Integrate calendar, copy "Secret address in iCal format", and put it in `.env` as `ICS_URL` themselves, or paste it to you. Then `npm run calendar`, check that `calendar.png` shows a real meeting (and no declined/all-day/cancelled ones), then `npm run calendar:upload`.
8. **Batch updates.** `npm run watch` (uploads now, then every `INTERVAL_MINUTES`). It blocks, so run it in the background or hand it to the user. To keep it alive after the terminal closes: `nohup npm run watch > watch.log 2>&1 &`, `pm2`, launchd or Task Scheduler. Config is read once at start; restart after editing `.env`.

Final report to the user: what passed, what you could not verify (e.g. no device on the network), and how to stop the watcher.

## Rules

- **Secrets.** `ICS_URL` grants read access to the user's whole calendar. Never print it, log it, commit it, or put it in files other than `.env`. When showing config, mask it. `.env` is git-ignored; keep it that way. If it leaks, the user must reset it in Google Calendar settings.
- **Real device.** `upload`, `calendar:upload` and `watch` change what the user's physical display shows. Only run them when the task needs it, and say so. Prefer `npm run calendar` (preview only) while iterating.
- **Do not "simplify" `src/device.mjs`.** The device firmware sends a duplicate `Content-Length` header that `fetch` and `node:http` reject. The upload is a hand-rolled multipart POST over `node:net`, parsing only the status line. The `dir` query value is sent raw, not URL-encoded.
- **Verify visual changes.** Render with `--mock --at HH:MM` for several times of day (09:20 next, 11:10 in-progress, 17:40 done) and look at `calendar.png`. For refactors, compare pixels before and after.
- **Update `CHANGELOG.md`** (newest section on top) for every behavior change, including what was verified and what was not.
- No test suite or linter yet. Verification is by running the scripts.

## Architecture

```
calendar.mjs  upload.mjs  watch.mjs     thin CLIs: parse args, call src/app.mjs
src/config.mjs        only place that reads .env / process.env; defaults + validation
src/app.mjs           buildCard(config, opts), pushCard(config, jpeg), savePreview(config, jpeg)
src/sources/          fetchToday(now) -> normalized events { title, start, end, location, allDay, status, myResponse }
  ics.mjs mock.mjs index.mjs filters.mjs
src/domain/pick-events.mjs   pure: events + now -> { current, next, later }
src/render/           theme.mjs (colors/fonts/limits), format.mjs, card-model.mjs (what to show), card.mjs (SVG layout), index.mjs (SVG -> JPEG)
src/device.mjs        raw-TCP multipart upload
```

Flow: source -> filters -> `pickEvents` -> card model -> SVG -> JPEG -> `calendar.png` (what the device shows) + device upload.

Principles to keep: config read in one place and passed in; pure core (`pick-events`, `card-model`, `format`) with I/O only in sources and device; sources return unfiltered events and filters are composable `(event) => boolean`; look-and-feel only in `theme.mjs`.

## Common tasks

- **Change look:** `src/render/theme.mjs`, then `src/render/card.mjs` for layout.
- **Change what is shown:** `src/render/card-model.mjs`.
- **Hide more events:** add a filter in `src/sources/filters.mjs` and list it in `DEFAULT_FILTERS`.
- **New calendar source:** add `src/sources/<name>.mjs` returning `{ name, fetchToday(now) }`, select it in `src/sources/index.mjs`.
- **New config key:** add it in `src/config.mjs` and `.env.example`, document it in `README.md`.

## Gotchas

- Recurring events: Google stores a declined/cancelled single occurrence as an override (`RECURRENCE-ID`). `ics.mjs` reads status and attendee response from the override (`occurrence.event`), not the series. Keep that.
- Example image `example.png` is actually WebP; `sharp` detects format from content.
- `node-ical` requires Node ≥ 22. `process.loadEnvFile()` needs Node ≥ 20.12.
- Times use the machine's local timezone.
