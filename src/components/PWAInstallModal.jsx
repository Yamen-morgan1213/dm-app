import React, { useEffect, useState } from 'react'
import { Download, X, AlertCircle, Sparkles, Bell, ArrowUpRight } from 'lucide-react'
import { requestNotificationPermission } from '../lib/notifications'

export default function PWAInstallModal({ isOpen, onClose, deferredPrompt, onInstallSuccess }) {
  const [isIOS, setIsIOS] = useState(false)
  const [notifGranted, setNotifGranted] = useState(false)

  useEffect(() => {
    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isAppleDevice)

    // Check if notification permission is already granted
    if ('Notification' in window) {
      setNotifGranted(Notification.permission === 'granted')
    }
  }, [])

  if (!isOpen) return null

  const handleInstallClick = async () => {
    // Request notification permission first
    const granted = await requestNotificationPermission()
    setNotifGranted(granted)

    if (deferredPrompt) {
      // Trigger native installation prompt
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        if (onInstallSuccess) onInstallSuccess()
        onClose()
      }
    }
  }

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission()
    setNotifGranted(granted)
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 11000 }}>
      <div className="glass-card slide-up" style={{ maxWidth: '420px', padding: '2rem', position: 'relative' }}>
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Download Mobile & Desktop App</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Install this portal on your phone or desktop to get instant notifications and access it directly from your home screen.
          </p>
        </div>

        {/* Step 1: Notifications */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ color: notifGranted ? 'var(--status-completed)' : 'var(--color-primary)', marginTop: '2px' }}>
            <Bell size={18} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>Enable Real-Time Notifications</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              Be notified instantly when Yamen developer replies or updates your project.
            </p>
            <button 
              onClick={handleEnableNotifications}
              disabled={notifGranted}
              className={`btn-nav ${notifGranted ? 'completed' : ''}`}
              style={{ fontSize: '0.75rem', padding: '4px 10px', height: 'auto', background: notifGranted ? 'rgba(16,185,129,0.1)' : 'var(--grad-primary)', color: notifGranted ? 'var(--status-completed)' : '#fff' }}
            >
              {notifGranted ? '✓ Enabled' : 'Enable Notifications'}
            </button>
          </div>
        </div>

        {/* Step 2: Installation Method */}
        {isIOS ? (
          // iOS Safari instructions
          <div style={{ background: 'rgba(139,92,246,0.05)', border: '1px dashed var(--color-primary-light)', borderRadius: '12px', padding: '1.25rem', textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpRight size={16} style={{ color: 'var(--color-primary-light)' }} />
              How to Install on iPhone / iPad:
            </h4>
            <ol style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Open this page in the <strong>Safari</strong> browser.</li>
              <li>Tap the <strong>Share</strong> button (box with an up arrow) at the bottom.</li>
              <li>Scroll down the list and select <strong>"Add to Home Screen"</strong>.</li>
            </ol>
          </div>
        ) : (
          // Chrome/Android/Desktop native prompt
          <div>
            {deferredPrompt ? (
              <button 
                onClick={handleInstallClick}
                className="btn-hero-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Sparkles size={16} style={{ marginRight: '8px' }} />
                Install Application
              </button>
            ) : (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border-color)', borderRadius: '12px', padding: '1.25rem', textAlign: 'left', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <AlertCircle size={18} style={{ color: 'var(--color-primary-light)', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  To download, open your browser options menu (the <strong>three dots</strong> or <strong>install icon</strong> in the URL bar) and click <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
