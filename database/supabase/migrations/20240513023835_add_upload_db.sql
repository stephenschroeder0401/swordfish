CREATE TABLE IF NOT EXISTS billback_upload (
    id guid PRIMARY KEY,
    billing_period_id INT REFERENCES billing_period(id),
    upload_data JSON
);



