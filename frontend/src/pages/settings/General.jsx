import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'

export default function General(){
  const [defaultProvider, setDefaultProvider] = useState('OPENAI')
  const [apiKeys, setApiKeys] = useState({ openai: '', deepseek:'', gemini:'', perplexity:'' })
  const [msg, setMsg] = useState('')
  useEffect(()=>{ (async()=>{
    try { const { data } = await api.get('/settings'); if (data){ setDefaultProvider(data.defaultProvider); setApiKeys({ openai: data.apiKeys?.openai || '', deepseek: data.apiKeys?.deepseek || '', gemini: data.apiKeys?.gemini || '', perplexity: data.apiKeys?.perplexity || '' }) } }
    catch {}
  })() },[])
  async function submit(){
    setMsg('')
    const keys = { ...apiKeys }
    Object.keys(keys).forEach(k=>{ if (keys[k] && keys[k].startsWith('sk-****')) keys[k] = undefined })
    await api.put('/settings', { defaultProvider, apiKeys: keys })
    setMsg('Settings saved')
  }
  return (
    <AppLayout title="General Settings">
      <div className="card" style={{ maxWidth: 720 }}>
        <div className="col">
          <Field label="Default Provider">
            <Select value={defaultProvider} onChange={e=>setDefaultProvider(e.target.value)}>
              <option>OPENAI</option>
              <option>DEEPSEEK</option>
              <option>GEMINI</option>
              <option>PERPLEXITY</option>
            </Select>
          </Field>
          <Field label="OpenAI API Key" hint="Stored encrypted; shown masked after saving.">
            <Input placeholder="sk-..." value={apiKeys.openai} onChange={e=>setApiKeys({...apiKeys, openai: e.target.value})} />
          </Field>
          <Field label="DeepSeek API Key">
            <Input placeholder="..." value={apiKeys.deepseek} onChange={e=>setApiKeys({...apiKeys, deepseek: e.target.value})} />
          </Field>
          <Field label="Gemini API Key">
            <Input placeholder="..." value={apiKeys.gemini} onChange={e=>setApiKeys({...apiKeys, gemini: e.target.value})} />
          </Field>
          <Field label="Perplexity API Key">
            <Input placeholder="..." value={apiKeys.perplexity} onChange={e=>setApiKeys({...apiKeys, perplexity: e.target.value})} />
          </Field>
          <div style={{ display:'flex', gap:12 }}>
            <Button onClick={submit}>Save Settings</Button>
            {msg && <div style={{ alignSelf:'center', color:'var(--muted)' }}>{msg}</div>}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
