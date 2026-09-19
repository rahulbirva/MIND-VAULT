import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Sparkles, AlertCircle, BookOpen } from 'lucide-react'
import LearnFeedCard from '../components/learnfeed/LearnFeedCard'
import TopicFilterBar from '../components/learnfeed/TopicFilterBar'
import PullToRefreshIndicator from '../components/learnfeed/PullToRefreshIndicator'
import DiscussModal from '../components/learnfeed/DiscussModal'

export default function LearnFeedPage({ showToast }) {
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [activeTag, setActiveTag] = useState('All')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)

  // Interactive like / bookmark state tracking
  const [likedPosts, setLikedPosts] = useState({})
  const [bookmarkedPosts, setBookmarkedPosts] = useState({})

  // Discussion modal state
  const [activeDiscussPost, setActiveDiscussPost] = useState(null)

  // Touch pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0)
  const touchStartY = useRef(0)
  const isPulling = useRef(false)

  // Infinite scroll observer sentinel
  const sentinelRef = useRef(null)

  // ── 1. Initial Load & Tag Filter Change ──────────────────────────────────
  const fetchFeed = useCallback(async (tag = activeTag, pageNum = 1, append = false) => {
    if (pageNum === 1 && !append) setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/learnfeed?page=${pageNum}&limit=10&tag=${encodeURIComponent(tag)}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to fetch feed.')

      setPosts(prev => (append ? [...prev, ...data.posts] : data.posts))
      setHasMore(data.hasMore)
      setPage(pageNum)
    } catch (err) {
      console.error('Fetch feed error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [activeTag])

  useEffect(() => {
    fetchFeed(activeTag, 1, false)
  }, [activeTag, fetchFeed])

  // ── 2. Refresh Action (Pull-to-refresh or Top Button) ─────────────────────
  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)

    try {
      const res = await fetch('/api/learnfeed/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 10, tag: activeTag }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to refresh feed.')

      // Replace top active DOM elements cleanly with the fresh 10–12 items
      setPosts(data.posts)
      setPage(1)
      setHasMore(data.hasMore)
      if (showToast) showToast('✨ Feed updated with 10 fresh concepts!')
    } catch (err) {
      console.error('Refresh error:', err)
      if (showToast) showToast(`Refresh failed: ${err.message}`)
    } finally {
      setIsRefreshing(false)
      setPullDistance(0)
    }
  }

  // ── 3. Touch Pull-to-Refresh Listeners ────────────────────────────────────
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }

  const handleTouchMove = (e) => {
    if (!isPulling.current || isRefreshing || window.scrollY > 0) return
    const currentY = e.touches[0].clientY
    const distance = currentY - touchStartY.current

    if (distance > 0) {
      // Apply rubber-band drag resistance
      const dampedDistance = Math.min(120, distance * 0.5)
      setPullDistance(dampedDistance)
    }
  }

  const handleTouchEnd = () => {
    if (!isPulling.current) return
    isPulling.current = false

    if (pullDistance >= 70 && !isRefreshing) {
      handleRefresh()
    } else {
      setPullDistance(0)
    }
  }

  // ── 4. Infinite Scroll Observer ──────────────────────────────────────────
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && !isRefreshing) {
          setLoadingMore(true)
          fetchFeed(activeTag, page + 1, true)
        }
      },
      { rootMargin: '300px' }
    )

    const currentSentinel = sentinelRef.current
    if (currentSentinel) observer.observe(currentSentinel)

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel)
    }
  }, [loading, loadingMore, hasMore, isRefreshing, page, activeTag, fetchFeed])

  // ── 5. Like / Bookmark Toggles ───────────────────────────────────────────
  const handleToggleLike = async (postId) => {
    const nextState = !likedPosts[postId]
    setLikedPosts(prev => ({ ...prev, [postId]: nextState }))

    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, likesCount: Math.max(0, (p.likesCount || 0) + (nextState ? 1 : -1)) }
          : p
      )
    )

    fetch(`/api/learnfeed/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isLiked: nextState }),
    }).catch(err => console.error(err))
  }

  const handleToggleBookmark = async (postId) => {
    const nextState = !bookmarkedPosts[postId]
    setBookmarkedPosts(prev => ({ ...prev, [postId]: nextState }))

    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, bookmarksCount: Math.max(0, (p.bookmarksCount || 0) + (nextState ? 1 : -1)) }
          : p
      )
    )

    if (nextState && showToast) {
      showToast('🔖 Saved concept to bookmarks!')
    }

    fetch(`/api/learnfeed/${postId}/bookmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBookmarked: nextState }),
    }).catch(err => console.error(err))
  }

  const handleIncrementCommentCount = (postId) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
      )
    )
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-[#FFF9EB] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors"
    >
      {/* Pull-to-refresh visual banner */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        threshold={70}
      />

      {/* ── Top Header with Manual Refresh Action ── */}
      <div className="max-w-xl mx-auto px-4 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#5D0D18] flex items-center justify-center text-white shadow-md">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-[#5D0D18] dark:text-red-400">
              LearnFeed
            </h1>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Instagram-style bite-sized Computer Science
            </p>
          </div>
        </div>

        {/* Refresh Feed button with spin loader */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#5D0D18] hover:bg-[#7A1122] disabled:opacity-50 text-white shadow-sm transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Feed'}</span>
        </button>
      </div>

      {/* ── Topic Filter Bar ── */}
      <TopicFilterBar activeTag={activeTag} onSelectTag={setActiveTag} />

      {/* ── Feed Container ── */}
      <main className="max-w-xl mx-auto px-3 sm:px-4 py-6">
        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-amber-900/10 dark:border-zinc-800 space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-950/10 dark:bg-zinc-800" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-24 h-3 rounded bg-amber-950/10 dark:bg-zinc-800" />
                    <div className="w-36 h-2 rounded bg-amber-950/10 dark:bg-zinc-800" />
                  </div>
                </div>
                <div className="w-full h-40 rounded-xl bg-amber-950/10 dark:bg-zinc-800" />
                <div className="w-3/4 h-4 rounded bg-amber-950/10 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl text-center space-y-3 my-6">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto" />
            <h3 className="font-bold text-sm text-red-900 dark:text-red-200">Could not load LearnFeed</h3>
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => fetchFeed(activeTag, 1, false)}
              className="px-4 py-1.5 rounded-full bg-red-700 hover:bg-red-800 text-white text-xs font-semibold cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Feed Cards List */}
        {!loading && posts.length > 0 && (
          <div className="space-y-2">
            {posts.map((post) => (
              <LearnFeedCard
                key={post.id}
                post={post}
                liked={!!likedPosts[post.id]}
                bookmarked={!!bookmarkedPosts[post.id]}
                onToggleLike={handleToggleLike}
                onToggleBookmark={handleToggleBookmark}
                onOpenDiscuss={setActiveDiscussPost}
                showToast={showToast}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-16 px-4 space-y-3">
            <Sparkles className="w-10 h-10 text-amber-700/40 mx-auto" />
            <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">No posts in this category</h3>
            <p className="text-xs text-zinc-500">Try selecting "All Concepts" or pull to refresh.</p>
            <button
              onClick={() => setActiveTag('All')}
              className="px-4 py-2 rounded-full bg-[#5D0D18] text-white text-xs font-semibold cursor-pointer"
            >
              View All Concepts
            </button>
          </div>
        )}

        {/* Infinite Scroll Bottom Sentinel */}
        <div ref={sentinelRef} className="py-6 flex items-center justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
              <RefreshCw className="w-4 h-4 animate-spin text-[#5D0D18]" />
              <span>Loading more bite-sized concepts...</span>
            </div>
          )}
          {!hasMore && posts.length > 0 && (
            <p className="text-xs text-zinc-400 font-medium tracking-wide">
              🎉 You've caught up on all concepts for now! Pull down to refresh.
            </p>
          )}
        </div>
      </main>

      {/* Discussion Drawer / Modal */}
      <DiscussModal
        isOpen={!!activeDiscussPost}
        onClose={() => setActiveDiscussPost(null)}
        post={activeDiscussPost}
        onAddComment={handleIncrementCommentCount}
      />
    </div>
  )
}
