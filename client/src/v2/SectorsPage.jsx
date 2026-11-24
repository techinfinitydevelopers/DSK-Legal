import { tx } from '../seo.js';
import PageShell, { PageHero } from './PageShell.jsx';
import { CtaBand } from './Sections2.jsx';
import { Reveal } from '../hooks.jsx';

/** /sectors — intro copy from dsklegal.com/sectors-and-industries; the sector list comes from the menu data (/api/home). */
export default function SectorsPage() {
  return (
    <PageShell title="Sectors & Industries">
      {() => <Sectors />}
    </PageShell>
  );
}

function Sectors() {
  return (
    <>
      <PageHero
        crumbs={[['Sectors & industries']]}
        parts={[{ text: 'Sectors &' }, { text: 'Industries', as: 'em' }]}
        lede="Tailored legal solutions across a diverse range of sectors and industries."
      />
      <section className="x-sec">
        <div className="container">
          <Reveal className="x-head x-sc-intro">
            <p className="x-kicker">{tx('sectors.page.kicker', 'Service sectors and industries')}</p>
            <p className="x-pg-lead">{tx('sectors.page.intro', `At DSK Legal, we leverage our extensive expertise across a diverse range of sectors and industries to provide tailored legal solutions. Our dedicated team of legal professionals understands the unique challenges faced by businesses in these fields and is committed to delivering comprehensive support to help our clients achieve their objectives while mitigating risks.`)}</p>
          </Reveal>
        </div>
      </section>
      <section className="x-sec x-sc-form">
        <div className="container">
          <Reveal className="x-head">
            <p className="x-kicker">{tx('sectors.form.kicker', 'Practice area credentials')}</p>
            <h2 className="x-h2">{tx('sectors.form.title', 'Request our credentials')}</h2>
            <p className="x-p">{tx('sectors.form.intro', 'Share your details and we will send you our practice area credentials.')}</p>
          </Reveal>
          <div className="x-sc-card"><iframe title="Request Practice Area Credentials" src="https://forms.office.com/Pages/ResponsePage.aspx?id=ML-7VIzDHEq3o47cuBDakhZWpeFAss5Ks8FAYhqFQNhUM0U4SDY5QVFTT1JSTUE4UVU5Q0gyQTNLWi4u&embed=true" loading="lazy" /></div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
