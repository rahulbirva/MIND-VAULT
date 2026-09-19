/**
 * discoveryRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET  /api/discovery            — Proactive practical discovery feed outside user's interests
 * POST /api/discover-law         — Mental Model Discovery Engine (anchored to user context)
 * POST /api/discovery/daily-post — Autonomous daily discovery synthesizer
 */

const router = require('express').Router();
const User = require('../models/User');
const FeedItem = require('../models/FeedItem');
const pythonService = require('../services/pythonService');

function normalizeTopic(topic = '') {
  return (topic || '')
    .toLowerCase()
    .replace(/^(history|politics|health|economics|space|technology|science|philosophy|psychology|biology|mathematics|art|rights|finance|safety|tech|engineering):\s*/i, '')
    .trim();
}

function normalizeBody(body = '') {
  return (body || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 60);
}

// ── Practical Daily Life & Serendipitous Discovery Knowledge Pool ─────────────
const PRACTICAL_DISCOVERY_KNOWLEDGE = [
  // ── Personal Finance & Daily Wealth ──
  {
    topic: 'How Your Credit Score Is Actually Calculated',
    category: 'Finance',
    relatedInterests: ['economics', 'business', 'finance'],
    body:
      'Credit scores in modern economies are calculated using five primary factors with distinct percentage weights. Payment history carries the single largest impact at 35%, while credit utilization (the percentage of revolving credit used) makes up 30%. The length of your credit history contributes 15%, new credit inquiries 10%, and credit mix 10%.\n\nOne of the most counter-intuitive dynamics is credit utilization timing: credit bureaus evaluate the balance reported on your monthly statement date, not your due date. Even if you pay your bill in full every month, reporting a balance higher than 30% of your limit will actively depress your score.\n\nTo optimize your rating, maintain revolving utilization under 10%, keep older credit lines open even if unused to protect your average account age, and set automatic micro-payments five days before each billing cycle closes.',
    keyPoints: [
      'Payment history (35%) and utilization ratio (30%) drive 65% of your total score.',
      'Closing an old zero-balance credit card often hurts your score by reducing credit age and total limit.',
      'Credit card balances are reported on statement closing dates, not payment due dates.',
      'Keeping credit utilization below 10% unlocks tier-1 interest rates for mortgages and auto loans.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=0kH30_k0-sQ',
  },
  {
    topic: 'High-Yield Savings & The Rule of 72',
    category: 'Finance',
    relatedInterests: ['economics', 'business', 'finance'],
    body:
      'Traditional brick-and-mortar commercial banks typically pay 0.01% APY on standard savings accounts, meaning an inflation rate of 3% systematically destroys your purchasing power. High-Yield Savings Accounts (HYSAs) provided by FDIC-insured digital institutions pay 4% to 5% APY because they avoid retail real estate overhead.\n\nThe Rule of 72 provides an intuitive mental shortcut to calculate compound growth: divide the number 72 by your annual interest rate to find roughly how many years it takes for your money to double. At a 0.01% traditional bank rate, your money takes 7,200 years to double; at a 5% HYSA rate, it doubles in roughly 14.4 years.\n\nPairing a 3-to-6-month liquid emergency reserve in an HYSA with automated deposit splits protects households against unexpected medical expenses or vehicle repairs without forcing high-interest debt.',
    keyPoints: [
      'Divide 72 by the annual interest percentage to estimate doubling time in years.',
      'Traditional bank savings at 0.01% result in rapid negative real returns after inflation.',
      'HYSAs are FDIC-insured up to $250,000 per depositor while offering zero market risk.',
      'Automated deposit splits ensure savings happen before discretionary spending begins.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=1T4oWb7wF9I',
  },
  {
    topic: 'Tax Brackets: Why Earning More Never Decreases Net Pay',
    category: 'Finance',
    relatedInterests: ['economics', 'politics', 'finance'],
    body:
      'A persistent public misconception is that crossing into a higher tax bracket reduces total take-home pay because "all income gets taxed at the higher rate." Progressive income tax systems operate on marginal tax brackets, meaning each tax rate applies only to income earned within that specific threshold.\n\nFor example, if the 12% bracket caps at $44,725 and the 22% bracket begins at $44,726, earning $45,000 means only the final $274 is taxed at 22%. The preceding $44,725 is taxed at the lower statutory rates of 10% and 12%.\n\nUnderstanding marginal rates empowers workers to accept raises, overtime pay, and promotions without fear of net loss, while focusing on pre-tax deductions like 401(k) contributions and HSAs to lower top-tier marginal exposure.',
    keyPoints: [
      'Marginal tax rates apply strictly to dollars earned within each incremental tier.',
      'Crossing into a higher bracket can never cause overall net income to decline.',
      'Pre-tax contributions (401k, IRA, HSA) directly lower income from your highest marginal bracket.',
      'Standard deductions shield the initial baseline threshold of income completely tax-free.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=VJhsjLqISiU',
  },

  // ── Rights, Consumer Law & Everyday Civics ──
  {
    topic: 'Tenant Rights: Security Deposits & Illegal Evictions',
    category: 'Rights & Law',
    relatedInterests: ['politics', 'law', 'government'],
    body:
      'Tenants in residential leases possess statutory legal rights that landlords cannot override through custom lease clauses. Across most jurisdictions, landlords must return security deposits within 14 to 30 days of move-out alongside an itemized receipt for any deductions, which cannot legally cover normal wear and tear.\n\n"Self-help evictions"—such as changing door locks, cutting utility power, or removing tenant belongings without a judicial court order—are strictly illegal and entitle tenants to substantial statutory damages. Furthermore, the Implied Warranty of Habitability mandates working heat, clean water, and structural security.\n\nTo safeguard your deposit, conduct a timestamped video walkthrough before moving in and immediately after cleaning upon departure, documenting every minor pre-existing scuff, tile crack, and fixture condition.',
    keyPoints: [
      'Security deposits cannot legally be deducted for ordinary, routine wear and tear.',
      'Landlords changing locks or cutting utilities commit illegal self-help eviction.',
      'The Implied Warranty of Habitability guarantees essential heat, plumbing, and structural integrity.',
      'Timestamped move-in and move-out video recordings provide conclusive small claims evidence.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=S2u7E-p5bT8',
  },
  {
    topic: 'Traffic Stop Protocols: 5th Amendment Rights & Police Authority',
    category: 'Rights & Law',
    relatedInterests: ['politics', 'law', 'government'],
    body:
      'During a lawful traffic stop, drivers are required to provide their driver\'s license, vehicle registration, and proof of insurance upon request. However, citizens maintain clear constitutional protections under the 4th and 5th Amendments.\n\nYou have the constitutional right to remain silent regarding questions such as "Where are you coming from?" or "How fast do you think you were going?" Answering conversational inquiries often creates unintentional self-incrimination that officers record as evidence.\n\nCrucially, police cannot search your vehicle without probable cause, a valid warrant, or your explicit consent. Politely and clearly stating "Officer, I do not consent to any searches" preserves your legal defense if an unlawful search occurs.',
    keyPoints: [
      'Drivers must provide license, registration, and insurance, but are not required to answer interrogative questions.',
      'Politely invoke the 5th Amendment: "I am choosing to exercise my right to remain silent."',
      'Explicitly state: "I do not consent to any searches of my vehicle or person."',
      'You have the legal right to record police interactions in public spaces from a safe distance.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=s4nQ_mFJV4I',
  },
  {
    topic: 'Airline Passenger Rights: Mandatory Cash Compensation for Delays',
    category: 'Rights & Law',
    relatedInterests: ['politics', 'law', 'travel'],
    body:
      'When commercial airline flights are severely delayed, cancelled, or overbooked, passengers possess substantial legal compensation rights that airlines rarely advertise voluntarily. Under European Union Regulation EC 261 (and UK equivalent), delays over three hours entitle travelers to between €250 and €600 in direct cash compensation, regardless of ticket cost.\n\nIn the United States, if an airline involuntarily bumps you from an overbooked flight, Department of Transportation regulations mandate compensation up to 400% of your one-way fare (capped at $1,550), payable in cash or check immediately at the airport.\n\nAirlines frequently attempt to offer expiring travel vouchers or miles instead of cash. Travelers who know their statutory rights can decline vouchers and demand immediate cash compensation via bank wire or physical check.',
    keyPoints: [
      'EU Regulation 261 mandates up to €600 cash compensation for flight delays exceeding 3 hours.',
      'Involuntary denied boarding in the US requires cash compensation up to 400% of one-way fare.',
      'Airlines are legally required to refund the ticket price to original payment methods upon cancellation.',
      'Do not accept flight vouchers until checking if you are legally entitled to direct cash.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=a1_W_zE3xYk',
  },

  // ── First Aid, Emergency Protocol & Daily Safety ──
  {
    topic: 'The Heimlich Maneuver: Emergency Choking Response',
    category: 'Safety',
    relatedInterests: ['health', 'biology', 'medicine'],
    body:
      'Choking is a rapid medical emergency that deprives the brain of oxygen within three to four minutes. When someone cannot speak, cough, or breathe and clutches their throat, immediate intervention with the Heimlich maneuver (subdiaphragmatic abdominal thrusts) is vital.\n\nStand behind the victim, wrap your arms around their waist, make a fist with one hand placed thumb-side inward just above their navel (well below the xiphoid process), grasp the fist with your other hand, and deliver quick, inward-and-upward thrusts.\n\nIf you are choking alone, you can perform self-thrusts: place your fist above your navel, grasp it with your other hand, and forcefully thrust inward and upward, or lean hard over the back of a sturdy chair to dislodge the obstruction.',
    keyPoints: [
      'Position your fist thumb-side in, directly above the navel and below the rib cage.',
      'Deliver sharp, distinct inward-and-upward thrusts to compress the diaphragm.',
      'If alone, thrust against the back of a rigid chair or table edge.',
      'If the person loses consciousness, immediately begin chest compressions and call emergency services.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=7CgtgB-Qk90',
  },
  {
    topic: 'First Aid: Burn Classifications & What Never To Put on Burns',
    category: 'Safety',
    relatedInterests: ['health', 'biology', 'medicine'],
    body:
      'Burns are classified into three degrees: first-degree (epidermis redness, e.g., mild sunburn), second-degree (dermis involvement with painful blistering), and third-degree (full thickness damage with leathery white or charred skin requiring emergency surgery).\n\nThe most critical emergency intervention for first and minor second-degree burns is holding the injured area under cool, gently running tap water for 10 to 20 minutes. This arrests thermal tissue damage before deeper cell necrosis occurs.\n\nCommon folk remedies—such as applying ice, butter, toothpaste, or oil—cause severe harm. Ice induces vasoconstriction that worsens tissue ischemia, while fats and oils trap heat inside the burn and cultivate severe bacterial infections.',
    keyPoints: [
      'Immediately cool burns under gently flowing cool water for 10 to 20 minutes.',
      'Never apply ice, butter, toothpaste, or petroleum jelly: they trap heat and cause infection.',
      'Do not pop intact blisters: the blister roof serves as a sterile biological bandage.',
      'Seek immediate emergency care for burns covering joints, hands, face, or third-degree charring.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=0k3Pq_x8aQ4',
  },
  {
    topic: 'The PASS Method: How to Correctly Discharge a Fire Extinguisher',
    category: 'Safety',
    relatedInterests: ['science', 'safety', 'engineering'],
    body:
      'In a sudden kitchen or household fire, panic often leads people to spray extinguisher nozzles into the center of flames, which does not stop the chemical combustion reaction. Fire safety professionals standardize response through the acronym PASS.\n\nP: Pull the safety pin at the top of the extinguisher. A: Aim the nozzle low, pointing directly at the base of the fire where fuel is burning. S: Squeeze the handle lever steadily. S: Sweep the nozzle from side to side across the base until flames are fully extinguished.\n\nCrucially, never throw water on a kitchen grease or electrical fire: water sinks in hot oil, instantly superheats into steam, and aerosolizes boiling grease into a devastating fireball. Use a Class B/K extinguisher or smother flames with a metal lid.',
    keyPoints: [
      'PASS stands for: Pull pin, Aim at base, Squeeze handle, Sweep side-to-side.',
      'Always aim at the base fuel source, never into the rising smoke or flames.',
      'Never pour water on a grease fire: smother with a pan lid or baking soda.',
      'Keep your back to a clear exit path so you can evacuate if the fire spreads beyond control.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=ZCSmsBw18m0',
  },

  // ── Everyday Technology & Device Science ──
  {
    topic: 'WiFi Optimization: 2.4 GHz vs 5 GHz & Physical Wall Interference',
    category: 'Everyday Tech',
    relatedInterests: ['technology', 'physics', 'engineering'],
    body:
      'Home routers broadcast across two distinct frequency bands: 2.4 GHz and 5 GHz. Understanding electromagnetic wave physics reveals why your connection drops in specific rooms: lower frequency waves (2.4 GHz) have longer wavelengths that penetrate drywall and furniture effectively, but offer lower bandwidth (up to 450 Mbps).\n\nConversely, 5 GHz provides massive bandwidth (exceeding 1.3 Gbps) and negligible channel congestion, but its shorter wavelength is heavily absorbed by solid concrete walls, metal appliances, and water pipes. Furthermore, microwave ovens, Bluetooth devices, and baby monitors share the 2.4 GHz band, causing direct radio packet collisions.\n\nFor optimal coverage, elevate your router off the floor in a central room, connect high-bandwidth streaming and gaming devices to the 5 GHz band, and reserve 2.4 GHz for smart bulbs and long-range mobile devices.',
    keyPoints: [
      '2.4 GHz penetrates walls and solid obstacles effectively, while 5 GHz offers maximum speed at close range.',
      'Microwaves and Bluetooth share the 2.4 GHz spectrum, causing intermittent packet drops.',
      'Elevating routers 4–6 feet off the floor reduces ground signal absorption by 30%.',
      'Assign high-bandwidth laptops to 5 GHz and low-power IoT home sensors to 2.4 GHz.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=fM5GmsX_3hY',
  },
  {
    topic: 'Password Entropy: Why Four Words Beat Complex Characters',
    category: 'Everyday Tech',
    relatedInterests: ['technology', 'cybersecurity', 'computers'],
    body:
      'For decades, corporate IT rules enforced short passwords with mandatory symbols and numbers (e.g., "Tr0ub4dor&3"). Mathematical cryptographic analysis proves that password length matters exponentially more than character complexity due to combinatorial entropy.\n\nA brute-force cracker testing trillions of guesses per second can break an 8-character password with mixed symbols in hours. However, a passphrase made of four random, unrelated dictionary words (e.g., "correct horse battery staple") creates 44 bits of entropy, requiring centuries to crack by brute force.\n\nUsing long passphrases makes passwords significantly easier for humans to remember while making mathematical decryption virtually impossible. Pairing unique passphrases with a hardware or authenticator 2-factor (2FA) key stops 99.9% of account takeovers.',
    keyPoints: [
      'Length contributes exponentially more cryptographic entropy than character complexity.',
      'Four random dictionary words are easy to memorize and require decades to crack by brute force.',
      'Avoid predictable substitutions (e.g., @ for a, 3 for e) as cracking dictionaries check these first.',
      'Enabling app-based two-factor authentication (2FA) eliminates single-password vulnerability.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=3NjQ9b3pgIg',
  },
  {
    topic: 'Lithium-Ion Batteries: The 20%-80% Rule for Longer Life',
    category: 'Everyday Tech',
    relatedInterests: ['technology', 'physics', 'engineering'],
    body:
      'Modern smartphones, laptops, and electric vehicles are powered by lithium-ion cells. Unlike legacy nickel-cadmium batteries, lithium batteries have no "memory effect" and should never be fully drained to 0% before recharging.\n\nLithium cells experience peak mechanical and chemical stress at extreme states of charge: keeping a battery at 100% full voltage causes cathode oxidation and electrolyte degradation, while discharging below 20% strains internal anode chemistry. High ambient heat above 35°C (95°F) accelerates this degradation exponentially.\n\nKeeping your device charge between 20% and 80% reduces internal chemical stress, doubling or tripling the total cycle life of your battery from 500 charge cycles to over 1,500 cycles.',
    keyPoints: [
      'Modern lithium-ion batteries degrade fastest when held at 100% charge or drained to 0%.',
      'Operating between 20% and 80% charge can more than double usable battery lifespan.',
      'Heat is the primary enemy of lithium cells: never charge phones under pillows or in hot cars.',
      'Fast-charging generates thermal stress; use standard overnight charging when speed is unnecessary.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=vVtbPz8k6aI',
  },

  // ── Cognitive Models, Learning & Communication ──
  {
    topic: 'The Feynman Technique: Learn Anything by Explaining Simply',
    category: 'Cognitive Models',
    relatedInterests: ['psychology', 'philosophy', 'education'],
    body:
      'Nobel Prize-winning physicist Richard Feynman discovered that the illusion of explanatory depth causes people to mistake familiar vocabulary for authentic understanding. The Feynman Technique is a four-step mental protocol designed to dismantle complex ideas into intuitive mental models.\n\nStep 1: Choose a concept and write its name at the top of a blank page. Step 2: Explain the concept in writing as if teaching an intelligent 10-year-old child, strictly prohibiting academic jargon. Step 3: Identify the exact gaps where your explanation stumbles, relies on buzzwords, or feels circular.\n\nStep 4: Return to primary source material to fill the gaps, re-crafting your explanation using visceral analogies. If you cannot explain an idea using plain words, you do not truly understand it.',
    keyPoints: [
      'The illusion of explanatory depth leads people to mistake jargon for genuine comprehension.',
      'Explain the concept as if teaching a 10-year-old to expose hidden assumptions.',
      'Pinpoint the precise gaps where explanations become circular or vague.',
      'Craft concrete real-world analogies to anchor abstract principles permanently in memory.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=_f-qkGJBPts',
  },
  {
    topic: 'Hanlon’s Razor: Eliminating Paranoia in Daily Life',
    category: 'Cognitive Models',
    relatedInterests: ['philosophy', 'psychology'],
    body:
      'Philosophical razors are mental heuristics designed to "shave off" improbable explanations. Formulated by Robert J. Hanlon, the razor states: "Never attribute to malice that which is adequately explained by stupidity, carelessness, or misunderstanding."\n\nEvolutionary psychology predisposes humans toward hyperactive agency detection: assuming bad intentions in others was an adaptive survival reflex against predators. In modern offices and relationships, however, this bias creates toxic paranoia—assuming an unreturned email or curt remark is a calculated personal slight.\n\nApplying Hanlon’s Razor preserves emotional bandwidth, defuses interpersonal conflict, and leads to rational inquiry. Most mistakes result from fatigue, distraction, and cognitive overload rather than calculated sabotage.',
    keyPoints: [
      'Assume mistakes, distractions, or fatigue before assuming intentional malice.',
      'Counteracts evolutionary hyperactive agency detection that creates social paranoia.',
      'Saves immense emotional energy by preventing defensive, hostile overreactions.',
      'Inquire with curiosity: "Was this an oversight?" rather than accusatory confrontation.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=7y_8rFk3QvE',
  },
  {
    topic: 'The 20-20-20 Rule & Preventing Digital Eye Strain',
    category: 'Cognitive Models',
    relatedInterests: ['health', 'medicine', 'biology'],
    body:
      'Computer Vision Syndrome affects over 60% of modern desk workers. When staring at computer monitors and mobile displays, human blink rates drop from 18 blinks per minute to fewer than 5, causing rapid tear film evaporation, corneal dryness, and ciliary muscle fatigue.\n\nThe American Academy of Ophthalmology designed the 20-20-20 rule to counteract visual fatigue: every 20 minutes of screen use, shift your gaze to an object at least 20 feet away for at least 20 continuous seconds.\n\nLooking into the optical distance relaxes the ciliary lens muscles inside your eyes, which otherwise remain in a state of continuous near-focus contraction. Combined with conscious blinking and warm lighting, this simple protocol prevents chronic evening headaches.',
    keyPoints: [
      'Screen focus reduces natural blink rates by over 65%, evaporating the eye\'s protective tear film.',
      'Every 20 minutes, look at an object at least 20 feet away for 20 continuous seconds.',
      'Looking at distance completely relaxes the ciliary focusing muscles in the lens.',
      'Position screens 20–25 inches from eyes, slightly below eye level to minimize corneal exposure.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=0k1Pq_x8aQ4',
  },

  // ── Home Engineering & Everyday Physics ──
  {
    topic: 'Plumbing P-Traps: The Pipe that Blocks Toxic Sewer Gas',
    category: 'Everyday Engineering',
    relatedInterests: ['science', 'engineering', 'physics'],
    body:
      'Underneath every kitchen sink, bathroom vanity, and toilet bowl lies a distinctive U-shaped or curved pipe called a P-trap. Despite looking like an accidental bend, this simple hydraulic mechanism is a cornerstone of modern public sanitation.\n\nWhenever water drains down the sink, a small reservoir of water remains trapped in the low dip of the curve. This standing water creates an airtight physical liquid seal between your indoor air and the municipal sewer system.\n\nWithout the P-trap water seal, toxic sewer gases—including methane, hydrogen sulfide, and airborne bacteria—would flow directly up into homes. If a sink smells foul after being unused for months, the trapped water has simply evaporated; running the faucet for 5 seconds instantly restores the barrier.',
    keyPoints: [
      'The curved dip holds standing water that acts as an airtight seal against sewer pipes.',
      'Blocks toxic methane, flammable gases, and hazardous sewer pathogens from entering homes.',
      'Unused guest bathroom sinks smell bad because the water seal evaporates over time.',
      'Running water for five seconds instantly refills the P-trap and re-establishes the barrier.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=3Ww9vK_8hQc',
  },
  {
    topic: 'Air Conditioning Physics: How Refrigerant Phase Shifts Cool Homes',
    category: 'Everyday Engineering',
    relatedInterests: ['science', 'physics', 'engineering'],
    body:
      'Contrary to common belief, air conditioners do not "create coldness"; rather, they extract thermal energy from indoor air and pump it outside using the thermodynamic properties of refrigerant phase transitions.\n\nInside the closed copper loop, cold liquid refrigerant evaporates into a gas inside the indoor evaporator coil, absorbing heat from ambient air blown across its fins. A mechanical compressor outside then pressurizes the gas, raising its temperature significantly above outdoor air temperature.\n\nThe outdoor condenser coil releases this concentrated heat to the atmosphere as the refrigerant condenses back into a high-pressure liquid. An expansion valve then drops the pressure, causing the refrigerant to freeze cold again, endlessly repeating the cycle.',
    keyPoints: [
      'Air conditioners extract indoor heat and pump it outdoors using phase-change physics.',
      'Evaporating refrigerant absorbs thermal energy indoors; condensing releases heat outside.',
      'Compressors raise the refrigerant pressure so it can shed heat even in hot outdoor weather.',
      'Keeping air filters clean ensures proper indoor airflow, preventing frozen evaporator coils.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=4qMhsz1kPFE',
  },

  // ── Random Fascinating Knowledge & Wonder ──
  {
    topic: 'Atomic Clocks & Relativity: Why GPS Needs Einstein’s Math',
    category: 'Fascinating Knowledge',
    relatedInterests: ['space', 'physics', 'astronomy'],
    body:
      'Global Positioning System (GPS) satellites orbit 20,200 kilometers above Earth, carrying ultra-precise rubidium and cesium atomic clocks that keep time to within a few billionths of a second. Without adjusting for Albert Einstein\'s theories of Special and General Relativity, smartphone navigation would fail within minutes.\n\nSpecial Relativity dictates that because satellites move at 14,000 km/h relative to ground receivers, their clocks tick roughly 7 microseconds slower per day. However, General Relativity dictates that because gravity is weaker higher up, satellite clocks tick roughly 45 microseconds faster per day.\n\nThe net difference is that satellite clocks tick approximately 38 microseconds faster per day than ground clocks. If software engineers did not mathematically program this relativistic offset into the broadcast frequencies, GPS locations would drift by over 11 kilometers (6.8 miles) every single day.',
    keyPoints: [
      'High orbital velocity causes satellite clocks to tick 7 microseconds slower per day (Special Relativity).',
      'Weaker gravitational curvature causes clocks to tick 45 microseconds faster per day (General Relativity).',
      'The net difference is 38 microseconds faster per day for orbital atomic clocks.',
      'Without relativistic compensation, GPS positioning would drift by 11 kilometers daily.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=MpwG8s1rE3k',
  },
  {
    topic: 'Why the Sky Is Blue: Rayleigh Scattering of Solar Photons',
    category: 'Fascinating Knowledge',
    relatedInterests: ['science', 'physics', 'space'],
    body:
      'Sunlight appears white, but it contains all visible spectral wavelengths from red (longer wavelengths, ~700 nm) to violet and blue (shorter wavelengths, ~400 nm). When solar photons strike Earth\'s atmosphere, they collide with gas molecules (predominantly nitrogen and oxygen).\n\nUnder Rayleigh scattering, the probability of light scattering is inversely proportional to the fourth power of its wavelength (1/λ^4). Because blue light has a wavelength nearly half that of red light, it scatters roughly ten times more efficiently in all directions across the atmosphere.\n\nAt sunrise and sunset, sunlight travels through a much thicker cross-section of the atmosphere. The blue light scatters away before reaching your eyes, leaving the unscattered longer orange and red wavelengths to paint the horizon.',
    keyPoints: [
      'Rayleigh scattering affects short wavelengths (blue/violet) roughly ten times more than red.',
      'Atmospheric nitrogen and oxygen molecules scatter blue photons across the entire sky dome.',
      'Human eyes have photoreceptors that perceive blue light much more vividly than violet.',
      'Sunsets appear red because blue wavelengths scatter away over long atmospheric paths.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=twSg2ZbkGyA',
  },
  {
    topic: 'Bioluminescence: Cold Chemical Light in the Deep Ocean',
    category: 'Fascinating Knowledge',
    relatedInterests: ['biology', 'science', 'oceanography'],
    body:
      'Over 75% of deep-sea marine organisms produce bioluminescence—living light generated through chemical reactions with near 100% thermal efficiency. Unlike an incandescent light bulb that loses 90% of its energy as heat, bioluminescence produces almost no thermal emission.\n\nThe reaction requires two primary components: a light-emitting substrate molecule called luciferin, and an enzyme called luciferase. When catalyzed by adenosine triphosphate (ATP) and oxygen, luciferin oxidizes into an excited state that emits blue-green light photons.\n\nDeep-sea species use living light for diverse evolutionary adaptations: anglerfish use glowing lures to attract prey, dinoflagellates flash burglar alarms when disturbed, and bobtail squid use counter-illumination to match moonlight and hide their shadows from predators below.',
    keyPoints: [
      'Bioluminescent chemical reactions produce light with near 100% thermal energy efficiency.',
      'Luciferin substrates oxidize under luciferase enzymes to emit photons without heat.',
      'Blue-green light travels furthest through oceanic water columns, making it the dominant spectral color.',
      'Used across marine ecosystems for camouflage counter-illumination, mating, and predation.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=UQ_QDT82Iuc',
  },
];

// ── GET /api/discovery ────────────────────────────────────────────────────────
router.get('/discovery', async (req, res, next) => {
  try {
    const { userId, refresh } = req.query;
    const isRefresh = refresh === 'true';

    let userInterests = [];
    let seenTopics = new Set();
    let seenBodies = new Set();

    if (userId) {
      const user = await User.findById(userId).lean();
      if (user && Array.isArray(user.interests)) {
        userInterests = user.interests.map((i) => i.toLowerCase().trim()).filter(Boolean);
      }

      // Fetch all previously seen discovery topics for this specific user
      const userDiscoveryDocs = await FeedItem.find({ userId, source: 'discovery' }).select('topic body').lean();
      for (const d of userDiscoveryDocs) {
        seenTopics.add(normalizeTopic(d.topic));
        seenBodies.add(normalizeBody(d.body));
      }
    }

    // If NOT refreshing and user already has discovery items in DB, return them sorted newest first
    if (!isRefresh && userId && seenTopics.size > 0) {
      const existing = await FeedItem.find({ userId, source: 'discovery' })
        .sort({ createdAt: -1 })
        .limit(15);
      if (existing.length >= 3) {
        return res.status(200).json(existing);
      }
    }

    // Filter candidate pool:
    // 1. MUST NOT match the user's selected interests (other than their interest!)
    // 2. MUST NOT have been given to this user before (topic given once should not repeat!)
    const eligiblePool = PRACTICAL_DISCOVERY_KNOWLEDGE.filter((item) => {
      // Check if item's relatedInterests overlap with user's interests
      const overlapsUserInterest = item.relatedInterests.some((rel) =>
        userInterests.some((uInt) => uInt.includes(rel) || rel.includes(uInt))
      );
      if (overlapsUserInterest) return false;

      // Check if topic was already given to this user
      const normT = normalizeTopic(item.topic);
      const normB = normalizeBody(item.body);
      if (seenTopics.has(normT) || seenBodies.has(normB)) return false;

      return true;
    });

    // If all eligible filtered topics are exhausted, fall back to any unshown practical topics
    let chosenBatch = [];
    if (eligiblePool.length >= 3) {
      chosenBatch = eligiblePool.slice(0, 4);
    } else {
      const anyUnseen = PRACTICAL_DISCOVERY_KNOWLEDGE.filter((item) => {
        return !seenTopics.has(normalizeTopic(item.topic));
      });
      chosenBatch = anyUnseen.slice(0, 4);
      if (chosenBatch.length === 0) {
        // All practical topics seen; pick the least recently shown 3
        chosenBatch = PRACTICAL_DISCOVERY_KNOWLEDGE.slice(0, 3);
      }
    }

    // Persist to MongoDB for this user so they are permanently marked as seen
    const resultItems = [];
    for (const item of chosenBatch) {
      const doc = await FeedItem.create({
        userId: userId || null,
        topic: item.topic,
        body: item.body,
        summary: item.body,
        imageUrl: item.imageUrl,
        keyPoints: item.keyPoints,
        videoUrl: item.videoUrl,
        source: 'discovery',
        seen: false,
        createdAt: new Date(),
      });
      resultItems.push(doc);
    }

    // Return current discovery feed: newly persisted items + previous clean items
    if (userId) {
      const finalDiscovery = await FeedItem.find({ userId, source: 'discovery' })
        .sort({ createdAt: -1 })
        .limit(20);
      return res.status(200).json(finalDiscovery);
    }

    return res.status(200).json(resultItems);
  } catch (err) {
    next(err);
  }
});

// ── Mental Model Discovery Engine ─────────────────────────────────────────────
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

const DISCOVERY_SYSTEM_PROMPT = `You are the MindVault Discovery Engine. Your task is to act as a proactive knowledge synthesizer and mentor.
I will provide you with:
1. USER VAULT CONTEXT: A list of concepts the user has already saved.

CRITICAL INSTRUCTIONS:
1. NO REPEATS: Do not suggest any concept present in the USER VAULT CONTEXT.
2. THE TARGET: Select ONE highly practical mental model or universal law (e.g., Parkinson's Law, Chesterton's Fence, etc.).
3. THE ANCHOR: Explain this new law by anchoring it directly to the concepts the user already knows.

You must output ONLY raw, valid JSON matching this schema exactly:
{
  "discovered_law": "String",
  "real_world_utility": "String",
  "anchor_explanation": "String",
  "bridge_analogy": "String",
  "actionable_takeaway": "String"
}`;

router.post('/discovery/daily-post', async (req, res, next) => {
  try {
    const userId = req.body?.userId || 'default_user';
    const discoveryPost = await pythonService.getDailyDiscovery(userId);
    return res.status(200).json(discoveryPost);
  } catch (err) {
    next(err);
  }
});

router.post('/discover-law', async (req, res, next) => {
  try {
    const { vaultContext } = req.body;

    let contextList = [];
    if (Array.isArray(vaultContext) && vaultContext.length > 0) {
      contextList = vaultContext.map((c) => String(c).trim()).filter(Boolean);
    }

    if (contextList.length === 0) {
      contextList = ['Software Engineering', 'Database Design', 'System Architecture'];
    }

    const promptText = `USER VAULT CONTEXT:\n${contextList.map((c) => `- ${c}`).join('\n')}`;

    let ollamaResponse;
    try {
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          system: DISCOVERY_SYSTEM_PROMPT,
          prompt: promptText,
          format: 'json',
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama responded with HTTP ${response.status}`);
      }

      ollamaResponse = await response.json();
    } catch (ollamaErr) {
      console.warn('[discover-law] Local Ollama AI service unreachable, providing synthesized fallback:', ollamaErr.message);
      // High-utility fallback when Ollama is offline
      const models = [
        {
          discovered_law: "Parkinson's Law",
          real_world_utility: "Work expands to fill the time allotted for its completion.",
          anchor_explanation: `Anchored to ${contextList[0] || 'your core vault studies'}: without strict sprint constraints, peripheral tasks consume disproportionate bandwidth.`,
          bridge_analogy: "Like gas expanding to fill any container volume, undefined milestones inflate task duration.",
          actionable_takeaway: "Impose aggressive artificial deadlines to trigger prioritization and eliminate non-essential scope.",
        },
        {
          discovered_law: "Chesterton's Fence",
          real_world_utility: "Never destroy an existing barrier or policy until you fully understand why it was built in the first place.",
          anchor_explanation: `Connected with ${contextList[0] || 'your vault concepts'}: refactoring legacy constraints without understanding their original trade-offs introduces catastrophic regressions.`,
          bridge_analogy: "Demolishing an unknown roadside fence often releases livestock into oncoming traffic.",
          actionable_takeaway: "Before refactoring or removing a system requirement, investigate the historical friction that created it.",
        },
        {
          discovered_law: "Goodhart's Law",
          real_world_utility: "When a measure becomes a target, it ceases to be a good measure.",
          anchor_explanation: `Relevant to ${contextList[0] || 'your learning goals'}: optimizing metrics directly encourages unintended gaming rather than authentic mastery.`,
          bridge_analogy: "A cobra bounty meant to eradicate snakes leads to farmers breeding cobras for income.",
          actionable_takeaway: "Pair quantitative proxy goals with qualitative peer reviews to prevent distortion.",
        },
        {
          discovered_law: "Conway's Law",
          real_world_utility: "Organizations build systems that mirror their internal communication structures.",
          anchor_explanation: `Directly bridges with ${contextList[0] || 'your systems architecture'}: siloed engineering teams build fragmented, brittle software interfaces.`,
          bridge_analogy: "If two architect teams work on separate floors and don't talk, their bridge will fail to connect in the middle.",
          actionable_takeaway: "Design cross-functional teams around customer workflows rather than functional silos.",
        },
        {
          discovered_law: "Gall's Law",
          real_world_utility: "A complex system that works is invariably found to have evolved from a simple system that worked.",
          anchor_explanation: `Anchored to ${contextList[0] || 'your domain projects'}: complex systems designed from scratch never work and cannot be patched to work.`,
          bridge_analogy: "Living trees grow from small seeds; assembling a synthetic oak tree from sawdust and glue immediately collapses.",
          actionable_takeaway: "Always build an operational MVP first before adding multi-tier abstraction layers.",
        },
      ];
      const selected = models[Math.floor(Math.random() * models.length)];
      return res.status(200).json(selected);
    }

    if (!ollamaResponse || !ollamaResponse.response) {
      return res.status(500).json({ error: 'Ollama returned an empty response.' });
    }

    try {
      const rawText = ollamaResponse.response.trim();
      const parsedData = JSON.parse(rawText);
      const result = {
        discovered_law: parsedData.discovered_law || "Conway's Law",
        real_world_utility: parsedData.real_world_utility || 'Organizations build systems that mirror their internal communication structures.',
        anchor_explanation: parsedData.anchor_explanation || 'This model connects directly to your understanding of architectural components and modular boundaries.',
        bridge_analogy: parsedData.bridge_analogy || 'Just like decoupled modules reduce cross-system bugs, decoupled teams prevent coordination overhead.',
        actionable_takeaway: parsedData.actionable_takeaway || 'Align team structure directly with the target architecture you wish to build.',
      };
      return res.status(200).json(result);
    } catch (jsonErr) {
      return res.status(500).json({
        error: 'Failed to parse mental model output into JSON.',
        raw: ollamaResponse.response,
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
