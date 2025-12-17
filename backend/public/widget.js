;(function () {
  const script = document.currentScript
  const src = new URL(script.src)
  const base = `${src.protocol}//${src.host}`
  const tenantId = script.getAttribute('data-tenant')
  const projectId = script.getAttribute('data-project')
  const title = script.getAttribute('data-title') || 'AI Chat'

  // Launcher Button
  const btn = document.createElement('div')
  // Robo Icon SVG
  btn.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 4C14.21 4 16 5.79 16 8C16 10.21 14.21 12 12 12C9.79 12 8 10.21 8 8C8 5.79 9.79 4 12 4ZM12 20C9.33 20 7 18 7 15C7 14.4 7.15 13.84 7.42 13.35C8.63 13.79 9.94 14.08 11.3 14.15C11.53 14.16 11.76 14.16 12 14.16C12.24 14.16 12.47 14.16 12.7 14.15C14.06 14.08 15.37 13.79 16.58 13.35C16.85 13.84 17 14.4 17 15C17 18 14.67 20 12 20ZM12 16.5C12.83 16.5 13.5 15.83 13.5 15C13.5 14.17 12.83 13.5 12 13.5C11.17 13.5 10.5 14.17 10.5 15C10.5 15.83 11.17 16.5 12 16.5Z" fill="white"/>
      <circle cx="9" cy="8" r="1.5" fill="white"/>
      <circle cx="15" cy="8" r="1.5" fill="white"/>
    </svg>
  `
  btn.style.position = 'fixed'
  btn.style.right = '20px'
  btn.style.bottom = '20px'
  btn.style.width = '56px'
  btn.style.height = '56px'
  btn.style.borderRadius = '50%'
  btn.style.background = '#111827'
  btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
  btn.style.cursor = 'pointer'
  btn.style.display = 'flex'
  btn.style.alignItems = 'center'
  btn.style.justifyContent = 'center'
  btn.style.zIndex = '2147483647'
  btn.style.transition = 'transform 0.2s ease'
  btn.onmouseenter = () => btn.style.transform = 'scale(1.05)'
  btn.onmouseleave = () => btn.style.transform = 'scale(1)'
  document.body.appendChild(btn)

  // Overlay
  const overlay = document.createElement('div')
  overlay.style.position = 'fixed'
  overlay.style.inset = '0'
  overlay.style.background = 'rgba(0,0,0,0.2)'
  overlay.style.display = 'none'
  overlay.style.zIndex = '2147483646'
  overlay.style.backdropFilter = 'blur(2px)'
  document.body.appendChild(overlay)

  // Iframe Container
  const iframe = document.createElement('iframe')
  iframe.title = title
  iframe.style.position = 'fixed'
  iframe.style.right = '20px'
  iframe.style.bottom = '90px'
  iframe.style.width = '400px'
  iframe.style.height = '600px'
  iframe.style.maxHeight = '80vh'
  iframe.style.maxWidth = '90vw' // Responsive mobile
  iframe.style.border = '0'
  iframe.style.borderRadius = '16px'
  iframe.style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)'
  iframe.style.display = 'none'
  iframe.style.zIndex = '2147483647'
  iframe.style.background = 'white'
  document.body.appendChild(iframe)

  function close() {
    overlay.style.display = 'none'
    iframe.style.display = 'none'
    btn.style.display = 'flex'
  }

  overlay.addEventListener('click', close)
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })

  async function openWidget() {
    if (iframe.style.display === 'block') {
      close()
      return
    }
    try {
      // Get token first
      const resp = await fetch(base + '/widget/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, projectId })
      })
      const data = await resp.json()
      if (!data.token) throw new Error('No widget token')

      // Show UI
      overlay.style.display = 'block'
      iframe.style.display = 'block'
      // Animate open
      iframe.style.opacity = '0'
      iframe.style.transform = 'translateY(20px)'
      requestAnimationFrame(() => {
        iframe.style.transition = 'opacity 0.2s ease, transform 0.2s ease'
        iframe.style.opacity = '1'
        iframe.style.transform = 'translateY(0)'
      })

      // Load URL if not loaded
      if (!iframe.src) {
        const url = new URL(base + '/widget-layout')
        url.searchParams.set('token', data.token)
        if (projectId) url.searchParams.set('projectId', projectId)
        if (title) url.searchParams.set('title', title)
        iframe.src = url.toString()
      }
    } catch (e) {
      console.error('Widget open failed', e)
    }
  }

  btn.addEventListener('click', openWidget)
})()

