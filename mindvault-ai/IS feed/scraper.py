"""
scraper.py — Article scraper for IS Feed Agent.
Fetches article text and og:image metadata.
"""

import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def scrape_article(url: str, timeout: int = 6) -> dict:
    """
    Scrapes the main content and open-graph image from a given web URL.
    Returns {"text": str, "image_url": str | None}.
    """
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"[IS feed - scrape_article] Failed to fetch {url}: {e}")
        return {"text": "", "image_url": None}

    try:
        soup = BeautifulSoup(resp.text, "html.parser")
        paragraphs = [p.get_text(strip=True) for p in soup.find_all("p")]
        text = " ".join(paragraphs)
        text = text[:6000]

        image_url = None
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            image_url = og_image["content"]

        return {"text": text, "image_url": image_url}
    except Exception as e:
        print(f"[IS feed - scrape_article] Parse error for {url}: {e}")
        return {"text": "", "image_url": None}
