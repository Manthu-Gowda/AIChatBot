import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api, setToken } from '../../lib/api'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()
  const loc = useLocation()
  async function submit(e){
    e.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setToken(data.token)
      nav(loc.state?.from?.pathname || '/')
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Login failed')
    }
  }
  return (
    <div style={{ display:'grid', placeItems:'center', height:'100%', padding:16 }}>
      <div className="card" style={{ width: 380 }}>
        <div style={{ fontSize:22, fontWeight:800, marginBottom:8 }}>Welcome back</div>
        <form onSubmit={submit} className="col">
          <Field label="Email"><Input placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} /></Field>
          <Field label="Password"><Input placeholder="••••••••" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></Field>
          {error && <div style={{ color: 'crimson' }}>{error}</div>}
          <Button type="submit">Continue</Button>
        </form>
        <div style={{ marginTop: 10, fontSize:13 }}>
          <Link to="/forgot">Forgot password?</Link> · <Link to="/signup">Create account</Link>
        </div>
      </div>
    </div>
  )
}
