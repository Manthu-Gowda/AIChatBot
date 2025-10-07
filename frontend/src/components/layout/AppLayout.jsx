import { Link, useNavigate } from 'react-router-dom'
import styles from './AppLayout.module.scss'
import Button from '../ui/Button'

export default function AppLayout({ title, right, children }){
  const navigate = useNavigate()
  function logout(){
    try { localStorage.removeItem('token') } catch {}
    navigate('/login', { replace: true })
  }
  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>AI Chat</div>
        <div className={styles.nav}>
          <Link className={styles.link} to="/chat">New Chat</Link>
          <Link className={styles.link} to="/settings/general">General Settings</Link>
          <Link className={styles.link} to="/projects/new">New Project</Link>
          <Link className={styles.link} to="/settings/profile">Profile Settings</Link>
        </div>
        <div style={{marginTop:'auto', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{ fontSize:12, color:'var(--muted)' }}>v0.1</div>
          <button onClick={logout} className={styles.link} style={{ border:'1px solid var(--border)' }}>Logout</button>
        </div>
      </aside>
      <section className={styles.content}>
        <div className={styles.topbar}>
          <div style={{fontWeight:700}}>{title || ''}</div>
          <div>{right || <Button variant="ghost" onClick={logout}>Logout</Button>}</div>
        </div>
        <main className={styles.main}>{children}</main>
      </section>
    </div>
  )
}
