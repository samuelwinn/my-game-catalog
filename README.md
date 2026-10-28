# LACTOSE — game library

Ready for the existing repository **`samuelwinn/my-game-catalog`** (`main` branch).

## What is included

- `index.html` — searchable game library, favorites, recent games, responsive player
- `games-catalog.json` — **868** entries pointing to **real files in `games/`**, not Google Drive links
- `games/` — all **868 HTML games** from the uploaded ZIP (the largest 15 compressed as `.html.gz`)
- `audit-summary.json` — static-file inventory and counts
- `unmatched-original-catalog.txt` — **681** names from the old catalog with no supplied HTML filename
- `new-games-in-zip.txt` — **577** games newly found in the ZIP
- `tools/rebuild_catalog.py` — regenerate the catalog after adding more games
- `tools/asset-audit.json` — per-game audit of references and file sizes

## Publish to GitHub (Windows)

**Prerequisites:** Git installed and access to your existing GitHub repository. The repository must be **public** for jsDelivr to fetch its files.

1. Download the project ZIP supplied in this chat, and **extract it** somewhere on your computer (do NOT commit the ZIP itself).
2. Clone your repository or use a local clone you already have:

   ```powershell
   git clone https://github.com/samuelwinn/my-game-catalog.git
   cd my-game-catalog
   ```

3. Copy the **contents** of the extracted `my-game-catalog` folder into that local repository folder. Merge, not nest. You should have `index.html` and `games-catalog.json` next to the `games` directory.
4. In the terminal inside your repository:

   ```powershell
   git add -A
   git commit -m "Add complete 868-game catalog"
   git push origin main
   ```

5. On GitHub open **Settings → Pages → Build and deployment → Deploy from a branch**, choose **main** and **/(root)**, and save.
6. Your expected site address is:

   **https://samuelwinn.github.io/my-game-catalog/**

   (Available after GitHub Pages is enabled and the repository publishes successfully.)

> If you already have an `index.html` in that repository, copying this project over it **replaces the existing homepage**. Back up anything you want to keep first.

## Why jsDelivr uses an HTML loader

jsDelivr deliberately serves `.html` files as `text/plain`, so loading `https://cdn.jsdelivr.net/.../some-game.html` directly in an `<iframe>` often displays source code rather than running the page. The homepage instead **fetches the HTML string from jsDelivr** and places it in a sandboxed iframe using `srcdoc`. This is similar to the approach used by game catalogs that load HTML through a CDN.

The jsDelivr GitHub endpoint also has a default **20 MB per-file limit** and default **150 MB package size limit**. The largest 15 HTML documents are gzip-compressed and loaded by modern browsers with `DecompressionStream`, keeping every individual CDN-hosted file under 20 MB and the total initial project smaller than 150 MB.

**CDN prefix:** `https://cdn.jsdelivr.net/gh/samuelwinn/my-game-catalog@main/`

The repository contains the original HTML text for regular-sized games, and compressed original HTML documents for oversized games. The loader decompresses them in the browser.

## Known limitations

- **681 original-catalog items have no matching file.** They are *not* marked playable. See `unmatched-original-catalog.txt`.
- Only **868 game files** were supplied, despite the old catalog having 972 links. This archive cannot invent the missing files.
- Many HTML files request JS/CSS/images from other websites; the ZIP contains **no separate JS/CSS/image asset files**. Links may fail if those sources are unavailable or block access.
- For isolation, game HTML runs in an iframe with an opaque sandboxed origin. Some games expecting browser storage, service workers, top-frame navigation, or cross-origin services can fail. The default deliberately does **not** grant uploaded game scripts access to the catalog page's origin.
- `index.html` is a real website and should be loaded over **https** via GitHub Pages or another web server, not double-clicked as a `file://` HTML page.
- The project was **statically inspected**; individual browser games were **not run or verified**. It is not accurate to claim every game works before actual testing.
- jsDelivr caches `@main` files. Updating an existing file may not become visible instantly. For production, use immutable commit IDs, tagged releases, or versioned filenames.
- Publishing games requires permission to redistribute them; this project does not establish rights for third-party game code and assets.

## Adding more games later

Place another `.html` file in the `games/` folder, then run:

```powershell
python tools/rebuild_catalog.py
```

This script scans the current files and preserves matching names/metadata from the existing catalog. If you add a very large HTML file, compress it into `.html.gz` using gzip before committing (the jsDelivr 20 MB limit still applies to the compressed file).

## Static audit summary

- File count: 868
- Original catalog: 972
- Original game names that matched a supplied filename: 291
- New names from ZIP: 577
- Old catalog names missing files: 681
- Game files after compression: 113.7 MiB
