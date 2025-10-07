export default function Conversation({ messages }){
  return (
    <div>
      {messages.map((m,i)=> (
        <div key={i} style={{ marginBottom: 8 }}>
          <b>{m.role}</b>: <span>{m.content}</span>
        </div>
      ))}
    </div>
  )
}

