DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'property_group' 
        AND column_name = 'allocation_type'
    ) THEN 
        ALTER TABLE property_group
        ADD COLUMN allocation_type TEXT NOT NULL DEFAULT 'custom';
    END IF;
END $$; 