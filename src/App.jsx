import React, { useState, useEffect } from 'react'
import { MessageSquare, Shield, Activity, Download } from 'lucide-react'
import { supabase } from './lib/supabase'
import CustomerPortal from './components/CustomerPortal'
import AdminPortal from './components/AdminPortal'
import RequestDetails from './components/RequestDetails'
import DBWarning from './components/DBWarning'
import PWAInstallModal from './components/PWAInstallModal'
import './App.css'

function App() {
  const [view, setView] = useState('customer') // customer, admin, track
  const [activeTrackCode, setActiveTrackCode] = useState('')
  const [dbValid, setDbValid] = useState(null) // null = loading, true = OK, false = error/missing table
  const [dbError, setDbError] = useState(null)
  
  // PWA States
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallOpen, setIsInstallOpen] = useState(false)
  const [showInstallBtn, setShowInstallBtn] = useState(true)

  // Listen to beforeinstallprompt event
  useEffect(() => {
    const handlePrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBtn(true)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setShowInstallBtn(false)
      console.log('PWA app installed successfully!')
    }

    window.addEventListener('beforeinstallprompt', handlePrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if already in standalone (app) mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBtn(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Listen to hash changes for secret admin route (#admin)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.toLowerCase().startsWith('#admin')) {
        setView('admin')
      } else if (window.location.hash === '' || window.location.hash.toLowerCase().startsWith('#customer')) {
        setView('customer')
        setActiveTrackCode('')
      }
    }

    // Check if there is an active admin session on initial load and route to admin
    const authSession = localStorage.getItem('dm_admin_session')
    if (authSession) {
      const timeElapsed = Date.now() - parseInt(authSession)
      if (timeElapsed < 24 * 60 * 60 * 1000) {
        window.location.hash = '#admin'
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

  const handleDownloadApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setShowInstallBtn(false)
      }
    } else {
      setIsInstallOpen(true)
    }
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
          {showInstallBtn && (
            <button 
              onClick={handleDownloadApp}
              className="btn-nav" 
              style={{ marginRight: '0.75rem', background: 'var(--grad-primary)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <Download size={14} /> Download App
            </button>
          )}
          {view === 'admin' ? (
            <span className="status-badge in_progress" style={{ fontSize: '0.75rem' }}>
              Admin Session Active
            </span>
          ) : (
            <span className="navbar-subtitle" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
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
              <AdminPortal onOpenInstall={handleDownloadApp} />
            )}
          </>
        )}
      </main>

      <PWAInstallModal 
        isOpen={isInstallOpen} 
        onClose={() => setIsInstallOpen(false)} 
        deferredPrompt={deferredPrompt} 
        onInstallSuccess={() => setShowInstallBtn(false)} 
      />

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
