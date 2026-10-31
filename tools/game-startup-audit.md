# Liqua emulator startup audit — October 31, 2026

Scanned the 875 published catalog entries for the Famidash failure pattern.
451 use EmulatorJS. The remaining 424 do not use this emulator loader.
No additional game had Famidash's CSS rule that hid the canvas after startup.

Browser checks reproduced sandbox storage failures in Advance Wars, Bomberman,
7 Grand Dad and Banjo-Kazooie. DuckTales referenced an unavailable emulator
branch. The unbuilt EmulatorJS source tree used by N64 games also had missing
runtime/core assets. Grimace's Birthday returned HTTP 403 for its jsDelivr ROM.

## Repairs

- Prepare EmulatorJS documents before assigning them to the game iframe.
- Give emulator games the iframe permissions used by the working gn-math
  viewer. Other games retain the existing sandbox.
- Guard denied gamepad access so keyboard play can start in restricted embeds.
- Preserve available storage. If an outer embed denies storage, use session-only
  memory storage and disable inaccessible IndexedDB instead of crashing.
- Replace three old runtime source prefixes (425 game files) with the complete
  EmulatorJS build pinned to commit `7bf5cbb0b94866568d2aaa1fd42ebb5acd517e0d`.
  Each game's ROM, BIOS and console settings are retained.
- Remove obsolete Google export API calls from emulator documents.
- Deliver Grimace's Birthday's existing ROM through its working GitHub raw URL;
  also repair cached copies of the old HTML during document preparation.
- Keep `index.html`, `GOOGLE-SITES-EMBED.html` and `GOOGLE-SITES-EMBED.txt` identical.

## Verification

19 representative games completed browser startup with an initialized emulator
and a visible, nonzero-sized canvas after the repair. They cover NES, Game Boy,
GBA, SNES, N64, Genesis, Atari 2600, Jaguar, Lynx, Neo Geo Pocket and ColecoVision.
The detailed results and original failures are in `game-startup-audit.json`.

Visually checked rendered screens for Advance Wars, Bomberman, 7 Grand Dad,
Banjo-Kazooie and Famidash. Also exercised the actual Google Sites embed HTML:
Bomberman started, advanced more than 1,200 emulation frames, and produced no
viewer error. Three automated tests check denied browser APIs, preservation of
working browser APIs, document injection order and retained ROM/BIOS URLs.
All 417 original non-emulator documents passed byte-for-byte preparation checks;
the seven newer non-emulator documents were inspected separately.

These are startup checks, not full playthroughs. All 875 games have not been
browser-tested. Large multi-part PS1/DS downloads and platform-specific behavior
still need separate checks. Session-only fallback storage cannot preserve saves
after the game iframe is closed; use Export Save File when storage is restricted.

## Reproduce

Use Node 22 or newer and a separate Chrome instance in headless mode with remote
debugging on port 9228. The audit uses the DevTools protocol directly and needs
no npm dependencies. Its local test server denies gamepad permission deliberately.

```text
node --test tools/test-emulator-compatibility.cjs
node tools/audit-game-startup.cjs baseline
node tools/audit-game-startup.cjs fixed-open
```

Pass game names after the mode to choose other samples. Set
`GAME_AUDIT_CONCURRENCY=1` for foreground visual checks and
`GAME_AUDIT_WAIT_MS=35000` for slower console startup. The audit captures startup
errors, HTTP failures, emulator state and screenshots. Background tabs can pause
console animation, so inspect rendered screens before claiming a game is playable.

After editing the helper source files, run:

```text
node tools/sync-emulator-helpers.cjs
```

On Google Sites, replace the previously pasted embed with the updated `.txt`
contents and republish. GitHub updates do not replace code already pasted there.
