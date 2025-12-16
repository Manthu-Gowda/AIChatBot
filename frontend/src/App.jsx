import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Forgot from './pages/auth/Forgot'
import Reset from './pages/auth/Reset'
import Chat from './pages/chat/Chat'
import General from './pages/settings/General'
import Profile from './pages/settings/Profile'
import NewProject from './pages/projects/NewProject'
import Projects from './pages/projects/Projects'
import ProjectChat from './pages/projects/ProjectChat'
import { getToken } from './lib/api'
import FloatingWidget from './components/widget/FloatingWidget'
import Markdown from './components/chat/Markdown'
import Message from './components/chat/Message'
import Button from './components/ui/Button'
import { TextArea } from './components/ui/Input'

function Protected({ children }) {
  const token = getToken()
  const loc = useLocation()
  if (!token) return <Navigate to="/" state={{ from: loc }} replace />
  return <>
    {children}
    <FloatingWidget />
  </>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/reset" element={<Reset />} />

      <Route path="/chat" element={<Protected><Chat /></Protected>} />
      {/* <Route path="/settings/general" element={<Protected><General /></Protected>} /> */}
      <Route path="/settings/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/projects" element={<Protected><Projects /></Protected>} />
      <Route path="/projects/new" element={<Protected><NewProject /></Protected>} />
      <Route path="/projects/:id/edit" element={<Protected><NewProject /></Protected>} />
      <Route path="/projects/:id/chat" element={<Protected><ProjectChat /></Protected>} />

      <Route path="/widget-layout" element={<WidgetLayout />} />
    </Routes>
  )
}

function WidgetLayout() {
  const token = new URLSearchParams(window.location.search).get('token')
  const projectId = new URLSearchParams(window.location.search).get('projectId')
  const [msg, setMsg] = useState('')
  const [list, setList] = useState([])
  const [pending, setPending] = useState(false)
  const listRef = useRef(null)
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }) }, [list])

  async function send() {
    if (!msg.trim()) return
    const { getBackendBaseUrl } = await import('./lib/baseUrl')
    const base = getBackendBaseUrl()
    setList((l) => [...l, { role: 'user', content: msg, ts: Date.now() }, { role: 'assistant', content: '', ts: Date.now() }])
    setPending(true)
    const res = await fetch(base + '/widget/chat?stream=1', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'text/event-stream' },
      body: JSON.stringify({ message: msg, projectId: "694101fff7c8ce71eee6d548" })
    })
    if (!res.ok) {
      setList((l) => { const copy = [...l]; const idx = copy.length - 1; copy[idx] = { ...copy[idx], content: 'Request failed' }; return copy })
      setMsg('')
      setPending(false)
      return
    }
    const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = ''
    const append = (t) => { setList((l) => { const copy = [...l]; const idx = copy.length - 1; copy[idx] = { ...copy[idx], content: (copy[idx].content || '') + t }; return copy }) }
    while (true) {
      const { value, done } = await reader.read(); if (done) break
      buffer += decoder.decode(value, { stream: true })
      let sep; while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const chunk = buffer.slice(0, sep); buffer = buffer.slice(sep + 2)
        const line = chunk.trim(); if (!line.startsWith('data:')) continue
        const dataStr = line.slice(5).trim(); if (dataStr === '[DONE]') break
        try { const obj = JSON.parse(dataStr); if (obj?.token) append(obj.token) } catch { append(dataStr) }
      }
    }
    setMsg('')
    setPending(false)
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif', background: 'var(--color-bg)', color: 'var(--color-text)', height: '100vh', display: 'flex', flexDirection: 'column', padding: 12 }}>
      <div className="card" style={{ marginBottom: 10, padding: 12, background: '#fff' }}>
        <div style={{ fontWeight: 700 }}>AI Chat</div>
      </div>
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', padding: 0 }}>
        <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map((m, i) => {
            const isLast = i === list.length - 1
            const showTyping = isLast && m.role === 'assistant' && pending && !m.content
            return (
              <Message key={i} role={m.role} content={m.content} ts={m.ts || Date.now()} typing={showTyping} />
            )
          })}
        </div>
        <div style={{ background: '#fff', borderTop: '1px solid var(--border)', padding: 12 }}>
          <div>
            <TextArea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type your message..." style={{ flex: 1, height: 80 }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
            <Button onClick={send}>Send</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
