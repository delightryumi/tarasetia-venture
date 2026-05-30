import React from 'react';
import styles from './PButton.module.css';

type Variant = 'primary' | 'secondary' | 'danger' | 'success';
type Size = 'default' | 'sm';

interface PButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}

export function PButton({ variant = 'primary', size = 'default', className = '', children, ...rest }: PButtonProps) {
  return (
    <button
      className={[styles.base, styles[variant], size === 'sm' ? styles.sm : '', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
