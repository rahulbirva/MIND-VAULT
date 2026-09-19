"""
scraper.py — Given an article URL, pull its real body text and (if easy) an image.

Image philosophy: we do NOT search for images separately (that's another
network call, another rate-limit risk on top of DDG search). We only take
the image the article already advertises via its og:image meta tag — the
same tag every site sets for link previews on WhatsApp/Twitter/etc.
If it's not there, image_url is just None. No image is a totally normal,
expected outcome — the frontend should render the card fine either way.
"""

import requests
from bs4 import BeautifulSoup

HEADERS = {
    # Some sites block requests with no user-agent — pretend to be a browser.
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}


def scrape_article(url: str, timeout: int = 6) -> dict:
    """
    Returns {"text": str, "image_url": str | None}.
    On any failure (timeout, 404, blocked), returns {"text": "", "image_url": None}
    rather than raising — the caller decides what to do (usually: skip this
    article, or fall back to just using the search snippet as the "text").
    """
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"[scrape_article] Failed to fetch {url}: {e}")
        return {"text": "", "image_url": None}

    soup = BeautifulSoup(resp.text, "html.parser")

    # --- Extract main text: just grab all <p> tags, join them.
    # This is intentionally simple (no fancy "main content detection" library)
    # because it's fast, dependency-light, and good enough for a summarizer —
    # the LLM step next can handle some noise in the text just fine.
    paragraphs = [p.get_text(strip=True) for p in soup.find_all("p")]
    text = " ".join(paragraphs)
    text = text[:6000]  # cap length so we don't blow past the LLM's context window

    # --- Extract og:image if present (free, no extra network call).
    image_url = None
    og_image = soup.find("meta", property="og:image")
    if og_image and og_image.get("content"):
        image_url = og_image["content"]

    return {"text": text, "image_url": image_url}
