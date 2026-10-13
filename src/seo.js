// Single source of truth for SEO: used by the build (vite.config.js bakes it into each page's
// static HTML) and by Page.jsx (keeps the head in sync when navigating client-side).
// Plain JS with no imports, so the Vite config can load it too.

export const SITE_URL = 'https://techoutthebox.com' // no trailing slash
export const SITE_NAME = 'techoutthebox'
export const CONTACT_EMAIL = 'hello@techoutthebox.com'
export const PACKAGE_PRICE_USD = 250

// Social preview image (1200x630 PNG in /public). Left empty until one exists: set e.g. '/og-image.png'.
export const OG_IMAGE = ''

export const pages = {
  '/': {
    title: 'Affordable Website Design for Small Business | techoutthebox',
    description: `Affordable website design and development for small businesses. Professional website, domain name, business email and hosting, starting at $${PACKAGE_PRICE_USD}.`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description:
          'Affordable website design and development for small businesses: domain names, business email and hosting.',
        email: CONTACT_EMAIL,
        logo: `${SITE_URL}/icon.svg`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: `${SITE_URL}/`,
      },
    ],
  },
  '/package': {
    title: `Small Business Website Package, $${PACKAGE_PRICE_USD} | techoutthebox`,
    description: `A professional small business website for $${PACKAGE_PRICE_USD}: custom website development, domain name, business email and hosting, all set up for you.`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Small business website package',
        serviceType: 'Website design and development',
        description:
          'Professional, custom React website development for small businesses, including a domain name, business email and hosting, set up for you in a single package.',
        url: `${SITE_URL}/package`,
        provider: { '@type': 'Organization', name: SITE_NAME, url: `${SITE_URL}/` },
        offers: {
          '@type': 'Offer',
          price: String(PACKAGE_PRICE_USD),
          priceCurrency: 'USD',
          url: `${SITE_URL}/package`,
        },
      },
    ],
  },
}

export const canonicalUrl = (path) => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`)

const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// The <head> tags for one page, as an HTML string (used at build time).
export function headHtml(path) {
  const page = pages[path]
  const url = canonicalUrl(path)
  const image = OG_IMAGE ? `${SITE_URL}${OG_IMAGE}` : ''
  const meta = [
    `<title>${escapeAttr(page.title)}</title>`,
    `<meta name="description" content="${escapeAttr(page.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escapeAttr(page.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(page.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    image && `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${escapeAttr(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(page.description)}" />`,
    image && `<meta name="twitter:image" content="${image}" />`,
    ...page.jsonLd.map(
      // "<" escaped so the JSON can never close the script tag early
      (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`,
    ),
  ]
  return meta.filter(Boolean).join('\n    ')
}

export const robotsTxt = () => `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`

export const sitemapXml = () =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Object.keys(pages)
    .map((path) => `  <url><loc>${canonicalUrl(path)}</loc></url>`)
    .join('\n')}\n</urlset>\n`

// Client side: update the live document's head after a client-side navigation.
export function applyHead(path) {
  const page = pages[path]
  if (!page) return
  document.title = page.title
  const set = (selector, create, value) => {
    let el = document.head.querySelector(selector)
    if (!el) {
      el = create()
      document.head.appendChild(el)
    }
    el.setAttribute(el.tagName === 'LINK' ? 'href' : 'content', value)
  }
  const meta = (attr, name) => () => {
    const el = document.createElement('meta')
    el.setAttribute(attr, name)
    return el
  }
  const url = canonicalUrl(path)
  set('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), url)
  set('meta[name="description"]', meta('name', 'description'), page.description)
  set('meta[property="og:title"]', meta('property', 'og:title'), page.title)
  set('meta[property="og:description"]', meta('property', 'og:description'), page.description)
  set('meta[property="og:url"]', meta('property', 'og:url'), url)
  set('meta[name="twitter:title"]', meta('name', 'twitter:title'), page.title)
  set('meta[name="twitter:description"]', meta('name', 'twitter:description'), page.description)

  // swap the structured data for this page's
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach((el) => el.remove())
  for (const data of page.jsonLd) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
  }
}
