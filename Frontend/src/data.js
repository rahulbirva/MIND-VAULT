// ── FEED DATA ────────────────────────────────────────────────
export const FEED = [
  {
    cat: 'Space',
    title: 'Why the James Webb telescope changed astronomy forever',
    body: 'The James Webb Space Telescope, launched in 2021, can observe galaxies formed just 300 million years after the Big Bang. Its infrared sensors pierce through dust clouds invisible to previous telescopes, revealing star nurseries in stunning detail. It fundamentally shifted how we understand the early universe.',
    tags: ['Astrophysics', 'NASA', 'Infrared', 'Galaxies'],
  },
  {
    cat: 'Technology',
    title: 'Large language models: what they actually are',
    body: 'LLMs are statistical engines trained on vast text corpora to predict the next word in a sequence. They model patterns using billions of parameters. Despite this, they exhibit emergent reasoning capabilities that researchers are still working to fully explain.',
    tags: ['AI', 'NLP', 'Machine Learning'],
  },
  {
    cat: 'History',
    title: 'The Cold War space race in under 3 minutes',
    body: 'Between 1957 and 1969, the US and Soviet Union competed fiercely in space exploration driven by Cold War rivalry. Sputnik was the opening move; Apollo 11 was the decisive answer. The race produced satellites, GPS technology, and a permanent human presence in orbit.',
    tags: ['USSR', 'NASA', 'Cold War', '1960s'],
  },
  {
    cat: 'Science',
    title: 'How CRISPR lets scientists edit DNA like a document',
    body: 'CRISPR-Cas9 is a molecular scissors system adapted from bacterial immune defense. Scientists guide it to any DNA sequence, where it makes a precise cut. The cell\'s repair machinery then edits the gene, a process now used to treat sickle-cell disease and explore cancer cures.',
    tags: ['Genetics', 'Biology', 'Medicine'],
  },
  {
    cat: 'Philosophy',
    title: 'The trolley problem and what it reveals about ethics',
    body: 'A runaway trolley heads toward five people. You can pull a lever to divert it, killing one person instead. This thought experiment exposes the tension between consequentialist thinking and deontological ethics, two pillars of moral philosophy.',
    tags: ['Ethics', 'Decision Theory', 'Morality'],
  },
  {
    cat: 'Economics',
    title: 'Supply and demand: the engine behind every price',
    body: 'When supply of a good falls or demand rises, prices climb. This self-correcting mechanism allocates resources without central planning. Understanding it explains everything from gas price spikes to concert ticket scalping.',
    tags: ['Microeconomics', 'Markets', 'Pricing'],
  },
];

// ── DISCOVERY DATA ───────────────────────────────────────────
export const DISCOVERY = [
  {
    cat: 'Linguistics',
    title: 'How languages die, and what is lost with them',
    body: 'A language dies when its last fluent speaker passes away. Around 40% of the world\'s 7,000 languages are now endangered. Each lost language takes with it unique concepts, metaphors, and ways of encoding human experience that no other tongue can replicate.',
    tags: ['Culture', 'Anthropology', 'Endangered Languages'],
  },
  {
    cat: 'Psychology',
    title: 'The spotlight effect: everyone is too busy watching themselves',
    body: 'We consistently overestimate how much others notice our appearance, mistakes, or emotional states. This cognitive bias is rooted in anchoring our self-perception before adequately adjusting for others\' actual attention, which is far lower than we assume.',
    tags: ['Cognitive Bias', 'Self-Perception', 'Social Psychology'],
  },
  {
    cat: 'Biology',
    title: 'Mycorrhizal networks: how trees talk underground',
    body: 'Beneath forests lies a web of fungal filaments connecting tree roots across acres of soil. Trees share sugars, water, and distress signals through these networks. Older mother trees actively route nutrients to younger seedlings, challenging our view of forests as competitive.',
    tags: ['Ecology', 'Fungi', 'Forest Biology'],
  },
  {
    cat: 'Mathematics',
    title: 'Why infinity comes in different sizes',
    body: 'Georg Cantor proved in 1874 that some infinities are strictly larger than others. The infinity of real numbers cannot be paired one-to-one with counting numbers. This result was so shocking that other mathematicians tried to have Cantor dismissed.',
    tags: ['Set Theory', 'Cantor', 'Number Theory'],
  },
  {
    cat: 'Architecture',
    title: 'Brutalism: why ugly buildings became iconic',
    body: 'Brutalism emerged in post-war Britain as a philosophy of honest materials and unadorned function. Raw concrete, exposed structure, and geometric mass became symbols of social housing optimism. Today, buildings once slated for demolition are celebrated as heritage monuments.',
    tags: ['Design', 'Urban Planning', 'Modernism'],
  },
  {
    cat: 'Climate',
    title: 'Ocean acidification: the silent climate crisis',
    body: 'As oceans absorb excess CO₂, carbonic acid forms, lowering pH since industrialisation by around 26%. This dissolves the calcium carbonate shells of corals and mollusks, threatening the marine food chains that feed over a billion people.',
    tags: ['Climate', 'Marine Biology', 'CO₂'],
  },
];

