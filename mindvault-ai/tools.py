"""
tools.py — Low-level tool functions for the Discovery Agent.
These are the "hands" of the agent: raw search + scrape utilities.
No LLM calls here — that comes later in the simplifier stage.
"""

import random
import time
from urllib.parse import urlparse
from ddgs import DDGS
from ddgs.exceptions import RatelimitException, DDGSException
from db import get_or_create_subtopics


def search_web(query: str, max_results: int = 5, retries: int = 2) -> list[dict]:
    """
    Search the web via DuckDuckGo and return raw results.

    Returns a list of dicts: [{title, url, snippet, source_domain}, ...]
    On failure (rate limit, network issue), returns an empty list rather than raising —
    the caller decides whether to fall back to mock data.
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
                time.sleep(1.5)  # brief backoff, then retry
                continue
            print(f"[search_web] Rate limited after {retries} retries for query: '{query}'")
            return []

        except DDGSException as e:
            print(f"[search_web] Search error for query '{query}': {e}")
            return []

        except Exception as e:
            print(f"[search_web] Unexpected error for query '{query}': {e}")
            return []

    return []


def build_search_query(interest: str, used_subtopics: set[str] = None) -> tuple[str, str]:
    """
    Given an interest topic and a set of already-used subtopics,
    picks an unused subtopic from the full subtopic pool (via db.get_or_create_subtopics).
    If all subtopics have been used, resets and cycles back to the full pool.

    Returns:
        (search_query_string, subtopic_chosen)
    """
    used = set(used_subtopics) if used_subtopics else set()
    pool = get_or_create_subtopics(interest)

    available = [s for s in pool if s not in used]
    if not available:
        available = list(pool) if pool else [interest]

    subtopic_chosen = random.choice(available)
    search_query = f"{subtopic_chosen} explained article"
    return search_query, subtopic_chosen


def dedupe_by_domain(results: list[dict], max_per_domain: int = 1) -> list[dict]:
    """
    Prevents the feed from being dominated by one site (e.g. 5 Wikipedia links).
    Keeps result order, just caps how many come from the same domain.
    """
    domain_counts = {}
    deduped = []
    for r in results:
        domain = r["source_domain"]
        count = domain_counts.get(domain, 0)
        if count < max_per_domain:
            deduped.append(r)
            domain_counts[domain] = count + 1
    return deduped
