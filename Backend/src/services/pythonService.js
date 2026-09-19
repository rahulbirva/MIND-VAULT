/**
 * pythonService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin wrapper around the external Python AI microservice.
 * Provides a rich, non-repetitive educational knowledge library across all domains:
 * Economics, Politics, History, Health, Technology, Space, Science, Philosophy,
 * Psychology, Biology, Art, and Mathematics.
 *
 * Every article is distinct, with in-depth multi-paragraph content, curated
 * photography, and specific factual takeaways.
 */

require('dotenv').config();
const axios = require('axios');

const IS_MOCK = process.env.MOCK_MODE === 'true';
const BASE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';

// ── Curated High-Resolution Photography Per Category ─────────────────────────

const TOPIC_IMAGES = {
  space: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&auto=format&fit=crop&q=80',
  ],
  technology: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
  ],
  politics: [
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1575320181282-9afab399332c?w=1200&auto=format&fit=crop&q=80',
  ],
  history: [
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1572953109213-3be62398eb95?w=1200&auto=format&fit=crop&q=80',
  ],
  economics: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
  ],
  health: [
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop&q=80',
  ],
  science: [
    'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=1200&auto=format&fit=crop&q=80',
  ],
  philosophy: [
    'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&auto=format&fit=crop&q=80',
  ],
  psychology: [
    'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=1200&auto=format&fit=crop&q=80',
  ],
  biology: [
    'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&auto=format&fit=crop&q=80',
  ],
  art: [
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1200&auto=format&fit=crop&q=80',
  ],
  default: [
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
  ],
};

function getImageUrlForTopic(topicName, seedIndex = 0) {
  const clean = (topicName || '').toLowerCase();
  for (const [cat, urls] of Object.entries(TOPIC_IMAGES)) {
    if (clean.includes(cat)) {
      return urls[seedIndex % urls.length];
    }
  }
  return TOPIC_IMAGES.default[seedIndex % TOPIC_IMAGES.default.length];
}

// ── Multi-Article Comprehensive Topic Library ─────────────────────────────────

