import React, { useState, useEffect } from 'react'
import { 
  Send, Search, UploadCloud, FileText, X, Check, Copy, ArrowLeft, 
  Clock, PlusCircle, Eye, Paperclip, CheckCircle2, ChevronRight,
  Sparkles, DollarSign, Zap, MessageSquare, Star, ArrowRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function CustomerPortal({ onTrackRequest, activeTrackCode }) {
  const [mode, setMode] = useState('home') // home, new, track, success
  const [formStep, setFormStep] = useState(1) // 1, 2, 3

  // Form Fields
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

  const handleTrackRecent = (code) => {
    onTrackRequest(code)
  }

  const generateTrackingCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'DM-'
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !contact.trim() || !title.trim() || !message.trim()) {
      alert('Please fill out all required fields.')
      return
    }

    setIsSubmitting(true)
    const trackingCode = generateTrackingCode()
    const attachments = files.map(f => ({
      name: f.name,
      url: f.base64,
      size: f.size,
      type: f.type
    }))

    const formattedMessage = `--- Web Development Request ---
Project Type: ${projectType}
Estimated Budget: ${budget}
Timeline: ${timeline}
Requested Features: ${selectedFeatures.length > 0 ? selectedFeatures.join(', ') : 'None'}

--- Client Message / Notes ---
${message}`

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

      const updatedCodes = [
        { code: trackingCode, title: title, date: new Date().toLocaleDateString() },
        ...recentCodes.filter(c => c.code !== trackingCode)
      ].slice(0, 10)

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
      setFormStep(1)
    } catch (err) {
      console.error(err)
      alert('Error submitting request: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

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
        setSearchError('Invalid tracking code. Please check and try again.')
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

  // Next step validation
  const validateStep = (step) => {
    if (step === 1) {
      if (!title.trim() || !projectType) {
        alert('Please fill out the project title and select a type.')
        return false
      }
    } else if (step === 2) {
      if (!message.trim() || !budget || !timeline) {
        alert('Please describe your project and select budget/timeline.')
        return false
      }
    }
    return true
  }

  return (
    <div className="fade-in">
      {/* Home Mode */}
      {mode === 'home' && (
        <>
          <div className="landing-hero slide-up">
            <div className="inline-badge">
              <Sparkles size={14} className="text-primary" />
              <span>Full-Stack Web Development Agency</span>
            </div>
            <h1 className="hero-title">
              Need a Website? <br />
              <span className="hero-gradient-text">Let Yamen Build It.</span>
            </h1>
            <p className="hero-subtitle">
              SaaS platforms, e-commerce, custom web applications, or landing pages. Build your project with fully transparent progress tracking, real-time messaging, and lightning-fast developer delivery.
            </p>
            <div className="hero-actions">
              <button onClick={() => setMode('new')} className="btn-hero-primary">
                <PlusCircle size={20} /> Hire Me — Start a Project
              </button>
              <button onClick={() => setMode('track')} className="btn-hero-secondary">
                <Clock size={20} /> Track My Project
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="features-grid slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="feature-card glass-card glass-card-glow">
              <div className="feature-icon-wrapper">
                <Send size={24} />
              </div>
              <h3>1. Tell Your Vision</h3>
              <p>Define project specifications, pick features, set budget, and upload guidelines in our secure developer portal.</p>
            </div>
            
            <div className="feature-card glass-card glass-card-glow">
              <div className="feature-icon-wrapper">
                <MessageSquare size={24} />
              </div>
              <h3>2. Real-Time Chat</h3>
              <p>Skip complex email threads. Talk to me directly in a private, real-time project portal synced with database feeds.</p>
            </div>

            <div className="feature-card glass-card glass-card-glow">
              <div className="feature-icon-wrapper">
                <CheckCircle2 size={24} />
              </div>
              <h3>3. Live Tracking</h3>
              <p>Watch your project go from Pending, to In Progress, to Done. Direct file downloads and mockups loaded directly in chat.</p>
            </div>
          </div>

          {/* Guarantee / Review Row */}
          <div className="trust-row glass-card slide-up" style={{ animationDelay: '0.15s', margin: '0 auto 4rem', maxWidth: '850px', padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div className="trust-item" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="trust-stars" style={{ color: '#f59e0b', display: 'flex' }}>
                <Star size={16} fill="#f59e0b" /><Star size={16} fill="#f59e0b" /><Star size={16} fill="#f59e0b" /><Star size={16} fill="#f59e0b" /><Star size={16} fill="#f59e0b" />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>5.0 Rating on Upwork</span>
            </div>
            <div style={{ height: '24px', width: '1px', background: 'var(--border-color)', display: 'none' }} className="divider"></div>
            <div className="trust-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} className="text-primary" style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>100% On-Time Delivery</span>
            </div>
            <div className="trust-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={16} style={{ color: 'var(--status-completed)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Flexible Budget Milestones</span>
            </div>
          </div>

          {/* Active Projects List */}
          {recentCodes.length > 0 && (
            <div className="slide-up" style={{ animationDelay: '0.2s', maxWidth: '700px', margin: '0 auto 3rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '1.25rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} /> Your Projects
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentCodes.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleTrackRecent(item.code)}
                    className="glass-card active-project-row"
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '1.1rem 1.5rem', 
                      cursor: 'pointer',
                      border: '1px solid var(--border-color)',
                      transition: 'all 0.25s'
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 750, color: '#fff', fontSize: '1rem' }}>{item.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                        Created {item.date}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-primary-light)', background: 'rgba(139,92,246,0.06)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(139,92,246,0.1)' }}>
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

      {/* New Request Mode (Wizard Stepper Form) */}
      {mode === 'new' && (
        <div className="slide-up">
          <div className="back-btn-wrapper">
            <button onClick={() => { setMode('home'); setFormStep(1); }} className="btn-back">
              <ArrowLeft size={16} /> Back to Home
            </button>
          </div>

          <div className="form-container glass-card">
            {/* Step Indicators */}
            <div className="stepper-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
              {[1, 2, 3].map((stepNum) => (
                <div 
                  key={stepNum} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    color: formStep === stepNum ? '#fff' : (formStep > stepNum ? 'var(--status-completed)' : 'var(--color-text-muted)'),
                    fontWeight: formStep === stepNum ? 700 : 500,
                    fontSize: '0.85rem'
                  }}
                >
                  <span style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: formStep === stepNum ? 'var(--grad-primary)' : (formStep > stepNum ? 'var(--status-completed-bg)' : 'rgba(255,255,255,0.04)'),
                    border: formStep === stepNum ? 'none' : `1px solid ${formStep > stepNum ? 'var(--status-completed-border)' : 'var(--border-color)'}`,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: formStep === stepNum || formStep > stepNum ? '#fff' : 'var(--color-text-secondary)'
                  }}>
                    {formStep > stepNum ? <Check size={12} /> : stepNum}
                  </span>
                  <span>{stepNum === 1 ? 'Scope' : (stepNum === 2 ? 'Details' : 'Contact')}</span>
                </div>
              ))}
            </div>

            <div className="form-title-area">
              <h2>
                {formStep === 1 && "What project scope is needed?"}
                {formStep === 2 && "Tell me project specifications"}
                {formStep === 3 && "Where should I contact you?"}
              </h2>
              <p>
                {formStep === 1 && "Start by naming your project scope and selecting core features."}
                {formStep === 2 && "Enter your estimated budget, timeline, and detail description."}
                {formStep === 3 && "Provide your details so we can initiate live chat tracking."}
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); }}>
              {/* STEP 1: SCOPE */}
              {formStep === 1 && (
                <div className="fade-in">
                  <div className="form-group">
                    <label className="form-label">Project Name / What Are You Building? *</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      placeholder="e.g. Online Coffee Delivery Shop or SaaS Analytics Dashboard" 
                      required
                    />
                  </div>

                  <div className="form-group">
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

                  <div className="form-group">
                    <label className="form-label">Key Features Required</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                      {availableFeatures.map((feat) => {
                        const isSelected = selectedFeatures.includes(feat);
                        return (
                          <label 
                            key={feat} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px', 
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                              background: isSelected ? 'rgba(139, 92, 246, 0.05)' : 'rgba(255,255,255,0.01)',
                              border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                              padding: '10px 14px',
                              borderRadius: '8px',
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

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button 
                      type="button" 
                      onClick={() => { if (validateStep(1)) setFormStep(2) }}
                      className="btn-hero-primary"
                      style={{ padding: '10px 24px' }}
                    >
                      Next Step <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DETAILS & BUDGET */}
              {formStep === 2 && (
                <div className="fade-in">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Estimated Budget *</label>
                      <select value={budget} onChange={e => setBudget(e.target.value)}>
                        <option value="< $500">&lt; $500</option>
                        <option value="$500 - $1,500">$500 - $1,500</option>
                        <option value="$1,500 - $5,000">$1,500 - $5,000</option>
                        <option value="$5,000+">$5,000+</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Target Timeline *</label>
                      <select value={timeline} onChange={e => setTimeline(e.target.value)}>
                        <option value="Urgently (< 2 weeks)">Urgently (&lt; 2 weeks)</option>
                        <option value="Standard (2-4 weeks)">Standard (2-4 weeks)</option>
                        <option value="Flexible (1-2 months)">Flexible (1-2 months)</option>
                        <option value="Long Term Collaboration">Long Term Collaboration</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tell Me More About Your Project *</label>
                    <textarea 
                      value={message} 
                      onChange={e => setMessage(e.target.value)} 
                      placeholder="Please specify pages needed, target audience, style preferences, layout guidelines, or any competitors' sites you like..." 
                      rows={5}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">References & Attachments (Max 2.5MB each)</label>
                    <div 
                      className="upload-zone"
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
                        <UploadCloud size={32} />
                      </div>
                      <div className="upload-text-main">Drag & Drop reference files or click to browse</div>
                      <div className="upload-text-sub">Logos, guidelines, structure examples</div>
                    </div>

                    {files.length > 0 && (
                      <div className="files-preview-list">
                        {files.map((file, index) => (
                          <div key={index} className="file-preview-card">
                            {file.preview ? (
                              <img src={file.preview} alt="Preview" className="preview-image" />
                            ) : (
                              <div className="preview-file-icon">
                                <FileText size={22} />
                              </div>
                            )}
                            <div className="preview-file-name">{file.name}</div>
                            <button 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); removeFile(index); }} 
                              className="btn-remove-file"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                    <button 
                      type="button" 
                      onClick={() => setFormStep(1)}
                      className="btn-hero-secondary"
                      style={{ padding: '10px 20px' }}
                    >
                      Back
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { if (validateStep(2)) setFormStep(3) }}
                      className="btn-hero-primary"
                      style={{ padding: '10px 24px' }}
                    >
                      Next Step <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CONTACT DETAILS & SUBMIT */}
              {formStep === 3 && (
                <div className="fade-in">
                  <div className="form-group">
                    <label className="form-label">Your Full Name / Business *</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      placeholder="e.g. Sarah J. or Alpha Digital LLC" 
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Info (Email or Phone) *</label>
                    <input 
                      type="text" 
                      value={contact} 
                      onChange={e => setContact(e.target.value)} 
                      placeholder="e.g. sarah@alpha.com or +961 71 123 456" 
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                    <button 
                      type="button" 
                      onClick={() => setFormStep(2)}
                      className="btn-hero-secondary"
                      style={{ padding: '10px 20px' }}
                      disabled={isSubmitting}
                    >
                      Back
                    </button>
                    <button 
                      type="button" 
                      onClick={handleSubmit}
                      className="btn-hero-primary"
                      style={{ padding: '10px 24px' }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Request'} 
                      <Send size={16} style={{ marginLeft: 6 }} />
                    </button>
                  </div>
                </div>
              )}
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
            <div className="tracking-search-title">Track Your Project</div>
            <p className="tracking-search-desc">
              Enter your unique tracking code (DM-XXXXXX) to view status, message Yamen directly, and monitor database deployment.
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
          <h2 className="success-title">Project Received by Yamen!</h2>
          <p className="success-desc">
            Your tracking code has been generated. Use it to check status updates, chat with me, and follow development live.
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

          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center' }}>
            <button onClick={() => onTrackRequest(generatedCode)} className="btn-hero-primary">
              <Eye size={18} /> Enter Project Room
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
