import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import Button from '../../components/ui/Button'
import { Field, Input, TextArea } from '../../components/ui/Input'

export default function NewProject(){
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name:'', role:'', responsibilities:'', description:'' })
  const [files, setFiles] = useState([])
  async function submit(){
    const { data } = await api.post('/projects', form)
    if (files.length){
      const fd = new FormData()
      for (const f of files) fd.append('files', f)
      await api.post(`/projects/${data.id}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    }
    nav(`/projects/${data.id}/chat`)
  }
  return (
    <AppLayout title="New Project">
      <div className="card" style={{ maxWidth: 840 }}>
        {step===1 && (
          <div className="col">
            <Field label="Project Name"><Input placeholder="Project Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /></Field>
            <Field label="Role"><Input placeholder="Role" value={form.role} onChange={e=>setForm({...form, role:e.target.value})} /></Field>
            <Field label="Responsibilities"><TextArea placeholder="Responsibilities" value={form.responsibilities} onChange={e=>setForm({...form, responsibilities:e.target.value})} /></Field>
            <Field label="Short Description"><TextArea placeholder="Short Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} /></Field>
            <div style={{ display:'flex', justifyContent:'flex-end' }}><Button onClick={()=>setStep(2)}>Next</Button></div>
          </div>
        )}
        {step===2 && (
          <div className="col">
            <Field label="Upload Files" hint="PDF, DOCX, TXT, MD; ≤ 10MB each">
              <input type="file" multiple onChange={e=>setFiles(Array.from(e.target.files||[]))} />
            </Field>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <Button variant="ghost" onClick={()=>setStep(1)}>Back</Button>
              <Button onClick={()=>setStep(3)}>Next</Button>
            </div>
          </div>
        )}
        {step===3 && (
          <div className="col">
            <div style={{ fontWeight:700 }}>Review</div>
            <div className="card" style={{ background:'var(--color-surface-2)' }}>
              <pre style={{ margin:0, whiteSpace:'pre-wrap' }}>{JSON.stringify(form, null, 2)}</pre>
            </div>
            <div>{files.length} file(s) selected</div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <Button variant="ghost" onClick={()=>setStep(2)}>Back</Button>
              <Button onClick={submit}>Create Project</Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
