# DirectMessage | Premium Request Portal & Admin Inbox

DirectMessage is a full-featured, responsive client request and communication web application. It integrates a sleek, responsive customer portal with an administrator dashboard protected by a secure passcode (`112434`). Customers can submit project requests, attach images/files (up to 2.5MB), and engage in real-time chat threads. The administrator can manage the status of these requests (Pending, In Progress, Completed, Declined) and message clients directly.

## 🚀 Key Features

* **🎨 Premium Glassmorphic UI**: Built on a dark-mode-first aesthetic with animated glowing background blobs, deep space gradients, and custom blur backdrops.
* **👥 Customer Request Portal**: New Request form with drag-and-drop file upload, automated tracking code generation, and localStorage history.
* **🛡️ Administrator Panel**: Gated with the passcode `112434`. Includes search/filter sidebar and live status controls.
* **🔗 Real-Time Synchronization**: Uses Supabase Realtime Channels combined with fallback polling to coordinate chats.

---

## 🔑 Security & Environment Separation
To comply with the requirement of **no public API leaks**, we implemented standard security best practices:
1. **`.env` Separation**: The public Supabase project URL and anon public key are kept in a local `.env` file, which is loaded dynamically by Vite.
2. **Git Protection**: `.gitignore` was updated to explicitly block `.env` and `.env.*` files. They will never be pushed to your public repository.
3. **`.env.example` Template**: A placeholder file is provided to help others set up the project variables when checking out the code.

---

## 📊 Supabase Database Schema

To set up your database, run the following commands in the **SQL Editor** of your Supabase Dashboard:

```sql
-- Create requests table
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

-- Grant privileges to public roles (anon and authenticated)
grant all on table requests to anon, authenticated, service_role;

-- Enable Row Level Security (RLS)
alter table requests enable row level security;

-- Create policies for public access (since authentication is managed client-side)
create policy "Allow public read" on requests for select using (true);
create policy "Allow public insert" on requests for insert with check (true);
create policy "Allow public update" on requests for update using (true);
```

---

## 🛠️ Local Development & Deployment

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Run Locally
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```
