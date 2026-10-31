# Minecraft 1.8.8 (EaglecraftX) startup repair

Tested October 31, 2026 against `games/Minecraft 1.8.8 (EaglecraftX).html.gz`.

The original restricted iframe crashes after the launch countdown:

```text
EaglercraftX's runtime could not be initialized!
SecurityError: Failed to read the 'localStorage' property from 'Window':
The document is sandboxed and lacks the 'allow-same-origin' flag.
```

This client uses Eaglercraft's engine, so the earlier EmulatorJS detection does
not cover it. Its iframe now receives the browser origin it needs for storage
and workers in both the main viewer and the Open in about:blank viewer.
Other non-emulator games retain their sandbox.

Verified the fix using Liqua's actual `GOOGLE-SITES-EMBED.html`, fetching and
decompressing the published 11.6 MB gzip file. The viewer reports no load error,
and the game renders its profile screen in a 764 × 423 canvas. The profile's
Done button responds and opens the next screen. Also added a test that checks
the Minecraft exception and restoration of the sandbox when switching games.

This is a startup/UI check. Multiplayer server availability and full gameplay
are not covered by this test.

To reproduce the original failure and isolated repair using the browser audit:

```text
node tools/audit-game-startup.cjs baseline "Minecraft 1.8.8 (EaglecraftX)"
node tools/audit-game-startup.cjs fixed-open "Minecraft 1.8.8 (EaglecraftX)"
node --test tools/test-emulator-compatibility.cjs
```

The catalog-aware audit accepts non-EmulatorJS games as well as console games.
Replace previously pasted Google Sites embed code with the updated `.txt`
contents, then republish. No change to the compressed game asset is required.
