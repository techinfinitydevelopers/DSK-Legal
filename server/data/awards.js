// Practice-area rankings as listed on dsklegal.com/awards (34 entries).
// Publisher is derived from the 'by' text so the UI can build a practice × publisher matrix.
const pubOf = (by) =>
  /Chambers/i.test(by) ? 'Chambers'
  : /Legal ?500/i.test(by) ? 'Legal 500'
  : /Asialaw/i.test(by) ? 'Asialaw'
  : /IFLR/i.test(by) ? 'IFLR 1000'
  : /ALB/i.test(by) ? 'ALB'
  : /India Business Law Journal/i.test(by) ? 'IBLJ'
  : /Legal Era/i.test(by) ? 'Legal Era'
  : /Forbes/i.test(by) ? 'Forbes India'
  : 'Others'; // Benchmark Litigation, Fast 30
const a = (rank, by) => ({ rank, by, pub: pubOf(by) });
export const awardsByPractice = [
  { practice: 'Dispute Resolution', items: [
    a('Dispute Resolution Law Firm of the Year', 'Legal500 India Law Awards 2024'),
    a('North India Law Firm of the Year', 'ALB India Law Awards 2022'),
    a('South India Law Firm of the Year', 'ALB India Law Awards 2022'),
    a('Outstanding', 'Asialaw Profiles 2024'),
    a('Band 2', 'Chambers & Partners Asia-Pacific 2024 and Chambers Global 2024'),
    a('Tier 1', 'Legal 500 Asia Pacific 2024'),
    a('Highly Recommended Firm', 'Benchmark Litigation Asia-Pacific 2024'),
    a('Award Winning Practice', 'India Business Law Journal Indian Law Firm Awards 2022'),
    a('Legal Powerlist 2021', 'Forbes India'),
    a('Dispute Resolution Law Firm of the Year', '11th and 12th Annual Legal Era Indian Legal Awards'),
  ] },
  { practice: 'Real Estate & Construction', items: [
    a('Tier 1', 'Legal 500 Asia-Pacific 2024'),
    a('Outstanding', 'Asialaw Profiles 2024'),
    a('Band 2', 'Chambers Asia-Pacific 2024'),
    a('Award Winning Practice', 'India Business Law Journal 2022 Indian Law Firm Awards'),
    a('Legal Powerlist 2021', 'Forbes India'),
    a('Real Estate & Construction Law Firm of the Year', 'Legal Era Awards 2022 and 2024'),
  ] },
  { practice: 'Corporate & M&A', items: [
    a('Tier 1', 'ALB Asia M&A Rankings 2023'),
    a('Tier 2', 'Legal 500 Asia Pacific 2024'),
    a('Tier 2', 'IFLR 1000 2023'),
    a('Band 3', 'Chambers Asia Pacific 2024 and Chambers Global 2024'),
    a('Highly Recommended', 'Asialaw Profiles 2024'),
    a('Legal Powerlist 2021', 'Forbes India'),
  ] },
  { practice: 'Projects, Infrastructure & Energy', items: [
    a('Tier 2', 'The Legal 500 Asia-Pacific 2024'),
    a('Band 3', 'Chambers Asia-Pacific 2024 and Chambers Global 2024'),
    a('Highly Recommended (Energy)', 'Asialaw Profiles 2024'),
    a('Highly Recommended (Infrastructure)', 'Asialaw Profiles 2024'),
    a('Tier 2', 'IFLR 1000 2023'),
    a('Legal Powerlist 2021', 'Forbes India'),
    a('Award Winning Practice', 'India Business Law Journal 2021 Indian Law Firm Awards'),
  ] },
  { practice: 'Banking & Finance', items: [
    a('Fast 30', 'Asia’s Fastest Growing Firm 2023'),
    a('Recommended', 'Asialaw Profiles 2024'),
    a('Tier 2', 'Legal 500 Asia-Pacific 2024'),
    a('Recommended Firm', 'IFLR 1000 2023'),
    a('Top Ranked Firm', 'Chambers Asia-Pacific 2024 & Chambers Global 2023'),
  ] },
];
