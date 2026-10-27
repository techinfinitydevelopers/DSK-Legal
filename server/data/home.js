export const home = {
  ticker: {
    label: 'Read:',
    text: 'Law Meets AI',
  },
  email: 'Contactus@dsklegal.com',
  nav: [['About Us','#about'],['Practice Areas','#practice'],['Sectors & Industries','#practice'],['Our Team','#about'],['Knowledge Centre','#knowledge'],['Careers','#footer']],
  hero: {
    eyebrow: 'Independent Legal Counsel · India & UAE',
    title: 'Clarity in Complexity.',
    accent: 'Confidence',
    titleTail: 'in Every Strategic Decision.',
    body: 'Founded in 2001 in India and expanding to the UAE in 2025, DSK Legal delivers pragmatic, value-oriented legal advice across complex multi-jurisdictional landscapes. With 300+ fee-earners and 74 partners, we bring singular focus to high-stakes mandates.',
    stats: [
      { value: '2001', label: 'Established' },
      { value: '300+', label: 'Fee-earners' },
      { value: '74', label: 'Partners' },
    ],
    caption: { title: 'DSK Legal Services Practice', sub: 'Mumbai · Delhi · Gujarat | Pune | Chennai | UAE' },
  },
  values: [
    { n: '01', title: 'Excellence in Execution', text: 'DSK Legal is committed to excellence in the quality of its work and in meeting client expectations.' },
    { n: '02', title: 'Fairness & Integrity', text: 'DSK Legal is committed to fairness and integrity.' },
    { n: '03', title: 'Professional Aspiration', text: 'DSK Legal is committed to assist its people in achieving their professional aspirations.' },
  ],
  profile: {
    eyebrow: 'Institutional Profile',
    title: 'A full service law firm with',
    accent: 'solution-oriented',
    titleTail: 'and globally minded lawyers.',
    paras: [
      'DSK Legal was set up in 2001 in India and in 2025 in the UAE, and has since established an excellent full-service law firm with a strong focus on integrity and value-based proactive, pragmatic, and innovative legal advice and inform. Our clients effectively tackle the complex legal and regulatory regimes of India.',
      'With offices in Mumbai, Delhi, Bengaluru, Chennai, Pune, and Dubai, DSK Legal has grown rapidly on the strength of our multi-disciplinary team with over 300 fee-earners, including 74 partners and associate partners.',
    ],
    link: 'Explore our nationwide presence',
    imgCaption: 'National Footprint & Global Reach',
    imgNote: 'Offices in 7 premier hubs',
  },
  recognition: {
    eyebrow: 'Recent Recognitions',
    quote: 'Ranked as an Outstanding Firm by Asialaw Profiles rankings.',
    source: 'Consistently Tier 1, Mumbai & Delhi, Asia-Pacific Legal 500',
    cta: 'View all accolades',
  },
  strengths: {
    eyebrow: 'Our Strengths',
    paras: [
      'DSK Legal ranks consistently in the top tier of the lawyers. Their depth of specialization is a hallmark and testament of experience and a better-informed outcome.',
      'We pride ourselves in having achieved proficiency across diverse sectors, including recognition by regulatory for aviation, banking and finance, capital markets, corporate & commercial, media and entertainment, and high-stakes white collar investigations.',
    ],
    link: 'Learn more about practice breadth',
  },
  testimonials: [
    { quote: 'DSK understand the practicalities of market conditions and provide excellent services. The team have a good understanding about the transactions and requirements of the clients. Based on this, they are able to revert with good inputs on complex structures and provide appropriate documents.', who: 'Chambers and Partners', role: 'Asia-Pacific' },
    { quote: 'The service levels are outstanding and we really appreciate their prompt responsiveness.', who: 'Chambers and Partners', role: 'Asia-Pacific' },
    { quote: 'The technical ability and practical approach of the team sets them apart.', who: 'Legal500', role: 'Asia-Pacific' },
    { quote: 'Precise legal opinions, proactive responses, reasonable fees, responses any hour of the day and good behaviour.', who: 'Asialaw Profiles', role: 'Client feedback' },
    { quote: 'Extremely client focused, quick turnaround, quality delivery, reliable, deep rooted knowledge.', who: 'Legal500', role: 'Asia-Pacific' },
  ],
  practice: {
    eyebrow: 'Multidisciplinary Capabilities',
    title: 'Practice Areas',
    sub: 'Comprehensive legal expertise designed to guide multinational corporations, financial institutions, private funds, and enterprises across India and the UAE.',
    items: [
      'Banking & Finance', 'Competition & Antitrust', 'Corporate & Securities', 'Crisis Management', 'Dispute Resolution',
      'Intellectual Property', 'International Trade & Customs', 'Labour & Employment', 'Media, Entertainment & Sports', 'Private Client Practice',
      'Projects, Energy & Infra', 'Real Estate Practice', 'Technology Practice', 'White Collar Crime Practice',
    ],
  },
  awards: {
    eyebrow: 'Independent Industry Endorsement',
    title: 'Awards and Recognition',
    logos: Array.from({ length: 13 }, (_, i) => `logos/award${i + 1}.png`), // transparent, trimmed, 500x200 (shown at 250x100)
    ranks: ['Top Tier Firm — IFLR1000 2024','Top Ranked — Chambers 2025 Asia-Pacific','Outstanding Firm — Asialaw Profiles 2024','Top Tier — Legal500 Asia-Pacific 2025','Top 15 ESG Law Firm in Asia — ALB 2024'],
    cta: 'View all awards & rankings',
  },
  knowledge: {
    eyebrow: 'Thought Leadership',
    title: 'Knowledge Centre',
    sub: 'Timely regulatory analyses, case studies, updates, and knowledge briefings authored by DSK Legal practitioners.',
    cards: [
      { tag: 'Periodic Publication', title: 'Monthly Newsletters', text: 'Complete month-by-month digest covering legislative amendments, judicial pronouncements of the Supreme Court of India, related statutory changes.', cta: 'Read latest newsletters' },
      { tag: 'Specialised Briefings', title: 'Practice Area Newsletters', text: 'Domain-specific advisories across Banking, Competition, Corporate M&A, Renewable Energy, and Real Estate and more.', cta: 'See practice-area archive' },
    ],
  },
  offices: {
    eyebrow: 'Strategic Locations',
    title: 'Our Offices',
    sub: 'Offices strategically located across key commercial and regulatory centres in India and the UAE.',
    cities: [
      { img: 'mumbai.png', city: 'Mumbai', note: '+91-22-6658-8000' },
      { img: 'delhi.png', city: 'New Delhi', note: '+91-11-4661-6666' },
      { img: 'bengaluru.webp', city: 'Bengaluru', note: '+91-80-6954-8770' },
      { img: 'pune.png', city: 'Pune', note: '+91-20-6684-7600' },
      { img: 'chennai.png', city: 'Chennai', note: '044-4793 0801' },
      { img: 'dubai.png', city: 'Dubai', note: '+971 4 235 5166' },
      { img: 'dubai.png', city: 'Abu Dhabi', note: 'UAE' },
    ],
  },
  footer: {
    offices: ['Abu Dhabi', 'Dubai', 'Mumbai Office', 'Mumbai - Litigation Office', 'New Delhi Office', 'Bengaluru Office', 'Chennai', 'Pune Office'],
    firm: ['Home', 'Our Team', 'Awards & Recognition', 'Contact', 'Contact Us', 'Careers'],
    mailing: 'Receive monthly knowledge insights, legal briefings and firm updates directly to your inbox.',
    person: { name: 'Hariharan SK', role: 'Founder, Corporate & M&A Partner' },
    disclaimer: 'The bodies below are the full independence not affiliated with DSK Legal; any representation made would be solely on behalf of the Consult of India regulations.',
    copyright: '© 2026 DSK Legal. All rights reserved.',
  },
};
