-- Add soft delete to property_unit table
ALTER TABLE property_unit
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- Set initial values
UPDATE property_unit SET is_deleted = FALSE WHERE is_deleted IS NULL;
