'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import styles from './SpotlightSearchBar.module.css';

interface SpotlightSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const SpotlightSearchBar: React.FC<SpotlightSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Spotlight • Cari modul atau fitur...',
}) => {
  return (
    <div className={styles.container}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
        aria-label="Pencarian Spotlight"
      />
      <div className={styles.searchIcon}>
        <Search size={15} strokeWidth={2.2} />
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className={styles.clearButton}
          aria-label="Hapus pencarian"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};
