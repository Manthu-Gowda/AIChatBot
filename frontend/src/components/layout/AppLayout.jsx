import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import styles from './AppLayout.module.scss'
import Button from '../ui/Button'
import { FiMenu, FiX } from 'react-icons/fi'

export default function AppLayout({ title, right, children }){
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  function logout(){
    try { localStorage.removeItem('token') } catch {}
    navigate('/', { replace: true })
  }

  function closeMobileMenu(){
    setMobileMenuOpen(false)
  }

  return (
    <div className={styles.app}>
      {/* Mobile Overlay */}
      <div 
        className={`${styles.mobileOverlay} ${mobileMenuOpen ? styles.open : ''}`}
        onClick={closeMobileMenu}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.brand}>
          <span>🔥</span> AI Chat
        </div>
        <nav className={styles.nav}>
          <Link className={styles.link} to="/chat" onClick={closeMobileMenu}>
            💬 New Chat
          </Link>
          <Link className={styles.link} to="/settings/general" onClick={closeMobileMenu}>
            ⚙️ General Settings
          </Link>
          <Link className={styles.link} to="/projects" onClick={closeMobileMenu}>
            📁 Projects
          </Link>
          <Link className={styles.link} to="/settings/profile" onClick={closeMobileMenu}>
            👤 Profile Settings
          </Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.version}>v0.1.0</div>
          <button onClick={logout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <section className={styles.content}>
        <div className={styles.topbar}>
          <div>
            <button 
              className={styles.menuButton}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
            <span>{title || ''}</span>
          </div>
          <div>{right || <Button variant="ghost" onClick={logout}>Logout</Button>}</div>
        </div>
        <main className={styles.main}>{children}</main>
      </section>
    </div>
  )
}
