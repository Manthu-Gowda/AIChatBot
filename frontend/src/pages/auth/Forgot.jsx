import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import Loader from '../../components/loader/Loader'
import styles from './Auth.module.scss'

export default function Forgot(){
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  
  async function submit(e){
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot', { email })
      if (data.resetToken) setToken(data.resetToken)
      setMsg('If the email exists, a reset token was issued (shown here in dev).')
    } catch (e) {
      setMsg(e.response?.data?.error?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      {loading && <Loader />}
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.authLogo}>🔑</div>
          <h1 className={styles.authTitle}>Forgot Password</h1>
          <p className={styles.authSubtitle}>Enter your email to receive a reset token</p>
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
          
          {msg && <div className={styles.successMessage}>{msg}</div>}
          
          {token && (
            <Field label="Your Reset Token (Development)">
              <textarea 
                readOnly 
                className="input" 
                style={{ height: 120, fontFamily: 'monospace', fontSize: '12px' }}
                value={token}
              />
            </Field>
          )}
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
        
        <div className={styles.authFooter}>
          <Link to="/">Back to login</Link>
          <Link to="/reset">Have a token?</Link>
        </div>
      </div>
    </div>
  )
}
