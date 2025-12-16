import * as cheerio from 'cheerio'

export async function scrapeWebsite(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`)
    
    const html = await res.text()
    const $ = cheerio.load(html)
    
    // Remove scripts, styles, and other non-content elements
    $('script').remove()
    $('style').remove()
    $('noscript').remove()
    $('iframe').remove()
    $('header').remove()
    $('footer').remove()
    $('nav').remove()

    // Extract text from body
    // We can focus on p, h1-h6, li, etc. or just get body text
    // Let's try to be smart and get main content if possible, or body fallback
    const content = $('main').length ? $('main').text() : $('body').text()
    
    // Clean up whitespace
    return content.replace(/\s+/g, ' ').trim().slice(0, 20000) // Limit to ~20k chars context
  } catch (e: any) {
    console.error('Scraping failed:', e)
    throw new Error(`Scraping failed: ${e.message}`)
  }
}
