# NORTHSPACE ™ — Streaming Platform & Content Management System

An ultra-modern, high-performance video streaming platform, catalog archive, and content CRM inspired by high-contrast architectural monochrome aesthetics, Geist Mono typography, and Neuform design principles.

---

## Architecture & Modular File Structure

The web application is structured with decoupled vanilla HTML5, CSS3, and modern JavaScript modules without external framework dependencies or backend requirements (operates with zero-latency `localStorage` synchronization):

```
├── index.html              # Main Discovery Hub (Featured Hero + Category Strip + Video Grid)
├── watch.html              # Dedicated Standalone Theater & Watch Page (Player + Up Next Queue)
├── admin.html              # Integrated Content CRM & Rights Management Console
│
├── css/
│   ├── base.css            # Light/Dark tokens, reset, typography, header & user menu
│   ├── cards.css           # Video thumbnail grid, badges, hover preview & responsive layout
│   ├── player.css          # Standalone theater stage, time scrubber, action bar
│   └── admin.css           # Content CRM dashboard, metrics, tables, and modal dialogs
│
├── js/
│   ├── catalog-data.js     # Centralized CRM data layer, CRUD API, DMCA engine & LocalStorage
│   ├── index.js            # Discovery controller, category memory, search & infinite scroll
│   ├── watch.js            # Theater engine, dynamic embeds/streams, and continue-watching tracking
│   └── admin.js            # CRM console controller, table rendering, delisting & JSON sync
│
├── tools/                  # Python Utilities & Video Extraction Engine
│   ├── scraper.py          # Crawls web galleries & single pages to extract streams
│   ├── requirements.txt    # Python dependencies (runs on standard library 0-install)
│   ├── README.md           # Instructions for running the crawler
│   └── data/               # Output directory for extracted text & CRM JSON files
│       ├── crm_catalog_extracted.json
│       └── extracted_videos.txt
│
└── archive/                # Historical sandbox prototypes & archived files
    ├── designs.html        # Initial layout exploration lab
    └── slider.css          # Legacy hero carousel styles
```

---

## Key Features & Capabilities

### 1. Minimalist Architectural Discovery (`index.html`)
- **Default Light Mode with Clean Dark Mode**: Off-white baseline (`#fbfbfb`) with dynamic toggle to deep dark mode (`#050505`).
- **Centered Widescreen Search**: Wide desktop placement with real-time filtering, `/` and `Ctrl+K` keyboard shortcuts, and instant `✕` clear button.
- **Curated Category Navigation**: Horizontal scrolling strip distinguishing curated editorial feeds (*All Feeds*, *Trending Now*, *Staff Curated*) from production genres (*Cinema & 35mm*, *Documentaries*, *Experimental Motion*), with live video count badges and `localStorage` memory.
- **Featured Hero Showcase**: Optional cinematic featured video showcase above the grid, configured via Admin Console or defaulting to the top-trending asset.
- **Interactive Video Cards**: Large, minimal cards featuring subtle hover preview zoom, frosted glass play badge, two-line title clamping, and continue-watching progress bar.
- **Curated Discovery Subbar**: Instant filters for *All Catalog*, *Recently Added*, *Most Watched*, and *Continue Watching*.
- **Responsive Multi-Column Grid**: Dynamic CSS grid adapting seamlessly across 5 columns (large desktop), 4 columns (desktop), 2–3 columns (tablet), and 1–2 columns (mobile).

### 2. External Video Linking & Theater Playback (`watch.html`)
- **Zero Video Hosting Costs**: Link any video via external iframe embed (YouTube, Vimeo, CDN iframe) or direct MP4/M3U8 stream URL.
- **Dynamic Playback Adaptation**:
  - Full-frame responsive player for embedded links.
  - Custom HTML5 controls and scrub bar for direct progressive MP4/M3U8 streams.
  - Real-time 60FPS procedural canvas fallback stream for sample assets.
- **Continue Watching Sync**: Automatically records timestamp and percentage progress to `localStorage` for the homepage.
- **Contextual Up-Next Queue**: Automatically populates matching category recommendations beside the player.
- **Share Destinations Modal**: 1-click sharing to WhatsApp, X (Twitter), Telegram, Reddit, Email, or Native Device Share Sheet.

### 3. Integrated DMCA & Rights Management
- **1-Click Notice Submission**: Viewers or rights holders can submit takedown notices directly from the theater player.
- **Structured Notice Workflow**: Captures claimant name, contact email, and infringement specifics.
- **Admin Review Queue**: Notices appear instantly inside `admin.html` under the **DMCA & Rights Management** tab.
- **1-Click Delisting**: Platform administrators can review notices and delist infringing content with a single click.

### 4. Content CRM Console (`admin.html`)
- **Protected Administrator Visibility**: Admin mode toggle inside the user profile dropdown cleanly hides or surfaces the CRM Console button.
- **Video Catalog Manager**: Bulk selection, category assignments, tags management, broken link scanner, and instant video preview.
- **Live Preview Studio**: Split-view editor with real-time video player and thumbnail preview.
- **Data Backup & Restore**: Full JSON metadata import and export for catalog backup and synchronization with `tools/scraper.py`.
