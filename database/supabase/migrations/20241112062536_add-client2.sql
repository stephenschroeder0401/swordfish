-- Create clients table
CREATE TABLE IF NOT EXISTS client (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial clients
INSERT INTO client (name) VALUES 
    ('WSPM'),
    ('Situs');

-- Add client_id to existing tables
ALTER TABLE billback_upload ADD COLUMN client_id UUID REFERENCES client(id);
ALTER TABLE billing_account ADD COLUMN client_id UUID REFERENCES client(id);
ALTER TABLE billing_job ADD COLUMN client_id UUID REFERENCES client(id);
ALTER TABLE billing_period ADD COLUMN client_id UUID REFERENCES client(id);
ALTER TABLE employee ADD COLUMN client_id UUID REFERENCES client(id);
ALTER TABLE entity ADD COLUMN client_id UUID REFERENCES client(id);

-- Update existing records to use WSPM client_id
WITH wspm_client AS (
    SELECT id FROM client WHERE name = 'WSPM'
)
UPDATE billback_upload SET client_id = (SELECT id FROM wspm_client);

WITH wspm_client AS (
    SELECT id FROM client WHERE name = 'WSPM'
)
UPDATE billing_account SET client_id = (SELECT id FROM wspm_client);

WITH wspm_client AS (
    SELECT id FROM client WHERE name = 'WSPM'
)
UPDATE billing_job SET client_id = (SELECT id FROM wspm_client);

WITH wspm_client AS (
    SELECT id FROM client WHERE name = 'WSPM'
)
UPDATE billing_period SET client_id = (SELECT id FROM wspm_client);

WITH wspm_client AS (
    SELECT id FROM client WHERE name = 'WSPM'
)
UPDATE employee SET client_id = (SELECT id FROM wspm_client);

WITH wspm_client AS (
    SELECT id FROM client WHERE name = 'WSPM'
)
UPDATE entity SET client_id = (SELECT id FROM wspm_client);

-- Make client_id NOT NULL after populating data
ALTER TABLE billback_upload ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE billing_account ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE billing_job ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE billing_period ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE employee ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE entity ALTER COLUMN client_id SET NOT NULL;
