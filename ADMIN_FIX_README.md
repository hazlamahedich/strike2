# Admin Login Fix

This package contains scripts to fix the admin login issue in the Strike app.

## Problem

The admin user is unable to log in due to a password mismatch between the `auth.users` and `public.users` tables in the Supabase database.

## Solution

This package provides a permanent solution by:

1. Resetting the admin password in the `auth.users` table
2. Fixing the database trigger that causes the password mismatch

## Quick Start

```bash
# Install dependencies
npm install

# Run the complete fix
npm run fix
```

## Available Scripts

- `npm run fix` - Run all fixes in sequence
- `npm run fix-password` - Fix only the admin password
- `npm run fix-trigger` - Fix only the database trigger

## Manual Steps

If you prefer to run the scripts manually:

```bash
# Fix the admin password
node fix-admin-password.js

# Fix the database trigger
node fix-trigger.js
```

## Files Included

- `fix-all.js` - Main script that runs all fixes in sequence
- `fix-admin-password.js` - Script to reset the admin password
- `fix-trigger.js` - Script to fix the database trigger
- `fix-sync-trigger.sql` - SQL script to update the trigger
- `ADMIN_LOGIN_FIX.md` - Detailed documentation about the fix

## Requirements

- Node.js 14 or higher
- Access to the Supabase database
- Admin email credentials

## Detailed Documentation

For more detailed information about the fix, please refer to the [ADMIN_LOGIN_FIX.md](./ADMIN_LOGIN_FIX.md) file. 