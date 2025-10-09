import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import Loader from '../../components/loader/Loader'
import { api } from '../../lib/api'
import { getBackendBaseUrl } from '../../lib/baseUrl'
import { FaEdit } from "react-icons/fa"
import { MdDelete } from "react-icons/md"
import { CiChat2 } from "react-icons/ci"
import styles from './Projects.module.scss'

export default function Projects(){
  const nav = useNavigate()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [copiedId, setCopiedId] = useState('')

  async function load(){
    setLoading(true); setErr('')
    try { const { data } = await api.get('/projects'); setList(data || []) }
    catch (e){ setErr(e?.message || 'Failed to load projects') }
    finally { setLoading(false) }
  }

  useEffect(()=>{ load(); (async()=>{ try { const { data } = await api.get('/me'); setTenantId(data?.id || '') } catch {} })() },[])

  async function onDelete(id){
    if (!confirm('Delete this project? This cannot be undone.')) return
    try { await api.delete('/projects/'+id); await load() }
    catch (e){ alert(e?.message || 'Delete failed') }
  }

  function buildEmbed(projectId){
    const base = getBackendBaseUrl()
    return `<script src="${base}/widget.js" data-tenant="${tenantId}" data-project="${projectId}" async></script>`
  }

  async function copyEmbed(projectId){
    try {
      const text = buildEmbed(projectId)
      await navigator.clipboard.writeText(text)
      setCopiedId(projectId)
      setTimeout(()=> setCopiedId(''), 1500)
    } catch (e) {
      alert('Copy failed. Please copy manually from the console.')
      // eslint-disable-next-line no-console
      console.log(buildEmbed(projectId))
    }
  }

  return (
    <AppLayout title="Projects" right={<Button onClick={()=>nav('/projects/new')}>+ Create Project</Button>}>
      {loading && <Loader />}
      <div className={styles.tableCard}>
        {err ? (
          <div className={styles.errorState}>{err}</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Files</th>
                <th>Created</th>
                <th>Embed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.role || '-'}</td>
                  <td>
                    <div className={styles.fileInfo}>
                      <span>{p.fileCount || 0}</span>
                      {typeof p.totalBytes === 'number' && (
                        <span className={styles.fileSize}>({formatBytes(p.totalBytes)})</span>
                      )}
                    </div>
                  </td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className={`btn2 ${styles.embedButton} ${copiedId === p.id ? styles.copied : ''}`}
                      onClick={()=>copyEmbed(p.id)} 
                      title="Copy embed code" 
                      disabled={!tenantId}
                    >
                      {copiedId === p.id ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button className="btn2" onClick={()=>nav('/projects/'+p.id+'/edit')} title="Edit">
                        <FaEdit />
                      </button>
                      <button className="btn2" onClick={()=>onDelete(p.id)} title="Delete">
                        <MdDelete />
                      </button>
                      <button className="btn2" onClick={()=>nav('/projects/'+p.id+'/chat')} title="Open Chat">
                        <CiChat2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.emptyState}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                      <div>No projects yet. Create your first project to get started!</div>
                    </div>
                  </td>
                </tr>
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
