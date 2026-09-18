"""
app.py — Interactive Streamlit interface for MindVault.
Allows testing article search, web scraping, Qwen AI simplification,
and MongoDB persistence / in-memory fallback live in a polished UI.
"""

import os
import sys
import time
import textwrap
import streamlit as st

# Configure UTF-8 for Windows console/terminal compatibility
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from article_suggester import suggest_articles_for_interest
from scraper import scrape_article
from simplifier import simplify_text
from tools import build_search_query
from db import (
    DB_ONLINE,
    has_seen_url,
    save_post,
    get_feed_for_user,
    get_used_subtopics,
    mark_subtopic_used,
    _mock_posts,
)

# Page Configuration
st.set_page_config(
    page_title="MindVault — AI Content Simplifier",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for modern, high-aesthetic styling
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .main-header {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 2.6rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        margin-bottom: 0.2rem;
    }

    .sub-header {
        color: #94a3b8;
        font-size: 1.05rem;
        margin-bottom: 1.5rem;
    }

    .post-card {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(148, 163, 184, 0.15);
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(12px);
        transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .post-card:hover {
        border-color: rgba(99, 102, 241, 0.4);
        transform: translateY(-2px);
    }

    .tag-badge {
        display: inline-block;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
        color: #a5b4fc;
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 9999px;
        padding: 0.2rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-right: 0.5rem;
    }

    .domain-badge {
        display: inline-block;
        background: rgba(15, 23, 42, 0.6);
        color: #94a3b8;
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 9999px;
        padding: 0.2rem 0.65rem;
        font-size: 0.75rem;
        font-family: 'JetBrains Mono', monospace;
    }

    .why-it-matters-box {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05));
        border-left: 4px solid #f59e0b;
        border-radius: 0 8px 8px 0;
        padding: 0.85rem 1.1rem;
        margin: 1rem 0;
        color: #fde68a;
        font-size: 0.95rem;
    }

    .key-point-item {
        background: rgba(15, 23, 42, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 0.65rem 0.9rem;
        margin-bottom: 0.5rem;
        color: #e2e8f0;
        font-size: 0.92rem;
        display: flex;
        align-items: flex-start;
        gap: 0.6rem;
    }

    .key-point-bullet {
        color: #6366f1;
        font-weight: bold;
    }

    .timing-badge {
        color: #64748b;
        font-size: 0.8rem;
        font-family: 'JetBrains Mono', monospace;
        margin-top: 0.5rem;
    }

    .db-status-online {
        color: #10b981;
        font-weight: 600;
    }

    .db-status-offline {
        color: #f59e0b;
        font-weight: 600;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# Sidebar: Controls and Configuration
with st.sidebar:
    st.markdown("### ⚙️ Pipeline Settings")

    user_id = st.text_input("User ID", value="test_user_1", help="Identifier for feed persistence & duplicate detection")
    
    # Model Selector
    current_model = os.getenv("MODEL_NAME", "qwen2.5:7b")
    model_choice = st.selectbox(
        "AI Model (via Ollama)",
        options=["qwen2.5:7b", "qwen2.5:1.5b", "llama3:latest"],
        index=0 if current_model == "qwen2.5:7b" else 1,
    )
    os.environ["MODEL_NAME"] = model_choice

    # Mock mode switch
    mock_mode = st.toggle("Mock Mode (Instant, No AI/Scrape)", value=False)
    os.environ["MOCK_MODE"] = "true" if mock_mode else "false"

    st.markdown("---")
    st.markdown("### 🌐 System Status")

    # DB Status check
    if DB_ONLINE:
        st.markdown("Database: <span class='db-status-online'>● Online (MongoDB Atlas)</span>", unsafe_allow_html=True)
    else:
        st.markdown("Database: <span class='db-status-offline'>⚠️ Offline (Fallback Mode)</span>", unsafe_allow_html=True)
        st.caption("MongoDB not reachable. Running with in-memory fallback without crashing.")

    st.markdown(f"Ollama Model: `{model_choice}`")

    st.markdown("---")
    if st.button("🗑️ Clear In-Memory Posts"):
        _mock_posts.clear()
        st.success("In-memory posts cleared.")

# Main Interface Header
st.markdown("<div class='main-header'>MindVault Learning Feed</div>", unsafe_allow_html=True)
st.markdown(
    "<div class='sub-header'>Turn raw internet articles into clear, bite-sized concepts powered by Qwen 2.5 and local AI.</div>",
    unsafe_allow_html=True,
)

# Tabs
tab_feed, tab_test_single, tab_history = st.tabs(["🚀 Generate Feed", "🔬 Single Article Lab", "📚 Saved Posts"])

with tab_feed:
    col1, col2 = st.columns([3, 1])
    with col1:
        interests_input = st.text_input(
            "Interests (comma separated)",
            value="space, artificial intelligence",
            help="E.g. space, quantum computing, biology, neuroscience",
        )
    with col2:
        max_articles = st.slider("Articles per Topic", min_value=1, max_value=3, value=1)

    interests = [i.strip() for i in interests_input.split(",") if i.strip()]

    if st.button("⚡ Generate Feed", type="primary", use_container_width=True):
        if not interests:
            st.warning("Please enter at least one interest topic.")
        else:
            with st.status("Running MindVault Pipeline...", expanded=True) as status:
                total_posts = 0
                for interest in interests:
                    used_subtopics = get_used_subtopics(user_id, interest)
                    query, subtopic = build_search_query(interest, used_subtopics)
                    st.write(f"🎯 Expanded **{interest}** into subtopic: **{subtopic}** (query: `{query}`)...")
                    raw_articles = suggest_articles_for_interest(
                        interest,
                        max_results=max_articles,
                        query=query,
                        subtopic=subtopic,
                    )

                    for art in raw_articles:
                        # Duplicate check
                        is_duplicate = has_seen_url(user_id, art["url"])
                        if is_duplicate:
                            st.info(f"⏭️ Skipping duplicate: **{art['title']}** (already shown to {user_id})")
                            continue

                        st.write(f"📄 Scraping & processing: **{art['title']}**...")
                        t0 = time.time()
                        scraped = scrape_article(art["url"])
                        t_scrape = time.time() - t0

                        text_to_simplify = scraped["text"] or art.get("snippet", "")

                        st.write(f"🧠 Synthesizing with **{model_choice}**...")
                        t1 = time.time()
                        simplified = simplify_text(text_to_simplify, title=art["title"])
                        t_simplify = time.time() - t1
                        total_time = time.time() - t0

                        post = {
                            "title": art["title"],
                            "summary": simplified["summary"],
                            "key_points": simplified["key_points"],
                            "why_it_matters": simplified.get("why_it_matters", ""),
                            "image_url": scraped["image_url"],
                            "source_url": art["url"],
                            "source_domain": art["source_domain"],
                            "interest": interest,
                            "subtopic": subtopic,
                            "scrape_sec": round(t_scrape, 2),
                            "simplify_sec": round(t_simplify, 2),
                            "total_sec": round(total_time, 2),
                        }

                        save_post(user_id, post)
                        mark_subtopic_used(user_id, interest, subtopic)
                        total_posts += 1

                status.update(label=f"Done! Generated and saved {total_posts} new post(s).", state="complete")

            st.rerun()

    # Display Feed for user
    saved_posts = get_feed_for_user(user_id, limit=30)
    if saved_posts:
        st.markdown(f"### Feed for `{user_id}` ({len(saved_posts)} items)")
        for post in saved_posts:
            img_html = (
                f"<div style='flex: 0 0 240px; margin-bottom: 0.75rem;'>"
                f"<img src='{post['image_url']}' style='width: 100%; border-radius: 10px; object-fit: cover; max-height: 180px; box-shadow: 0 4px 12px rgba(0,0,0,0.4);' />"
                f"</div>"
                if post.get("image_url")
                else ""
            )

            points_html = "".join(
                [
                    f"<div class='key-point-item'><span class='key-point-bullet'>•</span><span>{pt}</span></div>"
                    for pt in post.get("key_points", [])
                ]
            )

            why_html = (
                f"<div class='why-it-matters-box'><strong>💡 Why it matters:</strong> {post['why_it_matters']}</div>"
                if post.get("why_it_matters")
                else ""
            )

            timing_html = (
                f"<div class='timing-badge'>⏱️ Timings: scrape={post.get('scrape_sec', 0)}s | "
                f"simplify={post.get('simplify_sec', 0)}s | total={post.get('total_sec', 0)}s</div>"
                if post.get("total_sec")
                else ""
            )

            subtopic_badge = (
                f"<span class='tag-badge' style='background:rgba(236,72,153,0.18); border-color:rgba(236,72,153,0.35); color:#f472b6;'>🎯 {post['subtopic']}</span>"
                if post.get("subtopic")
                else ""
            )

            card_html = f"""
            <div class='post-card'>
                <div style='display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;'>
                    <div>
                        <span class='tag-badge'>{post.get('interest', 'General')}</span>
                        {subtopic_badge}
                        <span class='domain-badge'>{post.get('source_domain', 'web')}</span>
                    </div>
                </div>
                <h3 style='margin:0 0 0.85rem 0; font-size: 1.35rem;'>
                    <a href='{post.get("source_url", "#")}' target='_blank' style='color:#f8fafc; text-decoration:none;'>
                        {post.get('title', 'Untitled')} <span style='font-size:0.9rem; color:#818cf8;'>↗</span>
                    </a>
                </h3>
                <div style='display: flex; flex-direction: row; gap: 1.25rem; align-items: flex-start; margin-bottom: 0.75rem; flex-wrap: wrap;'>
                    {img_html}
                    <div style='flex: 1; min-width: 260px;'>
                        <p style='color:#f1f5f9; font-size:1.02rem; line-height:1.65; margin:0;'>{post.get('summary', '')}</p>
                    </div>
                </div>
                {why_html}
                <div style='margin-top: 0.75rem;'>
                    <div style='color:#94a3b8; font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.4rem;'>Key Takeaways</div>
                    {points_html}
                </div>
                {timing_html}
            </div>
            """
            st.html(card_html)
    else:
        st.info("No posts found in feed yet. Click **⚡ Generate Feed** above to run the pipeline!")

with tab_test_single:
    st.markdown("### Test Individual Article Processing")
    test_url = st.text_input("Article URL to Scrape & Simplify", value="https://en.wikipedia.org/wiki/Space")
    test_title = st.text_input("Article Title", value="Space - Wikipedia")

    if st.button("Run Scrape + Simplification Test"):
        with st.spinner("Scraping webpage..."):
            t0 = time.time()
            scraped = scrape_article(test_url)
            t_scrape = time.time() - t0
            st.success(f"Scraped {len(scraped['text'])} characters in {t_scrape:.2f}s")
            if scraped.get("image_url"):
                st.image(scraped["image_url"], width=280, caption="Extracted og:image")

        with st.spinner(f"Simplifying via {model_choice}..."):
            t1 = time.time()
            simplified = simplify_text(scraped["text"], title=test_title)
            t_simplify = time.time() - t1
            st.success(f"Simplification finished in {t_simplify:.2f}s")

        st.json(simplified)

with tab_history:
    st.markdown("### Raw Database / In-Memory Explorer")
    st.write(f"Database Online: **{DB_ONLINE}**")
    if DB_ONLINE:
        try:
            feed = get_feed_for_user(user_id, limit=50)
            st.write(f"Total documents returned for `{user_id}`: {len(feed)}")
            st.json(feed)
        except Exception as e:
            st.error(f"Error querying MongoDB: {e}")
    else:
        st.write(f"Total In-Memory Mock Posts: {len(_mock_posts)}")
        st.json(_mock_posts)
