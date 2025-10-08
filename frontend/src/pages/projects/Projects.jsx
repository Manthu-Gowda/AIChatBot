import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import { api } from '../../lib/api'
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { CiChat2 } from "react-icons/ci";

export default function Projects(){
  const nav = useNavigate()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  async function load(){
    setLoading(true); setErr('')
    try { const { data } = await api.get('/projects'); setList(data || []) }
    catch (e){ setErr(e?.message || 'Failed to load projects') }
    finally { setLoading(false) }
  }

  useEffect(()=>{ load() },[])

  async function onDelete(id){
    if (!confirm('Delete this project? This cannot be undone.')) return
    try { await api.delete('/projects/'+id); await load() }
    catch (e){ alert(e?.message || 'Delete failed') }
  }

  return (
    <AppLayout title="Projects" right={<Button onClick={()=>nav('/projects/new')}>Create Project</Button>}>
      <div className="card" style={{ background:'#fff', padding:0 }}>
        {loading ? (
          <div style={{ padding:12 }}>Loading…</div>
        ) : err ? (
          <div style={{ padding:12, color:'crimson' }}>{err}</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ textAlign:'left', borderBottom:'1px solid var(--border)' }}>
                <th style={{ padding:12 }}>Name</th>
                <th style={{ padding:12 }}>Role</th>
                <th style={{ padding:12 }}>Files</th>
                <th style={{ padding:12 }}>Created</th>
                <th style={{ padding:12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(p => (
                <tr key={p.id} style={{ borderBottom:'1px solid #eee' }}>
                  <td style={{ padding:12 }}>{p.name}</td>
                  <td style={{ padding:12 }}>{p.role || '-'}</td>
                  <td style={{ padding:12 }}>
                    {p.fileCount || 0}
                    {typeof p.totalBytes === 'number' && (
                      <span style={{ color:'var(--muted)', marginLeft: 6 }}>({formatBytes(p.totalBytes)})</span>
                    )}
                  </td>
                  <td style={{ padding:12 }}>{new Date(p.createdAt).toLocaleString()}</td>
                  <td style={{ padding:12, display:'flex', gap:8 }}>
                    <button className="btn2" onClick={()=>nav('/projects/'+p.id+'/edit')} title="Edit"><FaEdit /></button>
                    <button className="btn2" onClick={()=>onDelete(p.id)} title="Delete"><MdDelete /></button>
                    <button className="btn2" onClick={()=>nav('/projects/'+p.id+'/chat')} title="Open Chat"><CiChat2 /></button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={5} style={{ padding:12, color:'var(--muted)' }}>No projects yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  )
}

function formatBytes(n){
  if (!n || n <= 0) return '0 B'
  const units = ['B','KB','MB','GB','TB']
  let i = 0; let v = n
  while (v >= 1024 && i < units.length-1){ v/=1024; i++ }
  return `${v.toFixed(v<10?1:0)} ${units[i]}`
}
