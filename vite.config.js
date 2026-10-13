import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { headHtml, pages, robotsTxt, sitemapXml } from './src/seo.js'

// After the build, writes one static HTML file per page (/index.html, /package/index.html) with
// that page's title, description, canonical, social tags and structured data already in the
// <head>, so crawlers and link previews see them without running any JavaScript. Also writes
// robots.txt and sitemap.xml. The host serves these files before falling back to index.html.
function seo() {
  let outDir
  return {
    name: 'seo',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir)
    },
    async closeBundle() {
      const template = await readFile(join(outDir, 'index.html'), 'utf8')
      if (!template.includes('<!--seo-head-->')) throw new Error('index.html is missing <!--seo-head-->')

      for (const path of Object.keys(pages)) {
        const dir = path === '/' ? outDir : join(outDir, path)
        await mkdir(dir, { recursive: true })
        await writeFile(join(dir, 'index.html'), template.replace('<!--seo-head-->', headHtml(path)))
      }
      await writeFile(join(outDir, 'robots.txt'), robotsTxt())
      await writeFile(join(outDir, 'sitemap.xml'), sitemapXml())
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    seo(),
  ],
})
