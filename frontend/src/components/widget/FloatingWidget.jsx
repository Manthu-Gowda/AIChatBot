import { useEffect, useState } from 'react'

export default function FloatingWidget(){
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState('')
  const [projectId, setProjectId] = useState('')

  async function openWidget(){
    try {
      // fetch current user id
      const base = (import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000'))
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

  const srcBase = (import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000')) + '/widget-layout'
  const src = token ? srcBase + `?token=${encodeURIComponent(token)}${projectId?`&projectId=${encodeURIComponent(projectId)}`:''}` : ''

  return (
    <>
      {/* Floating button */}
      <button onClick={openWidget} style={{ cursor: 'pointer', position:'fixed', right:10, bottom:5, borderRadius:999, padding:'6px 10px', background:'lightgrey', color:'#fff', border:0, boxShadow:'var(--shadow-md)', fontSize:"16px", zIndex:2147483647 }}>🤖</button>

      {/* Overlay + iframe */}
      {open && (
        <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.35)', zIndex:2147483646 }} />
      )}
      {open && (
        <iframe title="AI Chat Widget" src={src} style={{ width:'380px', height:'520px', position:'fixed', right:20, bottom:70, border:0, borderRadius:12, boxShadow:'0 20px 40px rgba(0,0,0,.2)', zIndex:2147483647, background:'#fff' }} />
      )}
    </>
  )
}
