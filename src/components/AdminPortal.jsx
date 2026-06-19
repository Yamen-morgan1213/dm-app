import React, { useState, useEffect } from 'react'
import { 
  Lock, 
  Search, 
  Filter, 
  LogOut, 
  ChevronRight, 
  MessageSquare, 
  RefreshCw,
  FolderOpen,
  ArrowLeft,
  Mail,
  User,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import RequestDetails from './RequestDetails'

export default function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [shake, setShake] = useState(false)
  const [loginError, setLoginError] = useState('')
  
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, pending, in_progress, completed, declined
  const [selectedCode, setSelectedCode] = useState(null)
  
  // Mobile responsiveness
  const [mobilePane, setMobilePane] = useState('list') // list, detail

  // Check auth on load
  useEffect(() => {
    const authSession = localStorage.getItem('dm_admin_session')
    if (authSession) {
      // Validate session is less than 24 hours old
      const timeElapsed = Date.now() - parseInt(authSession)
      if (timeElapsed < 24 * 60 * 60 * 1000) {
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('dm_admin_session')
      }
    }
  }, [])

  // Fetch all requests
  const fetchAllRequests = async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (err) {
      console.error('Error fetching requests:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllRequests()
  }, [isAuthenticated])

  // Poll database for new requests every 10 seconds
  useEffect(() => {
    if (!isAuthenticated) return
    const interval = setInterval(() => {
      fetchAllRequests()
    }, 10000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  // Handle Login
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

  // Handle Logout
  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('dm_admin_session')
    setSelectedCode(null)
    setMobilePane('list')
  }

  // Handle Status Update
  const handleStatusChange = async (requestId, newStatus) => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId)
        .select()
        .single()

      if (error) throw error
      
      // Update local state list
      setRequests(requests.map(r => r.id === requestId ? data : r))
    } catch (err) {
      console.error(err)
      alert('Failed to update status: ' + err.message)
    }
  }

  // Filter and Search Requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.tracking_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.title?.toLowerCase().includes(searchQuery.toLowerCase())
      
    const matchesFilter = statusFilter === 'all' || req.status === statusFilter
    
    return matchesSearch && matchesFilter
  })

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
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
          <p className="admin-login-desc">Please enter the security access pin to review client messages and update request statuses.</p>
          
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Access Password" 
                style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: '1.2rem' }}
                autoFocus
                required
              />
            </div>
            
            {loginError && <div className="login-error-msg">{loginError}</div>}
            
            <button type="submit" className="btn-admin-login">
              Authenticate
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ width: '100%' }}>
      {/* Admin Panel Header */}
      <div 
        className="glass-card" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '1rem 2rem', 
          marginBottom: '2rem',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} className="text-primary" style={{ color: 'var(--color-primary)' }} />
            Administrator Inbox
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Managing {requests.length} client requests • Auto-refresh active
          </p>
        </div>
        <button onClick={handleLogout} className="btn-nav" style={{ color: 'var(--status-declined)' }}>
          <LogOut size={16} /> Log Out
        </button>
      </div>

      <div className={`admin-dashboard ${mobilePane === 'detail' ? 'show-details' : 'show-list'}`}>
        
        {/* Sidebar list view */}
        <div className="admin-sidebar glass-card" style={{ padding: '1.5rem' }}>
          <div className="sidebar-header">
            <div className="sidebar-title">
              Requests 
              <button 
                onClick={fetchAllRequests} 
                style={{ background: 'none', color: 'var(--color-text-muted)' }}
                disabled={loading}
                title="Refresh requests"
              >
                <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
              </button>
            </div>
            
            <div className="search-wrapper">
              <input 
                type="text" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Search code, name..." 
                className="search-input"
              />
              <Search size={16} className="search-icon" />
            </div>

            {/* Filter chips */}
            <div className="filters-row">
              {['all', 'pending', 'in_progress', 'completed', 'declined'].map((filterVal) => (
                <button
                  key={filterVal}
                  onClick={() => setStatusFilter(filterVal)}
                  className={`filter-chip ${statusFilter === filterVal ? 'active' : ''}`}
                >
                  {filterVal.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="requests-list-container">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => {
                    setSelectedCode(req.tracking_code)
                    setMobilePane('detail')
                  }}
                  className={`request-list-item glass-card ${selectedCode === req.tracking_code ? 'selected' : ''}`}
                >
                  <div className="item-header">
                    <span className="item-code">{req.tracking_code}</span>
                    <span className={`status-badge ${req.status}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="item-client">{req.customer_name}</div>
                  <div className="item-title">{req.title}</div>
                  <div className="item-footer">
                    <span>{formatDate(req.created_at)}</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              ))
            ) : (
              <div className="no-requests-placeholder">
                <FolderOpen size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <div>No requests found</div>
              </div>
            )}
          </div>
        </div>

        {/* Details View */}
        <div className="admin-detail-view">
          {selectedCode ? (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              
              {/* Header inside detail view for changing status */}
              {selectedRequest && (
                <div className="admin-detail-header">
                  <div className="admin-detail-header-left">
                    {/* Back button for mobile view */}
                    <button 
                      onClick={() => setMobilePane('list')} 
                      className="btn-back"
                      style={{ marginRight: '8px', display: 'flex' }}
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Active Client</span>
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

              {/* Renders the full details and live chat */}
              <div style={{ flex: 1, minHeight: 0 }}>
                <RequestDetails 
                  trackingCode={selectedCode} 
                  isAdminView={true}
                  onBack={() => {
                    setSelectedCode(null)
                    setMobilePane('list')
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="admin-detail-placeholder glass-card">
              <MessageSquare size={48} className="placeholder-icon" />
              <h3>No Request Selected</h3>
              <p>Choose a request from the sidebar list to inspect project details, download files, and send direct messages.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
