# Drive Mad addition — October 31, 2026

Added the user-supplied HTML as `games/Drive Mad.html`, preserving its pinned
asset base URL, scripts, SDK configuration and attribution comments. Added one
catalog entry between Dreadhead Parkour and Driven Wild (876 entries total).

The original restricted iframe caused the Poki SDK to throw a SecurityError
while reading document.cookie, followed by a missing commercialBreak function.
The viewer now gives this game a browser origin, in both the main player and
the about:blank player. Other non-emulator games keep their existing sandbox.

Verified in headless Chrome: SDK/resources load without recorded startup or
HTTP errors, and the first level renders with the truck and driving controls.
The existing clipboard and compatibility regression checks also pass.

Catalog requests now include a timestamp to avoid reusing an older cached
catalog after a new game is published. All three site/embed files are updated.
Google Sites users must replace their pasted embed code and republish to apply
the new game's iframe permission setting.

This is a startup/first-level check, not a full playthrough of every level.
