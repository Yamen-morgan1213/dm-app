import React, { useState, useEffect, useRef } from 'react'
import { 
  ArrowLeft, Send, Paperclip, X, Clock, User, Mail, FileText, 
  MessageSquare, Sparkles, Download, AlertCircle, RefreshCw,
  FolderPlus, Layers, Calendar, ExternalLink
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import Lightbox from './Lightbox'

export default function RequestDetails({ trackingCode, onBack, isAdminView = false }) {
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [chatFile, setChatFile] = useState(null) // { name, base64, size, type }
  const [sending, setSending] = useState(false)
  const [activeLightboxFile, setActiveLightboxFile] = useState(null)
  
  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Fetch request details
  const fetchRequestDetails = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('tracking_code', trackingCode)
        .single()

      if (error) throw error
      setRequest(data)
    } catch (err) {
      console.error(err)
      setError('Could not retrieve request details. Please check the tracking code.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequestDetails(true)
  }, [trackingCode])

  // Setup Real-time & Polling
  useEffect(() => {
    if (!request?.id) return

    // Real-time listener
    const channel = supabase
      .channel(`request_changes_${request.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'requests', filter: `id=eq.${request.id}` },
        (payload) => {
          setRequest(payload.new)
        }
      )
      .subscribe()

    // Backup polling every 8s
    const interval = setInterval(() => {
      fetchRequestDetails(false)
    }, 8000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [request?.id])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [request?.thread])

  const formatDate = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleChatFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2.5 * 1024 * 1024) {
      alert('Files in chat must be under 2.5MB.')
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      setChatFile({
        name: file.name,
        size: file.size,
        type: file.type,
        base64: reader.result
      })
    }
    reader.onerror = (error) => {
      console.error('Error reading file:', error)
    }
  }

  const removeChatFile = () => {
    setChatFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() && !chatFile) return

    setSending(true)
    const chatMsg = {
      sender: isAdminView ? 'admin' : 'customer',
      message: newMessage.trim(),
      created_at: new Date().toISOString()
    }

    if (chatFile) {
      chatMsg.attachment = {
        name: chatFile.name,
        url: chatFile.base64,
        size: chatFile.size,
        type: chatFile.type
      }
    }

    const updatedThread = [...(request.thread || []), chatMsg]

    try {
      const { data, error } = await supabase
        .from('requests')
        .update({
          thread: updatedThread,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id)
        .select()
        .single()

      if (error) throw error
      setRequest(data)
      setNewMessage('')
      setChatFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error(err)
      alert('Failed to send message: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--color-text-secondary)' }}>
        <div className="placeholder-icon spin-anim" style={{ fontSize: '2rem', display: 'inline-block', marginBottom: '1rem' }}>🔄</div>
        <h3>Securing connection thread...</h3>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="glass-card" style={{ maxWidth: '580px', margin: '4rem auto', padding: '3.5rem', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--status-declined)', marginBottom: '1.5rem', marginInline: 'auto' }} />
        <h3>Retrieval Failed</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>{error || 'Request room not found.'}</p>
        <button onClick={onBack} className="btn-hero-primary" style={{ marginInline: 'auto' }}>
          Go Back
        </button>
      </div>
    )
  }

  const formatBytes = (bytes) => {
    if (!bytes) return ''
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Extract web development parameters if present
  let devParams = null
  const descText = request.thread?.[0]?.message || ''
  if (descText.includes('--- Web Development Request ---')) {
    try {
      const parts = descText.split('--- Client Message / Notes ---')
      const paramBlock = parts[0].replace('--- Web Development Request ---', '').trim()
      const lines = paramBlock.split('\n').filter(l => l.trim() !== '')
      
      devParams = {
        projectType: lines.find(l => l.startsWith('Project Type:'))?.replace('Project Type:', '').trim(),
        budget: lines.find(l => l.startsWith('Estimated Budget:'))?.replace('Estimated Budget:', '').trim(),
        timeline: lines.find(l => l.startsWith('Timeline:'))?.replace('Timeline:', '').trim(),
        features: lines.find(l => l.startsWith('Requested Features:'))?.replace('Requested Features:', '').trim(),
        notes: parts[1]?.trim() || ''
      }
    } catch (e) {
      console.warn('Params extraction failed:', e)
    }
  }

  return (
    <div className="fade-in" style={{ width: '100%' }}>
      {/* Header */}
      {!isAdminView && (
        <div className="back-btn-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onBack} className="btn-back">
            <ArrowLeft size={16} /> Back to Portal
          </button>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} /> Synced: {formatDate(request.updated_at)}
          </div>
        </div>
      )}

      <div className="request-details-grid">
        {/* Left Side: Specifications Panel */}
        <div className="details-panel glass-card">
          <div className="detail-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="detail-label">Project Tracking ID</div>
                <div className="tracking-code-value" style={{ fontSize: '1.35rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--color-primary-light)' }}>
                  {request.tracking_code}
                </div>
              </div>
              {!isAdminView && (
                <span className={`status-badge ${request.status}`}>
                  {request.status.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Subject / Title</div>
            <div className="detail-value" style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 750 }}>
              {request.title}
            </div>
          </div>

          {/* Render Extracted Specifications */}
          {devParams ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="detail-row">
                <div>
                  <div className="detail-label">Project Type</div>
                  <div className="detail-value" style={{ fontSize: '0.9rem' }}>{devParams.projectType}</div>
                </div>
                <div>
                  <div className="detail-label">Timeline</div>
                  <div className="detail-value" style={{ fontSize: '0.9rem' }}>{devParams.timeline}</div>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">Budget Range</div>
                <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--status-completed)', fontSize: '0.9rem' }}>
                  💰 {devParams.budget}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">Included Features</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {devParams.features && devParams.features !== 'None' ? (
                    devParams.features.split(', ').map((f, i) => (
                      <span 
                        key={i} 
                        style={{ 
                          fontSize: '0.72rem', 
                          background: 'rgba(255,255,255,0.03)', 
                          border: '1px solid var(--border-color)', 
                          color: 'var(--color-text-secondary)',
                          padding: '3px 8px',
                          borderRadius: '12px'
                        }}
                      >
                        {f}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>None specified</span>
                  )}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">Project Overview</div>
                <div className="detail-desc" style={{ fontSize: '0.92rem' }}>{devParams.notes}</div>
              </div>
            </>
          ) : (
            <div className="detail-row">
              <div className="detail-label">Project Overview</div>
              <div className="detail-desc" style={{ fontSize: '0.92rem' }}>{descText}</div>
            </div>
          )}

          {/* Client contact info visible to admin */}
          {isAdminView && (
            <div className="detail-row" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
              <div className="detail-label">Client Details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  <User size={14} className="text-muted" /> <strong style={{ color: '#fff' }}>{request.customer_name}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  <Mail size={14} className="text-muted" /> {request.contact_info}
                </div>
              </div>
            </div>
          )}

          {/* Original Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <div className="detail-row">
              <div className="detail-label">Reference Files ({request.attachments.length})</div>
              <div className="attachments-grid">
                {request.attachments.map((file, idx) => {
                  const isImg = file.type?.startsWith('image/') || file.url?.startsWith('data:image/')
                  return (
                    <div 
                      key={idx} 
                      className="attachment-preview-thumb"
                      onClick={() => setActiveLightboxFile(file)}
                      title={`${file.name} (${formatBytes(file.size)})`}
                    >
                      {isImg ? (
                        <img src={file.url} alt={file.name} />
                      ) : (
                        <FileText size={20} className="attachment-file-icon" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Chat Feed */}
        <div className="chat-container glass-card">
          <div className="chat-header">
            <div className="chat-header-title">
              <MessageSquare size={18} className="text-primary" />
              <span>Project Chatroom</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              <span className="live-dot"></span>
              <span>Syncing live</span>
            </div>
          </div>

          <div className="chat-messages-area">
            {request.thread && request.thread.length > 0 ? (
              request.thread.map((msg, idx) => {
                // If it is the first message block describing the project, we skip showing it here since it is already on the left
                if (idx === 0 && devParams) return null
                
                const isSentByMe = isAdminView ? (msg.sender === 'admin') : (msg.sender === 'customer')
                
                return (
                  <div 
                    key={idx} 
                    className={`msg-bubble-wrapper ${isSentByMe ? 'customer-msg' : 'admin-msg'}`}
                  >
                    {msg.message && (
                      <div className="msg-bubble">
                        {msg.message}
                      </div>
                    )}

                    {msg.attachment && (
                      <div 
                        className="chat-attachment-indicator" 
                        onClick={() => setActiveLightboxFile(msg.attachment)}
                        style={{ cursor: 'pointer', alignSelf: isSentByMe ? 'flex-end' : 'flex-start' }}
                      >
                        {(msg.attachment.type?.startsWith('image/') || msg.attachment.url?.startsWith('data:image/')) ? (
                          <img src={msg.attachment.url} alt={msg.attachment.name} />
                        ) : (
                          <FileText size={16} />
                        )}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                          {msg.attachment.name}
                        </span>
                        <Download size={12} style={{ opacity: 0.6 }} />
                      </div>
                    )}
                    
                    <div className="msg-meta">
                      {msg.sender === 'admin' ? 'Yamen (Developer)' : 'You'} • {formatDate(msg.created_at)}
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
                No messages yet. Send a message to start.
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Send Input */}
          <div className="chat-input-area">
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <button 
                type="button" 
                className="btn-nav" 
                style={{ padding: '12px', borderRadius: '50%', flexShrink: 0 }}
                onClick={() => fileInputRef.current?.click()}
                title="Attach reference mockups"
              >
                <Paperclip size={16} />
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleChatFileChange} 
                style={{ display: 'none' }}
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
              />

              <input 
                type="text" 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)} 
                placeholder="Send file mockups or messages here..." 
                className="chat-input-field"
                disabled={sending}
              />

              <button 
                type="submit" 
                className="btn-chat-send"
                disabled={sending || (!newMessage.trim() && !chatFile)}
              >
                <Send size={16} />
              </button>
            </form>

            {chatFile && (
              <div className="chat-attachment-indicator" style={{ marginTop: '0.75rem', maxWidth: '100%' }}>
                {chatFile.preview ? (
                  <img src={chatFile.preview} alt="Attached" />
                ) : (
                  <FileText size={16} />
                )}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {chatFile.name} ({formatBytes(chatFile.size)})
                </span>
                <button onClick={removeChatFile} style={{ background: 'none', color: 'var(--color-text-muted)' }}>
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeLightboxFile && (
        <Lightbox 
          file={activeLightboxFile} 
          onClose={() => setActiveLightboxFile(null)} 
        />
      )}
    </div>
  )
}
