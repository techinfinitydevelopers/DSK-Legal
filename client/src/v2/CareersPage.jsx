import PageShell, { PageHero } from './PageShell.jsx';
import { siteEmail, tx } from '../seo.js';
import { CtaBand } from './Sections2.jsx';
import { Reveal } from '../hooks.jsx';
import { Spotlight } from './fx.jsx';
import { Typewriter } from './Typewriter.jsx';

/** /careers — culture copy from dsklegal.com/our-career; application forms live at /careers/internship and /careers/apply. */
const VALUES = [
  { n: '01', title: 'Respect & Meritocracy', text: 'We pride ourselves for having created a culture of respect, meritocracy and diversity. Each one’s growth in our firm is based purely on continuous excellence with no artificial ceilings limiting their growth.' },
  { n: '02', title: 'Trust', text: 'Our firm strives to provide psychological safety, where every individual can work with dignity and professional security.' },
  { n: '03', title: 'Solution Oriented', text: 'We believe in sharing experiences across our firm. Deep thinking with a solution driven approach has brought the firm to where it is today, and we want everyone to embrace the same approach.' },
  { n: '04', title: 'Depth and Breadth of Work', text: 'We strive for excellence in every practice vertical and aim to maintain consistent standards across our firm. If a broad range of knowledge and addressing challenging work with creative solutions excites you, then this is the place for you.' },
  { n: '05', title: 'Discipline', text: 'To us, discipline is the differentiator that elevates someone from good to great. If you believe in this ideology, then DSK Legal is the right place for you.' },
  { n: '06', title: 'Career Oriented', text: 'We are committed to helping you build a long and fulfilling career at DSK Legal. At each stage you can expect mentoring and exposure to challenging opportunities to help you develop as a person and a professional. The camaraderie across the firm makes interacting with colleagues a fun experience without detracting from the seriousness of achieving each one’s career goals.' },
];

const ROUTES = [
  { title: 'Internship', text: 'Start your career with hands-on exposure to the firm’s practice areas.', cta: 'Apply for internship', href: '/careers/internship' },
  { title: 'Apply for a position', text: 'Explore open positions across our offices and apply directly.', cta: 'Apply for a position', href: '/careers/apply' },
];

function Openings() {
  const jobs = window.__JOBS || [];
  if (!jobs.length) return null;
  return (
    <section className="x-sec x-cr-open" id="openings">
      <div className="container">
        <Reveal className="x-head">
          <p className="x-kicker">Current openings</p>
          <Typewriter parts={[{ text: 'Open' }, { text: 'positions', as: 'em' }]} />
        </Reveal>
        <div className="x-jobs">
          {jobs.map((j, i) => (
            <Reveal key={j.slug} delay={(i % 2) * 100}>
              <details className="x-job">
                <summary>
                  <span className="x-job-main"><b>{j.title}</b><em>{[j.department, j.office, j.type, j.experience].filter(Boolean).join(' · ')}</em></span>
                  <span className="x-job-plus" aria-hidden="true">+</span>
                </summary>
                <div className="x-job-body">
                  {j.summary && <p>{j.summary}</p>}
                  {j.responsibilities?.length > 0 && <><h4>Responsibilities</h4><ul>{j.responsibilities.map((x, k) => <li key={k}>{x}</li>)}</ul></>}
                  {j.requirements?.length > 0 && <><h4>Requirements</h4><ul>{j.requirements.map((x, k) => <li key={k}>{x}</li>)}</ul></>}
                  <a className="x-link" href={`/careers/apply?job=${encodeURIComponent(j.jobId || j.title)}`}>Apply for this role <b>→</b></a>
                </div>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CareersPage() {
  return (
    <PageShell title="Careers">
      {(data) => (
        <>
          <PageHero
            crumbs={[['Careers']]}
            parts={[{ text: 'Careers at' }, { text: 'DSK Legal', as: 'em' }]}
            lede="We are committed to helping you build a long and fulfilling career at DSK Legal."
          />
          <section className="x-cr-photo" aria-label="The DSK Legal team">
            <div className="container"><img src="/img/careers.jpg" alt="The DSK Legal team" loading="lazy" /></div>
          </section>

          <Openings />

          <section className="x-sec x-values x-cr-values">
            <div className="container">
              <Reveal className="x-head">
                <p className="x-kicker">{tx('careers.culture.kicker', 'Our culture')}</p>
                <Typewriter parts={[{ text: 'What it’s like to' }, { text: 'work here', as: 'em' }]} />
              </Reveal>
              <div className="x-grid3">
                {VALUES.map((v, i) => (
                  <Reveal key={v.n} delay={(i % 3) * 120}>
                    <Spotlight className="x-card">
                      <span className="x-num">{v.n}</span>
                      <h3>{tx(`careers.v.${i + 1}.title`, v.title)}</h3>
                      <p>{tx(`careers.v.${i + 1}.text`, v.text)}</p>
                    </Spotlight>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          <section className="x-sec">
            <div className="container">
              <Reveal className="x-head">
                <p className="x-kicker">Join our team</p>
                <Typewriter parts={[{ text: 'Find your place at' }, { text: 'DSK Legal', as: 'em' }]} />
              </Reveal>
              <div className="x-cr-routes">
                {ROUTES.map((r, i) => (
                  <Reveal key={r.title} delay={i * 120}>
                    <Spotlight as="a" className="x-card x-cr-route" href={r.href}>
                      <h3>{r.title}</h3>
                      <p>{r.text}</p>
                      <span className="x-link">{r.cta} <b>→</b></span>
                    </Spotlight>
                  </Reveal>
                ))}
              </div>
              <p className="x-cr-offices"><b>Our offices:</b> {data.footer.offices.join(' · ')}</p>
              <p className="x-p">Questions? Write to <a className="x-link" href={`mailto:${siteEmail()}`}>{siteEmail()}</a>.</p>
            </div>
          </section>
          <CtaBand />
        </>
      )}
    </PageShell>
  );
}
