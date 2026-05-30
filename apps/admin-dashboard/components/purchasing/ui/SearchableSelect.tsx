'use client';

import React, { useState } from 'react';
import s from '../../../app/(dashboard)/purchasing/shared-page.module.css';

interface SearchableSelectProps {
  items: any[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  showStock?: boolean;
}

export default function SearchableSelect({
  items,
  value,
  onChange,
  placeholder = "Search or select item...",
  showStock = false
}: SearchableSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  
  const selected = items.find((i: any) => i.id === value);
  const displayValue = selected ? `${selected.name} (${selected.category})` : query;

  const filtered = items.filter((i: any) => 
    i.name.toLowerCase().includes(query.toLowerCase()) || 
    i.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={s.searchableDropdown}>
      <input 
        className={s.searchableInput} 
        placeholder={placeholder}
        value={open ? query : displayValue}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { setQuery(''); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && (
        <div className={s.searchableList}>
          {filtered.length > 0 ? filtered.map((i: any) => (
            <div 
              key={i.id} 
              className={`${s.searchableOption} ${i.id === value ? s.searchableOptionSelected : ''}`}
              onMouseDown={(e) => { e.preventDefault(); onChange(i.id); setOpen(false); setQuery(''); }}
            >
              {i.name} ({i.category}) - {showStock ? `${i.current_stock || 0} ` : ''}{i.unit}
            </div>
          )) : (
            <div className={s.searchableEmpty}>No items found</div>
          )}
        </div>
      )}
    </div>
  );
}
