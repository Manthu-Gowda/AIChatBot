import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'

export default function Profile(){
  const [me, setMe] = useState(null)
  const [msg, setMsg] = useState('')
  const [pwd, setPwd] = useState({ currentPassword:'', newPassword:'' })
  useEffect(()=>{ (async()=>{ try { const { data } = await api.get('/me'); setMe(data) } catch {} })() },[])
  async function save(){ setMsg(''); const { data } = await api.put('/me', { name: me.name, avatarUrl: me.avatarUrl }); setMe(data); setMsg('Saved') }
  async function changePwd(){ setMsg(''); await api.put('/me/password', pwd); setMsg('Password changed') }
  if (!me) return null
  return (
    <AppLayout title="Profile Settings">
      <div className="card" style={{ maxWidth: 720 }}>
        <div className="col">
          <Field label="Full name">
            <Input value={me.name || ''} onChange={e=>setMe({...me, name:e.target.value})} />
          </Field>
          <Field label="Avatar URL">
            <Input value={me.avatarUrl || ''} onChange={e=>setMe({...me, avatarUrl:e.target.value})} />
          </Field>
          <Button onClick={save}>Save Profile</Button>
          <div style={{ fontWeight:700, marginTop: 12 }}>Change Password</div>
          <Field label="Current password">
            <Input placeholder="Current password" type="password" value={pwd.currentPassword} onChange={e=>setPwd({...pwd, currentPassword:e.target.value})} />
          </Field>
          <Field label="New password">
            <Input placeholder="New password" type="password" value={pwd.newPassword} onChange={e=>setPwd({...pwd, newPassword:e.target.value})} />
          </Field>
          <div style={{ display:'flex', gap:12 }}>
            <Button onClick={changePwd}>Change Password</Button>
            {msg && <div style={{ alignSelf:'center', color:'var(--muted)' }}>{msg}</div>}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
