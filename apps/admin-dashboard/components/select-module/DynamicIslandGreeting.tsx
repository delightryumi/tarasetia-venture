'use client';

import React from 'react';
import styles from './DynamicIslandGreeting.module.css';

interface DynamicIslandGreetingProps {
  user: {
    displayName: string;
    email: string;
    role?: string;
  } | null;
  moduleCount: number;
}

export const DynamicIslandGreeting: React.FC<DynamicIslandGreetingProps> = ({
  user,
  moduleCount,
}) => {
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Administrator';
  const roleName = user?.role || 'Staff';
  const avatarIndex = ((((userName || 'A').charCodeAt(0) || 0) + 5) % 35) + 1;

  return (
    <div className={styles.container}>
      <div className={styles.profileSection}>
        <div className={styles.avatarWrapper}>
          <img
            src={`/avatar/memo_${avatarIndex}.png`}
            alt={userName}
            className={styles.avatarImage}
          />
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{userName}</span>
          <span className={styles.userSubtext}>
            {roleName} • Sistem Aktif
          </span>
        </div>
      </div>

      <div className={styles.badge}>
        <div className={styles.pulseDot} />
        <span>{moduleCount} Modul</span>
      </div>
    </div>
  );
};
