CREATE TABLE IF NOT EXISTS billback_upload (
    id uuid PRIMARY KEY,
    billing_period_id UUID REFERENCES billing_period(id),
    upload_data JSON
);



