#!/usr/bin/env python3
"""Holt alle aktiven Artikel eines Vinted-Profils und schreibt sie nach vinted-items.json.

Aufruf:  python3 tools/vinted_sync.py https://www.vinted.de/member/12345678-name
Danach die Website neu hochladen (oder das Skript täglich per Cron/GitHub Action laufen lassen).
"""
import http.cookiejar, json, re, sys, time, urllib.request
from pathlib import Path

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
OUT = Path(__file__).resolve().parent.parent / "vinted-items.json"


def parse_profile(url):
    m = re.match(r"https?://(www\.vinted\.[a-z.]+)/member/(\d+)", url.strip())
    if not m:
        sys.exit("Bitte den Profil-Link angeben, z.B. https://www.vinted.de/member/12345678-name")
    return m.group(1), m.group(2)


def fetch_items(host, user_id):
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    opener.addheaders = [("User-Agent", UA), ("Accept-Language", "de-DE,de;q=0.9")]
    opener.open(f"https://{host}/", timeout=20).read()  # setzt das anonyme Session-Cookie

    items, page = [], 1
    while True:
        req = urllib.request.Request(
            f"https://{host}/api/v2/wardrobe/{user_id}/items?page={page}&per_page=96&order=newest_first",
            headers={"Accept": "application/json"})
        data = json.load(opener.open(req, timeout=20))
        batch = data.get("items", [])
        items += batch
        pag = data.get("pagination") or {}
        if not batch or page >= pag.get("total_pages", 1):
            return items
        page += 1
        time.sleep(1.5)  # Vinted nicht fluten


def money(p):
    if isinstance(p, dict):
        return f'{float(p.get("amount", 0)):.2f}'.replace(".", ",") + " €"
    return f"{p} €" if p else ""


def photo_url(photo):
    thumbs = {t.get("type"): t.get("url") for t in (photo or {}).get("thumbnails", [])}
    # 310x430 (~40 KB) reicht für die Karten; die größeren Varianten sind 800 px (~130 KB)
    return thumbs.get("thumb310x430") or (photo or {}).get("url", "")


def to_card(it):
    photos = [p for p in (it.get("photos") or [it.get("photo")]) if p]
    first = photos[0] if photos else {}
    return {
        "id": it["id"],
        "title": it.get("title", ""),
        "brand": it.get("brand_title") or it.get("brand") or "",
        "size": it.get("size_title") or it.get("size", ""),
        "price": money(it.get("price")),
        "img": photo_url(first),
        "img2": photo_url(photos[1]) if len(photos) > 1 else "",  # Bildwechsel beim Hover
        "color": first.get("dominant_color", ""),  # Platzhalterfarbe, bis das Bild geladen ist
        "cond": it.get("status", ""),
        "favs": it.get("favourite_count") or 0,
        "url": it.get("url") or f"https://www.vinted.de/items/{it['id']}",
    }


def is_active(it):
    return not (it.get("is_closed") or it.get("is_reserved") or it.get("is_hidden") or it.get("item_closing_action"))


if __name__ == "__main__":
    host, uid = parse_profile(sys.argv[1] if len(sys.argv) > 1 else "")
    raw = fetch_items(host, uid)
    cards = [to_card(i) for i in raw if is_active(i)]
    assert all(c["url"].startswith("https://") for c in cards)
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else OUT
    out.write_text(json.dumps({"updated": time.strftime("%Y-%m-%d %H:%M"), "items": cards},
                              ensure_ascii=False, indent=1))
    print(f"{len(cards)} aktive Artikel (von {len(raw)}) -> {out}")
