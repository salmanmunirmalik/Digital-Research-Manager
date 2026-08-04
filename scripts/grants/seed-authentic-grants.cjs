/**
 * Seed authentic, currently open funding opportunities into `grants`.
 * Sources verified Aug 2026 from official funder / grants.gov pages only.
 * Amounts left null when the official notice does not publish a clear per-award range.
 */
require('dotenv').config();
const crypto = require('crypto');
const mysql = require('mysql2/promise');

const GRANTS = [
  {
    external_id: 'RFA-RM-27-002',
    title: "NIH Director's New Innovator Award (DP2 Clinical Trial Optional)",
    summary:
      'Supports early-stage investigators of exceptional creativity who propose bold, highly innovative biomedical research with potential for major impact. Single PI; Early Stage Investigator status required; no preliminary data required. Approximately 30 awards expected. Direct costs: $475,000 per year for up to 5 years.',
    sponsor: 'National Institutes of Health (NIH Common Fund)',
    funding_type: 'research_grant',
    funding_min: 475000,
    funding_max: 475000,
    funding_currency: 'USD',
    deadline_date: '2026-08-17',
    published_date: '2026-06-26',
    url: 'https://simpler.grants.gov/opportunity/e60227f3-787d-418c-aadf-f6e36a9f9890',
    region: 'United States',
    country: 'United States',
    disciplines: ['Biomedical sciences', 'Translational research', 'Clinical research'],
    keywords: ['NIH', 'DP2', 'New Innovator', 'High-Risk High-Reward', 'early-stage investigator'],
    source: 'https://www.nih.gov/common-fund/common-fund-programs/high-risk-high-reward-research-hrhr/nih-directors-new-innovator-award',
  },
  {
    external_id: 'RFA-RM-27-001',
    title: "NIH Director's Pioneer Award (DP1 Clinical Trial Optional)",
    summary:
      'Supports individual scientists of exceptional creativity who propose pioneering approaches to major challenges in biomedical or behavioral research. Part of the NIH Common Fund High-Risk, High-Reward Research program. Direct costs: $700,000 per year for up to 5 years.',
    sponsor: 'National Institutes of Health (NIH Common Fund)',
    funding_type: 'research_grant',
    funding_min: 700000,
    funding_max: 700000,
    funding_currency: 'USD',
    deadline_date: '2026-09-09',
    published_date: '2026-06-29',
    url: 'https://simpler.grants.gov/search?query=RFA-RM-27-001',
    region: 'United States',
    country: 'United States',
    disciplines: ['Biomedical sciences', 'Behavioral research'],
    keywords: ['NIH', 'DP1', 'Pioneer Award', 'High-Risk High-Reward'],
    source: 'https://www.nih.gov/common-fund/common-fund-programs/high-risk-high-reward-research-hrhr/nih-directors-pioneer-award',
  },
  {
    external_id: 'RFA-RM-27-004',
    title: "NIH Director's Early Independence Award (DP5 Clinical Trial Optional)",
    summary:
      'Enables exceptional junior investigators to skip traditional postdoctoral training and launch independent research careers. Part of the NIH Common Fund High-Risk, High-Reward Research program. Direct costs: $350,000 per year for up to 5 years. About 10 awards expected.',
    sponsor: 'National Institutes of Health (NIH Common Fund)',
    funding_type: 'research_grant',
    funding_min: 350000,
    funding_max: 350000,
    funding_currency: 'USD',
    deadline_date: '2026-09-10',
    published_date: '2026-06-26',
    url: 'https://simpler.grants.gov/opportunity/8518b002-2452-44e3-8b00-78fcaa5c7edb',
    region: 'United States',
    country: 'United States',
    disciplines: ['Biomedical sciences'],
    keywords: ['NIH', 'DP5', 'Early Independence', 'High-Risk High-Reward'],
    source: 'https://www.nih.gov/common-fund/common-fund-programs/high-risk-high-reward-research-hrhr/nih-directors-early-independence-award',
  },
  {
    external_id: 'NSF-26-512',
    title: 'Unlocking Dataset Value for AI-Enabled Scientific Discovery (AI Datasets)',
    summary:
      'NSF program to increase the value of existing scientific datasets for AI-driven discovery: feature extraction, metadata, data pipelines, and dataset harmonization. Planning grants up to $200,000; Impact awards up to $2,000,000 (≈10–20); Flagship awards up to $5,000,000 (≈5–10). Anticipated program funding $60–100 million.',
    sponsor: 'U.S. National Science Foundation (NSF)',
    funding_type: 'research_grant',
    funding_min: 200000,
    funding_max: 5000000,
    funding_currency: 'USD',
    deadline_date: '2026-11-04',
    published_date: '2026-07-21',
    url: 'https://www.nsf.gov/funding/opportunities/ai-datasets-unlocking-dataset-value-ai-enabled-scientific-discovery/nsf26-512/solicitation',
    region: 'United States',
    country: 'United States',
    disciplines: ['Computer science', 'Artificial intelligence', 'Data science', 'Biological sciences', 'Geosciences', 'Engineering'],
    keywords: ['NSF', 'AI Datasets', 'NSF 26-512', 'scientific datasets'],
    source: 'https://www.nsf.gov/funding/opportunities/ai-datasets-unlocking-dataset-value-ai-enabled-scientific-discovery/nsf26-512/solicitation',
  },
  {
    external_id: 'NSF-24-590',
    title: 'Engineering Research Initiation (ERI)',
    summary:
      'NSF Directorate for Engineering capacity-building award for new academic investigators who have not yet received substantial federal research support. Limited to investigators not at very high research activity (R1) institutions. Award including indirect costs must not exceed $200,000 for 24 months.',
    sponsor: 'U.S. National Science Foundation (NSF)',
    funding_type: 'seed',
    funding_min: null,
    funding_max: 200000,
    funding_currency: 'USD',
    deadline_date: '2026-10-09',
    published_date: '2024-07-11',
    url: 'https://www.nsf.gov/funding/opportunities/eri-engineering-research-initiation/nsf24-590/solicitation',
    region: 'United States',
    country: 'United States',
    disciplines: ['Engineering'],
    keywords: ['NSF', 'ERI', 'NSF 24-590', 'early-career engineering'],
    source: 'https://www.nsf.gov/funding/opportunities/eri-engineering-research-initiation/nsf24-590/solicitation',
  },
  {
    external_id: 'NSF-26-506',
    title: 'Pathways to Enable Secure Open-Source Ecosystems (PESOSE)',
    summary:
      'NSF program supporting secure open-source software ecosystems. Track 1: maximum $300,000 per award (≈30 awards). Tracks 2 and 3: maximum $1,500,000 per award (≈10 awards each). Anticipated program funding about $40 million.',
    sponsor: 'U.S. National Science Foundation (NSF)',
    funding_type: 'research_grant',
    funding_min: 300000,
    funding_max: 1500000,
    funding_currency: 'USD',
    deadline_date: '2026-09-01',
    published_date: '2026-02-19',
    url: 'https://www.nsf.gov/funding/opportunities/pesose-pathways-enable-secure-open-source-ecosystems/nsf26-506/solicitation',
    region: 'United States',
    country: 'United States',
    disciplines: ['Computer science', 'Cybersecurity', 'Software engineering'],
    keywords: ['NSF', 'PESOSE', 'open source', 'NSF 26-506'],
    source: 'https://www.nsf.gov/funding/opportunities/pesose-pathways-enable-secure-open-source-ecosystems/nsf26-506/solicitation',
  },
  {
    external_id: 'NSF-26-507-DEVELOPMENT',
    title: 'NSF FINDERS Foundry - Development Proposals',
    summary:
      'NSF Fostering Interdisciplinary Networks to Develop Emergent and Responsive Solutions Foundry. Development awards up to $300,000 for 1 year (≈20 awards). Planning awards (separate deadline) are up to $50,000.',
    sponsor: 'U.S. National Science Foundation (NSF)',
    funding_type: 'seed',
    funding_min: null,
    funding_max: 300000,
    funding_currency: 'USD',
    deadline_date: '2026-11-18',
    published_date: '2026-03-23',
    url: 'https://www.nsf.gov/funding/opportunities/nsf-finders-foundry-national-science-foundation-fostering-interdisciplinary/nsf26-507/solicitation',
    region: 'United States',
    country: 'United States',
    disciplines: ['Interdisciplinary science', 'Engineering'],
    keywords: ['NSF', 'FINDERS', 'NSF 26-507'],
    source: 'https://www.nsf.gov/funding/opportunities/nsf-finders-foundry-national-science-foundation-fostering-interdisciplinary/nsf26-507/solicitation',
  },
  {
    external_id: 'WELLCOME-ACCELERATOR-2026',
    title: 'Wellcome Accelerator Awards',
    summary:
      'Wellcome scheme providing salary (if required) and up to £200,000 for project expenses. Full application deadline 25 August 2026, 15:00 BST. Annual scheme until 2028.',
    sponsor: 'Wellcome Trust',
    funding_type: 'research_grant',
    funding_min: null,
    funding_max: 200000,
    funding_currency: 'GBP',
    deadline_date: '2026-08-25',
    published_date: '2026-05-06',
    url: 'https://wellcome.org/research-funding/schemes/wellcome-accelerator-awards',
    region: 'Global',
    country: 'United Kingdom',
    disciplines: ['Health research', 'Biomedical sciences'],
    keywords: ['Wellcome', 'Accelerator Awards'],
    source: 'https://wellcome.org/research-funding/schemes/wellcome-accelerator-awards',
  },
  {
    external_id: 'WELLCOME-DISCOVERY-2026-09',
    title: 'Wellcome Discovery Awards',
    summary:
      'Funding for established researchers to pursue bold and creative research programmes. Applicants should request the resources needed; average award size is about £3.5 million; applications above £5 million receive additional scrutiny. Application deadline 22 September 2026, 15:00 BST. After this round the scheme becomes always open.',
    sponsor: 'Wellcome Trust',
    funding_type: 'research_grant',
    funding_min: null,
    funding_max: null,
    funding_currency: 'GBP',
    deadline_date: '2026-09-22',
    published_date: '2026-04-21',
    url: 'https://wellcome.org/research-funding/schemes/wellcome-discovery-awards',
    region: 'Global',
    country: 'United Kingdom',
    disciplines: ['Health research', 'Biomedical sciences', 'Life sciences'],
    keywords: ['Wellcome', 'Discovery Awards'],
    source: 'https://wellcome.org/research-funding/schemes/wellcome-discovery-awards',
  },
  {
    external_id: 'WELLCOME-EARLY-CAREER',
    title: 'Wellcome Early-Career Awards',
    summary:
      'Supports early-career researchers establishing independence. Provides salary for the grantholder and up to £400,000 for research expenses (certain costs excluded from that cap). Usually up to 5 years. No application deadline - submit any time.',
    sponsor: 'Wellcome Trust',
    funding_type: 'fellowship',
    funding_min: null,
    funding_max: 400000,
    funding_currency: 'GBP',
    deadline_date: null,
    published_date: null,
    url: 'https://wellcome.org/research-funding/schemes/wellcome-early-career-awards',
    region: 'Global',
    country: 'United Kingdom',
    disciplines: ['Health research', 'Biomedical sciences'],
    keywords: ['Wellcome', 'Early-Career Awards', 'fellowship'],
    source: 'https://wellcome.org/research-funding/schemes/wellcome-early-career-awards',
  },
  {
    external_id: 'ERC-2026-AdG',
    title: 'ERC Advanced Grant 2026',
    summary:
      'European Research Council grants for established research leaders with a significant track record. Up to €2.5 million for 5 years; additional funding of up to €1 million (or up to €2 million for PIs relocating from outside the EU/associated countries) may be requested for start-up, major equipment, or large facilities. Call opens 28 May 2026; deadline 27 August 2026.',
    sponsor: 'European Research Council (ERC)',
    funding_type: 'research_grant',
    funding_min: null,
    funding_max: 2500000,
    funding_currency: 'EUR',
    deadline_date: '2026-08-27',
    published_date: '2026-05-28',
    url: 'https://erc.europa.eu/apply-grant/advanced-grant',
    region: 'European Union',
    country: null,
    disciplines: ['All research fields'],
    keywords: ['ERC', 'Advanced Grant', 'Horizon Europe'],
    source: 'https://erc.europa.eu/apply-grant/advanced-grant',
  },
  {
    external_id: 'HORIZON-MSCA-2026-PF',
    title: 'MSCA Postdoctoral Fellowships 2026',
    summary:
      'Marie Skłodowska-Curie Actions Postdoctoral Fellowships for researchers holding a PhD seeking international, interdisciplinary, and inter-sectoral mobility. Indicative call budget €399.05 million; expected to fund nearly 1,600 projects. European Fellowships (12–24 months) and Global Fellowships available. Official unit contributions include living allowance €6,350/month (country-corrected), mobility €710/month, research/training €1,000/month, and management/indirect €650/month. Call opened 9 April 2026; deadline 9 September 2026, 17:00 Brussels time.',
    sponsor: 'European Commission - Marie Skłodowska-Curie Actions',
    funding_type: 'fellowship',
    funding_min: null,
    funding_max: null,
    funding_currency: 'EUR',
    deadline_date: '2026-09-09',
    published_date: '2026-04-09',
    url: 'https://marie-sklodowska-curie-actions.ec.europa.eu/whats-new/news/msca-opens-eu399-million-call-for-postdoctoral-fellowships',
    region: 'European Union',
    country: null,
    disciplines: ['All research fields'],
    keywords: ['MSCA', 'Postdoctoral Fellowships', 'Horizon Europe', 'mobility'],
    source: 'https://marie-sklodowska-curie-actions.ec.europa.eu/whats-new/news/msca-opens-eu399-million-call-for-postdoctoral-fellowships',
  },
  {
    external_id: 'GATES-GC-AI-FP-2026',
    title: 'AI-Enabled Consumer Engagement to Advance Family Planning',
    summary:
      'Gates Foundation Grand Challenges RFP seeking evidence on whether AI-enabled direct-to-consumer engagement can improve contraceptive uptake, continuation, and informed method choice, focused on sub-Saharan Africa. Awards up to US$500,000 per project for up to 12 months (indirect costs up to 15%). Deadline 25 August 2026, 11:30 a.m. Pacific Time.',
    sponsor: 'Gates Foundation (Grand Challenges)',
    funding_type: 'research_grant',
    funding_min: null,
    funding_max: 500000,
    funding_currency: 'USD',
    deadline_date: '2026-08-25',
    published_date: '2026-07-21',
    url: 'https://gcgh.grandchallenges.org/challenge/ai-enabled-consumer-engagement-advance-family-planning',
    region: 'Sub-Saharan Africa',
    country: null,
    disciplines: ['Global health', 'Family planning', 'Artificial intelligence', 'Public health'],
    keywords: ['Gates Foundation', 'Grand Challenges', 'family planning', 'AI'],
    source: 'https://submit.gatesfoundation.org/prog/ai-enabled_consumer_engagement_to_advance_family_planning/',
  },
  {
    external_id: 'GATES-GC-MN-MULTIPLEX-2026',
    title: 'Multiplex Platforms to Assess Indicators of Micronutrient Status, Inflammation and Infectious Disease',
    summary:
      'Gates Foundation Grand Challenges RFP for novel multiplex assays for micronutrient biomarkers with infection/inflammation markers, intended for low-cost population surveillance in LMICs. Alternative A (minimum scope): up to US$200,000, up to 12 months. Alternative B (optimistic scope): up to US$800,000, up to 24 months. Deadline 8 September 2026, 11:30 a.m. Pacific Time.',
    sponsor: 'Gates Foundation (Grand Challenges)',
    funding_type: 'research_grant',
    funding_min: 200000,
    funding_max: 800000,
    funding_currency: 'USD',
    deadline_date: '2026-09-08',
    published_date: '2026-07-21',
    url: 'https://submit.gatesfoundation.org/prog/multiplex_platforms_to_assess_indicators_of_micronutrient_status_inflammation_and_infectious_disease/',
    region: 'Global',
    country: null,
    disciplines: ['Nutrition', 'Diagnostics', 'Global health', 'Infectious disease'],
    keywords: ['Gates Foundation', 'Grand Challenges', 'micronutrients', 'multiplex'],
    source: 'https://gcgh.grandchallenges.org/sites/default/files/files/indicators_of_micronutrient_status_rfp.pdf',
  },
  {
    external_id: 'PAR-26-042',
    title: 'Research Grants in Clinical Informatics (R01 Clinical Trial Optional)',
    summary:
      'NIH PAR supporting research in clinical informatics. Application budgets limited to $250,000 per year in direct costs. Next standard due date after Aug 2026: 5 October 2026 (then continuing standard dates through Feb 2029). Expiration March 6, 2029.',
    sponsor: 'National Institutes of Health (NIH)',
    funding_type: 'research_grant',
    funding_min: null,
    funding_max: 250000,
    funding_currency: 'USD',
    deadline_date: '2026-10-05',
    published_date: '2026-02-11',
    url: 'https://files.simpler.grants.gov/opportunities/131fabad-5506-431b-b87a-e564f1d8dcc4/attachments/61b6dce0-ffe6-4f50-b863-07b2ce70c1bf/PAR-26-042-Full-Announcement.html',
    region: 'United States',
    country: 'United States',
    disciplines: ['Clinical informatics', 'Biomedical informatics', 'Health IT'],
    keywords: ['NIH', 'PAR-26-042', 'R01', 'clinical informatics'],
    source: 'https://files.simpler.grants.gov/opportunities/131fabad-5506-431b-b87a-e564f1d8dcc4/attachments/61b6dce0-ffe6-4f50-b863-07b2ce70c1bf/PAR-26-042-Full-Announcement.html',
  },
];

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DB || 'researchlab',
  });

  let inserted = 0;
  let skipped = 0;

  for (const g of GRANTS) {
    const [existing] = await connection.query(
      'SELECT id FROM grants WHERE external_id = ? LIMIT 1',
      [g.external_id]
    );
    if (existing.length) {
      console.log(`skip (exists): ${g.external_id}`);
      skipped += 1;
      continue;
    }

    const id = crypto.randomUUID();
    await connection.query(
      `INSERT INTO grants (
        id, created_by, source_id, external_id, title, summary, sponsor, funding_type,
        funding_min, funding_max, funding_currency, deadline_date, published_date, status,
        url, region, country, disciplines, keywords, eligibility, requirements, raw_payload,
        posted_by_name
      ) VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        g.external_id,
        g.title,
        g.summary,
        g.sponsor,
        g.funding_type,
        g.funding_min,
        g.funding_max,
        g.funding_currency,
        g.deadline_date,
        g.published_date,
        g.url,
        g.region,
        g.country,
        JSON.stringify(g.disciplines),
        JSON.stringify(g.keywords),
        JSON.stringify({}),
        JSON.stringify({}),
        JSON.stringify({
          seed: 'authentic-web-research-2026-08',
          verified_source: g.source,
          verified_at: '2026-08-04',
        }),
        'ResearchLab directory',
      ]
    );
    console.log(`inserted: ${g.external_id} - ${g.title}`);
    inserted += 1;
  }

  const [count] = await connection.query('SELECT COUNT(*) AS c FROM grants WHERE status = ?', ['open']);
  console.log(`\nDone. inserted=${inserted} skipped=${skipped} open_total=${count[0].c}`);
  await connection.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
