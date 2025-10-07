export default function Uploads({ files, setFiles }){
  return (
    <div>
      <input type="file" multiple onChange={e=>setFiles(Array.from(e.target.files||[]))} />
      <div style={{ fontSize: 12, color:'#64748b' }}>Allowed: PDF, DOCX, TXT, MD; ≤ 10MB/file</div>
    </div>
  )
}