// ── VAULT INITIAL SEED ───────────────────────────────────────
export const VAULT_INITIAL = [
  {
    cat: 'Space',
    title: 'Why the James Webb telescope changed astronomy forever',
    body: 'The James Webb Space Telescope infrared sensors reveal star nurseries and galaxies formed just 300 million years after the Big Bang.',
    tags: ['Astrophysics', 'NASA'],
    status: 'mastered',
  },
  {
    cat: 'Technology',
    title: 'Large language models: what they actually are',
    body: 'LLMs are statistical engines that model language patterns using billions of parameters, producing emergent reasoning capabilities.',
    tags: ['AI', 'NLP'],
    status: 'saved',
  },
  {
    cat: 'Biology',
    title: 'Mycorrhizal networks: how trees talk underground',
    body: 'A web of fungal filaments connects tree roots across acres, enabling trees to share sugars, water, and distress signals.',
    tags: ['Ecology', 'Fungi'],
    status: 'mastered',
  },
];

// ── DEEP DIVE TOPIC ──────────────────────────────────────────
export const TOPIC = {
  title: 'The science of black holes',
  summary:
    'A black hole is a region of spacetime where gravity is so strong that nothing — not even light or other electromagnetic waves — has enough speed to escape. They form when massive stars collapse at the end of their life cycle. The boundary beyond which nothing can return is called the event horizon. At the center lies a singularity where density becomes theoretically infinite and the known laws of physics break down.',
  facts: [
    'The first image of a black hole was captured in 2019 by the Event Horizon Telescope.',
    'Stellar black holes typically have masses between 5 and 100 times that of the Sun.',
    'Time passes slower near a black hole due to gravitational time dilation.',
    'Hawking radiation theorizes that black holes slowly evaporate over astronomical timescales.',
    'Supermassive black holes reside at the center of most large galaxies, including the Milky Way.',
  ],
  questions: [
    'In your own words, what is an event horizon and why is it significant?',
    'Why do massive stars form black holes rather than collapsing into regular dense objects?',
    'What did Stephen Hawking predict about the long-term fate of black holes?',
  ],
};

export const SUGGESTIONS = [
  { emoji: '🌌', label: 'Space' },
  { emoji: '📜', label: 'History' },
  { emoji: '💡', label: 'Technology' },
  { emoji: '🔬', label: 'Science' },
  { emoji: '🗳️', label: 'Politics' },
  { emoji: '🧠', label: 'Philosophy' },
  { emoji: '📊', label: 'Economics' },
  { emoji: '🌿', label: 'Health' },
  { emoji: '🎨', label: 'Art' },
];

