import React from 'react'
import { motion } from 'framer-motion'
import { Layers, Cpu, Database, Globe, Network } from 'lucide-react'

const TOPICS = [
  { id: 'All',           label: 'All Concepts',   icon: Layers },
  { id: 'Algorithms',    label: 'Algorithms',     icon: Cpu },
  { id: 'Databases',     label: 'Databases',      icon: Database },
  { id: 'Web Dev',       label: 'Web Dev',        icon: Globe },
  { id: 'System Design', label: 'System Design',  icon: Network },
]

export default function TopicFilterBar({ activeTag, onSelectTag }) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-3 px-4 flex items-center gap-2 border-b border-amber-900/10 dark:border-zinc-800/80 bg-[#FFF9EB]/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-[64px] z-20">
      {TOPICS.map((topic) => {
        const Icon = topic.icon
        const isActive = activeTag.toLowerCase() === topic.id.toLowerCase()

        return (
          <button
            key={topic.id}
            onClick={() => onSelectTag(topic.id)}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              isActive
                ? 'text-white shadow-sm'
                : 'text-amber-950/70 dark:text-zinc-400 hover:text-amber-950 dark:hover:text-zinc-100 bg-amber-900/5 dark:bg-zinc-800/50 hover:bg-amber-900/10'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeFilterPill"
                className="absolute inset-0 bg-[#5D0D18] dark:bg-red-800 rounded-full z-0"
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              />
            )}
            <Icon className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">{topic.label}</span>
          </button>
        )
      })}
    </div>
  )
}