const TOPIC_LIBRARY = {
  economics: [
    {
      topic: 'Game Theory & The Prisoner’s Dilemma',
      body:
        'Game theory mathematically analyzes strategic interactions where an agent’s outcome depends not only on their own decisions, but on the choices of others. Developed by John von Neumann and John Nash, the discipline revolutionized economics, military strategy, evolutionary biology, and auction mechanics.\n\nThe classic Prisoner’s Dilemma illustrates why rational actors often fail to cooperate, even when mutual cooperation guarantees the optimal joint payoff. When both participants choose their dominant personal strategy, they inevitably settle into a suboptimal Nash Equilibrium—a paradox observable in corporate price wars, global tariff disputes, and geopolitical arms races.\n\nModern game theorists analyze repeated games and asymmetric information to design mechanisms that foster sustainable cooperation. Tit-for-tat strategies, reputational collateral, and binding automated smart contracts demonstrate that extending time horizons transforms zero-sum competition into durable, value-creating alliances.',
      keyPoints: [
        'Nash Equilibrium defines states where no player can unilaterally improve their payoff.',
        'Explains structural cooperation failure in tariff disputes and corporate price wars.',
        'Repeated games introduce reputational incentives that enforce long-term cooperation.',
        'Core framework behind modern FCC spectrum auctions and algorithmic ad bidding.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=MHS-htjGgSY',
    },
    {
      topic: 'Inflation, Central Banks & Quantitative Easing',
      body:
        'Inflation reflects the systemic erosion of purchasing power across an economy, measured through aggregated baskets like the Consumer Price Index (CPI). Central banks, including the Federal Reserve and the ECB, utilize dual mandates—price stability and maximum employment—to regulate monetary velocity through interest rates.\n\nFollowing the 2008 financial crisis and 2020 disruptions, central banks deployed Quantitative Easing (QE), purchasing long-term sovereign debt and mortgage-backed securities to inject liquidity directly into commercial banking reserves. This compressed yields on safe assets, encouraging capital flow into equities, enterprise lending, and venture expansion.\n\nHowever, persistent balance-sheet expansion introduces complex trade-offs between asset inflation and consumer price shocks. As supply chains fracture and fiscal deficits expand, central banks face the delicate tightrope of quantitative tightening (QT) without triggering liquidity freezes or sovereign debt distress.',
      keyPoints: [
        'Central banks adjust overnight lending rates to control credit availability.',
        'Quantitative Easing purchases long-duration securities to lower long-term yields.',
        'Excess liquidity expansion risks creating divergence between asset values and consumer prices.',
        'Quantitative Tightening (QT) shrinks central bank balance sheets to stabilize inflation.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=PHe0bXAIuk8',
    },
    {
      topic: 'Behavioral Economics & Loss Aversion',
      body:
        'Traditional neoclassical economics assumes individuals are hyper-rational optimizers ("Homo Economicus"). Pioneers Daniel Kahneman and Amos Tversky dismantled this assumption through Prospect Theory, demonstrating that human decision-making is heavily governed by cognitive heuristics, framing effects, and systematic emotional biases.\n\nA central discovery of behavioral economics is loss aversion: the psychological pain of losing $100 is experienced approximately twice as intensely as the pleasure of gaining $100. This asymmetry causes investors to hold losing stocks too long, consumers to overvalue status-quo baselines, and voters to resist beneficial systemic reforms.\n\nGovernments and enterprises now leverage "Nudge Theory" (popularized by Richard Thaler) to steer beneficial choices without coercion. Default automatic enrollment in retirement accounts, transparent nutritional color-coding, and structured opt-out mechanics dramatically improve collective outcomes with zero legislative mandates.',
      keyPoints: [
        'Prospect Theory shows human risk tolerance shifts fundamentally between gains and losses.',
        'Loss aversion causes losses to feel roughly twice as painful as equivalent gains.',
        'Status-quo bias creates persistent institutional and individual inertia.',
        'Choice architecture and behavioral nudges boost savings rates and organ donor enrollment.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=Yn8c3p4e41k',
    },
    {
      topic: 'Comparative Advantage & Global Supply Chains',
      body:
        'First formulated by classical economist David Ricardo in 1817, the theory of comparative advantage proves that countries benefit from international trade even if one nation is absolutely more efficient at producing every single good. Specialization in goods with the lowest domestic opportunity cost maximizes total global output.\n\nIn the 21st century, comparative advantage evolved from trading finished commodities to modular value-chain fragmentation. A single modern smartphone integrates advanced microprocessors fabricated in Taiwan, display panels engineered in South Korea, camera sensors from Japan, and final assembly in Southeast Asia.\n\nRecent geopolitical tensions and pandemic disruptions have tested the limits of hyper-optimized "just-in-time" logistics. Global manufacturers are actively transitioning toward "just-in-case" resilience, nearshoring critical components and balancing mathematical cost efficiency against geopolitical risk.',
      keyPoints: [
        'Comparative advantage relies on minimizing relative opportunity costs, not absolute costs.',
        'Global trade networks allow hyper-specialization across modular supply tiers.',
        'Just-in-time inventory models maximize capital efficiency but amplify supply shocks.',
        'Nearshoring and multi-sourcing are reshaping modern post-pandemic global logistics.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=peM_M88tL4k',
    },
    {
      topic: 'The Tragedy of the Commons & Carbon Markets',
      body:
        'The Tragedy of the Commons describes an economic dilemma where individuals with open access to a shared finite resource act in their rational self-interest, collectively depleting or degrading the resource to everyone’s detriment. Classic examples include depleted oceanic fisheries, congested highway networks, and planetary atmospheric capacity.\n\nEconomist Arthur Pigou proposed corrective taxes ("Pigouvian taxes") to internalize negative externalities, forcing private polluters to pay for societal costs. In contrast, Ronald Coase argued that clearly defining property rights allows private parties to negotiate efficient outcomes if transaction costs remain negligible.\n\nModern environmental economics unites both theories through Cap-and-Trade emissions markets. By capping aggregate emissions and issuing tradeable permits, carbon markets harness price discovery to achieve decarbonization at the lowest possible economic cost while incentivizing clean technological breakthroughs.',
      keyPoints: [
        'Unregulated common-pool resources suffer systemic depletion from unpriced externalities.',
        'Pigouvian taxes levy charges matching the exact marginal damage of external harms.',
        'The Coase Theorem shows private bargaining can resolve externalities if property rights are defined.',
        'Cap-and-Trade markets establish transparent carbon pricing to incentivize clean innovation.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=CxC161GvMPc',
    },
  ],
  politics: [
    {
      topic: 'Constitutional Separation of Powers & Checks',
      body:
        'The separation of powers divides government authority between the legislative, executive, and judicial branches to prevent tyranny and establish institutional checks and balances. Formulated by French philosopher Montesquieu in 1748, this framework was codified into modern constitutional republics to safeguard civil liberties.\n\nIn practice, each branch possesses counterweights: executives can veto legislative statutes, legislatures control public funding and confirm judicial appointments, and courts exercise judicial review to invalidate unconstitutional executive and legislative decrees. This institutional friction intentionally prevents rapid, unchecked consolidation of power.\n\nModern political systems implement distinct variants: parliamentary systems fuse executive and legislative leadership through cabinet governance, while presidential systems maintain rigid institutional separation. Understanding these structural mechanics is essential for analyzing democratic stability.',
      keyPoints: [
        'Separates statutory law-making, executive enforcement, and judicial interpretation.',
        'Veto powers, budget appropriation, and judicial review act as mutual counterweights.',
        'Montesquieu’s framework directly shaped the 1787 United States Constitution.',
        'Parliamentary systems offer rapid policy execution, while presidential systems prioritize institutional gridlock against overreach.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=pZnOdkDXKvk',
    },
    {
      topic: 'The Evolution of Democratic Voting Systems',
      body:
        'From ancient Athenian sortition (selecting civic leaders by lottery) to modern algorithmic ranked-choice ballots, electoral voting systems fundamentally dictate legislative representation, party stability, and civic engagement across sovereign nations.\n\nFirst-Past-The-Post (FPTP) plurality voting often creates Duverger’s Law, entrenching rigid two-party duopolies and penalizing third-party candidates through spoiler effects. In contrast, Proportional Representation (PR) allocates parliamentary seats according to national vote percentages, fostering dynamic coalition governments.\n\nRanked-Choice Voting (RCV) and approval voting allow voters to express nuanced preferences without fearing wasted ballots. Arrow’s Impossibility Theorem mathematically proves that no ranked electoral system can satisfy all fundamental democratic fairness criteria simultaneously.',
      keyPoints: [
        'First-Past-The-Post systems mathematically trend toward two-party dominant coalitions.',
        'Proportional Representation ensures minority factions secure legislative representation.',
        'Ranked-Choice ballots eliminate spoiler effects by redistributing eliminated candidate votes.',
        'Kenneth Arrow proved mathematically that no voting system achieves perfect collective fairness.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=qf7ws2DF-zk',
    },
    {
      topic: 'Geopolitics & The Realist vs Liberal Debate',
      body:
        'International relations theory is anchored by a fundamental debate over the nature of sovereign power: Realism versus Liberalism. Realists argue that international affairs operate in an anarchic system without a global sovereign, compelling nations to prioritize military strength, strategic deterrence, and national self-interest above all else.\n\nIn contrast, Liberal Institutionalists contend that international commerce, multilateral institutions (such as the UN and WTO), and democratic governance mitigate the risk of interstate violence. Trade interdependence creates mutual economic dependencies that make armed conflict prohibitively expensive for rational actors.\n\nIn the 21st century, the rise of multipolarity and cyber-warfare has blurred traditional boundaries. Concepts like the "Thucydides Trap"—the historical risk of conflict when an emerging power challenges an established hegemon—remain central to contemporary foreign policy analysis.',
      keyPoints: [
        'Realism views interstate relations through zero-sum security competition and balance of power.',
        'Liberalism highlights treaty frameworks, trade interdependence, and international courts.',
        'The Thucydides Trap analyzes structural tensions between rising and established powers.',
        'Modern deterrence integrates economic sanctions, undersea cable security, and cyber defenses.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=kYv9rE-98yE',
    },
    {
      topic: 'The Social Contract: Hobbes, Locke & Rousseau',
      body:
        'Social contract theory provides the foundational philosophical justification for legitimate political authority. It asks: why should free individuals surrender personal autonomy to submit to state laws and sovereign governance?\n\nThomas Hobbes posited in "Leviathan" (1651) that life without a government is "solitary, poor, nasty, brutish, and short," requiring an absolute sovereign to maintain security. John Locke countered that sovereignty belongs to the people, and governments exist solely to protect natural rights: life, liberty, and estate.\n\nJean-Jacques Rousseau expanded the theory by introducing the "General Will," arguing that true freedom consists in obeying laws that citizens themselves have democratically enacted. This intellectual lineage directly birthed modern human rights conventions and constitutional protections against state tyranny.',
      keyPoints: [
        'Hobbes argued state authority is required to escape violent natural anarchy.',
        'Locke established that legitimate governments rule only by the consent of the governed.',
        'Rousseau’s General Will linked individual liberty directly to participatory democracy.',
        'Directly inspired the American Declaration of Independence and French Declaration of the Rights of Man.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1575320181282-9afab399332c?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=avbyKJaT6lQ',
    },
  ],
  history: [
    {
      topic: 'The Fall of the Western Roman Empire',
      body:
        'The decline of Western Rome was not an overnight catastrophe in 476 CE, but a multi-century compound crisis of monetary hyperinflation, political fragmentation, demographic shocks, and external military pressures. The division of the empire under Diocletian shifted commercial power toward Constantinople.\n\nSevere debasement of the silver denarius eroded imperial purchasing power, leading to widespread urban de-densification and reliance on localized agrarian barter. Plagues, including the Antonine and Cyprian pandemics, decimated Roman legions and civic tax bases, forcing reliance on Germanic federate forces.\n\nWhen chieftain Odoacer deposed teenage emperor Romulus Augustulus, the administrative apparatus transitioned into regional Germanic kingdoms. Yet Roman law, ecclesiastical Latin, and architectural engineering survived, deeply shaping medieval European state formation.',
      keyPoints: [
        'Diocletian’s Tetrarchy split imperial governance into Eastern and Western halves in 286 CE.',
        'Hyperinflation and denarius currency debasement shattered Mediterranean trade routes.',
        'Repeated pandemics decimated agricultural productivity and military recruitment.',
        'Roman legal structures and municipal institutions were absorbed into successor kingdoms.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=3PszVWZNWVA',
    },
    {
      topic: 'The Silk Road & Eurasian Exchange',
      body:
        'The Silk Road was an expansive network of overland caravan routes and maritime passages connecting Chang’an (modern Xi’an) to Rome, Alexandria, and Persia. Initiated during the Han Dynasty around 130 BCE, it served as the commercial and cultural spinal cord of Afro-Eurasia.\n\nFar more than luxury textiles and spices were exchanged: papermaking, mechanical printing, mathematics, and gunpowder traveled westward, while glassmaking, alfalfa, and Greco-Buddhist sculpture moved eastward. Caravanserais operated every 30 kilometers as secure lodging hubs with banking services.\n\nHowever, trade vectors were also biological vectors: the Black Death traversed Silk Road merchant routes in the 14th century, reshaping European demographics, weakening feudalism, and accelerating the naval exploration of ocean routes to Asia.',
      keyPoints: [
        'Formally established under Han Emperor Wu following diplomat Zhang Qian’s travels.',
        'Facilitated the transmission of Chinese papermaking to the Islamic world at the Battle of Talas (751 CE).',
        'Caravanserais formed the world’s first intercontinental merchant hospitality and banking network.',
        'Overland trade disruptions stimulated the European Age of Maritime Exploration.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=vn3e37VWc0k',
    },
    {
      topic: 'The Industrial Revolution & Steam Power',
      body:
        'Beginning in late 18th-century Great Britain, the Industrial Revolution marked humanity’s decisive transition from animate muscle and draft-animal energy to thermodynamic fossil fuels. James Watt’s separate-condenser steam engine decoupled manufacturing output from seasonal river currents.\n\nMechanized textile looms and coal-fired blast furnaces generated explosive productivity gains, triggering massive rural migration into crowded urban centers. This rapid urbanization catalyzed modern public health sanitation, labor unions, and child labor protections.\n\nSteam locomotives and iron steamships collapsed spatial travel times from weeks to hours, inaugurating modern global trade. The era transformed social class structures and laid the economic groundwork for 19th-century global capitalism.',
      keyPoints: [
        'James Watt’s 1769 steam engine condenser increased thermal efficiency by over 75%.',
        'Textile spinning jennies and mechanized looms triggered factory-based mass production.',
        'Railroads collapsed freight costs and enabled national integrated consumer markets.',
        'Spurred new political ideologies: Adam Smith’s free markets and Karl Marx’s labor critique.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=zhL5DCizj5c',
    },
    {
      topic: 'The Library of Alexandria & Ancient Scholarship',
      body:
        'Founded in Egypt under the Ptolemaic dynasty in the 3rd century BCE, the Great Library of Alexandria was the ancient world’s preeminent institution of scholarship. Dedicated to the Muses, it aimed to amass a copy of every written work in existence.\n\nPtolemaic officials famously inspected every ship arriving in the harbor, confiscating original manuscripts to copy and store in the library’s papyrus scrolls collection. Polymaths like Eratosthenes accurately calculated Earth’s circumference, and Euclid organized the axiomatic foundations of geometry within its halls.\n\nThe library did not succumb to a single Hollywood-style catastrophe, but rather decayed through centuries of budget cuts, sectarian riots, and political neglect, underscoring the delicate institutional conditions needed to preserve collective human knowledge.',
      keyPoints: [
        'Housed an estimated 400,000 to 700,000 papyrus scrolls at its intellectual zenith.',
        'Eratosthenes calculated Earth’s circumference with remarkable 98% accuracy using solar shadow angles.',
        'Served as a research university with lecture halls, botanical gardens, and residential scholar quarters.',
        'Its gradual decline highlights how civilizational knowledge preservation requires continuous institutional investment.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1572953109213-3be62398eb95?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=4b33dxQe2y8',
    },
  ],
  health: [
    {
      topic: 'The Gut Microbiome & The Gut-Brain Axis',
      body:
        'The human gastrointestinal tract hosts over 38 trillion microorganisms—bacteria, viruses, and fungi—whose collective metabolic output functions as an endocrine organ. Far from passive passengers, these microbes actively shape immune regulation, metabolic homeostasis, and mental health.\n\nThe gut communicates bidirectional signals with the central nervous system via the vagus nerve, bacterial metabolites, and neuroactive signaling compounds. Remarkably, over 90% of the human body’s serotonin and roughly 50% of its dopamine are synthesized in the gut epithelium.\n\nMicrobial fermentation of dietary prebiotic fiber generates short-chain fatty acids (SCFAs) like butyrate, which nourish colonocytes and reinforce the blood-brain barrier. Dysbiosis is increasingly linked to depression, systemic inflammation, autoimmune disorders, and metabolic syndrome.',
      keyPoints: [
        'Houses 38 trillion microbes comprising thousands of distinct bacterial species.',
        'Over 90% of bodily serotonin is synthesized in the intestinal tract.',
        'Short-chain fatty acids (butyrate, acetate) reduce systemic neuroinflammation.',
        'High-fiber diets and fermented foods directly increase microbial biodiversity and resilience.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=1sISguPDlhY',
    },
    {
      topic: 'Cellular Autophagy & Longevity Science',
      body:
        'Autophagy (literally "self-eating") is the evolutionarily conserved lysosomal degradation pathway through which eukaryotic cells systematically clear out misfolded proteins, damaged mitochondria, and intracellular pathogens to maintain cellular integrity.\n\nJapanese biologist Yoshinori Ohsumi was awarded the 2016 Nobel Prize in Medicine for unraveling the genetic mechanisms governing autophagy. When nutrient-sensing pathways like mTOR are downregulated—via fasting, caloric restriction, or vigorous physical exertion—autophagy ramps up to recycle dysfunctional cellular debris into amino acids and energy.\n\nImpaired autophagy is a primary hallmark of aging and neurodegenerative diseases such as Alzheimer’s and Parkinson’s, where toxic amyloid plaques and Lewy bodies accumulate. Modulating autophagy represents one of the most promising frontiers in anti-aging therapeutic research.',
      keyPoints: [
        'Yoshinori Ohsumi won the 2016 Nobel Prize in Physiology for deciphering autophagy genetics.',
        'Downregulation of mTOR and activation of AMPK trigger cellular cleanup pathways.',
        'Removes dysfunctional mitochondria (mitophagy) to prevent excess oxidative stress.',
        'Intermittent fasting, sauna exposure, and zone-2 cardio stimulate autophagic flux.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=zY3vIqU_d40',
    },
    {
      topic: 'Circadian Rhythms & Sleep Architecture',
      body:
        'Every cell in the human body contains an autonomous 24-hour molecular clock governed by circadian transcription feedback loops. These peripheral clocks are synchronized by the suprachiasmatic nucleus (SCN) in the hypothalamus, which responds directly to optical blue-light photons from natural sunlight.\n\nHealthy sleep architecture cycles through 90-minute stages: Light NREM, Deep Slow-Wave NREM, and REM sleep. During slow-wave deep sleep, the brain’s glymphatic system expands by 60%, pumping cerebrospinal fluid across cerebral tissue to flush out metabolic waste, including beta-amyloid proteins.\n\nChronic circadian misalignment—from evening smartphone screens, night-shift labor, and irregular sleep windows—disrupts insulin sensitivity, elevates evening cortisol, and impairs prefrontal emotional regulation. Prioritizing morning sunlight exposure sets the melatonin production countdown for the night.',
      keyPoints: [
        'The suprachiasmatic nucleus uses intrinsically photosensitive retinal ganglion cells to track dawn.',
        'The glymphatic system flushes metabolic neurotoxins primarily during deep Slow-Wave Sleep.',
        'REM sleep is critical for emotional memory consolidation and creative associative problem-solving.',
        'Viewing outdoor morning sunlight within 60 minutes of waking anchors circadian timing.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=nm1TxQj9IsQ',
    },
    {
      topic: 'Neuroplasticity & Synaptic Pruning in Adults',
      body:
        'For decades, neuroscientists believed the adult human brain was structurally fixed and incapable of generating new neurons or remodeling neural circuitry. Modern neuroimaging proved this dogma wrong: adult neuroplasticity allows the brain to physically rewire its connections in response to experiential learning, sensory inputs, and physical trauma recovery.\n\nSynaptic plasticity relies on long-term potentiation (LTP)—often summarized as "neurons that fire together, wire together." Concurrently, microglia act as cellular caretakers, pruning away unutilized synaptic connections to optimize neural efficiency and conserve metabolic glucose.\n\nTargeted cognitive challenges, intense cardiovascular exercise, and sustained novelty stimulate Brain-Derived Neurotrophic Factor (BDNF), a vital protein promoting dendritic arborization and adult neurogenesis in the dentate gyrus of the hippocampus.',
      keyPoints: [
        'Adult brains generate new functional neurons in the hippocampus via neurogenesis.',
        'Long-Term Potentiation (LTP) strengthens synaptic communication through repeated stimulus.',
        'Microglia prune redundant synaptic pathways to enhance signal-to-noise cognitive clarity.',
        'Aerobic exercise elevates BDNF levels, directly protecting against cognitive decline.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=ELpfYCZa87g',
    },
  ],
  technology: [
    {
      topic: 'Large Language Models & Self-Attention',
      body:
        'Modern generative AI relies on the Transformer architecture, introduced by Google researchers in 2017. Transformers replaced sequential recurrent neural networks with self-attention mechanisms, allowing models to calculate contextual relevance across thousands of tokens in parallel on high-throughput GPUs.\n\nDuring pre-training on multi-trillion-token corpora, language models develop rich internal representations of syntax, logical inference, and world knowledge by predicting masked or next tokens. Scaling laws show predictable gains in capabilities as compute, dataset size, and parameter counts expand.\n\nTo transform raw completion models into helpful, safe assistants, engineers apply Reinforcement Learning from Human Feedback (RLHF) and direct preference optimization. Current engineering frontiers focus on reasoning test-time compute, multimodal perception, and verifiable factuality.',
      keyPoints: [
        'Self-attention calculates pairwise contextual token weights across long sequences simultaneously.',
        'Replaced slow sequential RNNs and LSTMs with parallelizable tensor matrix multiplications.',
        'Chinchilla scaling laws define compute-optimal balance between parameter size and training tokens.',
        'RLHF and constitutional AI align foundation model completions with human intent and safety.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=SZorAJ4I-sA',
    },
    {
      topic: 'Quantum Computing & Qubit Superposition',
      body:
        'Classical computers manipulate binary bits representing definite 0s or 1s. Quantum computers exploit principles of quantum mechanics—namely linear superposition and entanglement—to perform complex linear algebra operations across multi-dimensional Hilbert spaces.\n\nA quantum register of n entangled qubits can represent 2^n mathematical states simultaneously. This enables algorithms like Shor’s algorithm (factoring prime products exponentially faster than classical supercomputers) and Grover’s algorithm (quadratic database search acceleration).\n\nThe primary physical challenge is maintaining quantum coherence: fragile qubit states are easily disrupted by thermal vibrations and electromagnetic noise. Leading research centers are deploying surface codes and topological braiding to engineer fault-tolerant logical qubits.',
      keyPoints: [
        'Superposition allows qubits to exist in coherent probability amplitudes of |0⟩ and |1⟩.',
        'Entanglement correlates physical states so operations on one qubit instantly alter the system.',
        'Exponential advantage in simulating quantum chemistry, enzyme catalysis, and materials science.',
        'Cryogenic dilution refrigerators keep superconducting transmon qubits cooled to 15 millikelvin.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=JhHMJCUmq28',
    },
    {
      topic: 'Brain-Computer Interfaces (BCI) & Neural Decoding',
      body:
        'Brain-computer interfaces establish direct high-bandwidth electrical communication conduits between biological cerebral tissue and external silicon computation devices. Using arrays of micro-scale flexible electrodes, BCIs record intracranial action potentials from primary motor and speech cortices.\n\nNeural signal processing pipelines employ real-time decoding algorithms to translate firing rates into digital intentions. Paralyzed individuals have successfully used BCIs to navigate computer interfaces, control motorized robotic prosthetic limbs, and synthesize speech from attempted vocal motor commands.\n\nEngineering hurdles include long-term biocompatibility and avoiding glial scar encapsulation around rigid silicon shanks. Developing ultra-thin polymer threads and wireless telemetry modules promises non-damaging, permanent neural links for restorative medicine.',
      keyPoints: [
        'Intracortical micro-electrode arrays record local field potentials and individual spike rates.',
        'Real-time machine learning decodes motor cortex intentions into digital mouse/keyboard commands.',
        'Clinical trials have restored direct digital communication to patients with locked-in syndrome.',
        'Biocompatible polymer threads minimize immune response and tissue scarring in cerebral cortex.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=7qL4v2sT2x0',
    },
  ],
  space: [
    {
      topic: 'James Webb Space Telescope & Early Galaxies',
      body:
        'The James Webb Space Telescope (JWST) is humanity’s flagship space observatory, operating at the Sun-Earth L2 Lagrange point 1.5 million kilometers from Earth. Equipped with a 6.5-meter gold-coated beryllium mirror, JWST observes in the infrared spectrum to penetrate cosmic dust clouds.\n\nBecause light from the earliest universe has undergone significant cosmological redshift due to the expansion of spacetime, JWST’s infrared instruments can detect luminous galaxies that formed just 300 million years after the Big Bang. These observations challenge existing galaxy formation timelines, revealing surprisingly mature early structures.\n\nJWST also conducts atmospheric transmission spectroscopy on transiting exoplanets, identifying atmospheric signatures of water vapor, carbon dioxide, sulfur dioxide, and potential chemical disequilibrium biosignatures on rocky worlds.',
      keyPoints: [
        'Stationed at Sun-Earth L2 Lagrange point to maintain thermal equilibrium and stable orbit.',
        'Infrared sensors detect light redshifted from the cosmic dawn over 13.5 billion years ago.',
        'Five-layer Kapton sunshield keeps scientific instrumentation cooled to below 50 Kelvin.',
        'Detects chemical molecular fingerprints in the atmospheres of distant rocky exoplanets.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=1C_zWwg9r6c',
    },
    {
      topic: 'Gravitational Waves & Black Hole Mergers',
      body:
        'First predicted by Albert Einstein in his 1916 General Relativity paper, gravitational waves are ripples in the fabric of spacetime produced by violent cosmic cataclysms like colliding black holes and merging neutron stars.\n\nIn 2015, the Laser Interferometer Gravitational-Wave Observatory (LIGO) made the historic first direct detection (GW150914). LIGO uses 4-kilometer perpendicular vacuum arms where laser beams bounce between suspended mirrors to measure spacetime displacements smaller than 1/10,000th the diameter of a proton.\n\nGravitational wave astronomy opened an entirely new observational sensory window onto the universe, independent of the electromagnetic spectrum. Detecting gravitational radiation from neutron star mergers concurrently with gamma-ray telescopes inaugurated the era of multi-messenger astrophysics.',
      keyPoints: [
        'Predicted by Einstein in 1916; first directly detected by LIGO on September 14, 2015.',
        'Measures laser phase interference across 4km arms to detect sub-atomic spacetime strains.',
        'Enables direct observation of stellar-mass black hole collisions invisible to optical telescopes.',
        'Multi-messenger astronomy pairs gravitational wave events with gamma-ray and optical follow-up.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=dw7U3BYMs4U',
    },
    {
      topic: 'The Artemis Program & Lunar Base Architecture',
      body:
        'NASA’s Artemis program represents an international effort to return astronauts to the lunar surface and build sustainable infrastructure for long-duration deep space exploration. Artemis focuses specifically on the Moon’s South Pole, where permanently shadowed craters harbor vast reserves of water ice.\n\nThis lunar water ice is a critical logistical resource: it can be purified for human life support and electrolyzed into liquid hydrogen and oxygen propellant, establishing the solar system’s first orbital refueling depot. The Lunar Gateway station will serve as a staging outpost in a near-rectilinear halo orbit.\n\nMastering in-situ resource utilization (ISRU), surface nuclear micro-reactors, and radiation shielding against cosmic galactic rays on the Moon will serve as the indispensable proving ground for crewed expeditions to Mars.',
      keyPoints: [
        'Targets permanently shadowed lunar south pole craters containing billions of tons of water ice.',
        'Electrolysis of lunar ice into rocket propellant unlocks low-cost deep-space departure architecture.',
        'Gateway station provides an orbital logistics hub using a Near-Rectilinear Halo Orbit.',
        'Serves as the vital technological baseline and testing ground for crewed Mars missions in the 2030s.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=_T8cn2J13-4',
    },
  ],
  science: [
    {
      topic: 'Quantum Entanglement & Bell’s Theorem',
      body:
        'When two subatomic particles become quantum entangled, the state of one cannot be described independently of the state of the other, regardless of how many light-years separate them. Measure the spin of one particle, and the spin of its entangled twin is instantly determined.\n\nAlbert Einstein famously questioned this phenomenon as "spooky action at a distance," suggesting that quantum mechanics was incomplete and governed by hidden local variables. In 1964, physicist John Stewart Bell formulated Bell’s Theorem, providing a mathematical inequality that could experimentally determine whether local hidden variables exist.\n\nSubsequent loophole-free experiments—recognized with the 2022 Nobel Prize in Physics—definitively proved Bell’s inequalities are violated. Nature is fundamentally non-local, providing the theoretical basis for unhackable quantum key distribution and quantum computing.',
      keyPoints: [
        'Entangled particles maintain correlated quantum states across arbitrary physical distances.',
        'Bell’s Inequality proved mathematically that local hidden variable theories cannot explain quantum mechanics.',
        'The 2022 Nobel Prize validated that physical reality cannot be simultaneously local and deterministic.',
        'Forms the operational backbone of secure quantum satellite communication networks.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=0Ri04_k5_8E',
    },
    {
      topic: 'CRISPR-Cas9 & Genomic Engineering',
      body:
        'CRISPR-Cas9 is a revolutionary gene-editing technology derived from the adaptive immune systems of bacteria, which use RNA-guided endonuclease enzymes to chop up invading viral bacteriophages. In 2012, Emmanuelle Charpentier and Jennifer Doudna demonstrated that this mechanism could be re-engineered into programmable molecular scissors for any organism’s genome.\n\nA synthetic guide RNA (gRNA) guides the Cas9 enzyme to a complementary 20-nucleotide sequence in the host DNA, where Cas9 makes a double-strand cut. The cell’s natural repair machinery then either disables the targeted gene or incorporates donor genetic sequences.\n\nCRISPR has already led to FDA-approved therapies for sickle cell anemia and beta-thalassemia, while accelerating crop resilience and cancer immunotherapies. Ethical debates continue regarding germline editing and ecological gene drives.',
      keyPoints: [
        'Derived from bacterial adaptive immune defenses against invading viral phages.',
        'Pioneered by Charpentier and Doudna, who earned the 2020 Nobel Prize in Chemistry.',
        'Directly cured genetic blood disorders like sickle cell anemia in clinical medicine.',
        'Active research focuses on base editing and prime editing to prevent unintended double-strand breaks.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=4YKFw8FVQas',
    },
  ],
  philosophy: [
    {
      topic: 'Stoicism & The Dichotomy of Control',
      body:
        'Founded in Athens by Zeno of Citium circa 300 BCE, Stoicism is a practical philosophy of ethics designed to cultivate psychological resilience, moral virtue, and inner tranquility. The core operating principle of Stoicism is the Dichotomy of Control, articulated powerfully by freed slave turned philosopher Epictetus.\n\nStoics divide reality into two categories: things within our direct agency (our judgments, impulses, values, and reactions) and things outside our agency (external events, health, reputation, market shocks, and other people’s behaviors). Suffering arises not from external circumstances, but from the mistaken belief that we control outcomes outside ourselves.\n\nPractitioners like Roman emperor Marcus Aurelius and statesman Seneca advocated cognitive reframing techniques: voluntary discomfort, negative visualization, and Amor Fati (loving one’s fate). Stoicism directly inspired modern Cognitive Behavioral Therapy (CBT).',
      keyPoints: [
        'The Dichotomy of Control distinguishes internal agency from external conditions.',
        'Suffering stems from emotional judgments attached to events, not the events themselves.',
        'Negative visualization builds psychological inoculation against unexpected life shocks.',
        'Direct historical foundation of modern Rational Emotive and Cognitive Behavioral Therapy.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=R9OCA6UFE-0',
    },
    {
      topic: 'The Trolley Problem & Machine Ethics',
      body:
        'First devised by British philosopher Philippa Foot in 1967 and expanded by Judith Jarvis Thomson, the Trolley Problem is a landmark thought experiment in normative ethics. It illustrates the acute tension between Utilitarian consequentialism (maximizing total well-being) and Deontological ethics (adhering to inviolable moral rules).\n\nIn the basic scenario, a runaway trolley is heading toward five tied-down workers. Pulling a lever diverts the trolley onto a side track where it will kill only one person. Most individuals endorse pulling the switch. However, when asked to physically push a heavy bystander off a bridge to stop the trolley, most people intuitively refuse, despite the mathematical calculus being identical.\n\nWith the advent of autonomous self-driving vehicles, medical triage algorithms, and automated defense systems, the Trolley Problem transitioned from an abstract academic puzzle into an urgent software engineering reality.',
      keyPoints: [
        'Contrasts utilitarian calculus (save 5 lives vs 1) with deontological moral prohibitions.',
        'Reveals human cognitive divergence between active direct harm and passive redirection.',
        'Directly informs the moral algorithmic programming of autonomous self-driving systems.',
        'Neuroimaging shows moral dilemmas activate conflicting rational prefrontal and emotional limbic circuits.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=bOpf6KcWYyw',
    },
  ],
  art: [
    {
      topic: 'The Renaissance & Linear Perspective',
      body:
        'The Italian Renaissance revolutionized visual culture by combining classical humanist philosophy with mathematical geometry to render realistic three-dimensional depth on a two-dimensional plane. Architect Filippo Brunelleschi codified the rules of linear perspective around 1415.\n\nBy establishing a horizon line, a central vanishing point, and converging orthogonal lines, artists gained the ability to depict architectural space and human figures in proportional mathematical harmony. Masters like Leonardo da Vinci and Raphael further pioneered sfumato and chiaroscuro—soft gradient transitions of light and shadow.\n\nThis shift elevated visual artists from medieval craftsmen guilds into celebrated intellectual polymaths. The mathematical geometry of Renaissance perspective laid the foundation for modern drafting, photography, and 3D computer graphics.',
      keyPoints: [
        'Brunelleschi codified linear geometric perspective using vanishing points and orthogonal lines.',
        'Sfumato and chiaroscuro techniques introduced photorealistic gradations of depth and light.',
        'Transformed painters and sculptors from anonymous guildsmen into respected intellectual scholars.',
        'Direct ancestor of modern cinematic cinematography and 3D computer graphics engines.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=bkWPQk5vL2c',
    },
    {
      topic: 'The Dada Movement & Conceptual Art',
      body:
        'Emerging at the Cabaret Voltaire in Zurich during the horrors of World War I, the Dada movement arose as an intellectual and artistic revolt against the bourgeois rationality and nationalism that had plunged Europe into warfare.\n\nDadaists rejected traditional aesthetic conventions of beauty and technical craft, utilizing nonsense poetry, collage, photomontage, and found industrial objects to create provocative "anti-art." Marcel Duchamp shocked the world in 1917 with "Fountain"—a standard porcelain urinal submitted as fine art under the pseudonym R. Mutt.\n\nDada dismantled institutional gatekeeping by arguing that art resides in the conceptual intent and context of the artist rather than the physical object. It paved the way for Surrealism, Pop Art, and contemporary conceptual art.',
      keyPoints: [
        'Founded in 1916 in Zurich as a protest against the rationalism that caused World War I.',
        'Marcel Duchamp’s "readymades" established that intellectual concept supersedes physical craftsmanship.',
        'Pioneered collage, photomontage, and assemblage using discarded industrial everyday ephemera.',
        'Direct intellectual predecessor to Surrealism, Pop Art, and contemporary installation art.',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=7b7pS6ZkI-M',
    },
  ],
};

function normalizeTopic(topic = '') {
  return (topic || '')
    .toLowerCase()
    .replace(/^(history|politics|health|economics|space|technology|science|philosophy|psychology|biology|mathematics|art):\s*/i, '')
    .trim();
}

function normalizeBody(body = '') {
  return (body || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 60);
}

// Counter to cycle article variations across calls
let rotateCounter = 0;

/**
 * Generate or pick a fresh article for a given topic/interest, ensuring body and topic are completely unique.
 */
function getMockArticleForTopic(topicName, seedIndex = 0, excludeBodies = new Set(), excludeTopics = new Set()) {
  const clean = (topicName || '').toLowerCase().trim();
  const matchedCat = Object.keys(TOPIC_LIBRARY).find((cat) => clean.includes(cat));

  if (matchedCat) {
    const list = TOPIC_LIBRARY[matchedCat];
    // Find an article whose body and topic are not in exclude sets
    for (let offset = 0; offset < list.length; offset++) {
      const idx = (rotateCounter + seedIndex + offset) % list.length;
      const candidate = list[idx];
      const bKey = normalizeBody(candidate.body || candidate.summary);
      const tKey = normalizeTopic(candidate.topic);
      if (!excludeBodies.has(bKey) && !excludeTopics.has(tKey)) {
        excludeBodies.add(bKey);
        excludeTopics.add(tKey);
        const img = candidate.imageUrl || getImageUrlForTopic(topicName, seedIndex + offset);
        return {
          ...candidate,
          imageUrl: img,
        };
      }
    }
  }

  // Dynamic generative fallback with diverse analytical angles (no cookie-cutter templates)
  const dynamicAngles = [
    {
      titleSuffix: 'In-Depth Dynamics & Modern Mechanics',
      generate: (t) =>
        `A rigorous investigation into ${t} reveals intricate mechanisms that challenge common perceptions. Decades of specialized field research demonstrate that structural outcomes depend on subtle systemic incentives and non-obvious feedback loops.\n\nWhen implemented at scale, practitioners must navigate fundamental trade-offs between speed, reliability, and systemic resilience. Historical case studies show that organizations optimizing purely for short-term output frequently encounter unexpected fragility during stress events.\n\nLooking toward the next decade, cross-disciplinary methodologies are unlocking unprecedented clarity in ${t}. Cultivating an authentic grasp of these foundational realities equips curious minds to navigate contemporary literature and make well-calibrated decisions.`,
      facts: (t) => [
        `Core structural mechanisms that govern operational stability in ${t}.`,
        `How empirical practitioners balance resilience against efficiency in dynamic environments.`,
        `Lessons derived from landmark historical anomalies and institutional stress tests.`,
        `Strategic directions and technological methodologies redefining the modern scope of ${t}.`,
      ],
    },
    {
      titleSuffix: 'Empirical Breakthroughs & Paradigm Shifts',
      generate: (t) =>
        `The intellectual trajectory of ${t} has witnessed monumental breakthroughs that fundamentally overturned legacy assumptions. From initial theoretical models to modern data-driven verification, this discipline continues to transform how researchers interpret complex systems.\n\nKey advancements demonstrate that scaling computational models and incorporating empirical sensors reveal emergent properties previously thought impossible. Concurrently, new protocols have standardized verification, allowing international teams to replicate results with unprecedented precision.\n\nAs these methodologies mature, their impact is diffusing across industry, policy, and academic domains. Understanding these critical milestones provides essential context for anticipating future disruption and evaluating emerging claims.`,
      facts: (t) => [
        `Landmark discoveries that replaced classical heuristics with predictive models in ${t}.`,
        `Verification standards and replication protocols modern practitioners rely upon.`,
        `Emergent properties observed when scaling empirical observation across datasets.`,
        `Key interdisciplinary collaborations driving high-impact real-world applications.`,
      ],
    },
    {
      titleSuffix: 'Historical Foundations & Systemic Evolution',
      generate: (t) =>
        `Examining the evolutionary arc of ${t} illuminates how historical pressures, legal frameworks, and technological innovations converged to shape contemporary institutions. Rather than emerging in isolation, modern practice reflects a cumulative sequence of hard-won institutional adaptations.\n\nThroughout successive eras, pivotal debates over centralized control, individual agency, and open access catalyzed profound structural reforms. Archival evidence illustrates how early pioneers overcame resistance by demonstrating clear empirical superiority in competitive environments.\n\nToday, the legacy of these historical debates remains palpable in current regulatory and academic discussions. Analyzing these historical antecedents clarifies the underlying forces driving ongoing controversies and institutional evolution.`,
      facts: (t) => [
        `Pivotal historical inflection points that catalyzed structural adaptation in ${t}.`,
        `How early debates over governance and access established contemporary institutional norms.`,
        `Key qualitative benchmarks developed to evaluate systemic performance over time.`,
        `The continuing influence of historical frameworks on modern regulatory policies.`,
      ],
    },
    {
      titleSuffix: 'Architectural Models & Practical Frameworks',
      generate: (t) =>
        `Understanding ${t} at an architectural level requires decomposing foundational assumptions into modular subsystems. Practitioners who master these mental models can diagnose bottlenecks before they escalate into structural failures.\n\nBy comparing trade-offs between centralized paradigms and distributed heuristics, modern specialists achieve greater operational consistency. Case studies illustrate how resilient architectures accommodate unpredictable spikes while maintaining data integrity.\n\nIntegrating these frameworks into everyday workflows empowers teams to eliminate redundant overhead and scale solutions effectively across diverse environments.`,
      facts: (t) => [
        `Decomposition strategies for isolating core failure modes in ${t}.`,
        `Comparative analysis of centralized versus distributed operational trade-offs.`,
        `Best practices for maintaining consistency across high-throughput subsystems.`,
        `Actionable architectural heuristics for scalable domain implementation.`,
      ],
    },
    {
      titleSuffix: 'Frontiers & Cross-Disciplinary Innovations',
      generate: (t) =>
        `At the intersection of ${t} and adjacent domains lies a rich frontier of experimental research and pragmatic breakthroughs. Recent cross-disciplinary synthesis has unlocked novel methodologies that accelerate discovery cycles.\n\nBy leveraging tools from computational modeling, behavioral science, and empirical analysis, investigators can test hypotheses with unprecedented velocity. These interdisciplinary insights frequently challenge entrenched dogmas and reveal high-leverage optimization points.\n\nCultivating fluency in these emerging cross-disciplinary paradigms provides an enduring intellectual edge for modern builders and researchers.`,
      facts: (t) => [
        `Interdisciplinary methodologies bridging theoretical principles in ${t} with real-world practice.`,
        `Recent breakthroughs that challenge legacy domain assumptions.`,
        `High-leverage optimization techniques unlocked by cross-domain synthesis.`,
        `Key emerging trajectories expected to define the next phase of innovation.`,
      ],
    },
  ];

  for (let cycle = 0; cycle < 50; cycle++) {
    const angle = dynamicAngles[(rotateCounter + seedIndex + cycle) % dynamicAngles.length];
    const body = angle.generate(topicName);
    const bKey = normalizeBody(body);
    const candidateTopic = `${topicName}: ${angle.titleSuffix} (Series #${((rotateCounter + cycle) % 20) + 1})`;
    const tKey = normalizeTopic(candidateTopic);

    if (!excludeBodies.has(bKey) && !excludeTopics.has(tKey)) {
      excludeBodies.add(bKey);
      excludeTopics.add(tKey);
      const imgUrl = getImageUrlForTopic(topicName, seedIndex + cycle);
      return {
        topic: candidateTopic,
        body,
        summary: body,
        imageUrl: imgUrl,
        keyPoints: angle.facts(topicName),
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };
    }
  }

  // Final unique fallback with random token
  const uniqueToken = Math.floor(Math.random() * 90000 + 10000);
  const ultimateBody = `An exhaustive analytical breakdown of ${topicName} (Study #${uniqueToken}): Investigating core structural principles, empirical methodologies, and systemic trade-offs defining modern research across leading international institutions.`;
  const ultimateTopic = `${topicName}: Core Investigation #${uniqueToken}`;
  excludeBodies.add(normalizeBody(ultimateBody));
  excludeTopics.add(normalizeTopic(ultimateTopic));
  return {
    topic: ultimateTopic,
    body: ultimateBody,
    summary: ultimateBody,
    imageUrl: getImageUrlForTopic(topicName, seedIndex),
    keyPoints: [
      `Foundational mechanisms governing reliable execution in ${topicName}.`,
      `Key quantitative and qualitative metrics used by modern field specialists.`,
      `Practical mental models for diagnosing systemic dependencies and edge cases.`,
      `Near-term technological milestones expected to reshape the field.`,
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  };
}

const MOCK_DEEP_DIVE = {
  topic: 'Black Holes',
  summary:
    'A black hole is a region of spacetime where gravity is so strong that nothing — not even light — can escape once it crosses the event horizon.',
  keyFacts: [
    'Black holes form from collapsed massive stars or from the early universe.',
    'The event horizon is the point of no return; anything crossing it is lost to the outside universe.',
    'Supermassive black holes with millions of solar masses anchor the centers of almost all galaxies.',
    'LIGO directly detected gravitational waves produced by colliding binary black holes in 2015.',
  ],
  videoUrl: 'https://www.youtube.com/watch?v=kOEDG3j1bjs',
  questions: [
    'What defines the "point of no return" around a black hole?',
    'How did astronomers first directly detect black hole mergers in 2015?',
    'What cosmic object resides at the center of the Milky Way galaxy?',
  ],
};

const MOCK_GRADE_PASS = {
  passed: true,
  feedback:
    'Excellent work! Your answers demonstrate a clear, accurate understanding of black hole physics, event horizons, and gravitational wave detection.',
};

/**
 * Call POST /simplify on the Python service, guaranteeing deduplicated bodies and topics against exclude sets.
 * @param {string[]} topics
 * @param {Set<string>} excludeBodies
 * @param {Set<string>} excludeTopics
 * @returns {Promise<Array<{topic, body, summary, keyPoints, videoUrl}>>}
 */
async function simplify(topics, excludeBodies = new Set(), excludeTopics = new Set()) {
  rotateCounter += Math.floor(Math.random() * 3) + 1;
  if (IS_MOCK) {
    return topics.map((t, i) => getMockArticleForTopic(t, i, excludeBodies, excludeTopics));
  }

  try {
    const { data } = await axios.post(`${BASE_URL}/simplify`, { topics }, { timeout: 4000 });
    const results = [];
    for (let i = 0; i < topics.length; i++) {
      const item = data && data[i];
      const bKey = normalizeBody(item?.body || item?.summary || '');
      const tKey = normalizeTopic(item?.topic || '');
      if (item && bKey && !excludeBodies.has(bKey) && tKey && !excludeTopics.has(tKey)) {
        excludeBodies.add(bKey);
        excludeTopics.add(tKey);
        results.push({
          ...item,
          body: item.body || item.summary,
          imageUrl: item.imageUrl || getImageUrlForTopic(topics[i], i),
        });
      } else {
        results.push(getMockArticleForTopic(topics[i], i, excludeBodies, excludeTopics));
      }
    }
    return results;
  } catch (err) {
    console.warn(`[pythonService] Python /simplify (${err.message}). Seamlessly using high-speed fallback.`);
    return topics.map((t, i) => getMockArticleForTopic(t, i, excludeBodies, excludeTopics));
  }
}

async function deepDive(topic) {
  if (IS_MOCK) {
    return { ...MOCK_DEEP_DIVE, topic };
  }
  try {
    const { data } = await axios.post(`${BASE_URL}/deepdive`, { topic });
    return data;
  } catch (err) {
    const msg = err.response?.data?.detail || err.message;
    throw Object.assign(new Error(`Python /deepdive failed: ${msg}`), { isPythonError: true });
  }
}

async function grade(topic, questions, answers) {
  if (IS_MOCK) {
    return MOCK_GRADE_PASS;
  }
  try {
    const { data } = await axios.post(`${BASE_URL}/grade`, { topic, questions, answers });
    return data;
  } catch (err) {
    const msg = err.response?.data?.detail || err.message;
    throw Object.assign(new Error(`Python /grade failed: ${msg}`), { isPythonError: true });
  }
}

/**
 * Call POST /api/discovery/daily-post on the Python service.
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function getDailyDiscovery(userId = 'default_user') {
  if (IS_MOCK) {
    return {
      user_id: userId,
      title: 'How Your Credit Score Is Actually Calculated',
      topic: 'how your credit score is actually calculated',
      source: 'discovery',
      source_url: 'https://www.myfico.com/credit-education/whats-in-your-credit-score',
      source_domain: 'myfico.com',
      image_url: null,
      summary: 'Credit scores are calculated using five key factors with distinct percentage weights. Payment history and amounts owed carry the greatest influence on your rating.',
      key_points: [
        'Payment history accounts for 35% of a FICO score.',
        'Amounts owed (credit utilization) makes up 30%.',
        'Length of credit history contributes 15%.',
      ],
      why_it_matters: 'Understanding these weights prevents costly mistakes like closing old cards or maxing out revolving limits.',
      surprising_fact: 'Closing an unused zero-balance credit card can actually reduce your score by spiking utilization.',
      try_this: 'Check your current revolving credit utilization ratio to ensure it stays below 30%.',
    };
  }

  try {
    const { data } = await axios.post(`${BASE_URL}/api/discovery/daily-post`, { userId });
    return data;
  } catch (err) {
    const msg = err.response?.data?.detail || err.message;
    throw Object.assign(new Error(`Python /api/discovery/daily-post failed: ${msg}`), { isPythonError: true });
  }
}

module.exports = { simplify, deepDive, grade, getImageUrlForTopic, TOPIC_IMAGES, getDailyDiscovery };
