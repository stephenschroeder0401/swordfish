ALTER TABLE property_group_gl
DROP CONSTRAINT property_group_gl_billing_account_id_fkey,
ADD CONSTRAINT property_group_gl_billing_account_id_fkey 
FOREIGN KEY (billing_account_id) 
REFERENCES billing_account(id) 
ON DELETE CASCADE;
