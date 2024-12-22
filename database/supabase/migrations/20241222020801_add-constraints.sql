-- First, ensure any existing null property_ids are handled
-- You might want to either:
-- 1. Delete rows with null property_id
DELETE FROM public.property_unit WHERE property_id IS NULL;
-- OR
-- 2. Set them to a default property
-- UPDATE public.property_unit SET property_id = 'default-uuid' WHERE property_id IS NULL;

-- Then modify the column to be NOT NULL
ALTER TABLE public.property_unit 
    ALTER COLUMN property_id SET NOT NULL;

-- Update the foreign key constraint to include NOT VALID to skip validation of existing data
-- (Remove the old constraint first)
ALTER TABLE public.property_unit 
    DROP CONSTRAINT IF EXISTS property_unit_property_id_fkey;

ALTER TABLE public.property_unit
    ADD CONSTRAINT property_unit_property_id_fkey 
    FOREIGN KEY (property_id)
    REFERENCES public.property(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
