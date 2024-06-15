drop TABLE IF EXISTS billback_upload; 

CREATE TABLE IF NOT EXISTS billback_upload (
    id uuid NOT NULL DEFAULT gen_random_uuid() primary key,
    billing_period_id uuid REFERENCES billing_period(id),
    upload_data JSON
);

ALTER TABLE billback_upload ADD CONSTRAINT unique_billing_period_id UNIQUE (billing_period_id);



