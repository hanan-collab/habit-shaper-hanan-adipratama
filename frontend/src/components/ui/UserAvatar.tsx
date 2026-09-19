import styles from'./UserAvatar.module.css';
const avatarNumber=(seed:string)=>String([...seed].reduce((total,character)=>((total*31)+character.charCodeAt(0))%99,0)+1).padStart(2,'0');
export function UserAvatar({seed,size='small',className=''}:{seed:string;size?:'small'|'large';className?:string}){return <span className={`${styles.avatar} ${styles[size]} ${className}`} aria-label={`Profile number ${avatarNumber(seed)}`}>{avatarNumber(seed)}</span>}
