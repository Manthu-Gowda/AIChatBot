import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import Loader from '../../components/loader/Loader'
import styles from './Settings.module.scss'

export default function General(){
  const [defaultProvider, setDefaultProvider] = useState('OPENAI')
  const [apiKeys, setApiKeys] = useState({ openai: '', deepseek:'', gemini:'', perplexity:'' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  
  useEffect(()=>{ (async()=>{
    try { 
      setLoading(true)
      const { data } = await api.get('/settings')
      if (data){ 
        setDefaultProvider(data.defaultProvider)
        setApiKeys({ 
          openai: data.apiKeys?.openai || '', 
          deepseek: data.apiKeys?.deepseek || '', 
          gemini: data.apiKeys?.gemini || '', 
          perplexity: data.apiKeys?.perplexity || '' 
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
    await api.put('/settings', { defaultProvider, apiKeys: keys })
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
            <div className={styles.sectionTitle}>Default AI Provider</div>
            <Field label="Provider">
              <Select value={defaultProvider} onChange={e=>setDefaultProvider(e.target.value)}>
                <option>OPENAI</option>
                <option>DEEPSEEK</option>
                <option>GEMINI</option>
                <option>PERPLEXITY</option>
              </Select>
            </Field>
          </div>

          <div className={styles.formSection}>
            <div className={styles.sectionTitle}>API Keys</div>
            <Field label="OpenAI API Key" hint="Stored encrypted; shown masked after saving.">
              <Input 
                type="password"
                placeholder="sk-..." 
                value={apiKeys.openai} 
                onChange={e=>setApiKeys({...apiKeys, openai: e.target.value})} 
              />
            </Field>
            <Field label="DeepSeek API Key" hint="Get your API key from deepseek.com">
              <Input 
                type="password"
                placeholder="sk-..." 
                value={apiKeys.deepseek} 
                onChange={e=>setApiKeys({...apiKeys, deepseek: e.target.value})} 
              />
            </Field>
            <Field label="Gemini API Key" hint="Get your API key from Google AI Studio">
              <Input 
                type="password"
                placeholder="..." 
                value={apiKeys.gemini} 
                onChange={e=>setApiKeys({...apiKeys, gemini: e.target.value})} 
              />
            </Field>
            <Field label="Perplexity API Key" hint="Get your API key from perplexity.ai">
              <Input 
                type="password"
                placeholder="..." 
                value={apiKeys.perplexity} 
                onChange={e=>setApiKeys({...apiKeys, perplexity: e.target.value})} 
              />
            </Field>
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
