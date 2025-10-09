import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api, setToken } from '../../lib/api'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import Loader from '../../components/loader/Loader'
import styles from './Auth.module.scss'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()
  const loc = useLocation()
  const [loading, setLoading] = useState(false)
  
  async function submit(e){
    e.preventDefault()
    setError('')
    try {
      setLoading(true)
      const { data } = await api.post('/auth/login', { email, password })
      setToken(data.token)
      nav(loc.state?.from?.pathname || '/chat')
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.authContainer}>
      {loading && <Loader />}
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.authLogo}>🔥</div>
          <h1 className={styles.authTitle}>Welcome Back</h1>
          <p className={styles.authSubtitle}>Sign in to continue to AI Chat</p>
        </div>
        
        <form onSubmit={submit} className={styles.authForm}>
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
            />
          </Field>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        
        <div className={styles.authFooter}>
          <Link to="/forgot">Forgot password?</Link>
          <Link to="/signup">Create account</Link>
        </div>
      </div>
    </div>
  )
}
