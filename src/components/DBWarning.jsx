import React, { useState } from 'react'
import { AlertTriangle, Copy, Check, RefreshCw } from 'lucide-react'

export default function DBWarning({ error, onRetry }) {
  const [copied, setCopied] = useState(false)

  const sqlCode = `-- Create requests table
create table if not exists requests (
  id uuid default gen_random_uuid() primary key,
  tracking_code text not null unique,
  customer_name text not null,
  contact_info text not null,
  title text not null,
  status text not null default 'pending',
  thread jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table requests enable row level security;

-- Create policies
create policy "Allow public read" on requests for select using (true);
create policy "Allow public insert" on requests for insert with check (true);
create policy "Allow public update" on requests for update using (true);`

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="db-warning-card glass-card slide-up">
      <div className="db-warning-header">
        <AlertTriangle size={32} />
        <h2>Supabase Table Setup Required</h2>
      </div>

      <p className="hero-subtitle" style={{ fontSize: '1rem', textAlign: 'left', marginBottom: '1.5rem' }}>
        The application is connected to Supabase, but the <strong>requests</strong> table could not be found or accessed. 
        Please run the following SQL command in your <strong>Supabase SQL Editor</strong> to initialize the database:
      </p>

      <div style={{ position: 'relative' }}>
        <button 
          onClick={handleCopy} 
          className="btn-copy-code" 
          style={{ top: '1.5rem', right: '1.5rem', transform: 'none' }}
        >
          {copied ? <Check size={16} className="text-completed" /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy SQL'}
        </button>
        <pre>{sqlCode}</pre>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button onClick={onRetry} className="btn-retry" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Check Again
        </button>
      </div>
      
      {error && (
        <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Debug info: {error.message || String(error)}
        </div>
      )}
    </div>
  )
}
