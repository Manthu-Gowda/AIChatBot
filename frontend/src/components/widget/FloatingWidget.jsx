import { useEffect, useState } from 'react'

export default function FloatingWidget(){
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState('')
  const [projectId, setProjectId] = useState('')

  async function openWidget(){
    try {
      // fetch current user id
      const { getBackendBaseUrl } = await import('../../lib/baseUrl')
      const base = getBackendBaseUrl()
      const meRes = await fetch(base + '/me', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      const me = await meRes.json()
      if (!me?.id) throw new Error('No user')
      const tRes = await fetch(base + '/widget/token', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId: me.id, projectId })
      })
      const t = await tRes.json()
      if (!t?.token) throw new Error('No token')
      setToken(t.token)
      setOpen(true)
    } catch (e) {
      console.error('Open widget failed')
    }
  }

  useEffect(()=>{
    function onKey(e){ if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  },[])

  const srcBase = (typeof window !== 'undefined' ? window.location.origin : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000')) + '/widget-layout'
  const src = token ? srcBase + `?token=${encodeURIComponent(token)}${projectId?`&projectId=${encodeURIComponent(projectId)}`:''}` : ''

  return (
    <>
      {/* Floating button */}
      <button 
        onClick={openWidget} 
        style={{ 
          cursor: 'pointer', 
          position: 'fixed', 
          right: 10, 
          bottom: 10, 
          borderRadius: '50%', 
          width: '50px',
          height: '50px',
          padding: 0,
          background: 'linear-gradient(135deg, #ffa347 0%, rgb(247, 126, 35) 100%)', 
          color: '#fff', 
          border: 0, 
          boxShadow: '0 8px 24px rgba(247, 126, 35, 0.3)',
          fontSize: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          zIndex: 2147483647
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(247, 126, 35, 0.4)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(247, 126, 35, 0.3)'
        }}
      >
        🤖
      </button>

      {/* Overlay + iframe */}
      {open && (
        <div 
          onClick={()=>setOpen(false)} 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(82, 82, 82, 0.5)', 
            backdropFilter: 'blur(4px)',
            zIndex: 2147483646,
            animation: 'fadeIn 0.2s ease'
          }} 
        />
      )}
      {open && (
        <iframe 
          title="AI Chat Widget" 
          src={src} 
          style={{ 
            width: '420px', 
            height: '600px', 
            maxWidth: 'calc(100vw - 40px)',
            maxHeight: 'calc(100vh - 100px)',
            position: 'fixed', 
            right: 20, 
            bottom: 100, 
            border: '2px solid var(--border)', 
            borderRadius: '16px', 
            boxShadow: '0 20px 60px rgba(0,0,0,.25)', 
            zIndex: 2147483647, 
            background: '#fff',
            animation: 'slideUp 0.3s ease'
          }} 
        />
      )}
    </>
  )
}
