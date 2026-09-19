import React from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, ArrowDown } from 'lucide-react'

export default function PullToRefreshIndicator({ pullDistance, isRefreshing, threshold = 80 }) {
  if (pullDistance <= 0 && !isRefreshing) return null

  const progress = Math.min(1, pullDistance / threshold)
  const isReady = pullDistance >= threshold

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{
        opacity: isRefreshing ? 1 : progress,
        y: isRefreshing ? 16 : Math.min(pullDistance * 0.45, 36),
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="flex items-center justify-center w-full py-2 pointer-events-none z-30"
    >
      <div className="flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-amber-900/15 dark:border-zinc-800 shadow-md rounded-full text-xs font-semibold text-amber-950 dark:text-zinc-100 transition-all">
        {isRefreshing ? (
          <>
            <RefreshCw className="w-4 h-4 text-red-800 dark:text-red-500 animate-spin" />
            <span>Fetching fresh 10–12 CS posts...</span>
          </>
        ) : (
          <>
            <motion.div
              animate={{ rotate: isReady ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowDown className={`w-4 h-4 ${isReady ? 'text-red-800 font-bold' : 'text-zinc-500'}`} />
            </motion.div>
            <span>{isReady ? 'Release to refresh feed' : 'Pull down to refresh'}</span>
          </>
        )}
      </div>
    </motion.div>
  )
}