export const KNOWLEDGE_TOPICS = [
  // Space & Astronomy
  { emoji: '🌌', label: 'Space', category: 'Cosmology' },
  { emoji: '🕳️', label: 'Black Holes', category: 'Astrophysics' },
  { emoji: '🔭', label: 'James Webb Telescope', category: 'Astronomy' },
  { emoji: '🪐', label: 'Exoplanets', category: 'Planetary Science' },
  { emoji: '🚀', label: 'Mars Exploration', category: 'Spaceflight' },
  { emoji: '🛰️', label: 'Satellites & Orbits', category: 'Aerospace' },

  // Technology & Computer Science
  { emoji: '💡', label: 'Technology', category: 'Tech Fundamentals' },
  { emoji: '🤖', label: 'Artificial Intelligence', category: 'Computer Science' },
  { emoji: '🧠', label: 'Machine Learning', category: 'Data Science' },
  { emoji: '💬', label: 'Large Language Models', category: 'AI & NLP' },
  { emoji: '⚡', label: 'Quantum Computing', category: 'Physics & Computing' },
  { emoji: '🦾', label: 'Robotics', category: 'Automation' },
  { emoji: '🔐', label: 'Cybersecurity', category: 'Information Security' },
  { emoji: '⛓️', label: 'Blockchain', category: 'Distributed Systems' },
  { emoji: '💻', label: 'Software Architecture', category: 'Engineering' },

  // Economics & Markets
  { emoji: '📊', label: 'Economics', category: 'Finance & Markets' },
  { emoji: '📈', label: 'Macroeconomics', category: 'Global Systems' },
  { emoji: '🏷️', label: 'Microeconomics', category: 'Market Dynamics' },
  { emoji: '🎯', label: 'Behavioral Economics', category: 'Psychology & Economics' },
  { emoji: '🎲', label: 'Game Theory', category: 'Decision Sciences' },
  { emoji: '🏦', label: 'Central Banking & Inflation', category: 'Monetary Policy' },
  { emoji: '💳', label: 'Personal Finance', category: 'Financial Literacy' },

  // History & Civilizations
  { emoji: '📜', label: 'History', category: 'World History' },
  { emoji: '🏛️', label: 'Ancient Rome', category: 'Classical Antiquity' },
  { emoji: '🏺', label: 'Ancient Greece', category: 'Classical History' },
  { emoji: '🐪', label: 'The Silk Road', category: 'Trade History' },
  { emoji: '⚔️', label: 'Cold War History', category: 'Modern History' },
  { emoji: '🏭', label: 'Industrial Revolution', category: 'Economic History' },
  { emoji: '👑', label: 'The Renaissance', category: 'Cultural History' },

  // Science & Physics
  { emoji: '🔬', label: 'Science', category: 'Natural Sciences' },
  { emoji: '⚛️', label: 'Quantum Physics', category: 'Theoretical Physics' },
  { emoji: '🍎', label: 'General Relativity', category: 'Physics' },
  { emoji: '🧬', label: 'Biology', category: 'Life Sciences' },
  { emoji: '✂️', label: 'CRISPR & Gene Editing', category: 'Biotechnology' },
  { emoji: '🧪', label: 'Chemistry', category: 'Physical Sciences' },
  { emoji: '🌍', label: 'Climate Science', category: 'Ecology & Earth' },
  { emoji: '🌊', label: 'Oceanography', category: 'Marine Science' },

  // Philosophy & Mind
  { emoji: '🧠', label: 'Philosophy', category: 'Logic & Thought' },
  { emoji: '🗿', label: 'Stoicism', category: 'Applied Philosophy' },
  { emoji: '⚖️', label: 'Ethics & Morality', category: 'Moral Philosophy' },
  { emoji: '🧩', label: 'Psychology', category: 'Human Behavior' },
  { emoji: '👁️', label: 'Cognitive Biases', category: 'Mental Models' },
  { emoji: '🔬', label: 'Neuroscience', category: 'Brain Sciences' },
  { emoji: '🧘', label: 'Mindfulness', category: 'Mental Wellbeing' },

  // Health & Body
  { emoji: '🌿', label: 'Health', category: 'Preventative Medicine' },
  { emoji: '🥗', label: 'Nutrition Science', category: 'Diet & Metabolism' },
  { emoji: '⏳', label: 'Longevity Science', category: 'Biomedical' },
  { emoji: '💤', label: 'Sleep Science', category: 'Physiology' },

  // Politics, Law & Society
  { emoji: '🗳️', label: 'Politics', category: 'Governance' },
  { emoji: '⚖️', label: 'Constitutional Law', category: 'Legal Studies' },
  { emoji: '🌐', label: 'Geopolitics', category: 'International Relations' },
  { emoji: '👥', label: 'Sociology', category: 'Social Sciences' },

  // Arts & Culture
  { emoji: '🎨', label: 'Art', category: 'Visual Culture' },
  { emoji: '📐', label: 'Architecture', category: 'Design & Form' },
  { emoji: '🎵', label: 'Music Theory', category: 'Acoustics & Arts' },
  { emoji: '🗣️', label: 'Linguistics', category: 'Language & Mind' },
  { emoji: '🔢', label: 'Mathematics', category: 'Pure Sciences' },
];

