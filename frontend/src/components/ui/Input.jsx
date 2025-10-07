import styles from './Input.module.scss'

export function Field({ label, hint, children }){
  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      {children}
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  )
}

export function Input(props){
  return <input className={styles.input} {...props} />
}

export function TextArea(props){
  return <textarea className={styles.input} {...props} />
}

export function Select({ children, ...props }){
  return <select className={styles.input} {...props}>{children}</select>
}

