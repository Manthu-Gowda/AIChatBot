import styles from './Message.module.scss'
import Markdown from './Markdown'

export default function Message({ role, content, ts }){
  const cls = [styles.bubble, role === 'user' ? styles.user : styles.assistant].join(' ')
  return (
    <div className={styles.msg}>
      {role !== 'user' && <div className={styles.avatar}>AI</div>}
      <div className={cls}>
        <Markdown content={content} />
        {/* {ts && <div className={styles.meta}>{new Date(ts).toLocaleTimeString()}</div>} */}
      </div>
      {role === 'user' && <div className={styles.avatar}>U</div>}
    </div>
  )
}
