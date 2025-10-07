import { useState } from 'react'
import { api } from '../../lib/api'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'

export default function Reset(){
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  async function submit(e){
    e.preventDefault()
    setMsg('')
    try {
      await api.post('/auth/reset', { token, password })
      setMsg('Password reset! You can now log in.')
    } catch (e) {
      setMsg(e.response?.data?.error?.message || 'Reset failed')
    }
  }
  return (
    <div style={{ display:'grid', placeItems:'center', height:'100%', padding:16 }}>
      <div className="card2" style={{ width: 520 }}>
        <div style={{ fontSize:22, fontWeight:800, marginBottom:8 }}>Reset Password</div>
        <form onSubmit={submit} className="col">
          <Field label="Reset Token"><textarea className="input" placeholder="Reset Token" value={token} onChange={e=>setToken(e.target.value)} style={{height:120}} /></Field>
          <Field label="New Password"><Input placeholder="••••••••" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></Field>
          <Button type="submit">Reset</Button>
        </form>
        {msg && <p>{msg}</p>}
      </div>
    </div>
  )
}
