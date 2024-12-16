-- Check if billing_type column exists, if not, then add it
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'billing_account' 
        AND column_name = 'billing_type'
    ) THEN
        -- Add the billingType column with default value
        ALTER TABLE public.billing_account
        ADD COLUMN billing_type varchar(10) NOT NULL DEFAULT 'Hourly';

        -- Update all existing records to 'hourly'
        UPDATE public.billing_account
        SET billing_type = 'Hourly'
        WHERE billing_type IS NULL;

        -- Add a check constraint to ensure only valid types
        ALTER TABLE public.billing_account
        ADD CONSTRAINT valid_billing_type 
        CHECK (billing_type IN ('Hourly', 'Monthly'));
    END IF;
END $$;
