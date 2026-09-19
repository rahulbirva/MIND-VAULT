import React from 'react'

export default function DiagramVisuals({ type }) {
  if (!type) return null

  switch (type) {
    case 'linked_list_cycle':
      return (
        <div className="w-full bg-[#1e1b18] p-4 rounded-xl border border-amber-900/20 flex flex-col items-center justify-center">
          <div className="text-[11px] font-bold tracking-wider uppercase text-amber-300/80 mb-3 flex items-center gap-2">
            <span>🐢 Slow Pointer (1x) vs 🐇 Fast Pointer (2x)</span>
          </div>
          <svg viewBox="0 0 420 130" className="w-full max-w-md h-auto">
            {/* Linear nodes */}
            <circle cx="40" cy="65" r="18" fill="#5D0D18" stroke="#F5EDD5" strokeWidth="2" />
            <text x="40" y="70" fill="#FFF9EB" fontSize="11" fontWeight="bold" textAnchor="middle">Head</text>
            
            <line x1="58" y1="65" x2="92" y2="65" stroke="#9FB2AC" strokeWidth="2" markerEnd="url(#arrow)" />
            
            <circle cx="110" cy="65" r="18" fill="#2E7D5A" stroke="#F5EDD5" strokeWidth="2" />
            <text x="110" y="70" fill="#FFF9EB" fontSize="11" fontWeight="bold" textAnchor="middle">Node 2</text>

            <line x1="128" y1="65" x2="162" y2="65" stroke="#9FB2AC" strokeWidth="2" markerEnd="url(#arrow)" />

            {/* Cycle loop nodes */}
            <circle cx="180" cy="65" r="18" fill="#92520E" stroke="#F5EDD5" strokeWidth="2" />
            <text x="180" y="70" fill="#FFF9EB" fontSize="10" fontWeight="bold" textAnchor="middle">Entry</text>

            <path d="M 198 65 C 240 10, 300 10, 340 50" fill="none" stroke="#9FB2AC" strokeWidth="2" markerEnd="url(#arrow)" />
            <circle cx="340" cy="50" r="16" fill="#3A4575" stroke="#F5EDD5" strokeWidth="2" />
            <text x="340" y="54" fill="#FFF9EB" fontSize="10" fontWeight="bold" textAnchor="middle">N3</text>

            <path d="M 340 66 C 300 110, 240 110, 198 75" fill="none" stroke="#E53935" strokeWidth="2.5" strokeDasharray="4 4" markerEnd="url(#arrow)" />
            <circle cx="270" cy="95" r="16" fill="#3A4575" stroke="#F5EDD5" strokeWidth="2" />
            <text x="270" y="99" fill="#FFF9EB" fontSize="10" fontWeight="bold" textAnchor="middle">N4</text>

            {/* Collision label */}
            <rect x="230" y="30" width="80" height="20" rx="6" fill="#E53935" />
            <text x="270" y="44" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">Collision Point</text>

            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#9FB2AC" />
              </marker>
            </defs>
          </svg>
        </div>
      )

    case 'btree_lsm_diag':
      return (
        <div className="w-full bg-[#191e24] p-4 rounded-xl border border-zinc-800 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-zinc-800/80 p-2.5 rounded-lg border border-amber-600/30">
              <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">B+ Tree (Postgres/MySQL)</span>
              <p className="text-[11px] text-zinc-300">Fast In-Place 8KB Page Reads</p>
              <div className="mt-2 flex justify-center items-center gap-1">
                <span className="px-1.5 py-0.5 bg-amber-900/60 rounded text-[9px] text-amber-200">Root [50]</span>
                <span className="text-zinc-500">→</span>
                <span className="px-1.5 py-0.5 bg-amber-900/60 rounded text-[9px] text-amber-200">Leaves</span>
              </div>
            </div>
            <div className="bg-zinc-800/80 p-2.5 rounded-lg border border-emerald-600/30">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">LSM-Tree (Cassandra/RocksDB)</span>
              <p className="text-[11px] text-zinc-300">Sequential Append Writes</p>
              <div className="mt-2 flex justify-center items-center gap-1">
                <span className="px-1.5 py-0.5 bg-emerald-900/60 rounded text-[9px] text-emerald-200">MemTable</span>
                <span className="text-zinc-500">→</span>
                <span className="px-1.5 py-0.5 bg-emerald-900/60 rounded text-[9px] text-emerald-200">SSTables</span>
              </div>
            </div>
          </div>
        </div>
      )

    case 'event_loop_diag':
      return (
        <div className="w-full bg-[#181a1f] p-4 rounded-xl border border-indigo-950 flex flex-col items-center justify-center">
          <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-2">
            V8 Event Loop Priority Hierarchy
          </div>
          <div className="w-full max-w-sm space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-red-950/40 border border-red-800/40 text-red-200">
              <span className="font-bold">1. Call Stack</span>
              <span className="text-[10px] text-red-300">Synchronous JavaScript</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-200">
              <span className="font-bold">2. MicroTask Queue</span>
              <span className="text-[10px] text-amber-300">Promise.then, queueMicrotask</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-200">
              <span className="font-bold">3. Render / Layout</span>
              <span className="text-[10px] text-emerald-300">requestAnimationFrame</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-200">
              <span className="font-bold">4. MacroTask Queue</span>
              <span className="text-[10px] text-blue-300">setTimeout, I/O, UI Events</span>
            </div>
          </div>
        </div>
      )

    case 'dns_flow_diag':
      return (
        <div className="w-full bg-[#171c22] p-4 rounded-xl border border-cyan-950 text-xs">
          <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider text-center mb-3">
            DNS Recursive Resolution Flow
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-300 py-1 border-b border-zinc-800">
            <span>Client</span>
            <span className="text-cyan-400 font-mono">1. query domain</span>
            <span>Resolver (1.1.1.1)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-300 py-1 border-b border-zinc-800">
            <span>Resolver</span>
            <span className="text-amber-400 font-mono">2. ask root (.)</span>
            <span>Root Server</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-300 py-1 border-b border-zinc-800">
            <span>Resolver</span>
            <span className="text-emerald-400 font-mono">3. ask .com TLD</span>
            <span>TLD Server</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-300 py-1">
            <span>Resolver</span>
            <span className="text-purple-400 font-mono">4. get IP + TTL</span>
            <span>Auth Nameserver</span>
          </div>
        </div>
      )

    default:
      return null
  }
}
