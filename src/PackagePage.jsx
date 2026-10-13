import Page, { ContactCta, openContact, PACKAGE_PRICE } from './Page.jsx'
import { Arrow, DomainArt, EmailArt, HostingArt, Ribbon, Spark, WebsiteArt } from './Art.jsx'
import Link from './Link.jsx'
import { cardPointer } from './pointer.js'

const services = [
  {
    title: 'Domain Name',
    text: 'A name your customers can remember, searched, secured and registered for you.',
    Art: DomainArt,
  },
  {
    title: 'Business Email',
    text: 'Look professional with you@yourbusiness.com instead of a free inbox.',
    Art: EmailArt,
  },
  {
    title: 'Website Development',
    text: 'A clean, fast, mobile-friendly website designed around your business.',
    Art: WebsiteArt,
    featured: true,
  },
  {
    title: 'Hosting',
    text: 'Reliable, secure hosting so your site stays online and loads quickly.',
    Art: HostingArt,
  },
]

const hero = (
  <>
    <span className="eyebrow">Small business website package</span>
    <h1>
      Everything you need. <em>One price.</em>
    </h1>
    <p>
      Your domain name, business email, website and hosting, all set up for you
      in a single package.
    </p>
  </>
)

function PackagePage() {
  return (
    <Page path="/package" hero={hero}
      heroClass="hero-center"
      pageClass="page-package"
      floatingLabel="Get started"
      back={
        <Link to="/" className="hero-back">
          <Arrow /> Back to home
        </Link>
      }
    >
      <section className="wrap wrap-wide section services-section">
        <div className="section-head center">
          <h2>
            What’s included
            <Spark />
          </h2>
          <p>Four simple services that take you from idea to live website.</p>
        </div>
        <div className="services">
          <Ribbon />
          {services.map(({ title, text, Art, featured }, i) => (
            <article
              className={`card${featured ? ' card-featured' : ''}`}
              key={title}
              {...cardPointer}
            >
              <span className="card-num">0{i + 1}</span>
              {featured && <span className="card-badge">Most popular</span>}
              <div className="card-art">
                <Art />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="wrap section">
        <div className="package-summary">
          <div>
            <h2>Everything above, one price.</h2>
            <p>Domain, email, website and hosting.</p>
          </div>
          <div className="package-summary-buy">
            <span className="price">{PACKAGE_PRICE}</span>
            <a href="/#contact" onClick={openContact} className="btn btn-primary">
              Get started <Arrow />
            </a>
          </div>
        </div>
        <ContactCta attached />
      </section>

    </Page>
  )
}

export default PackagePage
