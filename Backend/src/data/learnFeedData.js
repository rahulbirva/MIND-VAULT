/**
 * learnFeedData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * 35+ Curated Computer Science & Software Engineering Feed Cards.
 * Covers Algorithms, Databases, System Design, and Web Development.
 */

const LEARN_POSTS = [
  // ── Algorithms & Data Structures ───────────────────────────────────────────
  {
    id: 'cs-algo-01',
    creator: {
      name: 'Elena Rostova',
      handle: 'erostova_cs',
      role: 'Staff Algorithms Engineer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Algorithms',
    topicBadge: 'Bit Manipulation',
    title: 'XOR Bit Tricks Every Engineer Should Know',
    snippet: {
      language: 'javascript',
      code: `// 1. Swap two numbers without extra memory
let a = 5, b = 9;
a = a ^ b;
b = a ^ b; // b is now 5
a = a ^ b; // a is now 9

// 2. Find the single non-duplicate number in O(N) time & O(1) space
function findSingle(nums) {
  return nums.reduce((acc, num) => acc ^ num, 0);
}

// 3. Check if number is power of 2
const isPowerOfTwo = (n) => n > 0 && (n & (n - 1)) === 0;`,
    },
    diagramType: null,
    explanation: {
      summary: 'XOR (Exclusive OR) operates with two key mathematical properties: a ^ a = 0 and a ^ 0 = a. This makes it an indispensable tool for constant-space algorithms and parity tracking.',
      full: `Because XOR is associative and commutative, any duplicate numbers cancel each other out completely: (2 ^ 3 ^ 2) = (2 ^ 2) ^ 3 = 0 ^ 3 = 3.\n\nIn competitive programming and high-frequency trading engines, bit manipulation eliminates CPU branch mispredictions because bitwise operators translate directly into single-cycle machine instructions with zero branching penalty.`,
    },
    likesCount: 1420,
    bookmarksCount: 890,
    commentsCount: 64,
    tags: ['Algorithms', 'BitManipulation', 'Performance', 'Python'],
    timestamp: '2h ago',
  },
  {
    id: 'cs-algo-02',
    creator: {
      name: 'Marcus Vance',
      handle: 'marcus_vance',
      role: 'Compiler Architect',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Algorithms',
    topicBadge: 'Two Pointers',
    title: 'Floyd\'s Cycle Detection (Tortoise and Hare)',
    snippet: {
      language: 'typescript',
      code: `function hasCycle(head: ListNode | null): boolean {
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow.next!;       // Moves 1 step
    fast = fast.next.next;   // Moves 2 steps
    
    if (slow === fast) {
      return true; // Cycle detected!
    }
  }
  return false;
}`,
    },
    diagramType: 'linked_list_cycle',
    explanation: {
      summary: 'Detects loops in linked lists using two pointers moving at different velocities with O(N) time and O(1) auxiliary space.',
      full: `If there is a cycle of length C, the relative speed between the two pointers is 1 node per iteration. Once both pointers enter the cycle, the distance between them decreases by exactly 1 node every step, guaranteeing an intersection in at most C steps.\n\nTo find the exact start node of the cycle: reset the slow pointer to the head and keep the fast pointer at the meeting point. Move both forward by 1 step simultaneously; they will collide precisely at the cycle entrance.`,
    },
    likesCount: 980,
    bookmarksCount: 620,
    commentsCount: 38,
    tags: ['Algorithms', 'DataStructures', 'Pointers', 'LeetCode'],
    timestamp: '4h ago',
  },
  {
    id: 'cs-algo-03',
    creator: {
      name: 'Devon Wright',
      handle: 'devon_infra',
      role: 'Cache & Memory Specialist',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Algorithms',
    topicBadge: 'System Caching',
    title: 'Designing an O(1) LRU (Least Recently Used) Cache',
    snippet: {
      language: 'javascript',
      code: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // JS Maps preserve insertion order!
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val); // Re-insert to mark as recently used
    return val;
  }

  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      // Evict oldest (first key in map iterator)
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
  }
}`,
    },
    diagramType: 'lru_cache_diag',
    explanation: {
      summary: 'Combining a Hash Map with a Doubly Linked List unlocks strictly O(1) lookups and O(1) evictions of the oldest access entries.',
      full: `The Hash Map provides O(1) direct address access to node memory pointers, while the Doubly Linked List maintains temporal ordering without requiring array shifts. When an item is read or updated, it is unlinked and prepended to the head in O(1) operations. When capacity exceeds limit, the tail node is removed.`,
    },
    likesCount: 2150,
    bookmarksCount: 1420,
    commentsCount: 92,
    tags: ['Algorithms', 'Caching', 'Memory', 'SystemDesign'],
    timestamp: '6h ago',
  },
  {
    id: 'cs-algo-04',
    creator: {
      name: 'Dr. Sophia Lin',
      handle: 'sophia_graphs',
      role: 'Graph Theory Researcher',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Algorithms',
    topicBadge: 'Graph Pathfinding',
    title: 'Dijkstra vs A* Search: When Heuristics Win',
    snippet: {
      language: 'python',
      code: `import heapq

def a_star_search(graph, start, goal, heuristic):
    # Priority Queue stores: (f_score, current_node)
    pq = [(heuristic(start, goal), 0, start, [start])]
    visited = {}
    
    while pq:
        f, g, current, path = heapq.heappop(pq)
        if current == goal:
            return path
        if current in visited and visited[current] <= g:
            continue
        visited[current] = g
        
        for neighbor, weight in graph[current]:
            new_g = g + weight
            new_f = new_g + heuristic(neighbor, goal)
            heapq.heappush(pq, (new_f, new_g, neighbor, path + [neighbor]))`,
    },
    diagramType: null,
    explanation: {
      summary: 'Dijkstra explores radially in all directions; A* uses a directional heuristic f(n) = g(n) + h(n) to prioritize search space toward the destination.',
      full: `As long as the heuristic h(n) is admissible (never overestimates the true remaining distance), A* is mathematically guaranteed to find the optimal shortest path while visiting exponentially fewer graph vertices than Dijkstra's blind search.`,
    },
    likesCount: 1640,
    bookmarksCount: 990,
    commentsCount: 45,
    tags: ['Algorithms', 'Graphs', 'Pathfinding', 'AI'],
    timestamp: '9h ago',
  },

  // ── Databases & Storage Engines ───────────────────────────────────────────
  {
    id: 'cs-db-01',
    creator: {
      name: 'Tariq Al-Mansoor',
      handle: 'tariq_db',
      role: 'Principal Database Engineer',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Databases',
    topicBadge: 'Storage Internals',
    title: 'B-Trees vs LSM-Trees: The Read/Write Trade-off',
    snippet: {
      language: 'sql',
      code: `-- PostgreSQL / MySQL InnoDB (B+ Tree Engine)
-- Fast point lookups in O(log N), in-place page updates
CREATE INDEX idx_users_email ON users(email);

-- RocksDB / Cassandra / ScyllaDB (LSM-Tree Engine)
-- Sequential write appends via MemTable + SSTables
-- High write throughput, periodic compaction merges`,
    },
    diagramType: 'btree_lsm_diag',
    explanation: {
      summary: 'B+ Trees optimize for fast random reads via balanced tree pages; LSM-Trees optimize for heavy write throughput via append-only logs and background SSTable compactions.',
      full: `B-Trees overwrite fixed 8KB–16KB disk pages in place, causing random I/O writes during high insert volumes. LSM (Log-Structured Merge) Trees write changes sequentially into an in-memory MemTable and Write-Ahead Log (WAL), flushing immutable Sorted String Tables (SSTables) to disk sequentially. Reads in LSM trees use Bloom filters to avoid querying multiple SSTable levels.`,
    },
    likesCount: 2840,
    bookmarksCount: 1910,
    commentsCount: 112,
    tags: ['Databases', 'StorageEngines', 'PostgreSQL', 'NoSQL'],
    timestamp: '1h ago',
  },
  {
    id: 'cs-db-02',
    creator: {
      name: 'Priya Sharma',
      handle: 'priya_scale',
      role: 'Database Reliability Engineer',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Databases',
    topicBadge: 'Durability & WAL',
    title: 'Why Databases Use Write-Ahead Logging (WAL)',
    snippet: {
      language: 'text',
      code: `Client Write Request
       │
       ▼
1. Append record to Write-Ahead Log (WAL) on Disk (Fast Sequential Write)
       │
2. Update Data Page in Memory Buffer Pool (Marked Dirty)
       │
3. Return Success ACK to Client (Transaction Committed)
       │
[Background Checkpoint Process]
4. Lazily flush Dirty Pages from Memory to Database Files on Disk`,
    },
    diagramType: 'wal_flow_diag',
    explanation: {
      summary: 'The WAL ensures ACID Durability: in the event of a sudden power loss or server crash, the database replays the sequential log to restore dirty pages.',
      full: `Flushing full relational data pages on every write would produce disastrous disk thrashing. The WAL decouples the commit acknowledgement from physical disk page writes by appending lightweight delta bytes to a single sequential file, which magnetic drives and NVMe SSDs write with maximum throughput.`,
    },
    likesCount: 1720,
    bookmarksCount: 1140,
    commentsCount: 53,
    tags: ['Databases', 'ACID', 'Durability', 'Postgres'],
    timestamp: '3h ago',
  },
  {
    id: 'cs-db-03',
    creator: {
      name: 'Liam O\'Connor',
      handle: 'liam_distributed',
      role: 'Distributed Systems Lead',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Databases',
    topicBadge: 'Transaction Isolation',
    title: 'The 4 SQL Isolation Levels Explained',
    snippet: {
      language: 'sql',
      code: `-- 1. Read Uncommitted: Allows Dirty Reads
-- 2. Read Committed (Postgres Default): Prevents Dirty Reads
-- 3. Repeatable Read (MySQL Default): Prevents Non-Repeatable Reads
-- 4. Serializable: Strict serial execution (Locks / SSI)

SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
SELECT balance FROM accounts WHERE user_id = 42;
-- Guaranteed identical balance throughout transaction!
COMMIT;`,
    },
    diagramType: null,
    explanation: {
      summary: 'Isolation levels trade concurrency throughput against anomaly prevention (Dirty Reads, Non-Repeatable Reads, and Phantom Reads).',
      full: `Postgres implements isolation through Multi-Version Concurrency Control (MVCC). Each tuple stores xmin and xmax transaction IDs. A query takes a virtual snapshot of active transactions, allowing reads to proceed without locking writers and writers to proceed without blocking readers.`,
    },
    likesCount: 1980,
    bookmarksCount: 1330,
    commentsCount: 78,
    tags: ['Databases', 'SQL', 'Concurrency', 'Transactions'],
    timestamp: '5h ago',
  },
  {
    id: 'cs-db-04',
    creator: {
      name: 'Tariq Al-Mansoor',
      handle: 'tariq_db',
      role: 'Principal Database Engineer',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Databases',
    topicBadge: 'Query Optimization',
    title: 'Index Scan vs Index Seek: Reading Execution Plans',
    snippet: {
      language: 'sql',
      code: `-- BAD: Expression on indexed column prevents Index Seek
EXPLAIN ANALYZE 
SELECT * FROM orders WHERE DATE(created_at) = '2026-09-19';
-- Output: Seq Scan on orders (cost=0.00..35.50 rows=100)

-- GOOD: SARGable predicate enables direct B-Tree Index Seek
EXPLAIN ANALYZE 
SELECT * FROM orders 
WHERE created_at >= '2026-09-19 00:00:00' 
  AND created_at <  '2026-09-20 00:00:00';
-- Output: Index Scan using idx_orders_created_at on orders`,
    },
    diagramType: null,
    explanation: {
      summary: 'Wrapping indexed columns inside SQL functions causes full table scans because the query planner cannot use B-Tree boundary navigation.',
      full: `A SARGable (Search Argument Able) condition allows the storage engine to binary search the B-tree directly to the exact leaf page (Index Seek). When you apply a function like LOWER(col) or DATE(col), the engine must compute that function across every single row in the table unless an expression index is explicitly created.`,
    },
    likesCount: 2310,
    bookmarksCount: 1670,
    commentsCount: 88,
    tags: ['Databases', 'Postgres', 'SQL', 'Performance'],
    timestamp: '8h ago',
  },

  // ── System Design & Architecture ──────────────────────────────────────────
  {
    id: 'cs-sys-01',
    creator: {
      name: 'Zack Chen',
      handle: 'zack_arch',
      role: 'VP Infrastructure Engineering',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    },
    category: 'System Design',
    topicBadge: 'Networking',
    title: 'What Actually Happens During a DNS Lookup?',
    snippet: {
      language: 'text',
      code: `User queries: api.example.com

1. Browser / OS Cache check (hits in ~1ms)
2. Recursive Resolver (ISP or 1.1.1.1 / 8.8.8.8)
3. Root Name Server (.) ──► Returns .com TLD Server IP
4. TLD Name Server (.com) ──► Returns example.com Authoritative Server IP
5. Authoritative Name Server ──► Returns IP (e.g. 192.0.2.1) + TTL
6. Client establishes TCP 3-Way Handshake + TLS 1.3 Session`,
    },
    diagramType: 'dns_flow_diag',
    explanation: {
      summary: 'DNS translates human-readable hostnames into IP addresses across a hierarchical, globally distributed tree of nameservers.',
      full: `DNS predominantly utilizes UDP on port 53 for low-latency round trips. Responses include a TTL (Time-To-Live) telling intermediate resolvers how long to cache the record. Modern Anycast routing directs DNS requests to the topologically nearest physical data center worldwide.`,
    },
    likesCount: 3120,
    bookmarksCount: 2450,
    commentsCount: 140,
    tags: ['SystemDesign', 'Networking', 'DNS', 'WebInfrastructure'],
    timestamp: '1h ago',
  },
  {
    id: 'cs-sys-02',
    creator: {
      name: 'Chloe Monet',
      handle: 'chloe_cloud',
      role: 'Staff Distributed Systems Engineer',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
    category: 'System Design',
    topicBadge: 'Sharding & Routing',
    title: 'Consistent Hashing: How Caches Scale Without Resharding Chaos',
    snippet: {
      language: 'python',
      code: `import bisect, hashlib

class ConsistentHashRing:
    def __init__(self, nodes=None, replicas=100):
        self.replicas = replicas
        self.ring = []       # Sorted hash ring values
        self.node_map = {}   # hash_val -> physical node
        if nodes:
            for n in nodes: self.add_node(n)
            
    def _hash(self, key):
        return int(hashlib.md5(key.encode()).hexdigest(), 16)
        
    def add_node(self, node):
        for i in range(self.replicas):
            h = self._hash(f"{node}#replica_{i}")
            bisect.insort(self.ring, h)
            self.node_map[h] = node

    def get_node(self, key):
        h = self._hash(key)
        idx = bisect.bisect_right(self.ring, h) % len(self.ring)
        return self.node_map[self.ring[idx]]`,
    },
    diagramType: 'consistent_hash_ring',
    explanation: {
      summary: 'Consistent hashing maps both servers and data keys onto a circular 360° integer ring, minimizing key relocation when nodes join or fail.',
      full: `Under naive modulo hashing (hash(key) % N), adding a single server causes nearly 100% of cached keys to map to the wrong server, crashing downstream databases in a thundering herd. With consistent hashing and virtual replicas, adding a server only migrates K/N keys, distributing load uniformly.`,
    },
    likesCount: 2680,
    bookmarksCount: 1850,
    commentsCount: 95,
    tags: ['SystemDesign', 'DistributedSystems', 'Hashing', 'Microservices'],
    timestamp: '4h ago',
  },
  {
    id: 'cs-sys-03',
    creator: {
      name: 'Zack Chen',
      handle: 'zack_arch',
      role: 'VP Infrastructure Engineering',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    },
    category: 'System Design',
    topicBadge: 'Traffic Management',
    title: 'Rate Limiting: Token Bucket vs Leaky Bucket',
    snippet: {
      language: 'javascript',
      code: `// Redis Token Bucket Implementation
class TokenBucket {
  constructor(capacity, refillRatePerSec) {
    this.capacity = capacity;
    this.refillRate = refillRatePerSec;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  allowRequest(tokensRequested = 1) {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;

    if (this.tokens >= tokensRequested) {
      this.tokens -= tokensRequested;
      return true; // Request allowed
    }
    return false; // 429 Too Many Requests
  }
}`,
    },
    diagramType: null,
    explanation: {
      summary: 'Token Bucket allows sudden traffic bursts up to bucket capacity; Leaky Bucket forces a steady, smoothed outflow rate regardless of incoming spikes.',
      full: `Cloudflare, Stripe, and AWS API Gateways favor Token Bucket algorithms because legitimate clients frequently make bursty API calls (e.g. initial dashboard hydration) while still protecting upstream backend databases from prolonged traffic surges.`,
    },
    likesCount: 2420,
    bookmarksCount: 1690,
    commentsCount: 81,
    tags: ['SystemDesign', 'RateLimiting', 'Security', 'APIs'],
    timestamp: '7h ago',
  },
  {
    id: 'cs-sys-04',
    creator: {
      name: 'Liam O\'Connor',
      handle: 'liam_distributed',
      role: 'Distributed Systems Lead',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    },
    category: 'System Design',
    topicBadge: 'Distributed Consensus',
    title: 'CAP Theorem in the Real World: CP vs AP',
    snippet: {
      language: 'text',
      code: `Network Partition (P) is an inevitable reality of distributed networks.
You MUST choose between:

1. Consistency (CP) ──► Reject writes if nodes cannot reach quorum consensus.
   Examples: ZooKeeper, etcd, CockroachDB, MongoDB (primary write concern).

2. Availability (AP) ──► Accept writes locally; resolve conflicts later.
   Examples: Amazon DynamoDB, Apache Cassandra, CouchDB (Eventual Consistency).`,
    },
    diagramType: null,
    explanation: {
      summary: 'In any distributed data store, network partitions are inevitable. Systems must balance strict consistency against uninterrupted availability.',
      full: `Eric Brewer's CAP Theorem demonstrates that when network splits (P) occur, a system cannot simultaneously guarantee 100% linearizable consistency (C) and 100% availability (A). Financial ledger transactions require CP guarantees, whereas social media like counters and activity feeds favor AP architectures with eventual consistency.`,
    },
    likesCount: 3410,
    bookmarksCount: 2190,
    commentsCount: 165,
    tags: ['SystemDesign', 'DistributedSystems', 'CAPTheorem', 'Cloud'],
    timestamp: '10h ago',
  },

  // ── Web Development & Browser Internals ───────────────────────────────────
  {
    id: 'cs-web-01',
    creator: {
      name: 'Maya Patel',
      handle: 'maya_js',
      role: 'V8 Engine Contributor',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Web Dev',
    topicBadge: 'JavaScript Runtime',
    title: 'The JavaScript Event Loop & Microtask Priority',
    snippet: {
      language: 'javascript',
      code: `console.log('1. Synchronous script');

setTimeout(() => console.log('4. MacroTask (setTimeout)'), 0);

Promise.resolve().then(() => {
  console.log('2. MicroTask (Promise.then)');
  queueMicrotask(() => console.log('3. Nested MicroTask'));
});

// Output Order:
// 1. Synchronous script
// 2. MicroTask (Promise.then)
// 3. Nested MicroTask
// 4. MacroTask (setTimeout)`,
    },
    diagramType: 'event_loop_diag',
    explanation: {
      summary: 'Microtasks (Promises, MutationObservers) run immediately after synchronous execution finishes, clearing the entire microtask queue before rendering or Macrotasks run.',
      full: `The browser event loop processes one task from the Macrotask queue (such as setTimeout, setInterval, I/O), then drains the ENTIRE Microtask queue to completion before allowing CSS layout recalculation and screen repainting. Infinite microtask loops will starve browser rendering and completely freeze the UI thread.`,
    },
    likesCount: 3890,
    bookmarksCount: 2950,
    commentsCount: 210,
    tags: ['WebDev', 'JavaScript', 'EventLoop', 'V8Engine'],
    timestamp: '2h ago',
  },
  {
    id: 'cs-web-02',
    creator: {
      name: 'Carlos Ruiz',
      handle: 'carlos_net',
      role: 'Lead Network Engineer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Web Dev',
    topicBadge: 'HTTP Protocols',
    title: 'HTTP/2 vs HTTP/3: Moving from TCP to UDP (QUIC)',
    snippet: {
      language: 'text',
      code: `HTTP/1.1 ──► Head-of-Line Blocking at HTTP layer (6 TCP sockets limit)
     │
HTTP/2   ──► Multiplexing over a single TCP connection.
             PROBLEM: TCP packet loss stalls ALL multiplexed streams!
     │
HTTP/3   ──► Built on QUIC (UDP).
             BENEFIT: Independent stream recovery; 0-RTT Connection Resumption;
             Smooth IP migration when switching from Wi-Fi to 5G.`,
    },
    diagramType: 'http_evolution_diag',
    explanation: {
      summary: 'HTTP/3 replaces TCP with QUIC over UDP, eliminating TCP head-of-line blocking and accelerating mobile handshake connection times.',
      full: `In HTTP/2, multiple resource streams share one TCP connection. If a single packet is dropped, TCP halts all streams while waiting for retransmission. HTTP/3 implements stream management at the transport layer directly inside QUIC, so packet loss on one stream does not pause other concurrent downloads.`,
    },
    likesCount: 2790,
    bookmarksCount: 1980,
    commentsCount: 118,
    tags: ['WebDev', 'HTTP3', 'QUIC', 'Networking'],
    timestamp: '5h ago',
  },
  {
    id: 'cs-web-03',
    creator: {
      name: 'Maya Patel',
      handle: 'maya_js',
      role: 'V8 Engine Contributor',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Web Dev',
    topicBadge: 'Real-Time Web',
    title: 'WebSockets vs Server-Sent Events (SSE) vs Polling',
    snippet: {
      language: 'javascript',
      code: `// Server-Sent Events (SSE) — Lightweight Unidirectional Stream
const eventSource = new EventSource('/api/live-market-feed');

eventSource.onmessage = (event) => {
  const stockUpdate = JSON.parse(event.data);
  updateTickerUI(stockUpdate);
};

// Automatically reconnects on network drop!
// Built directly on standard HTTP/2 and HTTP/3 without custom protocols.`,
    },
    diagramType: null,
    explanation: {
      summary: 'Use WebSockets for bidirectional communication (chat, gaming); use Server-Sent Events (SSE) for server-to-client streaming (AI responses, notifications, stock tickers).',
      full: `SSE runs over standard HTTP with Content-Type: text/event-stream, granting native support for HTTP/2 multiplexing, TLS certificates, corporate proxy firewalls, and automatic browser reconnection without the protocol upgrade complexity of WebSockets.`,
    },
    likesCount: 2280,
    bookmarksCount: 1540,
    commentsCount: 76,
    tags: ['WebDev', 'WebSockets', 'SSE', 'RealTime'],
    timestamp: '8h ago',
  },
  {
    id: 'cs-web-04',
    creator: {
      name: 'Elena Rostova',
      handle: 'erostova_cs',
      role: 'Staff Algorithms Engineer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Web Dev',
    topicBadge: 'DOM Performance',
    title: 'Virtual DOM vs Direct Fine-Grained Reactivity',
    snippet: {
      language: 'javascript',
      code: `// React: Virtual DOM Tree Diffing (Component re-evaluates)
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// SolidJS / Svelte 5 / Signals: Direct DOM node subscription (Zero VDOM Diff)
const [count, setCount] = createSignal(0);
// Only this precise text node updates on signal mutation!
<span>{count()}</span>`,
    },
    diagramType: null,
    explanation: {
      summary: 'Virtual DOM compares memory snapshots to batch DOM mutations; fine-grained Signals subscribe directly to target DOM nodes without re-running component functions.',
      full: `Signals establish a dependency graph during initialization. When state changes, only the exact DOM text node or attribute subscribed to that signal is updated directly in memory, bypassing recursive component tree diffing.`,
    },
    likesCount: 2950,
    bookmarksCount: 1870,
    commentsCount: 132,
    tags: ['WebDev', 'React', 'SolidJS', 'Performance'],
    timestamp: '11h ago',
  },
  {
    id: 'cs-algo-05',
    creator: {
      name: 'Marcus Vance',
      handle: 'marcus_vance',
      role: 'Compiler Architect',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Algorithms',
    topicBadge: 'Divide & Conquer',
    title: 'Fast Exponentiation (Binary Exponentiation in O(log N))',
    snippet: {
      language: 'python',
      code: `def power(base, exp, mod=10**9 + 7):
    result = 1
    base = base % mod
    while exp > 0:
        # If exp is odd, multiply base with result
        if exp % 2 == 1:
            result = (result * base) % mod
        # exp must be even now
        exp = exp // 2
        base = (base * base) % mod
    return result

# Calculate 3^1000000 in < 30 iterations!`,
    },
    diagramType: null,
    explanation: {
      summary: 'Calculates base^N in O(log N) operations by squaring the base when the exponent is halved.',
      full: `Naive multiplication requires N iterations (O(N)), which fails for large cryptographic exponents like RSA (2048-bit keys). Binary exponentiation recursively applies x^2n = (x^n)^2, calculating powers with hundreds of digits in less than a microsecond.`,
    },
    likesCount: 1820,
    bookmarksCount: 1210,
    commentsCount: 42,
    tags: ['Algorithms', 'Math', 'Cryptography', 'Python'],
    timestamp: '12h ago',
  },
  {
    id: 'cs-sys-05',
    creator: {
      name: 'Chloe Monet',
      handle: 'chloe_cloud',
      role: 'Staff Distributed Systems Engineer',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
    category: 'System Design',
    topicBadge: 'Security & Auth',
    title: 'JWT vs Stateful Session Tokens: Where to Store Them',
    snippet: {
      language: 'javascript',
      code: `// Storing Tokens in LocalStorage -> Vulnerable to XSS injection!
// SECURE PATTERN:
// 1. Short-Lived Access Token (15 mins) stored in Memory (React State)
// 2. Long-Lived Refresh Token stored in HttpOnly, SameSite=Strict Cookie

app.post('/api/refresh', (req, res) => {
  const refreshToken = req.cookies.jwt_refresh; // JS cannot access this!
  const newAccessToken = verifyAndIssueNewToken(refreshToken);
  res.json({ accessToken: newAccessToken });
});`,
    },
    diagramType: null,
    explanation: {
      summary: 'HttpOnly and SameSite=Strict cookies protect tokens from JavaScript XSS attacks while defending against Cross-Site Request Forgery (CSRF).',
      full: `Storing JWTs in localStorage allows any malicious third-party script or npm package dependency to steal user sessions with document.localStorage. Using short-lived in-memory access tokens paired with HttpOnly refresh cookies provides defense-in-depth against credential theft.`,
    },
    likesCount: 3200,
    bookmarksCount: 2310,
    commentsCount: 147,
    tags: ['SystemDesign', 'Security', 'JWT', 'Authentication'],
    timestamp: '13h ago',
  },
  {
    id: 'cs-db-05',
    creator: {
      name: 'Priya Sharma',
      handle: 'priya_scale',
      role: 'Database Reliability Engineer',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Databases',
    topicBadge: 'High Availability',
    title: 'Database Replication: Synchronous vs Asynchronous',
    snippet: {
      language: 'text',
      code: `Primary Database ───► Write Received
       │
[Synchronous Replication]
├─► Sends to Replica ──► Replica ACK received ──► Returns Success (High Latency, Zero Data Loss)

[Asynchronous Replication]
└─► Returns Success Immediately ──► Replica syncs in background (Low Latency, Potential Lag)`,
    },
    diagramType: null,
    explanation: {
      summary: 'Synchronous replication guarantees zero data loss at the expense of write latency; asynchronous replication maximizes throughput but risks replica lag.',
      full: `Modern production databases like Postgres and CockroachDB often implement Semi-Synchronous replication: wait for 1 synchronous quorum replica to confirm disk write before acknowledging, while letting read replicas catch up asynchronously.`,
    },
    likesCount: 1950,
    bookmarksCount: 1380,
    commentsCount: 65,
    tags: ['Databases', 'Replication', 'Reliability', 'Postgres'],
    timestamp: '14h ago',
  },
  {
    id: 'cs-web-05',
    creator: {
      name: 'Carlos Ruiz',
      handle: 'carlos_net',
      role: 'Lead Network Engineer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Web Dev',
    topicBadge: 'Transport Layer',
    title: 'TCP 3-Way Handshake & SYN Flooding Attacks',
    snippet: {
      language: 'text',
      code: `Client                       Server
  │                            │
  ├─── SYN (Seq = 100) ───────►│  (Server allocates TCB memory)
  │                            │
  │◄── SYN-ACK (Ack = 101) ────┤
  │                            │
  ├─── ACK (Seq = 101) ───────►│  Connection ESTABLISHED!
  │                            │

[SYN Flood Attack Protection: SYN Cookies]
Server encodes sequence numbers algebraically without allocating memory state until final ACK arrives!`,
    },
    diagramType: 'tcp_handshake_diag',
    explanation: {
      summary: 'TCP guarantees reliable, ordered byte delivery using Sequence (Seq) and Acknowledgment (Ack) counters.',
      full: `In a SYN flood Denial-of-Service attack, attackers send thousands of SYN packets with spoofed IP addresses and never respond with the final ACK, exhausting the server's TCP connection backlog queue. Modern Linux kernels enable SYN cookies (syncookies) to encode connection parameters in the initial sequence number without consuming kernel memory.`,
    },
    likesCount: 2540,
    bookmarksCount: 1720,
    commentsCount: 89,
    tags: ['WebDev', 'Networking', 'Security', 'TCP'],
    timestamp: '16h ago',
  },
  {
    id: 'cs-algo-06',
    creator: {
      name: 'Elena Rostova',
      handle: 'erostova_cs',
      role: 'Staff Algorithms Engineer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Algorithms',
    topicBadge: 'Dynamic Programming',
    title: 'Kadane’s Algorithm: Maximum Subarray in O(N)',
    snippet: {
      language: 'javascript',
      code: `function maxSubArray(nums) {
  let maxSoFar = nums[0];
  let currentMax = nums[0];

  for (let i = 1; i < nums.length; i++) {
    // Either extend existing subarray or start fresh from nums[i]
    currentMax = Math.max(nums[i], currentMax + nums[i]);
    maxSoFar = Math.max(maxSoFar, currentMax);
  }
  return maxSoFar;
}`,
    },
    diagramType: null,
    explanation: {
      summary: 'Finds the contiguous subarray with the largest sum in O(N) linear time and O(1) space.',
      full: `At each index i, Kadane’s algorithm asks: is it better to append the current element to the running sum, or start a new subarray beginning right here? If currentMax drops below 0, dragging it forward will only diminish future sums, so starting fresh is optimal.`,
    },
    likesCount: 1930,
    bookmarksCount: 1250,
    commentsCount: 44,
    tags: ['Algorithms', 'DynamicProgramming', 'Arrays', 'Math'],
    timestamp: '17h ago',
  },
  {
    id: 'cs-db-06',
    creator: {
      name: 'Tariq Al-Mansoor',
      handle: 'tariq_db',
      role: 'Principal Database Engineer',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Databases',
    topicBadge: 'Probabilistic Data Structures',
    title: 'Bloom Filters: Fast "Definitely Not in Set" Lookups',
    snippet: {
      language: 'python',
      code: `# Bloom Filter: k hash functions over m bit array
# Guarantees:
# - If bit is 0 -> Element is 100% DEFINITELY NOT in set! (Zero disk reads)
# - If all bits are 1 -> Element is POSSIBLY in set (Small false positive rate)

class BloomFilter:
    def contains(self, key):
        for h in self.hash_functions:
            if not self.bit_array[h(key) % self.size]:
                return False # Fast exit: skip querying SSTable disk!
        return True # Might exist; proceed to disk lookup`,
    },
    diagramType: null,
    explanation: {
      summary: 'Saves millions of expensive disk I/O operations by testing set membership in constant time memory.',
      full: `Cassandra, Google Bigtable, and RocksDB check a memory-resident Bloom filter before scanning SSTables on disk. If the filter returns false, the database knows with 100% mathematical certainty that the key does not exist in that file, saving disk seek latency entirely.`,
    },
    likesCount: 2890,
    bookmarksCount: 2010,
    commentsCount: 104,
    tags: ['Databases', 'BloomFilters', 'Storage', 'NoSQL'],
    timestamp: '18h ago',
  },
  {
    id: 'cs-sys-06',
    creator: {
      name: 'Dr. Sophia Lin',
      handle: 'sophia_graphs',
      role: 'Graph Theory Researcher',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    category: 'System Design',
    topicBadge: 'Messaging Architecture',
    title: 'Kafka vs RabbitMQ: Pull-based vs Push-based Brokers',
    snippet: {
      language: 'text',
      code: `RabbitMQ (Push Broker / Smart Broker, Dumb Consumer):
- Server pushes messages to active workers.
- Deletes messages as soon as consumer ACKs.
- Ideal for task queues, background jobs, complex routing keys.

Apache Kafka (Pull Broker / Dumb Broker, Smart Consumer):
- Immutable append-only commit log with consumer-managed offsets.
- Messages retained on disk based on retention time (e.g. 7 days).
- Consumers pull at their own pace; can replay historical events anytime.`,
    },
    diagramType: null,
    explanation: {
      summary: 'Kafka is a distributed append-only event log with replayable offsets; RabbitMQ is an AMQP queue broker optimized for point-to-point task routing.',
      full: `Kafka decouples throughput from consumer speed: slow consumers cannot overwhelm the broker because consumers pull batches when ready, and multiple independent consumer groups can read the identical partition stream without duplicating storage.`,
    },
    likesCount: 3100,
    bookmarksCount: 2200,
    commentsCount: 135,
    tags: ['SystemDesign', 'Kafka', 'RabbitMQ', 'EventDriven'],
    timestamp: '19h ago',
  },
  {
    id: 'cs-web-06',
    creator: {
      name: 'Maya Patel',
      handle: 'maya_js',
      role: 'V8 Engine Contributor',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Web Dev',
    topicBadge: 'Web Security',
    title: 'CORS Explained: What the Preflight OPTIONS Request Does',
    snippet: {
      language: 'http',
      code: `Browser sends Preflight OPTIONS before non-simple requests (e.g. JSON, custom headers):

OPTIONS /api/data HTTP/1.1
Origin: https://frontend.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type, Authorization

Server Response:
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://frontend.example.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization`,
    },
    diagramType: null,
    explanation: {
      summary: 'Cross-Origin Resource Sharing (CORS) is a browser security mechanism that prevents unauthorized cross-origin requests from executing unsafe operations.',
      full: `CORS is enforced strictly by the browser, not the server. Postman or cURL bypass CORS completely because they do not enforce the Same-Origin Policy. Preflight OPTIONS requests verify that the target API deliberately consents to accepting credentials and cross-origin payloads before sending the actual POST or PUT body.`,
    },
    likesCount: 2450,
    bookmarksCount: 1680,
    commentsCount: 91,
    tags: ['WebDev', 'Security', 'CORS', 'HTTP'],
    timestamp: '20h ago',
  },
  {
    id: 'cs-algo-07',
    creator: {
      name: 'Marcus Vance',
      handle: 'marcus_vance',
      role: 'Compiler Architect',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Algorithms',
    topicBadge: 'Tree Traversals',
    title: 'Trie (Prefix Tree) for Sub-millisecond Autocomplete',
    snippet: {
      language: 'typescript',
      code: `class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord: boolean = false;
}

class Trie {
  root = new TrieNode();

  insert(word: string): void {
    let curr = this.root;
    for (const ch of word) {
      if (!curr.children.has(ch)) curr.children.set(ch, new TrieNode());
      curr = curr.children.get(ch)!;
    }
    curr.isEndOfWord = true;
  }

  startsWith(prefix: string): boolean {
    let curr = this.root;
    for (const ch of prefix) {
      if (!curr.children.has(ch)) return false;
      curr = curr.children.get(ch)!;
    }
    return true; // O(K) lookup where K = prefix length!
  }
}`,
    },
    diagramType: null,
    explanation: {
      summary: 'Search, insert, and prefix matching execute in O(K) time where K is the string length, independent of dictionary size.',
      full: `A hash map requires computing hash values across full keys and cannot efficiently query prefix ranges. Tries share common prefixes among words, dramatically reducing memory while powering search bar suggestions and IP routing prefix tables.`,
    },
    likesCount: 2110,
    bookmarksCount: 1470,
    commentsCount: 68,
    tags: ['Algorithms', 'Trie', 'DataStructures', 'TypeScript'],
    timestamp: '21h ago',
  },
  {
    id: 'cs-sys-07',
    creator: {
      name: 'Devon Wright',
      handle: 'devon_infra',
      role: 'Cache & Memory Specialist',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    category: 'System Design',
    topicBadge: 'Resilience Patterns',
    title: 'The Circuit Breaker Pattern: Preventing Cascading Outages',
    snippet: {
      language: 'javascript',
      code: `// Circuit Breaker State Machine: CLOSED -> OPEN -> HALF-OPEN
class CircuitBreaker {
  state = 'CLOSED'; // Healthy
  failureCount = 0;
  threshold = 5;
  timeout = 10000;

  async execute(asyncFn) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit is OPEN (Fast Fail to protect downstream)');
    }
    try {
      const res = await asyncFn();
      this.reset();
      return res;
    } catch (err) {
      this.failureCount++;
      if (this.failureCount >= this.threshold) {
        this.trip();
      }
      throw err;
    }
  }
}`,
    },
    diagramType: null,
    explanation: {
      summary: 'Stops sending traffic to failing downstream services, returning immediate fallbacks and allowing the degraded service time to recover.',
      full: `When a microservice begins timing out, upstream services keep connections open and thread pools exhaust rapidly, cascading the failure across the entire architecture. A circuit breaker trips to OPEN upon consecutive failures, fast-failing traffic without exhausting network sockets.`,
    },
    likesCount: 2750,
    bookmarksCount: 1920,
    commentsCount: 110,
    tags: ['SystemDesign', 'Reliability', 'Microservices', 'Resilience'],
    timestamp: '22h ago',
  },
  {
    id: 'cs-algo-08',
    creator: {
      name: 'Dr. Sophia Lin',
      handle: 'sophia_graphs',
      role: 'Graph Theory Researcher',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Algorithms',
    topicBadge: 'Disjoint Sets',
    title: 'Union-Find with Path Compression & Rank in O(α(N))',
    snippet: {
      language: 'javascript',
      code: `class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }

  find(i) {
    // Path compression: flatten tree directly to root
    if (this.parent[i] !== i) {
      this.parent[i] = this.find(this.parent[i]);
    }
    return this.parent[i];
  }

  union(i, j) {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI === rootJ) return false; // Cycle detected!

    // Union by rank
    if (this.rank[rootI] < this.rank[rootJ]) this.parent[rootI] = rootJ;
    else if (this.rank[rootI] > this.rank[rootJ]) this.parent[rootJ] = rootI;
    else {
      this.parent[rootJ] = rootI;
      this.rank[rootI]++;
    }
    return true;
  }
}`,
    },
    diagramType: null,
    explanation: {
      summary: 'Maintains disjoint sets in nearly O(1) amortized inverse Ackermann time α(N) ≤ 4 for all practical universe sizes.',
      full: `Kruskal’s minimum spanning tree algorithm and network connectivity graphs use Union-Find. Path compression collapses parent pointers during find queries, ensuring trees remain virtually flat.`,
    },
    likesCount: 2340,
    bookmarksCount: 1560,
    commentsCount: 72,
    tags: ['Algorithms', 'UnionFind', 'Graphs', 'DataStructures'],
    timestamp: '1d ago',
  },
  {
    id: 'cs-db-07',
    creator: {
      name: 'Priya Sharma',
      handle: 'priya_scale',
      role: 'Database Reliability Engineer',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Databases',
    topicBadge: 'Distributed Transactions',
    title: 'Two-Phase Commit (2PC) vs Sagas Pattern',
    snippet: {
      language: 'text',
      code: `Two-Phase Commit (2PC):
- Phase 1 (Prepare): Coordinator asks all nodes "Can you commit?"
- Phase 2 (Commit): If all YES -> Commit! If any NO -> Abort!
- DOWNSIDE: Blocking coordinator failure stalls entire cluster!

Saga Pattern (Compensating Transactions):
- Series of local transactions coordinated via Event Choreography.
- If Step 3 fails, triggers explicit Compensating Actions (Undo Step 2, Undo Step 1).`,
    },
    diagramType: null,
    explanation: {
      summary: '2PC guarantees atomic ACID across microservices but blocks on coordinator failure; Sagas provide eventual consistency through compensating rollbacks.',
      full: `In modern cloud-native architectures spanning multiple independent microservice databases, 2PC creates severe latency bottlenecks. Sagas decouple execution: each service emits domain events upon local commit, triggering compensating transactions if any downstream step fails.`,
    },
    likesCount: 3050,
    bookmarksCount: 2180,
    commentsCount: 128,
    tags: ['Databases', 'SagaPattern', '2PC', 'Microservices'],
    timestamp: '1d ago',
  },
  {
    id: 'cs-sys-08',
    creator: {
      name: 'Zack Chen',
      handle: 'zack_arch',
      role: 'VP Infrastructure Engineering',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    },
    category: 'System Design',
    topicBadge: 'Load Balancing',
    title: 'Layer 4 (Transport) vs Layer 7 (Application) Load Balancing',
    snippet: {
      language: 'text',
      code: `Layer 4 Load Balancer (e.g. AWS NLB, Linux IPVS):
- Operates on IP + Port (TCP/UDP level)
- Does NOT inspect HTTP payload or headers
- Blazing fast, millions of packets per second

Layer 7 Load Balancer (e.g. AWS ALB, NGINX, Envoy):
- Operates on HTTP headers, cookies, URL paths (e.g. /api/checkout -> Service A)
- Performs TLS Termination and Web Application Firewall (WAF) filtering`,
    },
    diagramType: null,
    explanation: {
      summary: 'Layer 4 routes raw packets at TCP/UDP speeds; Layer 7 inspects HTTP paths, headers, and cookies to enable intelligent routing.',
      full: `Production architectures frequently combine both: an ultra-fast L4 NLB handles anycast public IP ingress and distributes packets to a pool of L7 Envoy/NGINX gateways that handle TLS termination, path routing, and auth verification.`,
    },
    likesCount: 2980,
    bookmarksCount: 2040,
    commentsCount: 97,
    tags: ['SystemDesign', 'LoadBalancing', 'Networking', 'NGINX'],
    timestamp: '1d ago',
  },
  {
    id: 'cs-web-07',
    creator: {
      name: 'Carlos Ruiz',
      handle: 'carlos_net',
      role: 'Lead Network Engineer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Web Dev',
    topicBadge: 'Web Performance',
    title: 'Core Web Vitals: Optimizing LCP, INP, and CLS',
    snippet: {
      language: 'javascript',
      code: `// 1. Largest Contentful Paint (LCP < 2.5s)
// Preload hero images and avoid render-blocking CSS:
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high" />

// 2. Interaction to Next Paint (INP < 200ms)
// Break up long JS tasks with scheduler.yield():
async function processLargeList(items) {
  for (const item of items) {
    processItem(item);
    if (globalThis.scheduler?.yield) await scheduler.yield();
  }
}

// 3. Cumulative Layout Shift (CLS < 0.1)
// Always specify width/height on images to reserve aspect ratio layout!`,
    },
    diagramType: null,
    explanation: {
      summary: 'Google Core Web Vitals directly impact search ranking and user retention by measuring perceived loading speed, responsiveness, and visual stability.',
      full: `INP replaced FID as the definitive metric for UI responsiveness. When long JavaScript tasks block the main thread for >50ms, user clicks and taps experience noticeable input lag. Using scheduler.yield() or Web Workers offloads heavy computation to keep the UI silky smooth at 60–120 FPS.`,
    },
    likesCount: 3180,
    bookmarksCount: 2370,
    commentsCount: 114,
    tags: ['WebDev', 'Performance', 'WebVitals', 'SEO'],
    timestamp: '1d ago',
  },
  {
    id: 'cs-algo-09',
    creator: {
      name: 'Elena Rostova',
      handle: 'erostova_cs',
      role: 'Staff Algorithms Engineer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    category: 'Algorithms',
    topicBadge: 'Bit Manipulation',
    title: 'Brian Kernighan’s Algorithm: Counting Set Bits in O(K)',
    snippet: {
      language: 'javascript',
      code: `function countSetBits(n) {
  let count = 0;
  while (n > 0) {
    // n & (n - 1) clears the lowest set bit in exactly 1 operation!
    n = n & (n - 1);
    count++;
  }
  return count;
}

// Example: n = 12 (binary 1100)
// Step 1: 1100 & 1011 = 1000 (count = 1)
// Step 2: 1000 & 0111 = 0000 (count = 2)
// Loops ONLY for the number of set bits (K), not all 32 bits!`,
    },
    diagramType: null,
    explanation: {
      summary: 'Subtracting 1 flips all bits up to the lowest set bit. ANDing n with n-1 clears that set bit in a single CPU cycle.',
      full: `Standard bit loops iterate 32 or 64 times regardless of whether the integer is sparse. Brian Kernighan’s algorithm runs strictly in O(K) where K is the number of 1-bits, making it standard in crypto libraries and bitmap engines.`,
    },
    likesCount: 2190,
    bookmarksCount: 1490,
    commentsCount: 57,
    tags: ['Algorithms', 'BitManipulation', 'Performance', 'Math'],
    timestamp: '2d ago',
  },
  {
    id: 'cs-sys-09',
    creator: {
      name: 'Liam O\'Connor',
      handle: 'liam_distributed',
      role: 'Distributed Systems Lead',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    },
    category: 'System Design',
    topicBadge: 'Data Partitioning',
    title: 'Database Sharding Strategies: Range vs Hash vs Directory',
    snippet: {
      language: 'text',
      code: `1. Range-Based Sharding:
   - Partition by range (e.g. Users A-M on Shard 1, N-Z on Shard 2).
   - Pro: Easy range queries.
   - Con: Massive hotspot risk (e.g. date-based sharding overwhelms current day shard).

2. Hash-Based Sharding:
   - Shard = Hash(user_id) % NumShards (or Consistent Hash Ring).
   - Pro: Even distribution.
   - Con: Cross-shard scatter-gather queries required for range scans.`,
    },
    diagramType: null,
    explanation: {
      summary: 'Sharding splits large database datasets horizontally across physical machines to overcome single-node storage and memory limits.',
      full: `Choosing the right Shard Key is the single most critical decision in distributed database architecture. A good shard key exhibits high cardinality, uniform access distribution, and aligns with your most frequent query filter patterns.`,
    },
    likesCount: 2840,
    bookmarksCount: 1990,
    commentsCount: 102,
    tags: ['SystemDesign', 'Sharding', 'Scaling', 'Databases'],
    timestamp: '2d ago',
  },
];

module.exports = { LEARN_POSTS };


