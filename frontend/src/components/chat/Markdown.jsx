import { useEffect, useMemo, useRef } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import styles from './Markdown.module.scss'

marked.setOptions({
  gfm: true,
  breaks: true,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
})

export default function Markdown({ content }){
  const containerRef = useRef(null)
  const html = useMemo(() => {
    try {
      const raw = marked.parse(content || '')
      return DOMPurify.sanitize(raw)
    } catch { return '' }
  }, [content])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    // Add copy buttons to code blocks
    const pres = el.querySelectorAll('pre')
    pres.forEach((pre) => {
      if (pre.querySelector('button.'+styles.copyBtn)) return
      const btn = document.createElement('button')
      btn.className = styles.copyBtn
      btn.textContent = 'Copy'
      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code')?.innerText || ''
        try { await navigator.clipboard.writeText(code) ; btn.textContent = 'Copied'; setTimeout(()=> btn.textContent='Copy', 1500) } catch {}
      })
      pre.appendChild(btn)
    })
  }, [html])

  return <div ref={containerRef} className={styles.markdown} dangerouslySetInnerHTML={{ __html: html }} />
}

