-- Create the timestamp function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the table
CREATE TABLE property_unit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES property(id),
    bedrooms INTEGER,
    bathrooms INTEGER,
    rent DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the trigger for updates only
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON property_unit
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
