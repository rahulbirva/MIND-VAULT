"""
mock_data.py — Pre-baked fallback article suggestions.

If DuckDuckGo rate-limits you or the WiFi dies mid-demo, flip MOCK_MODE
and the app keeps working with data that looks identical in shape to
the real pipeline's output. Add more interests here the night before
based on whatever you plan to demo live.
"""

MOCK_ARTICLES = {
    "space": [
        {
            "title": "How Rockets Actually Reach Orbit",
            "url": "https://example.com/rockets-orbit",
            "snippet": "A plain-language walkthrough of orbital mechanics and staged rocket launches.",
            "source_domain": "example.com",
        },
        {
            "title": "The James Webb Telescope, Explained Simply",
            "url": "https://example.com/jwst-explained",
            "snippet": "What JWST actually does and why infrared matters for deep space imaging.",
            "source_domain": "example.com",
        },
        {
            "title": "Why the Moon Landing Took a Decade to Prepare",
            "url": "https://example.com/apollo-timeline",
            "snippet": "The engineering and political timeline behind the Apollo program.",
            "source_domain": "example.com",
        },
    ],
    "politics": [
        {
            "title": "How a Bill Actually Becomes Law",
            "url": "https://example.com/bill-to-law",
            "snippet": "A simplified breakdown of the legislative process, step by step.",
            "source_domain": "example.com",
        },
        {
            "title": "Understanding Coalition Governments",
            "url": "https://example.com/coalition-govts",
            "snippet": "Why multi-party systems form coalitions and how power-sharing works.",
            "source_domain": "example.com",
        },
    ],
    "history": [
        {
            "title": "The Cold War in 10 Minutes",
            "url": "https://example.com/cold-war-summary",
            "snippet": "Key events and turning points of the US-USSR rivalry, simplified.",
            "source_domain": "example.com",
        },
        {
            "title": "Why the Roman Empire Actually Fell",
            "url": "https://example.com/rome-fall",
            "snippet": "The economic, military, and political factors behind Rome's decline.",
            "source_domain": "example.com",
        },
    ],
}

DEFAULT_MOCK = [
    {
        "title": "Sample Article: Topic Overview",
        "url": "https://example.com/sample",
        "snippet": "A general placeholder article used when no specific mock data exists for this interest.",
        "source_domain": "example.com",
    }
]


def get_mock_articles(interest: str) -> list[dict]:
    return MOCK_ARTICLES.get(interest.lower().strip(), DEFAULT_MOCK)
