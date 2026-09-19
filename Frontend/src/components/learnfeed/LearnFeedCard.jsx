import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Bookmark, MessageSquare, Share2, Copy, Check, ChevronDown, ChevronUp, Code2, Sparkles } from 'lucide-react'
import DiagramVisuals from './DiagramVisuals'

export default function LearnFeedCard({
  post,
  liked,
  bookmarked,
  onToggleLike,
  onToggleBookmark,
  onOpenDiscuss,
  showToast,
}) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showHeartOverlay, setShowHeartOverlay] = useState(false)
  const [lastTap, setLastTap] = useState(0)

  // Handle double-tap / double-click to like with animated heart pop
  const handleMediaTap = () => {
    const now = Date.now()
    if (now - lastTap < 300) {
      if (!liked) {
        onToggleLike(post.id)
      }
      setShowHeartOverlay(true)
      setTimeout(() => setShowHeartOverlay(false), 800)
    }
    setLastTap(now)
  }

  const handleCopyCode = (e) => {
    e.stopPropagation()
    if (post.snippet?.code) {
      navigator.clipboard.writeText(post.snippet.code)
      setCopied(true)
      if (showToast) showToast('📋 Code snippet copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/#${post.id}`
    navigator.clipboard.writeText(url)
    if (showToast) showToast('🔗 Post link copied to clipboard!')
  }

  return (
    <article className="w-full max-w-xl mx-auto bg-white dark:bg-zinc-900 border border-amber-900/15 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden mb-6">
      {/* ── 1. Creator Profile Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/10 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-[#5D0D18] to-amber-600">
            <img
              src={post.creator?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={post.creator?.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-zinc-900"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                {post.creator?.handle || 'engineer'}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">· {post.timestamp || '2h'}</span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">
              {post.creator?.role || 'Senior Software Engineer'}
            </p>
          </div>
        </div>

        {/* Category badge */}
        <span className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full bg-[#5D0D18]/10 dark:bg-red-950 text-[#5D0D18] dark:text-red-400 border border-[#5D0D18]/20">
          {post.topicBadge || post.category}
        </span>
      </div>

      {/* ── 2. Interactive Media / Visuals Area (Double-tap friendly) ── */}
      <div
        onClick={handleMediaTap}
        className="relative bg-[#181a1f] text-zinc-100 p-4 select-none cursor-pointer overflow-hidden group min-h-[160px] flex flex-col justify-center"
      >
        {/* Double-tap floating heart overlay */}
        <AnimatePresence>
          {showHeartOverlay && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
            >
              <Heart className="w-20 h-20 fill-red-500 text-red-500 filter drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom SVG Architecture / Data Structure Diagram */}
        {post.diagramType && (
          <div className="mb-3">
            <DiagramVisuals type={post.diagramType} />
          </div>
        )}

        {/* Code Snippet Card */}
        {post.snippet?.code && (
          <div className="relative rounded-xl bg-[#0f1115] border border-zinc-800 p-3.5 font-mono text-xs overflow-x-auto">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80 text-[10px] text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="uppercase tracking-wider font-semibold">{post.snippet.language || 'code'}</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="text-zinc-200 leading-relaxed font-mono whitespace-pre-wrap">
              {post.snippet.code}
            </pre>
          </div>
        )}
      </div>

      {/* ── 3. Instagram Action Buttons ── */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Like */}
          <button
            onClick={() => onToggleLike(post.id)}
            className="flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-red-600 transition-colors cursor-pointer group"
          >
            <motion.div
              whileTap={{ scale: 1.4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  liked ? 'fill-red-600 text-red-600' : 'text-zinc-700 dark:text-zinc-300 group-hover:text-red-500'
                }`}
              />
            </motion.div>
            <span>{post.likesCount || 0}</span>
          </button>

          {/* Discuss / Comments */}
          <button
            onClick={() => onOpenDiscuss(post)}
            className="flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-[#5D0D18] dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-5 h-5" />
            <span>{post.commentsCount || 0}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="text-zinc-700 dark:text-zinc-300 hover:text-[#5D0D18] dark:hover:text-red-400 transition-colors cursor-pointer p-1"
            title="Share concept"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Bookmark */}
        <button
          onClick={() => onToggleBookmark(post.id)}
          className="flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-amber-600 transition-colors cursor-pointer group"
        >
          <motion.div
            whileTap={{ scale: 1.3 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            <Bookmark
              className={`w-5 h-5 transition-colors ${
                bookmarked ? 'fill-[#5D0D18] text-[#5D0D18] dark:fill-red-400 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300 group-hover:text-amber-600'
              }`}
            />
          </motion.div>
          <span>{post.bookmarksCount || 0}</span>
        </button>
      </div>

      {/* ── 4. Caption & Expandable Explanation ── */}
      <div className="px-4 pb-4 pt-1 space-y-2">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
          {post.title}
        </h2>

        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {post.explanation?.summary}
        </p>

        {/* Expandable Technical Deep-Dive */}
        <AnimatePresence>
          {expanded && post.explanation?.full && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden pt-2 border-t border-amber-900/10 dark:border-zinc-800"
            >
              <div className="p-3 bg-[#FFF9EB]/80 dark:bg-zinc-950/60 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 space-y-2 border border-amber-900/10 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 font-bold text-[#5D0D18] dark:text-red-400 uppercase text-[10px] tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Production Mechanics & Why It Matters</span>
                </div>
                {post.explanation.full.split('\n\n').map((para, pIdx) => (
                  <p key={pIdx} className="leading-relaxed">{para}</p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand Toggle button */}
        {post.explanation?.full && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] font-bold text-[#5D0D18] dark:text-red-400 hover:underline cursor-pointer pt-0.5"
          >
            <span>{expanded ? 'Show less' : 'Read full technical breakdown'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10.5px] font-semibold text-[#5D0D18]/80 dark:text-red-400/80 hover:underline cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
