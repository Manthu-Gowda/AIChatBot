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
  const title = new URLSearchParams(window.location.search).get('title') || 'AI Chat'
  const [msg, setMsg] = useState('')
  const [list, setList] = useState([])
  const [pending, setPending] = useState(false)
  const listRef = useRef(null)

  // Auto-scroll logic
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [list, pending])

  async function send() {
    if (!msg.trim()) return
    const { getBackendBaseUrl } = await import('./lib/baseUrl')
    const base = getBackendBaseUrl()
    setList((l) => [...l, { role: 'user', content: msg, ts: Date.now() }, { role: 'assistant', content: '', ts: Date.now() }])
    setMsg('') // Clear immediately
    setPending(true)

    try {
      const res = await fetch(base + '/widget/chat?stream=1', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'text/event-stream' },
        body: JSON.stringify({ message: msg, projectId: projectId })
      })
      if (!res.ok) throw new Error('Failed')

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
    } catch (e) {
      setList((l) => { const copy = [...l]; const idx = copy.length - 1; copy[idx] = { ...copy[idx], content: 'Sorry, something went wrong.' }; return copy })
    } finally {
      setPending(false)
    }
  }

  // Styles to hide scrollbar but keep functionality
  const noScrollbarStyle = {
    msOverflowStyle: 'none',  /* IE and Edge */
    scrollbarWidth: 'none',  /* Firefox */
  }

  return (
    <div style={{
      fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      background: '#fff',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden' // Prevent body scroll
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #eee',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div style={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>{title}</div>
      </div>

      {/* Chat List */}
      <div ref={listRef} style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        ...noScrollbarStyle
      }}>
        {/* Inject CSS to hide webkit scrollbar */}
        <style>{`
          div::-webkit-scrollbar { display: none; }
          .widget-input-row {
             display: flex;
             gap: 8px;
             align-items: flex-end;
             background: #f9fafb;
             border-radius: 12px;
             padding: 8px;
          }
           @media (max-width: 480px) {
            .widget-input-row {
              flex-direction: column;
              align-items: stretch;
            }
          }
        `}</style>

        {list.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '40px', color: '#9ca3af', fontSize: '14px' }}>
            <p>👋 Hi there! How can I help you today?</p>
          </div>
        )}

        {list.map((m, i) => {
          const isUser = m.role === 'user'
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%',
                padding: '12px 16px',
                borderRadius: '12px',
                background: isUser ? '#111827' : '#f3f4f6',
                color: isUser ? '#fff' : '#1f2937',
                fontSize: '14px',
                lineHeight: '1.5',
                borderBottomRightRadius: isUser ? '2px' : '12px',
                borderBottomLeftRadius: isUser ? '12px' : '2px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                {/* Simple text rendering for now, or Markdown component if imported */}
                {m.content}
                {i === list.length - 1 && pending && m.role === 'assistant' && !m.content && (
                  <span className="dot-typing">...</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Input Area */}
      <div style={{ padding: '16px', borderTop: '1px solid #eee', background: '#fff' }}>
        <div className="widget-input-row">
          <TextArea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Type your message..."
            style={{
              flex: 1,
              width: '100%', // FORCE WIDTH FIX
              minWidth: 0, // FLEXBOX OVERFLOW FIX
              minHeight: '24px',
              maxHeight: '100px',
              background: 'transparent',
              border: 0,
              padding: '8px',
              resize: 'none',
              outline: 'none',
              fontSize: '14px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send()
              }
            }}
          />
          <Button
            onClick={send}
            disabled={!msg.trim() || pending}
            style={{
              borderRadius: '8px',
              padding: '8px 12px',
              height: '36px',
              opacity: (!msg.trim() || pending) ? 0.5 : 1,
              flexShrink: 0
            }}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
