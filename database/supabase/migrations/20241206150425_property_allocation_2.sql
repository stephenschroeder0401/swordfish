-- Create the property_group table
CREATE TABLE property_group (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL
);

-- Create the junction table for properties in groups
CREATE TABLE property_group_property (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES property(id),
    property_group_id UUID NOT NULL REFERENCES property_group(id),
    percentage DECIMAL NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    UNIQUE(property_id, property_group_id)
);

-- Create the property_allocation table
CREATE TABLE property_group_gl (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_group_id UUID NOT NULL REFERENCES property_group(id),
    billing_account_id UUID NOT NULL REFERENCES billing_account(id)
);

-- Add some helpful indexes
CREATE INDEX idx_property_group_property_group_id ON property_group_property(property_group_id);
CREATE INDEX idx_property_allocation_group_id ON property_group_gl(property_group_id);
CREATE INDEX idx_property_allocation_billing_account ON property_group_gl(billing_account_id);
