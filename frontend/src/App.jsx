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

  // State: 'START', 'ROLE', 'TOPIC', 'NAME', 'EMAIL', 'OTP', 'PHONE', 'CHAT'
  const [step, setStep] = useState('ROLE')
  const [msg, setMsg] = useState('')
  const [list, setList] = useState([])
  const [pending, setPending] = useState(false)
  const listRef = useRef(null)

  // Inquiry Data
  const [inquiry, setInquiry] = useState({ role: '', topic: '', name: '', email: '', phone: '' })
  const [otpSent, setOtpSent] = useState(false)

  // Initial greeting
  useEffect(() => {
    if (step === 'ROLE' && list.length === 0) {
      setList([{ role: 'assistant', content: 'Hi there! To better assist you, could you please tell me who you are?', type: 'system' }])
    }
  }, [step])

  // Auto-scroll logic
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [list, pending, step])

  async function handleSend() {
    if (!msg.trim()) return
    const text = msg.trim()
    setMsg('')

    // Add user message
    setList(prev => [...prev, { role: 'user', content: text }])

    const { getBackendBaseUrl } = await import('./lib/baseUrl')
    const base = getBackendBaseUrl()

    try {
      if (step === 'ROLE') {
        const role = text // User typed role
        setInquiry(p => ({ ...p, role }))
        setList(p => [...p, { role: 'assistant', content: 'Great! What topic are you interested in?', type: 'system' }])
        setStep('TOPIC')
      }
      else if (step === 'TOPIC') {
        setInquiry(p => ({ ...p, topic: text }))
        setList(p => [...p, { role: 'assistant', content: 'Got it. May I know your name?', type: 'system' }])
        setStep('NAME')
      }
      else if (step === 'NAME') {
        setInquiry(p => ({ ...p, name: text }))
        setList(p => [...p, { role: 'assistant', content: 'Nice to meet you. Please enter your email address so we can verify you.', type: 'system' }])
        setStep('EMAIL')
      }
      else if (step === 'EMAIL') {
        // Simple regex validation
        if (!/\S+@\S+\.\S+/.test(text)) {
          setList(p => [...p, { role: 'assistant', content: 'Please enter a valid email address.', type: 'error' }])
          return
        }
        setInquiry(p => ({ ...p, email: text }))
        setPending(true)
        // Send OTP
        const res = await fetch(`${base}/widget/otp/send`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: text })
        })
        const data = await res.json()
        setPending(false)
        if (data.error) throw new Error(data.error)

        setList(p => [...p, { role: 'assistant', content: `An OTP has been sent to ${text}. Please enter the code below.`, type: 'system' }])
        setStep('OTP')
      }
      else if (step === 'OTP') {
        setPending(true)
        const res = await fetch(`${base}/widget/otp/verify`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: inquiry.email, code: text })
        })
        const data = await res.json()
        setPending(false)
        if (data.error) {
          setList(p => [...p, { role: 'assistant', content: 'Invalid OTP. Please try again.', type: 'error' }])
          return
        }

        setList(p => [...p, { role: 'assistant', content: 'Email verified! Lastly, please enter your phone number.', type: 'system' }])
        setStep('PHONE')
      }
      else if (step === 'PHONE') {
        setInquiry(p => ({ ...p, phone: text }))
        setPending(true)

        // Save Inquiry
        const finalInquiry = { ...inquiry, phone: text, projectId }
        await fetch(`${base}/widget/inquiry`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalInquiry)
        })

        setPending(false)
        setList(p => [...p, { role: 'assistant', content: 'Thank you! You can now start chatting with our AI.', type: 'system' }])
        setStep('CHAT')
        // Initial AI greeting based on context
        startChat(finalInquiry)
      }
      else if (step === 'CHAT') {
        // Normal Chat Flow
        doChat(text)
      }
    } catch (e) {
      setList(p => [...p, { role: 'assistant', content: `Error: ${e.message}`, type: 'error' }])
      setPending(false)
    }
  }

  async function startChat(inq) {
    // Trigger initial AI response based on context
    const prompt = `Hello, I am ${inq.name}, a ${inq.role}. I am interested in ${inq.topic}.`
    await doChat(prompt)
  }

  async function doChat(text) {
    const { getBackendBaseUrl } = await import('./lib/baseUrl')
    const base = getBackendBaseUrl()
    setList(l => [...l, { role: 'assistant', content: '', ts: Date.now() }])
    setPending(true)

    try {
      const res = await fetch(base + '/widget/chat?stream=1', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'text/event-stream' },
        body: JSON.stringify({ message: text, projectId: projectId, context: inquiry })
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

  // Handle Role Button Clicks
  function setRole(r) {
    setMsg(r) // Fill input
    // Or auto-submit? let's auto submit for UX
    setList(prev => [...prev, { role: 'user', content: r }])
    setInquiry(p => ({ ...p, role: r }))
    handleRoleSelection(r)
  }

  async function handleRoleSelection(r) {
    setList(p => [...p, { role: 'assistant', content: 'Great! What topic are you interested in?', type: 'system' }])
    setStep('TOPIC')
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
        {step === 'ROLE' ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Parent', 'Teacher', 'Student'].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{
                padding: '8px 16px', borderRadius: '16px', border: '1px solid #4F46E5', background: '#EEF2FF', color: '#4F46E5', cursor: 'pointer', fontWeight: 500
              }}>
                {r}
              </button>
            ))}
          </div>
        ) : (
          <div className="widget-input-row">
            <TextArea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder={
                step === 'TOPIC' ? 'Enter topic...' :
                  step === 'NAME' ? 'Enter your name...' :
                    step === 'EMAIL' ? 'Enter your email...' :
                      step === 'OTP' ? 'Enter correct OTP...' :
                        step === 'PHONE' ? 'Enter phone number...' :
                          "Type your message..."
              }
              style={{
                flex: 1,
                width: '100%',
                minWidth: 0,
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
                  handleSend()
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={!msg.trim() || pending}
              style={{
                borderRadius: '8px',
                padding: '8px 12px',
                height: '36px',
                opacity: (!msg.trim() || pending) ? 0.5 : 1,
                flexShrink: 0
              }}
            >
              {step === 'OTP' ? 'Verify' : 'Send'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
