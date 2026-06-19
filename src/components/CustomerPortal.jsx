import React, { useState, useEffect } from 'react'
import { 
  Send, 
  Search, 
  UploadCloud, 
  FileText, 
  X, 
  Check, 
  Copy, 
  ArrowLeft, 
  Clock, 
  PlusCircle, 
  Eye,
  Paperclip,
  CheckCircle2
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function CustomerPortal({ onTrackRequest, activeTrackCode }) {
  const [mode, setMode] = useState('home') // home, new, track, success
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState([]) // Array of { file, preview, base64 }
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchCode, setSearchCode] = useState('')
  const [searchError, setSearchError] = useState('')
  const [recentCodes, setRecentCodes] = useState([])
  const [generatedCode, setGeneratedCode] = useState('')
  const [copied, setCopied] = useState(false)

  // Web Developer Request parameters
  const [projectType, setProjectType] = useState('Custom Web App')
  const [budget, setBudget] = useState('$1,500 - $5,000')
  const [timeline, setTimeline] = useState('Standard (2-4 weeks)')
  const [selectedFeatures, setSelectedFeatures] = useState([])

  const availableFeatures = [
    'User Authentication',
    'E-commerce & Payments',
    'Database Sync & APIs',
    'Admin Control Panel',
    'Responsive Mobile Layout',
    'SEO & Performance Boost'
  ]

  const toggleFeature = (feature) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feature))
    } else {
      setSelectedFeatures([...selectedFeatures, feature])
    }
  }

  // Load recent tracking codes from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dm_recent_requests')
    if (stored) {
      try {
        setRecentCodes(JSON.parse(stored))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  // If track code is clicked from recent
  const handleTrackRecent = (code) => {
    onTrackRequest(code)
  }

  // Generate unique tracking code
  const generateTrackingCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'DM-'
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  // File upload change handler
  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files)
    processFiles(selectedFiles)
  }

  const processFiles = async (selectedFiles) => {
    const newFiles = []
    
    for (let file of selectedFiles) {
      if (file.size > 2.5 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 2.5MB size limit.`)
        continue
      }

      // Read as base64
      try {
        const base64 = await fileToBase64(file)
        const isImage = file.type.startsWith('image/')
        
        newFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          preview: isImage ? base64 : null,
          base64: base64
        })
      } catch (err) {
        console.error('Error reading file:', err)
      }
    }

    setFiles([...files, ...newFiles])
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const removeFile = (index) => {
    const updated = [...files]
    updated.splice(index, 1)
    setFiles(updated)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files))
    }
  }

  // Submit Request
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !contact.trim() || !title.trim() || !message.trim()) {
      alert('Please fill out all required fields.')
      return
    }

    setIsSubmitting(true)
    const trackingCode = generateTrackingCode()

    // Package attachments
    const attachments = files.map(f => ({
      name: f.name,
      url: f.base64,
      size: f.size,
      type: f.type
    }))

    // Format full details including custom web developer request parameters
    const formattedMessage = `--- Web Development Request ---
Project Type: ${projectType}
Estimated Budget: ${budget}
Timeline: ${timeline}
Requested Features: ${selectedFeatures.length > 0 ? selectedFeatures.join(', ') : 'None'}

--- Client Message / Notes ---
${message}`

    // Thread initialization
    const initialThread = [
      {
        sender: 'customer',
        message: formattedMessage,
        created_at: new Date().toISOString()
      }
    ]

    try {
      const { data, error } = await supabase
        .from('requests')
        .insert([
          {
            tracking_code: trackingCode,
            customer_name: name,
            contact_info: contact,
            title: title,
            status: 'pending',
            thread: initialThread,
            attachments: attachments
          }
        ])
        .select()

      if (error) throw error

      // Save code locally
      const updatedCodes = [
        { code: trackingCode, title: title, date: new Date().toLocaleDateString() },
        ...recentCodes.filter(c => c.code !== trackingCode)
      ].slice(0, 10) // Limit to last 10

      localStorage.setItem('dm_recent_requests', JSON.stringify(updatedCodes))
      setRecentCodes(updatedCodes)

      setGeneratedCode(trackingCode)
      setMode('success')
      
      // Reset form
      setName('')
      setContact('')
      setTitle('')
      setMessage('')
      setFiles([])
      setProjectType('Custom Web App')
      setBudget('$1,500 - $5,000')
      setTimeline('Standard (2-4 weeks)')
      setSelectedFeatures([])
    } catch (err) {
      console.error(err)
      alert('Error submitting request: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Track Code Submit
  const handleTrackSubmit = async (e) => {
    e.preventDefault()
    const cleanCode = searchCode.trim().toUpperCase()
    if (!cleanCode) return

    setIsSubmitting(true)
    setSearchError('')

    try {
      const { data, error } = await supabase
        .from('requests')
        .select('tracking_code')
        .eq('tracking_code', cleanCode)
        .single()

      if (error || !data) {
        setSearchError('Invalid tracking code. Please verify and try again.')
      } else {
        onTrackRequest(cleanCode)
      }
    } catch (err) {
      console.error(err)
      setSearchError('Error searching tracking code: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fade-in">
      {/* Home Mode */}
      {mode === 'home' && (
        <>
          <div className="landing-hero slide-up">
            <h1 className="hero-title">
              Welcome to <span className="hero-gradient-text">Yamen Ebrahim's</span> <br />
              Development Studio
            </h1>
            <p className="hero-subtitle">
              Submit your web development requests, specify required capabilities, budget, and timeline, and chat directly with Yamen in a premium, real-time message board.
            </p>
            <div className="hero-actions">
              <button onClick={() => setMode('new')} className="btn-hero-primary">
                <PlusCircle size={20} /> Create New Request
              </button>
              <button onClick={() => setMode('track')} className="btn-hero-secondary">
                <Clock size={20} /> Track Existing Request
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="features-grid slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="feature-card glass-card glass-card-glow">
              <div className="feature-icon-wrapper">
                <Send size={24} />
              </div>
              <h3>Instant Submission</h3>
              <p>State your needs, enter contact info, and generate a secure tracking key to stay connected instantly.</p>
            </div>
            
            <div className="feature-card glass-card glass-card-glow">
              <div className="feature-icon-wrapper">
                <Paperclip size={24} />
              </div>
              <h3>Photos & Files</h3>
              <p>Upload layout designs, sample images, documents or photos up to 2.5MB per file to illustrate your idea.</p>
            </div>

            <div className="feature-card glass-card glass-card-glow">
              <div className="feature-icon-wrapper">
                <CheckCircle2 size={24} />
              </div>
              <h3>Real-Time Tracking</h3>
              <p>Watch request status updates and exchange live direct messages with the administrator as we build.</p>
            </div>
          </div>

          {/* Recent Requests Section */}
          {recentCodes.length > 0 && (
            <div className="slide-up" style={{ animationDelay: '0.2s', maxWidth: '650px', margin: '0 auto 3rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '1rem', textAlign: 'left' }}>
                Your Recent Requests
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentCodes.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleTrackRecent(item.code)}
                    className="glass-card" 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '1rem 1.25rem', 
                      cursor: 'pointer',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{item.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        Submitted {item.date}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                        {item.code}
                      </span>
                      <Eye size={16} className="text-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* New Request Mode */}
      {mode === 'new' && (
        <div className="slide-up">
          <div className="back-btn-wrapper">
            <button onClick={() => setMode('home')} className="btn-back">
              <ArrowLeft size={16} /> Back to Home
            </button>
          </div>

          <div className="form-container glass-card">
            <div className="form-title-area">
              <h2>New Request Details</h2>
              <p>Tell us what you want, attach any relevant assets, and we'll reply directly.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name / Organization *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. John Doe or Acme Corp" 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Email or Phone *</label>
                <input 
                  type="text" 
                  value={contact} 
                  onChange={e => setContact(e.target.value)} 
                  placeholder="e.g. john@example.com or +12345678" 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Request Title / Topic *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. Redesign Landing Page / Custom App Development" 
                  required
                />
              </div>

              {/* Web Dev Questionnaire Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Project Type *</label>
                  <select value={projectType} onChange={e => setProjectType(e.target.value)}>
                    <option value="Custom Web App">Custom Web App</option>
                    <option value="E-commerce Store">E-commerce Store</option>
                    <option value="Landing Page / Showcase">Landing Page / Showcase</option>
                    <option value="Mobile App Development">Mobile App Development</option>
                    <option value="SEO & Performance Optimization">SEO & Performance</option>
                    <option value="Other / Consultancy">Other / Consultancy</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Estimated Budget *</label>
                  <select value={budget} onChange={e => setBudget(e.target.value)}>
                    <option value="< $500">&lt; $500</option>
                    <option value="$500 - $1,500">$500 - $1,500</option>
                    <option value="$1,500 - $5,000">$1,500 - $5,000</option>
                    <option value="$5,000+">$5,000+</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target Timeline *</label>
                <select value={timeline} onChange={e => setTimeline(e.target.value)}>
                  <option value="Urgently (< 2 weeks)">Urgently (&lt; 2 weeks)</option>
                  <option value="Standard (2-4 weeks)">Standard (2-4 weeks)</option>
                  <option value="Flexible (1-2 months)">Flexible (1-2 months)</option>
                  <option value="Long Term Collaboration">Long Term Collaboration</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Requested Capabilities & Features</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {availableFeatures.map((feat) => {
                    const isSelected = selectedFeatures.includes(feat);
                    return (
                      <label 
                        key={feat} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                          background: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                          border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                          boxShadow: isSelected ? '0 0 10px rgba(139, 92, 246, 0.15)' : 'none',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleFeature(feat)}
                          style={{ width: 'auto', cursor: 'pointer' }}
                        />
                        {feat}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description of Needs *</label>
                <textarea 
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  placeholder="Describe your project, timeline, budget, or other notes in detail..." 
                  rows={5}
                  required
                />
              </div>

              {/* Upload Zone */}
              <div className="form-group">
                <label className="form-label">Photos & Files (Max 2.5MB each)</label>
                <div 
                  className="upload-zone"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <input 
                    type="file" 
                    id="file-input" 
                    className="hidden-file-input" 
                    multiple 
                    onChange={handleFileChange}
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <div className="upload-icon-wrapper">
                    <UploadCloud size={36} />
                  </div>
                  <div className="upload-text-main">Drag & Drop files here</div>
                  <div className="upload-text-sub">or click to browse from computer</div>
                </div>

                {/* Previews */}
                {files.length > 0 && (
                  <div className="files-preview-list">
                    {files.map((file, index) => (
                      <div key={index} className="file-preview-card">
                        {file.preview ? (
                          <img src={file.preview} alt="Preview" className="preview-image" />
                        ) : (
                          <div className="preview-file-icon">
                            <FileText size={24} />
                          </div>
                        )}
                        <div className="preview-file-name">{file.name}</div>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFile(index)
                          }} 
                          className="btn-remove-file"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="btn-submit-form" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting Details...' : 'Submit Request'}
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Track Request Mode */}
      {mode === 'track' && (
        <div className="slide-up">
          <div className="back-btn-wrapper">
            <button onClick={() => setMode('home')} className="btn-back">
              <ArrowLeft size={16} /> Back to Home
            </button>
          </div>

          <div className="tracking-search-container glass-card">
            <div className="tracking-search-title">Track Your Request</div>
            <p className="tracking-search-desc">
              Enter the unique tracking code you received when submitting your request to access the chat and status tracker.
            </p>

            <form onSubmit={handleTrackSubmit} className="tracking-search-form">
              <input 
                type="text" 
                value={searchCode} 
                onChange={e => setSearchCode(e.target.value)} 
                placeholder="DM-XXXXXX" 
                className="tracking-search-input"
                required
              />
              <button 
                type="submit" 
                className="btn-tracking-search" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Searching...' : 'Track'}
                <Search size={18} style={{ marginLeft: '8px' }} />
              </button>
            </form>

            {searchError && (
              <div className="login-error-msg" style={{ marginTop: '0', marginBottom: '1.5rem' }}>
                {searchError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Mode */}
      {mode === 'success' && (
        <div className="success-card glass-card slide-up">
          <div className="success-icon-wrapper">
            <Check size={40} />
          </div>
          <h2 className="success-title">Request Submitted Successfully!</h2>
          <p className="success-desc">
            Your request has been filed in our database. Please save the tracking code below. 
            You can use it to track our progress, download design outputs, and send messages back and forth.
          </p>

          <div className="tracking-code-display-box">
            <div className="tracking-code-label">Your Tracking Code</div>
            <div className="tracking-code-value">{generatedCode}</div>
            <button onClick={copyCodeToClipboard} className="btn-copy-code">
              {copied ? <Check size={16} className="text-completed" /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {copied && <div className="copied-toast">Copied to clipboard!</div>}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => onTrackRequest(generatedCode)} className="btn-hero-primary">
              <Eye size={18} /> Open Status & Chat
            </button>
            <button onClick={() => setMode('home')} className="btn-hero-secondary">
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
