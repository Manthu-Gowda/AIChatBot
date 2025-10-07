import { Link, useNavigate } from 'react-router-dom'

export default function Sidebar(){
  const nav = useNavigate()
  return (
    <div style={{ width: 260, borderRight: '1px solid #e5e7eb', padding: 12, display:'flex', flexDirection:'column', gap:8 }}>
      <button className="btn" onClick={()=>nav('/')}>New Chat</button>
      <Link to="/settings/general">General Settings</Link>
      <Link to="/projects/new">New Project</Link>
      <Link to="/settings/profile">Profile Settings</Link>
    </div>
  )
}

