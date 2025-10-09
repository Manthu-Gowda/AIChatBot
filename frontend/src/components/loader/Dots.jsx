import './Dots.scss'

export default function Dots(){
  return (
    <span className="typing" aria-label="typing">
      <span className="typing-dot" style={{ '--i': 0 }} />
      <span className="typing-dot" style={{ '--i': 1 }} />
      <span className="typing-dot" style={{ '--i': 2 }} />
    </span>
  )
}

