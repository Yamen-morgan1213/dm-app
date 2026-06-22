import React, { useState, useEffect, useCallback } from 'react'
import { 
  Lock, Search, Filter, LogOut, ChevronRight, MessageSquare, RefreshCw,
  FolderOpen, ArrowLeft, Mail, User, CheckCircle2, Calendar, Sparkles,
  Bell, Trash2, TrendingUp, Clock, AlertCircle, Zap
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import RequestDetails from './RequestDetails'
import { useToast } from './Toast'

export default function AdminPortal() {
  const toast = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [shake, setShake] = useState(false)
  const [loginError, setLoginError] = useState('')
  
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCode, setSelectedCode] = useState(null)
  const [mobilePane, setMobilePane] = useState('list')
  const [lastFetchCount, setLastFetchCount] = useState(0)

  // Check auth on load
  useEffect(() => {
    const authSession = localStorage.getItem('dm_admin_session')
    if (authSession) {
      const timeElapsed = Date.now() - parseInt(authSession)
      if (timeElapsed < 24 * 60 * 60 * 1000) {
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('dm_admin_session')
      }
    }
  }, [])

  // Toast helper (wraps global toast)
  const addToast = useCallback((title, message, type = 'info') => {
    toast(`${title}: ${message}`, type === 'success' ? 'success' : 'info')
  }, [toast])

  // Fetch all requests
  const fetchAllRequests = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Detect new requests
      if (lastFetchCount > 0 && data && data.length > lastFetchCount) {
        const diff = data.length - lastFetchCount
        addToast('New Request!', `${diff} new project request${diff > 1 ? 's' : ''} received`, 'success')
        // Play notification sound
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.value = 800
          osc.type = 'sine'
          gain.gain.value = 0.1
          osc.start()
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
          osc.stop(ctx.currentTime + 0.3)
        } catch(e) {}
      }
      setLastFetchCount(data?.length || 0)
      setRequests(data || [])
    } catch (err) {
      console.error('Error fetching requests:', err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, lastFetchCount, addToast])

  useEffect(() => { fetchAllRequests() }, [isAuthenticated])

  // Real-time subscription
  useEffect(() => {
    if (!isAuthenticated) return
    
    const channel = supabase
      .channel('admin_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, (payload) => {
        setRequests(prev => [payload.new, ...prev])
        addToast('🔔 New Project Request', `${payload.new.customer_name} — ${payload.new.title}`, 'success')
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain); gain.connect(ctx.destination)
          osc.frequency.value = 880; osc.type = 'sine'; gain.gain.value = 0.12
          osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
          osc.stop(ctx.currentTime + 0.4)
        } catch(e) {}
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests' }, (payload) => {
        setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new : r))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'requests' }, (payload) => {
        setRequests(prev => prev.filter(r => r.id !== payload.old.id))
      })
      .subscribe()

    // Backup polling every 15s
    const interval = setInterval(fetchAllRequests, 15000)
    return () => { supabase.removeChannel(channel); clearInterval(interval) }
  }, [isAuthenticated, addToast])

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === '112434') {
      setIsAuthenticated(true)
      localStorage.setItem('dm_admin_session', String(Date.now()))
      setLoginError('')
      setPassword('')
    } else {
      setShake(true)
      setLoginError('Access Denied: Incorrect Password')
      setPassword('')
      setTimeout(() => setShake(false), 500)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('dm_admin_session')
    setSelectedCode(null)
    setMobilePane('list')
  }

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select()
        .single()
      if (error) throw error
      setRequests(requests.map(r => r.id === requestId ? data : r))
      addToast('Status Updated', `Request marked as ${newStatus.replace('_', ' ')}`)
    } catch (err) {
      console.error(err)
      toast('Failed to update status: ' + err.message, 'error')
    }
  }

  const handleDelete = async (requestId) => {
    if (!confirm('Are you sure you want to delete this request? This cannot be undone.')) return
    try {
      const { error } = await supabase.from('requests').delete().eq('id', requestId)
      if (error) throw error
      setRequests(requests.filter(r => r.id !== requestId))
      if (selectedCode) {
        const deleted = requests.find(r => r.id === requestId)
        if (deleted && deleted.tracking_code === selectedCode) {
          setSelectedCode(null)
          setMobilePane('list')
        }
      }
      addToast('Request Deleted', 'The request has been permanently removed.')
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error')
    }
  }

  // Stats
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  }

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.tracking_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.title?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = statusFilter === 'all' || req.status === statusFilter
    return matchesSearch && matchesFilter
  })

  const formatDate = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHrs = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHrs < 24) return `${diffHrs}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const selectedRequest = requests.find(r => r.tracking_code === selectedCode)

  if (!isAuthenticated) {
    return (
      <div className="fade-in">
        <div className={`admin-login-card glass-card ${shake ? 'shake' : ''}`}>
          <div className="admin-lock-icon">
            <Lock size={28} />
          </div>
          <h2 className="admin-login-title">Admin Dashboard</h2>
          <p className="admin-login-desc">Enter your security pin to access the admin panel and manage client requests.</p>
          
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••" 
                style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.4rem' }}
                autoFocus
                required
              />
            </div>
            {loginError && <div className="login-error-msg">{loginError}</div>}
            <button type="submit" className="btn-admin-login">
              <Zap size={16} style={{ marginRight: 6 }} /> Authenticate
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ width: '100%' }}>
      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className="toast">
              <div className="toast-icon">
                <Bell size={18} />
              </div>
              <div className="toast-content">
                <div className="toast-title">{t.title}</div>
                <div className="toast-message">{t.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="admin-stats-row">
        <div className="stat-card glass-card" onClick={() => setStatusFilter('all')}>
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--color-primary)' }}>
            <TrendingUp size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>
        <div className="stat-card glass-card" onClick={() => setStatusFilter('pending')}>
          <div className="stat-icon" style={{ background: 'var(--status-pending-bg)', color: 'var(--status-pending)' }}>
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card glass-card" onClick={() => setStatusFilter('in_progress')}>
          <div className="stat-icon" style={{ background: 'var(--status-progress-bg)', color: 'var(--status-progress)' }}>
            <Zap size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        <div className="stat-card glass-card" onClick={() => setStatusFilter('completed')}>
          <div className="stat-icon" style={{ background: 'var(--status-completed-bg)', color: 'var(--status-completed)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Admin Header */}
      <div className="admin-panel-header glass-card">
        <div style={{ textAlign: 'left' }}>
          <h2 className="admin-panel-title">
            <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
            Command Center
          </h2>
          <p className="admin-panel-subtitle">
            {requests.length} client requests • Real-time sync active
            <span className="live-dot"></span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={fetchAllRequests} className="btn-nav" disabled={loading} title="Refresh">
            <RefreshCw size={15} className={loading ? 'spin-anim' : ''} />
          </button>
          <button onClick={handleLogout} className="btn-nav" style={{ color: 'var(--status-declined)' }}>
            <LogOut size={15} /> Log Out
          </button>
        </div>
      </div>

      <div className={`admin-dashboard ${mobilePane === 'detail' ? 'show-details' : 'show-list'}`}>
        {/* Sidebar */}
        <div className="admin-sidebar glass-card" style={{ padding: '1.25rem' }}>
          <div className="sidebar-header">
            <div className="search-wrapper">
              <input 
                type="text" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Search requests..." 
                className="search-input"
              />
              <Search size={15} className="search-icon" />
            </div>

            <div className="filters-row">
              {['all', 'pending', 'in_progress', 'completed', 'declined'].map((filterVal) => (
                <button
                  key={filterVal}
                  onClick={() => setStatusFilter(filterVal)}
                  className={`filter-chip ${statusFilter === filterVal ? 'active' : ''}`}
                >
                  {filterVal === 'all' ? 'All' : filterVal.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="requests-list-container">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => { setSelectedCode(req.tracking_code); setMobilePane('detail') }}
                  className={`request-list-item glass-card ${selectedCode === req.tracking_code ? 'selected' : ''}`}
                >
                  <div className="item-header">
                    <span className="item-code">{req.tracking_code}</span>
                    <span className={`status-badge ${req.status}`} style={{ fontSize: '0.62rem', padding: '2px 8px' }}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="item-client">{req.customer_name}</div>
                  <div className="item-title">{req.title}</div>
                  <div className="item-footer">
                    <span>{formatDate(req.created_at)}</span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(req.id) }}
                        className="btn-delete-mini"
                        title="Delete request"
                      >
                        <Trash2 size={13} />
                      </button>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-requests-placeholder">
                <FolderOpen size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                <div>No requests found</div>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="admin-detail-view">
          {selectedCode ? (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              {selectedRequest && (
                <div className="admin-detail-header">
                  <div className="admin-detail-header-left">
                    <button onClick={() => setMobilePane('list')} className="btn-back" style={{ marginRight: '8px', display: 'flex' }}>
                      <ArrowLeft size={18} />
                    </button>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Client</span>
                      <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{selectedRequest.customer_name}</strong>
                    </div>
                  </div>
                  <div className="admin-detail-header-actions">
                    <div className="status-select-wrapper">
                      <span>Status:</span>
                      <select 
                        value={selectedRequest.status}
                        onChange={(e) => handleStatusChange(selectedRequest.id, e.target.value)}
                        className={selectedRequest.status}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="declined">Declined</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ flex: 1, minHeight: 0 }}>
                <RequestDetails 
                  trackingCode={selectedCode} 
                  isAdminView={true}
                  onBack={() => { setSelectedCode(null); setMobilePane('list') }}
                />
              </div>
            </div>
          ) : (
            <div className="admin-detail-placeholder glass-card">
              <MessageSquare size={48} className="placeholder-icon" />
              <h3>Select a Request</h3>
              <p>Choose a request from the sidebar to view project details, files, and chat with the client.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
