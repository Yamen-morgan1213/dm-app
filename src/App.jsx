import React, { useState, useEffect } from 'react'
import { MessageSquare, Shield, Activity } from 'lucide-react'
import { supabase } from './lib/supabase'
import CustomerPortal from './components/CustomerPortal'
import AdminPortal from './components/AdminPortal'
import RequestDetails from './components/RequestDetails'
import DBWarning from './components/DBWarning'
import './App.css'

function App() {
  const [view, setView] = useState('customer') // customer, admin, track
  const [activeTrackCode, setActiveTrackCode] = useState('')
  const [dbValid, setDbValid] = useState(null) // null = loading, true = OK, false = error/missing table
  const [dbError, setDbError] = useState(null)

  // Listen to hash changes for secret admin route (#admin)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setView('admin')
      } else if (window.location.hash === '' || window.location.hash === '#customer') {
        setView('customer')
        setActiveTrackCode('')
      }
    }

    // Check hash on initial load
    handleHashChange()

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Verify that the database is set up and accessible
  const verifyDatabase = async () => {
    try {
      const { error } = await supabase
        .from('requests')
        .select('id')
        .limit(1)

      if (error) {
        // Handle common missing table errors
        console.warn('Database verify warning:', error)
        setDbValid(false)
        setDbError(error)
      } else {
        setDbValid(true)
        setDbError(null)
      }
    } catch (err) {
      console.error('Database connection exception:', err)
      setDbValid(false)
      setDbError(err)
    }
  }

  useEffect(() => {
    verifyDatabase()
  }, [])

  const handleTrackRequest = (code) => {
    setActiveTrackCode(code)
    setView('track')
  }

  return (
    <div className="app-container">
      {/* Floating background glowing blobs */}
      <div className="bg-glow-container">
        <div className="bg-glow-blob bg-glow-1"></div>
        <div className="bg-glow-blob bg-glow-2"></div>
        <div className="bg-glow-blob bg-glow-3"></div>
      </div>

      {/* Sticky Header Navbar */}
      <header className="navbar">
        <a 
          href="#customer" 
          onClick={(e) => { 
            e.preventDefault(); 
            window.location.hash = '#customer';
          }} 
          className="brand"
        >
          <MessageSquare className="brand-icon" size={24} />
          Yamen Ebrahim
        </a>

        <div className="nav-actions">
          {view === 'admin' ? (
            <span className="status-badge in_progress" style={{ fontSize: '0.75rem' }}>
              Admin Session Active
            </span>
          ) : (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Web Developer for Hire
            </span>
          )}
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="main-content">
        {dbValid === null ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--color-text-secondary)' }}>
            <div className="placeholder-icon" style={{ animation: 'spin 2s linear infinite' }}>🔄</div>
            <h3>Connecting to Supabase...</h3>
          </div>
        ) : !dbValid ? (
          <DBWarning error={dbError} onRetry={verifyDatabase} />
        ) : (
          <>
            {view === 'customer' && (
              <CustomerPortal 
                onTrackRequest={handleTrackRequest} 
                activeTrackCode={activeTrackCode} 
              />
            )}

            {view === 'track' && (
              <RequestDetails 
                trackingCode={activeTrackCode} 
                isAdminView={false} 
                onBack={() => setView('customer')} 
              />
            )}

            {view === 'admin' && (
              <AdminPortal />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div>
          &copy; {new Date().getFullYear()} Yamen Ebrahim. Built for lightning-fast customer web development updates.
        </div>
      </footer>
    </div>
  )
}

export default App
