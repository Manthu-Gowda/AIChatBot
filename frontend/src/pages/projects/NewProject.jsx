import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import { Field, Input, TextArea } from '../../components/ui/Input'
import Loader from '../../components/loader/Loader'
import styles from './NewProject.module.scss'

export default function NewProject(){
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState({ name:'', role:'', responsibilities:'', description:'' })
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [existingFiles, setExistingFiles] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    if (!id) return
    ;(async()=>{
      try {
        setLoading(true)
        const { data } = await api.get('/projects/'+id)
        if (data){
          setForm({ name: data.name||'', role: data.role||'', responsibilities: data.responsibilities||'', description: data.description||'' })
          setExistingFiles(Array.isArray(data.files) ? data.files : [])
        }
      } catch {} finally { setLoading(false) }
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
      {(loading || submitting) && <Loader />}
      <div className={styles.projectCard}>
        <div className={styles.projectHeader}>
          <h2>{id ? '✏️ Edit Project' : '✨ Create New Project'}</h2>
          <p>{id ? 'Update your project details and files' : 'Set up a new AI chat project with custom knowledge'}</p>
        </div>
        
        <div className={styles.projectForm}>
          <Field label="Project Name">
            <Input 
              placeholder="e.g., Customer Support Bot" 
              value={form.name} 
              onChange={e=>setForm({...form, name:e.target.value})}
              required
            />
          </Field>
          
          <Field label="Role" hint="Define the AI's role in this project">
            <Input 
              placeholder="e.g., Customer Support Agent" 
              value={form.role} 
              onChange={e=>setForm({...form, role:e.target.value})} 
            />
          </Field>
          
          <Field label="Responsibilities" hint="What should the AI help with?">
            <TextArea 
              placeholder="Describe the AI's responsibilities..." 
              value={form.responsibilities} 
              onChange={e=>setForm({...form, responsibilities:e.target.value})}
            />
          </Field>
          
          <Field label="Short Description" hint="Brief overview of the project">
            <TextArea 
              placeholder="Describe your project..." 
              value={form.description} 
              onChange={e=>setForm({...form, description:e.target.value})} 
            />
          </Field>
          
          <Field label="Upload Files" hint="PDF, DOCX, TXT, MD; max 10MB each">
            <div className={styles.fileUploadArea}>
              <div className={styles.uploadIcon}>📁</div>
              <div className={styles.uploadText}>Choose files to upload</div>
              <input 
                type="file" 
                multiple 
                accept=".pdf,.doc,.docx,.txt,.md" 
                onChange={e=>setFiles(Array.from(e.target.files||[]))} 
              />
            </div>
          </Field>
          
          {files.length > 0 && (
            <div className={styles.selectedFiles}>
              📎 {files.length} file(s) selected: {files.map(f=>f.name).join(', ')}
            </div>
          )}

          {id && existingFiles.length > 0 && (
            <div className={styles.existingFilesCard}>
              <div className={styles.cardTitle}>Existing Files</div>
              <div className={styles.filesList}>
                {existingFiles.map(f => (
                  <div key={f.id} className={styles.fileItem}>
                    <div className={styles.fileName} title={f.filename}>
                      📄 {f.filename}
                    </div>
                    <button className="btn2" onClick={()=>deleteFile(f.id)} title="Delete">
                      🗑️ Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.formActions}>
            <Button onClick={submit} disabled={submitting || !form.name.trim()}>
              {submitting ? (id ? '💾 Saving…' : '✨ Creating…') : (id ? '💾 Save Changes' : '✨ Create Project')}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
