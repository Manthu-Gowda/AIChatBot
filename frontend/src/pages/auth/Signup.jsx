import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setToken } from '../../lib/api'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'

export default function Signup(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()
  async function submit(e){
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Please enter your full name'); return }
    try {
      const { data } = await api.post('/auth/signup', { name, email, password })
      setToken(data.token)
      nav('/')
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Signup failed')
    }
  }
  return (
    <div style={{ display:'grid', placeItems:'center', height:'100%', padding:16 }}>
      <div className="card" style={{ width: 420 }}>
        <div style={{ fontSize:22, fontWeight:800, marginBottom:8 }}>Create account</div>
        <form onSubmit={submit} className="col">
          <Field label="Full name"><Input placeholder="Jane Doe" value={name} onChange={e=>setName(e.target.value)} /></Field>
          <Field label="Email"><Input placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} /></Field>
          <Field label="Password"><Input placeholder="••••••••" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></Field>
          {error && <div style={{ color: 'crimson' }}>{error}</div>}
          <Button type="submit">Sign up</Button>
        </form>
        <div style={{ marginTop: 10, fontSize:13 }}>
          <Link to="/">Already have an account?</Link>
        </div>
      </div>
    </div>
  )
}
