# Minecraft 1.8.8 user-supplied client replacement

Updated October 31, 2026.

The catalog now points to `games/Minecraft 1.8.8 (EaglecraftX).html`.
This file contains the replacement HTML supplied by the user, including its
pinned classes.min.js, fix-webm-duration.js, assets.epk, server list and focus
handlers. It is plain HTML, so this catalog entry no longer sets compressed:true.
The old compressed asset is no longer selected by the catalog.
The viewer also upgrades stale cached catalog entries to the replacement path
and pins its game download to the replacement commit, avoiding old CDN copies.

All three viewer/Google Sites sources permit this client to use a browser origin
for storage and workers, as they did for the previous compressed client.

Browser testing of the supplied client inside an iframe reproduced a separate
startup failure when an embed denies gamepad access. The shared document loader
therefore injects the existing denied-API compatibility guard before this game's
scripts. The supplied game file itself remains unchanged. Available storage and
controllers are preserved; a denied getGamepads call returns an empty controller
list so keyboard play can initialize.

Verified in Chrome with gamepad permission deliberately denied:

- Client reaches its content-options screen, profile screen and Minecraft title.
- Native W and Space events reach the game window with isTrusted:true.
- Typing Q edits the username field.
- The game document retains keyboard focus after clicking its canvas.
- All three embed sources match and parse.
- Catalog path, plain-HTML loading and compatibility regression checks pass.

This checks startup and keyboard input, not full gameplay or multiplayer server
availability. The relative lang/ configuration is retained from the supplied code.

Replace the previously pasted Google Sites embed with the latest
GOOGLE-SITES-EMBED.txt contents and republish.
