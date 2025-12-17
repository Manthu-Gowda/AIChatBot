; (function () {
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
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot-message-square-icon lucide-bot-message-square"><path d="M12 6V2H8"/><path d="M15 11v2"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M20 16a2 2 0 0 1-2 2H8.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 4 20.286V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/><path d="M9 11v2"/></svg>
  `
  btn.style.position = 'fixed'
  btn.style.right = '20px'
  btn.style.bottom = '20px'
  btn.style.width = '56px'
  btn.style.height = '56px'
  btn.style.borderRadius = '50%'
  btn.style.background = 'linear-gradient(135deg, #ffa347 0%, rgb(247, 126, 35) 100%)'
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

