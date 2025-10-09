import { useState } from 'react'
import { api } from '../../lib/api'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import Loader from '../../components/loader/Loader'

export default function Forgot(){
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(e){
    e.preventDefault()
    setMsg('')
    setLoading(true)
    const { data } = await api.post('/auth/forgot', { email })
    if (data.resetToken) setToken(data.resetToken)
    setMsg('If the email exists, a reset token was issued (shown here in dev).')
    setLoading(false)
  }
  return (
    <div style={{ display:'grid', placeItems:'center', height:'100%', padding:16 }}>
      {loading && <Loader />}
      <div className="card2" style={{ width: 480 }}>
        <div style={{ fontSize:22, fontWeight:800, marginBottom:8 }}>Forgot Password</div>
        <form onSubmit={submit} className="col">
          <Field label="Email"><Input placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} /></Field>
          <Button type="submit">Send reset</Button>
        </form>
        {msg && <p>{msg}</p>}
        {token && <div><strong>Dev Reset Token:</strong><br/>
          <textarea readOnly className="input" style={{ height: 120 }}>{token}</textarea>
        </div>}
      </div>
    </div>
  )
}
