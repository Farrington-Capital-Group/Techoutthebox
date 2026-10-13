import Page, { ContactCta, PACKAGE_PRICE } from './Page.jsx'
import { Arrow, PackageArt, Spark } from './Art.jsx'
import Link from './Link.jsx'
import Backdrop from './Backdrop.jsx'
import Peekers from './Peekers.jsx'
import { cardPointer } from './pointer.js'

const steps = [
  { title: 'Tell us about your business', text: 'A quick chat about what you do and who you serve.' },
  { title: 'We build everything', text: 'Domain, email, website and hosting, all set up for you.' },
  { title: 'You go live', text: 'Launch with confidence and start getting found online.' },
]

const hero = (
  <>
    <span className="eyebrow">Affordable website design for small business</span>
    <h1>
      Get your business online. <em>Out of the box.</em>
    </h1>
    <p>
      Professional website design and development, plus your domain, email and
      hosting, all in one place. We handle the tech so you can focus on your
      business.
    </p>
    <div className="hero-actions">
      <a href="#how" className="btn btn-primary">
        Start your website
      </a>
      <a href="#services" className="btn btn-ghost">
        See what we offer
      </a>
    </div>
  </>
)

function HomePage() {
  return (
    <Page path="/" hero={hero}>
      <section id="services" className="wrap section services-section">
        <div className="section-head center">
          <h2>
            Everything you need.
            <Spark />
          </h2>
          <p>Four simple services that take you from idea to live website.</p>
        </div>

        <div className="package-stage">
          <Backdrop />
          <Peekers />
          <article className="card card-featured package-card" {...cardPointer}>
            <div className="card-art">
              <PackageArt />
            </div>
            <h3>Everything you need is in this package.</h3>
            <div className="package-foot">
              <span className="price">{PACKAGE_PRICE}</span>
              {/* the link stretches over the whole card, so the entire card is clickable */}
              <Link to="/package" className="btn btn-primary package-link">
                View <Arrow />
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* scrolling here also keeps the "Ready to get online?" block (#contact) in view */}
      <section id="how" data-scroll-through="contact" className="wrap section">
        <div className="section-head">
          <h2>Simple from start to finish.</h2>
        </div>
        <ol className="steps">
          {steps.map((s, i) => (
            <li key={s.title}>
              <span className="step-n">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <ContactCta />
    </Page>
  )
}

export default HomePage
