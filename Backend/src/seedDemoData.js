/**
 * seedDemoData.js
 * Injects high-quality demo data (Saves, Likes, Categories, Hashtags) into MongoDB.
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindvault';

const VaultItem = require('./models/VaultItem');
const FeedItem = require('./models/FeedItem');
const User = require('./models/User');
const { deriveCategory, deriveHashtags } = require('./utils/tagUtils');

const DEMO_ITEMS = [
  {
    topic: 'How the James Webb Space Telescope Rewrites Cosmic History',
    cat: 'Space',
    tags: ['#Space', '#JamesWebb', '#Astronomy', '#NASA', '#MindVault'],
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    body: 'The James Webb Space Telescope (JWST) uses ultra-sensitive infrared detectors to observe the universe\'s earliest stars and galaxies, formed over 13.5 billion years ago.\n\nBecause infrared radiation penetrates dust clouds that block visible light, JWST can witness stellar nurseries and detect atmospheric chemical signatures—such as water vapor, methane, and carbon dioxide—on distant exoplanets.\n\nIts 6.5-meter gold-coated beryllium mirror folds into rocket fairings and unfurls in deep space at the Second Lagrange Point (L2), nearly one million miles from Earth.',
    summary: 'Infrared sensors and gold mirrors enable JWST to peer past cosmic dust clouds to image the earliest galaxies and analyze exoplanet atmospheres.',
    keyFacts: [
      'Operates 1 million miles away at the gravitationally stable L2 point.',
      'Primary mirror is 6.5 meters across and coated with a microscopic layer of pure gold.',
      'Detects chemical biosignatures in the atmospheres of planets orbiting distant stars.',
    ],
    sourceType: 'saved',
  },
  {
    topic: 'Credit Score Mechanics: Utilization Ratios & Bureau Scoring',
    cat: 'Finance',
    tags: ['#Finance', '#CreditScore', '#MoneyManagement', '#Wealth', '#MindVault'],
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
    body: 'FICO and VantageScore algorithms evaluate creditworthiness using five distinct weighted components, with on-time payment history (35%) and credit utilization (30%) having the greatest impact.\n\nCredit utilization measures the revolving balance reported to bureaus divided by total available credit limits. Keeping utilization under 10% across all individual lines prevents automated scoring penalties.\n\nPaying down balances before the statement closing date (rather than the due date) ensures lower balances are reported to Equifax, Experian, and TransUnion.',
    summary: 'Payment consistency (35%) and credit utilization (30%) drive credit scores; paying balances before statement closing optimizes reporting.',
    keyFacts: [
      'Keep credit utilization under 10% per card for optimal algorithmic scoring.',
      'Statement closing date is when balances get reported to credit bureaus.',
      'Average age of accounts (15%) benefits from keeping older zero-fee cards open.',
    ],
    sourceType: 'liked',
  },
  {
    topic: 'The 5th Amendment & Motor Vehicle Traffic Stop Protocols',
    cat: 'Rights',
    tags: ['#Rights', '#Constitution', '#LegalRights', '#CivilLiberties', '#MindVault'],
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
    body: 'During a lawful traffic stop, drivers are required by statute to provide their driver\'s license, vehicle registration, and proof of insurance upon demand.\n\nHowever, the Fifth Amendment protects individuals from self-incrimination. You are not legally required to answer exploratory questions such as "Do you know how fast you were going?" or "Where are you heading tonight?".\n\nPolitely stating "Officer, I am exercising my right to remain silent" avoids involuntary admissions while preserving all constitutional protections for court proceedings.',
    summary: 'Drivers must provide mandatory driving credentials, but Fifth Amendment rights protect against answering interrogative or exploratory questions.',
    keyFacts: [
      'Statutory duty requires producing license, registration, and insurance.',
      'Fifth Amendment protects against answering investigatory or roadside questions.',
      'Explicitly and politely state that you choose to remain silent.',
    ],
    sourceType: 'saved',
  },
  {
    topic: 'First Aid: Emergency Burn Classifications & What Never To Apply',
    cat: 'Safety',
    tags: ['#Safety', '#FirstAid', '#EmergencyResponse', '#HealthTips', '#MindVault'],
    imageUrl: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1200&q=80',
    body: 'Thermal burns require immediate cooling with clean, room-temperature or cool running tap water for 10 to 20 minutes to halt the thermal injury cascade.\n\nNever apply ice, ice water, butter, mayonnaise, toothpaste, or greasy ointments. Ice causes vasoconstriction and thermal shock, intensifying tissue necrosis, while food products insulate heat and introduce severe bacterial infection vectors.\n\nFor second-degree blisters or third-degree burns with charred or white skin, cover loosely with sterile, non-adherent gauze and seek immediate emergency medical care.',
    summary: 'Cool burns immediately with cool running water; avoid ice or home remedies like butter which trap heat and cause tissue damage.',
    keyFacts: [
      'Flush immediately with cool tap water for 10–20 minutes.',
      'Never apply ice (causes tissue necrosis) or butter/oils (trap heat and cause infection).',
      'Do not pop intact blisters; cover loosely with clean sterile dressings.',
    ],
    sourceType: 'liked',
  },
  {
    topic: 'Quantum Computing: Qubits, Superposition & Shor\'s Algorithm',
    cat: 'Technology',
    tags: ['#Technology', '#Quantum', '#Computing', '#Cryptography', '#MindVault'],
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
    body: 'Unlike classical bits that exist in binary states of 0 or 1, quantum bits (qubits) exploit quantum mechanical superposition to evaluate complex computational states simultaneously.\n\nQuantum entanglement binds pairs of qubits such that the state of one instantaneously influences the other, enabling exponential parallelism in state space exploration.\n\nAlgorithms like Shor\'s Algorithm can factor large prime numbers in polynomial time, posing future challenges to RSA cryptography while opening unprecedented frontiers in drug molecular simulation.',
    summary: 'Qubits utilize quantum superposition and entanglement to perform complex polynomial computations that outpace classical supercomputers.',
    keyFacts: [
      'Superposition allows qubits to compute across linear combinations of states.',
      'Entanglement enables interconnected processing across multi-qubit registers.',
      'Threatens traditional RSA encryption while supercharging molecular simulation.',
    ],
    sourceType: 'saved',
  },
  {
    topic: 'The Neuroscience of Deep Sleep and Glymphatic Brain Cleansing',
    cat: 'Health',
    tags: ['#Health', '#Neuroscience', '#SleepQuality', '#BrainHealth', '#MindVault'],
    imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
    body: 'During slow-wave non-REM deep sleep, the brain\'s interstitial space expands by over 60%, allowing cerebrospinal fluid to flush through cerebral tissue via the glymphatic system.\n\nThis convective flow removes neurotoxic metabolic waste accumulated during waking hours, including beta-amyloid and tau proteins associated with neurodegenerative diseases.\n\nPrioritizing consistent sleep schedules and minimizing evening alcohol and caffeine ensures the brain completes its vital biological restoration cycles.',
    summary: 'During deep sleep, the glymphatic system pumps cerebrospinal fluid through brain tissue to clear away toxic amyloid proteins.',
    keyFacts: [
      'Glymphatic fluid channels expand by 60% during slow-wave non-REM sleep.',
      'Flushes out beta-amyloid and tau proteins linked to cognitive decline.',
      'Consistent circadian timing maximizes the duration of restorative deep sleep stages.',
    ],
    sourceType: 'liked',
  },
  {
    topic: 'Game Theory: The Prisoner\'s Dilemma and Nash Equilibrium',
    cat: 'Economics',
    tags: ['#Economics', '#GameTheory', '#DecisionMaking', '#Strategy', '#MindVault'],
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    body: 'The Prisoner\'s Dilemma illustrates why rational individuals might fail to cooperate even when mutual cooperation would yield the highest combined payoff.\n\nWhen both participants independently choose their dominant strategy to defect, they reach a Nash Equilibrium where neither player can improve their outcome by unilaterally changing decisions.\n\nIn repeated games, strategies like "Tit-for-Tat" (starting with cooperation and mirroring the opponent\'s previous move) naturally foster resilient long-term collaboration.',
    summary: 'The Prisoner\'s Dilemma demonstrates how individual rational self-interest can produce suboptimal outcomes compared to cooperative strategies.',
    keyFacts: [
      'A Nash Equilibrium is a state where no participant benefits from unilateral strategy change.',
      'Demonstrates why uncoordinated competition often degrades collective welfare.',
      'Iterated interactions encourage cooperation through reciprocal "Tit-for-Tat" strategies.',
    ],
    sourceType: 'saved',
  },
  {
    topic: 'How Wi-Fi 7 and Mesh Networking Eliminate Network Congestion',
    cat: 'Everyday Tech',
    tags: ['#EverydayTech', '#WiFi7', '#Networking', '#SmartHome', '#MindVault'],
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
    body: 'Wi-Fi 7 (802.11be) introduces Multi-Link Operation (MLO), enabling client devices to transmit and receive data simultaneously across multiple frequency bands (2.4 GHz, 5 GHz, and 6 GHz).\n\nUnlike older single-channel connections that stall when encountering radio frequency interference, MLO dynamically aggregates channels and bypasses congested frequencies on the fly.\n\nCombined with 320 MHz ultra-wide channels and 4096-QAM modulation, modern mesh systems deliver gigabit throughput with deterministic, sub-5ms latency across entire homes.',
    summary: 'Wi-Fi 7 Multi-Link Operation binds 2.4, 5, and 6 GHz bands simultaneously to slash latency and bypass physical interference.',
    keyFacts: [
      'Multi-Link Operation (MLO) connects across multiple radio bands simultaneously.',
      '320 MHz channel bandwidth doubles previous Wi-Fi 6 channel widths.',
      'Drastically reduces latency spikes for high-bandwidth real-time applications.',
    ],
    sourceType: 'liked',
  },
];

async function seed() {
  try {
    console.log('🌱 Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Discover all existing users in the database
    const users = await User.find({}).lean();
    const userIds = users.map(u => String(u._id));
    
    // Always include fallback identifiers
    const targetUserIds = Array.from(new Set([...userIds, 'default_user', 'guest']));
    console.log(`👤 Target User IDs for Demo Seeding:`, targetUserIds);

    let totalVaultInserted = 0;
    let totalFeedInserted = 0;

    for (const uid of targetUserIds) {
      for (const item of DEMO_ITEMS) {
        const cat = deriveCategory(item.topic, item.cat);
        const tags = (Array.isArray(item.tags) && item.tags.length > 0)
          ? item.tags
          : deriveHashtags(item.topic, cat);

        // 1. Check or insert in VaultItem
        const existingVault = await VaultItem.findOne({
          userId: uid,
          topic: item.topic,
          sourceType: item.sourceType,
        });

        if (!existingVault) {
          await VaultItem.create({
            userId: uid,
            topic: item.topic,
            cat,
            tags,
            body: item.body,
            summary: item.summary,
            keyFacts: item.keyFacts,
            imageUrl: item.imageUrl,
            sourceType: item.sourceType,
            createdAt: new Date(),
          });
          totalVaultInserted++;
        }

        // 2. Check or insert in FeedItem
        const existingFeed = await FeedItem.findOne({
          userId: uid,
          topic: item.topic,
        });

        if (!existingFeed) {
          await FeedItem.create({
            userId: uid,
            topic: item.topic,
            cat,
            tags,
            body: item.body,
            summary: item.summary,
            keyPoints: item.keyFacts,
            imageUrl: item.imageUrl,
            source: 'interest',
            seen: false,
            createdAt: new Date(),
          });
          totalFeedInserted++;
        }
      }
    }

    console.log(`🎉 Demo Data Seeded Successfully!`);
    console.log(`   📌 Vault Items Inserted: ${totalVaultInserted}`);
    console.log(`   ⚡ Feed Items Inserted: ${totalFeedInserted}`);
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding demo data:', err);
    process.exit(1);
  }
}

seed();
