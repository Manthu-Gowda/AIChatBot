import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import Loader from '../../components/loader/Loader'
import styles from './Settings.module.scss'

export default function Profile(){
  const [me, setMe] = useState(null)
  const [msg, setMsg] = useState('')
  const [pwd, setPwd] = useState({ currentPassword:'', newPassword:'' })
  const [loading, setLoading] = useState(false)
  
  useEffect(()=>{ 
    (async()=>{ 
      try { 
        setLoading(true)
        const { data } = await api.get('/me')
        setMe(data)
      } catch {} 
      finally { setLoading(false) }
    })()
  },[])
  
  async function save(){ 
    setMsg('')
    setLoading(true)
    try {
      const { data } = await api.put('/me', { name: me.name, avatarUrl: me.avatarUrl })
      setMe(data)
      setMsg('Profile updated successfully!')
    } catch (e) {
      setMsg('Failed to update profile')
    }
    setLoading(false)
  }
  
  async function changePwd(){ 
    setMsg('')
    if (!pwd.currentPassword || !pwd.newPassword) {
      setMsg('Please fill in all password fields')
      return
    }
    setLoading(true)
    try {
      await api.put('/me/password', pwd)
      setMsg('Password changed successfully!')
      setPwd({ currentPassword:'', newPassword:'' })
    } catch (e) {
      setMsg('Failed to change password')
    }
    setLoading(false)
  }
  
  if (!me) return <AppLayout title="Profile Settings">{loading && <Loader />}</AppLayout>
  
  return (
    <AppLayout title="Profile Settings">
      {loading && <Loader />}
      <div className={styles.settingsCard}>
        <div className={styles.settingsHeader}>
          <h2>👤 Profile Settings</h2>
          <p>Manage your account information and security</p>
        </div>
        
        <div className={styles.settingsForm}>
          <div className={styles.formSection}>
            <div className={styles.sectionTitle}>Personal Information</div>
            <Field label="Full Name">
              <Input 
                value={me.name || ''} 
                onChange={e=>setMe({...me, name:e.target.value})}
                placeholder="Enter your full name"
              />
            </Field>
            <Field label="Avatar URL" hint="URL to your profile picture">
              <Input 
                value={me.avatarUrl || ''} 
                onChange={e=>setMe({...me, avatarUrl:e.target.value})}
                placeholder="https://example.com/avatar.jpg"
              />
            </Field>
            <Button onClick={save} disabled={loading}>
              {loading ? 'Saving...' : '💾 Save Profile'}
            </Button>
          </div>

          <div className={styles.formSection}>
            <div className={styles.sectionTitle}>Security</div>
            <Field label="Current Password">
              <Input 
                placeholder="Enter current password" 
                type="password" 
                value={pwd.currentPassword} 
                onChange={e=>setPwd({...pwd, currentPassword:e.target.value})}
              />
            </Field>
            <Field label="New Password" hint="Minimum 6 characters">
              <Input 
                placeholder="Enter new password" 
                type="password" 
                value={pwd.newPassword} 
                onChange={e=>setPwd({...pwd, newPassword:e.target.value})}
                minLength={6}
              />
            </Field>
            <div className={styles.formActions}>
              <Button onClick={changePwd} disabled={loading || !pwd.currentPassword || !pwd.newPassword}>
                {loading ? 'Changing...' : '🔒 Change Password'}
              </Button>
            </div>
          </div>

          {msg && <div className={styles.successMessage}>✓ {msg}</div>}
        </div>
      </div>
    </AppLayout>
  )
}
