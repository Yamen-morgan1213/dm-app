import React, { useEffect, useState } from 'react'
import { Download, X, Smartphone, Monitor } from 'lucide-react'

export default function PWAInstallModal({ isOpen, onClose, deferredPrompt, onInstallSuccess }) {
  const [isIOS, setIsIOS] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase()
    setIsIOS(/iphone|ipad|ipod/.test(ua))
    setIsMobile(/android|iphone|ipad|ipod|mobile/i.test(ua))
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
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="glass-card slide-up" 
        style={{ maxWidth: '400px', padding: '2rem 1.75rem', position: 'relative', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(139,92,246,0.15)', color: 'var(--color-primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            {isMobile ? <Smartphone size={28} /> : <Monitor size={28} />}
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
            {isMobile ? 'Install Mobile App' : 'Install Desktop App'}
          </h2>
        </div>

        {/* If native prompt is available, show direct install button */}
        {deferredPrompt ? (
          <button 
            onClick={handleInstallClick}
            className="btn-hero-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '14px' }}
          >
            <Download size={18} style={{ marginRight: '8px' }} />
            Install Now
          </button>
        ) : isIOS ? (
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Follow these steps to add the app to your home screen:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139,92,246,0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>1</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Tap the <strong>Share</strong> button at the bottom of Safari</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139,92,246,0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>2</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139,92,246,0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>3</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Tap <strong>"Add"</strong> to confirm</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
              To install this app on your device:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139,92,246,0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>1</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Look for the <strong>install icon</strong> in your browser's address bar</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139,92,246,0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>2</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Or click the <strong>three dots menu</strong> → <strong>"Install App"</strong></span>
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1rem', lineHeight: 1.4 }}>
              The app will appear on your desktop or home screen with its own icon.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
