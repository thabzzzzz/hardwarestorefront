import React, { useState } from 'react'
import Drawer from '@mui/material/node/Drawer'
import Button from '@mui/material/node/Button'
import styles from './MobileFiltering.module.css'
import Typography from '@mui/material/node/Typography'

type SortOption = {
  value: string
  label: string
}

type Props = {
  children: React.ReactNode // The filter content
  sortOptions: SortOption[]
  currentSort: string
  onSortChange: (value: string) => void
}

export default function MobileFiltering({ children, sortOptions, currentSort, onSortChange }: Props) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  return (
    <>
      <div className={styles.bottomBar}>
        <Button 
          className={styles.barButton} 
          onClick={() => setFilterOpen(true)}
          variant="contained"
          fullWidth
        >
          Shop By
        </Button>
        <div className={styles.divider} />
        <Button 
          className={styles.barButton} 
          onClick={() => setSortOpen(true)}
          variant="contained"
          fullWidth
        >
          Sort
        </Button>
      </div>

      <Drawer
        anchor="bottom"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        PaperProps={{ className: styles.drawerPaper }}
        sx={{ zIndex: 2200 }} 
      >
        <div className={styles.drawerHeader}>
          <Typography variant="h6">Shop By</Typography>
          <Button onClick={() => setFilterOpen(false)} style={{ minWidth: 0, padding: 8 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </Button>
        </div>
        <div className={styles.drawerContent}>
          {children}
        </div>
        <div className={styles.drawerFooter}>
             <Button variant="contained" fullWidth onClick={() => setFilterOpen(false)}>View Results</Button>
        </div>
      </Drawer>

      <Drawer
        anchor="bottom"
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        PaperProps={{ className: styles.drawerPaper }}
        sx={{ zIndex: 2200 }} 
      >
        <div className={styles.drawerHeader}>
          <Typography variant="h6">Sort By</Typography>
          <Button onClick={() => setSortOpen(false)} style={{ minWidth: 0, padding: 8 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </Button>
        </div>
        <div className={styles.drawerContent} style={{ padding: 0 }}>
          {sortOptions.map(opt => (
            <div 
              key={opt.value} 
              className={`${styles.sortOption} ${currentSort === opt.value ? styles.selectedSort : ''}`}
              onClick={() => {
                onSortChange(opt.value)
                setSortOpen(false)
              }}
            >
              {opt.label}
              {currentSort === opt.value && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f7a8c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </div>
          ))}
        </div>
      </Drawer>
    </>
  )
}
