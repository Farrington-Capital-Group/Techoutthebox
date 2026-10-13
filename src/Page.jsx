import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import logoLight from './assets/full-log-lightmode.svg'
import logoDark from './assets/full-logo.svg'
import Constellation from './Constellation.jsx'
import { Arrow } from './Art.jsx'
import Link from './Link.jsx'
import { scrollToSection } from './scrollToSection.js'
import { navigate } from './routing.js'
import { supabase } from './supabase.js'
import { applyHead, CONTACT_EMAIL as EMAIL, PACKAGE_PRICE_USD } from './seo.js'

export const CONTACT_EMAIL = EMAIL
export const PACKAGE_PRICE = `$${PACKAGE_PRICE_USD}`

// Opens a Gmail compose window addressed to us. Unlike mailto:, it needs no mail app on the visitor's device.
const composeUrl = (subject = '', body = '') =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}${
    subject ? `&su=${encodeURIComponent(subject)}` : ''
  }${body ? `&body=${encodeURIComponent(body)}` : ''}`

export const composeProps = (subject = '') => ({
  href: composeUrl(subject),
  target: '_blank',
  rel: 'noopener noreferrer',
})
const YEAR = new Date().getFullYear()

// Hide the header while scrolling down; bring it back once scrolling stops
function useHideOnScroll(idleMs = 200) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    let timer

    const onScroll = () => {
      const y = window.scrollY
      if (y > lastY && y > 80) setHidden(true)
      else if (y < lastY) setHidden(false)
      lastY = y

      clearTimeout(timer)
      timer = setTimeout(() => setHidden(false), idleMs)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [idleMs])

  return hidden
}

// The hero stays pinned (see .hero-band); drift its text up slowly and fade it
// while the rest of the page scrolls over it
function useHeroParallax(ref) {
  useEffect(() => {
    const el = ref.current
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const update = () => {
      frame = 0
      const y = Math.min(window.scrollY, window.innerHeight)
      el.style.transform = `translateY(${-y * 0.3}px)`
      el.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.9)))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [ref])
}

// True once the white page content has scrolled up under the header
function useHeaderOnWhite(headerRef, contentRef) {
  const [onWhite, setOnWhite] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const headerMid = headerRef.current.offsetHeight / 2
      setOnWhite(contentRef.current.getBoundingClientRect().top <= headerMid)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [headerRef, contentRef])

  return onWhite
}

// True while any of the page's contact blocks (the CTA, the package price bar) is on screen,
// so the pinned phone button can get out of their way.
function useContactInView(rootRef) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const targets = [...rootRef.current.querySelectorAll('.cta, .package-summary')]
    const visible = new Set()
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target)
        else visible.delete(entry.target)
      }
      setInView(visible.size > 0)
    })
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [rootRef])

  return inView
}

// In-page links (#services, #contact) use scrollToSection, so the section's content ends up
// centred below the header instead of the browser's default top-edge alignment.
function useCenteredAnchors() {
  useEffect(() => {
    const onClick = (e) => {
      const link = e.target.closest('a[href^="#"]')
      if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return
      const target = document.getElementById(link.getAttribute('href').slice(1))
      if (!target) return
      e.preventDefault()
      scrollToSection(target, link.dataset.scrollThrough ?? target.dataset.scrollThrough)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
}

// Elements that fade/pop in the first time they scroll into view
const REVEAL = '.section-head, .card, .steps li, .cta:not(.cta-attached), .package-summary, .footer'

function useReveal(rootRef) {
  useLayoutEffect(() => {
    const root = rootRef.current
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (calm || !('IntersectionObserver' in window)) return

    // .services, .peekers and .backdrop only carry the "in" flag that starts their animations
    const items = [...root.querySelectorAll(`${REVEAL}, .services, .peekers, .backdrop`)]
    items.forEach((el) => {
      if (el.matches(REVEAL)) el.classList.add('reveal')
      // position among siblings staggers the animation
      el.style.setProperty('--i', [...el.parentElement.children].indexOf(el))
    })

    // Every time an element scrolls into view its animation plays; once it has fully left
    // the screen it is reset, so it plays again on the way back.
    let firstBatch = true
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target
          if (entry.intersectionRatio >= 0.12) {
            if (el.classList.contains('in')) continue
            // what is already on screen at load waits for the hero to finish first
            el.style.setProperty('--base', firstBatch ? '0.35s' : '0s')
            el.classList.add('in')
          } else if (entry.intersectionRatio === 0) {
            el.classList.remove('in')
          }
        }
        firstBatch = false
      },
      { threshold: [0, 0.12] },
    )
    items.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [rootRef])
}

// The hero's entrance animation plays again when you scroll back up to it: it is switched
// off once the white content has fully covered the hero, and back on as the hero re-emerges.
function useHeroReplay(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    const band = root.querySelector('.hero-band')
    let away = false
    let frame = 0

    const update = () => {
      frame = 0
      const covered = band.offsetHeight + 100
      const emerging = band.offsetHeight
      if (!away && window.scrollY > covered) {
        away = true
        root.classList.add('is-away')
      } else if (away && window.scrollY < emerging) {
        away = false
        root.classList.remove('is-away') // removing it restarts the animations
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [rootRef])
}

const OPEN_CONTACT = 'open-contact'

export function openContact(e) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  if (document.getElementById('contact')) window.dispatchEvent(new Event(OPEN_CONTACT))
  else navigate('/#contact')
}

// Step 1 is the "I want a website" button; clicking it swaps in the form (step 2).
// Sending saves the enquiry to the contact_messages table in Supabase.
// `attached` is for pages that already have their own button (the package page): the form
// stays folded away until that button opens it, then draws out below the section it sits in.
export function ContactCta({ attached = false }) {
  // 0 button, 1 form, 2 sent. Arriving at /#contact (from another page) starts on the form.
  const [stage, setStage] = useState(!attached && window.location.hash === '#contact' ? 1 : 0)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const sectionRef = useRef(null)
  const nameRef = useRef(null)

  // The header's "Get in touch" button: open the form, then scroll to it once it has rendered
  useEffect(() => {
    let timer
    const onOpen = () => {
      setStage((s) => Math.max(s, 1))
      if (attached) {
        // the form is still drawing out, so wait for it to finish, then frame the whole section
        const section = sectionRef.current.closest('section')
        timer = setTimeout(() => scrollToSection(section), 550)
      } else {
        requestAnimationFrame(() => requestAnimationFrame(() => scrollToSection(sectionRef.current)))
      }
    }
    window.addEventListener(OPEN_CONTACT, onOpen)
    return () => {
      window.removeEventListener(OPEN_CONTACT, onOpen)
      clearTimeout(timer)
    }
  }, [attached])

  // the button inside the panel: swap in the form, then centre the (now shorter) panel on screen
  const openForm = () => {
    setStage(1)
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToSection(sectionRef.current)))
  }

  // focus without letting the browser jump the page; the smooth scroll above does the moving
  useEffect(() => {
    if (stage === 1) nameRef.current.focus({ preventScroll: true })
  }, [stage])

  const onSubmit = async (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setSending(true)
    setError('')
    const { error } = await supabase.from('contact_messages').insert({
      name: data.get('name').trim(),
      email: data.get('email').trim(),
      phone: data.get('phone').trim(),
      message: data.get('message').trim(),
    })
    setSending(false)
    if (error) setError('Something went wrong sending your message. Please try again.')
    else setStage(2)
  }

  const cta = (
      <div className={`cta${stage === 1 ? ' cta-compact' : ''}${attached ? ' cta-attached' : ''}`}>
        <ol className="cta-progress" aria-label="Progress">
          {['Get started', 'Your details'].map((label, i) => (
            <li
              key={label}
              className={i === stage ? 'is-current' : i < stage ? 'is-done' : ''}
              aria-current={i === stage ? 'step' : undefined}
            >
              <span className="cta-progress-n">{i + 1}</span>
              <span className="cta-progress-label">{label}</span>
            </li>
          ))}
        </ol>
        <h2>{stage === 2 ? 'Thank you!' : 'Ready to get online?'}</h2>
        <p>
          {stage === 2
            ? 'We got your message and will be in touch soon.'
            : 'Tell us about your business and we’ll take it from there.'}
        </p>
        {stage === 0 && (
          <button type="button" className="btn btn-primary cta-open" onClick={openForm}>
            I want a website
          </button>
        )}
        {stage === 1 && (
        <form className="contact-form" onSubmit={onSubmit}>
          <label>
            Name
            <input ref={nameRef} name="name" type="text" autoComplete="name" required />
          </label>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="contact-wide">
            Phone number
            <input name="phone" type="tel" autoComplete="tel" required />
          </label>
          <label className="contact-wide">
            Message
            <textarea name="message" rows="3" required />
          </label>
          {error && (
            <p className="contact-error contact-wide" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary contact-wide" disabled={sending}>
            {sending ? 'Sending…' : <>Submit <Arrow /></>}
          </button>
        </form>
        )}
      </div>
  )

  if (attached) {
    return (
      <div className={`cta-drawer${stage > 0 ? ' is-open' : ''}`} ref={sectionRef}>
        <div className="cta-drawer-inner">{cta}</div>
      </div>
    )
  }

  return (
    <section id="contact" className="wrap" ref={sectionRef}>
      {cta}
    </section>
  )
}

// Shared layout: header, pinned black hero, white content sliding over it, footer
function Page({ path, hero, heroClass = '', pageClass = '', back, floatingLabel = 'Get in touch', children }) {
  const headerHidden = useHideOnScroll()
  const headerRef = useRef(null)
  const contentRef = useRef(null)
  const heroRef = useRef(null)
  const pageRef = useRef(null)
  const headerDark = useHeaderOnWhite(headerRef, contentRef)
  useHeroParallax(heroRef)
  useHeroReplay(pageRef)
  const contactInView = useContactInView(contentRef)
  useReveal(contentRef)
  useCenteredAnchors()
  // hidden over the hero, and again once the contact block itself is on screen
  const showMobileCta = headerDark && !contactInView

  useEffect(() => {
    applyHead(path)
  }, [path])

  return (
    <div id="top" ref={pageRef} className={pageClass}>
      <header
        ref={headerRef}
        className={`site-header${headerHidden ? ' is-hidden' : ''}${headerDark ? ' is-dark' : ''}`}
      >
        <div className="wrap nav">
          <Link to="/" className="logo">
            <img className="logo-light" src={logoLight} alt="techoutthebox" />
            <img className="logo-dark" src={logoDark} alt="" />
          </Link>
          {/* on the home page this opens the form in place; elsewhere it goes there first */}
          <a href="/#contact" onClick={openContact} className="btn btn-ghost nav-cta">
            Get in touch <Arrow />
          </a>
        </div>
      </header>

      {/* phones: the same button, pinned to the bottom of the screen. It lives outside the
          header because the header slides away on scroll and would take it along. It stays
          out of the way while the hero or the contact block is showing. */}
      <a
        href="/#contact"
        onClick={openContact}
        className={`btn btn-primary mobile-cta${showMobileCta ? ' is-shown' : ''}`}
        tabIndex={showMobileCta ? undefined : -1}
      >
        {floatingLabel} <Arrow />
      </a>

      <div className="hero-band">
        <Constellation />
        {back && <div className="wrap hero-back-wrap">{back}</div>}
        <section className={`wrap hero ${heroClass}`} ref={heroRef}>
          {hero}
        </section>
      </div>

      <div className="content" ref={contentRef}>
        <main>{children}</main>

        <footer className="wrap footer">
          <span>© {YEAR} techoutthebox</span>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </footer>
      </div>
    </div>
  )
}

export default Page
