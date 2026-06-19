import React, { useState, useEffect, useRef } from 'react'
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  X, 
  Clock, 
  User, 
  Mail, 
  FileText, 
  MessageSquare,
  Sparkles,
  Download,
  AlertCircle
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
  const fetchRequestDetails = async () => {
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
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError('')
    fetchRequestDetails()
  }, [trackingCode])

  // Setup Real-time & Polling
  useEffect(() => {
    if (!request?.id) return

    // Real-time listener
    const channel = supabase
      .channel(`request_changes_${request.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'requests',
          filter: `id=eq.${request.id}`
        },
        (payload) => {
          setRequest(payload.new)
        }
      )
      .subscribe()

    // Polling interval (backup if RLS / websocket fails)
    const interval = setInterval(() => {
      fetchRequestDetails()
    }, 6000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [request?.id])

  // Scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [request?.thread])

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Handle chat file attachment
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

  // Send Message
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

    // Append to existing thread
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
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--color-text-secondary)' }}>
        <div className="placeholder-icon" style={{ animation: 'spin 2s linear infinite' }}>🔄</div>
        <h3>Loading request details...</h3>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="glass-card" style={{ maxWidth: '550px', margin: '4rem auto', padding: '3rem', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--status-declined)', marginBottom: '1.5rem', marginInline: 'auto' }} />
        <h3>Retrieval Failed</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>{error || 'Request not found.'}</p>
        <button onClick={onBack} className="btn-hero-primary" style={{ marginInline: 'auto' }}>
          Go Back
        </button>
      </div>
    )
  }

  // Format file size
  const formatBytes = (bytes) => {
    if (!bytes) return ''
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="fade-in">
      {/* Back Header */}
      <div className="back-btn-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} className="btn-back">
          <ArrowLeft size={16} /> {isAdminView ? 'Back to Dashboard' : 'Back to Portal'}
        </button>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} /> Last updated: {formatDate(request.updated_at)}
        </div>
      </div>

      <div className="request-details-grid">
        {/* Left Side: Request Details Card */}
        <div className="details-panel glass-card">
          <div className="detail-row">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="detail-label">Tracking Code</div>
                <div className="tracking-code-value" style={{ fontSize: '1.4rem', fontFamily: 'monospace' }}>
                  {request.tracking_code}
                </div>
              </div>
              <span className={`status-badge ${request.status}`}>
                {request.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Subject / Title</div>
            <div className="detail-value" style={{ fontSize: '1.1rem' }}>{request.title}</div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Client Name</div>
            <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} className="text-muted" /> {request.customer_name}
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Contact Information</div>
            <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} className="text-muted" /> {request.contact_info}
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Original Description</div>
            <div className="detail-desc">{request.thread?.[0]?.message || 'No description provided.'}</div>
          </div>

          {/* Original Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <div className="detail-row">
              <div className="detail-label">Attached Files ({request.attachments.length})</div>
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

        {/* Right Side: Message Inbox Thread */}
        <div className="chat-container glass-card">
          <div className="chat-header">
            <div className="chat-header-title">
              <MessageSquare size={18} className="text-primary" style={{ color: 'var(--color-primary)' }} />
              Project Chat
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <Sparkles size={12} className="text-primary" style={{ color: 'var(--color-secondary)' }} />
              Live Conversation
            </div>
          </div>

          {/* Messages List */}
          <div className="chat-messages-area">
            {request.thread && request.thread.length > 0 ? (
              request.thread.map((msg, idx) => {
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

                    {/* Chat file inside bubbles */}
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
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {msg.attachment.name}
                        </span>
                        <Download size={12} />
                      </div>
                    )}
                    
                    <div className="msg-meta">
                      {msg.sender === 'admin' ? 'Yamen' : 'You'} • {formatDate(msg.created_at)}
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                No messages yet.
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Send Message Area */}
          <div className="chat-input-area">
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <button 
                type="button" 
                className="btn-nav" 
                style={{ padding: '10px', borderRadius: '50%' }}
                onClick={() => fileInputRef.current?.click()}
                title="Attach photo/file"
              >
                <Paperclip size={18} />
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
                placeholder="Type your message here..." 
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

      {/* Lightbox for file viewer */}
      {activeLightboxFile && (
        <Lightbox 
          file={activeLightboxFile} 
          onClose={() => setActiveLightboxFile(null)} 
        />
      )}
    </div>
  )
}
