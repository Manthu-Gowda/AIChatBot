import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setToken } from '../../lib/api'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import Loader from '../../components/loader/Loader'
import styles from './Auth.module.scss'

export default function Signup(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)
  
  async function submit(e){
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Please enter your full name'); return }
    try {
      setLoading(true)
      const { data } = await api.post('/auth/signup', { name, email, password })
      setToken(data.token)
      nav('/')
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Signup failed')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.authContainer}>
      {loading && <Loader />}
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.authLogo}>🚀</div>
          <h1 className={styles.authTitle}>Create Account</h1>
          <p className={styles.authSubtitle}>Get started with AI Chat today</p>
        </div>
        
        <form onSubmit={submit} className={styles.authForm}>
          <Field label="Full Name">
            <Input 
              type="text"
              placeholder="Jane Doe" 
              value={name} 
              onChange={e=>setName(e.target.value)}
              required
            />
          </Field>
          
          <Field label="Email Address">
            <Input 
              type="email"
              placeholder="you@example.com" 
              value={email} 
              onChange={e=>setEmail(e.target.value)}
              required
            />
          </Field>
          
          <Field label="Password">
            <Input 
              type="password"
              placeholder="••••••••" 
              value={password} 
              onChange={e=>setPassword(e.target.value)}
              required
              minLength={6}
            />
          </Field>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
        
        <div className={styles.authFooter}>
          <Link to="/">Already have an account?</Link>
        </div>
      </div>
    </div>
  )
}
