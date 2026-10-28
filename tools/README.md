# NorthSpace Tools & Video Stream Scanner

Automated continuous video metadata and direct progressive stream scanner with direct live website synchronization.

### Quick Usage

Run the scanner directly from the `tools/` folder or project root:

```bash
cd tools
python scraper.py
```

The scanner will continuously scan pages, extract playable `.mp4`/`.m3u8` video streams, and **automatically save them directly to the website (`js/catalog-feed.js`)**.

- **Scan as much as you want**: It will crawl page by page without stopping.
- **Stop anytime**: Press **`Ctrl + C`** whenever you wish to stop. All scanned videos are saved progressively and kept safe.
- **Zero manual work**: No need to copy code or paste text into the admin panel. Simply refresh or open `index.html` in your browser and all videos will be live and playable.

### Target Specific URL

You can scan any gallery or category:

```bash
python scraper.py https://example.com/gallery/
```

### Options

| Flag | Description |
| :--- | :--- |
| `[url]` | Target gallery or single video URL (default: `https://aamchor.com/`) |
| `--limit N` | Stop automatically after extracting `N` total videos |
| `--max-pages N` | Stop after scanning `N` pages |
| `--fresh` | Start fresh without resuming previously saved videos |

### Outputs Generated

- **`js/catalog-feed.js`**: Direct live website feed file (loaded by `index.html`, `watch.html`, and `admin.html`).
- **`tools/data/crm_catalog_extracted.json`**: Standalone JSON database backup.
- **`tools/data/extracted_videos.txt`**: Human-readable text audit trail.
