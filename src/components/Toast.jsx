import React, { useState, useCallback, createContext, useContext } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(t => {
            const icons = {
              success: <CheckCircle2 size={18} />,
              error: <AlertCircle size={18} />,
              warning: <AlertCircle size={18} />,
              info: <Info size={18} />
            }
            const colors = {
              success: 'var(--status-completed)',
              error: 'var(--status-declined)',
              warning: 'var(--status-pending)',
              info: 'var(--color-primary)'
            }
            return (
              <div 
                key={t.id} 
                className="toast" 
                style={{ borderLeftColor: colors[t.type] || colors.info }}
              >
                <div className="toast-icon" style={{ 
                  color: colors[t.type] || colors.info,
                  background: `${colors[t.type]}15` || 'rgba(139,92,246,0.1)'
                }}>
                  {icons[t.type] || icons.info}
                </div>
                <div className="toast-content">
                  <div className="toast-message" style={{ fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>
                    {t.message}
                  </div>
                </div>
                <button 
                  onClick={() => removeToast(t.id)} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--color-text-muted)', 
                    padding: '4px',
                    flexShrink: 0 
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </ToastContext.Provider>
  )
}
