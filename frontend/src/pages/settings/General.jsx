import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import Loader from '../../components/loader/Loader'
import styles from './Settings.module.scss'

export default function General(){
  const [provider, setProvider] = useState('GEMINI')
  const [apiKeys, setApiKeys] = useState({ openai: '', deepseek:'', gemini:'', perplexity:'', anthropic:'', mistral:'', openrouter:'', groq:'' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  
  useEffect(()=>{ (async()=>{
    try { 
      setLoading(true)
      const { data } = await api.get('/settings')
      if (data){ 
        setProvider(data.defaultProvider || 'GEMINI')
        setApiKeys({ 
          openai: data.apiKeys?.openai || '', 
          deepseek: data.apiKeys?.deepseek || '', 
          gemini: data.apiKeys?.gemini || '', 
          perplexity: data.apiKeys?.perplexity || '',
          anthropic: data.apiKeys?.anthropic || '',
          mistral: data.apiKeys?.mistral || '',
          openrouter: data.apiKeys?.openrouter || '',
          groq: data.apiKeys?.groq || ''
        }) 
      }
    }
    catch {} finally { setLoading(false) }
  })() },[])
  
  async function submit(){
    setMsg('')
    setLoading(true)
    const keys = { ...apiKeys }
    Object.keys(keys).forEach(k=>{ if (keys[k] && keys[k].startsWith('sk-****')) keys[k] = undefined })
    await api.put('/settings', { defaultProvider: provider, apiKeys: keys })
    setMsg('Settings saved successfully!')
    setLoading(false)
  }

  return (
    <AppLayout title="General Settings">
      {loading && <Loader />}
      <div className={styles.settingsCard}>
        <div className={styles.settingsHeader}>
          <h2>⚙️ General Settings</h2>
          <p>Configure your AI providers and API keys</p>
        </div>
        
        <div className={styles.settingsForm}>
          <div className={styles.formSection}>
            <div className={styles.sectionTitle}>API Key Configuration</div>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: 10 }}>Select your default AI provider and configure its key.</p>
            
            <Field label="AI Provider">
              <Select value={provider} onChange={e=>setProvider(e.target.value)}>
                <option>OPENAI</option>
                <option>DEEPSEEK</option>
                <option>GEMINI</option>
                <option>PERPLEXITY</option>
                <option>ANTHROPIC</option>
                <option>MISTRAL</option>
                <option>OPENROUTER</option>
                <option>GROQ</option>
              </Select>
            </Field>

            {provider === 'OPENAI' && (
              <Field label="OpenAI API Key">
                <Input type="password" placeholder="sk-..." value={apiKeys.openai} onChange={e=>setApiKeys({...apiKeys, openai: e.target.value})} />
              </Field>
            )}
            {provider === 'DEEPSEEK' && (
              <Field label="DeepSeek API Key">
                <Input type="password" placeholder="sk-..." value={apiKeys.deepseek} onChange={e=>setApiKeys({...apiKeys, deepseek: e.target.value})} />
              </Field>
            )}
            {provider === 'GEMINI' && (
               <Field label="Gemini API Key">
                 <Input type="password" placeholder="..." value={apiKeys.gemini} onChange={e=>setApiKeys({...apiKeys, gemini: e.target.value})} />
               </Field>
            )}
            {provider === 'PERPLEXITY' && (
               <Field label="Perplexity API Key">
                 <Input type="password" placeholder="..." value={apiKeys.perplexity} onChange={e=>setApiKeys({...apiKeys, perplexity: e.target.value})} />
               </Field>
            )}
            {provider === 'ANTHROPIC' && (
               <Field label="Anthropic API Key">
                 <Input type="password" placeholder="sk-ant-..." value={apiKeys.anthropic} onChange={e=>setApiKeys({...apiKeys, anthropic: e.target.value})} />
               </Field>
            )}
            {provider === 'MISTRAL' && (
               <Field label="Mistral API Key">
                 <Input type="password" placeholder="..." value={apiKeys.mistral} onChange={e=>setApiKeys({...apiKeys, mistral: e.target.value})} />
               </Field>
            )}
            {provider === 'OPENROUTER' && (
               <Field label="OpenRouter API Key">
                 <Input type="password" placeholder="sk-or-..." value={apiKeys.openrouter} onChange={e=>setApiKeys({...apiKeys, openrouter: e.target.value})} />
               </Field>
            )}
            {provider === 'GROQ' && (
               <Field label="Groq API Key">
                 <Input type="password" placeholder="gsk_..." value={apiKeys.groq} onChange={e=>setApiKeys({...apiKeys, groq: e.target.value})} />
               </Field>
            )}
          </div>

          <div className={styles.formActions}>
            <Button onClick={submit} disabled={loading}>
              {loading ? 'Saving...' : '💾 Save Settings'}
            </Button>
            {msg && <div className={styles.successMessage}>✓ {msg}</div>}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
