import React from 'react'
import { X, Download, FileText } from 'lucide-react'

export default function Lightbox({ file, onClose }) {
  const [isBroken, setIsBroken] = React.useState(false)
  if (!file) return null

  // Function to format file size
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isImage = (file.type?.startsWith('image/') || file.url?.startsWith('data:image/')) && !isBroken

  return (
    <div className="lightbox fade-in" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="btn-lightbox-close" onClick={onClose}>
          <X size={28} />
        </button>

        {isImage ? (
          <img src={file.url} alt={file.name} onError={() => setIsBroken(true)} />
        ) : (
          <div 
            style={{ 
              background: 'var(--bg-card)', 
              padding: '3rem', 
              borderRadius: 'var(--radius-md)', 
              textAlign: 'center',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5rem',
              minWidth: '300px'
            }}
          >
            <FileText size={64} className="text-primary" style={{ color: 'var(--color-primary)' }} />
            <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>{file.name}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{formatBytes(file.size)}</div>
          </div>
        )}

        <div className="lightbox-caption">
          <div>{file.name} ({formatBytes(file.size)})</div>
          <a 
            href={file.url} 
            download={file.name} 
            className="btn-lightbox-download"
          >
            <Download size={14} /> Download File
          </a>
        </div>
      </div>
    </div>
  )
}
