"""
reels_app.py — MindVault AI Reels Studio (Streamlit Demo)
================================================================================
An interactive Streamlit interface for the AI Reels feature:
- 📱 Reels Video Feed: Watch local pre-generated clips with factual captions.
- 🧠 Prompt Engineering Playground: Live Qwen 2.5:7b structured prompt generator.
- 📋 Batch Inspector: Review dry-run prompts, negative prompts, and manifest data.
================================================================================
"""

import os
import sys
import json
import time
import streamlit as st

# Configure UTF-8 for Windows console/terminal
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add current dir to sys.path to import generate_reels
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from generate_reels import (
    generate_reel_spec,
    fetch_user_profile_context,
    load_manifest,
    REEL_PROMPTS,
    OUTPUT_DIR,
    MANIFEST_PATH,
    PREVIEW_PATH,
    MODEL_NAME,
    WANGP_API_URL,
    QUANT_LABEL,
    QUANT_SETTING,
    WIDTH,
    HEIGHT,
    run_dry_run,
)

# Page configuration
st.set_page_config(
    page_title="MindVault — AI Reels Studio",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for modern dark aesthetic
st.markdown("""
<style>
    /* Dark glassmorphic container styling */
    .reel-header-badge {
        display: inline-block;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
        border: 1px solid rgba(129, 140, 248, 0.4);
        color: #c7d2fe;
        padding: 4px 14px;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin-bottom: 8px;
    }
    .fact-card {
        background: rgba(15, 23, 42, 0.85);
        border-left: 4px solid #6366f1;
        border-radius: 8px;
        padding: 12px 16px;
        margin: 12px 0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    .fact-title {
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        color: #818cf8;
        letter-spacing: 0.05em;
        margin-bottom: 4px;
    }
    .fact-body {
        font-size: 0.95rem;
        line-height: 1.45;
        color: #f1f5f9;
        font-weight: 500;
        margin: 0;
    }
    .prompt-box {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 10px 14px;
        font-family: monospace;
        font-size: 0.85rem;
        color: #cbd5e1;
        line-height: 1.5;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.markdown("### ⚡ MindVault AI")
    st.markdown("#### **AI Reels Studio 🎬**")
    st.caption("Offline video generation & prompt engineering")
    st.divider()

    st.markdown(f"**LLM Model:** `{MODEL_NAME}` (Ollama)")
    st.markdown(f"**Video Model:** `Wan 2.2 ({QUANT_LABEL} GGUF)`")
    st.markdown(f"**WanGP Endpoint:** `{WANGP_API_URL}`")
    st.markdown(f"**Storage:** `{OUTPUT_DIR}`")
    st.divider()

    if st.button("🔄 Refresh Data", use_container_width=True):
        st.cache_data.clear()
        st.success("Refreshed!")
        st.rerun()

    st.markdown("---")
    st.caption("MindVault — DSU DevHack")

# Main Title
st.title("🎬 MindVault — AI Reels Studio")
st.markdown("High-engagement short-form educational video feed powered by **Wan 2.2** and **Qwen 2.5:7b**.")

# Tabs
tab_feed, tab_playground, tab_batch = st.tabs([
    "📱 Reels Player Feed",
    "🧠 Qwen 2.5 Prompt Playground",
    "📋 Batch & Dry-Run Inspector",
])

# ─────────────────────────────────────────────────────────────────────────────
# TAB 1: Reels Player Feed
# ─────────────────────────────────────────────────────────────────────────────
with tab_feed:
    manifest = load_manifest()
    
    if not manifest:
        st.warning("⚠️ No reels found in manifest. Run the generator script or check `generated_reels/`.")
    else:
        # Category Filter
        topics = ["All"] + sorted(list({item.get("topic", "").title() for item in manifest if item.get("topic")}))
        selected_topic = st.selectbox("Filter by Topic:", topics, index=0)
        
        filtered = manifest
        if selected_topic and selected_topic != "All":
            filtered = [item for item in manifest if item.get("topic", "").lower() == selected_topic.lower()]
        
        if not filtered:
            st.info(f"No reels matching topic '{selected_topic}'. Showing all.")
            filtered = manifest

        col_player, col_info = st.columns([1.2, 1.8], gap="large")

        # Session state for current reel index
        if "reel_idx" not in st.session_state or st.session_state["reel_idx"] >= len(filtered):
            st.session_state["reel_idx"] = 0

        current_idx = st.session_state["reel_idx"]
        current_reel = filtered[current_idx]

        with col_player:
            st.markdown(f"<span class='reel-header-badge'>✨ {current_reel.get('topic', '').upper()}</span>", unsafe_allow_html=True)
            st.subheader(current_reel.get("title", "Untitled Reel"))

            video_filename = current_reel.get("filename", "")
            video_filepath = os.path.join(OUTPUT_DIR, video_filename)

            if os.path.exists(video_filepath):
                # Native Streamlit video player
                st.video(video_filepath, autoplay=True, loop=True)
                file_size_kb = os.path.getsize(video_filepath) / 1024
                st.caption(f"📁 `{video_filename}` • {file_size_kb:.1f} KB • {WIDTH}x{HEIGHT} • 24fps • H.264")
            else:
                st.error(f"Video file `{video_filename}` not found on disk at `{video_filepath}`.")

            # Reel navigation buttons
            c_prev, c_pos, c_next = st.columns([1, 1.5, 1])
            with c_prev:
                if st.button("⬅️ Prev", use_container_width=True):
                    st.session_state["reel_idx"] = (current_idx - 1) % len(filtered)
                    st.rerun()
            with c_pos:
                st.markdown(f"<div style='text-align:center; padding-top:6px; font-weight:600; color:#94a3b8;'>{current_idx + 1} of {len(filtered)}</div>", unsafe_allow_html=True)
            with c_next:
                if st.button("Next ➡️", use_container_width=True):
                    st.session_state["reel_idx"] = (current_idx + 1) % len(filtered)
                    st.rerun()

        with col_info:
            # Factual Caption Card
            caption = current_reel.get("caption") or "A fascinating discovery in this topic that transformed modern human understanding."
            st.markdown(f"""
            <div class="fact-card">
                <div class="fact-title">💡 Factual Video Overlay Caption</div>
                <p class="fact-body">"{caption}"</p>
            </div>
            """, unsafe_allow_html=True)

            # Prompt Breakdown
            st.markdown("#### 🎬 Wan 2.2 Generation Prompt")
            video_prompt = current_reel.get("video_prompt") or current_reel.get("prompt", "")
            st.markdown(f"<div class='prompt-box'>{video_prompt}</div>", unsafe_allow_html=True)

            neg_prompt = current_reel.get("negative_prompt") or "morphing, warping, distorted faces, flickering, extra limbs, text, watermark"
            st.markdown("#### 🚫 Negative Prompt")
            st.code(neg_prompt, language="text")

            # Model & Metadata
            st.markdown("#### ⚙️ Reel Specifications")
            spec_col1, spec_col2 = st.columns(2)
            with spec_col1:
                st.metric("Video Model", "Wan 2.2", f"{QUANT_LABEL} GGUF")
                st.metric("Target Resolution", f"{WIDTH} × {HEIGHT}", "9:16 Vertical")
            with spec_col2:
                st.metric("Prompt LLM", MODEL_NAME, "Ollama")
                st.metric("Clip Duration", "5.0s @ 24fps", "120 Frames")

# ─────────────────────────────────────────────────────────────────────────────
# TAB 2: Qwen 2.5 Prompt Playground
# ─────────────────────────────────────────────────────────────────────────────
with tab_playground:
    st.subheader("🧠 Live Qwen 2.5:7b User-Adaptive Scene Director Playground")
    st.markdown("Generate personalized **Wan 2.2** video prompts & factual captions conditioned on user interests and liked reel history.")

    p_col1, p_col2 = st.columns([1, 1], gap="medium")

    with p_col1:
        st.markdown("#### 🎯 1. Target Topic & Subject")
        custom_topic = st.text_input("Enter Topic:", value="Quantum Computing")
        custom_angle = st.text_input("Sub-Angle or Context (Optional):", value="qubits in dilution refrigerator, laser control")

        st.markdown("#### 👤 2. User Persona & Taste Conditioning")
        user_interests_input = st.text_input(
            "User's Declared Interests:",
            value="Quantum Physics, Microelectronics, Deep Tech, Astrophysics"
        )
        user_likes_input = st.text_input(
            "Content User Previously Liked & Enjoyed:",
            value="Inside the Silicon Core (microchip macro shots), Orbital Launch Ascent (high-velocity physics)"
        )

        generate_btn = st.button("🚀 Generate Personalized Reel Spec with Qwen 2.5:7b", type="primary", use_container_width=True)

    if generate_btn and custom_topic:
        user_ctx = {
            "username": "Current User",
            "interests": [i.strip() for i in user_interests_input.split(",") if i.strip()],
            "liked_reels": [{"title": l.strip(), "topic": "favorite"} for l in user_likes_input.split(",") if l.strip()],
        }

        with st.spinner(f"Personalizing prompt with {MODEL_NAME} via Ollama..."):
            t0 = time.time()
            spec = generate_reel_spec(custom_topic, sub_angle=custom_angle, user_context=user_ctx)
            elapsed = time.time() - t0

        st.success(f"Generated personalized spec in {elapsed:.2f}s!")

        st.markdown("### 📋 Personalized Reel Specification")

        # 4-Part Prompt
        st.markdown("#### 1. 🎬 Structured Visual Prompt (Ready for Wan 2.2)")
        st.markdown(f"<div class='prompt-box'>{spec['video_prompt']}</div>", unsafe_allow_html=True)

        # Negative Prompt
        st.markdown("#### 2. 🚫 Negative Prompt")
        st.code(spec['negative_prompt'], language="text")

        # Factual Caption
        st.markdown("#### 3. 💡 Factual Overlay Caption (Tailored Hook)")
        st.markdown(f"""
        <div class="fact-card">
            <div class="fact-title">Caption Overlay</div>
            <p class="fact-body">"{spec['caption']}"</p>
        </div>
        """, unsafe_allow_html=True)

        with st.expander("🔍 Full JSON Output"):
            st.json(spec)

# ─────────────────────────────────────────────────────────────────────────────
# TAB 3: Batch & Dry-Run Inspector
# ─────────────────────────────────────────────────────────────────────────────
with tab_batch:
    st.subheader("📋 Batch Previews & Manifest Inspector")
    st.markdown("Inspect all engineered prompts from `prompts_preview.json` and on-disk manifest entries.")

    col_btn, col_count = st.columns([1, 3])
    with col_btn:
        if st.button("⚡ Run Full Dry-Run Batch", type="secondary"):
            with st.spinner(f"Running Ollama dry-run across all {len(REEL_PROMPTS)} demo topics..."):
                run_dry_run()
            st.success("Dry-run batch completed! Reloading data...")
            st.rerun()

    # Load prompts_preview.json
    preview_data = []
    if os.path.exists(PREVIEW_PATH):
        try:
            with open(PREVIEW_PATH, "r", encoding="utf-8") as f:
                preview_data = json.load(f)
        except Exception as e:
            st.error(f"Error reading preview file: {e}")

    if preview_data:
        st.markdown(f"**Loaded `{len(preview_data)}` topics from `prompts_preview.json`:**")
        
        for idx, item in enumerate(preview_data, 1):
            with st.expander(f"[{idx}/8] {item.get('topic', '').upper()}: {item.get('video_prompt', '')[:60]}..."):
                st.markdown(f"**Topic:** `{item.get('topic')}`")
                st.markdown(f"**🎬 Video Prompt:** {item.get('video_prompt')}")
                st.markdown(f"**🚫 Negative Prompt:** `{item.get('negative_prompt')}`")
                st.markdown(f"**💬 Caption:** *\"{item.get('caption')}\"*")
    else:
        st.info("No `prompts_preview.json` found. Click 'Run Full Dry-Run Batch' above to generate.")

    st.markdown("---")
    st.subheader("📁 Raw Manifest Data (`manifest.json`)")
    manifest_raw = load_manifest()
    st.json(manifest_raw)
