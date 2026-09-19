"""
app.py — Interactive Streamlit Dashboard for the Interest & Saved (IS) Feed AI Agent.
Runs on port 8503.
"""

import sys
from pathlib import Path
import streamlit as st

# Setup module path
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from saved_analyzer import analyze_user_saved_interests
from pipeline import generate_blended_feed, generate_is_feed_for_user
from db import get_user_info, get_user_is_posts, get_all_users

st.set_page_config(
    page_title="MindVault — IS Feed AI Agent",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for rich styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.2rem;
    }
    .badge-is {
        display: inline-block;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.5px;
    }
    .badge-standard {
        display: inline-block;
        background: linear-gradient(135deg, #0ea5e9, #06b6d4);
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.5px;
    }
    .tag-pill {
        display: inline-block;
        background: #1e293b;
        color: #94a3b8;
        border: 1px solid #334155;
        border-radius: 16px;
        padding: 2px 8px;
        font-size: 0.75rem;
        margin: 2px 4px 2px 0;
    }
    .stat-box {
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 10px;
        padding: 12px 16px;
        text-align: center;
    }
    .why-box {
        background: rgba(99, 102, 241, 0.12);
        border-left: 3px solid #6366f1;
        padding: 10px 14px;
        border-radius: 0 8px 8px 0;
        margin: 10px 0;
        font-size: 0.88rem;
    }
</style>
""", unsafe_allow_html=True)

st.markdown('<div class="main-header">🧠 MindVault IS Feed AI Agent</div>', unsafe_allow_html=True)
st.caption("Personalized feed generator based on user declared interests + saved feed items & semantic tags (40% Standard / 60% IS Feed blend).")

# Sidebar configuration
st.sidebar.header("⚙️ User & Agent Settings")
users = get_all_users()
user_options = {u.get("username", u.get("userId", "Unknown")): u.get("userId", "demo_user_1") for u in users}
if not user_options:
    user_options = {"Demo User (demo_user_1)": "demo_user_1", "Test Learner (test_user)": "test_user"}

selected_user_label = st.sidebar.selectbox("Select Active User", list(user_options.keys()))
user_id = user_options[selected_user_label]

st.sidebar.markdown("---")
st.sidebar.subheader("⚖️ Recommendation Ratio")
is_percent = st.sidebar.slider("IS Feed Agent Ratio (%)", min_value=0, max_value=100, value=60, step=10)
standard_percent = 100 - is_percent
st.sidebar.info(f"**Blend Configuration:**\n- 🎯 **IS Feed Agent**: {is_percent}%\n- 🌐 **Standard Feed Agent**: {standard_percent}%")

total_posts_requested = st.sidebar.slider("Total Posts to Generate", min_value=2, max_value=12, value=6, step=2)

# Analyze user profile
with st.spinner("Analyzing saved tags & interest profile from MongoDB..."):
    profile = analyze_user_saved_interests(user_id)

col1, col2, col3, col4 = st.columns(4)
with col1:
    st.markdown(f'<div class="stat-box"><h4>Declared Interests</h4><h3>{len(profile.get("declared_interests", []))}</h3></div>', unsafe_allow_html=True)
with col2:
    st.markdown(f'<div class="stat-box"><h4>Saved Items</h4><h3>{profile.get("saved_items_count", 0)}</h3></div>', unsafe_allow_html=True)
with col3:
    st.markdown(f'<div class="stat-box"><h4>Extracted Tags</h4><h3>{len(profile.get("top_tags", []))}</h3></div>', unsafe_allow_html=True)
with col4:
    st.markdown(f'<div class="stat-box"><h4>Target Ratio</h4><h3>{standard_percent}% / {is_percent}%</h3></div>', unsafe_allow_html=True)

st.markdown("---")

# User Tag Cloud and Interest Overview
st.subheader("📊 User Intelligence Profile")
pcol1, pcol2 = st.columns([1, 1])

with pcol1:
    st.markdown("**🎯 Declared Interests:**")
    d_interests = profile.get("declared_interests", [])
    if d_interests:
        st.write(" • ".join([f"`{i}`" for i in d_interests]))
    else:
        st.write("*(No explicit interests registered yet)*")

with pcol2:
    st.markdown("**🏷️ Top Saved Semantic Tags (from DB):**")
    top_tags = profile.get("top_tags", [])
    if top_tags:
        tags_html = " ".join([f'<span class="tag-pill">🏷️ {t}</span>' for t in top_tags[:10]])
        st.markdown(tags_html, unsafe_allow_html=True)
    else:
        st.write("*(Save items in your feed to train your IS tag profile)*")

st.markdown("---")

# Actions
btn_col1, btn_col2 = st.columns([1, 1])
with btn_col1:
    generate_btn = st.button("🚀 Generate Blended Feed (40/60)", type="primary", use_container_width=True)
with btn_col2:
    is_only_btn = st.button("⚡ Generate Pure IS Feed (100% Personalized)", use_container_width=True)

# Generation Logic
if generate_btn:
    with st.spinner(f"Generating {total_posts_requested} posts ({standard_percent}% Standard / {is_percent}% IS Feed)..."):
        result = generate_blended_feed(
            user_id=user_id,
            total_posts=total_posts_requested,
            standard_ratio=standard_percent / 100.0,
            is_ratio=is_percent / 100.0,
        )
        st.session_state["current_feed"] = result.get("feed", [])
        st.session_state["feed_stats"] = result.get("stats", {})

elif is_only_btn:
    with st.spinner(f"Synthesizing {total_posts_requested} deep-dive posts from saved tags..."):
        posts = generate_is_feed_for_user(user_id, count=total_posts_requested)
        st.session_state["current_feed"] = posts
        st.session_state["feed_stats"] = {
            "total_posts": len(posts),
            "is_posts_count": len(posts),
            "standard_posts_count": 0,
            "is_percentage": "100%",
            "standard_percentage": "0%",
        }

# Display Feed
if "current_feed" in st.session_state and st.session_state["current_feed"]:
    stats = st.session_state.get("feed_stats", {})
    st.subheader("📰 Generated Feed Stream")
    st.caption(f"Showing **{stats.get('total_posts', 0)}** posts — **{stats.get('is_percentage', '60%')}** IS Personalized, **{stats.get('standard_percentage', '40%')}** Standard Discovery.")

    feed = st.session_state["current_feed"]
    for idx, post in enumerate(feed):
        is_agent = post.get("source_agent") == "is_feed"
        badge_class = "badge-is" if is_agent else "badge-standard"
        badge_text = "✨ 60% IS FEED AGENT (Personalized via Saved Tags)" if is_agent else "🌐 40% STANDARD FEED AGENT (Broad Discovery)"

        with st.container():
            st.markdown(f'<div style="margin-top: 20px;"><span class="{badge_class}">{badge_text}</span></div>', unsafe_allow_html=True)
            st.markdown(f"### {post.get('title', 'Educational Article')}")

            subtopic = post.get("subtopic", "")
            if subtopic:
                st.caption(f"**Subtopic:** {subtopic} | **Source:** {post.get('source_domain', 'mindvault.ai')}")

            # Summary
            st.markdown(f"**Summary:** {post.get('summary', '')}")

            # Personalized rationale box
            why = post.get("why_it_matches_you") or post.get("why_it_matters")
            if why:
                why_label = "💡 Why this matches your saved reading taste:" if is_agent else "💡 Why this matters:"
                st.markdown(f'<div class="why-box"><strong>{why_label}</strong> {why}</div>', unsafe_allow_html=True)

            # Key Points
            kp = post.get("key_points", [])
            if kp:
                st.markdown("**Key Takeaways:**")
                for p in kp:
                    st.markdown(f"- {p}")

            # Surprising fact & Try this
            sf = post.get("surprising_fact")
            tt = post.get("try_this")
            if sf or tt:
                exp_col1, exp_col2 = st.columns(2)
                with exp_col1:
                    if sf:
                        st.info(f"**🤯 Surprising Fact:**\n{sf}")
                with exp_col2:
                    if tt:
                        st.success(f"**🧠 Quick Reflection:**\n{tt}")

            # Tags
            tags = post.get("tags", [])
            if tags:
                tags_html = " ".join([f'<span class="tag-pill">#{t}</span>' for t in tags])
                st.markdown(f"<div style='margin-top: 8px;'>{tags_html}</div>", unsafe_allow_html=True)

            st.markdown("---")
