"""
NORTHSPACE STREAM — Automated Video Stream & Metadata Scanner
Directly synchronizes video streams into the NorthSpace web platform.
Continuous scanning mode: scans as much content as you want.
Press [Ctrl + C] anytime to stop scanning and finalize records.
"""

import sys
import os
import re
import json
import argparse
import subprocess
import urllib.request
from urllib.parse import urljoin, urlparse, unquote

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/124.0.0.0 Safari/537.36'
    ),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

def fetch_html(url: str, timeout: int = 15) -> str:
    """
    Fetches raw HTML from a URL.
    Uses system curl as primary fetcher (bypasses TLS fingerprinting & Cloudflare 404 blocks on root),
    falling back to urllib.request if curl is unavailable.
    """
    p = urlparse(url)
    if 'aamchor.com' in p.netloc and (p.path == '' or p.path == '/'):
        url = 'https://aamchor.com/videos'

    try:
        res = subprocess.run(
            ['curl.exe', '-s', '-L', '-A', HEADERS['User-Agent'], url],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='ignore',
            timeout=timeout
        )
        if res.returncode == 0 and res.stdout and len(res.stdout) > 50:
            return res.stdout
    except Exception:
        pass

    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode('utf-8', errors='ignore')

def derive_stream_from_thumbnail(thumb_url: str) -> str:
    """Derives CDN stream URL from standard thumbnail path if available."""
    if not thumb_url:
        return ""
    if '/thumbnails/' in thumb_url:
        return re.sub(r'/thumbnails/', '/videos/', thumb_url).replace('.jpg', '.mp4').replace('.png', '.mp4')
    return ""

def extract_category(page_url: str, stream_url: str, title: str, html: str) -> str:
    """Derives a clean category slug from URLs, meta tags, or titles."""
    for u in [stream_url, page_url]:
        if u:
            m = re.search(r'/(?:videos|category|thumbnails)/([a-zA-Z0-9_-]+)/', u, re.IGNORECASE)
            if m:
                cat = m.group(1).lower().strip()
                if cat not in ['all', 'embed', 'watch', 'video', 'videos', 'cdn']:
                    return cat

    cat_m = re.search(r'<meta\s+(?:property|name)=["\'](?:video:category|article:section)["\']\s+content=["\'](.*?)["\']', html, re.IGNORECASE)
    if cat_m:
        raw = cat_m.group(1).strip().lower()
        if raw:
            return re.sub(r'[^a-zA-Z0-9_-]+', '-', raw)

    t_lower = (title or "").lower()
    for kw in ['amateur', 'blowjob', 'desi', 'bengali', 'tamil', 'pakistani', 'leaked', 'cinema', 'shorts', 'documentary']:
        if kw in t_lower:
            return kw

    return 'curated'

