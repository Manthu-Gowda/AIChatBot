import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import { Field, Input, TextArea } from '../../components/ui/Input'

export default function NewProject(){
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState({ name:'', role:'', responsibilities:'', description:'' })
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [existingFiles, setExistingFiles] = useState([])

  useEffect(()=>{
    if (!id) return
    ;(async()=>{
      try {
        const { data } = await api.get('/projects/'+id)
        if (data){
          setForm({ name: data.name||'', role: data.role||'', responsibilities: data.responsibilities||'', description: data.description||'' })
          setExistingFiles(Array.isArray(data.files) ? data.files : [])
        }
      } catch {}
    })()
  }, [id])

  async function deleteFile(fileId){
    if (!id) return
    if (!confirm('Delete this file from the project?')) return
    try {
      await api.delete(`/projects/${id}/files/${fileId}`)
      setExistingFiles((list)=> list.filter(f=>f.id !== fileId))
    } catch (e){ alert(e?.message || 'Failed to delete file') }
  }

  async function submit(){
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      if (id) {
        const { data } = await api.put('/projects/'+id, form)
        if (files.length){
          const fd = new FormData()
          for (const f of files) fd.append('files', f)
          await api.post(`/projects/${data.id}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        }
        nav(`/projects/${data.id}/chat`)
      } else {
        const { data } = await api.post('/projects', form)
        if (files.length){
          const fd = new FormData()
          for (const f of files) fd.append('files', f)
          await api.post(`/projects/${data.id}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        }
        nav(`/projects/${data.id}/chat`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout title={id ? 'Edit Project' : 'New Project'}>
      <div className="card" style={{ maxWidth: 840 }}>
        <div className="col" style={{ gap: 16 }}>
          <Field label="Project Name"><Input placeholder="Project Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /></Field>
          <Field label="Role"><Input placeholder="Role" value={form.role} onChange={e=>setForm({...form, role:e.target.value})} /></Field>
          <Field label="Responsibilities"><TextArea placeholder="Responsibilities" value={form.responsibilities} onChange={e=>setForm({...form, responsibilities:e.target.value})} /></Field>
          <Field label="Short Description"><TextArea placeholder="Short Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} /></Field>
          <Field label="Upload Files" hint="PDF, DOCX, TXT, MD; max 10MB each">
            <input type="file" multiple accept=".pdf,.doc,.docx,.txt,.md" onChange={e=>setFiles(Array.from(e.target.files||[]))} />
          </Field>
          {files.length > 0 && (
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>
              {files.length} file(s) selected: {files.map(f=>f.name).join(', ')}
            </div>
          )}

          {id && existingFiles.length > 0 && (
            <div className="card" style={{ background:'#fff', padding: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Existing Files</div>
              <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
                {existingFiles.map(f => (
                  <div key={f.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ overflow:'hidden', textOverflow:'ellipsis' }} title={f.filename}>{f.filename}</div>
                    <div style={{ display:'flex', gap: 8 }}>
                      <button className="btn" onClick={()=>deleteFile(f.id)} title="Delete">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <Button onClick={submit} disabled={submitting || !form.name.trim()}>
              {submitting ? (id ? 'Saving…' : 'Creating…') : (id ? 'Save Changes' : 'Create Project')}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

