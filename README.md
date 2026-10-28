# LACTOSE - jsDelivr-only game delivery (no GitHub Pages required)

This build uses GitHub as the FILE STORE and **jsDelivr** to deliver your games to the browser, similar to GN-Math's game-loading architecture. It does not require or enable GitHub Pages.

## Files

- `games/` - all 868 provided game files (15 of the largest stored as `.html.gz` to fit jsDelivr's per-file size limit)
- `games-catalog.json` - 868 entries with file paths; none point to Google Drive
- `index.html` - full website source; fetches the catalog and game files exclusively from jsDelivr
- `GOOGLE-SITES-EMBED.txt` - source to paste into Google Sites > Insert > Embed > Embed code
- `GOOGLE-SITES-EMBED.html` - same self-contained site HTML for viewing/editing
- `publish-to-github.cmd` - uploads the entire extracted project to your GitHub repository using Git for Windows
- `audit-summary.json`, `unmatched-original-catalog.txt`, `new-games-in-zip.txt`, `tools/` - reports and helper files

## STEP 1 - Publish all game files to GitHub

1. Install Git for Windows from https://git-scm.com/downloads/win if you do not have it.
2. Extract this ZIP completely into a folder on your Windows PC.
3. Double-click `publish-to-github.cmd` in the extracted folder. Git may ask you to sign in via your browser.
4. Wait for its **SUCCESS** message. All 868 game files, the catalog, and the website HTML should be in the public repository at https://github.com/samuelwinn/my-game-catalog.

**Do not upload this ZIP itself to GitHub.** Upload the extracted contents, so the CDN sees each game file by its own pathname. GitHub also blocks normal repository files over 100 MiB, while this ZIP is about 111 MiB.

## STEP 2 - Put the website on Google Sites (NOT GitHub Pages)

1. Open your Google Sites website editor.
2. Choose **Insert > Embed > Embed code**.
3. Open `GOOGLE-SITES-EMBED.txt` in Notepad. Select all and copy.
4. Paste the complete text into the Google Sites embed-code box.
5. Insert the embedded content, resize it generously, then publish your Google Sites page.

The embedded website gets its catalog at:

https://cdn.jsdelivr.net/gh/samuelwinn/my-game-catalog@main/games-catalog.json

Games load from the same jsDelivr prefix. The website fetches the game HTML as text and runs it in an isolated iframe because jsDelivr deliberately serves HTML with `text/plain` content type.

You may also use `index.html` on **another legitimate static website host** instead of Google Sites. It does not need GitHub Pages. **jsDelivr is the game CDN, not an HTML website host.**

## Limitations

- There are 868 game HTML files in the provided ZIP. The original 972-name catalog includes 681 entries with no matching supplied HTML filename, and the ZIP has 577 additional names. Unmatched names have *not* been claimed playable.
- This is a static assembly with valid catalog paths; **not every game was browser-tested**.
- Some HTML games rely on files on outside websites that may be unavailable or blocked, and some may require capabilities restricted by the isolated iframe.
- The public GitHub repository must contain the extracted project files, not the ZIP alone, before jsDelivr can deliver them.
- jsDelivr documents default package limits (150 MB total, 20 MB/file), and serves HTML as `text/plain`. This package is approximately 114 MiB of extracted game data after its 15 largest files were gzip compressed. CDN caching can delay updates on @main URLs.
- Publishing third-party games or source files requires proper rights or permission; do not assume this package grants a license.