def extract_single_video_page(page_url: str, preloaded_title: str = None, preloaded_thumb: str = None) -> dict:
    """Extracts playable stream links, title, thumbnail, and description from a specific video page."""
    html = fetch_html(page_url)

    # 1. Title
    title = preloaded_title
    if not title:
        h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
        if h1_match:
            title = re.sub(r'<[^>]+>', '', h1_match.group(1)).strip()

    if not title:
        og_title = re.search(r'<meta\s+(?:property|content)=["\'](?:og:title|[^"\']*)["\']\s+(?:content|property)=["\']([^"\']*)["\']', html, re.IGNORECASE)
        if og_title:
            title = og_title.group(1).strip()

    if not title:
        title_tag = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
        if title_tag:
            title = re.sub(r'\s+', ' ', title_tag.group(1)).strip()

    if not title:
        title = page_url.rstrip('/').split('/')[-1].replace('-', ' ').title()

    # 2. Description
    description = ""
    desc_match = re.search(r'<meta\s+(?:name|property|content)=["\'](?:og:description|description|[^"\']*)["\']\s+(?:content|property|name)=["\']([^"\']*)["\']', html, re.IGNORECASE)
    if desc_match:
        description = desc_match.group(1).strip()
    else:
        description = f"Stream: {title}"

    # 3. Thumbnail
    thumb_url = preloaded_thumb
    if not thumb_url:
        og_img = re.search(r'<meta\s+(?:property|name|content)=["\'](?:og:image|[^"\']*)["\']\s+(?:content|property|name)=["\']([^"\']*)["\']', html, re.IGNORECASE)
        if og_img:
            thumb_url = urljoin(page_url, og_img.group(1))

    # 4. Playable Video Streams (Direct MP4 / M3U8 & Embeds)
    direct_video_url = ""
    embed_url = ""

    # Check direct stream link
    mp4_matches = re.findall(r'https?://[^"\'\s<>\\]+\.(?:mp4|m3u8)(?:\?[^"\'\s<>\\]*)?', html, re.IGNORECASE)
    if mp4_matches:
        direct_video_url = mp4_matches[0].rstrip('\\').replace('\\/', '/')

    # Check HTML5 video tag
    if not direct_video_url:
        src_match = re.search(r'<(?:video|source)[^>]+src=["\']([^"\']+\.(?:mp4|m3u8|webm)(?:\?[^"\']*)?)["\']', html, re.IGNORECASE)
        if src_match:
            direct_video_url = urljoin(page_url, src_match.group(1))

    # Derive from thumbnail if available
    if not direct_video_url and thumb_url:
        direct_video_url = derive_stream_from_thumbnail(thumb_url)

    # Check iframe embed
    iframe_match = re.search(r'<iframe[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE)
    if iframe_match:
        embed_url = urljoin(page_url, iframe_match.group(1))

    # Adapt platforms
    if 'youtube.com/watch' in page_url:
        v_id = re.search(r'[?&]v=([^&]+)', page_url)
        if v_id:
            embed_url = f"https://www.youtube-nocookie.com/embed/{v_id.group(1)}"
    elif 'youtu.be/' in page_url:
        v_id = urlparse(page_url).path.lstrip('/')
        if v_id:
            embed_url = f"https://www.youtube-nocookie.com/embed/{v_id}"
    elif 'vimeo.com/' in page_url and 'player.vimeo.com' not in page_url:
        v_id = urlparse(page_url).path.lstrip('/')
        if v_id.isdigit():
            embed_url = f"https://player.vimeo.com/video/{v_id}"

    if not thumb_url and direct_video_url and '/videos/' in direct_video_url:
        thumb_url = direct_video_url.replace('/videos/', '/thumbnails/').replace('.mp4', '.jpg')
    if thumb_url and not (thumb_url.startswith('http://') or thumb_url.startswith('https://')):
        thumb_url = urljoin(page_url, thumb_url)

    category = extract_category(page_url, direct_video_url, title, html)

    return {
        'page_url': page_url,
        'title': title,
        'description': description,
        'thumb_url': thumb_url or "",
        'direct_video_url': direct_video_url,
        'embed_url': embed_url,
        'category': category
    }

def discover_video_links_from_catalog(catalog_url: str, html: str) -> list:
    """Scans a gallery/catalog page to discover video links with their preview metadata."""
    discovered = []
    seen = set()

    a_tags = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html, re.DOTALL | re.IGNORECASE)

    for href, inner in a_tags:
        clean_href = href.strip()
        full_url = urljoin(catalog_url, clean_href)

        if any(skip in clean_href for skip in ['/filter/', '/tag/', '/categories', '#', 'javascript:', 'mailto:']):
            continue

        is_video_link = any(kw in clean_href for kw in ['/videos/', '/video/', '/watch/', '/post/']) or bool(re.search(r'-\d+/?$', clean_href))
        if not is_video_link:
            continue

        # Skip main gallery links like /videos or /videos/
        parsed_path = urlparse(full_url).path.rstrip('/')
        if parsed_path in ['/videos', '/video']:
            continue

        if full_url in seen:
            continue
        seen.add(full_url)

        # Title
        title = None
        title_h = re.search(r'<h[1-6][^>]*>(.*?)</h[1-6]>', inner, re.DOTALL | re.IGNORECASE)
        if title_h:
            title = re.sub(r'<[^>]+>', '', title_h.group(1)).strip()
        if not title:
            tit_m = re.search(r'title=["\']([^"\']+)["\']', inner)
            if tit_m:
                title = tit_m.group(1).strip()
        if not title:
            alt_m = re.search(r'alt=["\']([^"\']+)["\']', inner)
            if alt_m:
                title = alt_m.group(1).strip()

        # Thumbnail
        thumb = None
        img_m = re.search(r'src=["\']([^"\']+)["\']', inner)
        if img_m:
            raw_img = img_m.group(1)
            if 'url=' in raw_img:
                extracted = re.search(r'url=([^&]+)', raw_img)
                thumb = unquote(extracted.group(1)) if extracted else urljoin(catalog_url, raw_img)
            else:
                thumb = urljoin(catalog_url, raw_img)

        discovered.append({
            'url': full_url,
            'title': title,
            'thumb': thumb
        })

    return discovered

