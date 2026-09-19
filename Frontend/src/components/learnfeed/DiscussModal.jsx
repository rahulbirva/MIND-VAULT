import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageSquare, User, Sparkles } from 'lucide-react'

export default function DiscussModal({ isOpen, onClose, post, onAddComment }) {
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !post) return
    setLoading(true)
    fetch(`/api/learnfeed/${post.id}/comments`)
      .then(res => res.json())
      .then(data => {
        setComments(data.comments || [])
        setLoading(false)
      })
      .catch(() => {
        setComments([])
        setLoading(false)
      })
  }, [isOpen, post])

  if (!isOpen || !post) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!commentText.trim()) return

    const text = commentText.trim()
    setCommentText('')

    fetch(`/api/learnfeed/${post.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, username: 'you' }),
    })
      .then(res => res.json())
      .then(newComment => {
        setComments(prev => [...prev, newComment])
        if (onAddComment) onAddComment(post.id)
      })
      .catch(err => console.error(err))
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-amber-900/15 dark:border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-amber-900/10 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#5D0D18] dark:text-red-400" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Discussion & Insights</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Post mini preview */}
          <div className="px-5 py-3 bg-[#FFF9EB]/60 dark:bg-zinc-950/50 border-b border-amber-900/10 dark:border-zinc-800 flex items-center gap-3">
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#5D0D18]/10 dark:bg-red-950 text-[#5D0D18] dark:text-red-300 font-semibold">
              {post.category}
            </span>
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
              {post.title}
            </p>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-xs text-zinc-400">
                Loading discussions...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-10">
                <Sparkles className="w-8 h-8 text-amber-600/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">No comments yet</p>
                <p className="text-xs text-zinc-400 mt-1">Be the first to share an insight or question!</p>
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex items-start gap-3">
                  <img
                    src={c.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={c.user}
                    className="w-8 h-8 rounded-full object-cover border border-amber-900/20"
                  />
                  <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3 border border-zinc-200/60 dark:border-zinc-700/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{c.user}</span>
                      <span className="text-[10px] text-zinc-400">{c.time}</span>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment input form */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-amber-900/10 dark:border-zinc-800 flex items-center gap-2 bg-white dark:bg-zinc-900">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add your thoughts or technical question..."
              className="flex-1 text-xs px-3.5 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-transparent focus:border-[#5D0D18] focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="p-2.5 rounded-full bg-[#5D0D18] hover:bg-[#7A1122] disabled:opacity-40 text-white transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
