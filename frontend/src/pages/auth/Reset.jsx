import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import Loader from '../../components/loader/Loader'
import styles from './Auth.module.scss'

export default function Reset(){
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  
  async function submit(e){
    e.preventDefault()
    setMsg('')
    setError('')
    try {
      setLoading(true)
      await api.post('/auth/reset', { token, password })
      setMsg('Password reset successfully! Redirecting to login...')
      setTimeout(() => nav('/'), 2000)
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Reset failed')
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className={styles.authContainer}>
      {loading && <Loader />}
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.authLogo}>🔐</div>
          <h1 className={styles.authTitle}>Reset Password</h1>
          <p className={styles.authSubtitle}>Enter your reset token and new password</p>
        </div>
        
        <form onSubmit={submit} className={styles.authForm}>
          <Field label="Reset Token">
            <textarea 
              className="input" 
              placeholder="Paste your reset token here" 
              value={token} 
              onChange={e=>setToken(e.target.value)}
              style={{ height: 120, fontFamily: 'monospace', fontSize: '12px' }}
              required
            />
          </Field>
          
          <Field label="New Password">
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
          {msg && <div className={styles.successMessage}>{msg}</div>}
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
        
        <div className={styles.authFooter}>
          <Link to="/">Back to login</Link>
          <Link to="/forgot">Request new token</Link>
        </div>
      </div>
    </div>
  )
}
