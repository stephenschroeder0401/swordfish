# Database Access Guide

## Overview

This document outlines the database access capabilities available in this project. We have two main scripts for interacting with the local Supabase database:

1. `query-db.js` - A simple script for running individual SQL queries
2. `db-helper.js` - A comprehensive tool with various database operations

## Available Commands

### Basic Query

```bash
node query-db.js "SELECT * FROM public.users LIMIT 5"
```

### Database Helper Commands

```bash
# List all tables in the public schema
node db-helper.js list-tables

# List tables in a specific schema
node db-helper.js list-tables auth

# Describe a table's structure
node db-helper.js describe-table billback_upload

# Count rows in a table
node db-helper.js count-rows billing_period

# Get sample data from a table (default: 5 rows)
node db-helper.js sample-data billback_upload

# Get specific number of sample rows
node db-helper.js sample-data billback_upload 10

# Execute a custom SQL query
node db-helper.js query "SELECT id, billing_period_id, client_id, created_at FROM billback_upload LIMIT 3;"

# Save query results to a file
node db-helper.js save-query "SELECT * FROM billing_period" billing_periods.txt
```

## Key Tables

Based on our exploration, here are some key tables in the database:

- `billback_upload` - Stores uploaded billback data with columns:
  - `id` (uuid)
  - `billing_period_id` (uuid)
  - `upload_data` (json)
  - `client_id` (uuid)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

- `billing_period` - Defines billing periods with columns:
  - `id` (uuid)
  - `startdate` (date)
  - `enddate` (date)
  - `client_id` (uuid)
  - `is_deleted` (boolean)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

## Example Queries

Here are some useful queries for debugging the billback upload functionality:

```sql
-- Get billback uploads for a specific billing period
SELECT * FROM billback_upload WHERE billing_period_id = '5255cd2f-113d-4ec2-9884-b864b4e3ce93';

-- Get billing periods for a specific client
SELECT * FROM billing_period WHERE client_id = 'b447b6fc-bb55-4920-aa40-14725e80c24c';

-- Check the structure of upload_data in billback_upload
SELECT id, jsonb_pretty(upload_data::jsonb) FROM billback_upload LIMIT 1;
```

## Notes

- All commands interact with the local Supabase database running in Docker
- The database is accessed through the `supabase_db_database` container
- These scripts provide a convenient way to debug application issues with production data 