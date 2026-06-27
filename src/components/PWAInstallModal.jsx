import React, { useEffect, useState } from 'react'
import { Download, X, AlertCircle, ArrowUpRight } from 'lucide-react'

export default function PWAInstallModal({ isOpen, onClose, deferredPrompt, onInstallSuccess }) {
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isAppleDevice)
  }, [])

  if (!isOpen) return null

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        if (onInstallSuccess) onInstallSuccess()
        onClose()
      }
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 11000 }} onClick={onClose}>
      <div 
        className="glass-card slide-up" 
        style={{ maxWidth: '420px', padding: '2rem', position: 'relative', width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(139,92,246,0.15)', color: 'var(--color-primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Download size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Download Portal App</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Add this application directly to your home screen for quick, fullscreen access to your projects.
          </p>
        </div>

        {/* Installation Actions */}
        {isIOS ? (
          // iOS Safari instructions
          <div style={{ background: 'rgba(139,92,246,0.05)', border: '1px dashed var(--color-primary-light)', borderRadius: '12px', padding: '1.25rem', textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpRight size={16} style={{ color: 'var(--color-primary-light)' }} />
              How to Install on iPhone:
            </h4>
            <ol style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.4 }}>
              <li>Open this website in the <strong>Safari</strong> browser.</li>
              <li>Tap the <strong>Share</strong> button (box with an up arrow) at the bottom.</li>
              <li>Scroll down and select <strong>"Add to Home Screen"</strong>.</li>
            </ol>
          </div>
        ) : (
          // Chrome/Android/Desktop
          <div>
            {deferredPrompt ? (
              <button 
                onClick={handleInstallClick}
                className="btn-hero-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Install Now
              </button>
            ) : (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border-color)', borderRadius: '12px', padding: '1.25rem', textAlign: 'left', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <AlertCircle size={18} style={{ color: 'var(--color-primary-light)', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  Open your browser's options menu (click the **three dots** in Chrome, or the **install icon** in the address bar) and select **"Install App"** or **"Add to Home screen"**.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
