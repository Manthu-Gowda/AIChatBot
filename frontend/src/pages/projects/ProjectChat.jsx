import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { api } from '../../lib/api'
import Message from '../../components/chat/Message'
import Button from '../../components/ui/Button'
import { Select, TextArea } from '../../components/ui/Input'

export default function ProjectChat(){
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [message, setMessage] = useState('')
  const [list, setList] = useState([])
  const [provider, setProvider] = useState('OPENAI')
  const [convId, setConvId] = useState(null)
  const [pending, setPending] = useState(false)
  const abortRef = useRef(null)
  useEffect(()=>{ (async()=>{ try { const { data } = await api.get('/projects/'+id); setProject(data) } catch {} })() },[id])
  async function send(){
    if (!message.trim()) return
    const userText = message
    setMessage('')
    setList(l=>[...l,{ role:'user', content: userText, ts: Date.now() }, { role:'assistant', content:'', ts: Date.now() }])
    setPending(true)
    try {
      const controller = new AbortController(); abortRef.current = controller
      const base = (import.meta.env.VITE_BACKEND_URL || window.location.origin)
      const res = await fetch(base + '/chat?stream=1', {
        method:'POST', headers:{ 'Content-Type':'application/json', Accept: 'text/event-stream', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ message: userText, provider, projectId: id, conversationId: convId || undefined }), signal: controller.signal
      })
      if (!res.ok){ const data = await res.json().catch(()=>({})); throw new Error(data?.error?.message || 'Request failed') }
      const reader = res.body.getReader(); const decoder = new TextDecoder()
      let buffer = ''
      const append = (t) => { setList(l=>{ const copy=[...l]; const idx=copy.length-1; copy[idx] = { ...copy[idx], content: (copy[idx].content||'') + t }; return copy }) }
      while(true){
        const { value, done } = await reader.read(); if (done) break
        buffer += decoder.decode(value, { stream: true })
        let sep; while((sep = buffer.indexOf('\n\n')) !== -1){
          const chunk = buffer.slice(0, sep); buffer = buffer.slice(sep+2)
          const line = chunk.trim(); if (!line.startsWith('data:')) continue
          const dataStr = line.slice(5).trim(); if (dataStr === '[DONE]') break
          try { const obj = JSON.parse(dataStr); if (obj?.token) append(obj.token) } catch { append(dataStr) }
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') { setList(l=>{ const copy=[...l]; const idx=copy.length-1; copy[idx] = { ...copy[idx], content: (copy[idx].content||'') + "\n\n" + (e.message||'Request failed') }; return copy }) }
    } finally { setPending(false) }
  }
  function stop(){ abortRef.current?.abort(); setPending(false) }
  const listRef = useRef(null)
  useEffect(()=>{ listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior:'smooth' }) }, [list])
  if (!project) return null
  return (
    <AppLayout title={`Chatting in ${project.name} context`}>
      <div className="card" style={{ marginBottom: 12, display:'flex', gap:12, alignItems:'center' }}>
        <div>Provider</div>
        <Select value={provider} onChange={e=>setProvider(e.target.value)}>
          <option>OPENAI</option><option>DEEPSEEK</option><option>GEMINI</option><option>PERPLEXITY</option>
        </Select>
      </div>
      <div className="card" style={{ height: 'calc(100vh - 300px)', background:'#fff', padding:0, display:'flex', flexDirection:'column' }}>
        <div ref={listRef} style={{ flex:1, overflow:'auto', padding:12, display:'flex', flexDirection:'column', gap:12 }}>
          {list.map((m,i)=> <Message key={i} role={m.role} content={m.content} ts={m.ts || Date.now()} />)}
        </div>
        <div style={{ background:'#fff', borderTop:'1px solid var(--border)', padding:12 }}>
          <div style={{ display:'flex', gap:12, alignItems:'flex-end' }}>
            <TextArea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Ask anything..." style={{ flex:1, height:100 }} onKeyDown={(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send() } }} />
            <Button onClick={send} disabled={pending}>{pending ? 'Sending...' : 'Send'}</Button>
            {pending && <Button variant="ghost" onClick={stop}>Stop</Button>}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
