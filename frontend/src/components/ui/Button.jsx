import styles from './Button.module.scss'

export default function Button({ children, variant='primary', className='', ...props }){
  const cls = [styles.btn, variant!=='primary' ? styles[variant] : '', className].filter(Boolean).join(' ')
  return <button className={cls} {...props}>{children}</button>
}

