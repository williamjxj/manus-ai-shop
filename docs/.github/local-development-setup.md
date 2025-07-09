# Local Supabase Development Setup

This guide explains how to set up and use local Supabase for faster development and testing.

## 🎯 Benefits of Local Development

- **Faster iteration**: No network latency when testing database operations
- **Offline development**: Work without internet connection
- **Safe testing**: Experiment without affecting production data
- **Cost effective**: No API usage costs during development
- **Better debugging**: Direct access to logs and database

## 📋 Prerequisites

- Node.js 18+ installed
- Docker Desktop running
- Homebrew (for macOS) or equivalent package manager

## 🚀 Quick Start

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (using Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
curl -fsSL https://supabase.com/install.sh | sh
```

### 2. Start Local Supabase

```bash
# Start all services (PostgreSQL, Auth, API, Studio, etc.)
supabase start

# This will show you the local URLs and keys:
# API URL: http://127.0.0.1:54321
# Studio URL: http://127.0.0.1:54323
# DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### 3. Switch to Local Environment

The project is already configured to use local Supabase. The `.env.local` file contains:

```env
# === LOCAL SUPABASE (for development) ===
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### 4. Start Development Server

```bash
npm run dev
```

Your app will now connect to the local Supabase instance!

## 🔄 Switching Between Local and Cloud

### Switch to Local Development

1. Ensure local Supabase is running: `supabase start`
2. The `.env.local` file is already configured for local development
3. Start your app: `npm run dev`

### Switch to Cloud/Production

1. Edit `.env.local` and comment out local config, uncomment cloud config:

```env
# === LOCAL SUPABASE (for development) ===
# NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === CLOUD SUPABASE (for production) ===
NEXT_PUBLIC_SUPABASE_URL=https://your-domain.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. Restart your development server

### Quick Switch Scripts

You can also copy configurations from backup files:

```bash
# Switch to local
cp .env.local .env.local.backup && cp .env.local .env.local

# Switch to cloud
cp .env.cloud .env.local
```

## 🗄️ Database Management

### Reset Database

```bash
# Reset to clean state with migrations
supabase db reset
```

### Apply Schema Changes

```bash
# Apply SQL files directly
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f your-schema.sql
```

### Backup/Restore Data

```bash
# Backup local database
pg_dump postgresql://postgres:postgres@127.0.0.1:54322/postgres > local_backup.sql

# Restore from backup
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < local_backup.sql
```

## 🔧 Useful Commands

```bash
# Check Supabase status
supabase status

# Stop all services
supabase stop

# View logs
supabase logs

# Open Studio in browser
open http://127.0.0.1:54323
```

## 🧪 Testing Local Setup

Visit the test endpoint to verify everything is working:

```
http://localhost:3000/api/test-local-db
```

This endpoint tests:

- Database connectivity
- Schema integrity
- Sample data access

## 📊 Local Services Overview

| Service  | Local URL                                               | Purpose           |
| -------- | ------------------------------------------------------- | ----------------- |
| API      | http://127.0.0.1:54321                                  | REST/GraphQL API  |
| Studio   | http://127.0.0.1:54323                                  | Database admin UI |
| Inbucket | http://127.0.0.1:54324                                  | Email testing     |
| Database | postgresql://postgres:postgres@127.0.0.1:54322/postgres | PostgreSQL        |

## 🔐 Authentication in Local Development

- Local auth uses the same JWT structure as cloud
- Test users are pre-created for development
- Email confirmation is disabled by default
- Use Studio to manage users and sessions

## 🚨 Troubleshooting

### Port Conflicts

If you get port conflicts, stop other Supabase projects:

```bash
supabase stop --project-id other-project-name
```

### Database Connection Issues

1. Ensure Docker is running
2. Check if ports 54321-54324 are available
3. Restart Supabase: `supabase stop && supabase start`

### Schema Sync Issues

If local schema differs from cloud:

```bash
# Pull latest schema from cloud
supabase db pull

# Or reset and reapply migrations
supabase db reset
```

## 📝 Best Practices

1. **Always use local for development** - faster and safer
2. **Test on cloud before deployment** - ensure compatibility
3. **Keep migrations in version control** - track schema changes
4. **Use meaningful test data** - makes development easier
5. **Regular backups** - before major schema changes

## 🔗 Related Documentation

- [Supabase Local Development](https://supabase.com/docs/guides/local-development)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Database Migrations](https://supabase.com/docs/guides/database/migrations)
