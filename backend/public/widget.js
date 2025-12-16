;(function () {
  const script = document.currentScript
  const src = new URL(script.src)
  const base = `${src.protocol}//${src.host}`
  const tenantId = script.getAttribute('data-tenant')
  const projectId = script.getAttribute('data-project')

  const btn = document.createElement('button')
  btn.style.display = 'flex'
  btn.style.alignItems = 'center'
  btn.style.justifyContent = 'center'
  // Default text; may be replaced with project logo if configured
  btn.textContent = 'Chat'
  btn.style.position = 'fixed'
  btn.style.right = '20px'
  btn.style.bottom = '20px'
  btn.style.padding = '10px 14px'
  btn.style.borderRadius = '999px'
  btn.style.background = '#111827'
  btn.style.color = 'white'
  btn.style.zIndex = '2147483647'
  document.body.appendChild(btn)

  // Project logo feature removed — default button text is shown

  const overlay = document.createElement('div')
  overlay.style.position = 'fixed'
  overlay.style.inset = '0'
  overlay.style.background = 'rgba(0,0,0,0.3)'
  overlay.style.display = 'none'
  overlay.style.zIndex = '2147483646'
  document.body.appendChild(overlay)

  const iframe = document.createElement('iframe')
  iframe.title = 'AI Chat Widget'
  iframe.style.width = '90%'
  iframe.style.maxWidth = '420px'
  iframe.style.height = '70%'
  iframe.style.border = '0'
  iframe.style.borderRadius = '12px'
  iframe.style.position = 'fixed'
  iframe.style.right = '20px'
  iframe.style.bottom = '70px'
  iframe.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)'
  iframe.style.display = 'none'
  iframe.style.zIndex = '2147483647'
  document.body.appendChild(iframe)

  function close() {
    overlay.style.display = 'none'
    iframe.style.display = 'none'
  }

  overlay.addEventListener('click', close)
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })

  async function openWidget() {
    try {
      const resp = await fetch(base + '/widget/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId, projectId }) })
      const data = await resp.json()
      if (!data.token) throw new Error('No widget token')
      overlay.style.display = 'block'
      iframe.style.display = 'block'
      const url = new URL(base + '/widget-layout')
      url.searchParams.set('token', data.token)
      if (projectId) url.searchParams.set('projectId', projectId)
      iframe.src = url.toString()
    } catch (e) {
      console.error('Widget open failed')
    }
  }

  btn.addEventListener('click', openWidget)
})()