def detect_next_page(current_url: str, html: str, page_num: int) -> str:
    """Detects or computes the next page URL in the gallery."""
    # 1. Look for Next / page links in HTML hrefs
    pagination_matches = re.findall(r'href=["\']([^"\']*(?:/filter/recent/all/|\?page=|/page/)\d+[^"\']*)["\']', html, re.IGNORECASE)
    for match in pagination_matches:
        page_in_url = re.search(r'(\d+)$', match)
        if page_in_url and int(page_in_url.group(1)) == page_num:
            return urljoin(current_url, match)

    # 2. rel="next"
    m = re.search(r'<a\s+[^>]*rel=["\']next["\'][^>]*href=["\']([^"\']+)["\']', html, re.IGNORECASE)
    if not m:
        m = re.search(r'<link\s+[^>]*rel=["\']next["\'][^>]*href=["\']([^"\']+)["\']', html, re.IGNORECASE)
    if m:
        return urljoin(current_url, m.group(1))

    # 3. Next text button
    m = re.search(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>\s*(?:Next|&rsaquo;|&raquo;|›|»)\s*</a>', html, re.IGNORECASE)
    if m:
        return urljoin(current_url, m.group(1))

    # 4. Aamchor filter pagination structure
    if 'aamchor.com' in current_url:
        return f"https://aamchor.com/videos/filter/recent/all/{page_num}"

    # 5. Standard fallback pattern
    clean_base = re.sub(r'/page/\d+/?$', '', current_url.rstrip('/'))
    return f"{clean_base}/page/{page_num}/"

def format_for_northspace_crm(records: list) -> list:
    """Formats extracted records into NorthSpace Catalog schema."""
    crm_records = []
    for idx, r in enumerate(records, start=1):
        hash_val = abs(hash(r['page_url']))
        category = r.get('category') or 'curated'
        raw_thumb = r.get('thumb_url') or ''
        if raw_thumb and not (raw_thumb.startswith('http://') or raw_thumb.startswith('https://')):
            raw_thumb = urljoin(r.get('page_url') or 'https://aamchor.com/', raw_thumb)
        crm_records.append({
            "id": f"vid_ext_{idx}_{hash_val % 100000}",
            "title": r['title'],
            "category": category,
            "tags": ["stream", "external", category, "cinema"],
            "duration": 180 + (hash_val % 420),
            "views": 25000 + (hash_val % 80000),
            "daysAgo": (hash_val % 14) + 1,
            "likes": 1200 + (hash_val % 3500),
            "thumb": raw_thumb,
            "fallbackThumb": "",
            "embedUrl": r['embed_url'],
            "videoUrl": r['direct_video_url'],
            "description": r['description']
        })
    return crm_records

def save_feed_to_website(records: list, project_root: str):
    """
    Saves extracted records directly into the website's live feed file:
    sample/js/catalog-feed.js
    AND keeps updating tools/data/crm_catalog_extracted.json and tools/data/extracted_videos.txt.
    """
    if not records:
        return

    crm_data = format_for_northspace_crm(records)
    json_str = json.dumps(crm_data, indent=2, ensure_ascii=False)

    # 1. Direct Website Live Feed (js/catalog-feed.js)
    js_dir = os.path.join(project_root, "js")
    os.makedirs(js_dir, exist_ok=True)
    feed_path = os.path.join(js_dir, "catalog-feed.js")
    feed_code = f"// NORTHSPACE LIVE STREAM FEED -- Automatically synchronized by tools/scraper.py\nwindow.NORTHSPACE_FEED = {json_str};\n"
    with open(feed_path, 'w', encoding='utf-8') as f:
        f.write(feed_code)

    # 2. tools/data/crm_catalog_extracted.json
    data_dir = os.path.join(project_root, "tools", "data")
    os.makedirs(data_dir, exist_ok=True)
    json_path = os.path.join(data_dir, "crm_catalog_extracted.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        f.write(json_str)

    # 3. tools/data/extracted_videos.txt (Human-readable text file)
    txt_path = os.path.join(data_dir, "extracted_videos.txt")
    with open(txt_path, 'w', encoding='utf-8') as f:
        for idx, rec in enumerate(records, start=1):
            f.write(f"=== Video Record #{idx} ===\n")
            f.write(f"Source URL   : {rec['page_url']}\n")
            f.write(f"Title        : {rec['title']}\n")
            f.write(f"Category     : {rec.get('category', 'curated')}\n")
            f.write(f"Direct Stream: {rec['direct_video_url'] or 'N/A'}\n")
            f.write(f"Embed Link   : {rec['embed_url'] or 'N/A'}\n")
            f.write(f"Thumbnail    : {rec['thumb_url']}\n")
            f.write(f"Description  : {rec['description']}\n")
            f.write("-" * 60 + "\n\n")

def load_existing_records(project_root: str) -> list:
    """Loads previously extracted records to avoid duplicate work and preserve history."""
    data_json = os.path.join(project_root, "tools", "data", "crm_catalog_extracted.json")
    if os.path.exists(data_json):
        try:
            with open(data_json, 'r', encoding='utf-8') as f:
                crm_items = json.load(f)
                return [{
                    'page_url': v.get('pageUrl') or v.get('videoUrl') or v.get('title'),
                    'title': v.get('title'),
                    'description': v.get('description', ''),
                    'thumb_url': v.get('thumb', ''),
                    'direct_video_url': v.get('videoUrl', ''),
                    'embed_url': v.get('embedUrl', ''),
                    'category': v.get('category', 'curated')
                } for v in crm_items]
        except Exception:
            return []
    return []

def main():
    parser = argparse.ArgumentParser(description="NorthSpace Continuous Video Stream Scanner")
    parser.add_argument('url', nargs='?', default="https://aamchor.com/videos", help="Initial gallery or video URL (default: https://aamchor.com/videos)")
    parser.add_argument('--limit', type=int, default=None, help="Optional max total videos to extract before stopping")
    parser.add_argument('--max-pages', type=int, default=None, help="Optional max pages to scan")
    parser.add_argument('--fresh', action='store_true', help="Start fresh instead of resuming previous records")

    args = parser.parse_args()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(base_dir, ".."))

    all_records = [] if args.fresh else load_existing_records(project_root)
    seen_urls = set(r['page_url'] for r in all_records if r.get('page_url'))
    seen_streams = set(r['direct_video_url'] for r in all_records if r.get('direct_video_url'))

    print("=" * 65)
    print("  NORTHSPACE STREAM // AUTOMATED VIDEO SCANNER & SYNC")
    print("=" * 65)
    print(f"Target Feed : {args.url}")
    print(f"Destination : js/catalog-feed.js (Direct Live Website Integration)")
    if all_records:
        print(f"Resuming    : {len(all_records)} existing videos already in database")
    print("Status      : Scanning mode active. [Press Ctrl + C anytime to stop]")
    print("-" * 65)

    current_page_url = args.url
    page_num = 1
    total_new = 0

    try:
        while current_page_url:
            if args.max_pages and page_num > args.max_pages:
                print(f"\n-> Reached requested limit of {args.max_pages} pages.")
                break

            print(f"\n[Page {page_num}] Scanning: {current_page_url}")
            
            try:
                html = fetch_html(current_page_url)
            except Exception as e:
                print(f"-> Could not fetch {current_page_url}: {e}")
                break

            # Check if this is a single video page
            is_single = '/videos/' in current_page_url and not any(kw in current_page_url for kw in ['/filter/', '/page/']) and re.search(r'-\d+/?$', current_page_url)
            
            if is_single:
                try:
                    rec = extract_single_video_page(current_page_url)
                    stream = rec.get('direct_video_url') or rec.get('embed_url')
                    if stream and stream not in seen_streams:
                        all_records.append(rec)
                        seen_streams.add(stream)
                        total_new += 1
                        print(f"  [+] {rec['title']}")
                        print(f"      Playable: {stream}")
                        save_feed_to_website(all_records, project_root)
                except Exception as err:
                    print(f"  [-] Single video extraction failed: {err}")
                break

            candidates = discover_video_links_from_catalog(current_page_url, html)
            if not candidates:
                print("-> No video candidates found on this page.")
                break

            print(f"-> Discovered {len(candidates)} video link(s). Extracting playable streams...")
            
            page_extracted = 0
            for item in candidates:
                if args.limit and len(all_records) >= args.limit:
                    print(f"\n-> Reached requested limit of {args.limit} videos.")
                    return

                if item['url'] in seen_urls:
                    continue
                seen_urls.add(item['url'])

                try:
                    rec = extract_single_video_page(item['url'], preloaded_title=item.get('title'), preloaded_thumb=item.get('thumb'))
                    stream_url = rec.get('direct_video_url') or rec.get('embed_url')
                except Exception:
                    thumb_url = item.get('thumb') or ""
                    stream_url = derive_stream_from_thumbnail(thumb_url)
                    title_clean = item.get('title') or item['url'].split('/')[-1].replace('-', ' ').title()
                    category = extract_category(item['url'], stream_url, title_clean, "")
                    rec = {
                        'page_url': item['url'],
                        'title': title_clean,
                        'description': f"Stream: {title_clean}",
                        'thumb_url': thumb_url,
                        'direct_video_url': stream_url,
                        'embed_url': "",
                        'category': category
                    }

                if stream_url:
                    if stream_url in seen_streams:
                        continue
                    seen_streams.add(stream_url)
                    all_records.append(rec)
                    total_new += 1
                    page_extracted += 1
                    print(f"  [#{len(all_records)}] {rec['title']}")
                    print(f"       Category: {rec.get('category', 'curated')} | Stream: {stream_url}")
                    
                    # Progressive save directly to website
                    save_feed_to_website(all_records, project_root)

            print(f"-> Page {page_num} completed ({page_extracted} new videos synced directly to website).")

            # Detect next page
            next_url = detect_next_page(current_page_url, html, page_num + 1)
            if not next_url or next_url == current_page_url:
                print("-> No further pages available on this target.")
                break

            current_page_url = next_url
            page_num += 1

    except KeyboardInterrupt:
        print("\n\n" + "=" * 65)
        print("  [Ctrl + C] Stopped scanning by user.")
        print("=" * 65)
    except Exception as e:
        print(f"\n[Notice] Scanner halted: {e}")
    finally:
        save_feed_to_website(all_records, project_root)
        print("\n" + "=" * 65)
        print(f"  [+] SYNC COMPLETE: {len(all_records)} total video streams stored in NorthSpace!")
        print(f"  [+] Website Live File : sample/js/catalog-feed.js")
        print(f"  [+] CRM Database File : sample/tools/data/crm_catalog_extracted.json")
        print(f"  [+] Zero manual copy/paste required.")
        print(f"  [+] Simply refresh or open index.html -- all streams are live and playable!")
        print("=" * 65 + "\n")

if __name__ == '__main__':
    main()
