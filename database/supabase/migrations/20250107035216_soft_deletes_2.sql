-- Function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add soft deletes and timestamps to all tables
ALTER TABLE billing_account
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE property
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE property_group
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE entity
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE employee
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE billback_upload
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE billing_job
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE billing_period
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create triggers for updated_at
CREATE TRIGGER update_billing_account_updated_at
    BEFORE UPDATE ON billing_account
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_updated_at
    BEFORE UPDATE ON property
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_group_updated_at
    BEFORE UPDATE ON property_group
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entity_updated_at
    BEFORE UPDATE ON entity
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_updated_at
    BEFORE UPDATE ON employee
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billback_upload_updated_at
    BEFORE UPDATE ON billback_upload
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_job_updated_at
    BEFORE UPDATE ON billing_job
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_period_updated_at
    BEFORE UPDATE ON billing_period
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Set initial values
UPDATE billing_account SET is_deleted = FALSE WHERE is_deleted IS NULL;
UPDATE property SET is_deleted = FALSE WHERE is_deleted IS NULL;
UPDATE property_group SET is_deleted = FALSE WHERE is_deleted IS NULL;
UPDATE entity SET is_deleted = FALSE WHERE is_deleted IS NULL;
UPDATE employee SET is_deleted = FALSE WHERE is_deleted IS NULL;
UPDATE billing_period SET is_deleted = FALSE WHERE is_deleted IS NULL;
