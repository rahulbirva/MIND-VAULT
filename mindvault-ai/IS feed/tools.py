"""
tools.py — Search and deduplication utilities for the IS (Interest & Saved) Feed Agent.
"""

import time
from urllib.parse import urlparse
from ddgs import DDGS
from ddgs.exceptions import RatelimitException, DDGSException


def search_web(query: str, max_results: int = 5, retries: int = 2) -> list[dict]:
    """
    Search the web via DuckDuckGo and return raw results.
    Returns: [{title, url, snippet, source_domain}, ...]
    """
    for attempt in range(retries + 1):
        try:
            with DDGS() as ddgs:
                raw_results = list(ddgs.text(query, max_results=max_results))

            results = []
            for r in raw_results:
                url = r.get("href") or r.get("url") or ""
                if not url:
                    continue
                results.append({
                    "title": (r.get("title") or "").strip(),
                    "url": url,
                    "snippet": (r.get("body") or "").strip(),
                    "source_domain": urlparse(url).netloc.replace("www.", ""),
                })
            return results

        except RatelimitException:
            if attempt < retries:
                time.sleep(1.5)
                continue
            print(f"[IS search_web] Rate limited after {retries} retries for query: '{query}'")
            return []

        except DDGSException as e:
            print(f"[IS search_web] Search error for query '{query}': {e}")
            return []

        except Exception as e:
            print(f"[IS search_web] Unexpected error for query '{query}': {e}")
            return []

    return []


def dedupe_by_domain(results: list[dict], max_per_domain: int = 1) -> list[dict]:
    """
    Caps the number of search results coming from the exact same domain.
    """
    domain_counts = {}
    deduped = []
    for r in results:
        domain = r.get("source_domain", "")
        count = domain_counts.get(domain, 0)
        if count < max_per_domain:
            deduped.append(r)
            domain_counts[domain] = count + 1
    return deduped
