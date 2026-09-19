"""
demo_app.py — Interactive Test Bench for MindVault Proactive Discovery Engine.

Run with:
    streamlit run demo_app.py
or:
    python -m streamlit run mindvault-ai/discovery/demo_app.py
"""

import os
import sys
import time
import json
import streamlit as st

# Configure path so discovery and feed modules resolve from anywhere
CURRENT_DIR = os.path.abspath(os.path.dirname(__file__))
FEED_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "feed"))

for p in [CURRENT_DIR, FEED_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from db import (
    DB_ONLINE,
    get_or_refresh_categories,
    get_or_refresh_discovery_pool,
    get_category_pool,
    get_discovery_pool,
    get_used_discovery_topics,
    get_feed_for_user,
)
from category_generator import generate_categories
from discovery_generator import generate_topics_for_category
from discovery_topics import get_random_topic
from discovery import generate_daily_discovery_post

# Streamlit Page Config
st.set_page_config(
    page_title="MindVault — Discovery Engine Demo",
    page_icon="🧭",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom High-Aesthetic Styling
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .hero-title {
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.2rem;
    }

    .hero-sub {
        color: #94a3b8;
        font-size: 1.05rem;
        margin-bottom: 1.8rem;
    }

    .discovery-card {
        background: rgba(30, 41, 59, 0.75);
        border: 1px solid rgba(16, 185, 129, 0.25);
        border-radius: 16px;
        padding: 1.6rem;
        margin-top: 1.2rem;
        backdrop-filter: blur(12px);
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.35);
    }

    .discovery-badge {
        display: inline-block;
        background: rgba(16, 185, 129, 0.18);
        border: 1px solid rgba(16, 185, 129, 0.35);
        color: #6ee7b7;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        margin-right: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .topic-badge {
        display: inline-block;
        background: rgba(99, 102, 241, 0.18);
        border: 1px solid rgba(99, 102, 241, 0.35);
        color: #a5b4fc;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.78rem;
        font-weight: 700;
        margin-right: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .why-box {
        margin-top: 1rem;
        padding: 0.8rem 1.1rem;
        border-radius: 8px;
        background: rgba(99, 102, 241, 0.09);
        border-left: 3px solid #6366f1;
        color: #e0e7ff;
        font-size: 0.95rem;
    }

    .surprising-box {
        margin-top: 0.6rem;
        padding: 0.8rem 1.1rem;
        border-radius: 8px;
        background: rgba(245, 158, 11, 0.12);
        border-left: 3px solid #f59e0b;
        color: #fde68a;
        font-size: 0.95rem;
    }

    .try-box {
        margin-top: 0.6rem;
        padding: 0.8rem 1.1rem;
        border-radius: 8px;
        background: rgba(59, 130, 246, 0.12);
        border-left: 3px solid #3b82f6;
        color: #93c5fd;
        font-size: 0.95rem;
    }

    .key-point-row {
        display: flex;
        align-items: flex-start;
        margin-bottom: 0.5rem;
        font-size: 0.95rem;
        color: #cbd5e1;
    }

    .key-point-bullet {
        color: #10b981;
        font-weight: 800;
        margin-right: 0.6rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# Sidebar Configuration
with st.sidebar:
    st.markdown("### ⚙️ Engine Settings")
    user_id = st.text_input("User ID", value="hackathon_demo_user", help="Used to track shown topics and avoid duplicates")

    current_model = os.getenv("MODEL_NAME", "qwen2.5:7b")
    model_choice = st.selectbox(
        "Local LLM Model",
        options=["qwen2.5:7b", "qwen2.5:1.5b", "llama3:latest"],
        index=0 if current_model == "qwen2.5:7b" else 1,
    )
    os.environ["MODEL_NAME"] = model_choice

    mock_mode = st.toggle("Mock Mode (Instant, No AI)", value=False)
    os.environ["MOCK_MODE"] = "true" if mock_mode else "false"

    st.markdown("---")
    st.markdown("### 🌐 System Status")
    if DB_ONLINE:
        st.success("MongoDB Atlas: Online")
    else:
        st.warning("MongoDB Atlas: Offline (In-Memory Fallback)")

    st.caption(f"Active Model: `{model_choice}`")
    st.caption(f"Mock Mode: `{mock_mode}`")

# Header
st.markdown("<div class='hero-title'>🧭 Proactive Discovery Engine</div>", unsafe_allow_html=True)
st.markdown(
    "<div class='hero-sub'>Autonomous knowledge discovery powered by dynamic AI categories, claim-based topic pools, real web scraping, and local Qwen 2.5 simplification.</div>",
    unsafe_allow_html=True,
)

# Main Navigation Tabs
tab_live, tab_inspect, tab_history = st.tabs([
    "⚡ One-Click Discovery",
    "🔬 Step-by-Step Inspector",
    "📚 Saved User State",
])

# ─────────────────────────────────────────────────────────────────────────────
# TAB 1: Live One-Click Discovery
# ─────────────────────────────────────────────────────────────────────────────
with tab_live:
    col_btn, col_info = st.columns([1, 2])
    with col_btn:
        discover_clicked = st.button("🧭 Discover Something New", type="primary", use_container_width=True)
    with col_info:
        st.caption("Picks a practical topic (rights, laws, finance, health), finds real articles, scrapes text, and simplifies into 5 memorable fields.")

    if discover_clicked:
        with st.status("🚀 Running Proactive Discovery Pipeline...", expanded=True) as status:
            st.write("1️⃣ Checking active category & topic pools...")
            t0 = time.time()

            post = generate_daily_discovery_post(user_id=user_id, max_attempts=3)
            elapsed = time.time() - t0

            if post:
                status.update(label=f"✅ Discovered: {post.get('title')} ({elapsed:.2f}s)", state="complete")
                st.session_state["latest_discovery"] = post
            else:
                status.update(label="❌ Discovery attempts failed.", state="error")
                st.error("Could not surface a new discovery post. Please check your network or try again.")

    # Render Latest Discovery
    latest = st.session_state.get("latest_discovery")
    if latest:
        st.markdown("### 🌟 Latest Discovered Insight")
        
        img_html = (
            f"<div style='flex: 0 0 240px; margin-bottom: 0.75rem;'>"
            f"<img src='{latest['image_url']}' style='width: 100%; border-radius: 10px; object-fit: cover; max-height: 180px; box-shadow: 0 4px 12px rgba(0,0,0,0.4);' />"
            f"</div>"
            if latest.get("image_url")
            else ""
        )

        points_html = "".join([
            f"<div class='key-point-row'><span class='key-point-bullet'>•</span><span>{p}</span></div>"
            for p in latest.get("key_points", [])
        ])

        card_html = f"""
        <div class='discovery-card'>
            <div>
                <span class='discovery-badge'>🧭 PROACTIVE DISCOVERY</span>
                <span class='topic-badge'>🎯 {latest.get('topic', 'Topic')}</span>
                <span style='color: #64748b; font-family: monospace; font-size: 0.82rem;'>{latest.get('source_domain', 'web')}</span>
            </div>
            <h3 style='margin: 0.75rem 0 1rem 0; font-size: 1.4rem;'>
                <a href='{latest.get("source_url", "#")}' target='_blank' style='color: #f8fafc; text-decoration: none;'>
                    {latest.get('title', 'Untitled')} <span style='font-size:0.95rem; color:#34d399;'>↗</span>
                </a>
            </h3>
            <div style='display: flex; gap: 1.25rem; flex-wrap: wrap; align-items: flex-start;'>
                {img_html}
                <div style='flex: 1; min-width: 280px;'>
                    <p style='color: #f1f5f9; font-size: 1.05rem; line-height: 1.65; margin: 0;'>{latest.get('summary', '')}</p>
                </div>
            </div>
            <div class='why-box'>
                <strong>💡 Why it matters:</strong> {latest.get('why_it_matters', '')}
            </div>
            <div class='surprising-box'>
                <strong>⚡ Surprising Fact:</strong> {latest.get('surprising_fact', '')}
            </div>
            <div class='try-box'>
                <strong>🛠️ Try This:</strong> {latest.get('try_this', '')}
            </div>
            <div style='margin-top: 1.1rem;'>
                <div style='color: #94a3b8; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;'>Key Takeaways</div>
                {points_html}
            </div>
        </div>
        """
        st.html(card_html)

        with st.expander("🔍 View Raw Post JSON"):
            st.json(latest)

# ─────────────────────────────────────────────────────────────────────────────
# TAB 2: Step-by-Step Inspector
# ─────────────────────────────────────────────────────────────────────────────
with tab_inspect:
    st.markdown("### 🔬 Test Individual Engine Layers")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("#### 1. Category Pool (7-day Refresh)")
        live_cats = get_or_refresh_categories()
        st.write(f"Current Categories in Pool ({len(live_cats)}):")
        st.write(live_cats)

        if st.button("Generate 3 New Categories (Ollama)"):
            with st.spinner("Asking LLM for non-trivia practical categories..."):
                new_c = generate_categories(existing_categories=live_cats, count=3)
                st.success(f"Generated {len(new_c)} categories:")
                st.write(new_c)

    with col2:
        st.markdown("#### 2. Topic Pool for Category (24-hr Refresh)")
        selected_cat = st.selectbox("Select Category", options=live_cats)
        cached_topics = get_or_refresh_discovery_pool(selected_cat)
        st.write(f"Cached Topics for '{selected_cat}' ({len(cached_topics)}):")
        st.write(cached_topics)

        if st.button(f"Generate 4 New Topics for '{selected_cat}'"):
            with st.spinner(f"Generating actionable claim-based topics for '{selected_cat}'..."):
                new_t = generate_topics_for_category(category=selected_cat, existing_topics=cached_topics, count=4)
                st.success(f"Generated {len(new_t)} topics:")
                st.write(new_t)

    st.markdown("---")
    st.markdown("#### 3. Random Topic Selector (`get_random_topic`)")
    if st.button("Pick Random Unshown Topic"):
        used = get_used_discovery_topics(user_id)
        chosen = get_random_topic(exclude=used)
        st.info(f"🎯 Selected Topic: **{chosen}**")

# ─────────────────────────────────────────────────────────────────────────────
# TAB 3: Saved User State & History
# ─────────────────────────────────────────────────────────────────────────────
with tab_history:
    st.markdown(f"### 📚 User State for `{user_id}`")

    used_topics = list(get_used_discovery_topics(user_id))
    st.write(f"**Used Discovery Topics Count:** {len(used_topics)}")
    if used_topics:
        st.write(used_topics)
    else:
        st.caption("No topics have been marked as used for this user yet.")

    st.markdown("---")
    st.markdown(f"### 🗄️ Saved Discovery Posts in Database")
    all_posts = get_feed_for_user(user_id, limit=20)
    disc_posts = [p for p in all_posts if p.get("source") == "discovery"]

    if disc_posts:
        st.write(f"Found **{len(disc_posts)}** discovery posts saved for `{user_id}`:")
        st.json(disc_posts)
    else:
        st.caption("No discovery posts saved for this user in MongoDB yet. Click 'Discover Something New' in Tab 1!")
